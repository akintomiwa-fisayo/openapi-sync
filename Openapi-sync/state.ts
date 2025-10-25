import path from "path";
import { IOpenApiSpec } from "../types";
import fs from "fs";

/**
 * Path to the persistent state database file (db.json)
 * @internal
 */
const dbPath = path.join(__dirname, "../", "../db.json");
if (!fs.existsSync(dbPath)) {
  fs.writeFileSync(dbPath, "{}");
}
let db: Record<string, IOpenApiSpec> = {};
try {
  db = require(dbPath);
} catch (error) {
  db = {};
}

/**
 * In-memory state store for OpenAPI specifications.
 * Maps API names to their parsed OpenAPI specs.
 * @internal
 */
let state: Record<string, IOpenApiSpec> = db || {};

/**
 * Update the persistent database file with current state
 *
 * @param {Record<string, IOpenApiSpec>} data - State data to persist
 * @returns {void}
 * @internal
 */
const updateDB = (data: typeof state) => {
  fs.writeFileSync(dbPath, JSON.stringify(data));
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
