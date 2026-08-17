import OpenapiSync from "../Openapi-sync";
import fs from "fs";
import path from "path";
import SwaggerParser from "@apidevtools/swagger-parser";
import { generateClients } from "../Openapi-sync/client-generation";
import {
  GetEndpointDetails,
  ReadGeneratedType,
  ListEndpoints,
  ValidateConfig,
} from "../index";
import { IConfig } from "../types";

const realFs = jest.requireActual("fs") as typeof import("fs");
const auditFixture = require("./agent-audit.fixture.json");

// Mock dependencies
jest.mock("axios");
jest.mock("@apidevtools/swagger-parser");
jest.mock("fs", () => {
  const actualFs = jest.requireActual("fs");
  return {
    ...actualFs,
    existsSync: jest.fn(),
    writeFileSync: jest.fn(),
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

const configPath = path.join(process.cwd(), "openapi.sync.json");

describe("Phase 4 — Agent Audit Regression Suite", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    realFs.writeFileSync(
      configPath,
      JSON.stringify({
        api: {
          audit: "agent-audit.fixture.json"
        },
        folder: "src/api/generated",
        folderSplit: { byTags: true },
        endpoints: { name: { useOperationId: true } },
        types: { name: { useOperationId: true } }
      })
    );

    mockedFs.existsSync.mockImplementation((p: any) => {
      const str = String(p);
      if (str.endsWith("openapi.sync.json")) {
        return true;
      }
      if (str.endsWith("openapi.sync.js") || str.endsWith("openapi.sync.ts")) {
        return false;
      }
      if (str.includes("src/api/generated/audit")) {
        return true;
      }
      return realFs.existsSync(p);
    });

    (mockedFs.readdirSync as jest.Mock).mockImplementation((dirPath: string, options: any) => {
      const str = String(dirPath);
      if (str.endsWith("audit")) {
        return [
          { name: "shared.ts", isDirectory: () => false, isFile: () => true },
          { name: "projects", isDirectory: () => true, isFile: () => false },
          { name: "health", isDirectory: () => true, isFile: () => false },
        ];
      }
      if (str.endsWith("projects")) {
        return [
          { name: "types.ts", isDirectory: () => false, isFile: () => true },
          { name: "endpoints.ts", isDirectory: () => false, isFile: () => true },
        ];
      }
      if (str.endsWith("health")) {
        return [
          { name: "types.ts", isDirectory: () => false, isFile: () => true },
        ];
      }
      return realFs.readdirSync(dirPath, options);
    });

    (mockedFs.promises.readFile as jest.Mock).mockImplementation(
      (filePath: string) => {
        if (filePath.includes("agent-audit.fixture.json")) {
          return Promise.resolve(JSON.stringify(auditFixture));
        }
        if (filePath.endsWith("shared.ts")) {
          return Promise.resolve(
            "export interface IProject {\n  id: number;\n  name: string;\n  isActive: boolean;\n}\n"
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
    mockedSwaggerParser.parse.mockResolvedValue(auditFixture as any);
    mockedSwaggerParser.validate.mockResolvedValue(auditFixture as any);
  });

  afterAll(() => {
    try {
      delete require.cache[require.resolve(configPath)];
    } catch (_) {}
    try {
      delete require.cache[configPath];
    } catch (_) {}
    if (realFs.existsSync(configPath)) {
      try {
        realFs.unlinkSync(configPath);
      } catch (_) {}
    }
  });

  describe("4.1: TypeScript Sync & Multi-Client Generation Matrix", () => {
    it("should sync TypeScript types and generate Fetch, Axios, React Query, SWR, and RTK Query clients", async () => {
      mockedFs.promises.mkdir = jest.fn().mockResolvedValue(undefined as never);
      mockedFs.promises.writeFile = jest.fn().mockResolvedValue(undefined as never);

      const config: IConfig = {
        api: { audit: "agent-audit.fixture.json" },
        folder: "src/api/generated",
        folderSplit: { byTags: true },
        endpoints: { name: { useOperationId: true } },
        types: { name: { useOperationId: true } },
      };

      const syncResult = await OpenapiSync("agent-audit.fixture.json", "audit", config);
      expect(syncResult).toBeDefined();

      const writeCalls = (mockedFs.promises.writeFile as jest.Mock).mock
        .calls as string[][];

      // 1. Verify schema-less health tag emits export {};
      const healthTypesCall = writeCalls.find((c) =>
        c[0].endsWith("health/types.ts")
      );
      expect(healthTypesCall).toBeDefined();
      expect(healthTypesCall![1]).toContain("export {};");

      // 2. Verify typed integer path parameter on getProjectById URL builder
      const projectEndpointsCall = writeCalls.find((c) =>
        c[0].endsWith("projects/endpoints.ts")
      );
      expect(projectEndpointsCall).toBeDefined();
      const projectEndpointsContent = projectEndpointsCall![1];
      expect(projectEndpointsContent).toContain(
        "export const getProjectById = (projectId:number)=> `/projects/${projectId}`;"
      );
      expect(projectEndpointsContent).toContain("* **Path**:");
      expect(projectEndpointsContent).toContain("* **Query**:");

      // 3. Verify client generation across all 5 backends
      const clientTypes = ["fetch", "axios", "react-query", "swr", "rtk-query"] as const;

      for (const cType of clientTypes) {
        mockedFs.promises.writeFile = jest.fn().mockResolvedValue(undefined as never);

        await generateClients(
          [
            {
              name: "getProjectById",
              method: "get",
              path: "/projects/{projectId}",
              operationId: "getProjectById",
              tags: ["projects"],
              parameters: [
                { name: "projectId", in: "path", required: true, type: "integer" },
              ],
              responseType: "IProject",
            },
            {
              name: "healthCheck",
              method: "get",
              path: "/health",
              operationId: "healthCheck",
              tags: ["health"],
              responses: { "204": { type: "void" } },
            },
          ],
          config,
          { type: cType },
          "audit",
          "src/api/generated",
          true
        );

        const clientCalls = (mockedFs.promises.writeFile as jest.Mock).mock
          .calls as string[][];

        // Ensure health client omits types import
        const healthClient = clientCalls.find((c) => c[0].includes("health/"));
        expect(healthClient).toBeDefined();
        expect(healthClient![1]).not.toContain("from './types'");
      }
    });
  });

  describe("4.1: Python Sync & Identifier Sanitization", () => {
    it("should generate valid Python dataclasses and endpoint constants without invalid syntax", async () => {
      mockedFs.promises.mkdir = jest.fn().mockResolvedValue(undefined as never);
      mockedFs.promises.writeFile = jest.fn().mockResolvedValue(undefined as never);

      const config: IConfig = {
        language: "python",
        api: { audit_py: "agent-audit.fixture.json" },
        folder: "src/api/generated",
        folderSplit: { byTags: true },
        endpoints: { name: { useOperationId: true } },
        types: { name: { useOperationId: true } },
      };

      await OpenapiSync("agent-audit.fixture.json", "audit_py", config);

      const writeCalls = (mockedFs.promises.writeFile as jest.Mock).mock
        .calls as string[][];

      const sharedPyCall = writeCalls.find((c) => c[0].endsWith("shared.py"));
      expect(sharedPyCall).toBeDefined();
      const sharedContent = sharedPyCall![1];
      expect(sharedContent).toContain("@dataclass");
      expect(sharedContent).toContain("class IProject:");

      const projectPyEndpoints = writeCalls.find((c) =>
        c[0].endsWith("projects/endpoints.py")
      );
      expect(projectPyEndpoints).toBeDefined();
      const projectContent = projectPyEndpoints![1];
      expect(projectContent).toContain("GetProjectById = Endpoint(");
      expect(projectContent).not.toContain("$");
    });
  });

  describe("4.2: Programmatic Query API Verification", () => {
    it("ValidateConfig should report valid status on audit fixture", async () => {
      const validation = await ValidateConfig({ silent: true });
      expect(validation.valid).toBe(true);
      expect(validation.apis.audit.valid).toBe(true);
    });

    it("ListEndpoints and GetEndpointDetails should return structured metadata", async () => {
      const endpoints = await ListEndpoints({
        apiName: "audit",
        silent: true,
      });

      expect(endpoints.audit).toBeDefined();
      expect(endpoints.audit.length).toBeGreaterThan(0);

      const projectEndpoint = await GetEndpointDetails({
        apiName: "audit",
        operationId: "getProjectById",
        silent: true,
      });

      expect(projectEndpoint.endpoint.name).toBe("getProjectById");
      expect(projectEndpoint.endpoint.parameters).toBeDefined();
    });

    it("ReadGeneratedType should resolve Project type from shared schema", async () => {
      const typeDecl = await ReadGeneratedType({
        apiName: "audit",
        typeName: "Project",
        silent: true,
      });

      expect(typeDecl).toContain("export interface IProject");
      expect(typeDecl).toContain("isActive: boolean;");
    });
  });
});
