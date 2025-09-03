import fs from "fs";
import path from "path";
import lodash from "lodash";
import {
  capitalize,
  getEndpointDetails,
  isJson,
  JSONStringify,
  renderTypeRefMD,
  yamlStringToJson,
} from "./components/helpers";
import {
  IConfig,
  IConfigReplaceWord,
  IOpenApiMediaTypeSpec,
  IOpenApiParameterSpec,
  IOpenApiRequestBodySpec,
  IOpenApiResponseSpec,
  IOpenApiSpec,
  IOpenApSchemaSpec,
} from "../types";
import { isEqual } from "lodash";
import axios, { Method } from "axios";
import axiosRetry from "axios-retry";
import { bundleFromString, createConfig } from "@redocly/openapi-core";
import { getState, setState } from "./state";

const rootUsingCwd = process.cwd();
let fetchTimeout: Record<string, null | NodeJS.Timeout> = {};

// Create an Axios instance
const apiClient = axios.create({
  timeout: 60000, // Timeout after 1min
});

// Configure axios-retry
axiosRetry(apiClient, {
  retries: 20, // Number of retry attempts
  retryCondition: (error) => {
    // Retry on network error
    return (
      error.code === "ECONNABORTED" || error.message.includes("Network Error")
    );
  },
  retryDelay: (retryCount) => {
    return retryCount * 1000; // Exponential back-off: 1s, 2s, 3s, etc.
  },
});

const OpenapiSync = async (
  apiUrl: string,
  apiName: string,
  config: IConfig,
  refetchInterval?: number
) => {
  const specResponse = await apiClient.get(apiUrl);

  const redoclyConfig = await createConfig({
    extends: ["minimal"],
  });

  const source = JSON.stringify(
    isJson(specResponse.data)
      ? specResponse.data
      : yamlStringToJson(specResponse.data)
  );

  const lintResults = await bundleFromString({
    source,
    config: redoclyConfig,
  });

  const folderPath = path.join(config.folder || "", apiName);

  const spec: IOpenApiSpec = lintResults.bundle.parsed;

  const typePrefix =
    typeof config?.types?.name?.prefix === "string"
      ? config.types.name.prefix
      : "I";
  const endpointPrefix =
    typeof config?.endpoints?.name?.prefix === "string"
      ? config.endpoints.name.prefix
      : "";

  const getSharedComponentName = (
    componentName: string,
    componentType?:
      | "parameters"
      | "responses"
      | "schemas"
      | "requestBodies"
      | "headers"
      | "links"
      | "callbacks"
  ) => {
    if (config?.types?.name?.format) {
      const formattedName = config.types.name.format("shared", {
        name: componentName,
      });
      if (formattedName) return `${typePrefix}${formattedName}`;
    }
    return `${typePrefix}${capitalize(componentName)}`;
  };

  const parseSchemaToType = (
    apiDoc: IOpenApiSpec,
    schema: IOpenApSchemaSpec,
    name: string,
    isRequired?: boolean,
    options?: {
      noSharedImport?: boolean;
      useComponentName?: boolean;
    }
  ) => {
    let overrideName = "";
    let componentName = "";
    let type = "";
    if (schema) {
      if (schema.description) {
        // type += `/**\n ${schema.description}\n */\n`;
      }
      if (schema.$ref) {
        if (schema.$ref[0] === "#") {
          let pathToComponentParts = (schema.$ref || "").split("/");
          pathToComponentParts.shift();
          const partsClone = [...pathToComponentParts];
          partsClone.pop();

          const pathToComponent = pathToComponentParts;
          const component = lodash.get(
            apiDoc,
            pathToComponent,
            null
          ) as IOpenApSchemaSpec;

          if (component) {
            if ((component as any)?.name) {
              overrideName = (component as any).name;
            }
            componentName =
              pathToComponentParts[pathToComponentParts.length - 1];

            let name = getSharedComponentName(componentName);
            if (name.includes(".")) {
              const nameParts = name.split(".");
              name = nameParts
                .map((part, i) => {
                  if (i === 0) {
                    return part;
                  }
                  return `["${part}"]`;
                })
                .join("");
            }

            // Reference component via import instead of parsing
            type += `${options?.noSharedImport ? "" : "Shared."}${name}`;
            // type += `${parseSchemaToType(apiDoc, component, "", isRequired)}`;
          }
        } else {
          type += "";
          //TODO $ref is a uri - use axios to fetch doc
        }
      } else if (schema.anyOf) {
        type += `(${schema.anyOf
          .map((v) => parseSchemaToType(apiDoc, v, "", isRequired, options))
          .join("|")})`;
      } else if (schema.oneOf) {
        type += `(${schema.oneOf
          .map((v) => parseSchemaToType(apiDoc, v, "", isRequired, options))
          .join("|")})`;
      } else if (schema.allOf) {
        type += `(${schema.allOf
          .map((v) => parseSchemaToType(apiDoc, v, "", isRequired, options))
          .join("&")})`;
      } else if (schema.items) {
        type += `${parseSchemaToType(
          apiDoc,
          schema.items,
          "",
          false,
          options
        )}[]`;
      } else if (schema.properties) {
        //parse object key one at a time
        const objKeys = Object.keys(schema.properties);
        const requiredKeys = schema.required || [];
        let typeCnt = "";
        objKeys.forEach((key) => {
          typeCnt += `${parseSchemaToType(
            apiDoc,
            schema.properties?.[key] as IOpenApSchemaSpec,
            key,
            requiredKeys.includes(key),
            options
          )}`;
        });
        if (typeCnt.length > 0) {
          type += `{\n${typeCnt}}`;
        } else {
          type += "{[k: string]: any}";
        }
      } else if (schema.enum && schema.enum.length > 0) {
        if (schema.enum.length > 1) type += "(";
        schema.enum.forEach((v) => {
          let val = JSON.stringify(v);

          if (val) type += `|${val}`;
        });

        if (schema.enum.length > 1) type += ")";
      } else if (schema.type) {
        if (
          ["string", "integer", "number", "array", "boolean"].includes(
            schema.type
          )
        ) {
          if (["integer", "number"].includes(schema.type)) {
            type += `number`;
          } else if (schema.type === "array") {
            //Since we would have already parsed the arrays keys above "schema.items" if it exists
            type += "any[]";
            /* if (schema.items) {
              type += `${parseSchemaToType(
                apiDoc,
                schema.items,
                "",
                false,
                options
              )}[]`;
            } else {
              type += "any[]";
            } */
          } else {
            type += schema.type;
          }
        } else if (schema.type === "object") {
          //Since we would have already parsed the object keys above "schema.properties" if it exists
          if (schema.additionalProperties) {
            type += `{[k: string]: ${
              parseSchemaToType(
                apiDoc,
                schema.additionalProperties,
                "",
                true,
                options
              ) || "any"
            }}`;
          } else {
            type += "{[k: string]: any}";
          }
        }
      }
    } else {
      //Default type to string if no schema provided
      type = "string";
    }

    let _name = overrideName || name;
    if (options?.useComponentName && !_name) {
      _name = componentName;
    }

    let typeName = _name ? `\t"${_name}"${isRequired ? "" : "?"}: ` : "";

    const nullable = schema?.nullable ? " | null" : "";
    return type.length > 0
      ? `${typeName}${type}${nullable}${_name ? ";\n" : ""}`
      : "";
  };

  // auto update only on dev
  if (refetchInterval && !isNaN(refetchInterval) && refetchInterval > 0) {
    if (
      !(
        process.env.NODE_ENV &&
        ["production", "prod", "test", "staging"].includes(process.env.NODE_ENV)
      )
    ) {
      // auto sync at interval
      if (fetchTimeout[apiName]) clearTimeout(fetchTimeout[apiName]);

      // set next request timeout
      fetchTimeout[apiName] = setTimeout(
        () => OpenapiSync(apiUrl, apiName, config, refetchInterval),
        refetchInterval
      );
    }
  }

  // compare new spec with old spec, continuing only if spec it different
  const prevSpec = getState(apiName);
  if (isEqual(prevSpec, spec)) return;

  setState(apiName, spec);

  let endpointsFileContent = "";
  let typesFileContent = "";
  let sharedTypesFileContent: Record<string, string> = {};

  if (spec.components) {
    Object.keys(spec.components).forEach((key) => {
      if (
        [
          "schemas",
          "responses",
          "parameters",
          "examples",
          "requestBodies",
          "headers",
          "links",
          "callbacks",
        ].includes(key)
      ) {
        // Create components (shared) types
        const components: Record<string, IOpenApiMediaTypeSpec> =
          spec.components[key];

        const componentInterfaces: Record<string, string> = {};
        const componentSchema: Record<string, string> = {};

        const contentKeys = Object.keys(components);

        // only need 1 schema so will us the first schema provided
        contentKeys.forEach((contentKey) => {
          /*  const schema = (() => {
            switch (key) {
              case "parameters":
                return components[contentKey].schema;
              default:
                return components[contentKey];
            }
          })() as IOpenApSchemaSpec; */
          const schema = (
            components[contentKey]?.schema
              ? components[contentKey].schema
              : components[contentKey]
          ) as IOpenApSchemaSpec;

          const typeCnt = `${parseSchemaToType(spec, schema, "", true, {
            noSharedImport: true,
            useComponentName: ["parameters"].includes(key),
          })}`;

          if (typeCnt) {
            const parts = contentKey.split(".");
            let currentLevel: any = componentInterfaces;
            let currentSchemaLevel: any = componentSchema;

            // Navigate or create the nested structure
            for (let i = 0; i < parts.length; i++) {
              const part = parts[i];
              if (i < parts.length - 1) {
                // If it's not the last part, create a nested object if it doesn't exist
                if (!(part in currentLevel)) {
                  currentLevel[part] = {}; //<== This rely on js ability to assign value to origianl object by reference, so this assignment will be reflected in componentInterfaces
                  currentSchemaLevel[part] = {}; //<== This rely on js ability to assign value to origianl object by reference, so this assignment will be reflected in componentSchema
                }
                currentLevel = currentLevel[part]; //<== This rely on js ability to assign value to origianl object by reference, so this assignment will be reflected in componentInterfaces
                currentSchemaLevel = currentSchemaLevel[part]; //<== This rely on js ability to assign value to origianl object by reference, so this assignment will be reflected in componentSchema
              } else {
                // This is the last part, assign the original schema value
                currentLevel[part] = typeCnt; //<== This rely on js ability to assign value to origianl object by reference, so this assignment will be reflected in componentInterfaces
                currentSchemaLevel[part] = schema; //<== This rely on js ability to assign value to origianl object by reference, so this assignment will be reflected in componentSchema
              }
            }
          }
        });

        // Generate TypeScript interfaces for each component
        Object.keys(componentInterfaces).forEach((key) => {
          const name = getSharedComponentName(key);
          const cnt = componentInterfaces[key];

          //@ts-expect-error
          if (key in components && components[key]?.description) {
            //@ts-expect-error
            doc = components[key].description;
          }

          sharedTypesFileContent[key] =
            (sharedTypesFileContent[key] ?? "") +
            "export type " +
            name +
            " = " +
            (typeof cnt === "string" ? cnt : JSONStringify(cnt)) +
            ";\n";
        });
      }
    });
  }

  const getBodySchemaType = (requestBody: IOpenApiRequestBodySpec) => {
    let typeCnt = "";
    if (requestBody.content) {
      const contentKeys = Object.keys(requestBody.content);
      // only need 1 schema so will us the first schema provided
      if (contentKeys[0] && requestBody.content[contentKeys[0]].schema) {
        typeCnt += `${parseSchemaToType(
          spec,
          requestBody.content[contentKeys[0]].schema as IOpenApSchemaSpec,
          ""
        )}`;
      }
    }
    return typeCnt;
  };

  const treatEndpointUrl = (endpointUrl: string) => {
    if (
      config?.endpoints?.value?.replaceWords &&
      Array.isArray(config.endpoints.value.replaceWords)
    ) {
      let newEndpointUrl = endpointUrl;
      config?.endpoints?.value?.replaceWords?.forEach(
        (replaceWord: IConfigReplaceWord, indx) => {
          const regexp = new RegExp(replaceWord.replace, "g");
          newEndpointUrl = newEndpointUrl.replace(
            regexp,
            replaceWord.with || ""
          );
        }
      );
      return newEndpointUrl;
    } else {
      return endpointUrl;
    }
  };

  Object.keys(spec.paths || {}).forEach((endpointPath) => {
    const endpointSpec = spec.paths[endpointPath];

    const endpointMethods = Object.keys(endpointSpec);
    endpointMethods.forEach((_method) => {
      const method = _method as Method;
      const endpoint = getEndpointDetails(endpointPath, method);

      const endpointUrlTxt = endpoint.pathParts
        .map((part) => {
          // check if part is a variable
          if (part[0] === "{" && part[part.length - 1] === "}") {
            const s = part.replace(/{/, "").replace(/}/, "");
            part = `\${${s}}`;
          }

          //api/<userId>
          else if (part[0] === "<" && part[part.length - 1] === ">") {
            const s = part.replace(/</, "").replace(/>/, "");
            part = `\${${s}}`;
          }

          //api/:userId
          else if (part[0] === ":") {
            const s = part.replace(/:/, "");
            part = `\${${s}}`;
          }
          return part;
        })
        .join("/");

      let endpointUrl = `"${endpointUrlTxt}"`;
      if (endpoint.variables.length > 0) {
        const params = endpoint.variables.map((v) => `${v}:string`).join(",");
        endpointUrl = `(${params})=> \`${endpointUrlTxt}\``;
      }

      //treat endpoint url
      endpointUrl = treatEndpointUrl(endpointUrl);

      const eSpec = endpointSpec[method];
      let name = `${endpoint.name}`;
      if (config?.endpoints?.name?.format) {
        const formattedName = config.endpoints.name.format({
          method,
          path: endpointPath,
          summary: eSpec?.summary,
        });
        if (formattedName) name = formattedName;
      }

      let queryTypeCnt = "";

      if (eSpec?.parameters) {
        // create query parameters types
        const parameters: IOpenApiParameterSpec[] = eSpec?.parameters;
        parameters.forEach((param, i) => {
          if (param.$ref || (param.in === "query" && param.name)) {
            queryTypeCnt += `${parseSchemaToType(
              spec,
              param.$ref ? (param as any) : (param.schema as any),
              param.name || "",
              param.required
            )}`;
          }
        });

        if (queryTypeCnt) {
          queryTypeCnt = `{\n${queryTypeCnt}}`;
          let name = `${endpoint.name}Query`;
          if (config?.types?.name?.format) {
            const formattedName = config.types.name.format("endpoint", {
              code: "",
              type: "query",
              method,
              path: endpointPath,
              summary: eSpec?.summary,
            });
            if (formattedName) name = formattedName;
          }
          typesFileContent += `export type ${typePrefix}${name} = ${queryTypeCnt};\n`;
        }
      }

      const requestBody: IOpenApiRequestBodySpec = eSpec?.requestBody;
      let dtoTypeCnt = "";
      if (requestBody) {
        //create requestBody types
        dtoTypeCnt = getBodySchemaType(requestBody);

        if (dtoTypeCnt) {
          let name = `${endpoint.name}DTO`;
          if (config?.types?.name?.format) {
            const formattedName = config.types.name.format("endpoint", {
              code: "",
              type: "dto",
              method,
              path: endpointPath,
              summary: eSpec?.summary,
            });
            if (formattedName) name = formattedName;
          }
          typesFileContent += `export type ${typePrefix}${name} = ${dtoTypeCnt};\n`;
        }
      }

      const responseTypeObject: Record<string, string> = {};

      let responseTypeCnt = "";
      if (eSpec?.responses) {
        // create request response types
        const responses: IOpenApiResponseSpec = eSpec?.responses;
        const resCodes = Object.keys(responses);
        resCodes.forEach((code) => {
          responseTypeCnt = getBodySchemaType(responses[code]);
          responseTypeObject[code] = responseTypeCnt;
          if (responseTypeCnt) {
            let name = `${endpoint.name}${code}Response`;

            if (config?.types?.name?.format) {
              const formattedName = config.types.name.format("endpoint", {
                code,
                type: "response",
                method,
                path: endpointPath,
                summary: eSpec?.summary,
              });
              if (formattedName) name = formattedName;
            }
            typesFileContent += `export type ${typePrefix}${name} = ${responseTypeCnt};\n`;
          }
        });
      }

      // Function to format security requirements
      const formatSecuritySpec = (
        security: Array<Record<string, string[]>>
      ) => {
        if (!security || !security.length) return "";

        return security
          .map((securityRequirement) => {
            const requirements = Object.entries(securityRequirement)
              .map(([scheme, scopes]) => {
                let sch = scheme;
                let scopeText = "";
                if (Array.isArray(scopes) && scopes.length) {
                  scopeText = `\n      - Scopes: [\`${scopes.join("`, `")}\`]`;
                  sch = `**${sch}**`;
                }

                return `\n    - ${sch}${scopeText}`;
              })
              .join("");
            return requirements;
          })
          .join("\n");
      };

      // Get formatted security specification
      const securitySpec = eSpec?.security
        ? formatSecuritySpec(eSpec.security)
        : "";

      // Add the endpoint url
      endpointsFileContent += `
/**${eSpec?.description ? `\n* ${eSpec?.description}  ` : ""}
* **Method**: \`${method.toUpperCase()}\`  
* **Summary**: ${eSpec?.summary || ""}  
* **Tags**: [${eSpec?.tags?.join(", ") || ""}]  
* **OperationId**: ${eSpec?.operationId || ""}  ${
        queryTypeCnt ? `\n* **Query**: ${renderTypeRefMD(queryTypeCnt)}  ` : ""
      }${dtoTypeCnt ? `\n* **DTO**: ${renderTypeRefMD(dtoTypeCnt)}  ` : ""}${
        responseTypeCnt
          ? `\n* **Response**: ${Object.entries(responseTypeObject)
              .map(
                ([code, type]) =>
                  `\n    - **${code}**:  ${renderTypeRefMD(type, 2)}  `
              )
              .join("")}`
          : ""
      }${securitySpec ? `\n* **Security**:  ${securitySpec}\n` : ""}
*/
export const ${endpointPrefix}${name} = ${endpointUrl}; 
`;
    });
  });

  // Create the necessary directories
  const endpointsFilePath = path.join(rootUsingCwd, folderPath, "endpoints.ts");
  await fs.promises.mkdir(path.dirname(endpointsFilePath), { recursive: true });
  // Create the file asynchronously
  await fs.promises.writeFile(endpointsFilePath, endpointsFileContent);

  if (Object.values(sharedTypesFileContent).length > 0) {
    // Create the necessary directories
    const sharedTypesFilePath = path.join(
      rootUsingCwd,
      folderPath,
      "types",
      "shared.ts"
    );
    await fs.promises.mkdir(path.dirname(sharedTypesFilePath), {
      recursive: true,
    });
    // Create the file asynchronously
    await fs.promises.writeFile(
      sharedTypesFilePath,
      Object.values(sharedTypesFileContent).join("\n")
    );
  }

  if (typesFileContent.length > 0) {
    // Create the necessary directories
    const typesFilePath = path.join(
      rootUsingCwd,
      folderPath,
      "types",
      "index.ts"
    );
    await fs.promises.mkdir(path.dirname(typesFilePath), { recursive: true });
    // Create the file asynchronously
    await fs.promises.writeFile(
      typesFilePath,
      `${
        Object.values(sharedTypesFileContent).length > 0
          ? `import * as  Shared from "./shared";\n\n`
          : ""
      }${typesFileContent}`
    );
  }
};
export default OpenapiSync;
