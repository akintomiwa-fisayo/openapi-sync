import path from "path";
import fs from "fs";
import axios from "axios";
import SwaggerParser from "@apidevtools/swagger-parser";
import { IConfig, ValidationResult } from "../types";
import { isJson, yamlStringToJson } from "../helpers";

const rootUsingCwd = process.cwd();

/**
 * Load and return the raw config object from disk.
 * Shared with index.ts's loadConfig but kept internal here to avoid circular deps.
 * @internal
 */
const loadConfigForValidation = (): {
  config: IConfig | null;
  errors: string[];
} => {
  const jsConfigPath = path.join(rootUsingCwd, "openapi.sync.js");
  const tsConfigPath = path.join(rootUsingCwd, "openapi.sync.ts");
  const jsonConfigPath = path.join(rootUsingCwd, "openapi.sync.json");
  const configPaths = [jsConfigPath, tsConfigPath, jsonConfigPath];

  try {
    require("esbuild-register");
  } catch {
    // esbuild-register not available; JSON-only configs will still work
  }

  for (const configPath of configPaths) {
    if (!fs.existsSync(configPath)) continue;

    try {
      let configJS = require(configPath);
      if (Object.keys(configJS).length === 1 && configJS.default) {
        configJS = configJS.default;
      }
      if (typeof configJS === "function") configJS = configJS();
      return { config: configJS as IConfig, errors: [] };
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      return {
        config: null,
        errors: [`Failed to parse ${configPath}: ${msg}`],
      };
    }
  }

  return {
    config: null,
    errors: [
      `No config file found. Searched: ${configPaths.join(", ")}. ` +
        `Run \`npx openapi-sync init --no-interactive\` to create one.`,
    ],
  };
};

/**
 * Validate an individual API spec (URL or local file) without writing any files.
 * Returns the number of endpoints found, or an error string.
 * @internal
 */
const validateSpec = async (
  apiUrl: string,
  apiName: string
): Promise<{ endpointCount: number; error?: string }> => {
  let specData: any;

  try {
    const isUrl =
      apiUrl.startsWith("http://") || apiUrl.startsWith("https://");

    if (isUrl) {
      const response = await axios.get(apiUrl, { timeout: 15000 });
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
    const methods = ["get", "post", "put", "patch", "delete", "head", "options"];
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
}): Promise<ValidationResult> => {
  const silent = options?.silent ?? false;
  const log = silent
    ? { log: () => {}, warn: () => {}, error: () => {} }
    : { log: console.log, warn: console.warn, error: console.error };

  const result: ValidationResult = {
    valid: false,
    apis: {},
    configErrors: [],
  };

  // ── 1. Load and validate config file ──────────────────────────────────────
  const { config, errors: configErrors } = loadConfigForValidation();

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
      const apiUrl = config.api[apiName];
      log.log(`  🔎 ${apiName}: ${apiUrl}`);

      const { endpointCount, error } = await validateSpec(apiUrl, apiName);

      if (error) {
        result.apis[apiName] = { valid: false, endpointCount: 0, error };
        log.error(`  ❌ ${apiName}: ${error}`);
        allValid = false;
      } else {
        result.apis[apiName] = { valid: true, endpointCount };
        log.log(`  ✅ ${apiName}: ${endpointCount} endpoint(s) found`);
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
