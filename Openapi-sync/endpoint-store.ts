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
 * Saves the collected endpoint information to the in-memory store,
 * replacing any previously stored endpoints for the same API.
 * 
 * @param {string} apiName - Name of the API
 * @param {EndpointInfo[]} endpoints - Array of endpoint information to store
 * @returns {void}
 * 
 * @public
 */
export const storeEndpoints = (apiName: string, endpoints: EndpointInfo[]) => {
  endpointStore[apiName] = endpoints;
};

/**
 * Get stored endpoints for a specific API
 * 
 * Retrieves the endpoint information for a given API name from the in-memory store.
 * Returns an empty array if no endpoints are found for the API.
 * 
 * @param {string} apiName - Name of the API
 * @returns {EndpointInfo[]} Array of endpoint information, or empty array if not found
 * 
 * @public
 */
export const getStoredEndpoints = (apiName: string): EndpointInfo[] => {
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
  return { ...endpointStore };
};

/**
 * Clear endpoint store
 * 
 * Resets the in-memory endpoint store, removing all stored endpoint information.
 * Typically called at the start of a new sync operation.
 * 
 * @returns {void}
 * 
 * @public
 */
export const clearEndpointStore = () => {
  endpointStore = {};
};
