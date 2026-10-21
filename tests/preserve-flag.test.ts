import { execSync } from "child_process";
import path from "path";

const fs = jest.requireActual("fs") as typeof import("fs");

describe("CLI --preserve flag", () => {
  const rootDir = path.resolve(__dirname, "..");
  const testDir = path.join(__dirname, "temp-preserve-flag-test");
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

  it("should auto-create openapi.sync.ts when syncing with --preserve in configless mode", () => {
    const cmd = `node "${path.join(rootDir, "bin/cli.js")}" --api-file "${sampleSpec}" --api-name testapi --preset fetch-zod --folder ./src/api --preserve --json`;
    const output = execSync(cmd, { cwd: testDir, encoding: "utf-8" });
    const parsed = JSON.parse(output.trim());
    expect(parsed.success).toBe(true);

    const configPath = path.join(testDir, "openapi.sync.ts");
    expect(fs.existsSync(configPath)).toBe(true);

    const configContent = fs.readFileSync(configPath, "utf-8");
    expect(configContent).toContain("defineConfig");
    expect(configContent).toContain('preset: "fetch-zod"');
    expect(configContent).toContain('folder: "./src/api"');
    expect(configContent).toContain("testapi");
  });

  it("should auto-create openapi.sync.json when --config-format json is passed with --preserve", () => {
    const cmd = `node "${path.join(rootDir, "bin/cli.js")}" --api-file "${sampleSpec}" --api-name testapi --preset fetch-zod --folder ./src/api --preserve --config-format json --json`;
    const output = execSync(cmd, { cwd: testDir, encoding: "utf-8" });
    const parsed = JSON.parse(output.trim());
    expect(parsed.success).toBe(true);

    const configPath = path.join(testDir, "openapi.sync.json");
    expect(fs.existsSync(configPath)).toBe(true);

    const configJson = JSON.parse(fs.readFileSync(configPath, "utf-8"));
    expect(configJson.preset).toBe("fetch-zod");
    expect(configJson.folder).toBe("./src/api");
    expect(configJson.api.testapi).toBeDefined();
  });

  it("should NOT overwrite existing config when --preserve is used and a config file already exists", () => {
    const existingConfigPath = path.join(testDir, "openapi.sync.json");
    fs.writeFileSync(
      existingConfigPath,
      JSON.stringify({ folder: "./existing", api: { sample: sampleSpec } }, null, 2)
    );

    const cmd = `node "${path.join(rootDir, "bin/cli.js")}" --folder ./new-folder --preserve --json`;
    const output = execSync(cmd, { cwd: testDir, encoding: "utf-8" });
    const parsed = JSON.parse(output.trim());
    expect(parsed.success).toBe(true);

    // Existing config should remain untouched
    const configJson = JSON.parse(fs.readFileSync(existingConfigPath, "utf-8"));
    expect(configJson.folder).toBe("./existing");
    expect(fs.existsSync(path.join(testDir, "openapi.sync.ts"))).toBe(false);
  });
});
