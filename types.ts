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
	/**
	 * Include a cURL example in the generated JSDoc documentation for each endpoint.
	 * @default false
	 */
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
			defaultName: string,
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
	type?: "fetch" | "axios" | "react-query" | "swr" | "rtk-query" | "next-fetch";
	/** Enable Next.js App Router-friendly fetch options (cache, revalidate, tags) */
	next?: boolean;
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
			defaultName: string,
		) => string | null | undefined;
	};
	/** Configuration for React Query hooks */
	reactQuery?: {
		/** Version of React Query (default: 5) */
		version?: 4 | 5;
		/** Enable mutation hooks for POST/PUT/PATCH/DELETE (default: true) */
		mutations?: boolean;
		/** Enable infinite query hooks for paginated endpoints (default: false) */
		infiniteQueries?: boolean | {
			disable?: boolean;
			/** Include/exclude advanced filters for client generation */
			include?: IConfigInclude;
			exclude?: IConfigExclude;
		};
	};
	/** Configuration for SWR hooks */
	swr?: {
		/** Enable SWR mutation hooks (default: true) */
		mutations?: boolean;
		infiniteQueries?: boolean | {
			disable?: boolean;
			/** Include/exclude advanced filters for client generation */
			include?: IConfigInclude;
			exclude?: IConfigExclude;
		};
	};
	/** Configuration for RTK Query */
	rtkQuery?: {
		/** API slice name */
		apiName?: string;
		/** Base query type */
		baseQuery?: "fetchBaseQuery" | "axiosBaseQuery";
		infiniteQueries?: boolean | {
			disable?: boolean;
			/** Include/exclude advanced filters for client generation */
			include?: IConfigInclude;
			exclude?: IConfigExclude;
		};
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
 * Authentication configuration for fetching a protected OpenAPI spec URL.
 * Credentials should always reference environment variables, never be hardcoded.
 *
 * ⚠️ IMPORTANT NOTE FOR DEVELOPERS & AI AGENTS:
 * Referencing environment variables requires using a TypeScript (`openapi.sync.ts`)
 * or JavaScript (`openapi.sync.js`) configuration file. Static JSON (`openapi.sync.json`)
 * does not support JavaScript runtime expressions like `process.env`.
 *
 * @example
 * // In openapi.sync.ts or openapi.sync.js:
 * auth: { type: "bearer", token: process.env.MY_API_TOKEN || "${env.MY_API_TOKEN}" }
 *
 * // Basic auth:
 * auth: { type: "basic", username: process.env.API_USER!, password: process.env.API_PASS! }
 *
 * // API key in header:
 * auth: { type: "apiKey", in: "header", name: "X-API-Key", value: process.env.API_KEY! }
 *
 * @public
 */
export type ISpecAuth =
	| {
			type: "bearer";
			/** Token value. Use "${env.VAR_NAME}" to read from process.env. */
			token: string;
	  }
	| {
			type: "basic";
			/** Username. Use "${env.VAR_NAME}" to read from process.env. */
			username: string;
			/** Password. Use "${env.VAR_NAME}" to read from process.env. */
			password: string;
	  }
	| {
			type: "apiKey";
			/** Where to place the key: "header" or "query" */
			in: "header" | "query";
			/** Header/query parameter name, e.g. "X-API-Key" or "api_key" */
			name: string;
			/** Key value. Use "${env.VAR_NAME}" to read from process.env. */
			value: string;
	  }
	| {
			type: "custom";
			/**
			 * Arbitrary HTTP headers to add to the spec fetch request.
			 * Values can use "${env.VAR_NAME}" syntax.
			 * @example { "X-Tenant-Id": "${env.TENANT_ID}", "Cookie": "session=${env.SESSION}" }
			 */
			headers: Record<string, string>;
	  };

/**
 * Extended API source: can be a plain URL string or an object with auth.
 * @public
 */
export type IApiSource =
	| string
	| {
			/** URL or local file path to the OpenAPI spec */
			url: string;
			/** Authentication for fetching this spec (only used for URLs, not local files) */
			auth?: ISpecAuth;
	  };
/**
 * Named presets providing sensible, pre-configured defaults for popular
 * framework and library stacks. User configuration options always override
 * preset defaults.
 *
 * - `react-query-zod`: React Query v5 + Zod schemas + Axios client hooks with mutations
 * - `react-query-yup`: React Query v5 + Yup schemas + Axios client hooks with mutations
 * - `swr-zod`: SWR + Zod schemas + Axios client hooks with mutations
 * - `swr-yup`: SWR + Yup schemas + Axios client hooks with mutations
 * - `axios-zod`: Axios client + Zod validation schemas
 * - `axios-joi`: Axios client + Joi validation schemas
 * - `fetch-zod`: Native Fetch client + Zod validation schemas
 * - `rtk-query-zod`: Redux Toolkit Query + Zod validation schemas
 * - `next-fetch`: Next.js App Router compatible fetch client + Zod validation
 * - `python-basic`: Python dataclass types + requests client generation
 *
 * @public
 */
export type PresetName =
	/** React Query v5 + Zod validation + Axios client hooks with mutations */
	| "react-query-zod"
	/** React Query v5 + Yup validation + Axios client hooks with mutations */
	| "react-query-yup"
	/** SWR + Zod validation + Axios client hooks with mutations */
	| "swr-zod"
	/** SWR + Yup validation + Axios client hooks with mutations */
	| "swr-yup"
	/** Axios client + Zod validation schemas */
	| "axios-zod"
	/** Axios client + Joi validation schemas (Node.js/backend) */
	| "axios-joi"
	/** Native Fetch client + Zod validation schemas */
	| "fetch-zod"
	/** Redux Toolkit Query + Zod validation schemas */
	| "rtk-query-zod"
	/** Next.js App Router compatible fetch client + Zod validation */
	| "next-fetch"
	/** Python dataclass types + requests client generation */
	| "python-basic";

/**
 * Main configuration interface for openapi-sync
 *
 * This interface defines all top-level configuration options including
 * output settings, code generation options, and all feature configurations.
 * Used in openapi.sync.ts, openapi.sync.js, or openapi.sync.json files.
 *
 * @public
 */
export type IConfig = {
	/**
	 * Optional preset name. Applies opinionated defaults for a specific
	 * framework/library combination. User values always override preset defaults.
	 *
	 * - `react-query-zod`: React Query v5 + Zod schemas + Axios client hooks with mutations
	 * - `react-query-yup`: React Query v5 + Yup schemas + Axios client hooks with mutations
	 * - `swr-zod`: SWR + Zod schemas + Axios client hooks with mutations
	 * - `swr-yup`: SWR + Yup schemas + Axios client hooks with mutations
	 * - `axios-zod`: Axios client + Zod validation schemas
	 * - `axios-joi`: Axios client + Joi validation schemas
	 * - `fetch-zod`: Native Fetch client + Zod validation schemas
	 * - `rtk-query-zod`: Redux Toolkit Query + Zod validation schemas
	 * - `next-fetch`: Next.js App Router compatible fetch client + Zod validation
	 * - `python-basic`: Python dataclass types + requests client generation
	 *
	 * @example "react-query-zod"
	 */
	preset?: PresetName;
	language?: "typescript" | "python";
	refetchInterval?: number;
	folder?: string;
	api: Record<string, IApiSource>;
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
				defaultName: string,
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
				defaultName: string,
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
 * Type helper for defining an openapi-sync configuration.
 * Provides rich IDE autocompletion, hover tooltips, and type checking in TypeScript and JavaScript.
 *
 * @example
 * ```ts
 * // openapi.sync.ts
 * import { defineConfig } from "openapi-sync";
 *
 * export default defineConfig({
 *   preset: "react-query-zod",
 *   api: {
 *     petstore: "https://petstore3.swagger.io/api/v3/openapi.json",
 *   },
 * });
 * ```
 *
 * @param config - The openapi-sync configuration object
 * @returns The exact same configuration object with type guarantees
 * @public
 */
export function defineConfig(config: IConfig): IConfig {
	return config;
}

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

// ─────────────────────────────────────────────────────────────────────────────
// Programmatic API result types
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Summary of a single endpoint returned by {@link ListEndpoints}.
 *
 * AI agents can use this to understand the API surface before deciding which
 * client type to generate, or to filter endpoints by tag/method.
 *
 * @public
 */
export type EndpointSummary = {
	/** Camel-case function name used in generated code (e.g. `getPetById`) */
	name: string;
	/** HTTP method in uppercase (e.g. `"GET"`) */
	method: string;
	/** OpenAPI path (e.g. `"/pet/{petId}"`) */
	path: string;
	/** OpenAPI operation ID if present */
	operationId?: string;
	/** Preferred string identifier to pass to --endpoints (operationId if present, else name) */
	filterKey?: string;
	/** OpenAPI tags assigned to this endpoint */
	tags?: string[];
	/** Short human-readable summary from the OpenAPI spec */
	summary?: string;
};

/**
 * Structured result returned by {@link Init} and {@link GenerateClient}.
 *
 * When the CLI is invoked with `--json`, this object is serialized to stdout.
 * AI agents should parse this to determine success, discover written files,
 * and surface errors without screen-scraping emoji log lines.
 *
 * @example
 * ```ts
 * const result = await Init();
 * if (!result.success) {
 *   console.error(result.errors);
 * } else {
 *   console.log(`Wrote ${result.filesWritten.length} files`);
 * }
 * ```
 *
 * @public
 */
export type SyncResult = {
	/** Whether the operation completed without fatal errors */
	success: boolean;
	/** API name(s) that were processed */
	apis: string[];
	/**
	 * Absolute paths of all files written to disk.
	 * When called via {@link GenerateClient}, this includes both the spec-generated
	 * files (types, endpoints, schemas) **and** the client files (clients.ts, hooks.ts,
	 * api.ts, etc.).
	 */
	filesWritten: string[];
	/**
	 * Total number of generated endpoints across all processed APIs.
	 * Note: this reflects the count *after* applying include/exclude filters.
	 */
	endpointCount: number;
	/** Total number of endpoints discovered in the spec before filtering */
	totalEndpointCount?: number;
	/** Total number of endpoints included after applying tag/endpoint filters */
	filteredEndpointCount?: number;
	/** Non-fatal warnings (e.g. skipped endpoints, missing peer dependencies) */
	warnings: string[];
	/** Fatal or per-file error messages; non-empty when `success` is false */
	errors: string[];
	/**
	 * Breakdown of files written per operation phase.
	 * Only present when {@link GenerateClient} is called — not set by {@link Init}.
	 *
	 * @example
	 * if (result.phases) {
	 *   console.log('Spec files:', result.phases.sync.filesWritten);
	 *   console.log('Client files:', result.phases.client.filesWritten);
	 * }
	 */
	phases?: {
		/** Files written during the OpenAPI spec sync step */
		sync: { filesWritten: string[]; endpointCount: number; totalEndpointCount?: number };
		/** Files written during the client code generation step */
		client: {
			filesWritten: string[];
			endpointCount: number;
			totalEndpointCount?: number;
			filteredEndpointCount?: number;
		};
	};
	/**
	 * File paths that existed from a previous sync but were NOT written in this sync.
	 * These are candidates for deletion via `npx openapi-sync purge`.
	 */
	stalePaths?: string[];
};

/**
 * Structured result returned by {@link ValidateConfig}.
 *
 * Lets agents check configuration and spec validity before running a full sync.
 * No files are written to disk during validation.
 *
 * @public
 */
export type ValidationResult = {
	/** Whether the config file and all specs are valid */
	valid: boolean;
	/** Per-API validation results */
	apis: Record<
		string,
		{
			/** Whether this specific API's spec is valid and reachable */
			valid: boolean;
			/**
			 * Total number of operations (HTTP methods) found in the spec.
			 */
			operationCount?: number;
			/**
			 * @deprecated Alias for operationCount. Will be removed in v7.
			 */
			endpointCount: number;
			/** Error message if invalid */
			error?: string;
			/** Machine-readable error code (e.g. SPEC_FETCH_FAILED) */
			code?: string;
			/** HTTP status code if network fetch failed (e.g. 401, 403) */
			status?: number;
			/** Spec URL or file path */
			url?: string;
			/** Actionable recovery instructions */
			recovery?: string;
		}
	>;
	/** Config-level errors (missing fields, bad types, etc.) */
	configErrors: string[];
};

/**
 * Status of a single diagnostic check in `Doctor`.
 * @public
 */
export type DoctorCheckStatus = "pass" | "warn" | "fail";

/**
 * Single diagnostic check item returned by `Doctor`.
 * @public
 */
export type DoctorCheckItem = {
	id: string;
	name: string;
	status: DoctorCheckStatus;
	message: string;
	details?: any;
};

/**
 * Diagnostic health check report returned by `Doctor` / `openapi-sync doctor`.
 * @public
 */
export type DoctorResult = {
	healthy: boolean;
	checks: DoctorCheckItem[];
	recommendations: string[];
};

/**
 * Options for the programmatic Purge API.
 * @public
 */
export type PurgeOptions = {
	/** Delete files automatically. When false (default), just returns the list. */
	deleteFiles?: boolean;
	/** Alias for deleteFiles */
	yes?: boolean;
	/** Preview files that would be deleted without deleting them */
	dryRun?: boolean;
	/** Limit purge to a specific API name */
	apiName?: string;
	/** Override or provide auth credentials */
	auth?: ISpecAuth;
	/** Direct in-memory config */
	config?: IConfig;
	/** CLI flags to construct or override config */
	cliArgs?: Record<string, any>;
	/** Suppress console output */
	silent?: boolean;
};

/**
 * Result returned by the programmatic Purge API.
 * @public
 */
export type PurgeResult = {
	/** Whether the purge completed without errors */
	success: boolean;
	/** List of stale file paths identified */
	stalePaths: string[];
	/** List of file paths actually deleted */
	deleted: string[];
	/** Alias for deleted */
	purged: string[];
	/** Whether this was a dry run */
	dryRun?: boolean;
	/** Any error messages encountered during deletion */
	errors: string[];
	/** Human-readable status message */
	message?: string;
};

