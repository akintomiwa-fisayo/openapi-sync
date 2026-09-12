import { generateClients } from "../Openapi-sync/client-generation";
import { EndpointInfo } from "../client-generators";
import { IConfig } from "../types";
import fs from "fs";
import path from "path";

const mockedFs = fs as jest.Mocked<typeof fs>;

describe("OAS-2: Honor outputDir / --output in flat client generation", () => {
  const mockEndpoints: EndpointInfo[] = [
    {
      name: "getPetById",
      method: "get",
      path: "/pet/{petId}",
      summary: "Find pet by ID",
      operationId: "getPetById",
      tags: ["pets"],
      responseType: "IPetResponse",
      responses: {
        "200": { type: "IPetResponse" },
      },
    },
    {
      name: "getUsers",
      method: "get",
      path: "/users",
      summary: "Get users",
      operationId: "getUsers",
      tags: ["users"],
      dtoType: "ICreateUserDTO",
      responseType: "IUserResponse",
      responses: {
        "200": { type: "IUserResponse" },
      },
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockedFs.promises.mkdir = jest.fn().mockResolvedValue(undefined as never);
    mockedFs.promises.writeFile = jest.fn().mockResolvedValue(undefined as never);
    (mockedFs.promises.readFile as jest.Mock).mockRejectedValue(new Error("File not found"));
  });

  it("should write flat fetch client to outputDir and not default api folder", async () => {
    const config: IConfig = {
      folder: "src/api/generated",
      api: { backend: "https://api.test.com/openapi.json" },
    };

    const writtenFiles = await generateClients(
      mockEndpoints,
      config,
      {
        type: "fetch",
        outputDir: "src/clients/custom-fetch",
      },
      "backend",
      "src/api/generated",
      true
    );

    const writeCalls = (mockedFs.promises.writeFile as jest.Mock).mock.calls as string[][];

    // File must be written to custom outputDir
    const customCall = writeCalls.find((c) =>
      c[0].includes(path.join("src", "clients", "custom-fetch", "clients.ts"))
    );
    expect(customCall).toBeDefined();

    // Default folder must NOT have been written to
    const defaultCall = writeCalls.find((c) =>
      c[0].includes(path.join("src", "api", "generated", "backend", "clients.ts"))
    );
    expect(defaultCall).toBeUndefined();

    // Imports must point relatively from src/clients/custom-fetch to src/api/generated/backend
    const content = customCall![1];
    expect(content).toContain(`from '../../api/generated/backend/types';`);
    expect(content).toContain(`from '../../api/generated/backend/endpoints';`);

    expect(writtenFiles.some((f) => f.endsWith(path.join("src", "clients", "custom-fetch", "clients.ts")))).toBe(true);
  });

  it("should write flat react-query client and hooks to outputDir with correct relative imports", async () => {
    const config: IConfig = {
      folder: "src/api/generated",
      api: { backend: "https://api.test.com/openapi.json" },
    };

    const writtenFiles = await generateClients(
      mockEndpoints,
      config,
      {
        type: "react-query",
        outputDir: "src/clients/custom-rq",
      },
      "backend",
      "src/api/generated",
      true
    );

    const writeCalls = (mockedFs.promises.writeFile as jest.Mock).mock.calls as string[][];

    // Check clients.ts
    const clientsCall = writeCalls.find((c) =>
      c[0].includes(path.join("src", "clients", "custom-rq", "clients.ts"))
    );
    expect(clientsCall).toBeDefined();
    expect(clientsCall![1]).toContain(`from '../../api/generated/backend/types';`);
    expect(clientsCall![1]).toContain(`from '../../api/generated/backend/endpoints';`);

    // Check hooks.ts
    const hooksCall = writeCalls.find((c) =>
      c[0].includes(path.join("src", "clients", "custom-rq", "hooks.ts"))
    );
    expect(hooksCall).toBeDefined();
    expect(hooksCall![1]).toContain(`from '../../api/generated/backend/types';`);
    expect(hooksCall![1]).toContain(`import apiClient from './clients';`);

    expect(writtenFiles.some((f) => f.endsWith(path.join("src", "clients", "custom-rq", "clients.ts")))).toBe(true);
    expect(writtenFiles.some((f) => f.endsWith(path.join("src", "clients", "custom-rq", "hooks.ts")))).toBe(true);
  });

  it("should write flat rtk-query api to outputDir with correct relative imports", async () => {
    const config: IConfig = {
      folder: "src/api/generated",
      api: { backend: "https://api.test.com/openapi.json" },
    };

    const writtenFiles = await generateClients(
      mockEndpoints,
      config,
      {
        type: "rtk-query",
        outputDir: "src/clients/custom-rtk",
      },
      "backend",
      "src/api/generated",
      true
    );

    const writeCalls = (mockedFs.promises.writeFile as jest.Mock).mock.calls as string[][];

    const apiCall = writeCalls.find((c) =>
      c[0].includes(path.join("src", "clients", "custom-rtk", "api.ts"))
    );
    expect(apiCall).toBeDefined();
    expect(apiCall![1]).toContain(`from '../../api/generated/backend/types';`);
    expect(apiCall![1]).toContain(`from '../../api/generated/backend/endpoints';`);

    expect(writtenFiles.some((f) => f.endsWith(path.join("src", "clients", "custom-rtk", "api.ts")))).toBe(true);
  });

  it("should retain default behavior when outputDir is not specified in flat mode", async () => {
    const config: IConfig = {
      folder: "src/api/generated",
      api: { backend: "https://api.test.com/openapi.json" },
    };

    await generateClients(
      mockEndpoints,
      config,
      {
        type: "fetch",
      },
      "backend",
      "src/api/generated",
      true
    );

    const writeCalls = (mockedFs.promises.writeFile as jest.Mock).mock.calls as string[][];

    const defaultCall = writeCalls.find((c) =>
      c[0].includes(path.join("src", "api", "generated", "backend", "clients.ts"))
    );
    expect(defaultCall).toBeDefined();
    expect(defaultCall![1]).toContain(`from './types';`);
    expect(defaultCall![1]).toContain(`from './endpoints';`);
  });

  it("should still support folderSplit mode with custom outputDir", async () => {
    const config: IConfig = {
      folder: "src/api/generated",
      folderSplit: { byTags: true },
      api: { backend: "https://api.test.com/openapi.json" },
    };

    await generateClients(
      mockEndpoints,
      config,
      {
        type: "axios",
        outputDir: "src/api/split-clients",
      },
      "backend",
      "src/api/generated",
      true
    );

    const writeCalls = (mockedFs.promises.writeFile as jest.Mock).mock.calls as string[][];

    const petClient = writeCalls.find((c) =>
      c[0].includes(path.join("src", "api", "split-clients", "pets", "client.ts"))
    );
    expect(petClient![1]).toContain(`from '../../generated/backend/pets/types';`);
    expect(petClient![1]).toContain(`from '../../generated/backend/pets/endpoints';`);

    const rootAggregator = writeCalls.find((c) =>
      c[0].includes(path.join("src", "api", "split-clients", "clients.ts"))
    );
    expect(rootAggregator).toBeDefined();
  });
});
