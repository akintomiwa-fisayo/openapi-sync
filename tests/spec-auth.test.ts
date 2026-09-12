import {
  resolveEnvPlaceholders,
  buildAuthConfig,
  extractApiUrl,
  extractApiAuth,
} from "../Openapi-sync/spec-auth";
import { ISpecAuth, IApiSource } from "../types";

describe("Feature 3 & 4: Spec Auth", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe("resolveEnvPlaceholders", () => {
    it("should resolve single environment variable placeholder", () => {
      process.env.TEST_API_TOKEN = "secret_token_123";
      const resolved = resolveEnvPlaceholders("${env.TEST_API_TOKEN}");
      expect(resolved).toBe("secret_token_123");
    });

    it("should resolve multiple placeholders in a single string", () => {
      process.env.HOST = "api.internal.com";
      process.env.PORT = "8080";
      const resolved = resolveEnvPlaceholders("https://${env.HOST}:${env.PORT}/spec.json");
      expect(resolved).toBe("https://api.internal.com:8080/spec.json");
    });

    it("should return string unchanged if no placeholders exist", () => {
      expect(resolveEnvPlaceholders("plain-value-no-env")).toBe("plain-value-no-env");
    });

    it("should throw a helpful error if the environment variable is not defined", () => {
      delete process.env.MISSING_TOKEN;
      expect(() => {
        resolveEnvPlaceholders("${env.MISSING_TOKEN}");
      }).toThrow('Environment variable "MISSING_TOKEN" referenced in openapi-sync config is not set.');
    });
  });

  describe("buildAuthConfig", () => {
    it("should return empty object when auth is undefined", () => {
      expect(buildAuthConfig(undefined)).toEqual({});
    });

    it("should build Bearer auth header", () => {
      process.env.MY_BEARER_TOKEN = "jwt_abc_xyz";
      const auth: ISpecAuth = {
        type: "bearer",
        token: "${env.MY_BEARER_TOKEN}",
      };
      const config = buildAuthConfig(auth);
      expect(config.headers).toEqual({
        Authorization: "Bearer jwt_abc_xyz",
      });
    });

    it("should build Basic auth header with Base64 encoding", () => {
      process.env.API_USER = "admin";
      process.env.API_PASS = "supersecret";
      const auth: ISpecAuth = {
        type: "basic",
        username: "${env.API_USER}",
        password: "${env.API_PASS}",
      };
      const config = buildAuthConfig(auth);
      const expectedBase64 = Buffer.from("admin:supersecret").toString("base64");
      expect(config.headers).toEqual({
        Authorization: `Basic ${expectedBase64}`,
      });
    });

    it("should build ApiKey auth in header", () => {
      process.env.API_KEY_VAL = "key_999";
      const auth: ISpecAuth = {
        type: "apiKey",
        in: "header",
        name: "X-API-Key",
        value: "${env.API_KEY_VAL}",
      };
      const config = buildAuthConfig(auth);
      expect(config.headers).toEqual({
        "X-API-Key": "key_999",
      });
      expect(config.params).toBeUndefined();
    });

    it("should build ApiKey auth in query param", () => {
      process.env.API_KEY_VAL = "query_key_123";
      const auth: ISpecAuth = {
        type: "apiKey",
        in: "query",
        name: "api_key",
        value: "${env.API_KEY_VAL}",
      };
      const config = buildAuthConfig(auth);
      expect(config.params).toEqual({
        api_key: "query_key_123",
      });
      expect(config.headers).toBeUndefined();
    });

    it("should build custom headers auth", () => {
      process.env.TENANT_ID = "corp-123";
      const auth: ISpecAuth = {
        type: "custom",
        headers: {
          "X-Tenant-Id": "${env.TENANT_ID}",
          "X-Custom-Static": "static-header",
        },
      };
      const config = buildAuthConfig(auth);
      expect(config.headers).toEqual({
        "X-Tenant-Id": "corp-123",
        "X-Custom-Static": "static-header",
      });
    });
  });

  describe("extractApiUrl & extractApiAuth", () => {
    it("should handle plain string source", () => {
      const source: IApiSource = "https://example.com/openapi.json";
      expect(extractApiUrl(source)).toBe("https://example.com/openapi.json");
      expect(extractApiAuth(source)).toBeUndefined();
    });

    it("should handle object source with auth", () => {
      const source: IApiSource = {
        url: "https://example.com/openapi.json",
        auth: { type: "bearer", token: "xyz" },
      };
      expect(extractApiUrl(source)).toBe("https://example.com/openapi.json");
      expect(extractApiAuth(source)).toEqual({ type: "bearer", token: "xyz" });
    });
  });

  describe("loadProjectEnvironment & resetEnvLoadState", () => {
    it("should be exported and callable without throwing", () => {
      const { loadProjectEnvironment, resetEnvLoadState } = require("../Openapi-sync/spec-auth");
      expect(typeof loadProjectEnvironment).toBe("function");
      expect(typeof resetEnvLoadState).toBe("function");
      expect(() => resetEnvLoadState()).not.toThrow();
      expect(() => loadProjectEnvironment()).not.toThrow();
      expect(() => resetEnvLoadState()).not.toThrow();
    });
  });
});
