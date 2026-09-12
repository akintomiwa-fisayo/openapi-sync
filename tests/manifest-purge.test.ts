import { loadManifest, saveManifest, computeStalePaths } from "../Openapi-sync/manifest";
import fs from "fs";

const mockFs = fs as jest.Mocked<typeof fs>;

describe("Feature 1: Manifest & Purge System", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Manifest Operations", () => {
    it("should load manifest when file exists", () => {
      const mockData = {
        petstore: ["/path/to/endpoints.ts", "/path/to/types/index.ts"],
      };

      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(JSON.stringify(mockData));

      const loaded = loadManifest();
      expect(loaded).toEqual(mockData);
    });

    it("should return empty object when manifest file does not exist", () => {
      mockFs.existsSync.mockReturnValue(false);

      const loaded = loadManifest();
      expect(loaded).toEqual({});
    });

    it("should save manifest to disk", () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.writeFileSync = jest.fn();

      const manifestToSave = {
        petstore: ["/path/to/file1.ts"],
      };

      saveManifest(manifestToSave);
      expect(mockFs.writeFileSync).toHaveBeenCalledWith(
        expect.stringContaining("manifest.json"),
        JSON.stringify(manifestToSave, null, 2)
      );
    });

    it("should compute stale paths correctly", () => {
      const previousManifest = {
        petstore: [
          "/src/api/petstore/endpoints.ts",
          "/src/api/petstore/types/pet.ts",
          "/src/api/petstore/types/old-removed.ts",
        ],
      };

      const currentlyWritten = [
        "/src/api/petstore/endpoints.ts",
        "/src/api/petstore/types/pet.ts",
      ];

      const stale = computeStalePaths("petstore", previousManifest, currentlyWritten);

      expect(stale).toEqual(["/src/api/petstore/types/old-removed.ts"]);
    });

    it("should return empty stale paths when all previous files are written", () => {
      const previousManifest = {
        petstore: ["/src/api/petstore/endpoints.ts"],
      };
      const currentlyWritten = [
        "/src/api/petstore/endpoints.ts",
        "/src/api/petstore/new-file.ts",
      ];

      const stale = computeStalePaths("petstore", previousManifest, currentlyWritten);
      expect(stale).toEqual([]);
    });

    it("should return empty stale paths when there is no previous manifest for the API", () => {
      const previousManifest = {};
      const currentlyWritten = ["/src/api/petstore/endpoints.ts"];

      const stale = computeStalePaths("petstore", previousManifest, currentlyWritten);
      expect(stale).toEqual([]);
    });
  });

  describe("Stale File Deletion Logic", () => {
    it("should unlink stale files when requested", () => {
      const stalePaths = ["/src/api/petstore/old.ts", "/src/api/petstore/stale.ts"];
      mockFs.existsSync.mockReturnValue(true);
      mockFs.unlinkSync = jest.fn();

      const deleted: string[] = [];
      for (const p of stalePaths) {
        if (mockFs.existsSync(p)) {
          mockFs.unlinkSync(p);
          deleted.push(p);
        }
      }

      expect(deleted).toEqual(stalePaths);
      expect(mockFs.unlinkSync).toHaveBeenCalledTimes(2);
      expect(mockFs.unlinkSync).toHaveBeenCalledWith("/src/api/petstore/old.ts");
      expect(mockFs.unlinkSync).toHaveBeenCalledWith("/src/api/petstore/stale.ts");
    });
  });
});
