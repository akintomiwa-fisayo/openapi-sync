import { Init } from "../index";
import { nonInteractiveInit } from "../Openapi-sync/interactive-init";
import { clearEndpointStore } from "../Openapi-sync/endpoint-store";
import fs from "fs";
import path from "path";
import SwaggerParser from "@apidevtools/swagger-parser";

const sampleSpec = require("../sample_spec.json");

const mockedFs = fs as jest.Mocked<typeof fs>;
const mockedSwaggerParser = SwaggerParser as jest.Mocked<typeof SwaggerParser>;

describe("OAS-3: Preset / sync actually generates the client & gapless nextSteps", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    clearEndpointStore(true);

    mockedFs.existsSync.mockImplementation((p: any) => {
      const str = String(p);
      if (str.includes("sample_spec.json")) return true;
      if (str.includes("openapi.sync")) return true;
      return false;
    });

    (mockedFs.promises.readFile as jest.Mock).mockResolvedValue(JSON.stringify(sampleSpec));
    mockedSwaggerParser.parse.mockResolvedValue(sampleSpec as any);
    mockedFs.promises.mkdir = jest.fn().mockResolvedValue(undefined as never);
    mockedFs.promises.writeFile = jest.fn().mockResolvedValue(undefined as never);
    mockedFs.writeFileSync = jest.fn();
  });

  afterEach(() => {
    clearEndpointStore(true);
  });

  it("nonInteractiveInit with preset react-query-zod without runSync writes config and gives gapless nextSteps", async () => {
    const res = await nonInteractiveInit({
      apiName: "petstore",
      apiSource: "./sample_spec.json",
      preset: "react-query-zod",
      configFormat: "json",
      silent: true,
      runSync: false,
    });

    expect(res.success).toBe(true);
    expect(res.nextSteps).toBeDefined();

    const nextSteps = res.nextSteps!;
    // Verify no numbering gaps: 1, 2, 3, 4
    expect(nextSteps[0]).toMatch(/^1\./);
    expect(nextSteps[1]).toMatch(/^2\./);
    expect(nextSteps[2]).toMatch(/^3\./);
    expect(nextSteps[3]).toMatch(/^4\./);
    expect(nextSteps.length).toBe(4);

    // Verify step 2 advertises (types + client)
    expect(nextSteps[1]).toContain("(types + client)");
    // Verify step 3 advertises client generation for react-query
    expect(nextSteps[2]).toContain("generate-client --type react-query");
  });

  it("Init() with preset react-query-zod generates types AND client files (clients.ts and hooks.ts)", async () => {
    const config = {
      folder: "src/api",
      preset: "react-query-zod" as const,
      api: { petstore: "./sample_spec.json" },
      clientGeneration: {
        enabled: true,
        type: "react-query" as const,
      },
      validations: {
        library: "zod" as const,
      },
    };

    const result = await Init({
      config,
      silent: true,
    });

    expect(result.success).toBe(true);

    const writeCalls = (mockedFs.promises.writeFile as jest.Mock).mock.calls as string[][];
    const writtenFilePaths = writeCalls.map((c) => c[0]);

    // Should generate types, endpoints, and validations
    expect(writtenFilePaths.some((f) => f.includes("types"))).toBe(true);
    expect(writtenFilePaths.some((f) => f.includes("endpoints"))).toBe(true);
    expect(writtenFilePaths.some((f) => f.includes("validations.ts"))).toBe(true);

    // Should also generate clients.ts and hooks.ts
    expect(writtenFilePaths.some((f) => f.includes("clients.ts"))).toBe(true);
    expect(writtenFilePaths.some((f) => f.includes("hooks.ts"))).toBe(true);

    // filesWritten should contain the client files
    expect(result.filesWritten.some((f) => f.includes("clients.ts"))).toBe(true);
    expect(result.filesWritten.some((f) => f.includes("hooks.ts"))).toBe(true);
  });

  it("Init() with next-fetch preset generates fetch clients.ts and NO validations.ts", async () => {
    const config = {
      folder: "src/api",
      preset: "next-fetch" as const,
      api: { petstore: "./sample_spec.json" },
      clientGeneration: {
        enabled: true,
        type: "fetch" as const,
      },
      validations: {
        disable: true,
      },
    };

    const result = await Init({
      config,
      silent: true,
    });

    expect(result.success).toBe(true);

    const writeCalls = (mockedFs.promises.writeFile as jest.Mock).mock.calls as string[][];
    const writtenFilePaths = writeCalls.map((c) => c[0]);

    // Should generate fetch clients.ts
    expect(writtenFilePaths.some((f) => f.includes("clients.ts"))).toBe(true);
    // Should NOT generate validations.ts
    expect(writtenFilePaths.some((f) => f.includes("validations.ts"))).toBe(false);
    // Should NOT generate hooks.ts
    expect(writtenFilePaths.some((f) => f.includes("hooks.ts"))).toBe(false);
  });

  it("Init() without clientGeneration does NOT generate any client files", async () => {
    const config = {
      folder: "src/api",
      api: { petstore: "./sample_spec.json" },
    };

    const result = await Init({
      config,
      silent: true,
    });

    expect(result.success).toBe(true);

    const writeCalls = (mockedFs.promises.writeFile as jest.Mock).mock.calls as string[][];
    const writtenFilePaths = writeCalls.map((c) => c[0]);

    // Types and endpoints generated
    expect(writtenFilePaths.some((f) => f.includes("types"))).toBe(true);
    expect(writtenFilePaths.some((f) => f.includes("endpoints"))).toBe(true);

    // No client files generated
    expect(writtenFilePaths.some((f) => f.includes("clients.ts"))).toBe(false);
    expect(writtenFilePaths.some((f) => f.includes("hooks.ts"))).toBe(false);
    expect(writtenFilePaths.some((f) => f.includes("api.ts"))).toBe(false);
  });

  it("nonInteractiveInit without client or preset has 3 gapless steps (1, 2, 3)", async () => {
    const res = await nonInteractiveInit({
      apiName: "petstore",
      apiSource: "./sample_spec.json",
      configFormat: "json",
      silent: true,
      runSync: false,
    });

    expect(res.success).toBe(true);
    const nextSteps = res.nextSteps!;
    expect(nextSteps.length).toBe(3);
    expect(nextSteps[0]).toMatch(/^1\./);
    expect(nextSteps[1]).toMatch(/^2\./);
    expect(nextSteps[2]).toMatch(/^3\./);
    expect(nextSteps[1]).not.toContain("(types + client)");
  });
});
