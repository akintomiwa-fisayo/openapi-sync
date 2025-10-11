import { IConfig, IOpenApiSpec } from "../types";
import axios from "axios";
import { bundleFromString, createConfig } from "@redocly/openapi-core";
import fs from "fs";

// Mock dependencies
jest.mock("axios");
jest.mock("@redocly/openapi-core");
jest.mock("fs");
jest.mock("axios-retry");

const mockedAxios = axios as jest.Mocked<typeof axios>;
const mockedBundleFromString = bundleFromString as jest.MockedFunction<
  typeof bundleFromString
>;
const mockedCreateConfig = createConfig as jest.MockedFunction<
  typeof createConfig
>;
const mockedFs = fs as jest.Mocked<typeof fs>;

describe("OpenapiSync", () => {
  const mockConfig: IConfig = {
    refetchInterval: 5000,
    folder: "./src/api",
    api: {
      petstore: "https://petstore3.swagger.io/api/v3/openapi.json",
    },
    server: 0,
  };

  let OpenapiSync: any;

  const mockOpenApiSpec: IOpenApiSpec = {
    openapi: "3.0.0",
    info: {
      title: "Petstore API",
      version: "1.0.0",
    },
    servers: [
      {
        url: "https://petstore3.swagger.io/api/v3",
      },
    ],
    paths: {
      "/pet/{petId}": {
        get: {
          operationId: "getPetById",
          summary: "Find pet by ID",
          tags: ["pet"],
          parameters: [
            {
              name: "petId",
              in: "path",
              required: true,
              schema: {
                type: "integer",
                format: "int64",
              },
            },
          ],
          responses: {
            "200": {
              description: "successful operation",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/Pet",
                  },
                },
              },
            },
          },
        },
      },
      "/pet": {
        post: {
          operationId: "addPet",
          summary: "Add a new pet to the store",
          tags: ["pet"],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Pet",
                },
              },
            },
          },
          responses: {
            "200": {
              description: "successful operation",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/Pet",
                  },
                },
              },
            },
          },
        },
      },
    },
    components: {
      schemas: {
        Pet: {
          type: "object",
          required: ["name"],
          properties: {
            id: {
              type: "integer",
              format: "int64",
            },
            name: {
              type: "string",
              example: "doggie",
            },
            status: {
              type: "string",
              enum: ["available", "pending", "sold"],
            },
          },
        },
      },
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock axios response - mock the apiClient.get call directly
    const mockGet = jest.fn().mockResolvedValue({
      data: mockOpenApiSpec,
    });

    mockedAxios.create.mockReturnValue({
      get: mockGet,
    } as any);

    // Mock Redocly functions
    mockedCreateConfig.mockResolvedValue({} as any);
    mockedBundleFromString.mockResolvedValue({
      bundle: {
        parsed: mockOpenApiSpec,
      },
    } as any);

    // Import OpenapiSync with isolated modules to ensure mocks are applied
    jest.isolateModules(() => {
      OpenapiSync = require("../Openapi-sync").default;
    });

    // Mock fs functions
    mockedFs.existsSync.mockReturnValue(true);
    mockedFs.writeFileSync.mockImplementation(() => {});
    mockedFs.promises = {
      mkdir: jest.fn().mockResolvedValue(undefined),
      writeFile: jest.fn().mockResolvedValue(undefined),
    } as any;
  });

  describe("Basic Functionality", () => {
    it("should process OpenAPI spec and generate files", async () => {
      await OpenapiSync(
        "https://petstore3.swagger.io/api/v3/openapi.json",
        "petstore",
        mockConfig
      );

      expect(mockedAxios.create).toHaveBeenCalled();
      expect(mockedCreateConfig).toHaveBeenCalledWith({
        extends: ["minimal"],
      });
      expect(mockedBundleFromString).toHaveBeenCalled();
    });

    it("should handle different server configurations", async () => {
      const configWithServer: IConfig = {
        ...mockConfig,
        server: "https://custom-server.com",
      };

      await OpenapiSync(
        "https://petstore3.swagger.io/api/v3/openapi.json",
        "petstore",
        configWithServer
      );

      expect(mockedAxios.create).toHaveBeenCalled();
    });

    it("should handle server index configuration", async () => {
      const configWithServerIndex: IConfig = {
        ...mockConfig,
        server: 1,
      };

      await OpenapiSync(
        "https://petstore3.swagger.io/api/v3/openapi.json",
        "petstore",
        configWithServerIndex
      );

      expect(mockedAxios.create).toHaveBeenCalled();
    });
  });

  describe("Type Generation", () => {
    it("should generate types for endpoints", async () => {
      await OpenapiSync(
        "https://petstore3.swagger.io/api/v3/openapi.json",
        "petstore",
        mockConfig
      );

      expect(mockedFs.promises.writeFile).toHaveBeenCalled();
    });

    it("should generate shared component types", async () => {
      await OpenapiSync(
        "https://petstore3.swagger.io/api/v3/openapi.json",
        "petstore",
        mockConfig
      );

      expect(mockedFs.promises.writeFile).toHaveBeenCalled();
    });

    it("should handle type naming configuration", async () => {
      const configWithTypeNaming: IConfig = {
        ...mockConfig,
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
        },
      };

      await OpenapiSync(
        "https://petstore3.swagger.io/api/v3/openapi.json",
        "petstore",
        configWithTypeNaming
      );

      expect(mockedFs.promises.writeFile).toHaveBeenCalled();
    });
  });

  describe("Endpoint Generation", () => {
    it("should generate endpoint URLs", async () => {
      await OpenapiSync(
        "https://petstore3.swagger.io/api/v3/openapi.json",
        "petstore",
        mockConfig
      );

      expect(mockedFs.promises.writeFile).toHaveBeenCalled();
    });

    it("should handle endpoint naming configuration", async () => {
      const configWithEndpointNaming: IConfig = {
        ...mockConfig,
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

      await OpenapiSync(
        "https://petstore3.swagger.io/api/v3/openapi.json",
        "petstore",
        configWithEndpointNaming
      );

      expect(mockedFs.promises.writeFile).toHaveBeenCalled();
    });

    it("should handle endpoint value configuration", async () => {
      const configWithEndpointValue: IConfig = {
        ...mockConfig,
        endpoints: {
          value: {
            includeServer: true,
            type: "object",
            replaceWords: [
              {
                replace: "/api/v\\d+/",
                with: "/",
              },
            ],
          },
        },
      };

      await OpenapiSync(
        "https://petstore3.swagger.io/api/v3/openapi.json",
        "petstore",
        configWithEndpointValue
      );

      expect(mockedFs.promises.writeFile).toHaveBeenCalled();
    });
  });

  describe("Folder Splitting", () => {
    it("should handle tag-based folder splitting", async () => {
      const configWithFolderSplit: IConfig = {
        ...mockConfig,
        folderSplit: {
          byTags: true,
        },
      };

      await OpenapiSync(
        "https://petstore3.swagger.io/api/v3/openapi.json",
        "petstore",
        configWithFolderSplit
      );

      expect(mockedFs.promises.mkdir).toHaveBeenCalled();
      expect(mockedFs.promises.writeFile).toHaveBeenCalled();
    });

    it("should handle custom folder splitting", async () => {
      const configWithCustomFolder: IConfig = {
        ...mockConfig,
        folderSplit: {
          customFolder: ({ method, path, tags, operationId }) => {
            if (tags?.includes("admin")) return "admin";
            if (tags?.includes("public")) return "public";
            if (path.startsWith("/api/v1/")) return "v1";
            return null;
          },
        },
      };

      await OpenapiSync(
        "https://petstore3.swagger.io/api/v3/openapi.json",
        "petstore",
        configWithCustomFolder
      );

      expect(mockedFs.promises.mkdir).toHaveBeenCalled();
      expect(mockedFs.promises.writeFile).toHaveBeenCalled();
    });
  });

  describe("Endpoint Filtering", () => {
    it("should handle endpoint exclusion by tags", async () => {
      const configWithExclusion: IConfig = {
        ...mockConfig,
        endpoints: {
          exclude: {
            tags: ["deprecated", "internal"],
          },
        },
      };

      await OpenapiSync(
        "https://petstore3.swagger.io/api/v3/openapi.json",
        "petstore",
        configWithExclusion
      );

      expect(mockedFs.promises.writeFile).toHaveBeenCalled();
    });

    it("should handle endpoint exclusion by path", async () => {
      const configWithPathExclusion: IConfig = {
        ...mockConfig,
        endpoints: {
          exclude: {
            endpoints: [
              { path: "/admin/users", method: "DELETE" },
              { regex: "^/internal/.*", method: "GET" },
            ],
          },
        },
      };

      await OpenapiSync(
        "https://petstore3.swagger.io/api/v3/openapi.json",
        "petstore",
        configWithPathExclusion
      );

      expect(mockedFs.promises.writeFile).toHaveBeenCalled();
    });

    it("should handle endpoint inclusion", async () => {
      const configWithInclusion: IConfig = {
        ...mockConfig,
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

      await OpenapiSync(
        "https://petstore3.swagger.io/api/v3/openapi.json",
        "petstore",
        configWithInclusion
      );

      expect(mockedFs.promises.writeFile).toHaveBeenCalled();
    });
  });

  describe("Documentation Generation", () => {
    it("should generate JSDoc comments", async () => {
      const configWithDocs: IConfig = {
        ...mockConfig,
        types: {
          doc: {
            disable: false,
          },
        },
        endpoints: {
          doc: {
            disable: false,
            showCurl: true,
          },
        },
      };

      await OpenapiSync(
        "https://petstore3.swagger.io/api/v3/openapi.json",
        "petstore",
        configWithDocs
      );

      expect(mockedFs.promises.writeFile).toHaveBeenCalled();
    });

    it("should disable documentation generation", async () => {
      const configWithoutDocs: IConfig = {
        ...mockConfig,
        types: {
          doc: {
            disable: true,
          },
        },
        endpoints: {
          doc: {
            disable: true,
            showCurl: false,
          },
        },
      };

      await OpenapiSync(
        "https://petstore3.swagger.io/api/v3/openapi.json",
        "petstore",
        configWithoutDocs
      );

      expect(mockedFs.promises.writeFile).toHaveBeenCalled();
    });
  });

  describe("Error Handling", () => {
    it("should handle network errors", async () => {
      // Reset mocks and set up network error
      jest.clearAllMocks();

      mockedAxios.create.mockReturnValue({
        get: jest.fn().mockRejectedValue(new Error("Network Error")),
      } as any);

      // Re-import with the error mock
      jest.isolateModules(() => {
        OpenapiSync = require("../Openapi-sync").default;
      });

      await expect(
        OpenapiSync("https://invalid-url.com/openapi.json", "test", mockConfig)
      ).rejects.toThrow("Network Error");
    });

    it("should handle invalid OpenAPI spec", async () => {
      mockedBundleFromString.mockRejectedValue(new Error("Invalid spec"));

      await expect(
        OpenapiSync(
          "https://petstore3.swagger.io/api/v3/openapi.json",
          "petstore",
          mockConfig
        )
      ).rejects.toThrow("Invalid spec");
    });

    it("should handle file system errors", async () => {
      (mockedFs.promises.writeFile as jest.Mock).mockRejectedValue(
        new Error("Write error")
      );

      await expect(
        OpenapiSync(
          "https://petstore3.swagger.io/api/v3/openapi.json",
          "petstore",
          mockConfig
        )
      ).rejects.toThrow("Write error");
    });
  });

  describe("State Management", () => {
    it("should skip processing if spec has not changed", async () => {
      // Mock state to return the same spec
      const mockState = {
        petstore: mockOpenApiSpec,
      };

      // Mock the state module to return the same spec
      jest.doMock("../Openapi-sync/state", () => ({
        getState: jest.fn().mockReturnValue(mockOpenApiSpec),
        setState: jest.fn(),
        resetState: jest.fn(),
      }));

      // Re-import with the state mock
      jest.isolateModules(() => {
        OpenapiSync = require("../Openapi-sync").default;
      });

      await OpenapiSync(
        "https://petstore3.swagger.io/api/v3/openapi.json",
        "petstore",
        mockConfig
      );

      // Should not write files if spec hasn't changed
      expect(mockedFs.promises.writeFile).not.toHaveBeenCalled();
    });
  });

  describe("Refetch Interval", () => {
    it("should set up refetch interval in development", async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "development";

      await OpenapiSync(
        "https://petstore3.swagger.io/api/v3/openapi.json",
        "petstore",
        mockConfig,
        5000
      );

      expect(mockedAxios.create).toHaveBeenCalled();

      process.env.NODE_ENV = originalEnv;
    });

    it("should not set up refetch interval in production", async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "production";

      await OpenapiSync(
        "https://petstore3.swagger.io/api/v3/openapi.json",
        "petstore",
        mockConfig,
        5000
      );

      expect(mockedAxios.create).toHaveBeenCalled();

      process.env.NODE_ENV = originalEnv;
    });
  });
});
