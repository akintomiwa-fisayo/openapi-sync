import { variableNameChar } from "./regex";
import * as yaml from "js-yaml";

/**
 * Check if a value is a JSON object
 *
 * @param {any} value - Value to check
 * @returns {boolean} True if the value is an object and not a Blob
 *
 * @public
 */
export const isJson = (value: any) => {
  return ["object"].includes(typeof value) && !(value instanceof Blob);
};

/**
 * Check if a string is valid YAML
 *
 * Attempts to parse the string as YAML and returns true if successful.
 *
 * @param {string} fileContent - String content to check
 * @returns {boolean} True if the string can be parsed as YAML
 *
 * @public
 */
export const isYamlString = (fileContent: string) => {
  try {
    yaml.load(fileContent);
    return true;
  } catch (en) {
    const e = en as any;
    if (e instanceof yaml.YAMLException) {
      return false;
    } else {
      throw e;
    }
  }
};

/**
 * Convert YAML string to JSON object
 *
 * Parses a YAML string and returns a JSON object representation.
 * Returns undefined if the string is not valid YAML.
 *
 * @param {string} fileContent - YAML string content
 * @returns {any | undefined} Parsed JSON object, or undefined if invalid YAML
 *
 * @public
 */
export const yamlStringToJson = (fileContent: string) => {
  if (isYamlString(fileContent)) {
    const content = yaml.load(fileContent);

    const jsonString = JSON.stringify(content, null, 2);
    const json = JSON.parse(jsonString);
    return json;
  }
};

/**
 * Capitalize the first letter of a string
 *
 * @param {string} text - Text to capitalize
 * @returns {string} Text with first letter capitalized
 *
 * @public
 */
export const capitalize = (text: string) => {
  const capitalizedWord =
    text.substring(0, 1).toUpperCase() + text.substring(1);
  return capitalizedWord;
};

/**
 * Extract endpoint details from path and method
 *
 * Parses an API path to generate a function name and extract path variables.
 * Handles multiple path variable formats: {id}, <id>, and :id.
 *
 * @param {string} path - API endpoint path (e.g., "/users/{userId}/posts")
 * @param {string} method - HTTP method (GET, POST, etc.)
 * @returns {{ name: string; variables: string[]; pathParts: string[] }} Object containing generated name, path variables, and path parts
 *
 * @example
 * getEndpointDetails("/users/{userId}", "GET")
 * // Returns: { name: "GetUsers$userId", variables: ["userId"], pathParts: [...] }
 *
 * @public
 */
export const getEndpointDetails = (path: string, method: string) => {
  const pathParts = path.split("/");
  let name = `${capitalize(method)}`;
  const variables: string[] = [];
  pathParts.forEach((part) => {
    // check if part is a variable
    //api/{userId}
    if (part[0] === "{" && part[part.length - 1] === "}") {
      const s = part.replace(/{/, "").replace(/}/, "");
      variables.push(s);
      part = `$${s}`;
    }

    //api/<userId>
    else if (part[0] === "<" && part[part.length - 1] === ">") {
      const s = part.replace(/</, "").replace(/>/, "");
      variables.push(s);
      part = `$${s}`;
    }

    //api/:userId
    else if (part[0] === ":") {
      const s = part.replace(/:/, "");
      variables.push(s);
      part = `$${s}`;
    }

    // parse to variable name
    let partVal = "";
    part.split("").forEach((char) => {
      let c = char;
      if (!variableNameChar.test(char)) c = "/";
      partVal += c;
    });

    partVal.split("/").forEach((val) => {
      name += capitalize(val);
    });
  });

  return { name, variables, pathParts };
};

/**
 * Convert object to formatted TypeScript string
 *
 * Creates a human-readable TypeScript object representation with proper indentation.
 * Used for generating type definitions in generated code.
 *
 * @param {Record<string, any>} obj - Object to stringify
 * @param {number} [indent=1] - Current indentation level
 * @returns {string} Formatted TypeScript object string
 *
 * @public
 */
export const JSONStringify = (obj: Record<string, any>, indent = 1) => {
  let result = "{";
  const keys = Object.keys(obj);

  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    const value = obj[key];

    result += "\n" + "    ".repeat(indent) + key + ": ";

    if (Array.isArray(value)) {
      result += "[";
      for (let j = 0; j < value.length; j++) {
        const item = value[j];
        if (typeof item === "object" && item !== null) {
          result += JSONStringify(item, indent + 1);
        } else {
          result += typeof item === "string" ? `"${item}"` : item;
        }
        if (j < value.length - 1) {
          result += ", ";
        }
      }
      result += "]";
    } else if (typeof value === "object" && value !== null) {
      result += "" + JSONStringify(value, indent + 1);
    } else {
      result += value
        .split("\n")
        .filter((line: string) => line.trim() !== "")
        .join(`\n${"    ".repeat(indent)}`);
    }

    if (i < keys.length - 1) {
      result += ", ";
    }
  }

  result += `\n${"    ".repeat(indent - 1)}}`;
  return result;
};

/**
 * Render TypeScript type reference as markdown code block
 *
 * Formats a TypeScript type definition for inclusion in markdown documentation.
 *
 * @param {string} typeRef - TypeScript type definition
 * @param {number} [indent=1] - Indentation level
 * @returns {string} Markdown formatted code block
 *
 * @public
 */
export const renderTypeRefMD = (typeRef: string, indent = 1) => {
  return `\n\`\`\`typescript\n${"  ".repeat(indent)}  ${typeRef
    .split("\n")
    .filter((line) => line.trim() !== "")
    .join(`\n${"  ".repeat(indent)}  `)}\n\`\`\``;
};

/**
 * Get nested value from object using dot notation path
 *
 * Safely retrieves a deeply nested value from an object using a string path.
 * Returns undefined if the path doesn't exist.
 *
 * @template T - Type of the expected return value
 * @param {object} obj - Object to navigate
 * @param {string} path - Dot-notation path (e.g., "user.address.city")
 * @returns {T | undefined} The value at the path, or undefined if not found
 *
 * @example
 * getNestedValue<string>({ user: { name: "John" } }, "user.name")
 * // Returns: "John"
 *
 * @public
 */
export function getNestedValue<T>(obj: object, path: string): T | undefined {
  // Split the path string into an array of keys
  const keys = path.split(".");

  // Use the reduce method to navigate the object
  return keys.reduce((currentObj: any, key: string) => {
    // If the current object is not null or undefined,
    // return the value of the next key. Otherwise, return undefined.
    return currentObj && currentObj[key] !== undefined
      ? currentObj[key]
      : undefined;
  }, obj) as T | undefined;
}

// ============================================================
// Custom Code Preservation Functions
// ============================================================

export interface ExtractedCustomCode {
  beforeGenerated: string;
  afterGenerated: string;
}

/**
 * Extract custom code from existing file using comment markers
 *
 * Scans an existing file for custom code blocks marked with special comments
 * and extracts them for preservation during regeneration.
 *
 * @param {string} fileContent - The content of the existing file
 * @param {string} [markerText="CUSTOM CODE"] - The marker text to look for
 * @returns {ExtractedCustomCode} Object containing custom code sections before and after generated code
 *
 * @public
 */
export const extractCustomCode = (
  fileContent: string,
  markerText: string = "CUSTOM CODE"
): ExtractedCustomCode => {
  const startMarker = `// 🔒 ${markerText} START`;
  const endMarker = `// 🔒 ${markerText} END`;

  const result: ExtractedCustomCode = {
    beforeGenerated: "",
    afterGenerated: "",
  };

  // Find all custom code blocks
  let searchPos = 0;
  const blocks: Array<{ start: number; end: number; content: string }> = [];

  while (searchPos < fileContent.length) {
    const startIndex = fileContent.indexOf(startMarker, searchPos);
    if (startIndex === -1) break;

    const endIndex = fileContent.indexOf(endMarker, startIndex);
    if (endIndex === -1) break;

    let blockEnd = endIndex + endMarker.length;

    // Include the closing separator line if it exists
    const afterEndMarker = fileContent.substring(blockEnd, blockEnd + 100);
    const closingSeparatorMatch = afterEndMarker.match(/^\s*\n\s*(\/\/ =+)/);
    if (closingSeparatorMatch) {
      // Find the end of the closing separator line
      const separatorEnd = afterEndMarker.indexOf(
        "\n",
        closingSeparatorMatch.index! + 1
      );
      if (separatorEnd !== -1) {
        blockEnd += separatorEnd + 1;
      } else {
        // No newline after separator, include it anyway
        blockEnd += closingSeparatorMatch[0].length;
      }
    }

    // Find the actual start of the block (including any preceding comment lines)
    let blockStart = startIndex;
    // Look back for the separator line (a line of "=" signs)
    const precedingText = fileContent.substring(
      Math.max(0, startIndex - 200),
      startIndex
    );
    const separatorMatch = precedingText.lastIndexOf("// ==========");
    if (separatorMatch !== -1) {
      blockStart = Math.max(0, startIndex - 200) + separatorMatch;
    }

    const customBlock = fileContent.substring(blockStart, blockEnd);
    blocks.push({ start: blockStart, end: blockEnd, content: customBlock });

    searchPos = blockEnd;
  }

  // Assign blocks to before/after based on their position
  // Check if there's actual code before the first block
  if (blocks.length > 0) {
    const textBeforeFirstBlock = fileContent.substring(0, blocks[0].start);
    // Remove comments and whitespace to check for actual code
    const codeBeforeBlock = textBeforeFirstBlock
      .split("\n")
      .filter((line) => {
        const trimmed = line.trim();
        return trimmed.length > 0 && !trimmed.startsWith("//");
      })
      .join("");

    // If there's code before the block, it's "after", otherwise "before"
    if (codeBeforeBlock.length === 0) {
      result.beforeGenerated = blocks[0].content;
      if (blocks.length > 1) {
        result.afterGenerated = blocks[1].content;
      }
    } else {
      result.afterGenerated = blocks[0].content;
      if (blocks.length > 1 && !result.beforeGenerated) {
        // This shouldn't normally happen, but handle it
        result.beforeGenerated = blocks[1].content;
      }
    }
  }

  return result;
};

/**
 * Create an empty custom code marker section
 *
 * Generates the comment markers that delineate custom code sections in
 * generated files. These markers tell the regeneration process where
 * user-added code should be preserved.
 *
 * @param {"top" | "bottom"} position - Position of the marker in the file
 * @param {string} [markerText="CUSTOM CODE"] - The marker text to use
 * @param {boolean} [includeInstructions=true] - Whether to include helpful instructions
 * @returns {string} The marker section as a string
 *
 * @public
 */
export const createCustomCodeMarker = (
  position: "top" | "bottom",
  markerText: string = "CUSTOM CODE",
  includeInstructions: boolean = true
): string => {
  const instructions = includeInstructions
    ? `// ${
        position === "top"
          ? "Add your custom code below this line"
          : "Add your custom code above this line"
      }\n// This section will be preserved during regeneration\n`
    : "";

  return `// ${"=".repeat(60)}
// 🔒 ${markerText} START
${instructions}// ${"=".repeat(60)}

// 🔒 ${markerText} END
// ${"=".repeat(60)}`;
};

/**
 * Merge generated content with preserved custom code
 *
 * The core function for custom code preservation. Extracts custom code from
 * existing files and merges it with newly generated content, ensuring user
 * modifications survive regeneration.
 *
 * @param {string} generatedContent - The newly generated content
 * @param {string | null} existingFileContent - The existing file content (null if file doesn't exist)
 * @param {Object} [config] - Configuration options
 * @param {"top" | "bottom" | "both"} [config.position="bottom"] - Where to place custom code markers
 * @param {string} [config.markerText="CUSTOM CODE"] - Custom marker text
 * @param {boolean} [config.includeInstructions=true] - Whether to include helpful instructions
 * @returns {string} The merged content with custom code preserved
 *
 * @public
 */
export const mergeCustomCode = (
  generatedContent: string,
  existingFileContent: string | null,
  config: {
    position?: "top" | "bottom" | "both";
    markerText?: string;
    includeInstructions?: boolean;
  } = {}
): string => {
  const {
    position = "bottom",
    markerText = "CUSTOM CODE",
    includeInstructions = true,
  } = config;

  let customCode: ExtractedCustomCode = {
    beforeGenerated: "",
    afterGenerated: "",
  };

  // Extract existing custom code if file exists
  if (existingFileContent) {
    customCode = extractCustomCode(existingFileContent, markerText);
  }

  // If no existing custom code, create empty markers
  if (!customCode.beforeGenerated && !customCode.afterGenerated) {
    if (position === "top" || position === "both") {
      customCode.beforeGenerated = createCustomCodeMarker(
        "top",
        markerText,
        includeInstructions
      );
    }
    if (position === "bottom" || position === "both") {
      customCode.afterGenerated = createCustomCodeMarker(
        "bottom",
        markerText,
        includeInstructions
      );
    }
  }

  // Assemble final content
  const parts: string[] = [];

  if (customCode.beforeGenerated) {
    parts.push(customCode.beforeGenerated);
    parts.push(""); // Empty line
  }

  parts.push(generatedContent);

  if (customCode.afterGenerated) {
    parts.push(""); // Empty line
    parts.push(customCode.afterGenerated);
  }

  return parts.join("\n");
};
