import { Method } from "axios";

/**
 * OpenAPI Specification document type
 *
 * Represents a complete OpenAPI specification object with the required
 * "openapi" version field and any additional specification properties.
 *
 * @public
 */
export type IOpenApiSpec = Record<"openapi", string> & Record<string, any>;

/**
 * OpenAPI Schema Specification
 *
 * Represents a schema object as defined in the OpenAPI Specification.
 * Includes all standard JSON Schema properties plus OpenAPI extensions.
 * Supports validation constraints, composition keywords (anyOf, oneOf, allOf),
 * and references.
 *
 * @public
 */
export type IOpenApSchemaSpec = {
  nullable?: boolean;
  type:
    | "string"
    | "integer"
    | "number"
    | "array"
    | "object"
    | "boolean"
    | "null"
    | any[];
  example?: any;
  enum?: string[];
  format?: string;
  items?: IOpenApSchemaSpec;
  required?: string[];
  description?: string;
  $ref?: string;
  properties?: Record<string, IOpenApSchemaSpec>;
  additionalProperties?: IOpenApSchemaSpec;
  anyOf?: IOpenApSchemaSpec[];
  oneOf?: IOpenApSchemaSpec[];
  allOf?: IOpenApSchemaSpec[];
  // Validation constraints
  minLength?: number;
  maxLength?: number;
  minimum?: number;
  maximum?: number;
  exclusiveMinimum?: boolean;
  exclusiveMaximum?: boolean;
  pattern?: string;
  multipleOf?: number;
  minItems?: number;
  maxItems?: number;
  uniqueItems?: boolean;
  minProperties?: number;
  maxProperties?: number;
};

/**
 * OpenAPI Parameter Specification
 *
 * Represents a parameter object in an OpenAPI operation. Can describe
 * path, query, header, or cookie parameters with validation and examples.
 *
 * @public
 */
export type IOpenApiParameterSpec = {
  $ref?: string;
  name: string;
  in: string;
  enum?: string[];
  description?: string;
  required?: boolean;
  deprecated?: boolean;
  allowEmptyValue?: boolean;
  style?: string;
  explode?: boolean;
  allowReserved?: boolean;
  schema?: IOpenApSchemaSpec;
  example?: any;
  examples?: any[];
};

/**
 * OpenAPI Media Type Specification
 *
 * Represents a media type object for request/response bodies.
 * Includes schema definitions and examples for specific content types.
 *
 * @public
 */
export type IOpenApiMediaTypeSpec = {
  schema?: IOpenApSchemaSpec;
  example?: any;
  examples?: any[];
  encoding?: any;
};

/**
 * OpenAPI Request Body Specification
 *
 * Represents a request body object with content types and schemas.
 * Maps content types (e.g., "application/json") to their specifications.
 *
 * @public
 */
export type IOpenApiRequestBodySpec = {
  description?: string;
  required?: boolean;
  content: Record<string, IOpenApiMediaTypeSpec>;
};

/**
 * OpenAPI Response Specification
 *
 * Maps HTTP status codes to their response specifications.
 *
 * @public
 */
export type IOpenApiResponseSpec = Record<string, IOpenApiRequestBodySpec>;

/**
 * Configuration for word/pattern replacement in generated names
 *
 * Allows find-and-replace operations on generated type names and endpoint names.
 * Supports regular expressions for pattern matching.
 *
 * @public
 */
export type IConfigReplaceWord = {
  /**  string and regular expression as a string*/
  replace: string;
  with: string;
  // type?: "endpoint" | "type";
};

/**
 * Configuration for documentation generation
 *
 * Controls whether documentation is generated and what features are included.
 *
 * @public
 */
export type IConfigDoc = {
  disable?: boolean;
  showCurl?: boolean;
};

/**
 * Configuration for excluding endpoints from generation
 *
 * Allows filtering out specific endpoints by tags or path/method combinations.
 * Supports regex patterns for flexible matching.
 *
 * @public
 */
export type IConfigExclude = {
  /** Exclude/Include endpoints by tags */
  tags?: string[];
  /** Exclude/Include individual endpoints by path and method */
  endpoints?: Array<{
    /** Exact path match (regex will be ignore when provided)*/
    path?: string;
    /** Regular expression pattern for path matching */
    regex?: string;
    /** Don't specify method to exclude all methods */
    method?: Method;
  }>;
};

/**
 * Configuration for including endpoints in generation
 *
 * Mirror of IConfigExclude but used for explicit inclusion filtering.
 * When specified, only matching endpoints will be generated.
 *
 * @public
 */
export interface IConfigInclude extends IConfigExclude {}

/**
 * Configuration for folder splitting
 *
 * Controls how generated files are organized into folders.
 * Can split by OpenAPI tags or use custom logic.
 *
 * @public
 */
export type IConfigFolderSplit = {
  /** Split folders by tags - creates folders named after each tag */
  byTags?: boolean;
  /** Custom function to determine folder name for each endpoint */
  customFolder?: (data: {
    method: Method;
    path: string;
    summary?: string;
    operationId?: string;
    tags?: string[];
    parameters?: IOpenApiParameterSpec[];
    requestBody?: IOpenApiRequestBodySpec;
    responses?: IOpenApiResponseSpec;
  }) => string | null;
};

/**
 * Configuration for custom code preservation
 *
 * Controls how custom code sections are handled during regeneration.
 * Allows users to add code that won't be overwritten when files are regenerated.
 *
 * @public
 */
export type IConfigCustomCode = {
  /** Enable custom code preservation (default: true) */
  enabled?: boolean;
  /** Position of custom code block in generated files (default: "bottom") */
  position?: "top" | "bottom" | "both";
  /** Custom marker text to use for identifying custom code sections (default: "CUSTOM CODE") */
  markerText?: string;
  /** Add helpful instructions in markers (default: true) */
  includeInstructions?: boolean;
};

/**
 * Configuration for validation schema generation
 *
 * Controls generation of runtime validation schemas using Zod, Yup, or Joi.
 * Allows selective generation for query parameters and request bodies.
 *
 * @public
 */
export type IConfigValidations = {
  /** Disable validation schema generation (default: false) */
  disable?: boolean;
  /** Validation library to use */
  library?: "zod" | "yup" | "joi";
  /** Specify which types to generate validations for */
  generate?: {
    /** Generate validation for query parameters (default: true) */
    query?: boolean;
    /** Generate validation for request bodies/DTOs (default: true) */
    dto?: boolean;
  };
  /** Naming configuration for validation schemas */
  name?: {
    prefix?: string;
    useOperationId?: boolean;
    suffix?: string;
    format?: (
      data: {
        type?: "dto" | "query";
        code?: string;
        method?: Method;
        path?: string;
        summary?: string;
        operationId?: string;
      },
      defaultName: string
    ) => string | null | undefined;
  };
};

/**
 * Configuration for API client generation
 *
 * Controls generation of type-safe API clients including Fetch, Axios,
 * React Query hooks, SWR hooks, and RTK Query slices. Supports filtering,
 * custom naming, and framework-specific options.
 *
 * @public
 */
export type IConfigClientGeneration = {
  /** Enable client generation (default: false) */
  enabled?: boolean;
  /** Client type to generate */
  type?: "fetch" | "axios" | "react-query" | "swr" | "rtk-query";
  /** Output directory for generated clients */
  outputDir?: string;
  /** Base URL for API requests (can be overridden at runtime) */
  baseURL?: string;
  /** Filter endpoints by tags */
  tags?: string[];
  /** Filter endpoints by endpoint names */
  endpoints?: string[];
  /** Naming configuration for client functions */
  name?: {
    prefix?: string;
    suffix?: string;
    useOperationId?: boolean;
    format?: (
      data: {
        method: Method;
        path: string;
        summary?: string;
        operationId?: string;
        tags?: string[];
      },
      defaultName: string
    ) => string | null | undefined;
  };
  /** Configuration for React Query hooks */
  reactQuery?: {
    /** Version of React Query (default: 5) */
    version?: 4 | 5;
    /** Enable mutation hooks for POST/PUT/PATCH/DELETE (default: true) */
    mutations?: boolean;
    /** Enable infinite query hooks for paginated endpoints (default: false) */
    infiniteQueries?: boolean;
  };
  /** Configuration for SWR hooks */
  swr?: {
    /** Enable SWR mutation hooks (default: true) */
    mutations?: boolean;
  };
  /** Configuration for RTK Query */
  rtkQuery?: {
    /** API slice name */
    apiName?: string;
    /** Base query type */
    baseQuery?: "fetchBaseQuery" | "axiosBaseQuery";
  };
  /** Include authentication/authorization setup */
  auth?: {
    /** Auth type */
    type?: "bearer" | "apiKey" | "basic" | "oauth2";
    /** Where to include auth token */
    in?: "header" | "query" | "cookie";
    /** Header/query param name for auth */
    name?: string;
  };
  /** Error handling configuration */
  errorHandling?: {
    /** Generate typed error classes */
    generateErrorClasses?: boolean;
    /** Custom error handler function name */
    customHandler?: string;
  };
};

/**
 * Main OpenAPI Sync configuration
 *
 * The root configuration object for openapi-sync. Defines API sources,
 * output settings, code generation options, and all feature configurations.
 * Used in openapi.sync.ts, openapi.sync.js, or openapi.sync.json files.
 *
 * @public
 */
export type IConfig = {
  refetchInterval?: number;
  folder?: string;
  api: Record<string, string>;
  server?: number | string;
  /** Configuration for splitting generated code into folders */
  folderSplit?: IConfigFolderSplit;
  /** Configuration for preserving custom code between regenerations */
  customCode?: IConfigCustomCode;
  /** Configuration for validation schema generation */
  validations?: IConfigValidations;
  /** Configuration for API client generation */
  clientGeneration?: IConfigClientGeneration;
  /** Configuration for excluding endpoints from code generation */
  types?: {
    name?: {
      prefix?: string;
      useOperationId?: boolean;
      format?: (
        source: "shared" | "endpoint",
        data: {
          name?: string;
          ////. endpoint source //////
          type?: "response" | "dto" | "query";
          code?: string;
          method?: Method;
          path?: string;
          summary?: string;
          operationId?: string;
        },
        defaultName: string
      ) => string | null | undefined;
    };
    doc?: IConfigDoc;
  };
  endpoints?: {
    value?: {
      replaceWords?: IConfigReplaceWord[];
      includeServer?: boolean;
      type?: "string" | "object";
    };
    name?: {
      format?: (
        data: {
          method: Method;
          path: string;
          summary: string;
          operationId: string;
        },
        defaultName: string
      ) => string | null;
      prefix?: string;
      useOperationId?: boolean;
    };
    doc?: IConfigDoc;
    exclude?: IConfigExclude;
    include?: IConfigInclude;
  };
};

/**
 * OpenAPI Security Schemes
 *
 * Defines security schemes available in an OpenAPI specification.
 * Supports various authentication methods including HTTP, API keys,
 * OAuth2, OpenID Connect, and mutual TLS.
 *
 * @public
 */
export type IOpenApiSecuritySchemes = {
  [key: string]: {
    type: "http" | "apiKey" | "oauth2" | "openIdConnect" | "mutualTLS";
    scheme?: "bearer" | "basic";
    in?: "query" | "header" | "cookie";
    flows?: {
      authorizationCode: {
        authorizationUrl: "https://example.com/auth";
        tokenUrl: "https://example.com/token";
        scopes: {
          "read:data": "Grants read access";
        };
      };
    };
    bearerFormat?: "JWT";
    openIdConnectUrl?: string;
    name?: string;
  };
};
