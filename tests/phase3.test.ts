import {
  GetEndpointDetails,
  ReadGeneratedType,
} from "../index";
import OpenapiSync from "../Openapi-sync";
import fs from "fs";
import path from "path";
import SwaggerParser from "@apidevtools/swagger-parser";
import { generateClients } from "../Openapi-sync/client-generation";
import { storeEndpoints, clearEndpointStore } from "../Openapi-sync/endpoint-store";
import { EndpointInfo } from "../client-generators";
import { IConfig } from "../types";

const actualFs = jest.requireActual("fs") as typeof import("fs");

// Mock dependencies
jest.mock("axios");
jest.mock("@apidevtools/swagger-parser");
jest.mock("fs", () => {
  const realFs = jest.requireActual("fs");
  return {
    ...realFs,
    existsSync: jest.fn(),
    writeFileSync: jest.fn(),
    readFileSync: jest.fn(),
    readdirSync: jest.fn(),
    promises: {
      writeFile: jest.fn(),
      readFile: jest.fn(),
      mkdir: jest.fn(),
    },
  };
});
jest.mock("axios-retry");

const mockedFs = fs as jest.Mocked<typeof fs>;
const mockedSwaggerParser = SwaggerParser as jest.Mocked<typeof SwaggerParser>;

const sampleEndpoints: EndpointInfo[] = [
  {
    name: "getProjectById",
    method: "get",
    path: "/projects/{id}",
    operationId: "api_v1_projects_read",
    summary: "Get project by ID",
    tags: ["projects"],
    parameters: [
      { name: "id", in: "path", required: true, type: "integer" },
    ],
    responseType: "IProject",
  },
  {
    name: "createWorkspace",
    method: "post",
    path: "/workspaces",
    operationId: "workspaces_create",
    summary: "Create workspace",
    tags: ["workspaces"],
    dtoType: "ICreateWorkspaceDTO",
    responseType: "IWorkspace",
  },
];

const configPath = path.join(process.cwd(), "openapi.sync.js");

describe("Phase 3 — Query commands & layout", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    clearEndpointStore();

    mockedFs.existsSync.mockImplementation((p: any) => {
      const str = String(p);
      if (str.endsWith("openapi.sync.js") || str.endsWith("openapi.sync.json")) {
        return true;
      }
      if (str.includes("src/api/generated/prowoks")) {
        return true;
      }
      return false;
    });

    mockedFs.readFileSync.mockImplementation((p: any) => {
      const str = String(p);
      if (str.endsWith("openapi.sync.js") || str.endsWith("openapi.sync.json")) {
        return `module.exports = {
          api: {
            prowoks: "https://api.test.com/openapi.json",
            flatApi: "spec_flat.json"
          },
          folder: "src/api/generated"
        };`;
      }
      return "";
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("3.1: GetEndpointDetails Lookup (Issue #12)", () => {
    beforeEach(() => {
      storeEndpoints("prowoks", sampleEndpoints);
    });

    it("should match endpoint by exact operationId", async () => {
      const result = await GetEndpointDetails({
        apiName: "prowoks",
        operationId: "api_v1_projects_read",
      });

      expect(result.endpoint.name).toBe("getProjectById");
      expect(result.endpoint.operationId).toBe("api_v1_projects_read");
    });

    it("should match endpoint by exact name", async () => {
      const result = await GetEndpointDetails({
        apiName: "prowoks",
        name: "createWorkspace",
      });

      expect(result.endpoint.operationId).toBe("workspaces_create");
    });

    it("should cross-match when name is passed to operationId option", async () => {
      const result = await GetEndpointDetails({
        apiName: "prowoks",
        operationId: "getProjectById",
      });

      expect(result.endpoint.name).toBe("getProjectById");
    });

    it("should match case-insensitively and normalized", async () => {
      const result = await GetEndpointDetails({
        apiName: "prowoks",
        operationId: "API_V1_PROJECTS_READ",
      });

      expect(result.endpoint.name).toBe("getProjectById");

      const result2 = await GetEndpointDetails({
        apiName: "prowoks",
        operationId: "workspaces-create",
      });

      expect(result2.endpoint.name).toBe("createWorkspace");
    });

    it("should throw a helpful error when no endpoint matches", async () => {
      await expect(
        GetEndpointDetails({
          apiName: "prowoks",
          operationId: "nonexistent_endpoint",
        })
      ).rejects.toThrow("No endpoint found for nonexistent_endpoint");
    });
  });

  describe("3.2: ReadGeneratedType for Tag-Split Layouts (Issue #13)", () => {
    it("should search tag-split folders and shared.ts to resolve types", async () => {
      (mockedFs.readdirSync as jest.Mock).mockImplementation((dirPath: string) => {
        if (dirPath.endsWith("prowoks")) {
          return [
            { name: "shared.ts", isDirectory: () => false, isFile: () => true },
            { name: "projects", isDirectory: () => true, isFile: () => false },
            { name: "workspaces", isDirectory: () => true, isFile: () => false },
          ];
        }
        if (dirPath.endsWith("projects")) {
          return [
            { name: "types.ts", isDirectory: () => false, isFile: () => true },
            { name: "endpoints.ts", isDirectory: () => false, isFile: () => true },
          ];
        }
        if (dirPath.endsWith("workspaces")) {
          return [
            { name: "types.ts", isDirectory: () => false, isFile: () => true },
          ];
        }
        return [];
      });

      (mockedFs.promises.readFile as jest.Mock).mockImplementation(
        (filePath: string) => {
          if (filePath.endsWith("shared.ts")) {
            return Promise.resolve(
              "export interface IWorkspace {\n  id: string;\n  name: string;\n}\n"
            );
          }
          if (filePath.includes("projects/types.ts")) {
            return Promise.resolve(
              "export type IGetProjectById200Response = {\n  id: number;\n};\n"
            );
          }
          return Promise.reject(new Error("File not found"));
        }
      );

      // Search with "Workspace" (matches IWorkspace in shared.ts)
      const workspaceType = await ReadGeneratedType({
        apiName: "prowoks",
        typeName: "Workspace",
      });
      expect(workspaceType).toContain("export interface IWorkspace");

      // Search with exact "IGetProjectById200Response"
      const projectType = await ReadGeneratedType({
        apiName: "prowoks",
        typeName: "IGetProjectById200Response",
      });
      expect(projectType).toContain("export type IGetProjectById200Response");
    });
  });

  describe("3.3: folderSplit and default/ clarification (Issue #23)", () => {
    it("folderSplit: {} should generate flat files and NOT generate default/ folder", async () => {
      mockedFs.existsSync.mockReturnValue(true);
      mockedFs.promises.mkdir = jest.fn().mockResolvedValue(undefined as never);
      mockedFs.promises.writeFile = jest.fn().mockResolvedValue(undefined as never);

      const flatSpec = {
        openapi: "3.0.0",
        info: { title: "Flat Test", version: "1.0.0" },
        paths: {
          "/status": {
            get: {
              operationId: "getStatus",
              responses: { "200": { description: "OK" } },
            },
          },
        },
      };

      (mockedFs.promises.readFile as jest.Mock).mockImplementation(
        (filePath: string) => {
          if (filePath.includes("spec_flat.json")) {
            return Promise.resolve(JSON.stringify(flatSpec));
          }
          return Promise.reject(new Error("File not found"));
        }
      );
      mockedSwaggerParser.parse.mockResolvedValue(flatSpec as any);

      // Empty object folderSplit should remain flat
      const config: IConfig = {
        api: { flatApi: "spec_flat.json" },
        folder: "src/api",
        folderSplit: {} as any,
      };

      await OpenapiSync("spec_flat.json", "flatApi", config);

      const writeCalls = (mockedFs.promises.writeFile as jest.Mock).mock
        .calls as string[][];

      // Must write to endpoints.ts directly in flatApi folder, NOT flatApi/default/endpoints.ts
      const defaultFolderCall = writeCalls.find((c) =>
        c[0].includes("flatApi/default/")
      );
      expect(defaultFolderCall).toBeUndefined();

      const rootEndpointsCall = writeCalls.find((c) =>
        c[0].endsWith("flatApi/endpoints.ts")
      );
      expect(rootEndpointsCall).toBeDefined();
    });
  });

  describe("3.4: clientGeneration.outputDir Semantics (Issues #5, #24)", () => {
    it("should honor clientGeneration.outputDir in folderSplit mode and calculate relative imports", async () => {
      mockedFs.promises.mkdir = jest.fn().mockResolvedValue(undefined as never);
      mockedFs.promises.writeFile = jest.fn().mockResolvedValue(undefined as never);

      const config: IConfig = {
        folder: "src/api/generated",
        folderSplit: { byTags: true },
        api: { prowoks: "https://api.test.com/openapi.json" },
      };

      await generateClients(
        sampleEndpoints,
        config,
        {
          type: "axios",
          outputDir: "src/api/custom-clients",
        },
        "prowoks",
        "src/api/generated",
        true // silent
      );

      const writeCalls = (mockedFs.promises.writeFile as jest.Mock).mock
        .calls as string[][];

      // Should write tag clients in outputDir
      const projectClientCall = writeCalls.find((c) =>
        c[0].endsWith("src/api/custom-clients/projects/client.ts")
      );
      expect(projectClientCall).toBeDefined();

      const content = projectClientCall![1];
      // Check relative import back to sync types and endpoints
      expect(content).toContain("../generated/prowoks/projects/types");
      expect(content).toContain("../generated/prowoks/projects/endpoints");

      // Root aggregator at custom-clients/clients.ts
      const rootClientsCall = writeCalls.find((c) =>
        c[0].endsWith("src/api/custom-clients/clients.ts")
      );
      expect(rootClientsCall).toBeDefined();
    });
  });
});
