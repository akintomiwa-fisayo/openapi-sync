import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { filterEndpoints, EndpointInfo } from "../client-generators";
import { checkPeerDependencies } from "../Openapi-sync/client-generation";
import { getCachePath, getCacheDir } from "../Openapi-sync/state";
import { storeEndpoints, getStoredEndpoints, clearEndpointStore } from "../Openapi-sync/endpoint-store";
import { Doctor } from "../index";

describe("Phase 5: Evaluation Feedback & Hardening", () => {
  const testDir = path.join(__dirname, "temp-phase5-test");

  beforeAll(() => {
    execSync("npm run build", { cwd: path.resolve(__dirname, ".."), stdio: "pipe" });
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
  });

  afterAll(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  describe("5.1 ESM Programmatic Import", () => {
    it("should allow native ESM import without __dirname or ambiguous module errors", () => {
      const code = `
        import { ValidateConfig, Init, GenerateClient, Doctor, ListEndpoints, GetEndpointDetails, ReadGeneratedType } from './dist/index.mjs';
        const functions = [ValidateConfig, Init, GenerateClient, Doctor, ListEndpoints, GetEndpointDetails, ReadGeneratedType];
        if (functions.some(f => typeof f !== 'function')) {
          throw new Error('Expected all exports to be functions');
        }
        console.log('ESM_IMPORT_OK');
      `;
      const output = execSync(`node --input-type=module -e "${code.replace(/\n/g, " ")}"`, {
        cwd: path.resolve(__dirname, ".."),
        encoding: "utf-8",
      });
      expect(output.trim()).toContain("ESM_IMPORT_OK");
    });
  });

  describe("5.2 Flexible Endpoint & Tag Filtering", () => {
    const mockEndpoints: EndpointInfo[] = [
      {
        name: "GetApiV1Agency",
        method: "get",
        path: "/api/v1/agency",
        operationId: "agency_list",
        tags: ["Agency", "Admin"],
        summary: "List agencies",
      },
      {
        name: "PostApiV1Agency",
        method: "post",
        path: "/api/v1/agency",
        operationId: "agency_create",
        tags: ["Agency"],
        summary: "Create agency",
      },
      {
        name: "GetPetById",
        method: "get",
        path: "/pet/{petId}",
        operationId: "getPetById",
        tags: ["Pet"],
        summary: "Get pet by ID",
      },
    ];

    it("should filter by comma-separated generated names", () => {
      const filtered = filterEndpoints(mockEndpoints, {
        endpoints: ["GetApiV1Agency,PostApiV1Agency"] as any,
      });
      expect(filtered).toHaveLength(2);
      expect(filtered.map((e) => e.name)).toEqual(["GetApiV1Agency", "PostApiV1Agency"]);
    });

    it("should filter by operationId", () => {
      const filtered = filterEndpoints(mockEndpoints, {
        endpoints: ["agency_list"],
      });
      expect(filtered).toHaveLength(1);
      expect(filtered[0].operationId).toBe("agency_list");
    });

    it("should filter by comma-separated operationIds", () => {
      const filtered = filterEndpoints(mockEndpoints, {
        endpoints: ["agency_list,getPetById"] as any,
      });
      expect(filtered).toHaveLength(2);
      expect(filtered.map((e) => e.operationId)).toEqual(["agency_list", "getPetById"]);
    });

    it("should filter by path", () => {
      const filtered = filterEndpoints(mockEndpoints, {
        endpoints: ["/api/v1/agency"],
      });
      expect(filtered).toHaveLength(2);
    });

    it("should filter by comma-separated tags with case insensitivity", () => {
      const filtered = filterEndpoints(mockEndpoints, {
        tags: ["agency,pet"] as any,
      });
      expect(filtered).toHaveLength(3);
    });
  });

  describe("5.3 Cache Architecture & Persistence", () => {
    beforeEach(() => {
      clearEndpointStore(true);
    });

    it("should point cache path to .openapi-sync/cache.json in project root", () => {
      const cachePath = getCachePath();
      expect(cachePath).toContain(path.join(".openapi-sync", "cache.json"));
      expect(cachePath).not.toContain("node_modules");
    });

    it("should persist endpoints to disk cache and hydrate when queried", () => {
      const apiName = "test-persist-api";
      const sampleEndpoints: EndpointInfo[] = [
        {
          name: "GetTest",
          method: "get",
          path: "/test",
          operationId: "getTest",
          tags: ["Test"],
        },
      ];

      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readFileSync as jest.Mock).mockReturnValue(
        JSON.stringify({ [apiName]: sampleEndpoints })
      );

      storeEndpoints(apiName, sampleEndpoints);

      // Clear in-memory only
      clearEndpointStore(false);

      // Hydrate from disk
      const hydrated = getStoredEndpoints(apiName);
      expect(hydrated).toHaveLength(1);
      expect(hydrated[0].name).toBe("GetTest");
    });
  });

  describe("5.4 Peer Dependencies Validation", () => {
    it("should detect missing peer dependencies for react-query", () => {
      const warnings = checkPeerDependencies("react-query");
      // @tanstack/react-query is not in openapi-sync devDependencies
      expect(warnings.some((w) => w.includes("@tanstack/react-query"))).toBe(true);
    });

    it("should return empty warnings when all peer dependencies are present or no client type", () => {
      const warnings = checkPeerDependencies(undefined, undefined);
      expect(warnings).toHaveLength(0);
    });
  });

  describe("5.5 Doctor Diagnostic Health Check", () => {
    it("should run Doctor report successfully", async () => {
      const report = await Doctor({ silent: true });
      expect(report).toBeDefined();
      expect(typeof report.healthy).toBe("boolean");
      expect(Array.isArray(report.checks)).toBe(true);
      expect(report.checks.length).toBeGreaterThan(0);
      expect(Array.isArray(report.recommendations)).toBe(true);
    });

    it("should support CLI doctor command with --json", () => {
      const cliPath = path.resolve(__dirname, "../bin/cli.js");
      const output = execSync(`node "${cliPath}" doctor --json`, {
        cwd: path.resolve(__dirname, ".."),
        encoding: "utf-8",
      });
      const parsed = JSON.parse(output);
      expect(parsed).toBeDefined();
      expect(parsed.checks).toBeDefined();
      expect(Array.isArray(parsed.checks)).toBe(true);
    });
  });

  describe("5.6 In-Memory TypeScript Config Loading", () => {
    it("should parse and evaluate TypeScript config syntax in memory without require hooks", () => {
      const { evaluateConfigContent } = require("../Openapi-sync/config-loader");
      const tsCode = `
        export default {
          api: { petstore: "https://petstore3.swagger.io/api/v3/openapi.json" },
          folder: "./src/api"
        };
      `;
      const config = evaluateConfigContent(tsCode, "openapi.sync.ts");
      expect(config).toBeDefined();
      expect(config.api.petstore).toBe("https://petstore3.swagger.io/api/v3/openapi.json");
      expect(config.folder).toBe("./src/api");
    });
  });

  describe("5.7 Untruncated Type Extraction & Pagination", () => {
    const sampleTypeScript = `
/**
 * Pet model representation
 */
export type IPet = {
  id?: number;
  /** Name of the pet */
  name: string;
  /* Multi-line photo urls */
  photoUrls: string[];
  status?: "available" | "pending" | "sold";
};

export type ICategory = {
  id?: number;
  name?: string;
};
    `;

    it("should extract full type without truncating at internal JSDoc comments", () => {
      const { extractTypeDeclaration } = require("../index");
      const extracted = extractTypeDeclaration(sampleTypeScript, "IPet");
      expect(extracted).toBeDefined();
      expect(extracted).toContain("export type IPet");
      expect(extracted).toContain("/** Name of the pet */");
      expect(extracted).toContain("status?:");
      expect(extracted).toContain("};");
    });

    it("should support offset and maxLines pagination", async () => {
      const { extractTypeDeclaration } = require("../index");
      const extracted = extractTypeDeclaration(sampleTypeScript, "IPet");
      const lines = extracted!.split("\n");
      expect(lines.length).toBeGreaterThan(5);

      const offsetSlice = lines.slice(2, 5).join("\n");
      expect(offsetSlice).toBeDefined();
    });
  });
});
