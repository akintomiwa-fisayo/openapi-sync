import path from "path";
import fs from "fs";
import axios from "axios";
import SwaggerParser from "@apidevtools/swagger-parser";
import { IApiSource, IConfig, ISpecAuth, ValidationResult } from "../types";
import { isJson, yamlStringToJson } from "../helpers";
import { buildAuthConfig, extractApiUrl, extractApiAuth } from "./spec-auth";
import { SpecFetchError } from "../errors";

const rootUsingCwd = process.cwd();

import { tryLoadConfig } from "./config-loader";
import { makeLogger } from "../logger";

/**
 * Load and return the raw config object from disk.
 * Shared with index.ts's loadConfig but kept internal here to avoid circular deps.
 * @internal
 */
const loadConfigForValidation = (cliArgs?: Record<string, any>): {
  config: IConfig | null;
  errors: string[];
} => {
  const result = tryLoadConfig(undefined, cliArgs);
  if (!result.config) {
    return {
      config: null,
      errors: [result.error || "No openapi.sync configuration file found."],
    };
  }
  return { config: result.config, errors: [] };
};

/**
 * Validate an individual API spec (URL or local file) without writing any files.
 * Returns the number of endpoints found, or an error string.
 * @internal
 */
const validateSpec = async (
  apiSource: IApiSource,
  apiName: string
): Promise<{
  endpointCount: number;
  error?: string;
  code?: string;
  status?: number;
  url?: string;
  recovery?: string;
}> => {
  let specData: any;
  const apiUrl = extractApiUrl(apiSource);

  try {
    const specAuth = extractApiAuth(apiSource);
    const isUrl =
      apiUrl.startsWith("http://") || apiUrl.startsWith("https://");

    if (isUrl) {
      const authConfig = buildAuthConfig(specAuth);
      const response = await axios.get(apiUrl, { timeout: 15000, ...authConfig });
      specData = response.data;
    } else {
      const filePath = path.isAbsolute(apiUrl)
        ? apiUrl
        : path.join(rootUsingCwd, apiUrl);
      const content = await fs.promises.readFile(filePath, "utf-8");
      specData = content;
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const isUrl = apiUrl.startsWith("http://") || apiUrl.startsWith("https://");
    if (isUrl) {
      const fetchErr = new SpecFetchError(apiUrl, err);
      return {
        endpointCount: 0,
        error: `Could not fetch/read spec: ${msg}`,
        code: fetchErr.code,
        status: fetchErr.status,
        url: apiUrl,
        recovery: fetchErr.recovery,
      };
    }
    return { endpointCount: 0, error: `Could not fetch/read spec: ${msg}` };
  }

  let spec: any;
  try {
    const source = isJson(specData) ? specData : yamlStringToJson(specData);
    spec = await SwaggerParser.parse(source);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { endpointCount: 0, error: `Could not parse spec: ${msg}` };
  }

  // Count endpoints
  let endpointCount = 0;
  const paths = spec?.paths || {};
  for (const pathKey of Object.keys(paths)) {
    const methods = ["get", "post", "put", "patch", "delete", "head", "options", "trace"];
    for (const method of methods) {
      if (paths[pathKey]?.[method]) endpointCount++;
    }
  }

  return { endpointCount };
};

/**
 * Validate the openapi-sync config and all configured API specs without writing
 * any files to disk.
 *
 * This is the implementation backing {@link ValidateConfig} in `index.ts`.
 * Kept in a separate module to keep the validate path lightweight and to allow
 * future use from the CLI `validate` command without importing the full sync engine.
 *
 * @param {Object} [options]
 * @param {boolean} [options.silent=false] - Suppress console output
 * @returns {Promise<ValidationResult>}
 *
 * @internal
 */
export const validateConfig = async (options?: {
  silent?: boolean;
  auth?: ISpecAuth;
  config?: IConfig;
  cliArgs?: Record<string, any>;
}): Promise<ValidationResult> => {
  const silent = options?.silent ?? false;
  const log = makeLogger(silent);

  const result: ValidationResult = {
    valid: false,
    apis: {},
    configErrors: [],
  };

  // ── 1. Load and validate config file ──────────────────────────────────────
  let config: IConfig | null = options?.config || null;
  let configErrors: string[] = [];

  if (!config) {
    const loaded = loadConfigForValidation(options?.cliArgs);
    config = loaded.config;
    configErrors = loaded.errors;
  }

  if (configErrors.length > 0) {
    result.configErrors = configErrors;
    log.error(`❌ Config errors:\n${configErrors.map((e) => `  • ${e}`).join("\n")}`);
    return result;
  }

  if (!config) {
    result.configErrors = ["Config loaded but is empty or null."];
    return result;
  }

  // ── 2. Validate required fields ────────────────────────────────────────────
  if (!config.api || Object.keys(config.api).length === 0) {
    result.configErrors.push(
      'Config must have at least one API defined under the "api" key.'
    );
  }

  if (result.configErrors.length > 0) {
    log.error(`❌ Config validation errors:\n${result.configErrors.map((e) => `  • ${e}`).join("\n")}`);
    return result;
  }

  // ── 3. Validate each API spec ──────────────────────────────────────────────
  const apiNames = Object.keys(config.api);
  log.log(`\n🔍 Validating ${apiNames.length} API spec(s)...\n`);

  let allValid = true;

  await Promise.all(
    apiNames.map(async (apiName) => {
      let apiSource = config.api[apiName];
      if (options?.auth) {
        const url = extractApiUrl(apiSource);
        apiSource = { url, auth: options.auth };
      }
      const apiUrl = extractApiUrl(apiSource);
      log.log(`  🔎 ${apiName}: ${apiUrl}`);

      const specResult = await validateSpec(apiSource, apiName);

      if (specResult.error) {
        result.apis[apiName] = {
          valid: false,
          endpointCount: 0,
          operationCount: 0,
          error: specResult.error,
          ...(specResult.code && { code: specResult.code }),
          ...(specResult.status !== undefined && { status: specResult.status }),
          ...(specResult.url && { url: specResult.url }),
          ...(specResult.recovery && { recovery: specResult.recovery }),
        };
        log.error(`  ❌ ${apiName}: ${specResult.error}`);
        if (specResult.recovery) {
          log.warn(`     💡 Recovery: ${specResult.recovery}`);
        }
        allValid = false;
      } else {
        result.apis[apiName] = { valid: true, endpointCount: specResult.endpointCount, operationCount: specResult.endpointCount };
        log.log(`  ✅ ${apiName}: ${specResult.endpointCount} endpoint(s) found`);
      }
    })
  );

  result.valid = allValid && result.configErrors.length === 0;

  if (result.valid) {
    log.log("\n✅ All checks passed — config and specs are valid.\n");
  } else {
    log.error("\n❌ Validation failed — see errors above.\n");
  }

  return result;
};
