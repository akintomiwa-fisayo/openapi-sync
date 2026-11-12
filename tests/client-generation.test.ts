import {
  EndpointInfo,
  filterEndpoints,
  generateFetchClient,
  generateAxiosClient,
  generateReactQueryHooks,
  generateSWRHooks,
  generateRTKQuery,
  resolveEndpointReturnType,
} from "../client-generators";
import { IConfigClientGeneration } from "../types";

describe("Client Generation", () => {
  const mockEndpoints: EndpointInfo[] = [
    {
      name: "getPetById",
      method: "get",
      path: "/pet/{petId}",
      summary: "Find pet by ID",
      operationId: "getPetById",
      tags: ["pet"],
      parameters: [
        {
          name: "petId",
          in: "path",
          required: true,
          type: "string",
        },
      ],
      responses: {
        "200": {
          type: "IPetResponse",
        },
      },
      queryType: "IGetPetByIdQuery",
      responseType: "IPetResponse",
    },
    {
      name: "createPet",
      method: "post",
      path: "/pet",
      summary: "Create a new pet",
      operationId: "createPet",
      tags: ["pet"],
      requestBody: {
        type: "ICreatePetDTO",
        required: true,
      },
      responses: {
        "201": {
          type: "IPetResponse",
        },
      },
      dtoType: "ICreatePetDTO",
      responseType: "IPetResponse",
    },
    {
      name: "getUsers",
      method: "get",
      path: "/users",
      summary: "Get all users",
      operationId: "getUsers",
      tags: ["user"],
      responses: {
        "200": {
          type: "IUserListResponse",
        },
      },
      responseType: "IUserListResponse",
    },
  ];

  describe("filterEndpoints", () => {
    it("should return all endpoints when no filters are specified", () => {
      const config: IConfigClientGeneration = { enabled: true };
      const filtered = filterEndpoints(mockEndpoints, config);
      expect(filtered).toHaveLength(3);
    });

    it("should filter endpoints by tags", () => {
      const config: IConfigClientGeneration = {
        enabled: true,
        tags: ["pet"],
      };
      const filtered = filterEndpoints(mockEndpoints, config);
      expect(filtered).toHaveLength(2);
      expect(filtered.every((e) => e.tags?.includes("pet"))).toBe(true);
    });

    it("should filter endpoints by endpoint names", () => {
      const config: IConfigClientGeneration = {
        enabled: true,
        endpoints: ["getPetById"],
      };
      const filtered = filterEndpoints(mockEndpoints, config);
      expect(filtered).toHaveLength(1);
      expect(filtered[0].name).toBe("getPetById");
    });

    it("should combine tag and endpoint filters", () => {
      const config: IConfigClientGeneration = {
        enabled: true,
        tags: ["pet"],
        endpoints: ["getPetById"],
      };
      const filtered = filterEndpoints(mockEndpoints, config);
      expect(filtered).toHaveLength(1);
      expect(filtered[0].name).toBe("getPetById");
      expect(filtered[0].tags).toContain("pet");
    });
  });

  describe("generateFetchClient", () => {
    it("should generate a fetch client with basic endpoints", () => {
      const config: IConfigClientGeneration = {
        enabled: true,
        type: "fetch",
        baseURL: "https://api.example.com",
      };
      const client = generateFetchClient([mockEndpoints[0]], config);

      expect(client).toContain("Generated Fetch API Client");
      expect(client).toContain("export interface ApiConfig");
      expect(client).toContain("export async function getPetById");
      expect(client).toContain("async function fetchAPI");
      expect(client).toContain('baseURL: "https://api.example.com"');
    });

    it("should include auth configuration when specified", () => {
      const config: IConfigClientGeneration = {
        enabled: true,
        type: "fetch",
        auth: {
          type: "bearer",
          in: "header",
        },
      };
      const client = generateFetchClient([mockEndpoints[0]], config);

      expect(client).toContain("auth?: {");
      expect(client).toContain("token?: string;");
      expect(client).toContain("Authorization");
      expect(client).toContain("Bearer");
    });

    it("should include error handling when configured", () => {
      const config: IConfigClientGeneration = {
        enabled: true,
        type: "fetch",
        errorHandling: {
          generateErrorClasses: true,
        },
      };
      const client = generateFetchClient([mockEndpoints[0]], config);

      expect(client).toContain("export class ApiError extends Error");
      expect(client).toContain("statusCode: number");
    });

    it("should generate functions with path parameters", () => {
      const config: IConfigClientGeneration = {
        enabled: true,
        type: "fetch",
      };
      const client = generateFetchClient([mockEndpoints[0]], config);

      // Should have structured params with url property
      expect(client).toContain("url: {");
      expect(client).toContain("petId: string;");
      // Should use endpoint function call with url.petId (aliased to avoid conflicts)
      expect(client).toContain("const _url = getPetById_endpoint(url.petId)");
      // Should import the endpoint function with alias
      expect(client).toContain("getPetById as getPetById_endpoint");
      expect(client).toContain("} from '../endpoints';");
    });

    it("should generate functions with request body", () => {
      const config: IConfigClientGeneration = {
        enabled: true,
        type: "fetch",
      };
      const client = generateFetchClient([mockEndpoints[1]], config);

      expect(client).toContain("data: ICreatePetDTO");
      expect(client).toContain("body: JSON.stringify(data)");
    });

    it("should support generic return types and returnType config in fetch client", () => {
      const configDefault: IConfigClientGeneration = {
        enabled: true,
        type: "fetch",
      };
      const clientDefault = generateFetchClient([mockEndpoints[0]], configDefault);
      expect(clientDefault).toContain("export async function getPetById<T = IPetResponse>");
      expect(clientDefault).toContain("): Promise<T> {");
      expect(clientDefault).toContain("return fetchAPI<T>(_url, {");

      const configCustom: IConfigClientGeneration = {
        enabled: true,
        type: "fetch",
        returnType: "${type} | undefined",
      };
      const clientCustom = generateFetchClient([mockEndpoints[0]], configCustom);
      expect(clientCustom).toContain("export async function getPetById<T = IPetResponse | undefined>");
    });
  });

  describe("generateAxiosClient", () => {
    it("should generate an exported extensible axios client class", () => {
      const config: IConfigClientGeneration = {
        enabled: true,
        type: "axios",
        baseURL: "https://api.example.com",
      };
      const client = generateAxiosClient([mockEndpoints[0]], config);

      expect(client).toContain("import axios");
      expect(client).toContain("export class ApiClient");
      expect(client).toContain("protected client: AxiosInstance");
      expect(client).toContain("axiosInstance?: AxiosInstance");
      expect(client).toContain("constructor(config: ApiConfig = {}, customClient?: AxiosInstance)");
      expect(client).toContain("protected setupInterceptors(): void");
      expect(client).toContain("public get axiosInstance(): AxiosInstance");
      expect(client).toContain("public get instance(): AxiosInstance");
      expect(client).toContain("export const apiClient = new ApiClient()");
      expect(client).toContain("export default apiClient");
    });

    it("should allow extending and subclassing ApiClient in generated code", () => {
      const config: IConfigClientGeneration = {
        enabled: true,
        type: "axios",
        baseURL: "https://api.example.com",
      };
      const clientCode = generateAxiosClient([mockEndpoints[0]], config);

      // Verify class declaration and protected members are present for subclassing
      expect(clientCode).toContain("export class ApiClient {");
      expect(clientCode).toContain("protected client: AxiosInstance;");
      expect(clientCode).toContain("protected setupInterceptors(): void {");
      expect(clientCode).toContain("public get axiosInstance(): AxiosInstance {");
      expect(clientCode).toContain("public get instance(): AxiosInstance {");
    });

    it("should support headers configuration", () => {
      const config: IConfigClientGeneration = {
        enabled: true,
        type: "axios",
      };
      const client = generateAxiosClient([mockEndpoints[0]], config);

      expect(client).toContain("headers?: Record<string, string>");
      expect(client).toContain("updateConfig");
      expect(client).not.toContain("setAuthToken");
      expect(client).not.toContain("getAuthToken");
    });

    it("should generate endpoint methods with generic type parameters defaulting to responseType", () => {
      const config: IConfigClientGeneration = {
        enabled: true,
        type: "axios",
      };
      const client = generateAxiosClient(mockEndpoints.slice(0, 2), config);

      expect(client).toContain("async getPetById<T = IPetResponse>");
      expect(client).toContain("): Promise<T> {");
      expect(client).toContain("async createPet<T = IPetResponse>");
      expect(client).toContain("const response: AxiosResponse<T> = await this.client.get<T>");
      expect(client).toContain("const response: AxiosResponse<T> = await this.client.post<T>");
    });

    it("should support returnType template configuration to customize Promise return types", () => {
      const config: IConfigClientGeneration = {
        enabled: true,
        type: "axios",
        returnType: "${type} | undefined",
      };
      const client = generateAxiosClient(mockEndpoints.slice(0, 2), config);

      expect(client).toContain("async getPetById<T = IPetResponse | undefined>");
      expect(client).toContain("async createPet<T = IPetResponse | undefined>");
    });

    it("should support returnType overrides per endpoint", () => {
      const config: IConfigClientGeneration = {
        enabled: true,
        type: "axios",
        returnType: {
          overrides: {
            getPetById: "IPetResponse | undefined",
          },
        },
      };
      const client = generateAxiosClient(mockEndpoints.slice(0, 2), config);

      expect(client).toContain("async getPetById<T = IPetResponse | undefined>");
      expect(client).toContain("async createPet<T = IPetResponse>");
    });

    it("should support returnType format function", () => {
      const config: IConfigClientGeneration = {
        enabled: true,
        type: "axios",
        returnType: {
          format: ({ endpoint, defaultType }) =>
            endpoint === "getPetById" ? `CustomWrap<${defaultType}>` : defaultType,
        },
      };
      const client = generateAxiosClient(mockEndpoints.slice(0, 2), config);

      expect(client).toContain("async getPetById<T = CustomWrap<IPetResponse>>");
      expect(client).toContain("async createPet<T = IPetResponse>");
    });
  });

  describe("generateReactQueryHooks", () => {
    it("should generate React Query hooks", () => {
      const config: IConfigClientGeneration = {
        enabled: true,
        type: "react-query",
        reactQuery: {
          version: 5,
        },
      };
      const hooks = generateReactQueryHooks(mockEndpoints.slice(0, 2), config);

      expect(hooks).toContain("@tanstack/react-query");
      expect(hooks).toContain("useQuery");
      expect(hooks).toContain("useMutation");
      expect(hooks).toContain("export function useGetPetById");
      expect(hooks).toContain("export function useCreatePet");
    });

    it("should use React Query v4 when specified", () => {
      const config: IConfigClientGeneration = {
        enabled: true,
        type: "react-query",
        reactQuery: {
          version: 4,
        },
      };
      const hooks = generateReactQueryHooks([mockEndpoints[0]], config);

      expect(hooks).toContain("react-query");
      expect(hooks).not.toContain("@tanstack/react-query");
    });

    it("should generate query hooks for GET requests", () => {
      const config: IConfigClientGeneration = {
        enabled: true,
        type: "react-query",
      };
      const hooks = generateReactQueryHooks([mockEndpoints[0]], config);

      expect(hooks).toContain("useQuery({");
      expect(hooks).toContain("queryKey:");
      expect(hooks).toContain("queryFn:");
    });

    it("should generate mutation hooks for POST requests", () => {
      const config: IConfigClientGeneration = {
        enabled: true,
        type: "react-query",
      };
      const hooks = generateReactQueryHooks([mockEndpoints[1]], config);

      expect(hooks).toContain("useMutation({");
      expect(hooks).toContain("mutationFn:");
    });

    it("should skip mutations when disabled", () => {
      const config: IConfigClientGeneration = {
        enabled: true,
        type: "react-query",
        reactQuery: {
          mutations: false,
        },
      };
      const hooks = generateReactQueryHooks([mockEndpoints[1]], config);

      expect(hooks).not.toContain("useMutation");
    });
  });

  describe("generateSWRHooks", () => {
    it("should generate SWR hooks", () => {
      const config: IConfigClientGeneration = {
        enabled: true,
        type: "swr",
      };
      const hooks = generateSWRHooks(mockEndpoints.slice(0, 2), config);

      expect(hooks).toContain("import useSWR");
      expect(hooks).toContain("export function useGetPetById");
      expect(hooks).toContain("export function useCreatePet");
    });

    it("should generate hooks with query parameters", () => {
      const config: IConfigClientGeneration = {
        enabled: true,
        type: "swr",
      };
      const hooks = generateSWRHooks([mockEndpoints[0]], config);

      // Should have structured params with url property
      expect(hooks).toContain("url: {");
      expect(hooks).toContain("petId: string;");
      expect(hooks).toContain("['getPetById', params]");
    });

    it("should include mutation hooks when enabled", () => {
      const config: IConfigClientGeneration = {
        enabled: true,
        type: "swr",
        swr: {
          mutations: true,
        },
      };
      const hooks = generateSWRHooks([mockEndpoints[1]], config);

      expect(hooks).toContain("useSWRMutation");
    });

    it("should skip mutation hooks when disabled", () => {
      const config: IConfigClientGeneration = {
        enabled: true,
        type: "swr",
        swr: {
          mutations: false,
        },
      };
      const hooks = generateSWRHooks([mockEndpoints[1]], config);

      expect(hooks).not.toContain("useSWRMutation");
    });
  });

  describe("generateRTKQuery", () => {
    it("should generate RTK Query API slice", () => {
      const config: IConfigClientGeneration = {
        enabled: true,
        type: "rtk-query",
        rtkQuery: {
          apiName: "petstore",
        },
        baseURL: "https://api.example.com",
      };
      const api = generateRTKQuery(mockEndpoints.slice(0, 2), config);

      expect(api).toContain("createApi");
      expect(api).toContain("fetchBaseQuery");
      expect(api).toContain("const petstoreApi = createApi");
      expect(api).toContain("reducerPath: 'petstoreApi'");
    });

    it("should generate query endpoints for GET requests", () => {
      const config: IConfigClientGeneration = {
        enabled: true,
        type: "rtk-query",
      };
      const api = generateRTKQuery([mockEndpoints[0]], config);

      expect(api).toContain("getPetById: builder.query");
    });

    it("should generate mutation endpoints for POST requests", () => {
      const config: IConfigClientGeneration = {
        enabled: true,
        type: "rtk-query",
      };
      const api = generateRTKQuery([mockEndpoints[1]], config);

      expect(api).toContain("createPet: builder.mutation");
    });

    it("should include auth configuration in prepareHeaders", () => {
      const config: IConfigClientGeneration = {
        enabled: true,
        type: "rtk-query",
        auth: {
          type: "bearer",
          in: "header",
        },
      };
      const api = generateRTKQuery([mockEndpoints[0]], config);

      expect(api).toContain("prepareHeaders");
      expect(api).toContain("Authorization");
    });

    it("should include tagTypes from endpoint tags", () => {
      const config: IConfigClientGeneration = {
        enabled: true,
        type: "rtk-query",
      };
      const api = generateRTKQuery(mockEndpoints, config);

      expect(api).toContain("tagTypes:");
      expect(api).toContain("'pet'");
      expect(api).toContain("'user'");
    });

    it("should generate query and mutation endpoints", () => {
      const config: IConfigClientGeneration = {
        enabled: true,
        type: "rtk-query",
      };
      const api = generateRTKQuery(mockEndpoints.slice(0, 2), config);

      expect(api).toContain("getPetById: builder.query");
      expect(api).toContain("createPet: builder.mutation");
      expect(api).toContain("export default");
    });

    it("should export the API slice as default", () => {
      const config: IConfigClientGeneration = {
        enabled: true,
        type: "rtk-query",
        rtkQuery: {
          apiName: "petstore",
        },
      };
      const api = generateRTKQuery(mockEndpoints.slice(0, 2), config);

      expect(api).toContain("export default petstoreApi;");
    });
  });

  describe("resolveClientConfigForApi", () => {
    // Import dynamically from client-generation module
    const { resolveClientConfigForApi } = require("../Openapi-sync/client-generation");

    it("should return global string baseURL and outputDir unchanged", () => {
      const config: IConfigClientGeneration = {
        enabled: true,
        type: "axios",
        baseURL: "https://api.example.com",
        outputDir: "./src/client",
      };

      const resolved = resolveClientConfigForApi(config, "petstore");
      expect(resolved.baseURL).toBe("https://api.example.com");
      expect(resolved.outputDir).toBe("./src/client");
    });

    it("should resolve per-API baseURL from Record map", () => {
      const config: IConfigClientGeneration = {
        enabled: true,
        type: "axios",
        baseURL: {
          petstore: "https://petstore.example.com/v3",
          users: "https://users.example.com/api",
        },
      };

      const petstoreResolved = resolveClientConfigForApi(config, "petstore");
      expect(petstoreResolved.baseURL).toBe("https://petstore.example.com/v3");

      const usersResolved = resolveClientConfigForApi(config, "users");
      expect(usersResolved.baseURL).toBe("https://users.example.com/api");

      const unknownResolved = resolveClientConfigForApi(config, "unknown");
      expect(unknownResolved.baseURL).toBeUndefined();
    });

    it("should resolve per-API outputDir from Record map", () => {
      const config: IConfigClientGeneration = {
        enabled: true,
        type: "react-query",
        outputDir: {
          petstore: "./src/api/petstore/client",
          billing: "./src/api/billing/client",
        },
      };

      const petstoreResolved = resolveClientConfigForApi(config, "petstore");
      expect(petstoreResolved.outputDir).toBe("./src/api/petstore/client");

      const billingResolved = resolveClientConfigForApi(config, "billing");
      expect(billingResolved.outputDir).toBe("./src/api/billing/client");
    });

    it("should resolve from perApi override block", () => {
      const config: IConfigClientGeneration = {
        enabled: true,
        type: "fetch",
        baseURL: "https://default.example.com",
        outputDir: "./src/api/clients",
        perApi: {
          petstore: {
            baseURL: "https://petstore.swagger.io/v2",
            outputDir: "./src/custom/petstore",
          },
        },
      };

      const petstoreResolved = resolveClientConfigForApi(config, "petstore");
      expect(petstoreResolved.baseURL).toBe("https://petstore.swagger.io/v2");
      expect(petstoreResolved.outputDir).toBe("./src/custom/petstore");

      const otherResolved = resolveClientConfigForApi(config, "otherApi");
      expect(otherResolved.baseURL).toBe("https://default.example.com");
      expect(otherResolved.outputDir).toBe("./src/api/clients");
    });

    it("should give perApi precedence over per-API maps and global strings", () => {
      const config: IConfigClientGeneration = {
        enabled: true,
        type: "axios",
        baseURL: {
          petstore: "https://map.example.com",
        },
        outputDir: {
          petstore: "./src/map/path",
        },
        perApi: {
          petstore: {
            baseURL: "https://perapi.example.com",
            outputDir: "./src/perapi/path",
          },
        },
      };

      const resolved = resolveClientConfigForApi(config, "petstore");
      expect(resolved.baseURL).toBe("https://perapi.example.com");
      expect(resolved.outputDir).toBe("./src/perapi/path");
    });

    it("should integrate with client generator to bake resolved per-API baseURL into code", () => {
      const config: IConfigClientGeneration = {
        enabled: true,
        type: "axios",
        baseURL: {
          petstore: "https://petstore3.swagger.io/api/v3",
        },
      };

      const resolved = resolveClientConfigForApi(config, "petstore");
      const clientCode = generateAxiosClient([mockEndpoints[0]], resolved);
      expect(clientCode).toContain('baseURL: config.baseURL || "https://petstore3.swagger.io/api/v3"');
    });
  });

  describe("endpoints.value.type === 'object' support", () => {
    it("should access .url in fetch and next-fetch clients for object endpoints", () => {
      const fetchCode = generateFetchClient(
        [mockEndpoints[0], mockEndpoints[2]],
        { enabled: true, type: "fetch" },
        false,
        "object"
      );
      expect(fetchCode).toContain("const _url = getPetById_endpoint.url(url.petId);");
      expect(fetchCode).toContain("const _url = getUsers_endpoint.url;");

      const nextFetchCode = generateFetchClient(
        [mockEndpoints[0], mockEndpoints[2]],
        { enabled: true, type: "next-fetch", next: true },
        false,
        "object"
      );
      expect(nextFetchCode).toContain("const _url = getPetById_endpoint.url(url.petId);");
      expect(nextFetchCode).toContain("const _url = getUsers_endpoint.url;");
    });

    it("should access .url in axios client for object endpoints", () => {
      const axiosCode = generateAxiosClient(
        [mockEndpoints[0], mockEndpoints[2]],
        { enabled: true, type: "axios" },
        false,
        "object"
      );
      expect(axiosCode).toContain("const _url = getPetById.url(url.petId);");
      expect(axiosCode).toContain("const _url = getUsers.url;");
    });

    it("should access .url in rtk-query client for object endpoints", () => {
      const rtkCode = generateRTKQuery(
        [mockEndpoints[0], mockEndpoints[2]],
        { enabled: true, type: "rtk-query" },
        "object"
      );
      expect(rtkCode).toContain("const url = getPetById.url(arg.url.petId);");
      expect(rtkCode).toContain("const url = getUsers.url;");
    });

    describe("generateClients integration across all client types", () => {
      const fs = require("fs");
      const { generateClients } = require("../Openapi-sync/client-generation");

      const allClientTypes: Array<
        "fetch" | "next-fetch" | "axios" | "react-query" | "swr" | "rtk-query"
      > = ["fetch", "next-fetch", "axios", "react-query", "swr", "rtk-query"];

      beforeEach(() => {
        jest.clearAllMocks();
        fs.promises.mkdir = jest.fn().mockResolvedValue(undefined);
        fs.promises.writeFile = jest.fn().mockResolvedValue(undefined);
        fs.promises.readFile = jest.fn().mockRejectedValue(new Error("ENOENT"));
      });

      it.each(allClientTypes)(
        "should generate valid %s client in flat mode when endpoints.value.type is 'object'",
        async (clientType) => {
          const fullConfig = {
            api: { petstore: "https://petstore3.swagger.io/api/v3/openapi.json" },
            endpoints: { value: { type: "object" as const } },
            clientGeneration: { enabled: true, type: clientType },
          };

          await generateClients(
            [mockEndpoints[0], mockEndpoints[2]],
            fullConfig,
            fullConfig.clientGeneration,
            "petstore",
            "/tmp/out",
            true
          );

          const writeCalls = (fs.promises.writeFile as jest.Mock).mock.calls;
          expect(writeCalls.length).toBeGreaterThan(0);

          const targetSuffix =
            clientType === "rtk-query" ? "api.ts" : "clients.ts";
          const clientWrite = writeCalls.find(([filePath]: [string]) =>
            filePath.endsWith(targetSuffix)
          );
          expect(clientWrite).toBeDefined();

          const content = clientWrite[1] as string;
          if (clientType === "fetch" || clientType === "next-fetch") {
            expect(content).toContain("getPetById_endpoint.url(url.petId)");
            expect(content).toContain("getUsers_endpoint.url");
          } else if (clientType === "rtk-query") {
            expect(content).toContain("getPetById.url(arg.url.petId)");
            expect(content).toContain("getUsers.url");
          } else {
            expect(content).toContain("getPetById.url(url.petId)");
            expect(content).toContain("getUsers.url");
          }
        }
      );

      it.each(allClientTypes)(
        "should generate valid %s client in folder-split mode when endpoints.value.type is 'object'",
        async (clientType) => {
          const fullConfig = {
            api: { petstore: "https://petstore3.swagger.io/api/v3/openapi.json" },
            folderSplit: { byTags: true },
            endpoints: { value: { type: "object" as const } },
            clientGeneration: { enabled: true, type: clientType },
          };

          await generateClients(
            [mockEndpoints[0], mockEndpoints[2]],
            fullConfig,
            fullConfig.clientGeneration,
            "petstore",
            "/tmp/out",
            true
          );

          const writeCalls = (fs.promises.writeFile as jest.Mock).mock.calls;
          const folderTargetSuffix =
            clientType === "rtk-query" ? "/pet/api.ts" : "/pet/client.ts";
          const petClientWrite = writeCalls.find(([filePath]: [string]) =>
            filePath.endsWith(folderTargetSuffix)
          );
          expect(petClientWrite).toBeDefined();

          const petContent = petClientWrite[1] as string;
          if (clientType === "fetch" || clientType === "next-fetch") {
            expect(petContent).toContain("getPetById_endpoint.url(url.petId)");
          } else if (clientType === "rtk-query") {
            expect(petContent).toContain("getPetById.url(arg.url.petId)");
          } else {
            expect(petContent).toContain("getPetById.url(url.petId)");
          }

          const userTargetSuffix =
            clientType === "rtk-query" ? "/user/api.ts" : "/user/client.ts";
          const userClientWrite = writeCalls.find(([filePath]: [string]) =>
            filePath.endsWith(userTargetSuffix)
          );
          expect(userClientWrite).toBeDefined();

          const userContent = userClientWrite[1] as string;
          if (clientType === "fetch" || clientType === "next-fetch") {
            expect(userContent).toContain("getUsers_endpoint.url");
          } else if (clientType === "rtk-query") {
            expect(userContent).toContain("getUsers.url");
          } else {
            expect(userContent).toContain("getUsers.url");
          }
        }
      );
    });
  });
});
