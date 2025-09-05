module.exports = {
  refetchInterval: 5000,
  folder: "/inputed/path/",
  api: {
    example1:
      "https://raw.githubusercontent.com/OAI/OpenAPI-Specification/main/examples/v3.0/petstore.json",
    example2:
      "https://raw.githubusercontent.com/OAI/OpenAPI-Specification/main/examples/v3.0/petstore.yaml",
    example3: "https://api.dev.korensi.com/api/schema",
  },
  server: 0,
  types: {
    name: {
      prefix: "",
      format: (source, data) => {
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
    },
    name: {
      format: (value) => {
        if (value === "/") return "root";
        return value.replace(/\//g, "_").replace(/{|}/g, "");
      },
    },
    doc: {
      includeServer: true,
      disable: false,
      showCurl: true,
    },
  },
};
