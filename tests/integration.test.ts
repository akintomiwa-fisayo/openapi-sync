import { Init } from "../index";
import OpenapiSync from "../Openapi-sync";
import fs from "fs";
import path from "path";
import axios from "axios";
import SwaggerParser from "@apidevtools/swagger-parser";

// Mock all dependencies
jest.mock("axios");
jest.mock("@apidevtools/swagger-parser");
jest.mock("fs");
jest.mock("path");

const mockedAxios = axios as jest.Mocked<typeof axios>;
const mockedSwaggerParser = SwaggerParser as jest.Mocked<typeof SwaggerParser>;
const mockedFs = fs as jest.Mocked<typeof fs>;
const mockedPath = path as jest.Mocked<typeof path>;

describe.skip("Integration Tests", () => {
  const mockOpenApiSpec = {
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

    // Mock path operations
    mockedPath.join.mockImplementation((...args) => args.join("/"));
    mockedPath.dirname.mockImplementation((p) =>
      p.split("/").slice(0, -1).join("/")
    );

    // Mock fs operations
    mockedFs.existsSync.mockReturnValue(true);
    mockedFs.writeFileSync.mockImplementation(() => {});
    mockedFs.promises = {
      mkdir: jest.fn().mockResolvedValue(undefined),
      writeFile: jest.fn().mockResolvedValue(undefined),
    } as any;

    // Mock axios
    mockedAxios.create.mockReturnValue({
      get: jest.fn().mockResolvedValue({
        data: mockOpenApiSpec,
      }),
    } as any);

    // Mock SwaggerParser functions
    mockedSwaggerParser.validate.mockResolvedValue(mockOpenApiSpec as any);
    mockedSwaggerParser.parse.mockResolvedValue(mockOpenApiSpec as any);

    // Mock OpenapiSync
    jest.doMock("../Openapi-sync", () => ({
      __esModule: true,
      default: jest.fn().mockResolvedValue(undefined),
    }));
  });

  describe("Full Workflow Integration", () => {
    it("should complete full workflow from Init to file generation", async () => {
      const config = {
        refetchInterval: 5000,
        folder: "./src/api",
        api: {
          petstore: "https://petstore3.swagger.io/api/v3/openapi.json",
        },
        server: 0,
      };

      // Mock config loading
      jest.doMock("openapi.sync.json", () => config, { virtual: true });

      await Init();

      expect(mockedAxios.create).toHaveBeenCalled();
      expect(mockedSwaggerParser.parse).toHaveBeenCalledWith(mockOpenApiSpec);
    });

    it("should handle multiple APIs in sequence", async () => {
      const config = {
        refetchInterval: 5000,
        folder: "./src/api",
        api: {
          petstore: "https://petstore3.swagger.io/api/v3/openapi.json",
          jsonplaceholder: "https://jsonplaceholder.typicode.com/openapi.yaml",
        },
        server: 0,
      };

      jest.doMock("openapi.sync.json", () => config, { virtual: true });

      await Init();

      expect(mockedAxios.create).toHaveBeenCalled();
      expect(mockedSwaggerParser.parse).toHaveBeenCalled();
    });

    it("should handle folder splitting workflow", async () => {
      const config = {
        refetchInterval: 5000,
        folder: "./src/api",
        api: {
          petstore: "https://petstore3.swagger.io/api/v3/openapi.json",
        },
        folderSplit: {
          byTags: true,
        },
      };

      jest.doMock("openapi.sync.json", () => config, { virtual: true });

      await Init();

      expect(mockedFs.promises.mkdir).toHaveBeenCalled();
      expect(mockedFs.promises.writeFile).toHaveBeenCalled();
    });

    it("should handle type generation with custom naming", async () => {
      const config = {
        refetchInterval: 5000,
        folder: "./src/api",
        api: {
          petstore: "https://petstore3.swagger.io/api/v3/openapi.json",
        },
        types: {
          name: {
            prefix: "I",
            useOperationId: true,
            format: (source: any, data: any, defaultName: any) => {
              if (source === "shared") {
                return `${data.name}Type`;
              }
              return defaultName;
            },
          },
        },
      };

      jest.doMock("openapi.sync.json", () => config, { virtual: true });

      await Init();

      expect(mockedFs.promises.writeFile).toHaveBeenCalled();
    });

    it("should handle endpoint filtering workflow", async () => {
      const config = {
        refetchInterval: 5000,
        folder: "./src/api",
        api: {
          petstore: "https://petstore3.swagger.io/api/v3/openapi.json",
        },
        endpoints: {
          exclude: {
            tags: ["deprecated"],
            endpoints: [{ path: "/admin/users", method: "DELETE" }],
          },
        },
      };

      jest.doMock("openapi.sync.json", () => config, { virtual: true });

      await Init();

      expect(mockedFs.promises.writeFile).toHaveBeenCalled();
    });
  });

  describe("Error Recovery Integration", () => {
    it("should handle network errors and retry", async () => {
      const config = {
        refetchInterval: 5000,
        folder: "./src/api",
        api: {
          petstore: "https://petstore3.swagger.io/api/v3/openapi.json",
        },
      };

      // Mock network error
      mockedAxios.create.mockReturnValue({
        get: jest.fn().mockRejectedValue(new Error("Network Error")),
      } as any);

      jest.doMock("openapi.sync.json", () => config, { virtual: true });

      await expect(Init()).rejects.toThrow("Network Error");
    });

    it("should handle file system errors gracefully", async () => {
      const config = {
        refetchInterval: 5000,
        folder: "./src/api",
        api: {
          petstore: "https://petstore3.swagger.io/api/v3/openapi.json",
        },
      };

      // Mock file system error
      (mockedFs.promises.writeFile as jest.Mock).mockRejectedValue(
        new Error("Write error")
      );

      jest.doMock("openapi.sync.json", () => config, { virtual: true });

      await expect(Init()).rejects.toThrow("Write error");
    });

    it("should handle invalid OpenAPI spec", async () => {
      const config = {
        refetchInterval: 5000,
        folder: "./src/api",
        api: {
          petstore: "https://petstore3.swagger.io/api/v3/openapi.json",
        },
      };

      // Mock invalid spec
      mockedSwaggerParser.parse.mockRejectedValue(new Error("Invalid spec"));

      jest.doMock("openapi.sync.json", () => config, { virtual: true });

      await expect(Init()).rejects.toThrow("Invalid spec");
    });
  });

  describe("Configuration Integration", () => {
    it("should handle function-based configuration", async () => {
      const configFunction = () => ({
        refetchInterval: 5000,
        folder: "./src/api",
        api: {
          "local-api": "http://localhost:3000/openapi.json",
        },
      });

      jest.doMock("openapi.sync.ts", () => ({ default: configFunction }), {
        virtual: true,
      });

      await Init();

      expect(mockedAxios.create).toHaveBeenCalled();
    });

    it("should handle environment-based configuration", async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "development";

      const config = {
        refetchInterval: 5000,
        folder: "./src/api",
        api: {
          "dev-api": "http://localhost:3000/openapi.json",
        },
      };

      jest.doMock("openapi.sync.json", () => config, { virtual: true });

      await Init();

      expect(mockedAxios.create).toHaveBeenCalled();

      process.env.NODE_ENV = originalEnv;
    });

    it("should handle missing configuration gracefully", async () => {
      mockedFs.existsSync.mockReturnValue(false);

      await expect(Init()).rejects.toThrow("No config found");
    });
  });

  describe("Performance Integration", () => {
    it("should handle large OpenAPI specs efficiently", async () => {
      const largeSpec = {
        ...mockOpenApiSpec,
        paths: Object.fromEntries(
          Array.from({ length: 1000 }, (_, i) => [
            `/path${i}`,
            {
              get: {
                operationId: `getPath${i}`,
                summary: `Get path ${i}`,
                responses: {
                  "200": {
                    description: "successful operation",
                    content: {
                      "application/json": {
                        schema: {
                          type: "object",
                          properties: {
                            id: { type: "integer" },
                            name: { type: "string" },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          ])
        ),
      };

      mockedAxios.create.mockReturnValue({
        get: jest.fn().mockResolvedValue({
          data: largeSpec,
        }),
      } as any);

      mockedSwaggerParser.parse.mockResolvedValue(largeSpec as any);

      const config = {
        refetchInterval: 5000,
        folder: "./src/api",
        api: {
          "large-api": "https://api.example.com/openapi.json",
        },
      };

      jest.doMock("openapi.sync.json", () => config, { virtual: true });

      const start = Date.now();
      await Init();
      const end = Date.now();

      expect(end - start).toBeLessThan(10000); // Should complete in less than 10 seconds
      expect(mockedFs.promises.writeFile).toHaveBeenCalled();
    });
  });
});
