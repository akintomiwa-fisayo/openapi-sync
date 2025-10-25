import {
  EndpointInfo,
  filterEndpoints,
  generateFetchClient,
  generateAxiosClient,
  generateReactQueryHooks,
  generateSWRHooks,
  generateRTKQuery,
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
  });

  describe("generateAxiosClient", () => {
    it("should generate an axios client class", () => {
      const config: IConfigClientGeneration = {
        enabled: true,
        type: "axios",
        baseURL: "https://api.example.com",
      };
      const client = generateAxiosClient([mockEndpoints[0]], config);

      expect(client).toContain("import axios");
      expect(client).toContain("class ApiClient");
      expect(client).toContain("private client: AxiosInstance");
      expect(client).toContain("export const apiClient = new ApiClient()");
    });

    it("should include auth interceptors when configured", () => {
      const config: IConfigClientGeneration = {
        enabled: true,
        type: "axios",
        auth: {
          type: "bearer",
          in: "header",
        },
      };
      const client = generateAxiosClient([mockEndpoints[0]], config);

      expect(client).toContain("interceptors.request.use");
      expect(client).toContain("setAuthToken");
      expect(client).toContain("getAuthToken");
    });

    it("should generate endpoint methods", () => {
      const config: IConfigClientGeneration = {
        enabled: true,
        type: "axios",
      };
      const client = generateAxiosClient(mockEndpoints.slice(0, 2), config);

      expect(client).toContain("async getPetById");
      expect(client).toContain("async createPet");
      expect(client).toContain("this.client.get");
      expect(client).toContain("this.client.post");
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
});
