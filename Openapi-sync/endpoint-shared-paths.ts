import type { Method } from "axios";

/**
 * Descriptor representing an endpoint to be rendered with shared paths.
 * @internal
 */
export interface SharedPathEndpointDescriptor {
  doc: string;
  name: string;
  method: Method | string;
  endpointPath: string;
  relPath: string;
  variables: string[];
  paramSignature: string;
  isObject: boolean;
  content: {
    method: string;
    operationId: string;
    url: string;
    tags: string[];
  };
}

/**
 * Generate a clean, unique JavaScript variable identifier for a given OpenAPI URL path.
 *
 * Examples:
 * - "/pet" -> "_path_pet"
 * - "/pet/{petId}" -> "_path_pet_$petId"
 * - "/pet/{petId}/uploadImage" -> "_path_pet_$petId_uploadImage"
 * - "/pet/findByStatus" -> "_path_pet_findByStatus"
 * - "/" -> "_path_root"
 *
 * @param endpointPath - The OpenAPI endpoint path string
 * @param existingNames - Set of already allocated variable names to guarantee uniqueness
 * @returns Sanitized JavaScript identifier
 */
export function getSharedPathVariableName(
  endpointPath: string,
  existingNames?: Set<string>
): string {
  const trimmed = endpointPath.replace(/^\/+|\/+$/g, "");
  if (!trimmed) {
    const base = "_path_root";
    return disambiguateName(base, existingNames);
  }

  const segments = trimmed.split("/");
  const parts: string[] = [];

  for (const seg of segments) {
    if (!seg) continue;
    // Parameter segments: {id}, <id>, :id
    if (seg.startsWith("{") && seg.endsWith("}")) {
      const param = seg.slice(1, -1).replace(/[^a-zA-Z0-9_]/g, "_");
      parts.push(`$${param}`);
    } else if (seg.startsWith("<") && seg.endsWith(">")) {
      const param = seg.slice(1, -1).replace(/[^a-zA-Z0-9_]/g, "_");
      parts.push(`$${param}`);
    } else if (seg.startsWith(":")) {
      const param = seg.slice(1).replace(/[^a-zA-Z0-9_]/g, "_");
      parts.push(`$${param}`);
    } else {
      const clean = seg.replace(/[^a-zA-Z0-9_]/g, "_").replace(/^_+|_+$/g, "");
      if (clean) parts.push(clean);
    }
  }

  const joined = parts.join("_").replace(/_{2,}/g, "_");
  const baseName = `_path_${joined || "endpoint"}`;
  return disambiguateName(baseName, existingNames);
}

function disambiguateName(base: string, existingNames?: Set<string>): string {
  if (!existingNames) return base;
  if (!existingNames.has(base)) {
    existingNames.add(base);
    return base;
  }
  let counter = 2;
  while (existingNames.has(`${base}_${counter}`)) {
    counter++;
  }
  const unique = `${base}_${counter}`;
  existingNames.add(unique);
  return unique;
}

/**
 * Helper to construct the URL expression (string template or function) for a given endpoint.
 */
function buildPathExpression(
  item: SharedPathEndpointDescriptor,
  hasBaseUrl: boolean
): string {
  const rel = item.relPath.startsWith("/") ? item.relPath : `/${item.relPath}`;
  if (item.variables.length > 0) {
    if (hasBaseUrl) {
      return `(${item.paramSignature}) => \`\${BASE_URL}${rel}\``;
    } else {
      return `(${item.paramSignature}) => \`${rel}\``;
    }
  } else {
    if (hasBaseUrl) {
      return `\`\${BASE_URL}${rel}\``;
    } else {
      return `"${rel}"`;
    }
  }
}

/**
 * Render endpoints grouped by URL path using shared path helper functions and extracted BASE_URL.
 *
 * Preserves 100% backward compatibility:
 * - Each operation is exported by its operationId / endpoint name
 * - Preserves full rich JSDoc markdown documentation blocks on each exported endpoint
 * - Paths used more than once are extracted into reusable shared path variables
 * - Single-use paths are assigned directly to the endpoint export to minimize file size
 *
 * @param descriptors - Array of endpoint descriptors
 * @param serverUrl - OpenAPI server base URL (if any)
 * @param includeServer - Whether server URL should be included in generated endpoint URLs
 * @returns Formatted TypeScript code content for endpoints.ts
 */
export function renderEndpointsWithSharedPaths(
  descriptors: SharedPathEndpointDescriptor[],
  serverUrl: string = "",
  includeServer: boolean = false
): string {
  if (descriptors.length === 0) return "";

  // 1. Count usage per endpointPath to identify shared vs single-use paths
  const pathUsageCount = new Map<string, number>();
  for (const item of descriptors) {
    pathUsageCount.set(
      item.endpointPath,
      (pathUsageCount.get(item.endpointPath) || 0) + 1
    );
  }

  const pathToVarName = new Map<string, string>();
  const pathDefs: string[] = [];
  const usedVarNames = new Set<string>();

  const normalizedServer = (serverUrl || "").replace(/\/+$/, "");
  const hasBaseUrl = Boolean(includeServer && normalizedServer);

  // 2. Only define shared helper variables for paths used MORE THAN ONCE
  for (const item of descriptors) {
    const usage = pathUsageCount.get(item.endpointPath) || 0;
    if (usage > 1 && !pathToVarName.has(item.endpointPath)) {
      const varName = getSharedPathVariableName(item.endpointPath, usedVarNames);
      pathToVarName.set(item.endpointPath, varName);

      const pathExpr = buildPathExpression(item, hasBaseUrl);
      pathDefs.push(`const ${varName} = ${pathExpr};`);
    }
  }

  // 3. Build header with BASE_URL if applicable
  let out = "";
  if (hasBaseUrl) {
    out += `const BASE_URL = "${normalizedServer}";\n\n`;
  }
  if (pathDefs.length > 0) {
    out += pathDefs.join("\n") + "\n\n";
  }

  // 4. Render each endpoint export
  for (const item of descriptors) {
    const isShared = (pathUsageCount.get(item.endpointPath) || 0) > 1;
    const urlExpr = isShared
      ? pathToVarName.get(item.endpointPath)!
      : buildPathExpression(item, hasBaseUrl);

    if (item.isObject) {
      out += `${item.doc}export const ${item.name} = {\n` +
        `\tmethod: ${item.content.method},\n` +
        `\toperationId: ${item.content.operationId},\n` +
        `\turl: ${urlExpr},\n` +
        `\ttags: ${JSON.stringify(item.content.tags || [])}\n` +
        `};\n`;
    } else {
      out += `${item.doc}export const ${item.name} = ${urlExpr};\n`;
    }
  }

  return out;
}
