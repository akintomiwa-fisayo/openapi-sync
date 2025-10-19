import fs from "fs";
import path from "path";
import {
  capitalize,
  getEndpointDetails,
  isJson,
  JSONStringify,
  renderTypeRefMD,
  yamlStringToJson,
  mergeCustomCode,
} from "../helpers";
import {
  IConfig,
  IConfigReplaceWord,
  IOpenApiMediaTypeSpec,
  IOpenApiParameterSpec,
  IOpenApiRequestBodySpec,
  IOpenApiResponseSpec,
  IOpenApiSecuritySchemes,
  IOpenApiSpec,
  IOpenApSchemaSpec,
} from "../types";
import isEqual from "lodash.isequal";
import lodashget from "lodash.get";
import axios, { Method } from "axios";
import axiosRetry from "axios-retry";
import SwaggerParser from "@apidevtools/swagger-parser";
import { getState, setState } from "./state";
import { CurlGenerator } from "curl-generator";

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

/**
 * Write file with custom code preservation
 * Reads existing file, preserves custom code sections, and merges with new generated content
 */
const writeFileWithCustomCode = async (
  filePath: string,
  generatedContent: string,
  config: IConfig
): Promise<void> => {
  // Check if custom code preservation is enabled (default: true)
  const customCodeEnabled = config?.customCode?.enabled !== false;

  if (!customCodeEnabled) {
    // No custom code preservation - just write the file directly
    await fs.promises.writeFile(filePath, generatedContent);
    return;
  }

  // Read existing file if it exists
  let existingContent: string | null = null;
  try {
    existingContent = await fs.promises.readFile(filePath, "utf-8");
  } catch (error) {
    // File doesn't exist yet - that's okay, we'll create it
  }

  // Merge with custom code
  const finalContent = mergeCustomCode(generatedContent, existingContent, {
    position: config?.customCode?.position || "bottom",
    markerText: config?.customCode?.markerText,
    includeInstructions: config?.customCode?.includeInstructions,
  });

  // Write the merged content
  await fs.promises.writeFile(filePath, finalContent);
};

const OpenapiSync = async (
  apiUrl: string,
  apiName: string,
  config: IConfig,
  refetchInterval?: number
) => {
  const specResponse = await apiClient.get(apiUrl);

  const source = isJson(specResponse.data)
    ? specResponse.data
    : yamlStringToJson(specResponse.data);

  // Parse the OpenAPI spec using swagger-parser with lenient parsing
  let spec: IOpenApiSpec;
  try {
    // Use lenient parsing by default (similar to redocly behavior)
    spec = (await SwaggerParser.parse(source)) as IOpenApiSpec;
  } catch (parseError) {
    const parseErrorMessage =
      parseError instanceof Error ? parseError.message : String(parseError);
    throw new Error(
      `Failed to parse OpenAPI spec for ${apiName}: ${parseErrorMessage}`
    );
  }

  const folderPath = path.join(config?.folder || "", apiName);

  // Initialize folder splitting data structures
  const folderGroups: Record<
    string,
    {
      endpoints: string;
      types: string;
    }
  > = {};

  // Helper function to determine folder name for an endpoint
  const getFolderName = (endpointData: {
    method: Method;
    path: string;
    summary?: string;
    operationId?: string;
    tags?: string[];
    parameters?: IOpenApiParameterSpec[];
    requestBody?: IOpenApiRequestBodySpec;
    responses?: IOpenApiResponseSpec;
  }): string => {
    // Use custom folder function if provided
    if (config?.folderSplit?.customFolder) {
      const customFolder = config.folderSplit.customFolder(endpointData);
      console.log("customFolder", customFolder);
      if (customFolder) return customFolder;
    }

    // Use tag-based splitting if enabled
    if (
      config?.folderSplit?.byTags &&
      endpointData.tags &&
      endpointData.tags.length > 0
    ) {
      return endpointData.tags[0].toLowerCase().replace(/\s+/g, "-");
    }

    // Default folder
    return "default";
  };

  const serverUrl =
    typeof config?.server === "string"
      ? config?.server
      : spec?.servers?.[config?.server || 0]?.url || "";
  const typePrefix =
    typeof config?.types?.name?.prefix === "string"
      ? config?.types.name.prefix
      : "I";
  const endpointPrefix =
    typeof config?.endpoints?.name?.prefix === "string"
      ? config?.endpoints.name.prefix
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
    const defaultName = capitalize(componentName);
    if (config?.types?.name?.format) {
      const formattedName = config?.types.name.format(
        "shared",
        {
          name: componentName,
        },
        defaultName
      );
      if (formattedName) return `${typePrefix}${formattedName}`;
    }
    return `${typePrefix}${defaultName}`;
  };

  const parseSchemaToType = (
    apiDoc: IOpenApiSpec,
    schema: IOpenApSchemaSpec,
    name: string,
    isRequired?: boolean,
    options?: {
      noSharedImport?: boolean;
      useComponentName?: boolean;
    },
    indentLevel: number = 0
  ) => {
    let overrideName = "";
    let componentName = "";
    let type = "";
    if (schema) {
      if (schema.$ref) {
        if (schema.$ref[0] === "#") {
          let pathToComponentParts = (schema.$ref || "").split("/");
          pathToComponentParts.shift();
          const partsClone = [...pathToComponentParts];
          partsClone.pop();

          const pathToComponent = pathToComponentParts;
          const component = lodashget(
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
          .filter((v) => !!v)
          .join("|")})`;
      } else if (schema.oneOf) {
        type += `(${schema.oneOf
          .map((v) => parseSchemaToType(apiDoc, v, "", isRequired, options))
          .filter((v) => !!v)
          .join("|")})`;
      } else if (schema.allOf) {
        type += `(${schema.allOf
          .map((v) => parseSchemaToType(apiDoc, v, "", isRequired, options))
          .filter((v) => !!v)
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
          let doc: string = "";

          if (
            !config?.types?.doc?.disable &&
            schema.properties?.[key]?.description
          ) {
            doc =
              " *  " +
              schema.properties?.[key].description
                .split("\n")
                .filter((line: string) => line.trim() !== "")
                .join(`  \n *${"  ".repeat(1)}`);
          }

          typeCnt +=
            (doc ? `/**\n${doc}\n */\n` : "") +
            `${parseSchemaToType(
              apiDoc,
              schema.properties?.[key] as IOpenApSchemaSpec,
              key,
              requiredKeys.includes(key),
              options,
              indentLevel + 1
            )}`;
        });
        if (typeCnt.length > 0) {
          type += `{\n${"    ".repeat(indentLevel)}${typeCnt}${"    ".repeat(
            indentLevel
          )}}`;
        } else {
          type += "{[k: string]: any}";
        }
      } else if (schema.enum && schema.enum.length > 0) {
        if (schema.enum.length > 1) type += "(";
        schema.enum
          .map((v) => JSON.stringify(v))
          .filter((v) => !!v)
          .forEach((v, i) => {
            type += `${i === 0 ? "" : "|"}${v}`;
          });

        if (schema.enum.length > 1) type += ")";
      } else if (schema.type) {
        const handleType = (_type: typeof schema.type) => {
          let typeCnt = "";
          if (typeof _type === "string") {
            if (
              [
                "string",
                "integer",
                "number",
                "array",
                "boolean",
                "null",
              ].includes(_type)
            ) {
              if (["integer", "number"].includes(_type)) {
                typeCnt += `number`;
              } else if (_type === "array") {
                //Since we would have already parsed the arrays keys above "schema.items" if it exists
                typeCnt += "any[]";
                /* if (schema.items) {
              typeCnt += `${parseSchemaToType(
                apiDoc,
                schema.items,
                "",
                false,
                options
              )}[]`;
            } else {
              typeCnt += "any[]";
            } */
              } else {
                typeCnt += _type;
              }
            } else if (_type === "object") {
              //Since we would have already parsed the object keys above "schema.properties" if it exists
              if (schema.additionalProperties) {
                typeCnt += `{[k: string]: ${
                  parseSchemaToType(
                    apiDoc,
                    schema.additionalProperties,
                    "",
                    true,
                    options
                  ) || "any"
                }}`;
              } else {
                typeCnt += "{[k: string]: any}";
              }
            }
          } else if (Array.isArray(_type)) {
            const arrType = _type.map((v) => handleType(v));
            arrType.filter((v) => v !== "");
            if (arrType.length > 1) typeCnt += "(" + arrType.join("|") + ")";
          } else {
            typeCnt += "any";
          }

          return typeCnt;
        };
        type = handleType(schema.type);
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

  const getSchemaExamples = (
    apiDoc: IOpenApiSpec,
    schema: IOpenApSchemaSpec
  ) => {
    let overrideName = "";
    let componentName = "";
    let type = "";
    if (schema) {
      if (schema.$ref) {
        if (schema.$ref[0] === "#") {
          let pathToComponentParts = (schema.$ref || "").split("/");
          pathToComponentParts.shift();

          const pathToComponent = pathToComponentParts;
          const component = lodashget(
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

            type += getSchemaExamples(apiDoc, component);
          }
        } else {
          type += "";
          //TODO $ref is a uri - use axios to fetch doc
        }
      } else if (schema.anyOf) {
        type += getSchemaExamples(apiDoc, schema.anyOf[0]);
      } else if (schema.oneOf) {
        type += getSchemaExamples(apiDoc, schema.oneOf[0]);
      } else if (schema.allOf) {
        type += `{${schema.allOf
          .map((v) => `...(${getSchemaExamples(apiDoc, v)})`)
          .join(",")}}`;
      } else if (schema.items) {
        type += `[${getSchemaExamples(apiDoc, schema.items)}]`;
      } else if (schema.properties) {
        //parse object key one at a time
        const objKeys = Object.keys(schema.properties);
        const arr = objKeys.map((key) => {
          return `        "${key}": ${getSchemaExamples(
            apiDoc,
            schema.properties?.[key] as IOpenApSchemaSpec
          )}`;
        });
        let typeCnt = arr.join(",\n");
        if (typeCnt.length > 0) {
          type += `{\n${typeCnt}\n     }`;
        } else {
          type += "{}";
        }
      } else if (schema.enum && schema.enum.length > 0) {
        if (schema.enum.length > 1) type += schema.enum[0];
      } else if (schema.type) {
        if (schema.example) {
          type += JSON.stringify(schema.example);
        } else {
          const handleType = (_type: typeof schema.type) => {
            let typeCnt = "";
            if (typeof _type === "string") {
              if (
                [
                  "string",
                  "integer",
                  "number",
                  "array",
                  "boolean",
                  "null",
                ].includes(_type)
              ) {
                if (["integer", "number"].includes(_type)) {
                  typeCnt += `123`;
                } else if (_type === "array") {
                  //Since we would have already parsed the arrays keys above "schema.items" if it exists
                  typeCnt += "[]";
                } else if (_type === "boolean") {
                  typeCnt += `true`;
                } else if (_type === "null") {
                  typeCnt += `null`;
                } else {
                  typeCnt += `"${_type}"`;
                }
              } else if (_type === "object") {
                //Since we would have already parsed the object keys above "schema.properties" if it exists
                typeCnt += "{}";
              }
            } else if (Array.isArray(_type)) {
              const arrType = _type.map((v) => handleType(v));
              arrType.filter((v) => v !== "");
              if (arrType.length > 1) typeCnt += arrType.join("|");
            } else {
              typeCnt += "any";
            }

            return typeCnt;
          };
          type = handleType(schema.type);
        }
      } else {
        type += "any";
      }
    } else {
      //Default type to string if no schema provided
      type = "string";
    }

    return type;
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
          let doc: string = "";
          if (
            !config?.types?.doc?.disable &&
            key in components &&
            //@ts-expect-error
            components[key]?.description
          ) {
            doc =
              " *  " +
              //@ts-expect-error
              components[key].description
                .split("\n")
                .filter((line: string) => line.trim() !== "")
                .join(`  \n *${"  ".repeat(1)}`);
          }

          sharedTypesFileContent[key] =
            (sharedTypesFileContent[key] ?? "") +
            (doc ? `/**\n${doc}\n */\n` : "") +
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
      Array.isArray(config?.endpoints.value.replaceWords)
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

  // Helper function to check if an endpoint should be excluded
  const shouldExcludeEndpoint = (
    path: string,
    method: Method,
    tags: string[] = []
  ) => {
    const excludeConfig = config?.endpoints?.exclude;
    const includeConfig = config?.endpoints?.include;

    // If include is specified
    if (includeConfig) {
      // Check if endpoint matches include criteria
      const matchesIncludeTags =
        includeConfig.tags && includeConfig.tags.length > 0
          ? tags.some((tag) => includeConfig.tags!.includes(tag))
          : true;

      const matchesIncludeEndpoints =
        includeConfig.endpoints && includeConfig.endpoints.length > 0
          ? includeConfig.endpoints.some((endpoint) => {
              const methodMatches =
                !endpoint.method ||
                endpoint.method.toLowerCase() === method.toLowerCase();

              // Use exact path match if path is provided
              if (endpoint.path) {
                return path === endpoint.path && methodMatches;
              }
              // Use regex match if regex is provided
              else if (endpoint.regex) {
                const pathRegex = new RegExp(endpoint.regex);
                return pathRegex.test(path) && methodMatches;
              }

              return false;
            })
          : true;

      // If include is specified but endpoint doesn't match, exclude it
      if (!matchesIncludeTags || !matchesIncludeEndpoints) {
        return true;
      }
    }

    // Check exclude criteria, it takes precedence over include
    if (excludeConfig) {
      // Check tags exclusion
      if (excludeConfig.tags && excludeConfig.tags.length > 0) {
        const hasExcludedTag = tags.some((tag) =>
          excludeConfig.tags!.includes(tag)
        );
        if (hasExcludedTag) return true;
      }

      // Check endpoint exclusion
      if (excludeConfig.endpoints && excludeConfig.endpoints.length > 0) {
        const matchesExcludedEndpoint = excludeConfig.endpoints.some(
          (endpoint) => {
            const methodMatches =
              !endpoint.method ||
              endpoint.method.toLowerCase() === method.toLowerCase();

            // Use exact path match if path is provided
            if (endpoint.path) {
              return path === endpoint.path && methodMatches;
            }

            // Use regex match if regex is provided
            else if (endpoint.regex) {
              const pathRegex = new RegExp(endpoint.regex);
              return pathRegex.test(path) && methodMatches;
            }

            return false;
          }
        );
        if (matchesExcludedEndpoint) return true;
      }
    }

    return false;
  };

  Object.keys(spec.paths || {}).forEach((endpointPath) => {
    const endpointSpec = spec.paths[endpointPath];

    const endpointMethods = Object.keys(endpointSpec);
    endpointMethods.forEach((_method) => {
      const method = _method as Method;
      const endpoint = getEndpointDetails(endpointPath, method);

      // Get endpoint tags for filtering
      const endpointTags = endpointSpec[method]?.tags || [];

      // Check if this endpoint should be excluded
      if (shouldExcludeEndpoint(endpointPath, method, endpointTags)) {
        return; // Skip this endpoint
      }

      // Determine folder name for this endpoint
      const enSpec = endpointSpec[method];
      const folderName = getFolderName({
        method,
        path: endpointPath,
        summary: enSpec?.summary,
        operationId: enSpec?.operationId,
        tags: endpointTags,
        parameters: enSpec?.parameters,
        requestBody: enSpec?.requestBody,
        responses: enSpec?.responses,
      });

      // Initialize folder group if it doesn't exist
      if (!folderGroups[folderName]) {
        folderGroups[folderName] = {
          endpoints: "",
          types: "",
        };
      }

      const endpointUrlTxt =
        (config?.endpoints?.value?.includeServer ? serverUrl : "") +
        endpoint.pathParts
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

          // Use operationId if configured and available
          if (config?.types?.name?.useOperationId && eSpec?.operationId) {
            name = `${eSpec.operationId}Query`;
          }
          name = capitalize(`${typePrefix}${name}`);

          if (config?.types?.name?.format) {
            const formattedName = config?.types.name.format(
              "endpoint",
              {
                code: "",
                type: "query",
                method,
                path: endpointPath,
                summary: eSpec?.summary,
                operationId: eSpec?.operationId,
              },
              name
            );
            if (formattedName) name = `${typePrefix}${formattedName}`;
          }
          const typeContent = `export type ${name} = ${queryTypeCnt};\n`;
          if (config?.folderSplit) {
            folderGroups[folderName].types += typeContent;
          } else {
            typesFileContent += typeContent;
          }
        }
      }

      const requestBody: IOpenApiRequestBodySpec = eSpec?.requestBody;
      let dtoTypeCnt = "";
      if (requestBody) {
        //create requestBody types
        dtoTypeCnt = getBodySchemaType(requestBody);

        if (dtoTypeCnt) {
          let name = `${endpoint.name}DTO`;

          // Use operationId if configured and available
          if (config?.types?.name?.useOperationId && eSpec?.operationId) {
            name = `${eSpec.operationId}DTO`;
          }

          name = capitalize(`${typePrefix}${name}`);

          if (config?.types?.name?.format) {
            const formattedName = config?.types.name.format(
              "endpoint",
              {
                code: "",
                type: "dto",
                method,
                path: endpointPath,
                summary: eSpec?.summary,
                operationId: eSpec?.operationId,
              },
              name
            );
            if (formattedName) name = `${typePrefix}${formattedName}`;
          }
          const typeContent = `export type ${name} = ${dtoTypeCnt};\n`;
          if (config?.folderSplit) {
            folderGroups[folderName].types += typeContent;
          } else {
            typesFileContent += typeContent;
          }
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

            // Use operationId if configured and available
            if (config?.types?.name?.useOperationId && eSpec?.operationId) {
              name = `${eSpec.operationId}${code}Response`;
            }

            name = capitalize(`${typePrefix}${name}`);

            if (config?.types?.name?.format) {
              const formattedName = config?.types.name.format(
                "endpoint",
                {
                  code,
                  type: "response",
                  method,
                  path: endpointPath,
                  summary: eSpec?.summary,
                  operationId: eSpec?.operationId,
                },
                name
              );
              if (formattedName) name = `${typePrefix}${formattedName}`;
            }
            const typeContent = `export type ${name} = ${responseTypeCnt};\n`;
            if (config?.folderSplit) {
              folderGroups[folderName].types += typeContent;
            } else {
              typesFileContent += typeContent;
            }
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

      let doc = "";
      if (!config?.endpoints?.doc?.disable) {
        let curl = "";
        if (config?.endpoints?.doc?.showCurl) {
          // console.log("cirl data", {
          //   body: eSpec?.requestBody,
          //   bodyContent:
          //     eSpec?.requestBody?.content["application/json"]?.schema
          //       ?.properties,
          //   security: eSpec?.security,
          // });
          const headers: Record<string, string | string[]> = {};
          let body = "";
          let extras = "";

          if (eSpec.requestBody?.content) {
            const contentTypes = Object.keys(eSpec.requestBody.content);
            contentTypes.forEach((contentType) => {
              // console.log("requestBody content", {
              //   contentType,
              //   schema: eSpec.requestBody.content[contentType].schema,
              // });
              const schema = eSpec.requestBody.content[contentType].schema;
              if (schema) {
                if (Array.isArray(headers["Content-type"])) {
                  headers["Content-type"].push(contentType);
                } else {
                  headers["Content-type"] = [contentType];
                }
                const schemaType = getSchemaExamples(
                  spec,
                  schema as IOpenApSchemaSpec
                );
                if (schemaType) body = schemaType;
              }
            });
          }

          if (eSpec?.security) {
            eSpec.security.forEach((securityItem: Record<string, string[]>) => {
              Object.keys(securityItem).forEach((security) => {
                const securitySchema: IOpenApiSecuritySchemes[string] =
                  spec.components?.securitySchemes?.[security];

                if (securitySchema) {
                  // headers["Authorization"] = securitySchema;
                  if (securitySchema.type === "mutualTLS") {
                    extras += `\n--cert client-certificate.crt \
--key client-private-key.key \
--cacert ca-certificate.crt`;
                  } else if (securitySchema.type === "apiKey") {
                    headers[
                      securitySchema?.name || "X-API-KEY"
                    ] = `{API_KEY_VALUE}`;
                  } else {
                    headers["Authorization"] = `${
                      securitySchema?.scheme === "basic" ? "Basic" : "Bearer"
                    } {${
                      securitySchema?.scheme === "basic" ? "VALUE" : "TOKEN"
                    }}`;
                  }
                }
              });
            });
          }

          const curlHeaders: Record<string, string> = {};
          Object.keys(headers).forEach((header) => {
            if (Array.isArray(headers[header])) {
              curlHeaders[header] = headers[header].join("; ");
            } else {
              curlHeaders[header] = headers[header];
            }
          });

          // console.log("curlHeaders", { headers, curlHeaders, body });

          curl = `\n\`\`\`bash  
${CurlGenerator({
  url: serverUrl + endpointPath,
  method: method.toUpperCase() as any,
  headers: curlHeaders,
  body,
})}${extras}
\`\`\``;
        }

        doc = `/**${eSpec?.description ? `\n* ${eSpec?.description}  ` : ""}
 * **Method**: \`${method.toUpperCase()}\`  
 * **Summary**: ${eSpec?.summary || ""}  
 * **Tags**: [${eSpec?.tags?.join(", ") || ""}]  
 * **OperationId**: ${eSpec?.operationId || ""}  ${
          queryTypeCnt
            ? `\n * **Query**: ${renderTypeRefMD(queryTypeCnt)}  `
            : ""
        }${dtoTypeCnt ? `\n * **DTO**: ${renderTypeRefMD(dtoTypeCnt)}  ` : ""}${
          responseTypeCnt
            ? `\n * **Response**: ${Object.entries(responseTypeObject)
                .map(
                  ([code, type]) =>
                    `\n    - **${code}**:  ${renderTypeRefMD(type, 2)}  `
                )
                .join("")}`
            : ""
        }${securitySpec ? `\n * **Security**:  ${securitySpec}\n` : ""}${curl}
 */\n`;
      }

      let name =
        config?.endpoints?.name?.useOperationId &&
        eSpec?.operationId?.length > 0
          ? eSpec.operationId
          : `${endpoint.name}`;

      if (config?.endpoints?.name?.format) {
        const formattedName = config?.endpoints.name.format(
          {
            method,
            path: endpointPath,
            summary: eSpec?.summary,
            operationId: eSpec?.operationId,
          },
          name
        );
        if (formattedName) name = formattedName;
      }

      const content = {
        method: `"${method}"`,
        operationId: `"${eSpec?.operationId}"`,
        url: endpointUrl,
        tags: eSpec?.tags || [],
      };
      // Add the endpoint url to the specific folder group
      const endpointContent = `${doc}export const ${endpointPrefix}${name} = ${
        config?.endpoints?.value?.type === "object"
          ? JSONStringify(content)
          : endpointUrl
      }; 
`;

      // Add to folder group if folder splitting is enabled, otherwise add to global content
      if (config?.folderSplit) {
        folderGroups[folderName].endpoints += endpointContent;
      } else {
        endpointsFileContent += endpointContent;
      }
    });
  });

  // Write files based on folder splitting configuration
  if (config?.folderSplit) {
    // Write files for each folder group
    for (const [folderName, group] of Object.entries(folderGroups)) {
      if (group.endpoints || group.types) {
        const folderPathForGroup = path.join(folderPath, folderName);

        // Write endpoints file
        if (group.endpoints) {
          const endpointsFilePath = path.join(
            rootUsingCwd,
            folderPathForGroup,
            "endpoints.ts"
          );
          await fs.promises.mkdir(path.dirname(endpointsFilePath), {
            recursive: true,
          });
          await writeFileWithCustomCode(
            endpointsFilePath,
            group.endpoints,
            config
          );
        }

        // Write types file
        if (group.types) {
          const typesFilePath = path.join(
            rootUsingCwd,
            folderPathForGroup,
            "types.ts"
          );
          await fs.promises.mkdir(path.dirname(typesFilePath), {
            recursive: true,
          });

          const typesContent =
            Object.values(sharedTypesFileContent).length > 0
              ? `import * as Shared from "../shared";\n\n${group.types}`
              : group.types;

          await writeFileWithCustomCode(typesFilePath, typesContent, config);
        }
      }
    }
  }

  if (endpointsFileContent.length > 0) {
    // Original behavior - write to single files
    const endpointsFilePath = path.join(
      rootUsingCwd,
      folderPath,
      "endpoints.ts"
    );
    await fs.promises.mkdir(path.dirname(endpointsFilePath), {
      recursive: true,
    });
    await writeFileWithCustomCode(
      endpointsFilePath,
      endpointsFileContent,
      config
    );
  }
  if (Object.values(sharedTypesFileContent).length > 0) {
    const sharedTypesFilePath = path.join(
      rootUsingCwd,
      folderPath,
      !config?.folderSplit ? "types" : "",
      "shared.ts"
    );
    await fs.promises.mkdir(path.dirname(sharedTypesFilePath), {
      recursive: true,
    });
    await writeFileWithCustomCode(
      sharedTypesFilePath,
      Object.values(sharedTypesFileContent).join("\n"),
      config
    );
  }

  if (typesFileContent.length > 0) {
    const typesFilePath = path.join(
      rootUsingCwd,
      folderPath,
      "types",
      "index.ts"
    );
    await fs.promises.mkdir(path.dirname(typesFilePath), { recursive: true });
    await writeFileWithCustomCode(
      typesFilePath,
      `${
        Object.values(sharedTypesFileContent).length > 0
          ? `import * as  Shared from "./shared";\n\n`
          : ""
      }${typesFileContent}`,
      config
    );
  }
};
export default OpenapiSync;
