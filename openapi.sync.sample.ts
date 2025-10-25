import { IConfig } from "./types";

const config: IConfig = {
  refetchInterval: 5000,
  folder: "/inputed/path/",
  api: {
    example1: "https://openapi.free.beeceptor.com/openapi.json",
    // You can add multiple APIs
    // example2: "https://api.example.com/openapi.json",
    // localApi: "./specs/openapi.yaml",
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
  validations: {
    disable: false, // Enable validation generation (default: false)
    library: "zod", // Validation library: "zod" | "yup" | "joi"

    // Optionally specify which types to generate validations for (defaults: query=true, dto=true)
    generate: {
      query: true, // Generate query parameter validations (default: true)
      dto: true, // Generate request body validations (default: true)
      // Note: Response validations are not supported
    },

    name: {
      prefix: "I", // Prefix for validation schema names (default: "I")
      suffix: "Schema", // Suffix for validation schema names (default: "Schema")
      useOperationId: true, // Use operationId from OpenAPI spec
      format: (data, defaultName) => {
        // Custom naming function (optional)

        // return `${data.name}`;
        return defaultName;
      },
    },
  },
  // Configuration for API client generation (NEW in v4.1.0)
  clientGeneration: {
    enabled: true, // Enable client generation (default: false)
    type: "react-query", // Client type: "fetch" | "axios" | "react-query" | "swr" | "rtk-query"
    outputDir: "./src/api/example1/client", // Output directory for generated clients
    baseURL: "https://api.example.com", // Base URL for API requests (can be overridden at runtime)

    // Filter endpoints by tags (optional)
    tags: ["users", "pets"], // Only generate clients for these tags

    // Filter endpoints by names (optional)
    endpoints: ["getPetById", "createPet", "updateUser"], // Only generate these endpoints

    // Naming configuration for client functions
    name: {
      prefix: "", // Prefix for client function names
      suffix: "", // Suffix for client function names
      useOperationId: true, // Use operationId from OpenAPI spec
      format: (data, defaultName) => {
        // Custom naming function (optional)
        return defaultName;
      },
    },

    // React Query specific configuration
    reactQuery: {
      version: 5, // React Query version (4 | 5)
      mutations: true, // Enable mutation hooks for POST/PUT/PATCH/DELETE (default: true)
      infiniteQueries: false, // Enable infinite query hooks for paginated endpoints (default: false)
    },

    // SWR specific configuration
    swr: {
      mutations: true, // Enable SWR mutation hooks (default: true)
    },

    // RTK Query specific configuration
    rtkQuery: {
      apiName: "api", // API slice name (default: "api")
      baseQuery: "fetchBaseQuery", // Base query type: "fetchBaseQuery" | "axiosBaseQuery"
    },

    // Authentication configuration (optional)
    auth: {
      type: "bearer", // Auth type: "bearer" | "apiKey" | "basic" | "oauth2"
      in: "header", // Where to include auth: "header" | "query" | "cookie"
      name: "Authorization", // Header/query param name
    },

    // Error handling configuration (optional)
    errorHandling: {
      generateErrorClasses: true, // Generate typed error classes (default: false)
      customHandler: "handleApiError", // Custom error handler function name
    },
  },
  // Custom code preservation configuration
  customCode: {
    enabled: true, // Enable custom code preservation (default: false)
    position: "bottom", // Where to inject custom code: "top" | "bottom" | "both"
    // Custom code will be preserved between regenerations
    // Use special markers in generated files:
    // 🔒 CUSTOM CODE START and 🔒 CUSTOM CODE END
  },
  // Configuration for type generation
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

export default config;

// Alternative: Export as CommonJS
// module.exports = config;

/*
 * Quick Start Guide:
 *
 * 1. Interactive Setup (Recommended):
 *    npx openapi-sync init
 *
 * 2. Manual Setup:
 *    - Create this config file (openapi.sync.ts, .js, or .json)
 *    - Run: npx openapi-sync
 *
 * 3. Generate API Clients:
 *    npx openapi-sync generate-client --type react-query
 *    npx openapi-sync generate-client --type axios --api example1
 *    npx openapi-sync generate-client --type fetch --tags users,pets
 *
 * 4. Available Client Types:
 *    - fetch: Native browser Fetch API
 *    - axios: Axios HTTP client
 *    - react-query: TanStack Query (React Query) hooks
 *    - swr: SWR hooks by Vercel
 *    - rtk-query: Redux Toolkit Query
 *
 * 5. Validation Libraries:
 *    - zod: TypeScript-first schema validation
 *    - yup: JavaScript schema validation
 *    - joi: Object schema validation
 *
 * 6. Documentation:
 *    Visit https://openapi-sync.com for complete documentation
 *
 * 7. CLI Help:
 *    npx openapi-sync --help
 *    npx openapi-sync generate-client --help
 */
