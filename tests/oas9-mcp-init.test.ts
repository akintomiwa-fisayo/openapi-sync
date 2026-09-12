import { nonInteractiveInit, serializeObjectToTs } from "../Openapi-sync/interactive-init";
import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const mockFs = fs as jest.Mocked<typeof fs>;

describe("OAS-9: MCP and Init Polish", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("9a: MCP CLI help and version flags", () => {
    it("bin/mcp.js --help prints usage and exits cleanly with 0", () => {
      const output = execSync("node bin/mcp.js --help", {
        cwd: path.join(__dirname, ".."),
        encoding: "utf-8",
      });

      expect(output).toContain("openapi-sync MCP Server");
      expect(output).toContain("Usage:");
      expect(output).toContain("--help");
      expect(output).toContain("--version");
    });

    it("bin/mcp.js --version prints package version and exits cleanly with 0", () => {
      const realFs = jest.requireActual("fs");
      const pkg = JSON.parse(
        realFs.readFileSync(path.join(__dirname, "../package.json"), "utf-8")
      );
      const output = execSync("node bin/mcp.js --version", {
        cwd: path.join(__dirname, ".."),
        encoding: "utf-8",
      }).trim();

      expect(output).toBe(pkg.version);
    });
  });

  describe("9b: nonInteractiveInit with preset and auth options", () => {
    it("creates config with preset and bearer auth", async () => {
      mockFs.writeFileSync = jest.fn();

      const result = await nonInteractiveInit({
        apiName: "billing",
        apiSource: "https://api.example.com/openapi.json",
        preset: "react-query-zod",
        authType: "bearer",
        authToken: "test-token-123",
        configFormat: "json",
        silent: true,
      });

      expect(result.success).toBe(true);
      expect(mockFs.writeFileSync).toHaveBeenCalled();

      const written = JSON.parse(
        (mockFs.writeFileSync as jest.Mock).mock.calls[0][1]
      );
      expect(written.preset).toBe("react-query-zod");
      expect(written.api.billing).toEqual({
        url: "https://api.example.com/openapi.json",
        auth: {
          type: "bearer",
          token: "test-token-123",
        },
      });
    });

    it("creates config with basic auth", async () => {
      mockFs.writeFileSync = jest.fn();

      const result = await nonInteractiveInit({
        apiName: "internal",
        apiSource: "https://internal.example.com/spec.json",
        authType: "basic",
        authUsername: "admin",
        authToken: "secret",
        configFormat: "json",
        silent: true,
      });

      expect(result.success).toBe(true);
      const written = JSON.parse(
        (mockFs.writeFileSync as jest.Mock).mock.calls[0][1]
      );
      expect(written.api.internal).toEqual({
        url: "https://internal.example.com/spec.json",
        auth: {
          type: "basic",
          username: "admin",
          password: "secret",
        },
      });
    });
  });

  describe("9c: Non-interactive TS config uses defineConfig with unquoted keys", () => {
    it("serializes objects to clean TypeScript with unquoted keys", () => {
      const configObj = {
        folder: "./src/api",
        api: {
          petstore: "https://petstore3.swagger.io/api/v3/openapi.json",
        },
        preset: "react-query-zod",
        runSync: false,
      };

      const tsCode = serializeObjectToTs(configObj, 0);

      expect(tsCode).toContain("folder: \"./src/api\"");
      expect(tsCode).toContain("preset: \"react-query-zod\"");
      expect(tsCode).not.toContain('"folder":');
      expect(tsCode).not.toContain('"preset":');
    });

    it("emits defineConfig for typescript configFormat", async () => {
      mockFs.writeFileSync = jest.fn();

      const result = await nonInteractiveInit({
        apiName: "petstore",
        apiSource: "https://petstore3.swagger.io/api/v3/openapi.json",
        preset: "react-query-zod",
        configFormat: "typescript",
        silent: true,
      });

      expect(result.success).toBe(true);
      const writtenContent = (mockFs.writeFileSync as jest.Mock).mock.calls[0][1] as string;

      expect(writtenContent).toContain('import { defineConfig } from "openapi-sync";');
      expect(writtenContent).toContain("export default defineConfig({");
      expect(writtenContent).not.toContain('import { IConfig } from "openapi-sync";');
      expect(writtenContent).not.toContain("const config: IConfig =");
    });
  });
});
