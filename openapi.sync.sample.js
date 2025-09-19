module.exports = {
  refetchInterval: 5000,
  folder: "/inputed/path/",
  api: {
    example1:
      "https://raw.githubusercontent.com/OAI/OpenAPI-Specification/main/examples/v3.0/petstore.json",
    example2:
      "https://raw.githubusercontent.com/OAI/OpenAPI-Specification/main/examples/v3.0/petstore.yaml",
  },
  server: 0,
  server:
    "https://raw.githubusercontent.com/OAI/OpenAPI-Specification/main/examples/v3.0",
  types: {
    name: {
      prefix: "",
      format: (source, data, defaultName) => {
        if (source === "shared") {
          return `${data.name}`;
        } else if (source === "endpoint") {
          return `${data.method.toLowerCase()}${data.path
            .replace(/\//g, "_")
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
      format: ({ method, path, summary, operationId }, defaultName) => {
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
