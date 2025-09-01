export default {
  refetchInterval: 5000,
  folder: "/inputed/path/",
  api: {
    example1:
      "https://raw.githubusercontent.com/OAI/OpenAPI-Specification/main/examples/v3.0/petstore.json",
    example2:
      "https://raw.githubusercontent.com/OAI/OpenAPI-Specification/main/examples/v3.0/petstore.yaml",
    example3: "https://api.dev.korensi.com/api/schema",
  },
  naming: {
    replaceWords: [
      {
        replace: "Api",
        with: "",
        type: "endpoint",
      },
    ],
  },
  endpoints: {
    value: {
      replaceWords: [
        {
          replace: "/api/v\\d/",
          with: "",
        },
      ],
    },
    format: (value) => {
      if (value === "/") return "root";
      return value.replace(/\//g, "_").replace(/{|}/g, "");
    },
  },
};
