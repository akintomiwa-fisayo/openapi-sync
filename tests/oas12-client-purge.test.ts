import { execSync } from "child_process";
import path from "path";
import {
  recordClientFiles,
  getStaleClientPaths,
  cleanPurgedClientPaths,
  ManifestData,
} from "../Openapi-sync/manifest";

const fs = jest.requireActual("fs") as typeof import("fs");

describe("OAS-12: Purge must not undo generate-client type switches", () => {
  const rootDir = path.resolve(__dirname, "..");
  const testDir = path.join(__dirname, "temp-oas12-test");
  const cliPath = path.join(rootDir, "bin", "cli.js");

  const sampleSpec = {
    openapi: "3.0.0",
    info: {
      title: "Sample API",
      version: "1.0.0",
    },
    paths: {
      "/users": {
        get: {
          operationId: "getUsers",
          summary: "Get all users",
          responses: {
            "200": {
              description: "OK",
              content: {
                "application/json": {
                  schema: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        id: { type: "string" },
                        name: { type: "string" },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  };

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

  describe("Manifest client type persistence", () => {
    it("persists clientType and configClientType when recording client files", () => {
      const manifest: ManifestData = {};
      const updated = recordClientFiles(
        "backend",
        ["/out/api/backend/api.ts"],
        manifest,
        "rtk-query",
        "fetch"
      );

      expect(updated.clients?.backend).toEqual(["/out/api/backend/api.ts"]);
      expect(updated.clientTypes?.backend).toBe("rtk-query");
      expect(updated.configClientTypes?.backend).toBe("fetch");
    });

    it("cleanPurgedClientPaths removes purged paths from both staleClients and file lists", () => {
      const staleHook = "/out/api/backend/hooks.ts";
      const activeApi = "/out/api/backend/api.ts";
      const manifest: ManifestData = {
        backend: [activeApi, staleHook],
        clients: {
          backend: [activeApi],
        },
        staleClients: {
          backend: [staleHook],
        },
      };

      const cleaned = cleanPurgedClientPaths([staleHook], manifest);
      expect(cleaned.staleClients?.backend).toEqual([]);
      expect(cleaned.backend).toEqual([activeApi]);
    });
  });

  describe("Live CLI E2E: init -> swr -> rtk-query -> purge", () => {
    it("preserves rtk-query api.ts and only purges leftover hooks/clients, retaining custom code", () => {
      // 1. Write sample spec
      const specPath = path.join(testDir, "openapi.json");
      fs.writeFileSync(specPath, JSON.stringify(sampleSpec, null, 2));

      // 2. Run init with fetch-zod preset and sync
      const initCmd = `node "${cliPath}" init --no-interactive --api-name backend --api-file "${specPath}" --preset fetch-zod --run-sync --json`;
      const initOut = execSync(initCmd, { cwd: testDir, encoding: "utf-8" });
      const initParsed = JSON.parse(initOut.trim());
      expect(initParsed.success).toBe(true);

      const fetchClientPath = path.join(testDir, "backend", "clients.ts");
      expect(fs.existsSync(fetchClientPath)).toBe(true);

      // 3. Switch to SWR client
      const swrCmd = `node "${cliPath}" generate-client --type swr --json`;
      const swrOut = execSync(swrCmd, { cwd: testDir, encoding: "utf-8" });
      const swrParsed = JSON.parse(swrOut.trim());
      expect(swrParsed.success).toBe(true);

      const hooksPath = path.join(testDir, "backend", "hooks.ts");
      expect(fs.existsSync(hooksPath)).toBe(true);
      expect(fs.existsSync(fetchClientPath)).toBe(true);

      // 4. Switch to RTK Query client
      const rtkCmd = `node "${cliPath}" generate-client --type rtk-query --json`;
      const rtkOut = execSync(rtkCmd, { cwd: testDir, encoding: "utf-8" });
      const rtkParsed = JSON.parse(rtkOut.trim());
      expect(rtkParsed.success).toBe(true);

      const apiPath = path.join(testDir, "backend", "api.ts");
      expect(fs.existsSync(apiPath)).toBe(true);

      // 5. Add custom code inside api.ts
      let apiContent = fs.readFileSync(apiPath, "utf-8");
      const customCodeBlock = `
// 🔒 CUSTOM CODE START
export const customOas12TestToken = "preserved_custom_logic_12345";
// 🔒 CUSTOM CODE END
`;
      fs.writeFileSync(apiPath, apiContent + customCodeBlock);

      // 6. Run purge dry-run
      const dryRunCmd = `node "${cliPath}" purge --dry-run --json`;
      const dryRunOut = execSync(dryRunCmd, { cwd: testDir, encoding: "utf-8" });
      const dryRunParsed = JSON.parse(dryRunOut.trim());

      expect(dryRunParsed.dryRun).toBe(true);
      // hooks.ts must be in stalePaths
      expect(dryRunParsed.stalePaths.some((p: string) => p.endsWith("hooks.ts"))).toBe(true);
      // api.ts must NOT be in stalePaths
      expect(dryRunParsed.stalePaths.some((p: string) => p.endsWith("api.ts"))).toBe(false);

      // 7. Run purge --yes
      const purgeYesCmd = `node "${cliPath}" purge --yes --json`;
      const purgeYesOut = execSync(purgeYesCmd, { cwd: testDir, encoding: "utf-8" });
      const purgeYesParsed = JSON.parse(purgeYesOut.trim());

      expect(purgeYesParsed.purged.some((p: string) => p.endsWith("hooks.ts"))).toBe(true);
      expect(purgeYesParsed.purged.some((p: string) => p.endsWith("api.ts"))).toBe(false);

      // Verify files on disk after purge
      expect(fs.existsSync(hooksPath)).toBe(false);
      expect(fs.existsSync(apiPath)).toBe(true);

      // Verify custom code inside api.ts is intact
      const apiContentAfterPurge = fs.readFileSync(apiPath, "utf-8");
      expect(apiContentAfterPurge).toContain("customOas12TestToken");
      expect(apiContentAfterPurge).toContain("preserved_custom_logic_12345");

      // 8. Run regular sync to ensure it doesn't revert to fetch
      const syncCmd = `node "${cliPath}" --json`;
      const syncOut = execSync(syncCmd, { cwd: testDir, encoding: "utf-8" });
      const syncParsed = JSON.parse(syncOut.trim());
      expect(syncParsed.success).toBe(true);

      // api.ts must still exist with custom code preserved
      expect(fs.existsSync(apiPath)).toBe(true);
      const apiContentAfterSync = fs.readFileSync(apiPath, "utf-8");
      expect(apiContentAfterSync).toContain("customOas12TestToken");
      expect(apiContentAfterSync).toContain("preserved_custom_logic_12345");
    });
  });
});
