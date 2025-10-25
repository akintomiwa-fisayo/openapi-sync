import { Method } from "axios";
import { IConfigClientGeneration } from "./types";

export interface EndpointInfo {
  name: string;
  method: Method;
  path: string;
  summary?: string;
  operationId?: string;
  tags?: string[];
  parameters?: {
    name: string;
    in: "path" | "query" | "header";
    required?: boolean;
    type: string;
  }[];
  requestBody?: {
    type: string;
    required?: boolean;
  };
  responses?: {
    [statusCode: string]: {
      type: string;
    };
  };
  queryType?: string;
  dtoType?: string;
  responseType?: string;
}

/**
 * Generate inline param type definition based on actual parameters
 *
 * Creates a TypeScript type definition string for endpoint parameters,
 * including path, query, and header parameters with proper typing.
 *
 * @param {EndpointInfo["parameters"]} parameters - Array of parameter definitions
 * @returns {string} TypeScript type definition string (e.g., "{ id: string; name?: string }")
 * @internal
 */
const generateInlineParamType = (
  parameters: EndpointInfo["parameters"]
): string => {
  if (!parameters || parameters.length === 0) {
    return "Record<string, any>";
  }

  const pathParams = parameters.filter((p) => p.in === "path");
  const queryParams = parameters.filter((p) => p.in === "query");
  const allParams = [...pathParams, ...queryParams];

  if (allParams.length === 0) {
    return "Record<string, any>";
  }

  const typeMap: Record<string, string> = {
    string: "string",
    number: "number",
    integer: "number",
    boolean: "boolean",
    array: "any[]",
    object: "any",
  };

  const paramTypes = allParams.map((param) => {
    const tsType = typeMap[param.type || "string"] || "any";
    const optional = param.required ? "" : "?";
    return `${param.name}${optional}: ${tsType}`;
  });

  return `{ ${paramTypes.join("; ")} }`;
};

/**
 * Filter endpoints based on tags and endpoint names
 *
 * Applies filtering logic to reduce the set of endpoints based on configuration.
 * Supports filtering by OpenAPI tags and specific endpoint operation IDs.
 *
 * @param {EndpointInfo[]} endpoints - Complete array of endpoints to filter
 * @param {IConfigClientGeneration} config - Client generation configuration with filter criteria
 * @returns {EndpointInfo[]} Filtered array of endpoints matching the criteria
 *
 * @example
 * const filtered = filterEndpoints(allEndpoints, { tags: ["users", "pets"] });
 *
 * @public
 */
export const filterEndpoints = (
  endpoints: EndpointInfo[],
  config: IConfigClientGeneration
): EndpointInfo[] => {
  let filtered = endpoints;

  // Filter by tags if specified
  if (config.tags && config.tags.length > 0) {
    filtered = filtered.filter((endpoint) => {
      if (!endpoint.tags || endpoint.tags.length === 0) return false;
      return endpoint.tags.some((tag) => config.tags!.includes(tag));
    });
  }

  // Filter by endpoint names if specified
  if (config.endpoints && config.endpoints.length > 0) {
    filtered = filtered.filter((endpoint) =>
      config.endpoints!.includes(endpoint.name)
    );
  }

  return filtered;
};

/**
 * Generate URL path with parameter substitution
 *
 * Converts OpenAPI path parameters (e.g., /users/{id}) to JavaScript template
 * literals with variable substitution (e.g., `/users/${url.id}`).
 *
 * @param {string} path - OpenAPI path with curly brace parameters
 * @param {boolean} hasParams - Whether the endpoint has any parameters
 * @returns {string} JavaScript template literal string for the path
 *
 * @example
 * generateUrlPath("/users/{id}/posts/{postId}", true)
 * // Returns: "`/users/${url.id}/posts/${url.postId}`"
 *
 * @public
 */
export const generateUrlPath = (path: string, hasParams: boolean): string => {
  if (!hasParams) {
    return `\`${path}\``;
  }

  // Convert OpenAPI path parameters to template literals
  const convertedPath = path.replace(/\{([^}]+)\}/g, "${params.$1}");
  return `\`${convertedPath}\``;
};

/**
 * Generate Fetch API client code
 *
 * Creates a type-safe Fetch API client with functions for each endpoint.
 * Includes support for authentication, error handling, and request/response typing.
 *
 * @param {EndpointInfo[]} endpoints - Array of endpoint information to generate client methods for
 * @param {IConfigClientGeneration} config - Client generation configuration (baseURL, auth, etc.)
 * @param {boolean} [exportAsDefault=false] - If true, also exports all functions as a default object
 * @returns {string} Complete TypeScript code for the Fetch API client
 *
 * @example
 * const clientCode = generateFetchClient(endpoints, {
 *   baseURL: "https://api.example.com",
 *   auth: { type: "bearer" }
 * }, false);
 *
 * @public
 */
export const generateFetchClient = (
  endpoints: EndpointInfo[],
  config: IConfigClientGeneration,
  exportAsDefault: boolean = false
): string => {
  const baseURL = config.baseURL || "";
  const authConfig = config.auth;

  let content = `// Generated Fetch API Client\n`;
  content += `// This file was auto-generated. Add custom code in the marked sections.\n\n`;

  // Generate types import
  content += `import type {\n`;
  const uniqueTypes = new Set<string>();
  endpoints.forEach((endpoint) => {
    if (endpoint.queryType) uniqueTypes.add(endpoint.queryType);
    if (endpoint.dtoType) uniqueTypes.add(endpoint.dtoType);
    if (endpoint.responseType) uniqueTypes.add(endpoint.responseType);
  });
  uniqueTypes.forEach((type) => {
    content += `  ${type},\n`;
  });
  content += `} from '../types';\n\n`;

  // Generate endpoints import with aliases to avoid naming conflicts
  content += `import {\n`;
  endpoints.forEach((endpoint) => {
    content += `  ${endpoint.name} as ${endpoint.name}_endpoint,\n`;
  });
  content += `} from '../endpoints';\n\n`;

  // Generate config interface
  content += `export interface ApiConfig {\n`;
  content += `  baseURL?: string;\n`;
  if (authConfig) {
    content += `  auth?: {\n`;
    content += `    token?: string;\n`;
    content += `  };\n`;
  }
  content += `  headers?: Record<string, string>;\n`;
  content += `}\n\n`;

  // Generate global config
  content += `let globalConfig: ApiConfig = {\n`;
  content += `  baseURL: "${baseURL}",\n`;
  content += `};\n\n`;

  content += `export const setApiConfig = (config: Partial<ApiConfig>) => {\n`;
  content += `  globalConfig = { ...globalConfig, ...config };\n`;
  content += `};\n\n`;

  // Generate error class if enabled
  if (config.errorHandling?.generateErrorClasses) {
    content += `export class ApiError extends Error {\n`;
    content += `  constructor(\n`;
    content += `    message: string,\n`;
    content += `    public statusCode: number,\n`;
    content += `    public response?: any\n`;
    content += `  ) {\n`;
    content += `    super(message);\n`;
    content += `    this.name = 'ApiError';\n`;
    content += `  }\n`;
    content += `}\n\n`;
  }

  // Generate helper function
  content += `async function fetchAPI<T>(\n`;
  content += `  url: string,\n`;
  content += `  options: RequestInit = {}\n`;
  content += `): Promise<T> {\n`;
  content += `  const headers: Record<string, string> = {\n`;
  content += `    'Content-Type': 'application/json',\n`;
  content += `    ...globalConfig.headers,\n`;
  content += `    ...(options.headers as Record<string, string>),\n`;
  content += `  };\n\n`;

  if (authConfig?.type === "bearer") {
    content += `  if (globalConfig.auth?.token) {\n`;
    content += `    headers['Authorization'] = \`Bearer \${globalConfig.auth.token}\`;\n`;
    content += `  }\n\n`;
  } else if (authConfig?.type === "apiKey" && authConfig.in === "header") {
    content += `  if (globalConfig.auth?.token) {\n`;
    content += `    headers['${
      authConfig.name || "X-API-Key"
    }'] = globalConfig.auth.token;\n`;
    content += `  }\n\n`;
  }

  content += `  const response = await fetch(\`\${globalConfig.baseURL}\${url}\`, {\n`;
  content += `    ...options,\n`;
  content += `    headers,\n`;
  content += `  });\n\n`;

  content += `  if (!response.ok) {\n`;
  if (config.errorHandling?.generateErrorClasses) {
    content += `    const errorData = await response.json().catch(() => ({}));\n`;
    content += `    throw new ApiError(\n`;
    content += `      errorData.message || response.statusText,\n`;
    content += `      response.status,\n`;
    content += `      errorData\n`;
    content += `    );\n`;
  } else {
    content += `    throw new Error(\`HTTP error! status: \${response.status}\`);\n`;
  }
  content += `  }\n\n`;

  content += `  return response.json();\n`;
  content += `}\n\n`;

  // Generate endpoint functions
  endpoints.forEach((endpoint) => {
    const funcName = endpoint.name;
    const pathParams =
      endpoint.parameters?.filter((p) => p.in === "path") || [];
    const queryParams =
      endpoint.parameters?.filter((p) => p.in === "query") || [];
    const hasPathParams = pathParams.length > 0;
    const hasQueryParams = queryParams.length > 0;
    const hasBody = !!endpoint.requestBody;
    const responseType = endpoint.responseType || "any";

    // Generate function signature
    content += `/**\n`;
    if (endpoint.summary) {
      content += ` * ${endpoint.summary}\n`;
    }
    content += ` * @method ${endpoint.method.toUpperCase()}\n`;
    content += ` * @path ${endpoint.path}\n`;
    if (endpoint.tags && endpoint.tags.length > 0) {
      content += ` * @tags ${endpoint.tags.join(", ")}\n`;
    }
    content += ` */\n`;

    content += `export async function ${funcName}(`;

    // Build structured params type
    if (hasPathParams || hasQueryParams || hasBody) {
      content += `params: {\n`;

      if (hasPathParams) {
        content += `  url: {\n`;
        pathParams.forEach((param) => {
          const typeMap: Record<string, string> = {
            string: "string",
            number: "number",
            integer: "number",
            boolean: "boolean",
            array: "any[]",
            object: "any",
          };
          const tsType = typeMap[param.type || "string"] || "any";
          const optional = param.required ? "" : "?";
          content += `    ${param.name}${optional}: ${tsType};\n`;
        });
        content += `  };\n`;
      }

      if (hasQueryParams) {
        content += `  query: ${endpoint.queryType || "Record<string, any>"};\n`;
      }

      if (hasBody) {
        content += `  data: ${endpoint.dtoType || "any"};\n`;
      }

      content += `}\n`;
    }

    content += `): Promise<${responseType}> {\n`;

    // Destructure params if needed
    if (hasPathParams || hasQueryParams || hasBody) {
      const destructuredParts: string[] = [];
      if (hasPathParams) destructuredParts.push("url");
      if (hasQueryParams) destructuredParts.push("query");
      if (hasBody) destructuredParts.push("data");
      content += `  const { ${destructuredParts.join(", ")} } = params;\n`;
    }

    // Build URL using imported endpoint function
    let urlExpression: string;
    if (hasPathParams) {
      // Call endpoint function with path parameters
      const paramArgs = pathParams.map((p) => `url.${p.name}`).join(", ");
      urlExpression = `${endpoint.name}_endpoint(${paramArgs})`;
    } else {
      // Reference endpoint constant
      urlExpression = `${endpoint.name}_endpoint`;
    }

    if (hasQueryParams) {
      content += `  const queryParams = new URLSearchParams();\n`;
      queryParams.forEach((param) => {
        if (param.required) {
          content += `  queryParams.append('${param.name}', String(query.${param.name}));\n`;
        } else {
          content += `  if (query.${param.name} !== undefined) {\n`;
          content += `    queryParams.append('${param.name}', String(query.${param.name}));\n`;
          content += `  }\n`;
        }
      });
      content += `  const _url = \`\${${urlExpression}}?\${queryParams.toString()}\`;\n`;
    } else {
      content += `  const _url = ${urlExpression};\n`;
    }

    // Make request
    content += `  return fetchAPI<${responseType}>(_url, {\n`;
    content += `    method: '${endpoint.method.toUpperCase()}',\n`;
    if (hasBody) {
      content += `    body: JSON.stringify(data),\n`;
    }
    content += `  });\n`;
    content += `}\n\n`;
  });

  // Add default export if requested (for folder-split mode)
  if (exportAsDefault) {
    content += `// Export all functions as a default object\n`;
    content += `const apiClient = {\n`;
    content += `  setApiConfig,\n`;
    endpoints.forEach((endpoint) => {
      content += `  ${endpoint.name},\n`;
    });
    content += `};\n\n`;
    content += `export default apiClient;\n`;
  }

  return content;
};

/**
 * Generate Axios client code
 *
 * Creates a type-safe Axios client class with methods for each endpoint.
 * Includes support for authentication interceptors, error handling, and configurable instances.
 * Can export either a singleton instance or just the class definition.
 *
 * @param {EndpointInfo[]} endpoints - Array of endpoint information to generate client methods for
 * @param {IConfigClientGeneration} config - Client generation configuration (baseURL, auth, etc.)
 * @param {boolean} [exportOnlyClass=false] - If true, exports only the class; if false, exports a singleton instance
 * @returns {string} Complete TypeScript code for the Axios client
 *
 * @example
 * const clientCode = generateAxiosClient(endpoints, {
 *   baseURL: "https://api.example.com",
 *   auth: { type: "bearer" }
 * }, false);
 *
 * @public
 */
export const generateAxiosClient = (
  endpoints: EndpointInfo[],
  config: IConfigClientGeneration,
  exportOnlyClass: boolean = false
): string => {
  const baseURL = config.baseURL || "";
  const authConfig = config.auth;

  let content = `// Generated Axios API Client\n`;
  content += `// This file was auto-generated. Add custom code in the marked sections.\n\n`;

  content += `import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';\n\n`;

  // Generate types import
  content += `import type {\n`;
  const uniqueTypes = new Set<string>();
  endpoints.forEach((endpoint) => {
    if (endpoint.queryType) uniqueTypes.add(endpoint.queryType);
    if (endpoint.dtoType) uniqueTypes.add(endpoint.dtoType);
    if (endpoint.responseType) uniqueTypes.add(endpoint.responseType);
  });
  uniqueTypes.forEach((type) => {
    content += `  ${type},\n`;
  });
  content += `} from '../types';\n\n`;

  // Generate endpoints import
  content += `import {\n`;
  endpoints.forEach((endpoint) => {
    content += `  ${endpoint.name},\n`;
  });
  content += `} from '../endpoints';\n\n`;

  // Generate config interface
  content += `export interface ApiConfig {\n`;
  content += `  baseURL?: string;\n`;
  if (authConfig) {
    content += `  auth?: {\n`;
    content += `    token?: string;\n`;
    content += `  };\n`;
  }
  content += `  headers?: Record<string, string>;\n`;
  content += `  timeout?: number;\n`;
  content += `}\n\n`;

  // Generate error class if enabled
  if (config.errorHandling?.generateErrorClasses) {
    content += `export class ApiError extends Error {\n`;
    content += `  constructor(\n`;
    content += `    message: string,\n`;
    content += `    public statusCode: number,\n`;
    content += `    public response?: any\n`;
    content += `  ) {\n`;
    content += `    super(message);\n`;
    content += `    this.name = 'ApiError';\n`;
    content += `  }\n`;
    content += `}\n\n`;
  }

  // Create axios instance
  content += `class ApiClient {\n`;
  content += `  private client: AxiosInstance;\n\n`;

  content += `  constructor(config: ApiConfig = {}) {\n`;
  content += `    this.client = axios.create({\n`;
  content += `      baseURL: config.baseURL || "${baseURL}",\n`;
  content += `      timeout: config.timeout || 30000,\n`;
  content += `      headers: {\n`;
  content += `        'Content-Type': 'application/json',\n`;
  content += `        ...config.headers,\n`;
  content += `      },\n`;
  content += `    });\n\n`;

  // Add request interceptor for auth
  if (authConfig) {
    content += `    // Request interceptor for auth\n`;
    content += `    this.client.interceptors.request.use((config) => {\n`;
    if (authConfig.type === "bearer") {
      content += `      const token = this.getAuthToken();\n`;
      content += `      if (token) {\n`;
      content += `        config.headers.Authorization = \`Bearer \${token}\`;\n`;
      content += `      }\n`;
    } else if (authConfig.type === "apiKey" && authConfig.in === "header") {
      content += `      const token = this.getAuthToken();\n`;
      content += `      if (token) {\n`;
      content += `        config.headers['${
        authConfig.name || "X-API-Key"
      }'] = token;\n`;
      content += `      }\n`;
    }
    content += `      return config;\n`;
    content += `    });\n\n`;
  }

  // Add response interceptor for error handling
  content += `    // Response interceptor for error handling\n`;
  content += `    this.client.interceptors.response.use(\n`;
  content += `      (response) => response,\n`;
  content += `      (error) => {\n`;
  if (config.errorHandling?.generateErrorClasses) {
    content += `        const message = error.response?.data?.message || error.message;\n`;
    content += `        const statusCode = error.response?.status || 500;\n`;
    content += `        throw new ApiError(message, statusCode, error.response?.data);\n`;
  } else {
    content += `        return Promise.reject(error);\n`;
  }
  content += `      }\n`;
  content += `    );\n`;
  content += `  }\n\n`;

  if (authConfig) {
    content += `  private authToken?: string;\n\n`;
    content += `  setAuthToken(token: string) {\n`;
    content += `    this.authToken = token;\n`;
    content += `  }\n\n`;
    content += `  getAuthToken(): string | undefined {\n`;
    content += `    return this.authToken;\n`;
    content += `  }\n\n`;
  }

  content += `  updateConfig(config: Partial<ApiConfig>) {\n`;
  content += `    Object.assign(this.client.defaults, config);\n`;
  content += `  }\n\n`;

  // Generate endpoint methods
  endpoints.forEach((endpoint) => {
    const funcName = endpoint.name;
    const pathParams =
      endpoint.parameters?.filter((p) => p.in === "path") || [];
    const queryParams =
      endpoint.parameters?.filter((p) => p.in === "query") || [];
    const hasPathParams = pathParams.length > 0;
    const hasQueryParams = queryParams.length > 0;
    const hasBody = !!endpoint.requestBody;
    const responseType = endpoint.responseType || "any";

    // Generate function signature
    content += `  /**\n`;
    if (endpoint.summary) {
      content += `   * ${endpoint.summary}\n`;
    }
    content += `   * @method ${endpoint.method.toUpperCase()}\n`;
    content += `   * @path ${endpoint.path}\n`;
    if (endpoint.tags && endpoint.tags.length > 0) {
      content += `   * @tags ${endpoint.tags.join(", ")}\n`;
    }
    content += `   */\n`;

    content += `  async ${funcName}(`;

    // Build structured params type
    if (hasPathParams || hasQueryParams || hasBody) {
      content += `params: {\n`;

      if (hasPathParams) {
        content += `    url: {\n`;
        pathParams.forEach((param) => {
          const typeMap: Record<string, string> = {
            string: "string",
            number: "number",
            integer: "number",
            boolean: "boolean",
            array: "any[]",
            object: "any",
          };
          const tsType = typeMap[param.type || "string"] || "any";
          const optional = param.required ? "" : "?";
          content += `      ${param.name}${optional}: ${tsType};\n`;
        });
        content += `    };\n`;
      }

      if (hasQueryParams) {
        content += `    query: ${
          endpoint.queryType || "Record<string, any>"
        };\n`;
      }

      if (hasBody) {
        content += `    data: ${endpoint.dtoType || "any"};\n`;
      }

      content += `  }`;
    }

    content += `): Promise<${responseType}> {\n`;

    // Destructure params if needed
    if (hasPathParams || hasQueryParams || hasBody) {
      const destructuredParts: string[] = [];
      if (hasPathParams) destructuredParts.push("url");
      if (hasQueryParams) destructuredParts.push("query");
      if (hasBody) destructuredParts.push("data");
      content += `    const { ${destructuredParts.join(", ")} } = params;\n`;
    }

    // Build URL using imported endpoint function
    if (hasPathParams) {
      // Call endpoint function with path parameters
      const paramArgs = pathParams.map((p) => `url.${p.name}`).join(", ");
      content += `    const _url = ${endpoint.name}(${paramArgs});\n`;
    } else {
      // Reference endpoint constant
      content += `    const _url = ${endpoint.name};\n`;
    }

    // Build config
    content += `    const config: AxiosRequestConfig = {};\n`;
    if (hasQueryParams) {
      content += `    config.params = { ...query };\n`;
    }

    // Make request
    content += `    const response = await this.client.${endpoint.method.toLowerCase()}<${responseType}>(\n`;
    content += `      _url,\n`;
    if (hasBody) {
      content += `      data,\n      config\n`;
    } else {
      content += `      config\n`;
    }
    content += `    );\n`;
    content += `    return response.data;\n`;
    content += `  }\n\n`;
  });

  content += `}\n\n`;

  // Export based on mode
  if (exportOnlyClass) {
    // For folder-split mode: only export the class
    content += `export default ApiClient;\n`;
  } else {
    // For non-folder-split mode: export singleton instance
    content += `export const apiClient = new ApiClient();\n`;
    content += `export default apiClient;\n`;
  }

  return content;
};

/**
 * Generate React Query hooks
 *
 * Creates type-safe React Query hooks (useQuery and useMutation) for each endpoint.
 * Supports both React Query v4 and v5, with customizable query keys and options.
 *
 * @param {EndpointInfo[]} endpoints - Array of endpoint information to generate hooks for
 * @param {IConfigClientGeneration} config - Client generation configuration with React Query options
 * @returns {string} Complete TypeScript code with React Query hooks
 *
 * @example
 * const hooksCode = generateReactQueryHooks(endpoints, {
 *   reactQuery: { version: 5, mutations: true }
 * });
 *
 * @public
 */
export const generateReactQueryHooks = (
  endpoints: EndpointInfo[],
  config: IConfigClientGeneration
): string => {
  const version = config.reactQuery?.version || 5;
  const enableMutations = config.reactQuery?.mutations !== false;

  let content = `// Generated React Query Hooks\n`;
  content += `// This file was auto-generated. Add custom code in the marked sections.\n\n`;

  // Check if we have any mutations to generate
  const hasMutations =
    enableMutations &&
    endpoints.some((e) =>
      ["POST", "PUT", "PATCH", "DELETE"].includes(e.method.toUpperCase())
    );

  if (version === 5) {
    const imports = hasMutations
      ? `import { useQuery, useMutation, UseQueryOptions, UseMutationOptions } from '@tanstack/react-query';\n`
      : `import { useQuery, UseQueryOptions } from '@tanstack/react-query';\n`;
    content += imports;
  } else {
    const imports = hasMutations
      ? `import { useQuery, useMutation, UseQueryOptions, UseMutationOptions } from 'react-query';\n`
      : `import { useQuery, UseQueryOptions } from 'react-query';\n`;
    content += imports;
  }
  content += `\n`;

  // Import API client (assuming axios client)
  content += `import apiClient from './client';\n`;

  // Generate types import
  content += `import type {\n`;
  const uniqueTypes = new Set<string>();
  endpoints.forEach((endpoint) => {
    if (endpoint.queryType) uniqueTypes.add(endpoint.queryType);
    if (endpoint.dtoType) uniqueTypes.add(endpoint.dtoType);
    if (endpoint.responseType) uniqueTypes.add(endpoint.responseType);
  });
  uniqueTypes.forEach((type) => {
    content += `  ${type},\n`;
  });
  content += `} from '../types';\n\n`;

  // Generate hooks for each endpoint
  endpoints.forEach((endpoint) => {
    const method = endpoint.method.toUpperCase();
    const isQuery = method === "GET";
    const isMutation = ["POST", "PUT", "PATCH", "DELETE"].includes(method);

    const pathParams =
      endpoint.parameters?.filter((p) => p.in === "path") || [];
    const queryParams =
      endpoint.parameters?.filter((p) => p.in === "query") || [];
    const hasPathParams = pathParams.length > 0;
    const hasQueryParams = queryParams.length > 0;
    const hasBody = !!endpoint.requestBody;
    const responseType = endpoint.responseType || "any";

    if (isQuery) {
      // Generate useQuery hook
      const hookName = `use${
        endpoint.name.charAt(0).toUpperCase() + endpoint.name.slice(1)
      }`;

      content += `/**\n`;
      if (endpoint.summary) {
        content += ` * ${endpoint.summary}\n`;
      }
      content += ` * @method ${method}\n`;
      content += ` * @path ${endpoint.path}\n`;
      if (endpoint.tags && endpoint.tags.length > 0) {
        content += ` * @tags ${endpoint.tags.join(", ")}\n`;
      }
      content += ` */\n`;

      if (hasPathParams || hasQueryParams) {
        // Build structured params type
        content += `export function ${hookName}(\n`;
        content += `  params: {\n`;

        if (hasPathParams) {
          content += `    url: {\n`;
          pathParams.forEach((param) => {
            const typeMap: Record<string, string> = {
              string: "string",
              number: "number",
              integer: "number",
              boolean: "boolean",
              array: "any[]",
              object: "any",
            };
            const tsType = typeMap[param.type || "string"] || "any";
            const optional = param.required ? "" : "?";
            content += `      ${param.name}${optional}: ${tsType};\n`;
          });
          content += `    };\n`;
        }

        if (hasQueryParams) {
          content += `    query: ${
            endpoint.queryType || "Record<string, any>"
          };\n`;
        }

        content += `  },\n`;
        content += `  options?: Omit<UseQueryOptions<${responseType}>, 'queryKey' | 'queryFn'>\n`;
        content += `) {\n`;
        content += `  return useQuery({\n`;
        content += `    queryKey: ['${endpoint.name}', params],\n`;
        content += `    queryFn: () => apiClient.${endpoint.name}(params),\n`;
        content += `    ...options,\n`;
        content += `  });\n`;
      } else {
        content += `export function ${hookName}(\n`;
        content += `  options?: Omit<UseQueryOptions<${responseType}>, 'queryKey' | 'queryFn'>\n`;
        content += `) {\n`;
        content += `  return useQuery({\n`;
        content += `    queryKey: ['${endpoint.name}'],\n`;
        content += `    queryFn: () => apiClient.${endpoint.name}(),\n`;
        content += `    ...options,\n`;
        content += `  });\n`;
      }
      content += `}\n\n`;
    } else if (isMutation && enableMutations) {
      // Generate useMutation hook
      const hookName = `use${
        endpoint.name.charAt(0).toUpperCase() + endpoint.name.slice(1)
      }`;

      content += `/**\n`;
      if (endpoint.summary) {
        content += ` * ${endpoint.summary}\n`;
      }
      content += ` * @method ${method}\n`;
      content += ` * @path ${endpoint.path}\n`;
      if (endpoint.tags && endpoint.tags.length > 0) {
        content += ` * @tags ${endpoint.tags.join(", ")}\n`;
      }
      content += ` */\n`;

      // Determine the mutation variables type - use structured params
      let variablesType = "void";
      if (hasPathParams || hasQueryParams || hasBody) {
        variablesType = `{\n`;

        if (hasPathParams) {
          variablesType += `    url: {\n`;
          pathParams.forEach((param) => {
            const typeMap: Record<string, string> = {
              string: "string",
              number: "number",
              integer: "number",
              boolean: "boolean",
              array: "any[]",
              object: "any",
            };
            const tsType = typeMap[param.type || "string"] || "any";
            const optional = param.required ? "" : "?";
            variablesType += `      ${param.name}${optional}: ${tsType};\n`;
          });
          variablesType += `    };\n`;
        }

        if (hasQueryParams) {
          variablesType += `    query: ${
            endpoint.queryType || "Record<string, any>"
          };\n`;
        }

        if (hasBody) {
          variablesType += `    data: ${endpoint.dtoType || "any"};\n`;
        }

        variablesType += `  }`;
      }

      content += `export function ${hookName}(\n`;
      content += `  options?: Omit<UseMutationOptions<${responseType}, Error, ${variablesType}>, 'mutationFn'>\n`;
      content += `) {\n`;
      content += `  return useMutation({\n`;
      content += `    mutationFn: (`;

      if (variablesType !== "void") {
        content += `variables: ${variablesType}`;
      }

      content += `) => {\n`;
      content += `      return apiClient.${endpoint.name}(${
        variablesType !== "void" ? "variables" : ""
      });\n`;
      content += `    },\n`;
      content += `    ...options,\n`;
      content += `  });\n`;
      content += `}\n\n`;
    }
  });

  return content;
};

/**
 * Generate SWR hooks
 *
 * Creates type-safe SWR hooks (useSWR and mutation hooks) for each endpoint.
 * Includes custom fetchers, key generation, and optional mutation support.
 *
 * @param {EndpointInfo[]} endpoints - Array of endpoint information to generate hooks for
 * @param {IConfigClientGeneration} config - Client generation configuration with SWR options
 * @returns {string} Complete TypeScript code with SWR hooks
 *
 * @example
 * const hooksCode = generateSWRHooks(endpoints, {
 *   swr: { mutations: true }
 * });
 *
 * @public
 */
export const generateSWRHooks = (
  endpoints: EndpointInfo[],
  config: IConfigClientGeneration
): string => {
  const enableMutations = config.swr?.mutations !== false;

  let content = `// Generated SWR Hooks\n`;
  content += `// This file was auto-generated. Add custom code in the marked sections.\n\n`;

  // Add comprehensive usage examples
  content += `/**\n`;
  content += ` * SWR Hooks - Complete Usage Guide\n`;
  content += ` * \n`;
  content += ` * This file contains type-safe SWR hooks generated from your OpenAPI specification.\n`;
  content += ` * \n`;
  content += ` * ## Quick Start\n`;
  content += ` * \n`;
  content += ` * 1. Configure SWR globally:\n`;
  content += ` * \n`;
  content += ` * \`\`\`typescript\n`;
  content += ` * // app/providers.tsx\n`;
  content += ` * import { SWRConfig } from 'swr';\n`;
  content += ` * \n`;
  content += ` * export function Providers({ children }) {\n`;
  content += ` *   return (\n`;
  content += ` *     <SWRConfig value={{\n`;
  content += ` *       revalidateOnFocus: false,\n`;
  content += ` *       shouldRetryOnError: true,\n`;
  content += ` *       errorRetryCount: 3,\n`;
  content += ` *     }}>\n`;
  content += ` *       {children}\n`;
  content += ` *     </SWRConfig>\n`;
  content += ` *   );\n`;
  content += ` * }\n`;
  content += ` * \`\`\`\n`;
  content += ` * \n`;
  content += ` * 2. Use the hooks in your components:\n`;
  content += ` * \n`;
  content += ` * ### Reading Data (GET)\n`;
  content += ` * \n`;
  content += ` * \`\`\`typescript\n`;
  content += ` * import { useGetItems } from './hooks';\n`;
  content += ` * \n`;
  content += ` * function ItemList() {\n`;
  content += ` *   const { data, error, isLoading, mutate } = useGetItems();\n`;
  content += ` *   \n`;
  content += ` *   if (isLoading) return <div>Loading...</div>;\n`;
  content += ` *   if (error) return <div>Error: {error.message}</div>;\n`;
  content += ` *   \n`;
  content += ` *   return (\n`;
  content += ` *     <div>\n`;
  content += ` *       {data?.map(item => <div key={item.id}>{item.name}</div>)}\n`;
  content += ` *       <button onClick={() => mutate()}>Refresh</button>\n`;
  content += ` *     </div>\n`;
  content += ` *   );\n`;
  content += ` * }\n`;
  content += ` * \`\`\`\n`;
  content += ` * \n`;
  content += ` * ### With Path Parameters\n`;
  content += ` * \n`;
  content += ` * \`\`\`typescript\n`;
  content += ` * function ItemDetail({ id }: { id: string }) {\n`;
  content += ` *   const { data } = useGetItemById({ url: { id } });\n`;
  content += ` *   return <div>{data?.name}</div>;\n`;
  content += ` * }\n`;
  content += ` * \`\`\`\n`;
  content += ` * \n`;
  content += ` * ### Creating Data (POST)\n`;
  content += ` * \n`;
  content += ` * \`\`\`typescript\n`;
  content += ` * import { useCreateItem, useGetItems } from './hooks';\n`;
  content += ` * \n`;
  content += ` * function CreateItem() {\n`;
  content += ` *   const { trigger, isMutating, error } = useCreateItem();\n`;
  content += ` *   const { mutate: revalidateList } = useGetItems();\n`;
  content += ` *   \n`;
  content += ` *   const handleSubmit = async (name: string) => {\n`;
  content += ` *     try {\n`;
  content += ` *       const result = await trigger({\n`;
  content += ` *         arg: { data: { name } }\n`;
  content += ` *       });\n`;
  content += ` *       await revalidateList(); // Refresh the list\n`;
  content += ` *       alert('Created!');\n`;
  content += ` *     } catch (err) {\n`;
  content += ` *       console.error('Failed:', err);\n`;
  content += ` *     }\n`;
  content += ` *   };\n`;
  content += ` *   \n`;
  content += ` *   return (\n`;
  content += ` *     <button onClick={() => handleSubmit('New Item')} disabled={isMutating}>\n`;
  content += ` *       {isMutating ? 'Creating...' : 'Create'}\n`;
  content += ` *     </button>\n`;
  content += ` *   );\n`;
  content += ` * }\n`;
  content += ` * \`\`\`\n`;
  content += ` * \n`;
  content += ` * ### Updating Data (PUT/PATCH)\n`;
  content += ` * \n`;
  content += ` * \`\`\`typescript\n`;
  content += ` * function UpdateItem({ id }: { id: string }) {\n`;
  content += ` *   const { data, mutate: revalidate } = useGetItemById({ url: { id } });\n`;
  content += ` *   const { trigger } = useUpdateItem();\n`;
  content += ` *   \n`;
  content += ` *   const handleUpdate = async (newName: string) => {\n`;
  content += ` *     await trigger({\n`;
  content += ` *       arg: {\n`;
  content += ` *         url: { id },\n`;
  content += ` *         data: { name: newName }\n`;
  content += ` *       }\n`;
  content += ` *     });\n`;
  content += ` *     await revalidate(); // Refresh the detail view\n`;
  content += ` *   };\n`;
  content += ` *   \n`;
  content += ` *   return <button onClick={() => handleUpdate('Updated')}>Update</button>;\n`;
  content += ` * }\n`;
  content += ` * \`\`\`\n`;
  content += ` * \n`;
  content += ` * ### Deleting Data (DELETE)\n`;
  content += ` * \n`;
  content += ` * \`\`\`typescript\n`;
  content += ` * function DeleteItem({ id }: { id: string }) {\n`;
  content += ` *   const { trigger, isMutating } = useDeleteItem();\n`;
  content += ` *   const { mutate: revalidateList } = useGetItems();\n`;
  content += ` *   \n`;
  content += ` *   const handleDelete = async () => {\n`;
  content += ` *     if (confirm('Delete?')) {\n`;
  content += ` *       await trigger({ arg: { url: { id } } });\n`;
  content += ` *       await revalidateList();\n`;
  content += ` *     }\n`;
  content += ` *   };\n`;
  content += ` *   \n`;
  content += ` *   return (\n`;
  content += ` *     <button onClick={handleDelete} disabled={isMutating}>\n`;
  content += ` *       {isMutating ? 'Deleting...' : 'Delete'}\n`;
  content += ` *     </button>\n`;
  content += ` *   );\n`;
  content += ` * }\n`;
  content += ` * \`\`\`\n`;
  content += ` * \n`;
  content += ` * ## Advanced Patterns\n`;
  content += ` * \n`;
  content += ` * ### Optimistic Updates\n`;
  content += ` * \n`;
  content += ` * \`\`\`typescript\n`;
  content += ` * function OptimisticUpdate({ id }: { id: string }) {\n`;
  content += ` *   const { data, mutate: revalidate } = useGetItemById({ url: { id } });\n`;
  content += ` *   const { trigger } = useUpdateItem();\n`;
  content += ` *   \n`;
  content += ` *   const handleUpdate = async (newName: string) => {\n`;
  content += ` *     // Update UI immediately\n`;
  content += ` *     revalidate({ ...data!, name: newName }, false);\n`;
  content += ` *     \n`;
  content += ` *     try {\n`;
  content += ` *       await trigger({ arg: { url: { id }, data: { name: newName } } });\n`;
  content += ` *       await revalidate(); // Sync with server\n`;
  content += ` *     } catch (err) {\n`;
  content += ` *       await revalidate(); // Rollback on error\n`;
  content += ` *     }\n`;
  content += ` *   };\n`;
  content += ` *   \n`;
  content += ` *   return <button onClick={() => handleUpdate('New')}>Update</button>;\n`;
  content += ` * }\n`;
  content += ` * \`\`\`\n`;
  content += ` * \n`;
  content += ` * ### Conditional Fetching\n`;
  content += ` * \n`;
  content += ` * \`\`\`typescript\n`;
  content += ` * function ConditionalFetch({ id, enabled }: { id: string; enabled: boolean }) {\n`;
  content += ` *   // Only fetch when enabled is true\n`;
  content += ` *   const { data } = useGetItemById(enabled ? { url: { id } } : null);\n`;
  content += ` *   return <div>{data?.name || 'Not loaded'}</div>;\n`;
  content += ` * }\n`;
  content += ` * \`\`\`\n`;
  content += ` * \n`;
  content += ` * ### Pagination\n`;
  content += ` * \n`;
  content += ` * \`\`\`typescript\n`;
  content += ` * function PaginatedList() {\n`;
  content += ` *   const [page, setPage] = useState(1);\n`;
  content += ` *   const { data, isLoading } = useGetItems({ query: { page, limit: 10 } });\n`;
  content += ` *   \n`;
  content += ` *   return (\n`;
  content += ` *     <div>\n`;
  content += ` *       {data?.items.map(item => <div key={item.id}>{item.name}</div>)}\n`;
  content += ` *       <button onClick={() => setPage(p => p - 1)} disabled={page === 1}>\n`;
  content += ` *         Previous\n`;
  content += ` *       </button>\n`;
  content += ` *       <button onClick={() => setPage(p => p + 1)}>Next</button>\n`;
  content += ` *     </div>\n`;
  content += ` *   );\n`;
  content += ` * }\n`;
  content += ` * \`\`\`\n`;
  content += ` * \n`;
  content += ` * ### Custom Configuration\n`;
  content += ` * \n`;
  content += ` * \`\`\`typescript\n`;
  content += ` * function CustomConfig({ id }: { id: string }) {\n`;
  content += ` *   const { data } = useGetItemById(\n`;
  content += ` *     { url: { id } },\n`;
  content += ` *     {\n`;
  content += ` *       refreshInterval: 5000,        // Refresh every 5s\n`;
  content += ` *       revalidateOnFocus: true,      // Refresh on window focus\n`;
  content += ` *       dedupingInterval: 2000,       // Dedupe within 2s\n`;
  content += ` *       onError: (err) => console.error(err),\n`;
  content += ` *       onSuccess: (data) => console.log('Loaded:', data),\n`;
  content += ` *     }\n`;
  content += ` *   );\n`;
  content += ` *   return <div>{data?.name}</div>;\n`;
  content += ` * }\n`;
  content += ` * \`\`\`\n`;
  content += ` * \n`;
  content += ` * ## Hook Return Values\n`;
  content += ` * \n`;
  content += ` * ### Query Hooks (GET)\n`;
  content += ` * - \`data\`: The response data (undefined while loading)\n`;
  content += ` * - \`error\`: Error object if request failed\n`;
  content += ` * - \`isLoading\`: True during initial load\n`;
  content += ` * - \`isValidating\`: True during revalidation\n`;
  content += ` * - \`mutate()\`: Manually trigger revalidation\n`;
  content += ` * \n`;
  content += ` * ### Mutation Hooks (POST/PUT/DELETE)\n`;
  content += ` * - \`trigger()\`: Execute the mutation\n`;
  content += ` * - \`data\`: The response data from the mutation\n`;
  content += ` * - \`error\`: Error object if mutation failed\n`;
  content += ` * - \`isMutating\`: True while mutation is in progress\n`;
  content += ` * - \`reset()\`: Reset the mutation state\n`;
  content += ` * \n`;
  content += ` * @see https://swr.vercel.app/docs/getting-started\n`;
  content += ` * @see https://swr.vercel.app/docs/mutation\n`;
  content += ` */\n\n`;

  content += `import useSWR, { SWRConfiguration } from 'swr';\n`;

  // Check if we have any mutations to generate
  const hasMutations =
    enableMutations &&
    endpoints.some((e) =>
      ["POST", "PUT", "PATCH", "DELETE"].includes(e.method.toUpperCase())
    );

  if (hasMutations) {
    content += `import useSWRMutation, { SWRMutationConfiguration } from 'swr/mutation';\n`;
  }
  content += `\n`;

  // Import API client
  content += `import apiClient from './client';\n`;

  // Generate types import
  content += `import type {\n`;
  const uniqueTypes = new Set<string>();
  endpoints.forEach((endpoint) => {
    if (endpoint.queryType) uniqueTypes.add(endpoint.queryType);
    if (endpoint.dtoType) uniqueTypes.add(endpoint.dtoType);
    if (endpoint.responseType) uniqueTypes.add(endpoint.responseType);
  });
  uniqueTypes.forEach((type) => {
    content += `  ${type},\n`;
  });
  content += `} from '../types';\n\n`;

  // Generate hooks for each endpoint
  endpoints.forEach((endpoint) => {
    const method = endpoint.method.toUpperCase();
    const isQuery = method === "GET";
    const isMutation = ["POST", "PUT", "PATCH", "DELETE"].includes(method);

    const pathParams =
      endpoint.parameters?.filter((p) => p.in === "path") || [];
    const queryParams =
      endpoint.parameters?.filter((p) => p.in === "query") || [];
    const hasPathParams = pathParams.length > 0;
    const hasQueryParams = queryParams.length > 0;
    const hasBody = !!endpoint.requestBody;
    const responseType = endpoint.responseType || "any";

    if (isQuery) {
      // Generate useSWR hook
      const hookName = `use${
        endpoint.name.charAt(0).toUpperCase() + endpoint.name.slice(1)
      }`;

      content += `/**\n`;
      if (endpoint.summary) {
        content += ` * ${endpoint.summary}\n`;
      }
      content += ` * @method ${method}\n`;
      content += ` * @path ${endpoint.path}\n`;
      if (endpoint.tags && endpoint.tags.length > 0) {
        content += ` * @tags ${endpoint.tags.join(", ")}\n`;
      }
      content += ` */\n`;

      if (hasPathParams || hasQueryParams) {
        // Build structured params type
        content += `export function ${hookName}(\n`;
        content += `  params: {\n`;

        if (hasPathParams) {
          content += `    url: {\n`;
          pathParams.forEach((param) => {
            const typeMap: Record<string, string> = {
              string: "string",
              number: "number",
              integer: "number",
              boolean: "boolean",
              array: "any[]",
              object: "any",
            };
            const tsType = typeMap[param.type || "string"] || "any";
            const optional = param.required ? "" : "?";
            content += `      ${param.name}${optional}: ${tsType};\n`;
          });
          content += `    };\n`;
        }

        if (hasQueryParams) {
          content += `    query: ${
            endpoint.queryType || "Record<string, any>"
          };\n`;
        }

        content += `  },\n`;
        content += `  config?: SWRConfiguration<${responseType}>\n`;
        content += `) {\n`;
        content += `  return useSWR(\n`;
        content += `    ['${endpoint.name}', params],\n`;
        content += `    () => apiClient.${endpoint.name}(params),\n`;
        content += `    config\n`;
        content += `  );\n`;
      } else {
        content += `export function ${hookName}(\n`;
        content += `  config?: SWRConfiguration<${responseType}>\n`;
        content += `) {\n`;
        content += `  return useSWR(\n`;
        content += `    '${endpoint.name}',\n`;
        content += `    () => apiClient.${endpoint.name}(),\n`;
        content += `    config\n`;
        content += `  );\n`;
      }
      content += `}\n\n`;
    } else if (isMutation && enableMutations) {
      // Generate useSWRMutation hook
      const hookName = `use${
        endpoint.name.charAt(0).toUpperCase() + endpoint.name.slice(1)
      }`;

      content += `/**\n`;
      if (endpoint.summary) {
        content += ` * ${endpoint.summary}\n`;
      }
      content += ` * @method ${method}\n`;
      content += ` * @path ${endpoint.path}\n`;
      if (endpoint.tags && endpoint.tags.length > 0) {
        content += ` * @tags ${endpoint.tags.join(", ")}\n`;
      }
      content += ` */\n`;

      // Determine the mutation arguments type - use structured params
      let argsType = "void";
      let swrMutationArgsType = "void"; // Type for SWRMutationConfiguration

      if (hasPathParams || hasQueryParams || hasBody) {
        // Build the inner type (what the API client expects)
        argsType = `{\n`;

        if (hasPathParams) {
          argsType += `      url: {\n`;
          pathParams.forEach((param) => {
            const typeMap: Record<string, string> = {
              string: "string",
              number: "number",
              integer: "number",
              boolean: "boolean",
              array: "any[]",
              object: "any",
            };
            const tsType = typeMap[param.type || "string"] || "any";
            const optional = param.required ? "" : "?";
            argsType += `        ${param.name}${optional}: ${tsType};\n`;
          });
          argsType += `      };\n`;
        }

        if (hasQueryParams) {
          argsType += `      query: ${
            endpoint.queryType || "Record<string, any>"
          };\n`;
        }

        if (hasBody) {
          argsType += `      data: ${endpoint.dtoType || "any"};\n`;
        }

        argsType += `    }`;

        // SWR wraps the arg in { arg: ... } in the fetcher signature
        swrMutationArgsType = `{ arg: ${argsType} }`;
      }

      content += `export function ${hookName}(\n`;
      content += `  config?: SWRMutationConfiguration<${responseType}, Error, string, ${argsType}>\n`;
      content += `) {\n`;
      content += `  return useSWRMutation(\n`;
      content += `    '${endpoint.name}',\n`;
      content += `    async (_, `;

      if (argsType !== "void") {
        content += `{ arg }: ${swrMutationArgsType}`;
      }

      content += `) => {\n`;
      content += `      return apiClient.${endpoint.name}(${
        argsType !== "void" ? "arg" : ""
      });\n`;
      content += `    },\n`;
      content += `    config\n`;
      content += `  );\n`;
      content += `}\n\n`;
    }
  });

  return content;
};

/**
 * Generate RTK Query API slice
 *
 * Creates a Redux Toolkit Query API slice with type-safe query and mutation endpoints.
 * Includes auto-generated hooks, tag-based cache invalidation, and authentication support.
 *
 * @param {EndpointInfo[]} endpoints - Array of endpoint information to generate RTK Query endpoints for
 * @param {IConfigClientGeneration} config - Client generation configuration with RTK Query options
 * @returns {string} Complete TypeScript code for the RTK Query API slice
 *
 * @example
 * const apiCode = generateRTKQuery(endpoints, {
 *   rtkQuery: { apiName: "myApi", reducerPath: "myApi" }
 * });
 *
 * @public
 */
export const generateRTKQuery = (
  endpoints: EndpointInfo[],
  config: IConfigClientGeneration
): string => {
  const apiName = config.rtkQuery?.apiName || "api";
  const baseURL = config.baseURL || "";

  let content = `// Generated RTK Query API Slice\n`;
  content += `// This file was auto-generated. Add custom code in the marked sections.\n\n`;

  content += `import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';\n\n`;

  // Generate types import
  content += `import type {\n`;
  const uniqueTypes = new Set<string>();
  endpoints.forEach((endpoint) => {
    if (endpoint.queryType) uniqueTypes.add(endpoint.queryType);
    if (endpoint.dtoType) uniqueTypes.add(endpoint.dtoType);
    if (endpoint.responseType) uniqueTypes.add(endpoint.responseType);
  });
  uniqueTypes.forEach((type) => {
    content += `  ${type},\n`;
  });
  content += `} from '../types';\n\n`;

  // Generate endpoints import
  content += `import {\n`;
  endpoints.forEach((endpoint) => {
    content += `  ${endpoint.name},\n`;
  });
  content += `} from '../endpoints';\n\n`;

  // Generate API slice
  content += `const ${apiName}Api = createApi({\n`;
  content += `  reducerPath: '${apiName}Api',\n`;
  content += `  baseQuery: fetchBaseQuery({\n`;
  content += `    baseUrl: '${baseURL}',\n`;

  if (config.auth) {
    content += `    prepareHeaders: (headers, { getState }) => {\n`;
    content += `      // Get token from your auth state\n`;
    content += `      // const token = (getState() as RootState).auth.token;\n`;
    content += `      // if (token) {\n`;
    if (config.auth.type === "bearer") {
      content += `      //   headers.set('Authorization', \`Bearer \${token}\`);\n`;
    } else if (config.auth.type === "apiKey" && config.auth.in === "header") {
      content += `      //   headers.set('${
        config.auth.name || "X-API-Key"
      }', token);\n`;
    }
    content += `      // }\n`;
    content += `      return headers;\n`;
    content += `    },\n`;
  }

  content += `  }),\n`;
  content += `  tagTypes: [${[
    ...new Set(endpoints.flatMap((e) => e.tags || [])),
  ]
    .map((tag) => `'${tag}'`)
    .join(", ")}],\n`;
  content += `  endpoints: (builder) => ({\n`;

  // Generate endpoints
  endpoints.forEach((endpoint, index) => {
    const method = endpoint.method.toUpperCase();
    const isQuery = method === "GET";
    const pathParams =
      endpoint.parameters?.filter((p) => p.in === "path") || [];
    const queryParams =
      endpoint.parameters?.filter((p) => p.in === "query") || [];
    const hasPathParams = pathParams.length > 0;
    const hasQueryParams = queryParams.length > 0;
    const hasBody = !!endpoint.requestBody;
    const responseType = endpoint.responseType || "any";

    content += `    ${endpoint.name}: builder.${
      isQuery ? "query" : "mutation"
    }<\n`;
    content += `      ${responseType},\n`;

    // Determine the arg type - use structured params
    let argType = "void";
    if (hasPathParams || hasQueryParams || hasBody) {
      argType = `{\n`;

      if (hasPathParams) {
        argType += `        url: {\n`;
        pathParams.forEach((param) => {
          const typeMap: Record<string, string> = {
            string: "string",
            number: "number",
            integer: "number",
            boolean: "boolean",
            array: "any[]",
            object: "any",
          };
          const tsType = typeMap[param.type || "string"] || "any";
          const optional = param.required ? "" : "?";
          argType += `          ${param.name}${optional}: ${tsType};\n`;
        });
        argType += `        };\n`;
      }

      if (hasQueryParams) {
        argType += `        query: ${
          endpoint.queryType || "Record<string, any>"
        };\n`;
      }

      if (hasBody) {
        argType += `        data: ${endpoint.dtoType || "any"};\n`;
      }

      argType += `      }`;
    }

    content += `      ${argType}\n`;
    content += `    >({\n`;

    content += `      query: (`;
    if (argType !== "void") {
      content += `arg`;
    }
    content += `) => {\n`;

    // Build URL using imported endpoint function
    if (hasPathParams) {
      // Call endpoint function with path parameters
      const paramArgs = pathParams.map((p) => `arg.url.${p.name}`).join(", ");
      content += `        const url = ${endpoint.name}(${paramArgs});\n`;
    } else {
      // Reference endpoint constant
      content += `        const url = ${endpoint.name};\n`;
    }

    content += `        return {\n`;
    content += `          url,\n`;
    content += `          method: '${method}',\n`;

    if (hasQueryParams) {
      content += `          params: arg.query,\n`;
    }

    if (hasBody) {
      content += `          body: arg.data,\n`;
    }

    content += `        };\n`;
    content += `      },\n`;

    if (endpoint.tags && endpoint.tags.length > 0) {
      if (isQuery) {
        content += `      providesTags: ['${endpoint.tags[0]}'],\n`;
      } else {
        content += `      invalidatesTags: ['${endpoint.tags[0]}'],\n`;
      }
    }

    content += `    })${index < endpoints.length - 1 ? "," : ""}\n`;
  });

  content += `  }),\n`;
  content += `});\n\n`;

  content += `export default ${apiName}Api;\n\n`;

  return content;
};
