import OpenapiSync from "./Openapi-sync";
import path from "path";
import fs from "fs";
import { resetState } from "./Openapi-sync/state";
import { IConfig, IConfigClientGeneration } from "./types";
import {
  getStoredEndpoints,
  getAllStoredEndpoints,
} from "./Openapi-sync/endpoint-store";
import { generateClients } from "./Openapi-sync/client-generation";

// Re-export modules for user consumption
export * from "./types";
export * from "./helpers";
export * from "./regex";

const rootUsingCwd = process.cwd();

/**
 * Load configuration from openapi.sync file
 *
 * Searches for configuration files in the following order:
 * - openapi.sync.js
 * - openapi.sync.ts
 * - openapi.sync.json
 *
 * @returns {IConfig} The loaded configuration object
 * @throws {Error} When no configuration file is found or configuration is invalid
 * @internal
 */
const loadConfig = (): IConfig => {
  let configJS;
  // Register TypeScript loader before requiring the file
  try {
    require("esbuild-register");
  } catch (registerError) {
    throw registerError;
  }

  const jsConfigPath = path.join(rootUsingCwd, "openapi.sync.js");
  const tsConfigPath = path.join(rootUsingCwd, "openapi.sync.ts");
  const jsonConfigPath = path.join(rootUsingCwd, "openapi.sync.json");
  const configPaths = [jsConfigPath, tsConfigPath, jsonConfigPath];

  try {
    for (const configPath of configPaths) {
      if (fs.existsSync(configPath)) {
        configJS = require(configPath);

        if (Object.keys(configJS).length === 1 && configJS.default) {
          configJS = configJS.default;
        }
      }
    }
  } catch (e) {
    console.log(e);
  }

  if (typeof configJS === "function") {
    configJS = configJS();
  }

  const config: IConfig = configJS;

  if (!config) {
    throw new Error("No config found");
  }

  return config;
};

/**
 * Initialize and sync all OpenAPI specifications
 *
 * This is the main entry point for the OpenAPI sync process. It loads the configuration,
 * resets the state, and syncs all configured APIs to generate types, endpoints, and validations.
 *
 * @param {Object} [options] - Optional configuration
 * @param {number} [options.refetchInterval] - Interval in milliseconds to automatically refetch specifications
 * @returns {Promise<void>}
 * @throws {Error} When configuration is not found or sync fails
 *
 * @example
 * // Sync once
 * await Init();
 *
 * @example
 * // Sync with auto-refresh every 10 seconds
 * await Init({ refetchInterval: 10000 });
 *
 * @public
 */
export const Init = async (options?: { refetchInterval?: number }) => {
  const config = loadConfig();
  const apiNames = Object.keys(config.api);
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

    await OpenapiSync(apiUrl, apiName, config, refetchInterval);
  }
};

/**
 * Generate API client from OpenAPI specification
 *
 * Generates type-safe API clients based on OpenAPI specifications. Supports multiple
 * client types including Fetch, Axios, React Query, SWR, and RTK Query. Can filter
 * endpoints by tags or specific endpoint names.
 *
 * @param {Object} options - Client generation options
 * @param {"fetch" | "axios" | "react-query" | "swr" | "rtk-query"} options.type - Type of client to generate
 * @param {string} [options.apiName] - Specific API name to generate client for (generates for all if not specified)
 * @param {string[]} [options.tags] - Filter endpoints by OpenAPI tags
 * @param {string[]} [options.endpoints] - Filter by specific endpoint operation IDs
 * @param {string} [options.outputDir] - Custom output directory for generated client
 * @param {string} [options.baseURL] - Base URL for API requests
 * @returns {Promise<void>}
 * @throws {Error} When API name is not found in configuration or sync fails
 *
 * @example
 * // Generate Axios client for all APIs
 * await GenerateClient({ type: "axios" });
 *
 * @example
 * // Generate React Query hooks for a specific API
 * await GenerateClient({
 *   type: "react-query",
 *   apiName: "petstore",
 *   baseURL: "https://api.example.com"
 * });
 *
 * @example
 * // Generate SWR hooks for specific endpoints
 * await GenerateClient({
 *   type: "swr",
 *   endpoints: ["getPetById", "createPet"]
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
}) => {
  console.log("\n🔄 Loading configuration...");
  const config = loadConfig();

  // First, sync the APIs to collect endpoint information
  console.log("🔄 Syncing OpenAPI specifications...");
  const apiNames = options.apiName
    ? [options.apiName]
    : Object.keys(config.api);

  // Validate API names
  for (const apiName of apiNames) {
    if (!config.api[apiName]) {
      throw new Error(
        `API "${apiName}" not found in configuration. Available APIs: ${Object.keys(
          config.api
        ).join(", ")}`
      );
    }
  }

  // Sync APIs to collect endpoints
  resetState();
  for (const apiName of apiNames) {
    const apiUrl = config.api[apiName];
    await OpenapiSync(apiUrl, apiName, config);
  }

  // Generate clients for each API
  const folderPath = config?.folder || "api";

  for (const apiName of apiNames) {
    const endpoints = getStoredEndpoints(apiName);

    if (endpoints.length === 0) {
      console.log(`⚠️  No endpoints found for API: ${apiName}`);
      continue;
    }

    console.log(`\n📋 Found ${endpoints.length} endpoint(s) for ${apiName}`);

    // Build client config from options and base config
    // Spread base config first, then apply CLI options to ensure CLI takes precedence
    const clientConfig: IConfigClientGeneration = {
      enabled: true,
      ...(config.clientGeneration || {}),
      // CLI options override config file settings
      type: options.type,
      ...(options.outputDir && { outputDir: options.outputDir }),
      ...(options.baseURL && { baseURL: options.baseURL }),
      ...(options.tags && { tags: options.tags }),
      ...(options.endpoints && { endpoints: options.endpoints }),
    };

    // Generate the client
    await generateClients(
      endpoints,
      config,
      clientConfig,
      apiName,
      path.join(rootUsingCwd, folderPath)
    );
  }

  console.log("\n✨ All clients generated successfully!\n");
};

/**
 * Interactive CLI wizard to create configuration
 *
 * Launches an interactive command-line wizard that guides users through
 * creating an openapi.sync configuration file. Prompts for API URLs,
 * output directories, client generation preferences, and more.
 *
 * @returns {Promise<void>}
 * @throws {Error} When wizard is cancelled or configuration creation fails
 *
 * @example
 * // Run the interactive setup wizard
 * await InteractiveInit();
 *
 * @public
 */
export const InteractiveInit = async (): Promise<void> => {
  const { interactiveInit } = await import("./Openapi-sync/interactive-init");
  await interactiveInit();
};
