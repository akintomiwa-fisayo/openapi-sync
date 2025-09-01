import { IOpenApiSpec, IOpenApSchemaSpec } from "../../types";
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
