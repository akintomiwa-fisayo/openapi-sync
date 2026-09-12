import { ValidateConfig, Init } from "../index";
import { resetEnvLoadState } from "../Openapi-sync/spec-auth";
import axios from "axios";
import fs from "fs";
import SwaggerParser from "@apidevtools/swagger-parser";

const sampleSpec = require("../sample_spec.json");

const mockedAxios = axios as jest.Mocked<typeof axios>;
const mockedFs = fs as jest.Mocked<typeof fs>;
const mockedSwaggerParser = SwaggerParser as jest.Mocked<typeof SwaggerParser>;

describe("OAS-4: 401/403 errors structured recovery hints", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetEnvLoadState();

    mockedFs.existsSync.mockImplementation((p: any) => {
      const str = String(p);
      if (str.includes("openapi.sync")) return true;
      return false;
    });

    mockedFs.promises.mkdir = jest.fn().mockResolvedValue(undefined as never);
    mockedFs.promises.writeFile = jest.fn().mockResolvedValue(undefined as never);
  });

  it("ValidateConfig on 401 returns SPEC_FETCH_FAILED with status 401 and actionable recovery string", async () => {
    const error401: any = new Error("Request failed with status code 401");
    error401.response = { status: 401, data: "Unauthorized" };
    mockedAxios.get.mockRejectedValue(error401);

    const result = await ValidateConfig({
      silent: true,
      config: {
        folder: "./api",
        api: {
          backend: "https://api.example.com/openapi.json",
        },
      },
    });

    expect(result.valid).toBe(false);
    expect(result.apis.backend).toBeDefined();
    expect(result.apis.backend.valid).toBe(false);

    // Stable machine-readable code
    expect(result.apis.backend.code).toBe("SPEC_FETCH_FAILED");
    expect(result.apis.backend.status).toBe(401);
    expect(result.apis.backend.url).toBe("https://api.example.com/openapi.json");

    // Human-readable error message preserved
    expect(result.apis.backend.error).toContain("401");

    // Actionable recovery instructions listing --auth-type, config auth, and --prompt-auth
    expect(result.apis.backend.recovery).toBeDefined();
    const recovery = result.apis.backend.recovery!;
    expect(recovery).toContain("auth");
    expect(recovery).toContain("--auth-type");
    expect(recovery).toContain("--prompt-auth");
  });

  it("ValidateConfig on missing env var still uses the existing env-not-set message without regression", async () => {
    delete process.env.MY_SECRET_SPEC_TOKEN;

    const result = await ValidateConfig({
      silent: true,
      config: {
        folder: "./api",
        api: {
          backend: {
            url: "https://api.example.com/openapi.json",
            auth: {
              type: "bearer",
              token: "${env.MY_SECRET_SPEC_TOKEN}",
            },
          },
        },
      },
    });

    expect(result.valid).toBe(false);
    expect(result.apis.backend).toBeDefined();
    expect(result.apis.backend.valid).toBe(false);
    expect(result.apis.backend.error).toContain('Environment variable "MY_SECRET_SPEC_TOKEN" referenced in openapi-sync config is not set');
  });

  it("ValidateConfig on 200 with valid spec remains valid", async () => {
    mockedAxios.get.mockResolvedValue({ data: sampleSpec });
    mockedSwaggerParser.parse.mockResolvedValue(sampleSpec as any);

    const result = await ValidateConfig({
      silent: true,
      config: {
        folder: "./api",
        api: {
          backend: "https://api.example.com/openapi.json",
        },
      },
    });

    expect(result.valid).toBe(true);
    expect(result.apis.backend.valid).toBe(true);
    expect(result.apis.backend.error).toBeUndefined();
    expect(result.apis.backend.code).toBeUndefined();
    expect(result.apis.backend.endpointCount).toBeGreaterThan(0);
  });
});
