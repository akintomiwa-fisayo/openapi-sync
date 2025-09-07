import { Method } from "axios";

export type IOpenApiSpec = Record<"openapi", string> & Record<string, any>;

export type IOpenApSchemaSpec = {
  nullable?: boolean;
  type: "string" | "integer" | "number" | "array" | "object" | "boolean";
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
};

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

export type IOpenApiMediaTypeSpec = {
  schema?: IOpenApSchemaSpec;
  example?: any;
  examples?: any[];
  encoding?: any;
};

export type IOpenApiRequestBodySpec = {
  description?: string;
  required?: boolean;
  content: Record<string, IOpenApiMediaTypeSpec>;
};

export type IOpenApiResponseSpec = Record<string, IOpenApiRequestBodySpec>;

export type IConfigReplaceWord = {
  /**  string and regular expression as a string*/
  replace: string;
  with: string;
  type?: "endpoint" | "type";
};

export type IConfigDoc = {
  disable?: boolean;
  showCurl?: boolean;
};

export type IConfig = {
  refetchInterval?: number;
  folder?: string;
  api: Record<string, string>;
  server?: number;
  types?: {
    name?: {
      prefix?: string;
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
        }
      ) => string | null | undefined;
    };
    doc: IConfigDoc;
  };
  endpoints?: {
    value?: {
      replaceWords?: IConfigReplaceWord[];
      includeServer?: boolean;
    };
    name?: {
      format?: (data: {
        method: Method;
        path: string;
        summary: string;
        operationId: string;
      }) => string | null;
      prefix?: string;
      useOperationId?: boolean;
    };
    doc: IConfigDoc;
  };
};

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
