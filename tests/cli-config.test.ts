import { buildConfigFromCli, extractCliAuthFromArgv } from "../Openapi-sync/cli-config";
import { tryLoadConfig, loadConfig } from "../Openapi-sync/config-loader";
import { ConfigNotFoundError } from "../errors";

describe("CLI Configuration & Zero-Config Mode", () => {
  describe("extractCliAuthFromArgv", () => {
    it("should extract bearer auth", () => {
      const auth = extractCliAuthFromArgv({ "auth-type": "bearer", "auth-token": "secret123" });
      expect(auth).toEqual({ type: "bearer", token: "secret123" });
    });

    it("should infer bearer auth from auth-token alone", () => {
      const auth = extractCliAuthFromArgv({ "auth-token": "secret123" });
      expect(auth).toEqual({ type: "bearer", token: "secret123" });
    });

    it("should extract basic auth", () => {
      const auth = extractCliAuthFromArgv({
        "auth-type": "basic",
        "auth-username": "admin",
        "auth-password": "password123",
      });
      expect(auth).toEqual({ type: "basic", username: "admin", password: "password123" });
    });

    it("should extract apiKey auth", () => {
      const auth = extractCliAuthFromArgv({
        "auth-type": "apiKey",
        "auth-name": "X-Token",
        "auth-value": "val123",
        "auth-in": "query",
      });
      expect(auth).toEqual({ type: "apiKey", in: "query", name: "X-Token", value: "val123" });
    });

    it("should extract custom header auth", () => {
      const auth = extractCliAuthFromArgv({
        "auth-type": "custom",
        "auth-header": ["X-Foo: Bar", "X-Baz: Qux"],
      });
      expect(auth).toEqual({
        type: "custom",
        headers: { "X-Foo": "Bar", "X-Baz": "Qux" },
      });
    });

    it("should return undefined if no auth flags are present", () => {
      const auth = extractCliAuthFromArgv({});
      expect(auth).toBeUndefined();
    });
  });

  describe("buildConfigFromCli (Zero Config Mode)", () => {
    it("should return null if no disk config exists and no API flags are provided", () => {
      const config = buildConfigFromCli({}, null);
      expect(config).toBeNull();
    });

    it("should return null if only non-API flags (like folder or language) are provided without disk config", () => {
      const config = buildConfigFromCli({ folder: "./api", language: "typescript" }, null);
      expect(config).toBeNull();
    });

    it("should construct config from --api-url with defaults", () => {
      const config = buildConfigFromCli({
        "api-url": "https://petstore3.swagger.io/api/v3/openapi.json",
      }, null);

      expect(config).not.toBeNull();
      expect(config?.folder).toBe("");
      expect(config?.api).toEqual({
        api: "https://petstore3.swagger.io/api/v3/openapi.json",
      });
    });

    it("should construct config with custom api-name and folder", () => {
      const config = buildConfigFromCli({
        "api-url": "https://example.com/spec.json",
        "api-name": "petstore",
        folder: "./lib/api",
      }, null);

      expect(config).not.toBeNull();
      expect(config?.folder).toBe("./lib/api");
      expect(config?.api).toEqual({
        petstore: "https://example.com/spec.json",
      });
    });

    it("should parse --api name=url syntax", () => {
      const config = buildConfigFromCli({
        api: ["users=https://api.example.com/users.json", "billing=https://api.example.com/billing.json"],
      }, null);

      expect(config).not.toBeNull();
      expect(config?.api).toEqual({
        users: "https://api.example.com/users.json",
        billing: "https://api.example.com/billing.json",
      });
    });

    it("should attach CLI auth to configured APIs", () => {
      const config = buildConfigFromCli({
        "api-url": "https://protected.example.com/spec.json",
        "api-name": "protectedApi",
        "auth-type": "bearer",
        "auth-token": "secret-jwt",
      }, null);

      expect(config?.api.protectedApi).toEqual({
        url: "https://protected.example.com/spec.json",
        auth: {
          type: "bearer",
          token: "secret-jwt",
        },
      });
    });

    it("should apply named preset via CLI", () => {
      const config = buildConfigFromCli({
        "api-url": "https://example.com/spec.json",
        preset: "react-query-zod",
      }, null);

      expect(config?.preset).toBe("react-query-zod");
      expect(config?.clientGeneration?.enabled).toBe(true);
      expect(config?.clientGeneration?.type).toBe("react-query");
      expect(config?.validations?.library).toBe("zod");
      expect(config?.types?.name?.prefix).toBe("I");
      expect(config?.endpoints?.name?.useOperationId).toBe(true);
    });

    it("should parse --config-json as raw configuration", () => {
      const rawJson = JSON.stringify({
        folder: "./custom-api",
        api: { serviceA: "https://example.com/a.json" },
        language: "python",
      });

      const config = buildConfigFromCli({ "config-json": rawJson }, null);
      expect(config?.folder).toBe("./custom-api");
      expect(config?.api).toEqual({ serviceA: "https://example.com/a.json" });
      expect(config?.language).toBe("python");
    });

    it("should throw a helpful error when invalid JSON is passed to --config-json", () => {
      expect(() => {
        buildConfigFromCli({ "config-json": "invalid-json-{" }, null);
      }).toThrow(/Invalid JSON passed to --config-json/);
    });

    it("should support --refetch-interval and --endpoint-type flags", () => {
      const config = buildConfigFromCli({
        "api-url": "https://example.com/spec.json",
        "refetch-interval": 5000,
        "endpoint-type": "object",
      }, null);

      expect(config?.refetchInterval).toBe(5000);
      expect(config?.endpoints?.value?.type).toBe("object");
    });

    it("should allow fine-grained validation and client generation flags", () => {
      const config = buildConfigFromCli({
        "api-url": "https://example.com/spec.json",
        "client-type": "axios",
        "client-output": "./custom/axios",
        "client-base-url": "https://backend.example.com",
        "validation-lib": "yup",
        "validations-query": true,
        "validations-dto": false,
        "split-by-tags": true,
        "type-prefix": "T",
        "no-docs": true,
        "show-curl": true,
      }, null);

      expect(config?.clientGeneration?.type).toBe("axios");
      expect(config?.clientGeneration?.outputDir).toBe("./custom/axios");
      expect(config?.clientGeneration?.baseURL).toBe("https://backend.example.com");
      expect(config?.validations?.library).toBe("yup");
      expect(config?.validations?.generate?.query).toBe(true);
      expect(config?.validations?.generate?.dto).toBe(false);
      expect(config?.folderSplit?.byTags).toBe(true);
      expect(config?.types?.name?.prefix).toBe("T");
      expect(config?.endpoints?.doc?.disable).toBe(true);
      expect(config?.endpoints?.doc?.showCurl).toBe(true);
    });
  });

  describe("buildConfigFromCli (Override Disk Config)", () => {
    it("should override existing disk config properties with CLI flags", () => {
      const diskConfig = {
        folder: "./src/old-api",
        api: {
          main: "https://old.example.com/spec.json",
        },
        preset: "react-query-zod" as const,
      };

      const merged = buildConfigFromCli({
        folder: "./src/new-api",
        "api-url": "https://new.example.com/spec.json",
        "api-name": "overrideApi",
      }, diskConfig);

      expect(merged?.folder).toBe("./src/new-api");
      expect(merged?.api.main).toBe("https://old.example.com/spec.json");
      expect(merged?.api.overrideApi).toBe("https://new.example.com/spec.json");
    });
  });

  describe("loadConfig and tryLoadConfig integration", () => {
    it("should throw ConfigNotFoundError when no config file exists and no CLI flags are given", () => {
      // In a non-existent temp dir
      expect(() => {
        loadConfig("/non/existent/path/for/test");
      }).toThrow(ConfigNotFoundError);
    });

    it("should load in-memory config without file when CLI flags contain API", () => {
      const config = loadConfig("/non/existent/path/for/test", {
        "api-url": "https://example.com/openapi.json",
        folder: "./test-api",
      });

      expect(config).toBeDefined();
      expect(config.folder).toBe("./test-api");
      expect(config.api.api).toBe("https://example.com/openapi.json");
    });

    it("should return foundPath as '[CLI Arguments]' when loaded purely from CLI", () => {
      const result = tryLoadConfig("/non/existent/path/for/test", {
        "api-url": "https://example.com/openapi.json",
      });

      expect(result.config).toBeDefined();
      expect(result.foundPath).toBe("[CLI Arguments]");
    });
  });

  describe("Public API zero-config cliArgs & auth support", () => {
    it("should accept cliArgs and auth options across all query APIs", async () => {
      const { ListEndpoints, GenerateClient, GetEndpointDetails, ReadGeneratedType } = require("../index");
      expect(typeof ListEndpoints).toBe("function");
      expect(typeof GenerateClient).toBe("function");
      expect(typeof GetEndpointDetails).toBe("function");
      expect(typeof ReadGeneratedType).toBe("function");
    });

    it("GetEndpointDetails should throw ConfigNotFoundError when no config on disk and no cliArgs", async () => {
      const { GetEndpointDetails } = require("../index");
      // In non-existent dir or without cliArgs
      const { ConfigNotFoundError } = require("../errors");
      const savedCwd = process.cwd();
      try {
        process.chdir("/tmp");
        await expect(
          GetEndpointDetails({ operationId: "testOp", silent: true })
        ).rejects.toThrow(ConfigNotFoundError);
      } finally {
        process.chdir(savedCwd);
      }
    });

    it("GetEndpointDetails should use cliArgs to locate spec without disk config", async () => {
      const { GetEndpointDetails } = require("../index");
      const { storeEndpoints } = require("../Openapi-sync/endpoint-store");
      const savedCwd = process.cwd();
      try {
        process.chdir("/tmp");
        storeEndpoints("petstore", [
          {
            name: "GetPet",
            method: "get",
            path: "/pet/{petId}",
            operationId: "getPetById",
          },
        ]);
        const result = await GetEndpointDetails({
          operationId: "getPetById",
          silent: true,
          cliArgs: {
            "api-url": "https://example.com/spec.json",
            "api-name": "petstore",
          },
        });
        expect(result.apiName).toBe("petstore");
        expect(result.endpoint.operationId).toBe("getPetById");
      } finally {
        process.chdir(savedCwd);
      }
    });

    it("ReadGeneratedType should throw ConfigNotFoundError when no config on disk and no cliArgs", async () => {
      const { ReadGeneratedType } = require("../index");
      const { ConfigNotFoundError } = require("../errors");
      const savedCwd = process.cwd();
      try {
        process.chdir("/tmp");
        await expect(
          ReadGeneratedType({ apiName: "testApi", typeName: "TestType", silent: true })
        ).rejects.toThrow(ConfigNotFoundError);
      } finally {
        process.chdir(savedCwd);
      }
    });

    it("ReadGeneratedType should use cliArgs to find type in specified folder", async () => {
      const { ReadGeneratedType } = require("../index");
      const fs = require("fs");

      (fs.existsSync as jest.Mock).mockImplementation((p: string) => {
        return typeof p === "string" && p.includes("shared.ts");
      });
      (fs.promises.readFile as jest.Mock).mockResolvedValue(
        "export interface UserProfile {\n  id: string;\n  name: string;\n}\n"
      );

      const typeDecl = await ReadGeneratedType({
        typeName: "UserProfile",
        silent: true,
        cliArgs: {
          folder: "./src/api",
          "api-name": "myapi",
          "api-url": "dummy",
        },
      });
      expect(typeDecl).toContain("export interface UserProfile");
      expect(typeDecl).toContain("id: string;");
    });
  });
});

