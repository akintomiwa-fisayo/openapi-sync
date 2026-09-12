import {
  recordClientFiles,
  getStaleClientPaths,
  cleanPurgedClientPaths,
  loadManifest,
  saveManifest,
} from "../Openapi-sync/manifest";
import { Purge } from "../index";
import * as indexModule from "../index";
import fs from "fs";

const mockFs = fs as jest.Mocked<typeof fs>;

describe("OAS-7: Switching client types leaves orphans; purge detects and removes them", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Manifest client file tracking", () => {
    it("records initial client files correctly", () => {
      const manifest: any = {};
      const updated = recordClientFiles(
        "petstore",
        ["/out/api/petstore/clients.ts", "/out/api/petstore/hooks.ts"],
        manifest
      );

      expect(updated.clients!.petstore).toEqual([
        "/out/api/petstore/clients.ts",
        "/out/api/petstore/hooks.ts",
      ]);
      expect(updated.staleClients!.petstore).toEqual([]);
    });

    it("identifies stale client files when switching from swr to rtk-query", () => {
      const manifest: any = {
        clients: {
          petstore: [
            "/out/api/petstore/clients.ts",
            "/out/api/petstore/hooks.ts",
          ],
        },
        staleClients: {
          petstore: [],
        },
      };

      // Switch to rtk-query (only api.ts generated)
      const updated = recordClientFiles(
        "petstore",
        ["/out/api/petstore/api.ts"],
        manifest
      );

      expect(updated.clients!.petstore).toEqual(["/out/api/petstore/api.ts"]);
      expect(updated.staleClients!.petstore).toEqual([
        "/out/api/petstore/clients.ts",
        "/out/api/petstore/hooks.ts",
      ]);
    });

    it("getStaleClientPaths returns only files existing on disk and not in active clients", () => {
      const manifest: any = {
        clients: {
          petstore: ["/out/api/petstore/api.ts"],
        },
        staleClients: {
          petstore: [
            "/out/api/petstore/clients.ts",
            "/out/api/petstore/hooks.ts",
          ],
        },
      };

      // Suppose hooks.ts exists on disk, but clients.ts does not
      mockFs.existsSync.mockImplementation((p: any) => {
        return p === "/out/api/petstore/hooks.ts";
      });

      const stale = getStaleClientPaths("petstore", manifest);
      expect(stale).toEqual(["/out/api/petstore/hooks.ts"]);
    });

    it("cleanPurgedClientPaths removes deleted files from staleClients", () => {
      const manifest: any = {
        clients: {
          petstore: ["/out/api/petstore/api.ts"],
        },
        staleClients: {
          petstore: ["/out/api/petstore/hooks.ts"],
        },
      };

      const updated = cleanPurgedClientPaths(
        ["/out/api/petstore/hooks.ts"],
        manifest
      );
      expect(updated.staleClients!.petstore).toEqual([]);
    });
  });

  describe("Purge integration with stale client files", () => {
    it("dry-run lists leftover client files in stalePaths", async () => {
      const staleHook = "/out/api/petstore/hooks.ts";
      const activeApi = "/out/api/petstore/api.ts";

      const initSpy = jest.spyOn(indexModule, "Init").mockResolvedValue({
        stalePaths: [staleHook],
        filesWritten: [activeApi],
        endpointCount: 1,
        warnings: [],
        errors: [],
        success: true,
        apis: ["petstore"],
      });

      mockFs.existsSync.mockReturnValue(true);
      mockFs.unlinkSync = jest.fn();

      const result = await Purge({ silent: true });

      expect(result.success).toBe(true);
      expect(result.stalePaths).toContain(staleHook);
      expect(result.stalePaths).not.toContain(activeApi);
      expect(result.deleted).toEqual([]);
      expect(result.purged).toEqual([]);
      expect(mockFs.unlinkSync).not.toHaveBeenCalled();

      initSpy.mockRestore();
    });

    it("purge with yes: true deletes stale client files but preserves active client files", async () => {
      const staleHook = "/out/api/petstore/hooks.ts";
      const activeApi = "/out/api/petstore/api.ts";

      const initSpy = jest.spyOn(indexModule, "Init").mockResolvedValue({
        stalePaths: [staleHook],
        filesWritten: [activeApi],
        endpointCount: 1,
        warnings: [],
        errors: [],
        success: true,
        apis: ["petstore"],
      });

      mockFs.existsSync.mockImplementation((p: any) => p === staleHook || p === activeApi);
      mockFs.unlinkSync = jest.fn();

      const result = await Purge({ yes: true, silent: true });

      expect(result.success).toBe(true);
      expect(result.deleted).toEqual([staleHook]);
      expect(result.purged).toEqual([staleHook]);
      expect(mockFs.unlinkSync).toHaveBeenCalledWith(staleHook);
      expect(mockFs.unlinkSync).not.toHaveBeenCalledWith(activeApi);

      initSpy.mockRestore();
    });
  });
});
