import OpenapiSync from "../Openapi-sync";
import fs from "fs";
import SwaggerParser from "@apidevtools/swagger-parser";
import {
  generateFetchClient,
  generateAxiosClient,
  generateReactQueryHooks,
  generateSWRHooks,
  generateRTKQuery,
  EndpointInfo,
} from "../client-generators";
import { sanitizePythonIdentifier, resolveOpenApiParamType } from "../helpers";
import { IConfig } from "../types";

// Mock dependencies
jest.mock("axios");
jest.mock("@apidevtools/swagger-parser");
jest.mock("fs", () => ({
  existsSync: jest.fn().mockReturnValue(true),
  writeFileSync: jest.fn(),
  promises: {
    writeFile: jest.fn(),
    readFile: jest.fn(),
    mkdir: jest.fn(),
  },
}));
jest.mock("axios-retry");

const mockedFs = fs as jest.Mocked<typeof fs>;
const mockedSwaggerParser = SwaggerParser as jest.Mocked<typeof SwaggerParser>;

const fixtureSpec = {
  openapi: "3.0.0",
  info: { title: "Path Parameter Test API", version: "1.0.0" },
  paths: {
    "/projects/{projectId}": {
      parameters: [
        {
          $ref: "#/components/parameters/ProjectIdParam",
        },
      ],
      get: {
        operationId: "getProject",
        summary: "Get project by ID",
        tags: ["projects"],
        parameters: [
          {
            name: "includeDetails",
            in: "query",
            required: false,
            schema: { type: "boolean" },
          },
        ],
        responses: {
          "200": {
            description: "Project found",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Project",
                },
              },
            },
          },
        },
      },
      delete: {
        operationId: "deleteProject",
        summary: "Delete project by ID",
        tags: ["projects"],
        responses: {
          "204": {
            description: "Project deleted",
          },
        },
      },
    },
    "/users/{userId}/items/{itemId}": {
      get: {
        operationId: "getUserItem",
        tags: ["users"],
        // Note: parameters intentionally omitted from operation to test fallback inference
        responses: {
          "200": {
            description: "User item found",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    id: { type: "string" },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  components: {
    parameters: {
      ProjectIdParam: {
        name: "projectId",
        in: "path",
        required: true,
        schema: {
          type: "integer",
        },
      },
    },
    schemas: {
      Project: {
        type: "object",
        required: ["id", "name"],
        properties: {
          id: { type: "integer" },
          name: { type: "string" },
        },
      },
    },
  },
};

const statusTagSpec = {
  openapi: "3.0.0",
  info: { title: "Status API", version: "1.0.0" },
  paths: {
    "/health": {
      get: {
        operationId: "healthCheck",
        tags: ["health"],
        responses: {
          "204": {
            description: "Healthy",
          },
        },
      },
    },
  },
};

const pythonSpec = {
  openapi: "3.0.0",
  info: { title: "Python Sync API", version: "1.0.0" },
  paths: {
    "/projects/{projectId}": {
      get: {
        summary: "Get project by ID",
        tags: ["projects"],
        parameters: [
          {
            name: "projectId",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          "200": {
            description: "Success",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    id: { type: "string" },
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

describe("Phase 2 — Code generation correctness", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("2.1 & 2.3: Helpers & Identifiers", () => {
    it("sanitizePythonIdentifier should properly sanitize identifiers", () => {
      expect(sanitizePythonIdentifier("GetProjects$projectId")).toBe(
        "GetProjectsProjectId"
      );
      expect(
        sanitizePythonIdentifier("IGetProjects$projectId200Response")
      ).toBe("IGetProjectsProjectId200Response");
      expect(sanitizePythonIdentifier("IGetProjects$projectIdDTO")).toBe(
        "IGetProjectsProjectIdDTO"
      );
      expect(sanitizePythonIdentifier("IGetProjects$projectIdQuery")).toBe(
        "IGetProjectsProjectIdQuery"
      );
      expect(sanitizePythonIdentifier("/projects/{projectId}")).toBe(
        "ProjectsProjectId"
      );
      expect(sanitizePythonIdentifier("user-profile-data")).toBe(
        "UserProfileData"
      );
      expect(sanitizePythonIdentifier("123test")).toBe("_123test");
      expect(sanitizePythonIdentifier("")).toBe("_");
    });

    it("resolveOpenApiParamType should map schema types to TS and Python types", () => {
      expect(resolveOpenApiParamType({ type: "integer" })).toEqual({
        tsType: "number",
        pyType: "int",
        rawType: "integer",
      });
      expect(resolveOpenApiParamType({ type: "number" })).toEqual({
        tsType: "number",
        pyType: "float",
        rawType: "number",
      });
      expect(resolveOpenApiParamType({ type: "boolean" })).toEqual({
        tsType: "boolean",
        pyType: "bool",
        rawType: "boolean",
      });
      expect(resolveOpenApiParamType({ type: "string" })).toEqual({
        tsType: "string",
        pyType: "str",
        rawType: "string",
      });
      expect(resolveOpenApiParamType(undefined)).toEqual({
        tsType: "string",
        pyType: "str",
        rawType: "string",
      });
    });
  });

  describe("2.1: Path Parameter Pipeline & Documentation Separation", () => {
    it("should derive integer type for path parameters and separate Path vs Query in docs", async () => {
      (mockedFs.promises.readFile as jest.Mock).mockImplementation(
        (filePath: string) => {
          if (filePath.includes("p2_param_spec.json")) {
            return Promise.resolve(JSON.stringify(fixtureSpec));
          }
          return Promise.reject(new Error("File not found"));
        }
      );
      mockedSwaggerParser.parse.mockResolvedValue(fixtureSpec as any);

      const config: IConfig = {
        api: { p2ParamApi: "p2_param_spec.json" },
        folder: "src/api",
        folderSplit: { byTags: true },
        endpoints: { name: { useOperationId: true } },
        types: { name: { useOperationId: true } },
      };

      await OpenapiSync("p2_param_spec.json", "p2ParamApi", config);

      const writeCalls = (mockedFs.promises.writeFile as jest.Mock).mock
        .calls as string[][];

      const endpointsCall = writeCalls.find((c) =>
        c[0].endsWith("projects/endpoints.ts")
      );
      expect(endpointsCall).toBeDefined();

      const endpointsContent = endpointsCall![1];

      // Check URL builder parameter type is number (from integer schema)
      expect(endpointsContent).toContain(
        "export const getProject = (projectId:number)=> `/projects/${projectId}`;"
      );

      // Check Path vs Query doc separation
      expect(endpointsContent).toContain("* **Path**:");
      expect(endpointsContent).toContain("projectId");
      expect(endpointsContent).toContain("* **Query**:");
      expect(endpointsContent).toContain("includeDetails");

      // Check that $ref path parameter was NOT included in Query type
      const typesCall = writeCalls.find((c) =>
        c[0].endsWith("projects/types.ts")
      );
      expect(typesCall).toBeDefined();
      const typesContent = typesCall![1];
      expect(typesContent).toContain("export type IgetProjectQuery");
      expect(typesContent).toContain("includeDetails");
      expect(typesContent).not.toContain("projectId?:");
    });

    it("should infer missing path parameters from path template variables", async () => {
      (mockedFs.promises.readFile as jest.Mock).mockImplementation(
        (filePath: string) => {
          if (filePath.includes("p2_infer_spec.json")) {
            return Promise.resolve(JSON.stringify(fixtureSpec));
          }
          return Promise.reject(new Error("File not found"));
        }
      );
      mockedSwaggerParser.parse.mockResolvedValue(fixtureSpec as any);

      const config: IConfig = {
        api: { p2InferApi: "p2_infer_spec.json" },
        folder: "src/api",
        folderSplit: { byTags: true },
        endpoints: { name: { useOperationId: true } },
      };

      await OpenapiSync("p2_infer_spec.json", "p2InferApi", config);

      const writeCalls = (mockedFs.promises.writeFile as jest.Mock).mock
        .calls as string[][];

      const userEndpointsCall = writeCalls.find((c) =>
        c[0].endsWith("users/endpoints.ts")
      );
      expect(userEndpointsCall).toBeDefined();

      const content = userEndpointsCall![1];
      // Fallback inferred path params
      expect(content).toContain(
        "export const getUserItem = (userId:string,itemId:string)=> `/users/${userId}/items/${itemId}`;"
      );
      expect(content).toContain("* **Path**:");
    });
  });

  describe("2.2: Empty types.ts handling for schema-less tags", () => {
    it("should emit empty types.ts for tags with no schemas so imports do not fail", async () => {
      (mockedFs.promises.readFile as jest.Mock).mockImplementation(
        (filePath: string) => {
          if (filePath.includes("p2_status_spec.json")) {
            return Promise.resolve(JSON.stringify(statusTagSpec));
          }
          return Promise.reject(new Error("File not found"));
        }
      );
      mockedSwaggerParser.parse.mockResolvedValue(statusTagSpec as any);

      const config: IConfig = {
        api: { p2StatusApi: "p2_status_spec.json" },
        folder: "src/api",
        folderSplit: { byTags: true },
      };

      await OpenapiSync("p2_status_spec.json", "p2StatusApi", config);

      const writeCalls = (mockedFs.promises.writeFile as jest.Mock).mock
        .calls as string[][];

      const typesCall = writeCalls.find((c) =>
        c[0].endsWith("health/types.ts")
      );
      expect(typesCall).toBeDefined();

      const typesContent = typesCall![1];
      expect(typesContent).toContain("export {};");
    });

    it("client generators should omit '../types' import when uniqueTypes is empty", () => {
      const mockEndpoints: EndpointInfo[] = [
        {
          name: "healthCheck",
          method: "get",
          path: "/health",
          operationId: "healthCheck",
          tags: ["health"],
          responses: { "204": { type: "void" } },
        },
      ];

      const fetchClient = generateFetchClient(mockEndpoints, {});
      expect(fetchClient).not.toContain("from '../types'");

      const axiosClient = generateAxiosClient(mockEndpoints, {});
      expect(axiosClient).not.toContain("from '../types'");

      const rqHooks = generateReactQueryHooks(mockEndpoints, {});
      expect(rqHooks).not.toContain("from '../types'");

      const swrHooks = generateSWRHooks(mockEndpoints, {});
      expect(swrHooks).not.toContain("from '../types'");

      const rtkSlice = generateRTKQuery(mockEndpoints, {});
      expect(rtkSlice).not.toContain("from '../types'");
    });
  });

  describe("2.3: Python Identifier Sanitization in Sync Output", () => {
    it("should generate valid Python identifiers without invalid syntax characters like $", async () => {
      (mockedFs.promises.readFile as jest.Mock).mockImplementation(
        (filePath: string) => {
          if (filePath.includes("p2_py_spec.json")) {
            return Promise.resolve(JSON.stringify(pythonSpec));
          }
          return Promise.reject(new Error("File not found"));
        }
      );
      mockedSwaggerParser.parse.mockResolvedValue(pythonSpec as any);

      const config: IConfig = {
        language: "python",
        api: { p2PyApi: "p2_py_spec.json" },
        folder: "src/api",
        folderSplit: { byTags: true },
      };

      await OpenapiSync("p2_py_spec.json", "p2PyApi", config);

      const writeCalls = (mockedFs.promises.writeFile as jest.Mock).mock
        .calls as string[][];

      const endpointsCall = writeCalls.find((c) =>
        c[0].endsWith("projects/endpoints.py")
      );
      expect(endpointsCall).toBeDefined();
      const endpointsContent = endpointsCall![1];

      // Endpoint constant name must not have $
      expect(endpointsContent).toContain("GetProjectsProjectId = Endpoint(");
      expect(endpointsContent).not.toContain("GetProjects$projectId");

      const typesCall = writeCalls.find((c) =>
        c[0].endsWith("projects/types.py")
      );
      expect(typesCall).toBeDefined();
      const typesContent = typesCall![1];

      expect(typesContent).toContain(
        "class IGetProjectsProjectId200Response:"
      );
      expect(typesContent).not.toContain("IGetProjects$projectId");
    });
  });

  describe("2.1: Client Generators Method Signatures and Return Types", () => {
    const endpointsWithParams: EndpointInfo[] = [
      {
        name: "getProject",
        method: "get",
        path: "/projects/{projectId}",
        parameters: [
          { name: "projectId", in: "path", required: true, type: "integer" },
          { name: "verbose", in: "query", required: false, type: "boolean" },
        ],
        queryType: "GetProjectQuery",
        responseType: "IProject",
      },
      {
        name: "deleteProject",
        method: "delete",
        path: "/projects/{projectId}",
        parameters: [
          { name: "projectId", in: "path", required: true, type: "integer" },
        ],
        responseType: "void",
      },
      {
        name: "createProject",
        method: "post",
        path: "/projects",
        requestBody: { type: "ICreateProjectDTO", required: true },
        dtoType: "ICreateProjectDTO",
        responseType: "IProject",
      },
    ];

    it("Axios client should pass path arguments and properly structure get, delete, post requests", () => {
      const clientCode = generateAxiosClient(endpointsWithParams, {});

      // Path param called on helper
      expect(clientCode).toContain("const _url = getProject(url.projectId);");
      expect(clientCode).toContain("const _url = deleteProject(url.projectId);");

      // Axios delete called with 2 arguments (_url, config)
      expect(clientCode).toContain("await this.client.delete<void>(\n      _url,\n      config\n    );");

      // Axios post called with 3 arguments (_url, data, config)
      expect(clientCode).toContain("await this.client.post<IProject>(\n      _url,\n      data,\n      config\n    );");
    });

    it("Fetch client should call endpoint helpers with path arguments", () => {
      const fetchCode = generateFetchClient(endpointsWithParams, {});
      expect(fetchCode).toContain("getProject_endpoint(url.projectId)");
      expect(fetchCode).toContain("deleteProject_endpoint(url.projectId)");
    });

    it("RTK Query should call endpoint helpers with path arguments to return string URL", () => {
      const rtkCode = generateRTKQuery(endpointsWithParams, {});
      expect(rtkCode).toContain("const url = getProject(arg.url.projectId);");
      expect(rtkCode).toContain("const url = deleteProject(arg.url.projectId);");
    });
  });
});
