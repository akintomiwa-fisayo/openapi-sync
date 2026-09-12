import { execSync } from "child_process";
import path from "path";
import { nonInteractiveInit } from "../Openapi-sync/interactive-init";

const fs = jest.requireActual("fs") as typeof import("fs");

describe("OAS-10: CLI init auth flags", () => {
  const rootDir = path.resolve(__dirname, "..");
  const testDir = path.join(__dirname, "temp-oas10-test");

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

  it("init --help includes all spec auth options", () => {
    const output = execSync("node bin/cli.js init --help", {
      cwd: rootDir,
      encoding: "utf-8",
    });

    expect(output).toContain("--auth-type");
    expect(output).toContain("--auth-token");
    expect(output).toContain("--auth-username");
    expect(output).toContain("--auth-password");
    expect(output).toContain("--auth-name");
    expect(output).toContain("--auth-value");
    expect(output).toContain("--auth-in");
    expect(output).toContain("--auth-header");
  });

  it("CLI init with bearer auth writes config with auth block and exits 0", () => {
    const cmd = `node "${path.join(rootDir, "bin/cli.js")}" init --no-interactive --api-name backend --api-url http://localhost:3001/api-json --auth-type bearer --auth-token '\${env.SPEC_TOKEN}' --preset react-query-zod --json`;
    const output = execSync(cmd, {
      cwd: testDir,
      encoding: "utf-8",
    });

    const parsed = JSON.parse(output.trim());
    expect(parsed.success).toBe(true);
    expect(parsed.configFile).toBe("openapi.sync.ts");
    expect(parsed.errors).toEqual([]);

    const writtenConfigPath = path.join(testDir, "openapi.sync.ts");
    expect(fs.existsSync(writtenConfigPath)).toBe(true);
    const content = fs.readFileSync(writtenConfigPath, "utf-8");
    expect(content).toContain('type: "bearer"');
    expect(content).toContain('token: "${env.SPEC_TOKEN}"');
  });

  it("CLI init with basic auth writes config with username and password", () => {
    const cmd = `node "${path.join(rootDir, "bin/cli.js")}" init --no-interactive --api-name internal --api-url https://internal.example.com/spec.json --auth-type basic --auth-username admin --auth-password secretpass --config-format json --json`;
    const output = execSync(cmd, {
      cwd: testDir,
      encoding: "utf-8",
    });

    const parsed = JSON.parse(output.trim());
    expect(parsed.success).toBe(true);

    const jsonPath = path.join(testDir, "openapi.sync.json");
    const jsonContent = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));
    expect(jsonContent.api.internal.auth).toEqual({
      type: "basic",
      username: "admin",
      password: "secretpass",
    });
  });

  it("CLI init with apiKey auth writes config with in, name, and value", () => {
    const cmd = `node "${path.join(rootDir, "bin/cli.js")}" init --no-interactive --api-name secure-api --api-url https://api.example.com/spec.json --auth-type apiKey --auth-in query --auth-name api_key --auth-value my-key-123 --config-format json --json`;
    const output = execSync(cmd, {
      cwd: testDir,
      encoding: "utf-8",
    });

    const parsed = JSON.parse(output.trim());
    expect(parsed.success).toBe(true);

    const jsonPath = path.join(testDir, "openapi.sync.json");
    const jsonContent = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));
    expect(jsonContent.api["secure-api"].auth).toEqual({
      type: "apiKey",
      in: "query",
      name: "api_key",
      value: "my-key-123",
    });
  });

  it("CLI init with custom auth writes config with custom headers", () => {
    const cmd = `node "${path.join(rootDir, "bin/cli.js")}" init --no-interactive --api-name custom-api --api-url https://api.example.com/spec.json --auth-type custom --auth-header 'X-Custom-Secret: mysecret' --config-format json --json`;
    const output = execSync(cmd, {
      cwd: testDir,
      encoding: "utf-8",
    });

    const parsed = JSON.parse(output.trim());
    expect(parsed.success).toBe(true);

    const jsonPath = path.join(testDir, "openapi.sync.json");
    const jsonContent = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));
    expect(jsonContent.api["custom-api"].auth).toEqual({
      type: "custom",
      headers: {
        "X-Custom-Secret": "mysecret",
      },
    });
  });

  it("strict() still rejects truly unknown flags with CLI_PARSE_ERROR", () => {
    let error: any;
    try {
      execSync(
        `node "${path.join(rootDir, "bin/cli.js")}" init --no-interactive --api-name backend --api-url http://localhost:3001/api-json --unknown-bogus-flag --json`,
        {
          cwd: testDir,
          encoding: "utf-8",
          stdio: "pipe",
        }
      );
    } catch (e) {
      error = e;
    }

    expect(error).toBeDefined();
    expect(error.status).toBe(1);
    const stdout = error.stdout.toString();
    const parsed = JSON.parse(stdout.trim());
    expect(parsed.success).toBe(false);
    expect(parsed.error.code).toBe("CLI_PARSE_ERROR");
    expect(parsed.error.message).toContain("unknown-bogus-flag");
  });
});
