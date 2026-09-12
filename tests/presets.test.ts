import { PRESETS, applyPreset, PresetName } from "../Openapi-sync/presets";
import { tryLoadConfig } from "../Openapi-sync/config-loader";
import { nonInteractiveInit } from "../Openapi-sync/interactive-init";
import fs from "fs";

const mockFs = fs as jest.Mocked<typeof fs>;

describe("Feature 2: Preset System", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Preset Definitions", () => {
    const expectedPresets: PresetName[] = [
      "react-query-zod",
      "react-query-yup",
      "swr-zod",
      "swr-yup",
      "axios-zod",
      "axios-joi",
      "fetch-zod",
      "rtk-query-zod",
      "next-fetch",
      "python-basic",
    ];

    it.each(expectedPresets)("should define preset %s correctly", (name) => {
      const preset = PRESETS[name];
      expect(preset).toBeDefined();
      expect(preset.endpoints?.doc?.showCurl).toBe(false);
      if (name === "python-basic") {
        expect(preset.language).toBe("python");
      } else if (name === "next-fetch") {
        expect(preset.clientGeneration?.type).toBe("fetch");
        expect(preset.validations?.disable).toBe(true);
      } else {
        expect(preset.clientGeneration?.enabled).toBe(true);
      }
    });
  });

  describe("applyPreset", () => {
    it("should deep-merge preset defaults into a minimal user config", () => {
      const userConfig = {
        preset: "react-query-zod",
        api: { petstore: "https://petstore3.swagger.io/api/v3/openapi.json" },
        folder: "./src/api",
      };

      const resolved = applyPreset(userConfig as any, "react-query-zod");

      expect(resolved.preset).toBe("react-query-zod");
      expect(resolved.api.petstore).toBe("https://petstore3.swagger.io/api/v3/openapi.json");
      expect(resolved.folder).toBe("./src/api");
      expect(resolved.clientGeneration?.enabled).toBe(true);
      expect(resolved.clientGeneration?.type).toBe("react-query");
      expect(resolved.clientGeneration?.reactQuery?.version).toBe(5);
      expect(resolved.validations?.library).toBe("zod");
      expect(resolved.types?.name?.prefix).toBe("I");
      expect(resolved.endpoints?.name?.useOperationId).toBe(true);
    });

    it("should allow user config values to override preset defaults", () => {
      const userConfig = {
        preset: "react-query-zod",
        api: { petstore: "https://petstore3.swagger.io/api/v3/openapi.json" },
        folder: "./src/api",
        validations: { library: "yup" as const },
        types: { name: { prefix: "Api" } },
      };

      const resolved = applyPreset(userConfig as any, "react-query-zod");

      // Overridden
      expect(resolved.validations?.library).toBe("yup");
      expect(resolved.types?.name?.prefix).toBe("Api");
      // Preserved from preset
      expect(resolved.types?.name?.useOperationId).toBe(true);
      expect(resolved.clientGeneration?.type).toBe("react-query");
    });

    it("should throw a clear error for an unknown preset name", () => {
      const userConfig = {
        preset: "non-existent-preset",
        api: { test: "http://example.com" },
      };

      expect(() => {
        applyPreset(userConfig as any, "non-existent-preset");
      }).toThrow('Unknown preset "non-existent-preset"');
    });
  });

  describe("config-loader with presets", () => {
    it("should resolve preset when loading config from disk", () => {
      mockFs.existsSync.mockImplementation((filePath: any) => {
        return typeof filePath === "string" && filePath.endsWith("openapi.sync.json");
      });

      mockFs.readFileSync.mockImplementation((filePath: any) => {
        return JSON.stringify({
          preset: "axios-zod",
          api: { sample: "https://example.com/spec.json" },
          folder: "./out",
        });
      });

      const result = tryLoadConfig();
      expect(result.config).toBeDefined();
      expect(result.config?.preset).toBe("axios-zod");
      expect(result.config?.clientGeneration?.type).toBe("axios");
      expect(result.config?.validations?.library).toBe("zod");
    });

    it("should return an error when config has an invalid preset", () => {
      mockFs.existsSync.mockImplementation((filePath: any) => {
        return typeof filePath === "string" && filePath.endsWith("openapi.sync.json");
      });

      mockFs.readFileSync.mockImplementation(() => {
        return JSON.stringify({
          preset: "invalid-preset-xyz",
          api: { sample: "https://example.com/spec.json" },
        });
      });

      const result = tryLoadConfig();
      expect(result.config).toBeNull();
      expect(result.error).toContain("Invalid preset");
    });
  });

  describe("nonInteractiveInit with preset", () => {
    it("should create concise config containing preset without expanding defaults", async () => {
      mockFs.existsSync.mockReturnValue(false);
      mockFs.writeFileSync = jest.fn();

      const res = await nonInteractiveInit({
        apiName: "testapi",
        apiSource: "https://example.com/openapi.json",
        preset: "react-query-zod",
        configFormat: "json",
        silent: true,
      });

      expect(res.success).toBe(true);
      expect(mockFs.writeFileSync).toHaveBeenCalled();
      const writtenContent = (mockFs.writeFileSync as jest.Mock).mock.calls[0][1];
      const parsed = JSON.parse(writtenContent);
      expect(parsed.preset).toBe("react-query-zod");
      expect(parsed.api.testapi).toBe("https://example.com/openapi.json");
      expect(parsed.clientGeneration).toBeUndefined();
      expect(parsed.validations).toBeUndefined();
    });

    it("should default endpoints.doc.showCurl to false when no preset is used", async () => {
      mockFs.existsSync.mockReturnValue(false);
      mockFs.writeFileSync = jest.fn();

      const res = await nonInteractiveInit({
        apiName: "testapi",
        apiSource: "https://example.com/openapi.json",
        configFormat: "json",
        silent: true,
      });

      expect(res.success).toBe(true);
      expect(mockFs.writeFileSync).toHaveBeenCalled();
      const writtenContent = (mockFs.writeFileSync as jest.Mock).mock.calls[0][1];
      const parsed = JSON.parse(writtenContent);
      expect(parsed.endpoints?.doc?.showCurl).toBe(false);
    });
  });
});
