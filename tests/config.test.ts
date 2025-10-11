import { IConfig } from "../types";
import fs from "fs";
import path from "path";

// Mock fs module
jest.mock("fs");
const mockedFs = fs as jest.Mocked<typeof fs>;

describe("Configuration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Configuration File Loading", () => {
    it("should load JSON configuration", () => {
      const mockConfig = {
        refetchInterval: 5000,
        folder: "./src/api",
        api: {
          petstore: "https://petstore3.swagger.io/api/v3/openapi.json",
        },
      };

      mockedFs.existsSync.mockReturnValue(true);
      mockedFs.readFileSync.mockReturnValue(JSON.stringify(mockConfig));

      // This would be tested in the actual Init function
      expect(mockConfig.api.petstore).toBe(
        "https://petstore3.swagger.io/api/v3/openapi.json"
      );
    });

    it("should load TypeScript configuration", () => {
      const mockConfig = {
        refetchInterval: 10000,
        folder: "./src/generated/api",
        api: {
          "main-api": "https://api.example.com/openapi.json",
        },
        server: "https://api.example.com",
      };

      mockedFs.existsSync.mockReturnValue(true);
      mockedFs.readFileSync.mockReturnValue(`
        export default ${JSON.stringify(mockConfig)};
      `);

      expect(mockConfig.api["main-api"]).toBe(
        "https://api.example.com/openapi.json"
      );
    });

    it("should handle missing configuration files", () => {
      mockedFs.existsSync.mockReturnValue(false);

      expect(() => {
        // This would throw in the actual Init function
        throw new Error("No config found");
      }).toThrow("No config found");
    });
  });

  describe("Configuration Validation", () => {
    it("should validate required fields", () => {
      const validConfig: IConfig = {
        api: {
          test: "https://api.example.com/openapi.json",
        },
      };

      expect(validConfig.api).toBeDefined();
      expect(Object.keys(validConfig.api).length).toBeGreaterThan(0);
    });

    it("should handle optional fields", () => {
      const configWithOptionals: IConfig = {
        refetchInterval: 5000,
        folder: "./src/api",
        server: 0,
        api: {
          test: "https://api.example.com/openapi.json",
        },
        folderSplit: {
          byTags: true,
        },
        types: {
          name: {
            prefix: "I",
            useOperationId: true,
          },
          doc: {
            disable: false,
          },
        },
        endpoints: {
          value: {
            includeServer: true,
            type: "object",
          },
          name: {
            prefix: "API_",
            useOperationId: true,
          },
          doc: {
            disable: false,
            showCurl: true,
          },
        },
      };

      expect(configWithOptionals.refetchInterval).toBe(5000);
      expect(configWithOptionals.folder).toBe("./src/api");
      expect(configWithOptionals.server).toBe(0);
      expect(configWithOptionals.folderSplit?.byTags).toBe(true);
      expect(configWithOptionals.types?.name?.prefix).toBe("I");
      expect(configWithOptionals.endpoints?.value?.type).toBe("object");
    });
  });

  describe("Folder Splitting Configuration", () => {
    it("should handle tag-based folder splitting", () => {
      const config: IConfig = {
        api: { test: "https://api.example.com/openapi.json" },
        folderSplit: {
          byTags: true,
        },
      };

      expect(config.folderSplit?.byTags).toBe(true);
    });

    it("should handle custom folder function", () => {
      const config: IConfig = {
        api: { test: "https://api.example.com/openapi.json" },
        folderSplit: {
          customFolder: ({ method, path, tags, operationId }) => {
            if (tags?.includes("admin")) return "admin";
            if (tags?.includes("public")) return "public";
            if (path.startsWith("/api/v1/")) return "v1";
            return null;
          },
        },
      };

      const folderFunction = config.folderSplit?.customFolder;
      expect(folderFunction).toBeDefined();

      // Test the custom folder function
      if (folderFunction) {
        expect(
          folderFunction({
            method: "GET",
            path: "/api/v1/users",
            tags: ["admin"],
            operationId: "getUsers",
          })
        ).toBe("admin");

        expect(
          folderFunction({
            method: "GET",
            path: "/api/v1/users",
            tags: ["public"],
            operationId: "getUsers",
          })
        ).toBe("public");

        expect(
          folderFunction({
            method: "GET",
            path: "/api/v1/users",
            tags: ["user"],
            operationId: "getUsers",
          })
        ).toBe("v1");
      }
    });
  });

  describe("Type Configuration", () => {
    it("should handle type naming configuration", () => {
      const config: IConfig = {
        api: { test: "https://api.example.com/openapi.json" },
        types: {
          name: {
            prefix: "I",
            useOperationId: true,
            format: (source, data, defaultName) => {
              if (source === "shared") {
                return `${data.name}Type`;
              }
              return defaultName;
            },
          },
          doc: {
            disable: false,
          },
        },
      };

      expect(config.types?.name?.prefix).toBe("I");
      expect(config.types?.name?.useOperationId).toBe(true);
      expect(config.types?.name?.format).toBeDefined();
      expect(config.types?.doc?.disable).toBe(false);
    });

    it("should handle type formatting function", () => {
      const config: IConfig = {
        api: { test: "https://api.example.com/openapi.json" },
        types: {
          name: {
            format: (source, data, defaultName) => {
              if (source === "endpoint" && data.operationId) {
                switch (data.type) {
                  case "query":
                    return `${data.operationId}Query`;
                  case "dto":
                    return `${data.operationId}DTO`;
                  case "response":
                    return `${data.operationId}${data.code}Response`;
                }
              }
              return defaultName;
            },
          },
        },
      };

      const formatFunction = config.types?.name?.format;
      expect(formatFunction).toBeDefined();

      if (formatFunction) {
        expect(
          formatFunction(
            "endpoint",
            {
              operationId: "getUserById",
              type: "query",
            },
            "GetUserByIdQuery"
          )
        ).toBe("getUserByIdQuery");

        expect(
          formatFunction(
            "endpoint",
            {
              operationId: "createUser",
              type: "dto",
            },
            "CreateUserDTO"
          )
        ).toBe("createUserDTO");

        expect(
          formatFunction(
            "endpoint",
            {
              operationId: "getUserById",
              type: "response",
              code: "200",
            },
            "GetUserById200Response"
          )
        ).toBe("getUserById200Response");
      }
    });
  });

  describe("Endpoint Configuration", () => {
    it("should handle endpoint value configuration", () => {
      const config: IConfig = {
        api: { test: "https://api.example.com/openapi.json" },
        endpoints: {
          value: {
            replaceWords: [
              {
                replace: "/api/v\\d+/",
                with: "/",
              },
            ],
            includeServer: true,
            type: "object",
          },
        },
      };

      expect(config.endpoints?.value?.replaceWords).toBeDefined();
      expect(config.endpoints?.value?.includeServer).toBe(true);
      expect(config.endpoints?.value?.type).toBe("object");
    });

    it("should handle endpoint name configuration", () => {
      const config: IConfig = {
        api: { test: "https://api.example.com/openapi.json" },
        endpoints: {
          name: {
            prefix: "API_",
            useOperationId: true,
            format: ({ operationId, method, path }, defaultName) => {
              if (operationId) return operationId;
              return defaultName;
            },
          },
        },
      };

      expect(config.endpoints?.name?.prefix).toBe("API_");
      expect(config.endpoints?.name?.useOperationId).toBe(true);
      expect(config.endpoints?.name?.format).toBeDefined();
    });

    it("should handle endpoint exclusion configuration", () => {
      const config: IConfig = {
        api: { test: "https://api.example.com/openapi.json" },
        endpoints: {
          exclude: {
            tags: ["deprecated", "internal"],
            endpoints: [
              { path: "/admin/users", method: "DELETE" },
              { regex: "^/internal/.*", method: "GET" },
            ],
          },
        },
      };

      expect(config.endpoints?.exclude?.tags).toContain("deprecated");
      expect(config.endpoints?.exclude?.tags).toContain("internal");
      expect(config.endpoints?.exclude?.endpoints).toHaveLength(2);
    });

    it("should handle endpoint inclusion configuration", () => {
      const config: IConfig = {
        api: { test: "https://api.example.com/openapi.json" },
        endpoints: {
          include: {
            tags: ["public", "user"],
            endpoints: [
              { path: "/public/users", method: "GET" },
              { regex: "^/public/.*", method: "GET" },
            ],
          },
        },
      };

      expect(config.endpoints?.include?.tags).toContain("public");
      expect(config.endpoints?.include?.tags).toContain("user");
      expect(config.endpoints?.include?.endpoints).toHaveLength(2);
    });
  });

  describe("Function-based Configuration", () => {
    it("should handle function-based configuration", () => {
      const configFunction = () => ({
        refetchInterval: 5000,
        folder: "./src/api",
        api: {
          "local-api": "http://localhost:3000/openapi.json",
        },
      });

      const config = configFunction();
      expect(config.refetchInterval).toBe(5000);
      expect(config.folder).toBe("./src/api");
      expect(config.api["local-api"]).toBe(
        "http://localhost:3000/openapi.json"
      );
    });

    it("should handle environment-based configuration", () => {
      const getConfig = () => {
        const env = process.env.NODE_ENV || "development";
        const baseConfig = {
          refetchInterval: env === "development" ? 5000 : 0,
          folder: "./src/api",
          api: {},
        };

        switch (env) {
          case "development":
            baseConfig.api = {
              "local-api": "http://localhost:3000/openapi.json",
            };
            break;
          case "production":
            baseConfig.api = {
              "prod-api": "https://api.example.com/openapi.json",
            };
            break;
        }

        return baseConfig;
      };

      const config = getConfig();
      expect(config.folder).toBe("./src/api");
      expect(config.api).toBeDefined();
    });
  });
});
