export type IOpenApiSpec = Record<"openapi", string> & Record<string, any>;

export type IOpenApSchemaSpec = {
  type: "string" | "integer" | "number" | "array" | "object";
  example?: any;
  enum?: string[];
  format?: string;
  items?: IOpenApSchemaSpec;
  required?: string[];
  $ref?: string;
  properties?: Record<string, IOpenApSchemaSpec>;
};

export type IOpenApiParameterSpec = {
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
