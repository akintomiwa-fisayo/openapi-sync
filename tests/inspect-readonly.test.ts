import { ListEndpoints, GetEndpointDetails } from "../index";
import { clearEndpointStore } from "../Openapi-sync/endpoint-store";
import fs from "fs";
import path from "path";
import SwaggerParser from "@apidevtools/swagger-parser";

const sampleSpec = {
  openapi: "3.0.0",
  info: { title: "Sample API", version: "1.0.0" },
  paths: {
    "/api/health": {
      get: {
        operationId: "api_healthCheck",
        summary: "Health check",
        responses: {
          "200": {
            description: "OK",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: { status: { type: "string" } },
                },
              },
            },
          },
        },
      },
    },
  },
};

const mockedFs = fs as jest.Mocked<typeof fs>;
const mockedSwaggerParser = SwaggerParser as jest.Mocked<typeof SwaggerParser>;

describe("OAS-1: Inspect commands are strictly read-only", () => {
  const testOutputDir = "./test-readonly-output";

  beforeEach(() => {
    jest.clearAllMocks();
    clearEndpointStore(true);

    mockedFs.existsSync.mockImplementation((p: any) => {
      if (typeof p === "string" && p.includes("sample_spec.json")) return true;
      return false;
    });
    (mockedFs.promises.readFile as jest.Mock).mockResolvedValue(JSON.stringify(sampleSpec));
    mockedSwaggerParser.parse.mockResolvedValue(sampleSpec as any);
  });

  afterEach(() => {
    clearEndpointStore(true);
  });

  it("ListEndpoints should discover endpoints without creating any output files or folders", async () => {
    const result = await ListEndpoints({
      silent: true,
      cliArgs: {
        "api-url": "./sample_spec.json",
        "api-name": "sample",
        folder: testOutputDir,
      },
    });

    // Endpoints must be returned
    expect(result.sample).toBeDefined();
    expect(result.sample.length).toBeGreaterThan(0);
    const healthEp = result.sample.find((e) => e.operationId === "api_healthCheck");
    expect(healthEp).toBeDefined();
    expect(healthEp?.method).toBe("GET");

    // fs.promises.writeFile must NOT have been called (no types/endpoints written)
    expect(mockedFs.promises.writeFile).not.toHaveBeenCalled();

    // fs.promises.mkdir must NOT have been called for output folder
    const mkdirCalls = (mockedFs.promises.mkdir as jest.Mock).mock.calls.map((c: any) => String(c[0]));
    const outputDirCreated = mkdirCalls.some((dir: string) => dir.includes("test-readonly-output"));
    expect(outputDirCreated).toBe(false);
  });

  it("GetEndpointDetails should return endpoint details without creating any output files or folders", async () => {
    const detail = await GetEndpointDetails({
      operationId: "api_healthCheck",
      silent: true,
      cliArgs: {
        "api-url": "./sample_spec.json",
        "api-name": "sample",
        folder: testOutputDir,
      },
    });

    expect(detail.apiName).toBe("sample");
    expect(detail.endpoint).toBeDefined();
    expect(detail.endpoint.operationId).toBe("api_healthCheck");
    expect(detail.endpoint.path).toBe("/api/health");

    // fs.promises.writeFile must NOT have been called
    expect(mockedFs.promises.writeFile).not.toHaveBeenCalled();

    // fs.promises.mkdir must NOT have been called for output folder
    const mkdirCalls = (mockedFs.promises.mkdir as jest.Mock).mock.calls.map((c: any) => String(c[0]));
    const outputDirCreated = mkdirCalls.some((dir: string) => dir.includes("test-readonly-output"));
    expect(outputDirCreated).toBe(false);
  });
});
