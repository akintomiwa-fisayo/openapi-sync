import { IConfig } from "./types";

const config: IConfig = {
  refetchInterval: 5000,
  folder: "/inputed/path/",
  api: {
    example1: "https://openapi.free.beeceptor.com/openapi.json",
  },
  server: 0,
  // Configuration for splitting generated code into folders
  folderSplit: {
    // Split folders by tags - creates folders named after each tag
    byTags: true,
    // Custom function to determine folder name for each endpoint
    customFolder: (data) => {
      // Example: Group by path prefix
      if (data.path.startsWith("/auth/")) return "auth";
      if (data.path.startsWith("/users/")) return "users";
      if (data.path.startsWith("/admin/")) return "admin";
      if (data.path.startsWith("/public/")) return "public";

      // Example: Group by HTTP method
      const method = data.method.toLowerCase();
      if (method === "get") return "read";
      if (method === "post") return "create";
      if (method === "put" || method === "patch") return "update";
      if (method === "delete") return "delete";

      // Example: Group by tags if available
      if (data.tags && data.tags.length > 0) {
        return data.tags[0].toLowerCase().replace(/\s+/g, "-");
      }

      // Default fallback
      return "misc";
    },
  },
  // Configuration for excluding endpoints from code generation
  types: {
    name: {
      prefix: "",
      useOperationId: true, // Use operationId for type naming when available
      format: (source, data, defaultName) => {
        if (source === "shared") {
          return `${data.name}`;
        } else if (source === "endpoint") {
          // Use operationId if available, otherwise fall back to path-based naming
          if (data.operationId) {
            return `${data.operationId}${data.code}${data.type}`;
          }
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
      format: ({ method, path, summary, operationId }, defaultName) => {
        if (path === "/") return "root";
        return path.replace(/\//g, "_").replace(/{|}/g, "");
      },
    },
    doc: {
      disable: false,
      showCurl: true,
    },
    exclude: {
      // Exclude endpoints by tags
      tags: ["deprecated", "internal"],
      // Exclude individual endpoints by path and method
      endpoints: [
        // Exact path match
        { path: "/admin/users", method: "DELETE" },
        // Regex pattern match
        { regex: "^/internal/.*", method: "GET" },
        { regex: ".*/debug$", method: "GET" },
        // Don't specify method to exclude all methods
        { path: "/debug/logs" },
      ],
    },
    include: {
      // Include endpoints by tags
      tags: ["public"],
      // Include individual endpoints by path and method
      endpoints: [
        // Exact path match
        { path: "/public/users", method: "GET" },
        // Regex pattern match
        { regex: "^/public/.*", method: "GET" },
        { regex: ".*/logs$", method: "GET" },
        // Don't specify method to include all methods
        { path: "/public/logs" },
      ],
    },
  },
};

module.exports = config;
