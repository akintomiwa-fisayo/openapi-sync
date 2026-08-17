import fs from "fs";
import path from "path";
import * as esbuild from "esbuild";
import { IConfig } from "../types";
import { ConfigNotFoundError, ConfigParseError } from "../errors";

const rootUsingCwd = process.cwd();

export interface LoadedConfigResult {
  config: IConfig | null;
  foundPath?: string;
  error?: string;
}

/**
 * Parses and evaluates JavaScript or TypeScript configuration content in memory.
 * Uses esbuild.transformSync for TypeScript to avoid ESM dynamic require issues.
 */
export const evaluateConfigContent = (
  rawContent: string,
  filePath: string
): any => {
  if (filePath.endsWith(".json")) {
    return JSON.parse(rawContent);
  }

  let codeToRun = rawContent;

  if (filePath.endsWith(".ts")) {
    const transformed = esbuild.transformSync(rawContent, {
      loader: "ts",
      format: "cjs",
      target: "node16",
    });
    codeToRun = transformed.code;
  }

  // Evaluate CommonJS code in a sandbox function
  try {
    const fn = new Function("module", "exports", "require", "__filename", "__dirname", codeToRun);
    const customModule = { exports: {} as any };
    fn(
      customModule,
      customModule.exports,
      typeof require !== "undefined" ? require : () => ({}),
      filePath,
      path.dirname(filePath)
    );

    let result = customModule.exports;
    if (result && typeof result === "object" && Object.keys(result).length === 1 && result.default) {
      result = result.default;
    }
    if (typeof result === "function") {
      result = result();
    }
    return result;
  } catch (evalErr) {
    // If running in CommonJS environment, try standard require with cache-clearing
    if (typeof require !== "undefined") {
      try {
        delete require.cache[filePath];
        try {
          delete require.cache[require.resolve(filePath)];
        } catch (_) {}
        let required = require(filePath);
        if (required && typeof required === "object" && Object.keys(required).length === 1 && required.default) {
          required = required.default;
        }
        if (typeof required === "function") {
          required = required();
        }
        return required;
      } catch (_) {}
    }
    throw evalErr;
  }
};

/**
 * Attempts to load configuration without throwing.
 */
export const tryLoadConfig = (customCwd?: string): LoadedConfigResult => {
  const cwd = customCwd || rootUsingCwd;
  const jsConfigPath = path.join(cwd, "openapi.sync.js");
  const tsConfigPath = path.join(cwd, "openapi.sync.ts");
  const jsonConfigPath = path.join(cwd, "openapi.sync.json");
  const configPaths = [jsConfigPath, tsConfigPath, jsonConfigPath];

  let foundPath: string | undefined;
  for (const cp of configPaths) {
    if (fs.existsSync(cp)) {
      foundPath = cp;
      break;
    }
  }

  if (!foundPath) {
    return { config: null, error: "No openapi.sync configuration file found." };
  }

  try {
    const raw = fs.readFileSync(foundPath, "utf-8");
    const parsed = evaluateConfigContent(raw, foundPath);
    return { config: parsed as IConfig, foundPath };
  } catch (err: any) {
    const msg = err instanceof Error ? err.message : String(err);
    return { config: null, foundPath, error: `Failed to parse ${path.basename(foundPath)}: ${msg}` };
  }
};

/**
 * Loads configuration or throws appropriate errors.
 */
export const loadConfig = (customCwd?: string): IConfig => {
  const cwd = customCwd || rootUsingCwd;
  const jsConfigPath = path.join(cwd, "openapi.sync.js");
  const tsConfigPath = path.join(cwd, "openapi.sync.ts");
  const jsonConfigPath = path.join(cwd, "openapi.sync.json");
  const configPaths = [jsConfigPath, tsConfigPath, jsonConfigPath];

  const result = tryLoadConfig(customCwd);

  if (!result.foundPath || !result.config) {
    if (result.foundPath && result.error) {
      throw new ConfigParseError(result.foundPath, new Error(result.error));
    }
    throw new ConfigNotFoundError(configPaths);
  }

  return result.config;
};
