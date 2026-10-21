import {
  getSharedPathVariableName,
  renderEndpointsWithSharedPaths,
  SharedPathEndpointDescriptor,
} from "../Openapi-sync/endpoint-shared-paths";
import { Init } from "../index";
import path from "path";
import fs from "fs";

describe("Shared Paths for Endpoints", () => {
  describe("getSharedPathVariableName", () => {
    it("should generate clean variable names for root and static paths", () => {
      expect(getSharedPathVariableName("/")).toBe("_path_root");
      expect(getSharedPathVariableName("")).toBe("_path_root");
      expect(getSharedPathVariableName("/pet")).toBe("_path_pet");
      expect(getSharedPathVariableName("/user/login")).toBe("_path_user_login");
      expect(getSharedPathVariableName("/pet/findByStatus")).toBe("_path_pet_findByStatus");
    });

    it("should generate parameterized variable names with $ prefix for dynamic segments", () => {
      expect(getSharedPathVariableName("/pet/{petId}")).toBe("_path_pet_$petId");
      expect(getSharedPathVariableName("/store/order/{orderId}")).toBe("_path_store_order_$orderId");
      expect(getSharedPathVariableName("/users/{userId}/posts/{postId}")).toBe(
        "_path_users_$userId_posts_$postId"
      );
    });

    it("should handle colon and angle bracket syntax for variables", () => {
      expect(getSharedPathVariableName("/pet/:petId")).toBe("_path_pet_$petId");
      expect(getSharedPathVariableName("/pet/<petId>")).toBe("_path_pet_$petId");
    });

    it("should resolve variable name collisions uniquely", () => {
      const used = new Set<string>();
      const first = getSharedPathVariableName("/pet", used);
      const second = getSharedPathVariableName("/pet", used);
      const third = getSharedPathVariableName("/pet", used);

      expect(first).toBe("_path_pet");
      expect(second).toBe("_path_pet_2");
      expect(third).toBe("_path_pet_3");
    });
  });

  describe("renderEndpointsWithSharedPaths", () => {
    const mockDescriptors: SharedPathEndpointDescriptor[] = [
      {
        doc: "/**\n * Update an existing pet.\n * @summary Update pet\n */\n",
        name: "updatePet",
        method: "put",
        endpointPath: "/pet",
        relPath: "/pet",
        variables: [],
        paramSignature: "",
        isObject: false,
        content: {
          method: '"put"',
          operationId: '"updatePet"',
          url: '"/pet"',
          tags: ["pet"],
        },
      },
      {
        doc: "/**\n * Add a new pet.\n * @summary Add pet\n */\n",
        name: "addPet",
        method: "post",
        endpointPath: "/pet",
        relPath: "/pet",
        variables: [],
        paramSignature: "",
        isObject: false,
        content: {
          method: '"post"',
          operationId: '"addPet"',
          url: '"/pet"',
          tags: ["pet"],
        },
      },
      {
        doc: "/**\n * Get pet by id.\n * @summary Find pet\n */\n",
        name: "getPetById",
        method: "get",
        endpointPath: "/pet/{petId}",
        relPath: "/pet/${petId}",
        variables: ["petId"],
        paramSignature: "petId:number",
        isObject: false,
        content: {
          method: '"get"',
          operationId: '"getPetById"',
          url: "`/pet/${petId}`",
          tags: ["pet"],
        },
      },
      {
        doc: "/**\n * Delete pet.\n * @summary Delete pet\n */\n",
        name: "deletePet",
        method: "delete",
        endpointPath: "/pet/{petId}",
        relPath: "/pet/${petId}",
        variables: ["petId"],
        paramSignature: "petId:number",
        isObject: false,
        content: {
          method: '"delete"',
          operationId: '"deletePet"',
          url: "`/pet/${petId}`",
          tags: ["pet"],
        },
      },
      {
        doc: "/**\n * Place order.\n * @summary Place order\n */\n",
        name: "placeOrder",
        method: "post",
        endpointPath: "/store/order",
        relPath: "/store/order",
        variables: [],
        paramSignature: "",
        isObject: false,
        content: {
          method: '"post"',
          operationId: '"placeOrder"',
          url: '"/store/order"',
          tags: ["store"],
        },
      },
    ];

    it("should extract BASE_URL, share paths used >1 time, and inline single-use paths directly", () => {
      const code = renderEndpointsWithSharedPaths(
        mockDescriptors,
        "https://petstore3.swagger.io/api/v3",
        true
      );

      // BASE_URL extracted once at top
      expect(code).toContain('const BASE_URL = "https://petstore3.swagger.io/api/v3";');

      // Shared path functions/constants defined once for paths used more than once (/pet and /pet/{petId})
      expect(code).toContain("const _path_pet = `${BASE_URL}/pet`;");
      expect(code).toContain("const _path_pet_$petId = (petId:number) => `${BASE_URL}/pet/${petId}`;");

      // Single-use path (/store/order) must NOT have a separate _path_ constant
      expect(code).not.toContain("_path_store_order");

      // Verify each operation exported by operationId referencing the shared path or inlining directly
      expect(code).toContain("export const updatePet = _path_pet;");
      expect(code).toContain("export const addPet = _path_pet;");
      expect(code).toContain("export const getPetById = _path_pet_$petId;");
      expect(code).toContain("export const deletePet = _path_pet_$petId;");
      expect(code).toContain("export const placeOrder = `${BASE_URL}/store/order`;");

      // Verify JSDocs are preserved
      expect(code).toContain("* Update an existing pet.");
      expect(code).toContain("* Add a new pet.");
      expect(code).toContain("* Get pet by id.");
      expect(code).toContain("* Delete pet.");
      expect(code).toContain("* Place order.");
    });

    it("should render relative paths without BASE_URL when includeServer is false", () => {
      const code = renderEndpointsWithSharedPaths(
        mockDescriptors,
        "https://petstore3.swagger.io/api/v3",
        false
      );

      expect(code).not.toContain("const BASE_URL");
      expect(code).toContain('const _path_pet = "/pet";');
      expect(code).toContain("const _path_pet_$petId = (petId:number) => `/pet/${petId}`;");
      expect(code).not.toContain("_path_store_order");
      expect(code).toContain("export const updatePet = _path_pet;");
      expect(code).toContain("export const getPetById = _path_pet_$petId;");
      expect(code).toContain('export const placeOrder = "/store/order";');
    });

    it("should support object-style endpoint values referencing shared paths when used >1 time", () => {
      const objectDescriptors: SharedPathEndpointDescriptor[] = [
        {
          doc: "/**\n * Get pet.\n */\n",
          name: "getPetById",
          method: "get",
          endpointPath: "/pet/{petId}",
          relPath: "/pet/${petId}",
          variables: ["petId"],
          paramSignature: "petId:number",
          isObject: true,
          content: {
            method: '"get"',
            operationId: '"getPetById"',
            url: "",
            tags: ["pet"],
          },
        },
        {
          doc: "/**\n * Delete pet.\n */\n",
          name: "deletePet",
          method: "delete",
          endpointPath: "/pet/{petId}",
          relPath: "/pet/${petId}",
          variables: ["petId"],
          paramSignature: "petId:number",
          isObject: true,
          content: {
            method: '"delete"',
            operationId: '"deletePet"',
            url: "",
            tags: ["pet"],
          },
        },
      ];

      const code = renderEndpointsWithSharedPaths(objectDescriptors, "", false);

      expect(code).toContain("const _path_pet_$petId = (petId:number) => `/pet/${petId}`;");
      expect(code).toContain("url: _path_pet_$petId");
      expect(code).toContain('operationId: "getPetById"');
      expect(code).toContain('operationId: "deletePet"');
    });

    it("should inline URL directly in object-style endpoints when path is used only once", () => {
      const singleDescriptor: SharedPathEndpointDescriptor[] = [
        {
          doc: "/**\n * Get order.\n */\n",
          name: "getOrderById",
          method: "get",
          endpointPath: "/store/order/{orderId}",
          relPath: "/store/order/${orderId}",
          variables: ["orderId"],
          paramSignature: "orderId:number",
          isObject: true,
          content: {
            method: '"get"',
            operationId: '"getOrderById"',
            url: "",
            tags: ["store"],
          },
        },
      ];

      const code = renderEndpointsWithSharedPaths(
        singleDescriptor,
        "https://api.example.com",
        true
      );

      expect(code).not.toContain("_path_store_order_$orderId");
      expect(code).toContain("url: (orderId:number) => `${BASE_URL}/store/order/${orderId}`");
      expect(code).toContain('operationId: "getOrderById"');
    });
  });

  describe("Integration: openapi-sync with sharedPaths: true", () => {
    it("should generate endpoints.ts with shared path functions when sharedPaths is enabled", async () => {
      const realFs = jest.requireActual("fs") as typeof fs;
      const sampleSpecPath = path.resolve(__dirname, "../sample_spec.json");
      const sampleSpec = JSON.parse(realFs.readFileSync(sampleSpecPath, "utf-8"));

      const SwaggerParser = require("@apidevtools/swagger-parser");
      SwaggerParser.validate.mockResolvedValue(sampleSpec);
      SwaggerParser.parse.mockResolvedValue(sampleSpec);

      const mockWriteFile = jest.spyOn(fs.promises, "writeFile").mockResolvedValue(undefined as any);
      jest.spyOn(fs.promises, "readFile").mockImplementation((filePath: any) => {
        if (String(filePath).includes("sample_spec.json")) {
          return Promise.resolve(JSON.stringify(sampleSpec));
        }
        return Promise.reject(new Error("File not found"));
      });
      (fs.readFileSync as jest.Mock).mockImplementation((filePath: any) => {
        if (String(filePath).includes("sample_spec.json")) {
          return JSON.stringify(sampleSpec);
        }
        return "";
      });
      (fs.existsSync as jest.Mock).mockReturnValue(true);

      // Add a post operation to /api/users so /api/users is used >1 times (shared)
      // while /api/health and /api/users/{id} remain used once (inlined directly)
      const specWithShared = {
        ...sampleSpec,
        paths: {
          ...sampleSpec.paths,
          "/api/users": {
            ...sampleSpec.paths["/api/users"],
            post: {
              operationId: "createUser",
              summary: "Create user",
              responses: { "200": { description: "Created" } },
            },
          },
        },
      };

      SwaggerParser.validate.mockResolvedValue(specWithShared);
      SwaggerParser.parse.mockResolvedValue(specWithShared);

      const result = await Init({
        config: {
          api: {
            sample: sampleSpecPath,
          },
          server: "https://api.sample.com/v1",
          endpoints: {
            sharedPaths: true,
            value: {
              includeServer: true,
            },
          },
        },
        silent: true,
      });

      expect(result.success).toBe(true);

      // Inspect written endpoints file
      const endpointsCall = mockWriteFile.mock.calls.find((call) =>
        String(call[0]).includes("endpoints.ts")
      );
      expect(endpointsCall).toBeDefined();

      const endpointsContent = String(endpointsCall![1]);
      expect(endpointsContent).toContain('const BASE_URL = "https://api.sample.com/v1";');
      // /api/users is shared across 2 operations -> defines _path_api_users
      expect(endpointsContent).toContain("const _path_api_users = `${BASE_URL}/api/users`;");
      expect(endpointsContent).toContain("export const GetApiUsers = _path_api_users;");
      expect(endpointsContent).toContain("export const PostApiUsers = _path_api_users;");

      // Single-use paths are inlined directly with BASE_URL
      expect(endpointsContent).not.toContain("_path_api_health");
      expect(endpointsContent).toContain("export const GetApiHealth = `${BASE_URL}/api/health`;");
      expect(endpointsContent).not.toContain("_path_api_users_$id");
      expect(endpointsContent).toContain("export const GetApiUsers$id = (id:string) => `${BASE_URL}/api/users/${id}`;");

      mockWriteFile.mockRestore();
    });
  });
});
