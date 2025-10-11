import OpenapiSync from "../Openapi-sync";
import fs from "fs";
import path from "path";

// Mock dependencies
jest.mock("../Openapi-sync");
jest.mock("fs");
jest.mock("path");

const mockedOpenapiSync = OpenapiSync as jest.MockedFunction<
  typeof OpenapiSync
>;
const mockedFs = fs as jest.Mocked<typeof fs>;
const mockedPath = path as jest.Mocked<typeof path>;

describe.skip("Init Function", () => {
  const mockConfig = {
    refetchInterval: 5000,
    folder: "./src/api",
    api: {
      petstore: "https://petstore3.swagger.io/api/v3/openapi.json",
      jsonplaceholder: "https://jsonplaceholder.typicode.com/openapi.yaml",
    },
    server: 0,
  };

  let Init: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock path.join to return predictable paths
    mockedPath.join.mockImplementation((...args) => {
      const path = args.join("/");
      if (path.includes("openapi.sync.json")) return "/mock/openapi.sync.json";
      if (path.includes("openapi.sync.ts")) return "/mock/openapi.sync.ts";
      if (path.includes("openapi.sync.js")) return "/mock/openapi.sync.js";
      return path;
    });

    // Mock fs.existsSync to return true for config files
    mockedFs.existsSync.mockImplementation((filePath) => {
      const path = String(filePath);
      return path.includes("openapi.sync");
    });

    // Mock the require function by overriding it
    const originalRequire = require;
    (global as any).require = jest.fn((id) => {
      if (id.includes("openapi.sync.json")) return mockConfig;
      if (id.includes("openapi.sync.ts")) return { default: mockConfig };
      if (id.includes("openapi.sync.js")) return mockConfig;
      if (id === "esbuild-register") return {};
      return originalRequire(id);
    });

    // Mock OpenapiSync
    mockedOpenapiSync.mockResolvedValue(undefined);

    // Import Init with isolated modules to apply mocks
    jest.isolateModules(() => {
      const { Init: InitFunction } = require("../index");
      Init = InitFunction;
    });
  });

  describe("Configuration Loading", () => {
    it("should load JSON configuration file", async () => {
      // Test that Init function can be called without errors
      await expect(Init()).resolves.not.toThrow();
    });

    it("should load TypeScript configuration file", async () => {
      mockedFs.existsSync.mockImplementation((filePath) => {
        if (String(filePath).includes("openapi.sync.ts")) return true;
        return false;
      });

      await Init();

      expect(mockedOpenapiSync).toHaveBeenCalled();
    });

    it("should load JavaScript configuration file", async () => {
      mockedFs.existsSync.mockImplementation((filePath) => {
        if (String(filePath).includes("openapi.sync.js")) return true;
        return false;
      });

      await Init();

      expect(mockedOpenapiSync).toHaveBeenCalled();
    });

    it("should handle function-based configuration", async () => {
      const functionConfig = () => mockConfig;
      jest.doMock("openapi.sync.ts", () => ({ default: functionConfig }));

      mockedFs.existsSync.mockImplementation((filePath) => {
        if (String(filePath).includes("openapi.sync.ts")) return true;
        return false;
      });

      await Init();

      expect(mockedOpenapiSync).toHaveBeenCalled();
    });

    it("should handle default export configuration", async () => {
      const configWithDefault = { default: mockConfig };
      jest.doMock("openapi.sync.ts", () => configWithDefault);

      mockedFs.existsSync.mockImplementation((filePath) => {
        if (String(filePath).includes("openapi.sync.ts")) return true;
        return false;
      });

      await Init();

      expect(mockedOpenapiSync).toHaveBeenCalled();
    });
  });

  describe("Options Handling", () => {
    it("should override refetch interval from options", async () => {
      const options = { refetchInterval: 10000 };

      await Init(options);

      expect(mockedOpenapiSync).toHaveBeenCalledWith(
        "https://petstore3.swagger.io/api/v3/openapi.json",
        "petstore",
        mockConfig,
        10000
      );
    });

    it("should use config refetch interval when options not provided", async () => {
      await Init();

      expect(mockedOpenapiSync).toHaveBeenCalledWith(
        "https://petstore3.swagger.io/api/v3/openapi.json",
        "petstore",
        mockConfig,
        5000
      );
    });

    it("should handle invalid refetch interval", async () => {
      const options = { refetchInterval: NaN };

      await Init(options);

      expect(mockedOpenapiSync).toHaveBeenCalledWith(
        "https://petstore3.swagger.io/api/v3/openapi.json",
        "petstore",
        mockConfig,
        5000
      );
    });
  });

  describe("Error Handling", () => {
    it("should throw error when no config found", async () => {
      mockedFs.existsSync.mockReturnValue(false);

      await expect(Init()).rejects.toThrow("No config found");
    });

    it("should handle config loading errors", async () => {
      mockedFs.existsSync.mockImplementation((filePath) => {
        if (String(filePath).includes("openapi.sync.json")) return true;
        return false;
      });

      // Mock require to throw error
      jest.doMock("openapi.sync.json", () => {
        throw new Error("Config loading error");
      });

      await Init();

      // Should continue with other config files or throw error
      expect(mockedOpenapiSync).not.toHaveBeenCalled();
    });

    it("should handle OpenapiSync errors", async () => {
      mockedOpenapiSync.mockRejectedValue(new Error("OpenapiSync error"));

      await expect(Init()).rejects.toThrow("OpenapiSync error");
    });
  });

  describe("Multiple API Handling", () => {
    it("should process multiple APIs", async () => {
      const multiApiConfig = {
        ...mockConfig,
        api: {
          petstore: "https://petstore3.swagger.io/api/v3/openapi.json",
          jsonplaceholder: "https://jsonplaceholder.typicode.com/openapi.yaml",
          github: "https://api.github.com/openapi.json",
        },
      };

      jest.doMock("openapi.sync.json", () => multiApiConfig);

      await Init();

      expect(mockedOpenapiSync).toHaveBeenCalledTimes(3);
      expect(mockedOpenapiSync).toHaveBeenCalledWith(
        "https://petstore3.swagger.io/api/v3/openapi.json",
        "petstore",
        multiApiConfig,
        undefined
      );
      expect(mockedOpenapiSync).toHaveBeenCalledWith(
        "https://jsonplaceholder.typicode.com/openapi.yaml",
        "jsonplaceholder",
        multiApiConfig,
        undefined
      );
      expect(mockedOpenapiSync).toHaveBeenCalledWith(
        "https://api.github.com/openapi.json",
        "github",
        multiApiConfig,
        undefined
      );
    });

    it("should handle empty API configuration", async () => {
      const emptyConfig = {
        ...mockConfig,
        api: {},
      };

      jest.doMock("openapi.sync.json", () => emptyConfig);

      await Init();

      expect(mockedOpenapiSync).not.toHaveBeenCalled();
    });
  });

  describe("State Management", () => {
    it("should reset state before processing", async () => {
      // Mock resetState function
      const mockResetState = jest.fn();
      jest.doMock("../Openapi-sync/state", () => ({
        resetState: mockResetState,
      }));

      await Init();

      expect(mockResetState).toHaveBeenCalled();
    });
  });

  describe("Environment Handling", () => {
    it("should work in different environments", async () => {
      const originalEnv = process.env.NODE_ENV;

      // Test development environment
      process.env.NODE_ENV = "development";
      await Init();
      expect(mockedOpenapiSync).toHaveBeenCalled();

      jest.clearAllMocks();

      // Test production environment
      process.env.NODE_ENV = "production";
      await Init();
      expect(mockedOpenapiSync).toHaveBeenCalled();

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe("Configuration Priority", () => {
    it("should prioritize JSON over TS over JS", async () => {
      // Mock all config files exist
      mockedFs.existsSync.mockReturnValue(true);

      // Mock different configs for each file type
      jest.doMock("openapi.sync.json", () => ({ api: { json: "config" } }));
      jest.doMock("openapi.sync.ts", () => ({
        default: { api: { ts: "config" } },
      }));
      jest.doMock("openapi.sync.js", () => ({ api: { js: "config" } }));

      await Init();

      // Should use JSON config (first priority)
      expect(mockedOpenapiSync).toHaveBeenCalledWith(
        expect.any(String),
        "json",
        expect.objectContaining({ api: { json: "config" } }),
        expect.any(Number)
      );
    });
  });
});
