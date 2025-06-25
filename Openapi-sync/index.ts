import fs from "fs";
import path from "path";
import {
  getEndpointDetails,
  getSharedComponentName,
  isJson,
  isYamlString,
  parseSchemaToType,
  yamlStringToJson,
} from "./components/helpers";
import {
  IConfigReplaceWord,
  IOpenApiMediaTypeSpec,
  IOpenApiParameterSpec,
  IOpenApiRequestBodySpec,
  IOpenApiResponseSpec,
  IOpenApiSpec,
  IOpenApSchemaSpec,
} from "./types";
import { isEqual } from "lodash";
import axios from "axios";
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

  // Load config file
  const config = require(path.join(rootUsingCwd, "openapi.sync.json"));
  const folderPath = path.join(config.folder || "", apiName);

  const spec: IOpenApiSpec = lintResults.bundle.parsed;
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
        () => OpenapiSync(apiUrl, apiName, refetchInterval),
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
            sharedTypesFileContent[key] =
              (sharedTypesFileContent[key] ?? "") +
              `export type ${getSharedComponentName(
                contentKey
              )} = ${typeCnt};\n`;
          }
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
      config.endpoints.value.replaceWords.forEach(
        (replaceWord: IConfigReplaceWord, indx: string) => {
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
    endpointMethods.forEach((method: string) => {
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

      // Add the endpoint url
      endpointsFileContent += `export const ${endpoint.name} = ${endpointUrl}; 
`;

      if (endpointSpec[method]?.parameters) {
        // create query parameters types
        const parameters: IOpenApiParameterSpec[] =
          endpointSpec[method]?.parameters;
        let typeCnt = "";
        parameters.forEach((param, i) => {
          if (param.$ref || (param.in === "query" && param.name)) {
            typeCnt += `${parseSchemaToType(
              spec,
              param.$ref ? (param as any) : (param.schema as any),
              param.name || "",
              param.required
            )}`;
          }
        });

        if (typeCnt) {
          typesFileContent += `export type I${endpoint.name}Query = {\n${typeCnt}};\n`;
        }
      }

      if (endpointSpec[method]?.requestBody) {
        //create requestBody types
        const requestBody: IOpenApiRequestBodySpec =
          endpointSpec[method]?.requestBody;

        let typeCnt = getBodySchemaType(requestBody);
        if (typeCnt) {
          typesFileContent += `export type I${endpoint.name}DTO = ${typeCnt};\n`;
        }
      }

      if (endpointSpec[method]?.responses) {
        // create request response types
        const responses: IOpenApiResponseSpec = endpointSpec[method]?.responses;
        const resCodes = Object.keys(responses);
        resCodes.forEach((code) => {
          let typeCnt = getBodySchemaType(responses[code]);
          if (typeCnt) {
            typesFileContent += `export type I${endpoint.name}${code}Response = ${typeCnt};\n`;
          }
        });
      }
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
