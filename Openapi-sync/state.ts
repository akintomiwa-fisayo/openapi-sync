import path from "path";
import { IOpenApiSpec } from "../types";
import fs from "fs";

/**
 * Get directory path for persistent state cache
 * @public
 */
export const getCacheDir = (): string => {
  return path.join(process.cwd(), ".openapi-sync");
};

/**
 * Path to the persistent state database file (.openapi-sync/cache.json)
 * @public
 */
export const getCachePath = (): string => {
  return path.join(getCacheDir(), "cache.json");
};

const initCacheFile = (): string => {
  const cachePath = getCachePath();
  try {
    const dir = path.dirname(cachePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    if (!fs.existsSync(cachePath)) {
      fs.writeFileSync(cachePath, "{}");
    }
  } catch (_) {
    // Gracefully ignore directory creation errors in sandboxed or mock environments
  }
  return cachePath;
};

const dbPath = initCacheFile();

let db: Record<string, any> = {};
try {
  if (fs.existsSync(dbPath)) {
    const content = fs.readFileSync(dbPath, "utf-8");
    db = JSON.parse(content);
  }
} catch (error) {
  try {
    db = require(dbPath);
  } catch (_) {
    db = {};
  }
}

/**
 * In-memory state store for OpenAPI specifications.
 * Maps API names to their parsed OpenAPI specs.
 * @internal
 */
let state: Record<string, any> = db || {};

/**
 * Update the persistent database file with current state
 *
 * @param {Record<string, any>} data - State data to persist
 * @returns {void}
 * @internal
 */
const updateDB = (data: typeof state) => {
  try {
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(dbPath, JSON.stringify(data));
  } catch (_) {
    // Best-effort write
  }
};

/**
 * Set state for a specific API
 *
 * Stores the parsed OpenAPI specification for an API in both memory and
 * the persistent database. This allows tracking of spec changes over time.
 *
 * @param {string} key - API name
 * @param {IOpenApiSpec} value - Parsed OpenAPI specification
 * @returns {void}
 *
 * @public
 */
export const setState = (key: string, value: IOpenApiSpec) => {
  state[key] = value;
  updateDB(state);
};

/**
 * Get state for a specific API
 *
 * Retrieves the previously stored OpenAPI specification for an API.
 * Returns undefined if no state exists for the given API.
 *
 * @param {string} key - API name
 * @returns {IOpenApiSpec | undefined} The stored OpenAPI spec, or undefined if not found
 *
 * @public
 */
export const getState = (key: string): IOpenApiSpec | undefined => {
  return state[key];
};

/**
 * Reset all state
 *
 * Clears both the in-memory state and the persistent database.
 * Typically called at the start of a new sync operation.
 *
 * @returns {void}
 *
 * @public
 */
export const resetState = () => {
  state = {};
  updateDB(state);
};
