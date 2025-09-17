// TypeScript config file for openapi-sync
// To use this file, install a TypeScript loader:
// npm install --save-dev esbuild-register  (recommended - fastest & lightest)
// or: npm install --save-dev tsx
// or: npm install --save-dev @swc/register

import { IConfig } from "./types";

const config: IConfig = {
  refetchInterval: 5000,
  folder: "/inputed/path/",
  api: {
    example1:
      "https://raw.githubusercontent.com/OAI/OpenAPI-Specification/main/examples/v3.0/petstore.json",
    example2:
      "https://raw.githubusercontent.com/OAI/OpenAPI-Specification/main/examples/v3.0/petstore.yaml",
  },
  server: 0,
  types: {
    name: {
      prefix: "",
      format: (source, data) => {
        if (source === "shared") {
          return `${data.name}`;
        } else if (source === "endpoint") {
          return `${data.method!.toLowerCase()}${data
            .path!.replace(/\//g, "_")
            .replace(/{|}/g, "")}${data.code}${data.type}`;
        }
      },
    },
    doc: {
      disable: true,
    },
  },
  endpoints: {
    value: {
      replaceWords: [
        {
          replace: "/api/v\\d/",
          with: "",
        },
      ],
      includeServer: true,
      type: "object",
    },
    name: {
      prefix: "",
      useOperationId: true,
      format: ({ method, path, summary, operationId }) => {
        if (path === "/") return "root";
        return path.replace(/\//g, "_").replace(/{|}/g, "");
      },
    },
    doc: {
      disable: false,
      showCurl: true,
    },
  },
};

module.exports = config;
