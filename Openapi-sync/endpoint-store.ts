import fs from "fs";
import path from "path";
import { EndpointInfo } from "../client-generators";

/**
 * In-memory store for endpoint information collected during OpenAPI sync.
 * Maps API names to arrays of endpoint information.
 * 
 * @internal
 */
let endpointStore: Record<string, EndpointInfo[]> = {};

/**
 * Store endpoint information for a specific API
 * 
 * Saves the collected endpoint information to the in-memory store and
 * persists it to the .openapi-sync/endpoints.json cache file.
 * 
 * @param {string} apiName - Name of the API
 * @param {EndpointInfo[]} endpoints - Array of endpoint information to store
 * @returns {void}
 * 
 * @public
 */
export const storeEndpoints = (apiName: string, endpoints: EndpointInfo[]) => {
  endpointStore[apiName] = endpoints;
  try {
    const dir = path.join(process.cwd(), ".openapi-sync");
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const endpointsFilePath = path.join(dir, "endpoints.json");
    let allEndpoints: Record<string, EndpointInfo[]> = {};
    if (fs.existsSync(endpointsFilePath)) {
      try {
        allEndpoints = JSON.parse(fs.readFileSync(endpointsFilePath, "utf-8")) || {};
      } catch (_) {}
    }
    allEndpoints[apiName] = endpoints;
    fs.writeFileSync(endpointsFilePath, JSON.stringify(allEndpoints));
  } catch (_) {
    // Best-effort write to cache
  }
};

/**
 * Get stored endpoints for a specific API
 * 
 * Retrieves the endpoint information for a given API name from the in-memory store,
 * or loads it from the persistent .openapi-sync/endpoints.json cache if not in memory.
 * 
 * @param {string} apiName - Name of the API
 * @returns {EndpointInfo[]} Array of endpoint information, or empty array if not found
 * 
 * @public
 */
export const getStoredEndpoints = (apiName: string): EndpointInfo[] => {
  if (endpointStore[apiName] && endpointStore[apiName].length > 0) {
    return endpointStore[apiName];
  }
  try {
    const endpointsFilePath = path.join(process.cwd(), ".openapi-sync", "endpoints.json");
    if (fs.existsSync(endpointsFilePath)) {
      const data = JSON.parse(fs.readFileSync(endpointsFilePath, "utf-8"));
      if (data && Array.isArray(data[apiName]) && data[apiName].length > 0) {
        endpointStore[apiName] = data[apiName];
        return endpointStore[apiName];
      }
    }
  } catch (_) {
    // Fallback to empty array
  }
  return endpointStore[apiName] || [];
};

/**
 * Get all stored endpoints for all APIs
 * 
 * Returns a copy of the entire endpoint store containing endpoints for all APIs.
 * 
 * @returns {Record<string, EndpointInfo[]>} Object mapping API names to endpoint arrays
 * 
 * @public
 */
export const getAllStoredEndpoints = (): Record<string, EndpointInfo[]> => {
  try {
    const endpointsFilePath = path.join(process.cwd(), ".openapi-sync", "endpoints.json");
    if (fs.existsSync(endpointsFilePath)) {
      const data = JSON.parse(fs.readFileSync(endpointsFilePath, "utf-8"));
      if (data && typeof data === "object") {
        return { ...data, ...endpointStore };
      }
    }
  } catch (_) {}
  return { ...endpointStore };
};

/**
 * Clear endpoint store
 * 
 * Resets the in-memory endpoint store and clears the cache file if requested.
 * 
 * @param {boolean} [clearDisk=false] - Whether to also delete the persistent endpoints cache file
 * @returns {void}
 * 
 * @public
 */
export const clearEndpointStore = (clearDisk = false) => {
  endpointStore = {};
  if (clearDisk) {
    try {
      const endpointsFilePath = path.join(process.cwd(), ".openapi-sync", "endpoints.json");
      if (fs.existsSync(endpointsFilePath)) {
        fs.writeFileSync(endpointsFilePath, "{}");
      }
    } catch (_) {}
  }
};
