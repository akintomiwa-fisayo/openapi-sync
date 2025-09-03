import ts from "typescript";
import { variableNameChar } from "./regex";
import * as yaml from "js-yaml";

export const isJson = (value: any) => {
  return ["object"].includes(typeof value) && !(value instanceof Blob);
};
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

export const yamlStringToJson = (fileContent: string) => {
  if (isYamlString(fileContent)) {
    const content = yaml.load(fileContent);

    const jsonString = JSON.stringify(content, null, 2);
    const json = JSON.parse(jsonString);
    return json;
  }
};

export const capitalize = (text: string) => {
  const capitalizedWord =
    text.substring(0, 1).toUpperCase() + text.substring(1);
  return capitalizedWord;
};

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

export const JSONStringify = (obj: Record<string, any>) => {
  let result = "{";
  const keys = Object.keys(obj);

  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    const value = obj[key];

    result += key + ": ";

    if (typeof value === "object" && value !== null) {
      result += JSONStringify(value);
    } else {
      result += value;
    }

    if (i < keys.length - 1) {
      result += ", ";
    }
  }

  result += "}";
  return result;
};

export const resolveTypeDefinition1 = (
  tsFileContent: string,
  typeReference: string
): string | null => {
  // 1. Create dummy files in a virtual file system
  const tempFileName = "temp.ts";
  const tempDtsFileName = "temp.d.ts";
  const tempJsFileName = "temp.js";

  // The dummy class forces the compiler to resolve the type during compilation.
  const tempContent = `
class _DummyClass implements ${typeReference} {}
export type _ResolvedType = ${typeReference};
    `;
  const fullSource = tsFileContent + "\n" + tempContent;

  const files: Record<string, ts.SourceFile> = {};
  const outputFiles: Record<string, string> = {};

  // 2. Set up an in-memory CompilerHost
  const compilerHost: ts.CompilerHost = {
    getSourceFile: (fileName, languageVersion) => {
      if (fileName === tempFileName) {
        return ts.createSourceFile(fileName, fullSource, languageVersion, true);
      }
      return undefined; // Or handle other files if needed
    },
    writeFile: (name, text) => {
      outputFiles[name] = text;
    },
    getDefaultLibFileName: () => "lib.d.ts", // Use a minimal default lib
    getCurrentDirectory: () => ".",
    getCanonicalFileName: (fileName) => fileName,
    useCaseSensitiveFileNames: () => false,
    getNewLine: () => "\n",
    fileExists: (fileName) => fileName === tempFileName,
    readFile: () => undefined,
  };

  // 3. Create a Program and emit the declaration file
  const program = ts.createProgram({
    rootNames: [tempFileName],
    options: {
      declaration: true,
      emitDeclarationOnly: true,
      strict: true,
    },
    host: compilerHost,
  });
  program.emit();

  // 4. Read the generated .d.ts file from memory
  const dtsContent = outputFiles[tempDtsFileName];
  if (!dtsContent) {
    return null;
  }

  // 5. Parse the .d.ts content to find the resolved type
  const dtsSourceFile = ts.createSourceFile(
    tempDtsFileName,
    dtsContent,
    ts.ScriptTarget.ESNext,
    true
  );

  let resolvedTypeAlias: ts.TypeAliasDeclaration | undefined;
  ts.forEachChild(dtsSourceFile, (node) => {
    if (ts.isTypeAliasDeclaration(node) && node.name.text === "_ResolvedType") {
      resolvedTypeAlias = node;
    }
  });

  if (resolvedTypeAlias) {
    // Print the resolved type from the emitted .d.ts file
    const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });
    const resolvedType = printer.printNode(
      ts.EmitHint.Unspecified,
      resolvedTypeAlias.type,
      dtsSourceFile
    );
    return resolvedType.trim();
  }

  return null;
};
/**
 * Recursively serializes a ts.Type object into a string, forcing full expansion.
 * @param {ts.Type} type The TypeScript type object to serialize.
 * @param {ts.TypeChecker} checker The TypeScript TypeChecker instance.
 * @returns {string} The full string representation of the type.
 */
const serializeType = (type: ts.Type, checker: ts.TypeChecker): string => {
  // 1. Handle primitive and simple types
  if (
    type.isLiteral() ||
    type.getFlags() &
      (ts.TypeFlags.String |
        ts.TypeFlags.Number |
        ts.TypeFlags.Boolean |
        ts.TypeFlags.Any |
        ts.TypeFlags.Unknown |
        ts.TypeFlags.Null |
        ts.TypeFlags.Undefined |
        ts.TypeFlags.Void)
  ) {
    return checker.typeToString(type);
  }

  // 2. Handle generic types (like arrays, Record, etc.)
  const typeArgs = checker.getTypeArguments(type as ts.TypeReference);
  if (typeArgs.length > 0) {
    // If it's a simple array type (like string[]), format it correctly.
    if (checker.isArrayType(type)) {
      return `${serializeType(typeArgs[0], checker)}[]`;
    }

    // For other generics like Record<string, T>, recurse on its type arguments.
    const typeName = checker
      .getSymbolAtLocation(type.getSymbol()!.valueDeclaration!)!
      .getName();
    const argsString = typeArgs
      .map((arg) => serializeType(arg, checker))
      .join(", ");
    return `${typeName}<${argsString}>`;
  }

  // 3. Handle object types and mapped types
  if (type.getFlags() & (ts.TypeFlags.Object | (1 << 16))) {
    const properties = checker.getPropertiesOfType(type);
    if (properties.length === 0) {
      return "{}"; // Handle empty objects
    }
    const members = properties
      .map((prop) => {
        const propName = prop.getName();
        const propType = checker.getTypeOfSymbolAtLocation(
          prop,
          prop.valueDeclaration || prop.declarations![0]
        );
        return `    ${propName}: ${serializeType(propType, checker)};`;
      })
      .join("\n");
    return `{\n${members}\n}`;
  }

  // 4. Fallback for any other types
  return checker.typeToString(type);
};

/**
 * Resolves a type reference and returns the full structural definition.
 * @param {string} tsFileContent The TypeScript file content as a string.
 * @param {string} typeReference The type reference string (e.g., "UserProfile" or "Record<string, Aw>").
 * @returns {string | null} The full type definition, or null if not found.
 */
export const resolveTypeDefinition2 = (
  tsFileContent: string,
  typeReference: string
): string | null => {
  const tempFileName = "temp.ts";
  const tempContent = `type _ResolvedType = ${typeReference};`;
  const fullSource = tsFileContent + "\n" + tempContent;

  const compilerHost = ts.createCompilerHost({});
  compilerHost.getSourceFile = (fileName) => {
    if (fileName === tempFileName) {
      return ts.createSourceFile(
        tempFileName,
        fullSource,
        ts.ScriptTarget.ESNext,
        true
      );
    }
    return undefined;
  };

  const program = ts.createProgram({
    rootNames: [tempFileName],
    options: { strict: true },
    host: compilerHost,
  });

  const checker = program.getTypeChecker();
  const sourceFile = program.getSourceFile(tempFileName);

  if (!sourceFile) {
    return null;
  }

  let resolvedTypeAlias: ts.TypeAliasDeclaration | undefined;
  ts.forEachChild(sourceFile, (node) => {
    if (ts.isTypeAliasDeclaration(node) && node.name.text === "_ResolvedType") {
      resolvedTypeAlias = node;
    }
  });

  if (!resolvedTypeAlias) {
    return null;
  }

  const type = checker.getTypeFromTypeNode(resolvedTypeAlias.type);
  const resolvedString = serializeType(type, checker);

  return resolvedString.trim();
};

function expandType(type: ts.Type, checker: ts.TypeChecker, depth = 0): string {
  const indent = "  ".repeat(depth);

  if (depth > 10) return "[Max Depth Reached]";
  if (type.isUnion())
    return type.types.map((t) => expandType(t, checker, depth)).join(" | ");
  if (type.isIntersection())
    return type.types.map((t) => expandType(t, checker, depth)).join(" & ");

  // Arrays and tuples
  if (checker.isArrayLikeType(type)) {
    const typeArguments = (type as ts.TypeReference).typeArguments;
    if (typeArguments && typeArguments.length === 1) {
      return `${expandType(typeArguments[0], checker, depth)}[]`;
    }
  }

  // Indexed/Mapped types (Record<string, T>)
  if (type.getStringIndexType()) {
    const indexType = type.getStringIndexType()!;
    return `{ [key: string]: ${expandType(indexType, checker, depth + 1)} }`;
  }

  // Objects and interfaces
  if (type.getFlags() & ts.TypeFlags.Object) {
    const props = checker.getPropertiesOfType(type);
    if (props.length > 0) {
      const lines = props.map((symbol) => {
        const declaration = symbol.valueDeclaration ?? symbol.declarations?.[0];
        if (!declaration) {
          return `${indent}  ${symbol.getName()}: [Unknown];`;
        }
        const propType = checker.getTypeOfSymbolAtLocation(symbol, declaration);
        return `${indent}  ${symbol.getName()}: ${expandType(
          propType,
          checker,
          depth + 1
        )};`;
      });
      return `{\n${lines.join("\n")}\n${indent}}`;
    }
  }

  // Fallback to typeToString
  return checker.typeToString(type);
}

export const renderTypeRefMD = (typeRef: string, indent = 1) => {
  return `\n\`\`\`typescript\n${"  ".repeat(indent)}  ${typeRef
    .split("\n")
    .filter((line) => line.trim() !== "")
    .join(`\n${"  ".repeat(indent)}  `)}\n\`\`\``;
};

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
