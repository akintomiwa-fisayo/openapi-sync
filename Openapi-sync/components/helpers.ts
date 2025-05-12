import { IOpenApiSpec, IOpenApSchemaSpec } from "../types";
import { variableNameChar } from "./regex";
import * as yaml from "js-yaml";
import lodash from "lodash";

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

export const getSharedComponentName = (componentName: string) =>
  `IApi${capitalize(componentName)}`;

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

export const parseSchemaToType = (
  apiDoc: IOpenApiSpec,
  schema: IOpenApSchemaSpec,
  name: string,
  isRequired?: boolean,
  options?: {
    noSharedImport?: boolean;
  }
) => {
  let typeName = name ? `\t"${name}"${isRequired ? "" : "?"}: ` : "";
  let type = "";
  if (schema) {
    if (schema.$ref) {
      if (schema.$ref[0] === "#") {
        let pathToComponentParts = (schema.$ref || "").split("/");
        pathToComponentParts.shift();
        const pathToComponent = pathToComponentParts.join(".");
        const component = lodash.get(
          apiDoc,
          pathToComponent,
          null
        ) as IOpenApSchemaSpec;

        if (component) {
          const componentName =
            pathToComponentParts[pathToComponentParts.length - 1];
          // Reference component via import instead of parsing
          type += `${
            options?.noSharedImport ? "" : "Shared."
          }${getSharedComponentName(componentName)}`;
          // type += `${parseSchemaToType(apiDoc, component, "", isRequired)}`;
        }
      } else {
        type += "";
        //TODO $ref is a uri - use axios to fetch doc
      }
    } else if (schema.anyOf) {
      type += `(${schema.anyOf
        .map((v) => parseSchemaToType(apiDoc, v, "", isRequired, options))
        .join("|")})`;
    } else if (schema.oneOf) {
      type += `(${schema.oneOf
        .map((v) => parseSchemaToType(apiDoc, v, "", isRequired, options))
        .join("|")})`;
    } else if (schema.allOf) {
      type += `(${schema.allOf
        .map((v) => parseSchemaToType(apiDoc, v, "", isRequired, options))
        .join("&")})`;
    } else if (schema.items) {
      type += `${parseSchemaToType(
        apiDoc,
        schema.items,
        "",
        false,
        options
      )}[]`;
    } else if (schema.properties) {
      //parse object key one at a time
      const objKeys = Object.keys(schema.properties);
      const requiredKeys = schema.required || [];
      let typeCnt = "";
      objKeys.forEach((key) => {
        typeCnt += `${parseSchemaToType(
          apiDoc,
          schema.properties?.[key] as IOpenApSchemaSpec,
          key,
          requiredKeys.includes(key),
          options
        )}`;
      });
      if (typeCnt.length > 0) {
        type += `{\n${typeCnt}}`;
      } else {
        type += "{[k: string]: any}";
      }
    } else if (schema.type) {
      if (schema.enum && schema.enum.length > 0) {
        if (schema.enum.length > 1) type += "(";
        type += schema.enum
          .map((v) => `"${v}"`)
          .join("|")
          .toString();
        if (schema.enum.length > 1) type += ")";
      } else if (
        ["string", "integer", "number", "array", "boolean"].includes(
          schema.type
        )
      ) {
        if (["integer", "number"].includes(schema.type)) {
          type += `number`;
        } else if (schema.type === "array") {
          //Since we would have already parsed the arrays keys above "schema.items" if it exists
          type += "any[]";
          /* if (schema.items) {
            type += `${parseSchemaToType(
              apiDoc,
              schema.items,
              "",
              false,
              options
            )}[]`;
          } else {
            type += "any[]";
          } */
        } else {
          type += schema.type;
        }
      } else if (schema.type === "object") {
        //Since we would have already parsed the object keys above "schema.properties" if it exists
        if (schema.additionalProperties) {
          type += `{[k: string]: ${
            parseSchemaToType(
              apiDoc,
              schema.additionalProperties,
              "",
              true,
              options
            ) || "any"
          }}`;
        } else {
          type += "{[k: string]: any}";
        }
      }
    }
  } else {
    //Default type to string if no schema provided
    type = "string";
  }

  const nullable = schema?.nullable ? " | null" : "";
  return type.length > 0
    ? `${typeName}${type}${nullable}${name ? ";\n" : ""}`
    : "";
};
