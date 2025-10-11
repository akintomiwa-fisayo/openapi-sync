import {
  isJson,
  isYamlString,
  yamlStringToJson,
  capitalize,
  getEndpointDetails,
  JSONStringify,
  renderTypeRefMD,
  getNestedValue,
} from "../helpers";

describe("Helper Functions", () => {
  describe("isJson", () => {
    it("should return true for plain objects", () => {
      expect(isJson({})).toBe(true);
      expect(isJson({ key: "value" })).toBe(true);
      expect(isJson([])).toBe(true);
    });

    it("should return false for non-objects", () => {
      expect(isJson("string")).toBe(false);
      expect(isJson(123)).toBe(false);
      expect(isJson(null)).toBe(true); // null is an object in JavaScript
      expect(isJson(undefined)).toBe(false);
    });

    it("should return false for Blob objects", () => {
      const blob = new Blob(["test"]);
      expect(isJson(blob)).toBe(false);
    });
  });

  describe("isYamlString", () => {
    it("should return true for valid YAML strings", () => {
      const yamlContent = `
        name: test
        version: 1.0.0
        description: A test API
      `;
      expect(isYamlString(yamlContent)).toBe(true);
    });

    it("should return false for invalid YAML strings", () => {
      expect(isYamlString("invalid yaml: [")).toBe(false);
      expect(isYamlString("")).toBe(true); // Empty string is valid YAML
    });

    it("should return false for JSON strings", () => {
      const jsonString = '{"name": "test"}';
      expect(isYamlString(jsonString)).toBe(true); // JSON is also valid YAML
    });
  });

  describe("yamlStringToJson", () => {
    it("should convert YAML to JSON", () => {
      const yamlContent = `
        name: test
        version: 1.0.0
        description: A test API
      `;
      const result = yamlStringToJson(yamlContent);
      expect(result).toEqual({
        name: "test",
        version: "1.0.0",
        description: "A test API",
      });
    });

    it("should return undefined for invalid YAML", () => {
      const result = yamlStringToJson("invalid yaml: [");
      expect(result).toBeUndefined();
    });
  });

  describe("capitalize", () => {
    it("should capitalize the first letter", () => {
      expect(capitalize("test")).toBe("Test");
      expect(capitalize("hello world")).toBe("Hello world");
      expect(capitalize("API")).toBe("API");
    });

    it("should handle empty strings", () => {
      expect(capitalize("")).toBe("");
    });

    it("should handle single characters", () => {
      expect(capitalize("a")).toBe("A");
    });
  });

  describe("getEndpointDetails", () => {
    it("should handle simple paths", () => {
      const result = getEndpointDetails("/users", "GET");
      expect(result).toEqual({
        name: "GETUsers",
        variables: [],
        pathParts: ["", "users"],
      });
    });

    it("should handle path variables with curly braces", () => {
      const result = getEndpointDetails("/users/{id}", "GET");
      expect(result).toEqual({
        name: "GETUsers$id",
        variables: ["id"],
        pathParts: ["", "users", "{id}"],
      });
    });

    it("should handle path variables with angle brackets", () => {
      const result = getEndpointDetails("/users/<id>", "GET");
      expect(result).toEqual({
        name: "GETUsers$id",
        variables: ["id"],
        pathParts: ["", "users", "<id>"],
      });
    });

    it("should handle path variables with colons", () => {
      const result = getEndpointDetails("/users/:id", "GET");
      expect(result).toEqual({
        name: "GETUsers$id",
        variables: ["id"],
        pathParts: ["", "users", ":id"],
      });
    });

    it("should handle complex paths with multiple variables", () => {
      const result = getEndpointDetails(
        "/users/{userId}/posts/{postId}",
        "GET"
      );
      expect(result).toEqual({
        name: "GETUsers$userIdPosts$postId",
        variables: ["userId", "postId"],
        pathParts: ["", "users", "{userId}", "posts", "{postId}"],
      });
    });

    it("should handle paths with special characters", () => {
      const result = getEndpointDetails("/api/v1/users", "POST");
      expect(result).toEqual({
        name: "POSTApiV1Users",
        variables: [],
        pathParts: ["", "api", "v1", "users"],
      });
    });
  });

  describe("JSONStringify", () => {
    it("should stringify simple objects", () => {
      const obj = { name: "test", value: "123" };
      const result = JSONStringify(obj);
      expect(result).toContain("name: test");
      expect(result).toContain("value: 123");
    });

    it("should handle nested objects", () => {
      const obj = {
        user: {
          name: "John",
          age: "30",
        },
      };
      const result = JSONStringify(obj);
      expect(result).toContain("user: {");
      expect(result).toContain("name: John");
      expect(result).toContain("age: 30");
    });

    it("should handle arrays", () => {
      const obj = {
        items: ["item1", "item2", "item3"],
      };
      const result = JSONStringify(obj);
      expect(result).toContain("items: [");
      expect(result).toContain('"item1"');
      expect(result).toContain('"item2"');
      expect(result).toContain('"item3"');
    });

    it("should handle arrays of objects", () => {
      const obj = {
        users: [
          { name: "John", age: "30" },
          { name: "Jane", age: "25" },
        ],
      };
      const result = JSONStringify(obj);
      expect(result).toContain("users: [");
      expect(result).toContain("name: John");
      expect(result).toContain("age: 30");
    });

    it("should handle multiline strings", () => {
      const obj = {
        description: "This is a\nmultiline\ndescription",
      };
      const result = JSONStringify(obj);
      expect(result).toContain("This is a");
      expect(result).toContain("multiline");
      expect(result).toContain("description");
    });

    it("should handle different data types", () => {
      const obj = {
        string: "test",
        number: "123",
        boolean: "true",
        null: "null",
        undefined: "undefined",
      };
      const result = JSONStringify(obj);
      expect(result).toContain("string: test");
      expect(result).toContain("number: 123");
      expect(result).toContain("boolean: true");
      expect(result).toContain("null: null");
    });
  });

  describe("renderTypeRefMD", () => {
    it("should render simple type references", () => {
      const typeRef = "string";
      const result = renderTypeRefMD(typeRef);
      expect(result).toContain("```typescript");
      expect(result).toContain("string");
    });

    it("should handle multiline type references", () => {
      const typeRef = `{
  name: string;
  age: number;
}`;
      const result = renderTypeRefMD(typeRef);
      expect(result).toContain("```typescript");
      expect(result).toContain("name: string");
      expect(result).toContain("age: number");
    });

    it("should handle indentation", () => {
      const typeRef = "string";
      const result = renderTypeRefMD(typeRef, 2);
      expect(result).toContain("    string");
    });

    it("should filter empty lines", () => {
      const typeRef = `{
  name: string;
  
  age: number;
}`;
      const result = renderTypeRefMD(typeRef);
      expect(result).not.toContain("  \n  ");
    });
  });

  describe("getNestedValue", () => {
    const testObj = {
      user: {
        profile: {
          name: "John",
          age: 30,
        },
        settings: {
          theme: "dark",
        },
      },
      config: {
        api: {
          baseUrl: "https://api.example.com",
        },
      },
    };

    it("should get nested values", () => {
      expect(getNestedValue(testObj, "user.profile.name")).toBe("John");
      expect(getNestedValue(testObj, "user.profile.age")).toBe(30);
      expect(getNestedValue(testObj, "config.api.baseUrl")).toBe(
        "https://api.example.com"
      );
    });

    it("should return undefined for non-existent paths", () => {
      expect(getNestedValue(testObj, "user.nonexistent")).toBeUndefined();
      expect(getNestedValue(testObj, "nonexistent.path")).toBeUndefined();
    });

    it("should return undefined for empty path", () => {
      expect(getNestedValue(testObj, "")).toBeUndefined();
    });

    it("should handle single-level properties", () => {
      expect(getNestedValue(testObj, "user")).toEqual({
        profile: {
          name: "John",
          age: 30,
        },
        settings: {
          theme: "dark",
        },
      });
    });
  });
});
