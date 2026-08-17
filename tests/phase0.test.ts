import { execSync, spawnSync } from "child_process";
import fs from "fs";
import os from "os";
import path from "path";

const actualFs = jest.requireActual<typeof fs>("fs");

const repoRoot = path.join(__dirname, "..");
const cliPath = path.join(repoRoot, "bin/cli.js");
const sampleSpecPath = path.join(repoRoot, "sample_spec.json");
const initBundlePath = path.join(
  repoRoot,
  "dist/Openapi-sync/interactive-init.js"
);

describe("Phase 0 — packaging and agent ergonomics", () => {
  beforeAll(() => {
    execSync("npm run build", { cwd: repoRoot, stdio: "pipe" });
  });

  describe("0.1 esbuild dependency", () => {
    it("resolves esbuild as a direct dependency", () => {
      jest.unmock("esbuild-register");
      expect(() => require("esbuild")).not.toThrow();
      expect(() => require("esbuild-register")).not.toThrow();
    });
  });

  describe("0.2 JSON-only stdout", () => {
    it("makeLogger writes progress messages to stderr, not stdout", () => {
      const { makeLogger } = require("../logger") as typeof import("../logger");
      const stdoutSpy = jest.spyOn(console, "error").mockImplementation(() => {});
      const stderrWriteSpy = jest
        .spyOn(process.stderr, "write")
        .mockImplementation(() => true);

      makeLogger(false).log("progress message");

      expect(stdoutSpy).toHaveBeenCalledWith("progress message");
      stdoutSpy.mockRestore();
      stderrWriteSpy.mockRestore();
    });
  });

  describe("0.3 init non-interactive flow", () => {
    it("ships interactive-init in dist", () => {
      expect(actualFs.existsSync(initBundlePath)).toBe(true);
    });

    it("accepts -y and --no-interactive without parse errors", () => {
      const tmpDir = actualFs.mkdtempSync(path.join(os.tmpdir(), "openapi-sync-init-"));

      const result = spawnSync(
        process.execPath,
        [
          cliPath,
          "init",
          "-y",
          "--api-name",
          "audit",
          "--api-file",
          sampleSpecPath,
          "--config-format",
          "json",
          "--json",
        ],
        {
          cwd: tmpDir,
          encoding: "utf-8",
        }
      );

      expect(result.status).toBe(0);
      expect(() => JSON.parse(result.stdout)).not.toThrow();

      const payload = JSON.parse(result.stdout);
      expect(payload.success).toBe(true);
      expect(actualFs.existsSync(path.join(tmpDir, "openapi.sync.json"))).toBe(true);

      actualFs.rmSync(tmpDir, { recursive: true, force: true });
    });

    it("returns structured JSON for missing api source in non-interactive mode", () => {
      const result = spawnSync(
        process.execPath,
        [cliPath, "init", "-y", "--json"],
        {
          encoding: "utf-8",
        }
      );

      expect(result.status).toBe(1);
      expect(() => JSON.parse(result.stdout)).not.toThrow();

      const payload = JSON.parse(result.stdout);
      expect(payload.success).toBe(false);
      expect(payload.error?.code).toBe("CONFIG_INVALID");
    });

    it("returns structured JSON for unknown CLI arguments when --json is set", () => {
      const result = spawnSync(
        process.execPath,
        [cliPath, "init", "--not-a-real-flag", "--json"],
        {
          encoding: "utf-8",
        }
      );

      expect(result.status).toBe(1);
      expect(() => JSON.parse(result.stdout)).not.toThrow();

      const payload = JSON.parse(result.stdout);
      expect(payload.success).toBe(false);
      expect(payload.error?.code).toBe("CLI_PARSE_ERROR");
    });
  });
});
