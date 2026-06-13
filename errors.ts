/**
 * @fileoverview Typed error classes for openapi-sync.
 *
 * Each error class exposes a stable `code` string so that AI agents and
 * programmatic consumers can reliably branch on error type without parsing
 * human-readable messages.
 *
 * When the CLI is invoked with `--json`, errors are serialized to:
 * ```json
 * { "success": false, "error": { "code": "SPEC_FETCH_FAILED", "message": "...", "url": "..." } }
 * ```
 *
 * @public
 */

/**
 * Base class for all openapi-sync errors.
 *
 * @public
 */
export abstract class OpenApiSyncError extends Error {
  abstract readonly code: string;

  /**
   * Serialize this error to a plain object suitable for JSON output.
   * @returns Plain object with `code`, `message`, and any extra fields.
   */
  toJSON(): Record<string, unknown> {
    return {
      code: this.code,
      message: this.message,
    };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Configuration errors
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Thrown when no configuration file (`openapi.sync.ts/js/json`) is found
 * in the current working directory.
 *
 * @example
 * // Agent can catch and suggest a fix:
 * catch (e) {
 *   if (e instanceof ConfigNotFoundError) {
 *     // run: npx openapi-sync init --no-interactive --api-name X --api-url Y
 *   }
 * }
 *
 * @public
 */
export class ConfigNotFoundError extends OpenApiSyncError {
  readonly code = "CONFIG_NOT_FOUND" as const;

  constructor(searchedPaths: string[]) {
    super(
      `No openapi-sync config file found. Searched: ${searchedPaths.join(", ")}. ` +
        `Run \`npx openapi-sync init --no-interactive\` to create one.`
    );
    this.name = "ConfigNotFoundError";
  }

  override toJSON() {
    return { ...super.toJSON(), searchedPaths: this.message };
  }
}

/**
 * Thrown when the configuration file exists but fails to parse or export a
 * valid config object.
 *
 * @public
 */
export class ConfigParseError extends OpenApiSyncError {
  readonly code = "CONFIG_PARSE_FAILED" as const;
  readonly configPath: string;

  constructor(configPath: string, cause: unknown) {
    const causeMsg = cause instanceof Error ? cause.message : String(cause);
    super(`Failed to parse config file "${configPath}": ${causeMsg}`);
    this.name = "ConfigParseError";
    this.configPath = configPath;
  }

  override toJSON() {
    return { ...super.toJSON(), configPath: this.configPath };
  }
}

/**
 * Thrown when the config object is missing required fields or contains
 * invalid values (e.g., empty `api` map, unsupported client type).
 *
 * @public
 */
export class ConfigValidationError extends OpenApiSyncError {
  readonly code = "CONFIG_INVALID" as const;
  readonly field: string;

  constructor(field: string, reason: string) {
    super(`Invalid configuration at "${field}": ${reason}`);
    this.name = "ConfigValidationError";
    this.field = field;
  }

  override toJSON() {
    return { ...super.toJSON(), field: this.field };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Network / spec errors
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Thrown when fetching an OpenAPI spec from a URL fails (network error,
 * timeout, non-2xx response, etc.).
 *
 * @public
 */
export class SpecFetchError extends OpenApiSyncError {
  readonly code = "SPEC_FETCH_FAILED" as const;
  readonly url: string;
  readonly statusCode?: number;

  constructor(url: string, cause: unknown, statusCode?: number) {
    const causeMsg = cause instanceof Error ? cause.message : String(cause);
    super(
      `Failed to fetch OpenAPI spec from "${url}": ${causeMsg}` +
        (statusCode ? ` (HTTP ${statusCode})` : "")
    );
    this.name = "SpecFetchError";
    this.url = url;
    this.statusCode = statusCode;
  }

  override toJSON() {
    return {
      ...super.toJSON(),
      url: this.url,
      ...(this.statusCode !== undefined && { statusCode: this.statusCode }),
    };
  }
}

/**
 * Thrown when reading a local OpenAPI spec file fails (file not found,
 * permission denied, etc.).
 *
 * @public
 */
export class SpecReadError extends OpenApiSyncError {
  readonly code = "SPEC_READ_FAILED" as const;
  readonly filePath: string;

  constructor(filePath: string, cause: unknown) {
    const causeMsg = cause instanceof Error ? cause.message : String(cause);
    super(`Failed to read local OpenAPI spec from "${filePath}": ${causeMsg}`);
    this.name = "SpecReadError";
    this.filePath = filePath;
  }

  override toJSON() {
    return { ...super.toJSON(), filePath: this.filePath };
  }
}

/**
 * Thrown when the OpenAPI spec is fetched/read successfully but fails to
 * parse or validate as a valid OpenAPI document.
 *
 * @public
 */
export class SpecParseError extends OpenApiSyncError {
  readonly code = "SPEC_PARSE_FAILED" as const;
  readonly api: string;

  constructor(api: string, cause: unknown) {
    const causeMsg = cause instanceof Error ? cause.message : String(cause);
    super(`Failed to parse OpenAPI spec for API "${api}": ${causeMsg}`);
    this.name = "SpecParseError";
    this.api = api;
  }

  override toJSON() {
    return { ...super.toJSON(), api: this.api };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Generation errors
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Thrown when writing a generated file to disk fails.
 *
 * @public
 */
export class GenerationError extends OpenApiSyncError {
  readonly code = "GENERATION_FAILED" as const;
  readonly file: string;
  readonly api: string;

  constructor(file: string, api: string, cause: unknown) {
    const causeMsg = cause instanceof Error ? cause.message : String(cause);
    super(`Failed to write generated file "${file}" for API "${api}": ${causeMsg}`);
    this.name = "GenerationError";
    this.file = file;
    this.api = api;
  }

  override toJSON() {
    return { ...super.toJSON(), file: this.file, api: this.api };
  }
}

/**
 * Thrown when an API name specified by the user (e.g. via `--api`) does not
 * exist in the config file.
 *
 * @public
 */
export class UnknownApiError extends OpenApiSyncError {
  readonly code = "UNKNOWN_API" as const;
  readonly requestedApi: string;
  readonly availableApis: string[];

  constructor(requestedApi: string, availableApis: string[]) {
    super(
      `API "${requestedApi}" not found in config. Available APIs: ${availableApis.join(", ")}`
    );
    this.name = "UnknownApiError";
    this.requestedApi = requestedApi;
    this.availableApis = availableApis;
  }

  override toJSON() {
    return {
      ...super.toJSON(),
      requestedApi: this.requestedApi,
      availableApis: this.availableApis,
    };
  }
}
