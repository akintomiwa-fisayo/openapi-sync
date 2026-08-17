/**
 * Phase 1 — CLI result accuracy tests
 *
 * Covers:
 *  1.1 – generateClients returns file paths; GenerateClient merges them into filesWritten
 *  1.2 – GenerateClient JSON contains explicit phases.sync / phases.client breakdown
 *       – No double sync: generate-client no longer calls Init() before GenerateClient
 *  1.3 – generate-client --dry-run emits compact JSON (plannedFiles, fileCount, endpointCount)
 *       – sync --dry-run emits plannedFiles
 */

import { execSync, spawnSync } from "child_process";
import fs from "fs";
import os from "os";
import path from "path";

const actualFs = jest.requireActual<typeof fs>("fs");

const repoRoot = path.join(__dirname, "..");
const cliPath = path.join(repoRoot, "bin/cli.js");
const sampleSpecPath = path.join(repoRoot, "sample_spec.json");

// ────────────────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────────────────

/** Create a temp dir with a minimal openapi.sync.json pointing at sample_spec.json */
function makeTmpProject(): string {
  const tmpDir = actualFs.mkdtempSync(
    path.join(os.tmpdir(), "openapi-sync-phase1-")
  );
  const config = {
    api: { testapi: sampleSpecPath },
    folder: "api",
  };
  actualFs.writeFileSync(
    path.join(tmpDir, "openapi.sync.json"),
    JSON.stringify(config, null, 2)
  );
  return tmpDir;
}

function runCli(args: string[], cwd: string) {
  return spawnSync(process.execPath, [cliPath, ...args], {
    cwd,
    encoding: "utf-8",
    maxBuffer: 1024 * 1024 * 10,
  });
}

// ────────────────────────────────────────────────────────────────────────────
// Setup
// ────────────────────────────────────────────────────────────────────────────

beforeAll(() => {
  execSync("npm run build", { cwd: repoRoot, stdio: "pipe" });
});

// ────────────────────────────────────────────────────────────────────────────
// 1.1 – filesWritten includes client files
// ────────────────────────────────────────────────────────────────────────────

describe("1.1 – filesWritten includes client files", () => {
  it("generate-client --json result.filesWritten contains at least one client .ts file", () => {
    const tmpDir = makeTmpProject();

    const result = runCli(
      ["generate-client", "--type", "fetch", "--json"],
      tmpDir
    );

    expect(result.status).toBe(0);
    expect(() => JSON.parse(result.stdout)).not.toThrow();

    const payload = JSON.parse(result.stdout);
    expect(payload.success).toBe(true);
    expect(Array.isArray(payload.filesWritten)).toBe(true);

    // Should contain at least one client.ts or clients.ts file
    const clientFiles = payload.filesWritten.filter(
      (f: string) => f.endsWith("clients.ts") || f.endsWith("client.ts") || f.endsWith("api.ts")
    );
    expect(clientFiles.length).toBeGreaterThan(0);

    actualFs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("generate-client for axios includes clients.ts in filesWritten", () => {
    const tmpDir = makeTmpProject();

    const result = runCli(
      ["generate-client", "--type", "axios", "--json"],
      tmpDir
    );

    expect(result.status).toBe(0);
    const payload = JSON.parse(result.stdout);
    expect(payload.filesWritten.some((f: string) => f.includes("clients.ts"))).toBe(true);

    actualFs.rmSync(tmpDir, { recursive: true, force: true });
  });
});

// ────────────────────────────────────────────────────────────────────────────
// 1.2 – Phases breakdown + no double sync
// ────────────────────────────────────────────────────────────────────────────

describe("1.2 – Phases breakdown in GenerateClient JSON", () => {
  it("generate-client --json result has phases.sync and phases.client keys", () => {
    const tmpDir = makeTmpProject();

    const result = runCli(
      ["generate-client", "--type", "fetch", "--json"],
      tmpDir
    );

    expect(result.status).toBe(0);
    const payload = JSON.parse(result.stdout);

    expect(payload.phases).toBeDefined();
    expect(payload.phases.sync).toBeDefined();
    expect(payload.phases.client).toBeDefined();
    expect(Array.isArray(payload.phases.sync.filesWritten)).toBe(true);
    expect(Array.isArray(payload.phases.client.filesWritten)).toBe(true);
    expect(typeof payload.phases.sync.endpointCount).toBe("number");
    expect(typeof payload.phases.client.endpointCount).toBe("number");

    actualFs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("phases.sync + phases.client filesWritten union equals filesWritten", () => {
    const tmpDir = makeTmpProject();

    const result = runCli(
      ["generate-client", "--type", "axios", "--json"],
      tmpDir
    );

    expect(result.status).toBe(0);
    const payload = JSON.parse(result.stdout);

    const phaseFiles = [
      ...payload.phases.sync.filesWritten,
      ...payload.phases.client.filesWritten,
    ].sort();
    const totalFiles = [...payload.filesWritten].sort();

    expect(phaseFiles).toEqual(totalFiles);

    actualFs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("client files appear in phases.client, not phases.sync", () => {
    const tmpDir = makeTmpProject();

    const result = runCli(
      ["generate-client", "--type", "fetch", "--json"],
      tmpDir
    );

    expect(result.status).toBe(0);
    const payload = JSON.parse(result.stdout);

    // Client files (clients.ts, hooks.ts, api.ts) must be in phases.client
    const inClient = payload.phases.client.filesWritten.filter(
      (f: string) => f.endsWith("clients.ts") || f.endsWith("hooks.ts") || f.endsWith("api.ts")
    );
    expect(inClient.length).toBeGreaterThan(0);

    // Those same files must NOT be in phases.sync
    for (const f of inClient) {
      expect(payload.phases.sync.filesWritten).not.toContain(f);
    }

    actualFs.rmSync(tmpDir, { recursive: true, force: true });
  });
});

// ────────────────────────────────────────────────────────────────────────────
// 1.3 – Compact dry-run for generate-client
// ────────────────────────────────────────────────────────────────────────────

describe("1.3 – Compact dry-run for generate-client", () => {
  it("--dry-run --json output has plannedFiles, fileCount, endpointCount", () => {
    const tmpDir = makeTmpProject();

    const result = runCli(
      ["generate-client", "--type", "fetch", "--dry-run", "--json"],
      tmpDir
    );

    expect(result.status).toBe(0);
    expect(() => JSON.parse(result.stdout)).not.toThrow();

    const payload = JSON.parse(result.stdout);
    expect(payload.dryRun).toBe(true);
    expect(Array.isArray(payload.plannedFiles)).toBe(true);
    expect(typeof payload.fileCount).toBe("number");
    expect(typeof payload.endpointCount).toBe("number");
    expect(payload.fileCount).toBeGreaterThan(0);
    expect(payload.endpointCount).toBeGreaterThan(0);

    actualFs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("--dry-run --json without --verbose does NOT include endpoint listing", () => {
    const tmpDir = makeTmpProject();

    const result = runCli(
      ["generate-client", "--type", "fetch", "--dry-run", "--json"],
      tmpDir
    );

    expect(result.status).toBe(0);
    const payload = JSON.parse(result.stdout);

    // `endpoints` key should be absent when --verbose is not set
    expect(payload.endpoints).toBeUndefined();

    actualFs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("--dry-run --verbose --json includes endpoint listing", () => {
    const tmpDir = makeTmpProject();

    const result = runCli(
      ["generate-client", "--type", "fetch", "--dry-run", "--verbose", "--json"],
      tmpDir
    );

    expect(result.status).toBe(0);
    const payload = JSON.parse(result.stdout);

    // `endpoints` key should appear with --verbose
    expect(payload.endpoints).toBeDefined();

    actualFs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("--dry-run does not write any files to disk", () => {
    const tmpDir = makeTmpProject();
    const apiDir = path.join(tmpDir, "api");

    runCli(
      ["generate-client", "--type", "fetch", "--dry-run", "--json"],
      tmpDir
    );

    // No api directory should have been created
    expect(actualFs.existsSync(apiDir)).toBe(false);

    actualFs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("sync --dry-run --json has plannedFiles", () => {
    const tmpDir = makeTmpProject();

    const result = runCli(["sync", "--dry-run", "--json"], tmpDir);

    expect(result.status).toBe(0);
    expect(() => JSON.parse(result.stdout)).not.toThrow();

    const payload = JSON.parse(result.stdout);
    expect(payload.dryRun).toBe(true);
    expect(Array.isArray(payload.plannedFiles)).toBe(true);

    actualFs.rmSync(tmpDir, { recursive: true, force: true });
  });
});
