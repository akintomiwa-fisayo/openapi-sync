import { Init } from "../index";
import fs from "fs";

const mockFs = fs as jest.Mocked<typeof fs>;

jest.mock("../Openapi-sync", () => ({
  __esModule: true,
  default: jest.fn().mockResolvedValue({ success: true, filesWritten: ["/out/billing.ts"] }),
}));

describe("Init with target apiName", () => {
  const mockConfig = {
    folder: "./src/api",
    api: {
      billing: "https://billing.example.com/spec.json",
      users: "https://users.example.com/spec.json",
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockFs.existsSync.mockImplementation((filePath: any) => {
      return typeof filePath === "string" && filePath.endsWith("openapi.sync.json");
    });
    mockFs.readFileSync.mockImplementation(() => {
      return JSON.stringify(mockConfig);
    });
  });

  it("should sync only the specified API when apiName is provided", async () => {
    const OpenapiSync = require("../Openapi-sync").default;
    const result = await Init({ apiName: "billing", silent: true });

    expect(result.success).toBe(true);
    expect(result.apis).toEqual(["billing"]);
    expect(OpenapiSync).toHaveBeenCalledTimes(1);
    expect(OpenapiSync).toHaveBeenCalledWith(
      "https://billing.example.com/spec.json",
      "billing",
      expect.anything(),
      undefined,
      true
    );
  });

  it("should report error when target API is not in config", async () => {
    const result = await Init({ apiName: "nonexistent", silent: true });
    expect(result.success).toBe(false);
    expect(result.errors[0]).toContain('API "nonexistent" not found in config');
  });
});
