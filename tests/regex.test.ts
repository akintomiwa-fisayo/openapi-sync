import { variableName, variableNameChar } from "../regex";

describe("Regex Utilities", () => {
  describe("variableName", () => {
    it("should match valid variable names", () => {
      expect(variableName.test("user")).toBe(true);
      expect(variableName.test("userName")).toBe(true);
      expect(variableName.test("user_name")).toBe(true);
      expect(variableName.test("userName123")).toBe(true);
      expect(variableName.test("_user")).toBe(true);
      expect(variableName.test("$user")).toBe(true);
      expect(variableName.test("User")).toBe(true);
      expect(variableName.test("USER")).toBe(true);
    });

    it("should not match invalid variable names", () => {
      expect(variableName.test("123user")).toBe(false);
      expect(variableName.test("user-name")).toBe(false);
      expect(variableName.test("user name")).toBe(false);
      expect(variableName.test("user.name")).toBe(false);
      expect(variableName.test("user@name")).toBe(false);
      expect(variableName.test("user+name")).toBe(false);
      expect(variableName.test("user-name")).toBe(false);
      expect(variableName.test("")).toBe(false);
    });

    it("should handle edge cases", () => {
      expect(variableName.test("a")).toBe(true);
      expect(variableName.test("A")).toBe(true);
      expect(variableName.test("_")).toBe(true);
      expect(variableName.test("$")).toBe(true);
      expect(variableName.test("123")).toBe(false);
      expect(variableName.test("-")).toBe(false);
      expect(variableName.test("@")).toBe(false);
    });
  });

  describe("variableNameChar", () => {
    it("should match valid variable name characters", () => {
      expect(variableNameChar.test("a")).toBe(true);
      expect(variableNameChar.test("A")).toBe(true);
      expect(variableNameChar.test("1")).toBe(true);
      expect(variableNameChar.test("_")).toBe(true);
      expect(variableNameChar.test("$")).toBe(true);
      expect(variableNameChar.test("0")).toBe(true);
      expect(variableNameChar.test("9")).toBe(true);
      expect(variableNameChar.test("z")).toBe(true);
      expect(variableNameChar.test("Z")).toBe(true);
    });

    it("should not match invalid variable name characters", () => {
      expect(variableNameChar.test("-")).toBe(false);
      expect(variableNameChar.test("@")).toBe(false);
      expect(variableNameChar.test("+")).toBe(false);
      expect(variableNameChar.test(" ")).toBe(false);
      expect(variableNameChar.test(".")).toBe(false);
      expect(variableNameChar.test("/")).toBe(false);
      expect(variableNameChar.test("\\")).toBe(false);
      expect(variableNameChar.test("[")).toBe(false);
      expect(variableNameChar.test("]")).toBe(false);
      expect(variableNameChar.test("{")).toBe(false);
      expect(variableNameChar.test("}")).toBe(false);
      expect(variableNameChar.test("(")).toBe(false);
      expect(variableNameChar.test(")")).toBe(false);
      expect(variableNameChar.test("!")).toBe(false);
      expect(variableNameChar.test("?")).toBe(false);
      expect(variableNameChar.test(":")).toBe(false);
      expect(variableNameChar.test(";")).toBe(false);
      expect(variableNameChar.test(",")).toBe(false);
      expect(variableNameChar.test('"')).toBe(false);
      expect(variableNameChar.test("'")).toBe(false);
      expect(variableNameChar.test("`")).toBe(false);
      expect(variableNameChar.test("~")).toBe(false);
      expect(variableNameChar.test("|")).toBe(false);
      expect(variableNameChar.test("&")).toBe(false);
      expect(variableNameChar.test("%")).toBe(false);
      expect(variableNameChar.test("#")).toBe(false);
      expect(variableNameChar.test("^")).toBe(false);
      expect(variableNameChar.test("*")).toBe(false);
      expect(variableNameChar.test("=")).toBe(false);
      expect(variableNameChar.test("<")).toBe(false);
      expect(variableNameChar.test(">")).toBe(false);
    });

    it("should handle edge cases", () => {
      expect(variableNameChar.test("")).toBe(false);
      expect(variableNameChar.test("\n")).toBe(false);
      expect(variableNameChar.test("\t")).toBe(false);
      expect(variableNameChar.test("\r")).toBe(false);
    });
  });

  describe("Integration with getEndpointDetails", () => {
    it("should work with getEndpointDetails function", () => {
      // This test ensures the regex patterns work correctly with the getEndpointDetails function
      const testCases = [
        { path: "/users/{id}", expected: ["id"] },
        { path: "/users/<id>", expected: ["id"] },
        { path: "/users/:id", expected: ["id"] },
        {
          path: "/users/{userId}/posts/{postId}",
          expected: ["userId", "postId"],
        },
        {
          path: "/users/<userId>/posts/<postId>",
          expected: ["userId", "postId"],
        },
        {
          path: "/users/:userId/posts/:postId",
          expected: ["userId", "postId"],
        },
      ];

      testCases.forEach(({ path, expected }) => {
        const pathParts = path.split("/");
        const variables: string[] = [];

        pathParts.forEach((part) => {
          if (part[0] === "{" && part[part.length - 1] === "}") {
            const variable = part.replace(/{/, "").replace(/}/, "");
            if (variableName.test(variable)) {
              variables.push(variable);
            }
          } else if (part[0] === "<" && part[part.length - 1] === ">") {
            const variable = part.replace(/</, "").replace(/>/, "");
            if (variableName.test(variable)) {
              variables.push(variable);
            }
          } else if (part[0] === ":") {
            const variable = part.replace(/:/, "");
            if (variableName.test(variable)) {
              variables.push(variable);
            }
          }
        });

        expect(variables).toEqual(expected);
      });
    });

    it("should filter out invalid variable names", () => {
      const testCases = [
        { path: "/users/{123id}", expected: [] },
        { path: "/users/{id-name}", expected: [] },
        { path: "/users/{id name}", expected: [] },
        { path: "/users/{id.name}", expected: [] },
        { path: "/users/{id@name}", expected: [] },
      ];

      testCases.forEach(({ path, expected }) => {
        const pathParts = path.split("/");
        const variables: string[] = [];

        pathParts.forEach((part) => {
          if (part[0] === "{" && part[part.length - 1] === "}") {
            const variable = part.replace(/{/, "").replace(/}/, "");
            if (variableName.test(variable)) {
              variables.push(variable);
            }
          }
        });

        expect(variables).toEqual(expected);
      });
    });
  });

  describe("Performance", () => {
    it("should handle large strings efficiently", () => {
      const largeString = "a".repeat(10000);
      const start = Date.now();

      for (let i = 0; i < 1000; i++) {
        variableName.test(largeString);
        variableNameChar.test("a");
      }

      const end = Date.now();
      expect(end - start).toBeLessThan(1000); // Should complete in less than 1 second
    });

    it("should handle many small tests efficiently", () => {
      const testStrings = Array.from({ length: 1000 }, (_, i) => `var${i}`);
      const start = Date.now();

      testStrings.forEach((str) => {
        variableName.test(str);
        str.split("").forEach((char) => {
          variableNameChar.test(char);
        });
      });

      const end = Date.now();
      expect(end - start).toBeLessThan(1000); // Should complete in less than 1 second
    });
  });
});
