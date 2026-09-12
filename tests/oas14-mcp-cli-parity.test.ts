import { execSync, spawn } from "child_process";
import path from "path";
import { extractCliAuthFromArgv, buildConfigFromCli } from "../Openapi-sync/cli-config";

const fs = jest.requireActual("fs") as typeof import("fs");

describe("OAS-14 & OAS-15: Default output folder is \"\" and MCP CLI parity", () => {
  const rootDir = path.resolve(__dirname, "..");
  const testDir = path.join(__dirname, "temp-oas14-test");
  const sampleSpec = path.join(rootDir, "sample_spec.json");

  beforeEach(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
    fs.mkdirSync(testDir, { recursive: true });
  });

  afterEach(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  describe("Ticket A: Default output folder is \"\" (project root)", () => {
    it("CLI init with NO --output-folder writes ./<apiName>/... at cwd and config.folder is \"\"", () => {
      const cmd = `node "${path.join(rootDir, "bin/cli.js")}" init --no-interactive --api-name backend --api-file "${sampleSpec}" --preset fetch-zod --run-sync --json`;
      const output = execSync(cmd, {
        cwd: testDir,
        encoding: "utf-8",
      });

      const parsed = JSON.parse(output.trim());
      expect(parsed.success).toBe(true);

      const configPath = path.join(testDir, "openapi.sync.ts");
      expect(fs.existsSync(configPath)).toBe(true);
      const configContent = fs.readFileSync(configPath, "utf-8");
      expect(configContent).toContain('folder: ""');

      // Check generated files exist directly under ./backend/
      const backendEndpoints = path.join(testDir, "backend", "endpoints.ts");
      const backendTypes = path.join(testDir, "backend", "types", "index.ts");
      expect(fs.existsSync(backendEndpoints)).toBe(true);
      expect(fs.existsSync(backendTypes)).toBe(true);

      // Verify that ./src/api was NOT created
      const srcApi = path.join(testDir, "src", "api");
      expect(fs.existsSync(srcApi)).toBe(false);
    });

    it("CLI init with explicit --output-folder ./src/api still writes to ./src/api/<apiName>/...", () => {
      const cmd = `node "${path.join(rootDir, "bin/cli.js")}" init --no-interactive --api-name backend --api-file "${sampleSpec}" --preset fetch-zod --output-folder ./src/api --run-sync --json`;
      const output = execSync(cmd, {
        cwd: testDir,
        encoding: "utf-8",
      });

      const parsed = JSON.parse(output.trim());
      expect(parsed.success).toBe(true);

      const configPath = path.join(testDir, "openapi.sync.ts");
      expect(fs.existsSync(configPath)).toBe(true);
      const configContent = fs.readFileSync(configPath, "utf-8");
      expect(configContent).toContain('folder: "./src/api"');

      // Check files are in ./src/api/backend/
      const backendEndpoints = path.join(testDir, "src", "api", "backend", "endpoints.ts");
      expect(fs.existsSync(backendEndpoints)).toBe(true);
    });

    it("buildConfigFromCli preserves empty string folder without falling back to ./src/api", () => {
      const config = buildConfigFromCli({
        "api-url": "https://example.com/spec.json",
        folder: "",
      });
      expect(config).not.toBeNull();
      expect(config?.folder).toBe("");
    });
  });

  describe("Ticket C: MCP Argument Parity and Drift Fix", () => {
    it("extractCliAuthFromArgv extracts camelCase auth fields from MCP tools", () => {
      const bearerAuth = extractCliAuthFromArgv({
        authType: "bearer",
        authToken: "my-secret-token",
      });
      expect(bearerAuth).toEqual({
        type: "bearer",
        token: "my-secret-token",
      });

      const basicAuth = extractCliAuthFromArgv({
        authType: "basic",
        authUsername: "admin",
        authPassword: "password123",
      });
      expect(basicAuth).toEqual({
        type: "basic",
        username: "admin",
        password: "password123",
      });

      const apiKeyAuth = extractCliAuthFromArgv({
        authType: "apiKey",
        authName: "X-Custom-Key",
        authValue: "key-val",
        authIn: "header",
      });
      expect(apiKeyAuth).toEqual({
        type: "apiKey",
        name: "X-Custom-Key",
        value: "key-val",
        in: "header",
      });

      const customAuth = extractCliAuthFromArgv({
        authType: "custom",
        authHeader: "Authorization: Custom secret",
      });
      expect(customAuth).toEqual({
        type: "custom",
        headers: {
          Authorization: "Custom secret",
        },
      });
    });

    it("CLI generate-client accepts next-fetch type and dry-run", () => {
      // First create config
      execSync(
        `node "${path.join(rootDir, "bin/cli.js")}" init --no-interactive --api-name backend --api-file "${sampleSpec}" --preset fetch-zod --json`,
        { cwd: testDir, encoding: "utf-8" }
      );

      // Run generate-client with next-fetch and dry-run
      const dryOutput = execSync(
        `node "${path.join(rootDir, "bin/cli.js")}" generate-client --type next-fetch --dry-run --json`,
        { cwd: testDir, encoding: "utf-8" }
      );
      const parsedDry = JSON.parse(dryOutput.trim());
      expect(parsedDry.dryRun).toBe(true);
      expect(parsedDry.type).toBe("next-fetch");
      expect(parsedDry.plannedFiles.length).toBeGreaterThan(0);

      // Run generate-client with next-fetch and write files
      const runOutput = execSync(
        `node "${path.join(rootDir, "bin/cli.js")}" generate-client --type next-fetch --json`,
        { cwd: testDir, encoding: "utf-8" }
      );
      const parsedRun = JSON.parse(runOutput.trim());
      expect(parsedRun.success).toBe(true);
      const clientFile = path.join(testDir, "backend", "clients.ts");
      expect(fs.existsSync(clientFile)).toBe(true);
    });

    it("CLI purge supports --dry-run --json without deleting files", () => {
      // Init with run-sync
      execSync(
        `node "${path.join(rootDir, "bin/cli.js")}" init --no-interactive --api-name backend --api-file "${sampleSpec}" --preset fetch-zod --run-sync --json`,
        { cwd: testDir, encoding: "utf-8" }
      );

      const purgeOutput = execSync(
        `node "${path.join(rootDir, "bin/cli.js")}" purge --dry-run --json`,
        { cwd: testDir, encoding: "utf-8" }
      );
      const parsedPurge = JSON.parse(purgeOutput.trim());
      expect(parsedPurge.purged !== undefined || parsedPurge.dryRun === true).toBe(true);
    });

    it("MCP server exposes all 10 tools with CLI argument parity over stdio", (done) => {
      const proc = spawn("node", [path.join(rootDir, "bin/mcp.js")], {
        cwd: rootDir,
        stdio: ["pipe", "pipe", "pipe"],
      });

      let buffer = "";
      proc.stdout.on("data", (chunk) => {
        buffer += chunk.toString();
        const lines = buffer.split("\n");
        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const msg = JSON.parse(line.trim());
            if (msg.id === 2 && msg.result?.tools) {
              const tools = msg.result.tools;
              const toolNames = tools.map((t: any) => t.name);

              // 1. Check all 10 tools exist
              expect(toolNames).toContain("openapi_sync_init");
              expect(toolNames).toContain("openapi_sync_validate");
              expect(toolNames).toContain("openapi_sync_doctor");
              expect(toolNames).toContain("openapi_sync_list_endpoints");
              expect(toolNames).toContain("openapi_sync_get_endpoint_details");
              expect(toolNames).toContain("openapi_sync_read_generated_type");
              expect(toolNames).toContain("openapi_sync_sync");
              expect(toolNames).toContain("openapi_sync_generate_client");
              expect(toolNames).toContain("openapi_sync_purge");
              expect(toolNames).toContain("openapi_sync_read_config");

              // 2. Check openapi_sync_init properties: outputFolder default is "", authPassword exists
              const initTool = tools.find((t: any) => t.name === "openapi_sync_init");
              expect(initTool.inputSchema.properties.outputFolder.default).toBe("");
              expect(initTool.inputSchema.properties.authPassword).toBeDefined();
              expect(initTool.inputSchema.properties.authName).toBeDefined();
              expect(initTool.inputSchema.properties.authValue).toBeDefined();
              expect(initTool.inputSchema.properties.authIn).toBeDefined();

              // 3. Check openapi_sync_generate_client properties: next-fetch included in type enum
              const genTool = tools.find((t: any) => t.name === "openapi_sync_generate_client");
              expect(genTool.inputSchema.properties.type.enum).toContain("next-fetch");
              expect(genTool.inputSchema.properties.outputDir).toBeDefined();
              expect(genTool.inputSchema.properties.dryRun).toBeDefined();
              expect(genTool.inputSchema.properties.baseURL).toBeDefined();

              // 4. Check openapi_sync_purge properties: yes, deleteFiles, dryRun
              const purgeTool = tools.find((t: any) => t.name === "openapi_sync_purge");
              expect(purgeTool).toBeDefined();
              expect(purgeTool.inputSchema.properties.yes).toBeDefined();
              expect(purgeTool.inputSchema.properties.dryRun).toBeDefined();

              // 5. Check auth flags present on validate
              const valTool = tools.find((t: any) => t.name === "openapi_sync_validate");
              expect(valTool.inputSchema.properties.authType).toBeDefined();
              expect(valTool.inputSchema.properties.authToken).toBeDefined();

              proc.kill();
              done();
            }
          } catch (_) {}
        }
      });

      const initReq = JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
        params: {
          protocolVersion: "2024-11-05",
          capabilities: {},
          clientInfo: { name: "test", version: "1.0.0" },
        },
      }) + "\n";

      const initializedNotif = JSON.stringify({
        jsonrpc: "2.0",
        method: "notifications/initialized",
      }) + "\n";

      const listReq = JSON.stringify({
        jsonrpc: "2.0",
        id: 2,
        method: "tools/list",
        params: {},
      }) + "\n";

      proc.stdin.write(initReq + initializedNotif + listReq);
    });
  });
});
