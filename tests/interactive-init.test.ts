import { interactiveInit } from "../Openapi-sync/interactive-init";
import prompts from "prompts";
import fs from "fs";
import path from "path";

// Mock modules
jest.mock("prompts");
jest.mock("fs");
jest.mock("../index", () => ({
  Init: jest.fn().mockResolvedValue(undefined),
  GenerateClient: jest.fn().mockResolvedValue(undefined),
}));

describe("Interactive Init", () => {
  const mockPrompts = prompts as jest.MockedFunction<typeof prompts>;
  const mockFs = fs as jest.Mocked<typeof fs>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockFs.existsSync = jest.fn().mockReturnValue(false);
    mockFs.writeFileSync = jest.fn();
    mockFs.readFileSync = jest.fn();
    mockFs.appendFileSync = jest.fn();
  });

  describe("Configuration file creation", () => {
    it("should create JSON config with basic settings", async () => {
      mockPrompts.mockResolvedValueOnce({
        configFormat: "json",
        apiSource: "url",
        apiUrl: "https://api.example.com/openapi.json",
        apiName: "myapi",
        outputFolder: "./src/api",
        generateClient: false,
        enableValidation: false,
        enableCustomCode: false,
        refetchInterval: 5000,
        runSync: false,
      });

      await interactiveInit();

      expect(mockFs.writeFileSync).toHaveBeenCalledWith(
        expect.stringContaining("openapi.sync.json"),
        expect.stringContaining(
          '"myapi": "https://api.example.com/openapi.json"'
        ),
        "utf-8"
      );
    });

    it("should create TypeScript config", async () => {
      mockPrompts.mockResolvedValueOnce({
        configFormat: "typescript",
        apiSource: "url",
        apiUrl: "https://api.example.com/openapi.json",
        apiName: "myapi",
        outputFolder: "./src/api",
        generateClient: false,
        enableValidation: false,
        enableCustomCode: false,
        refetchInterval: 0,
        runSync: false,
      });

      await interactiveInit();

      expect(mockFs.writeFileSync).toHaveBeenCalledWith(
        expect.stringContaining("openapi.sync.ts"),
        expect.stringMatching(/import.*IConfig.*openapi-sync/),
        "utf-8"
      );
    });

    it("should create JavaScript config", async () => {
      mockPrompts.mockResolvedValueOnce({
        configFormat: "javascript",
        apiSource: "file",
        apiFile: "./openapi.yaml",
        apiName: "testapi",
        outputFolder: "./api",
        generateClient: false,
        enableValidation: false,
        enableCustomCode: false,
        refetchInterval: 3000,
        runSync: false,
      });

      await interactiveInit();

      expect(mockFs.writeFileSync).toHaveBeenCalledWith(
        expect.stringContaining("openapi.sync.js"),
        expect.stringMatching(/module\.exports/),
        "utf-8"
      );
    });
  });

  describe("Client generation configuration", () => {
    it("should add React Query client config", async () => {
      mockPrompts.mockResolvedValueOnce({
        configFormat: "json",
        apiSource: "url",
        apiUrl: "https://api.example.com/openapi.json",
        apiName: "myapi",
        outputFolder: "./src/api",
        generateClient: true,
        clientType: "react-query",
        enableValidation: false,
        enableCustomCode: false,
        refetchInterval: 5000,
        runSync: false,
      });

      await interactiveInit();

      const writeCall = mockFs.writeFileSync.mock.calls[0];
      const configContent = writeCall[1] as string;
      const config = JSON.parse(configContent);

      expect(config.clientGeneration).toBeDefined();
      expect(config.clientGeneration.type).toBe("react-query");
      expect(config.clientGeneration.reactQuery).toBeDefined();
    });

    it("should add SWR client config", async () => {
      mockPrompts.mockResolvedValueOnce({
        configFormat: "json",
        apiSource: "url",
        apiUrl: "https://api.example.com/openapi.json",
        apiName: "myapi",
        outputFolder: "./src/api",
        generateClient: true,
        clientType: "swr",
        enableValidation: false,
        enableCustomCode: false,
        refetchInterval: 5000,
        runSync: false,
      });

      await interactiveInit();

      const writeCall = mockFs.writeFileSync.mock.calls[0];
      const configContent = writeCall[1] as string;
      const config = JSON.parse(configContent);

      expect(config.clientGeneration).toBeDefined();
      expect(config.clientGeneration.type).toBe("swr");
      expect(config.clientGeneration.swr).toBeDefined();
    });

    it("should add Axios client config", async () => {
      mockPrompts.mockResolvedValueOnce({
        configFormat: "json",
        apiSource: "url",
        apiUrl: "https://api.example.com/openapi.json",
        apiName: "myapi",
        outputFolder: "./src/api",
        generateClient: true,
        clientType: "axios",
        enableValidation: false,
        enableCustomCode: false,
        refetchInterval: 5000,
        runSync: false,
      });

      await interactiveInit();

      const writeCall = mockFs.writeFileSync.mock.calls[0];
      const configContent = writeCall[1] as string;
      const config = JSON.parse(configContent);

      expect(config.clientGeneration).toBeDefined();
      expect(config.clientGeneration.type).toBe("axios");
    });
  });

  describe("Validation configuration", () => {
    it("should add Zod validation config", async () => {
      mockPrompts.mockResolvedValueOnce({
        configFormat: "json",
        apiSource: "url",
        apiUrl: "https://api.example.com/openapi.json",
        apiName: "myapi",
        outputFolder: "./src/api",
        generateClient: false,
        enableValidation: true,
        validationLibrary: "zod",
        enableCustomCode: false,
        refetchInterval: 5000,
        runSync: false,
      });

      await interactiveInit();

      const writeCall = mockFs.writeFileSync.mock.calls[0];
      const configContent = writeCall[1] as string;
      const config = JSON.parse(configContent);

      expect(config.validations).toBeDefined();
      expect(config.validations.library).toBe("zod");
    });

    it("should add Yup validation config", async () => {
      mockPrompts.mockResolvedValueOnce({
        configFormat: "json",
        apiSource: "url",
        apiUrl: "https://api.example.com/openapi.json",
        apiName: "myapi",
        outputFolder: "./src/api",
        generateClient: false,
        enableValidation: true,
        validationLibrary: "yup",
        enableCustomCode: false,
        refetchInterval: 5000,
        runSync: false,
      });

      await interactiveInit();

      const writeCall = mockFs.writeFileSync.mock.calls[0];
      const configContent = writeCall[1] as string;
      const config = JSON.parse(configContent);

      expect(config.validations).toBeDefined();
      expect(config.validations.library).toBe("yup");
    });
  });

  describe("Custom code configuration", () => {
    it("should add custom code config when enabled", async () => {
      mockPrompts.mockResolvedValueOnce({
        configFormat: "json",
        apiSource: "url",
        apiUrl: "https://api.example.com/openapi.json",
        apiName: "myapi",
        outputFolder: "./src/api",
        generateClient: false,
        enableValidation: false,
        enableCustomCode: true,
        refetchInterval: 5000,
        runSync: false,
      });

      await interactiveInit();

      const writeCall = mockFs.writeFileSync.mock.calls[0];
      const configContent = writeCall[1] as string;
      const config = JSON.parse(configContent);

      expect(config.customCode).toBeDefined();
      expect(config.customCode.enabled).toBe(true);
      expect(config.customCode.position).toBe("bottom");
    });

    it("should not add custom code config when disabled", async () => {
      mockPrompts.mockResolvedValueOnce({
        configFormat: "json",
        apiSource: "url",
        apiUrl: "https://api.example.com/openapi.json",
        apiName: "myapi",
        outputFolder: "./src/api",
        generateClient: false,
        enableValidation: false,
        enableCustomCode: false,
        refetchInterval: 5000,
        runSync: false,
      });

      await interactiveInit();

      const writeCall = mockFs.writeFileSync.mock.calls[0];
      const configContent = writeCall[1] as string;
      const config = JSON.parse(configContent);

      expect(config.customCode).toBeUndefined();
    });
  });

  describe("File handling", () => {
    it("should prompt for overwrite if config exists", async () => {
      mockFs.existsSync = jest.fn().mockReturnValue(true);
      mockFs.readFileSync = jest
        .fn()
        .mockReturnValue("# existing gitignore\nnode_modules/\n");

      mockPrompts
        .mockResolvedValueOnce({
          configFormat: "json",
          apiSource: "url",
          apiUrl: "https://api.example.com/openapi.json",
          apiName: "myapi",
          outputFolder: "./src/api",
          generateClient: false,
          enableValidation: false,
          enableCustomCode: false,
          refetchInterval: 5000,
          runSync: false,
        })
        .mockResolvedValueOnce({
          value: true, // Confirm overwrite
        });

      await interactiveInit();

      expect(mockPrompts).toHaveBeenCalledTimes(2);
      expect(mockFs.writeFileSync).toHaveBeenCalled();
    });

    it("should cancel if user declines overwrite", async () => {
      mockFs.existsSync = jest.fn().mockReturnValue(true);

      mockPrompts
        .mockResolvedValueOnce({
          configFormat: "json",
          apiSource: "url",
          apiUrl: "https://api.example.com/openapi.json",
          apiName: "myapi",
          outputFolder: "./src/api",
          generateClient: false,
          enableValidation: false,
          enableCustomCode: false,
          refetchInterval: 5000,
          runSync: false,
        })
        .mockResolvedValueOnce({
          value: false, // Decline overwrite
        });

      await expect(interactiveInit()).rejects.toThrow(
        "Configuration file not created"
      );

      expect(mockFs.writeFileSync).not.toHaveBeenCalled();
    });
  });

  describe("Refetch interval", () => {
    it("should handle 0 refetch interval", async () => {
      mockPrompts.mockResolvedValueOnce({
        configFormat: "json",
        apiSource: "url",
        apiUrl: "https://api.example.com/openapi.json",
        apiName: "myapi",
        outputFolder: "./src/api",
        generateClient: false,
        enableValidation: false,
        enableCustomCode: false,
        refetchInterval: 0,
        runSync: false,
      });

      await interactiveInit();

      const writeCall = mockFs.writeFileSync.mock.calls[0];
      const configContent = writeCall[1] as string;
      const config = JSON.parse(configContent);

      // Should not include refetchInterval if it's 0
      expect(config.refetchInterval).toBeUndefined();
    });

    it("should include custom refetch interval", async () => {
      mockPrompts.mockResolvedValueOnce({
        configFormat: "json",
        apiSource: "url",
        apiUrl: "https://api.example.com/openapi.json",
        apiName: "myapi",
        outputFolder: "./src/api",
        generateClient: false,
        enableValidation: false,
        enableCustomCode: false,
        refetchInterval: 10000,
        runSync: false,
      });

      await interactiveInit();

      const writeCall = mockFs.writeFileSync.mock.calls[0];
      const configContent = writeCall[1] as string;
      const config = JSON.parse(configContent);

      expect(config.refetchInterval).toBe(10000);
    });
  });
});
