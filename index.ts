import OpenapiSync from "./Openapi-sync";
import path from "path";
import fs from "fs";
import { resetState } from "./Openapi-sync/state";
import { IConfig, IConfigClientGeneration, SyncResult, ValidationResult, EndpointSummary } from "./types";
import {
  getStoredEndpoints,
  getAllStoredEndpoints,
} from "./Openapi-sync/endpoint-store";
import { generateClients } from "./Openapi-sync/client-generation";
import { EndpointInfo } from "./client-generators";
import {
  ConfigNotFoundError,
  ConfigParseError,
  UnknownApiError,
} from "./errors";

// Re-export modules for user consumption
export * from "./types";
export * from "./helpers";
export * from "./regex";
export * from "./errors";

const rootUsingCwd = process.cwd();

// ─────────────────────────────────────────────────────────────────────────────
// Internal helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Load configuration from openapi.sync file.
 *
 * Searches for configuration files in the following order:
 * - openapi.sync.js
 * - openapi.sync.ts
 * - openapi.sync.json
 *
 * @returns {IConfig} The loaded configuration object
 * @throws {ConfigNotFoundError} When no configuration file is found
 * @throws {ConfigParseError} When the configuration file cannot be parsed
 * @internal
 */
const loadConfig = (): IConfig => {
  const jsConfigPath = path.join(rootUsingCwd, "openapi.sync.js");
  const tsConfigPath = path.join(rootUsingCwd, "openapi.sync.ts");
  const jsonConfigPath = path.join(rootUsingCwd, "openapi.sync.json");
  const configPaths = [jsConfigPath, tsConfigPath, jsonConfigPath];

  // Register TypeScript loader before requiring the file
  try {
    require("esbuild-register");
  } catch (registerError) {
    throw registerError;
  }

  let configJS: any;
  let foundPath: string | undefined;

  for (const configPath of configPaths) {
    if (fs.existsSync(configPath)) {
      foundPath = configPath;
      try {
        configJS = require(configPath);
        if (Object.keys(configJS).length === 1 && configJS.default) {
          configJS = configJS.default;
        }
      } catch (e) {
        throw new ConfigParseError(configPath, e);
      }
      break; // Stop at first found config
    }
  }

  if (!foundPath) {
    throw new ConfigNotFoundError(configPaths);
  }

  if (typeof configJS === "function") {
    configJS = configJS();
  }

  const config: IConfig = configJS;

  if (!config) {
    throw new ConfigNotFoundError(configPaths);
  }

  return config;
};

/**
 * Lightweight logger that respects the `--silent` / `silent` option.
 * @internal
 */
const makeLogger = (silent: boolean) => ({
  log: (...args: any[]) => { if (!silent) console.log(...args); },
  info: (...args: any[]) => { if (!silent) console.info(...args); },
  warn: (...args: any[]) => { if (!silent) console.warn(...args); },
  error: (...args: any[]) => { if (!silent) console.error(...args); },
});

const filterAndPaginateEndpoints = (
  endpoints: EndpointInfo[],
  options?: {
    tags?: string[];
    pathContains?: string;
    limit?: number;
    offset?: number;
  }
): EndpointInfo[] => {
  let filtered = [...endpoints];

  if (options?.tags && options.tags.length > 0) {
    filtered = filtered.filter((ep) =>
      ep.tags?.some((tag) => options.tags!.includes(tag))
    );
  }

  if (options?.pathContains) {
    const needle = options.pathContains.toLowerCase();
    filtered = filtered.filter((ep) => ep.path.toLowerCase().includes(needle));
  }

  const offset = typeof options?.offset === "number" && options.offset >= 0 ? options.offset : 0;
  const limit = typeof options?.limit === "number" && options.limit >= 0 ? options.limit : undefined;

  if (offset > 0 || limit !== undefined) {
    return filtered.slice(offset, limit === undefined ? undefined : offset + limit);
  }

  return filtered;
};

// ─────────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Initialize and sync all OpenAPI specifications.
 *
 * Loads the configuration, resets state, and syncs all configured APIs to
 * generate TypeScript types, endpoint functions, and validation schemas.
 *
 * **Agent-safe** — call programmatically without any interactive prompts.
 * Returns a structured {@link SyncResult} that can be serialized to JSON.
 *
 * @param {Object} [options] - Optional configuration overrides
 * @param {number} [options.refetchInterval] - Auto-refetch interval in milliseconds
 * @param {boolean} [options.silent=false] - Suppress all console output (useful when the caller handles logging)
 * @returns {Promise<SyncResult>} Structured result describing files written and any errors
 * @throws {ConfigNotFoundError} When no config file is found in the working directory
 * @throws {ConfigParseError} When the config file cannot be parsed
 *
 * @example
 * // Sync once and check results
 * const result = await Init();
 * if (result.success) {
 *   console.log(`Wrote ${result.filesWritten.length} files for ${result.endpointCount} endpoints`);
 * }
 *
 * @example
 * // Sync silently and get JSON-serializable result
 * const result = await Init({ silent: true });
 * process.stdout.write(JSON.stringify(result));
 *
 * @example
 * // Sync with auto-refresh every 10 seconds
 * await Init({ refetchInterval: 10000 });
 *
 * @public
 */
export const Init = async (options?: {
  refetchInterval?: number;
  silent?: boolean;
}): Promise<SyncResult> => {
  const silent = options?.silent ?? false;
  const log = makeLogger(silent);
  const result: SyncResult = {
    success: false,
    apis: [],
    filesWritten: [],
    endpointCount: 0,
    warnings: [],
    errors: [],
  };

  try {
    const config = loadConfig();
    const apiNames = Object.keys(config.api);
    result.apis = apiNames;

    const refetchInterval =
      options &&
        "refetchInterval" in options &&
        !isNaN(options?.refetchInterval as number)
        ? options.refetchInterval
        : config.refetchInterval;

    resetState();

    for (let i = 0; i < apiNames.length; i += 1) {
      const apiName = apiNames[i];
      const apiUrl = config.api[apiName];

      log.log(`\n🔄 Syncing ${apiName}...`);
      try {
        const syncResult = await OpenapiSync(apiUrl, apiName, config, refetchInterval);

        if (syncResult && syncResult.filesWritten) {
          result.filesWritten.push(...syncResult.filesWritten);
        }
        if (syncResult && syncResult.warnings) {
          result.warnings.push(...syncResult.warnings);
          syncResult.warnings.forEach(w => log.warn(`⚠️  ${w}`));
        }

        const endpoints = getStoredEndpoints(apiName);
        result.endpointCount += endpoints.length;
        log.log(`✅ ${apiName}: ${endpoints.length} endpoints`);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        result.errors.push(`[${apiName}] ${msg}`);
        log.error(`❌ ${apiName}: ${msg}`);
      }
    }

    result.success = result.errors.length === 0;
    return result;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    result.errors.push(msg);
    log.error(`❌ Fatal error: ${msg}`);
    return result;
  }
};

/**
 * Generate a type-safe API client from synced OpenAPI specifications.
 *
 * Supports Fetch, Axios, React Query, SWR, and RTK Query. Runs a sync
 * first to collect up-to-date endpoint information, then generates client files.
 *
 * **Agent-safe** — fully non-interactive. Returns a structured {@link SyncResult}.
 *
 * @param {Object} options - Client generation options
 * @param {"fetch"|"axios"|"react-query"|"swr"|"rtk-query"} options.type - Client type to generate
 * @param {string} [options.apiName] - Specific API from config (generates for all if omitted)
 * @param {string[]} [options.tags] - Filter endpoints by OpenAPI tags
 * @param {string[]} [options.endpoints] - Filter by specific endpoint operation IDs
 * @param {string} [options.outputDir] - Custom output directory for generated client files
 * @param {string} [options.baseURL] - Base URL for API requests (baked into the generated client)
 * @param {boolean} [options.silent=false] - Suppress all console output
 * @returns {Promise<SyncResult>} Structured result describing files written and any errors
 * @throws {ConfigNotFoundError} When no config file is found
 * @throws {UnknownApiError} When the specified apiName is not in config
 *
 * @example
 * // Generate Axios client for all APIs
 * const result = await GenerateClient({ type: "axios" });
 *
 * @example
 * // Generate React Query hooks for a specific API
 * const result = await GenerateClient({
 *   type: "react-query",
 *   apiName: "petstore",
 *   baseURL: "https://api.example.com",
 *   silent: true,
 * });
 * console.log(JSON.stringify(result));
 *
 * @example
 * // Generate SWR hooks for specific endpoints only
 * const result = await GenerateClient({
 *   type: "swr",
 *   endpoints: ["getPetById", "createPet"],
 * });
 *
 * @public
 */
export const GenerateClient = async (options: {
  type: "fetch" | "axios" | "react-query" | "swr" | "rtk-query";
  apiName?: string;
  tags?: string[];
  endpoints?: string[];
  outputDir?: string;
  baseURL?: string;
  silent?: boolean;
  useCache?: boolean;
}): Promise<SyncResult> => {
  const silent = options.silent ?? false;
  const log = makeLogger(silent);

  const result: SyncResult = {
    success: false,
    apis: [],
    filesWritten: [],
    endpointCount: 0,
    warnings: [],
    errors: [],
  };

  try {
    log.log("\n🔄 Loading configuration...");
    const config = loadConfig();

    const apiNames = options.apiName
      ? [options.apiName]
      : Object.keys(config.api);
    result.apis = apiNames;

    // Validate API names
    for (const apiName of apiNames) {
      if (!config.api[apiName]) {
        throw new UnknownApiError(apiName, Object.keys(config.api));
      }
    }

    // Sync APIs to collect endpoints
    log.log("🔄 Syncing OpenAPI specifications...");
    resetState();
    for (const apiName of apiNames) {
      const apiUrl = config.api[apiName];
      const cachedEndpoints = getStoredEndpoints(apiName);
      const shouldUseCache = Boolean(options.useCache && cachedEndpoints.length > 0);

      if (shouldUseCache) {
        log.log(`♻️ Using cached endpoints for ${apiName}`);
        continue;
      }

      const syncResult = await OpenapiSync(apiUrl, apiName, config);
      if (syncResult && syncResult.warnings) {
        result.warnings.push(...syncResult.warnings);
      }
      if (syncResult && syncResult.filesWritten) {
        // Technically these are just the spec-generated files, not the clients,
        // but it's good to track them.
        result.filesWritten.push(...syncResult.filesWritten);
      }
    }

    // Generate clients for each API
    const folderPath = config?.folder || "api";

    for (const apiName of apiNames) {
      const endpoints = getStoredEndpoints(apiName);

      if (endpoints.length === 0) {
        const warn = `No endpoints found for API: ${apiName}`;
        result.warnings.push(warn);
        log.warn(`⚠️  ${warn}`);
        continue;
      }

      result.endpointCount += endpoints.length;
      log.log(`\n📋 Found ${endpoints.length} endpoint(s) for ${apiName}`);

      const clientConfig: IConfigClientGeneration = {
        enabled: true,
        ...(config.clientGeneration || {}),
        type: options.type,
        ...(options.outputDir && { outputDir: options.outputDir }),
        ...(options.baseURL && { baseURL: options.baseURL }),
        ...(options.tags && { tags: options.tags }),
        ...(options.endpoints && { endpoints: options.endpoints }),
      };

      await generateClients(
        endpoints,
        config,
        clientConfig,
        apiName,
        path.join(rootUsingCwd, folderPath)
      );
    }

    log.log("\n✨ All clients generated successfully!\n");
    result.success = result.errors.length === 0;
    return result;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    result.errors.push(msg);
    log.error(`❌ Error: ${msg}`);
    return result;
  }
};

/**
 * Validate the config file and all configured API specs without writing any files.
 *
 * Use this as a pre-flight check before running {@link Init} or {@link GenerateClient}.
 * Safe to run repeatedly — it has no side effects.
 *
 * **Agent-safe** — fully non-interactive. Returns a structured {@link ValidationResult}.
 *
 * @param {Object} [options]
 * @param {boolean} [options.silent=false] - Suppress console output
 * @returns {Promise<ValidationResult>} Structured validation report
 *
 * @example
 * // Validate before syncing
 * const validation = await ValidateConfig();
 * if (!validation.valid) {
 *   console.error("Config errors:", validation.configErrors);
 *   for (const [api, info] of Object.entries(validation.apis)) {
 *     if (!info.valid) console.error(`  ${api}: ${info.error}`);
 *   }
 *   process.exit(1);
 * }
 * await Init();
 *
 * @public
 */
export const ValidateConfig = async (options?: {
  silent?: boolean;
}): Promise<ValidationResult> => {
  const { validateConfig } = await import("./Openapi-sync/validate");
  return validateConfig(options);
};

/**
 * List all endpoints discovered in the configured API specs.
 *
 * Fetches and parses specs, then returns a flat array of endpoint summaries.
 * No files are written. Use this to understand the API surface before
 * deciding which client type or tag filters to apply.
 *
 * **Agent-safe** — fully non-interactive.
 *
 * @param {Object} [options]
 * @param {string} [options.apiName] - Limit to a specific API (lists all if omitted)
 * @param {string[]} [options.tags] - Filter endpoints by OpenAPI tags
 * @param {boolean} [options.silent=false] - Suppress console output
 * @returns {Promise<Record<string, EndpointSummary[]>>} Map of API name → endpoint summaries
 *
 * @example
 * // List all endpoints across all APIs
 * const endpoints = await ListEndpoints();
 * for (const [api, list] of Object.entries(endpoints)) {
 *   console.log(`${api}: ${list.length} endpoints`);
 *   list.forEach(e => console.log(`  ${e.method} ${e.path} — ${e.summary}`));
 * }
 *
 * @example
 * // List only GET endpoints for the petstore API
 * const result = await ListEndpoints({ apiName: "petstore", tags: ["pet"] });
 *
 * @public
 */
export const ListEndpoints = async (options?: {
  apiName?: string;
  tags?: string[];
  silent?: boolean;
  useCache?: boolean;
  limit?: number;
  offset?: number;
  pathContains?: string;
}): Promise<Record<string, EndpointSummary[]>> => {
  const silent = options?.silent ?? false;
  const log = makeLogger(silent);

  try {
    const config = loadConfig();
    const apiNames = options?.apiName
      ? [options.apiName]
      : Object.keys(config.api);

    if (options?.apiName && !config.api[options.apiName]) {
      throw new UnknownApiError(options.apiName, Object.keys(config.api));
    }

    resetState();
    for (const apiName of apiNames) {
      const apiUrl = config.api[apiName];
      const cachedEndpoints = getStoredEndpoints(apiName);
      const shouldUseCache = Boolean(options?.useCache && cachedEndpoints.length > 0);

      if (shouldUseCache) {
        log.log(`♻️ Using cached endpoints for ${apiName}...`);
        continue;
      }

      log.log(`🔍 Fetching spec for ${apiName}...`);
      await OpenapiSync(apiUrl, apiName, config);
    }

    const result: Record<string, EndpointSummary[]> = {};

    for (const apiName of apiNames) {
      let endpoints = getStoredEndpoints(apiName);

      endpoints = filterAndPaginateEndpoints(endpoints, {
        tags: options?.tags,
        pathContains: options?.pathContains,
        limit: options?.limit,
        offset: options?.offset,
      });

      result[apiName] = endpoints.map((ep) => ({
        name: ep.name,
        method: ep.method.toUpperCase(),
        path: ep.path,
        operationId: ep.operationId,
        tags: ep.tags,
        summary: ep.summary,
      }));

      log.log(`✅ ${apiName}: ${result[apiName].length} endpoint(s)`);
    }

    return result;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    log.error(`❌ Error: ${msg}`);
    throw err;
  }
};

export const GetEndpointDetails = async (options?: {
  apiName?: string;
  operationId?: string;
  name?: string;
  silent?: boolean;
}): Promise<{ apiName: string; endpoint: EndpointInfo }> => {
  const silent = options?.silent ?? false;
  const log = makeLogger(silent);

  try {
    if (!options?.operationId && !options?.name) {
      throw new Error("Provide either operationId or name to look up endpoint details.");
    }

    const config = loadConfig();
    const apiNames = options?.apiName
      ? [options.apiName]
      : Object.keys(config.api);

    if (options?.apiName && !config.api[options.apiName]) {
      throw new UnknownApiError(options.apiName, Object.keys(config.api));
    }

    for (const apiName of apiNames) {
      const apiUrl = config.api[apiName];
      let endpoints = getStoredEndpoints(apiName);

      if (endpoints.length === 0) {
        log.log(`🔍 Fetching spec for ${apiName} to locate endpoint details...`);
        await OpenapiSync(apiUrl, apiName, config);
        endpoints = getStoredEndpoints(apiName);
      }

      const match = endpoints.find((ep) => {
        const byOperationId = Boolean(options?.operationId && ep.operationId === options.operationId);
        const byName = Boolean(options?.name && ep.name === options.name);
        return byOperationId || byName;
      });

      if (match) {
        return {
          apiName,
          endpoint: match,
        };
      }
    }

    const target = options?.operationId || options?.name || "requested endpoint";
    throw new Error(`No endpoint found for ${target}`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    log.error(`❌ Error: ${msg}`);
    throw err;
  }
};

export const ReadGeneratedType = async (options: {
  apiName: string;
  typeName: string;
  silent?: boolean;
}): Promise<string> => {
  const silent = options.silent ?? false;
  const log = makeLogger(silent);

  try {
    const config = loadConfig();

    if (!config.api[options.apiName]) {
      throw new UnknownApiError(options.apiName, Object.keys(config.api));
    }

    const candidates = [
      path.join(rootUsingCwd, config?.folder || "", options.apiName, "types/index.ts"),
      path.join(rootUsingCwd, config?.folder || "", options.apiName, "types.ts"),
      path.join(rootUsingCwd, config?.folder || "", options.apiName, "index.ts"),
    ];

    const filePath = candidates.find((candidate) => fs.existsSync(candidate));
    if (!filePath) {
      throw new Error(`Generated types file not found for API: ${options.apiName}`);
    }

    const content = await fs.promises.readFile(filePath, "utf-8");
    const escapedName = options.typeName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const declarationPattern = new RegExp(
      `export\\s+(?:type|interface)\\s+${escapedName}\\b[\\s\\S]*?(?=\\n(?:export\\s+(?:type|interface|const|function|class|enum)\\b|$))`,
      "m"
    );
    const match = content.match(declarationPattern);

    if (!match) {
      throw new Error(`Type declaration not found: ${options.typeName}`);
    }

    return match[0].trim();
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    log.error(`❌ Error: ${msg}`);
    throw err;
  }
};

/**
 * Interactive CLI wizard to create configuration.
 *
 * Launches an interactive command-line wizard that guides users through
 * creating an `openapi.sync` configuration file.
 *
 * > ⚠️ **Not agent-safe** — this function blocks on stdin prompts.
 * > AI agents should use the CLI with `--no-interactive` instead:
 * > ```bash
 * > npx openapi-sync init --no-interactive --api-name myapi --api-url https://...
 * > ```
 *
 * @returns {Promise<void>}
 * @throws {Error} When wizard is cancelled or configuration creation fails
 *
 * @example
 * // Human-interactive setup
 * await InteractiveInit();
 *
 * @public
 * @interactiveOnly
 */
export const InteractiveInit = async (): Promise<void> => {
  const { interactiveInit } = await import("./Openapi-sync/interactive-init");
  await interactiveInit();
};
