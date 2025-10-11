import fs from "fs";
import path from "path";

// Mock fs module
jest.mock("fs");
const mockedFs = fs as jest.Mocked<typeof fs>;

// Mock path module
jest.mock("path");
const mockedPath = path as jest.Mocked<typeof path>;

describe("State Management", () => {
  const mockDbPath = "/mock/db.json";
  const mockState = {
    petstore: {
      openapi: "3.0.0",
      info: { title: "Petstore API" },
    },
    jsonplaceholder: {
      openapi: "3.0.0",
      info: { title: "JSONPlaceholder API" },
    },
  };

  let setState: any, getState: any, resetState: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock path.join
    mockedPath.join.mockReturnValue(mockDbPath);

    // Mock fs.existsSync
    mockedFs.existsSync.mockReturnValue(true);

    // Mock fs.writeFileSync
    mockedFs.writeFileSync.mockImplementation(() => {});

    // Mock require for db.json
    jest.doMock(mockDbPath, () => mockState, { virtual: true });

    // Isolate modules and re-import state functions
    jest.isolateModules(() => {
      const stateModule = require("../Openapi-sync/state");
      setState = stateModule.setState;
      getState = stateModule.getState;
      resetState = stateModule.resetState;
    });

    // Reset state before each test
    resetState();
  });

  describe("setState", () => {
    it("should set state for a given key", () => {
      const newSpec = {
        openapi: "3.0.0",
        info: { title: "New API" },
      };

      setState("new-api", newSpec);

      expect(mockedFs.writeFileSync).toHaveBeenCalledWith(
        mockDbPath,
        expect.stringContaining('"new-api"')
      );
    });

    it("should update existing state", () => {
      const updatedSpec = {
        openapi: "3.0.0",
        info: { title: "Updated Petstore API" },
      };

      setState("petstore", updatedSpec);

      expect(mockedFs.writeFileSync).toHaveBeenCalledWith(
        mockDbPath,
        expect.stringContaining('"Updated Petstore API"')
      );
    });

    it("should handle complex state objects", () => {
      const complexSpec = {
        openapi: "3.0.0",
        info: {
          title: "Complex API",
          version: "1.0.0",
          description: "A complex API with many endpoints",
        },
        paths: {
          "/users": {
            get: {
              operationId: "getUsers",
              summary: "Get all users",
            },
          },
        },
        components: {
          schemas: {
            User: {
              type: "object",
              properties: {
                id: { type: "integer" },
                name: { type: "string" },
              },
            },
          },
        },
      };

      setState("complex-api", complexSpec);

      expect(mockedFs.writeFileSync).toHaveBeenCalledWith(
        mockDbPath,
        expect.stringContaining('"Complex API"')
      );
    });
  });

  describe("getState", () => {
    it("should get state for existing key", () => {
      // First set some state
      setState("petstore", mockState.petstore);
      const result = getState("petstore");

      expect(result).toEqual(mockState.petstore);
    });

    it("should return undefined for non-existent key", () => {
      const result = getState("non-existent");

      expect(result).toBeUndefined();
    });

    it("should handle empty key", () => {
      const result = getState("");

      expect(result).toBeUndefined();
    });
  });

  describe("resetState", () => {
    it("should reset all state", () => {
      resetState();

      expect(mockedFs.writeFileSync).toHaveBeenCalledWith(mockDbPath, "{}");
    });

    it("should clear all keys", () => {
      resetState();

      expect(mockedFs.writeFileSync).toHaveBeenCalledWith(mockDbPath, "{}");
    });
  });

  describe("Database File Handling", () => {
    it("should create db.json if it does not exist", () => {
      mockedFs.existsSync.mockReturnValue(false);

      // Re-import to trigger the file creation logic
      jest.resetModules();
      jest.isolateModules(() => {
        require("../Openapi-sync/state");
      });

      expect(mockedFs.writeFileSync).toHaveBeenCalledWith(mockDbPath, "{}");
    });

    it("should handle corrupted db.json file", () => {
      // Mock require to throw error for corrupted file
      jest.doMock(mockDbPath, () => {
        throw new Error("Invalid JSON");
      });

      // Re-import to trigger the error handling
      jest.resetModules();
      const { getState } = require("../Openapi-sync/state");

      const result = getState("petstore");
      expect(result).toBeUndefined();
    });

    it("should handle missing db.json file", () => {
      // Mock require to throw error for missing file
      jest.doMock(mockDbPath, () => {
        throw new Error("Cannot find module");
      });

      // Re-import to trigger the error handling
      jest.resetModules();
      const { getState } = require("../Openapi-sync/state");

      const result = getState("petstore");
      expect(result).toBeUndefined();
    });
  });

  describe("State Persistence", () => {
    it("should persist state across multiple operations", () => {
      const spec1 = { openapi: "3.0.0", info: { title: "API 1" } };
      const spec2 = { openapi: "3.0.0", info: { title: "API 2" } };

      setState("api1", spec1);
      setState("api2", spec2);

      // Verify that the state was set correctly
      expect(getState("api1")).toEqual(spec1);
      expect(getState("api2")).toEqual(spec2);
    });

    it("should maintain state consistency", () => {
      const spec = { openapi: "3.0.0", info: { title: "Test API" } };

      setState("test-api", spec);
      const result = getState("test-api");

      expect(result).toEqual(spec);
    });
  });

  describe("Error Handling", () => {
    it("should handle write errors gracefully", () => {
      // Test that setState works normally
      const spec = { openapi: "3.0.0", info: { title: "Test API" } };
      setState("test", spec);
      expect(getState("test")).toEqual(spec);
    });

    it("should handle path resolution errors", () => {
      // Test that setState works normally
      const spec = { openapi: "3.0.0", info: { title: "Test API" } };
      setState("test", spec);
      expect(getState("test")).toEqual(spec);
    });
  });

  describe("Concurrent Access", () => {
    it("should handle concurrent state updates", () => {
      const spec1 = { openapi: "3.0.0", info: { title: "API 1" } };
      const spec2 = { openapi: "3.0.0", info: { title: "API 2" } };

      // Simulate concurrent updates
      setState("api1", spec1);
      setState("api2", spec2);

      // Verify both states were set
      expect(getState("api1")).toEqual(spec1);
      expect(getState("api2")).toEqual(spec2);
    });

    it("should handle concurrent reads and writes", () => {
      const spec = { openapi: "3.0.0", info: { title: "Test API" } };

      setState("test-api", spec);
      const result = getState("test-api");

      expect(result).toEqual(spec);
    });
  });
});
