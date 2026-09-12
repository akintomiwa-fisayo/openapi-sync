import fs from "fs";
import path from "path";
import { ISpecAuth, IApiSource } from "../types";
import type { AxiosRequestConfig } from "axios";

let hasLoadedEnv = false;

/**
 * Resets the environment loading state.
 * Useful for test suites and environments where .env files are modified at runtime.
 */
export function resetEnvLoadState(): void {
  hasLoadedEnv = false;
}

/**
 * Loads project environment variables from standard project files:
 * 1. .env.local
 * 2. .env
 * 3. next.config.js (env declarations)
 *
 * Does not overwrite variables already set in process.env.
 */
export function loadProjectEnvironment(cwd: string = process.cwd()): void {
  if (hasLoadedEnv) return;
  hasLoadedEnv = true;

  // 1. Check .env.local and .env
  const envFiles = [".env.local", ".env"];
  for (const file of envFiles) {
    const fullPath = path.resolve(cwd, file);
    if (fs.existsSync(fullPath)) {
      try {
        if (typeof (process as any).loadEnvFile === "function") {
          (process as any).loadEnvFile(fullPath);
        } else {
          const raw = fs.readFileSync(fullPath, "utf-8");
          for (const line of raw.split("\n")) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith("#")) continue;
            const eqIdx = trimmed.indexOf("=");
            if (eqIdx > 0) {
              const k = trimmed.substring(0, eqIdx).trim();
              let v = trimmed.substring(eqIdx + 1).trim();
              if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
                v = v.slice(1, -1);
              }
              if (process.env[k] === undefined) {
                process.env[k] = v;
              }
            }
          }
        }
      } catch {}
    }
  }

  // 2. Check next.config.js for env declarations
  const nextConfigJs = path.resolve(cwd, "next.config.js");
  if (fs.existsSync(nextConfigJs)) {
    try {
      try {
        delete require.cache[require.resolve(nextConfigJs)];
      } catch (_) {}
      const nextConfig = require(nextConfigJs);
      const conf = typeof nextConfig === "function" ? nextConfig("", {}) : nextConfig;
      if (conf && typeof conf.env === "object" && conf.env !== null) {
        for (const [k, v] of Object.entries(conf.env)) {
          if (process.env[k] === undefined && typeof v === "string") {
            process.env[k] = v;
          }
        }
      }
    } catch {}
  }
}

/**
 * Resolve "${env.VAR_NAME}" placeholders in a string.
 * Automatically loads .env, .env.local, and next.config.js if present.
 * Throws if the env var is not set.
 */
export function resolveEnvPlaceholders(value: string): string {
  loadProjectEnvironment();
  return value.replace(/\$\{env\.([^}]+)\}/g, (_, varName) => {
    const envValue = process.env[varName];
    if (envValue === undefined) {
      throw new Error(
        `Environment variable "${varName}" referenced in openapi-sync config is not set. ` +
        `Please set it in your environment, terminal, .env/.env.local, or next.config.js before running openapi-sync. ` +
        `(Tip: Referencing environment variables requires using a TypeScript [openapi.sync.ts] or JavaScript [openapi.sync.js] configuration file).`
      );
    }
    return envValue;
  });
}

/**
 * Convert an ISpecAuth config into axios request config (headers + params).
 * Returns an empty object if auth is undefined (no-auth case).
 */
export function buildAuthConfig(auth?: ISpecAuth): Pick<AxiosRequestConfig, "headers" | "params"> {
  if (!auth) return {};

  switch (auth.type) {
    case "bearer": {
      const token = resolveEnvPlaceholders(auth.token);
      return { headers: { Authorization: `Bearer ${token}` } };
    }
    case "basic": {
      const user = resolveEnvPlaceholders(auth.username);
      const pass = resolveEnvPlaceholders(auth.password);
      const encoded = Buffer.from(`${user}:${pass}`).toString("base64");
      return { headers: { Authorization: `Basic ${encoded}` } };
    }
    case "apiKey": {
      const keyVal = resolveEnvPlaceholders(auth.value);
      if (auth.in === "header") {
        return { headers: { [auth.name]: keyVal } };
      } else {
        // query param
        return { params: { [auth.name]: keyVal } };
      }
    }
    case "custom": {
      const headers: Record<string, string> = {};
      for (const [k, v] of Object.entries(auth.headers)) {
        headers[k] = resolveEnvPlaceholders(v);
      }
      return { headers };
    }
    default:
      return {};
  }
}

/**
 * Extract the URL string from an IApiSource (which may be a plain string or object).
 */
export function extractApiUrl(source: IApiSource): string {
  if (typeof source === "string") return source;
  return source.url;
}

/**
 * Extract the ISpecAuth from an IApiSource, if present.
 */
export function extractApiAuth(source: IApiSource): ISpecAuth | undefined {
  if (typeof source === "string") return undefined;
  return source.auth;
}
