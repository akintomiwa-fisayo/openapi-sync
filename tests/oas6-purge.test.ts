import { Purge } from "../index";
import * as indexModule from "../index";
import fs from "fs";

const mockFs = fs as jest.Mocked<typeof fs>;

describe("OAS-6: Purge() programmatic API parity with docs", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns purged array, success status, and deletes files when yes: true is passed", async () => {
    const staleFile = "/mock/dir/api/petstore/types/old.ts";

    // Spy on Init to return stalePaths
    const initSpy = jest.spyOn(indexModule, "Init").mockResolvedValue({
      stalePaths: [staleFile],
      filesWritten: [],
      endpointCount: 1,
      warnings: [],
      errors: [],
      success: true,
      apis: ["petstore"],
    });

    mockFs.existsSync.mockReturnValue(true);
    mockFs.unlinkSync = jest.fn();

    const result = await Purge({ yes: true, silent: true });

    expect(result.success).toBe(true);
    expect(result.stalePaths).toEqual([staleFile]);
    expect(result.deleted).toEqual([staleFile]);
    expect(result.purged).toEqual([staleFile]);
    expect(result.errors).toEqual([]);
    expect(mockFs.unlinkSync).toHaveBeenCalledWith(staleFile);
    expect(result.message).toContain("Purged 1 stale file(s)");

    initSpy.mockRestore();
  });

  it("does not delete files when yes: false or not provided (dry-run)", async () => {
    const staleFile = "/mock/dir/api/petstore/types/old.ts";

    const initSpy = jest.spyOn(indexModule, "Init").mockResolvedValue({
      stalePaths: [staleFile],
      filesWritten: [],
      endpointCount: 1,
      warnings: [],
      errors: [],
      success: true,
      apis: ["petstore"],
    });

    mockFs.existsSync.mockReturnValue(true);
    mockFs.unlinkSync = jest.fn();

    const result = await Purge({ silent: true });

    expect(result.success).toBe(true);
    expect(result.stalePaths).toEqual([staleFile]);
    expect(result.deleted).toEqual([]);
    expect(result.purged).toEqual([]);
    expect(mockFs.unlinkSync).not.toHaveBeenCalled();
    expect(result.message).toContain("Dry run only");

    initSpy.mockRestore();
  });

  it("maintains backwards compatibility with deleteFiles: true", async () => {
    const staleFile = "/mock/dir/api/petstore/types/old.ts";

    const initSpy = jest.spyOn(indexModule, "Init").mockResolvedValue({
      stalePaths: [staleFile],
      filesWritten: [],
      endpointCount: 1,
      warnings: [],
      errors: [],
      success: true,
      apis: ["petstore"],
    });

    mockFs.existsSync.mockReturnValue(true);
    mockFs.unlinkSync = jest.fn();

    const result = await Purge({ deleteFiles: true, silent: true });

    expect(result.success).toBe(true);
    expect(result.deleted).toEqual([staleFile]);
    expect(result.purged).toEqual([staleFile]);
    expect(mockFs.unlinkSync).toHaveBeenCalledWith(staleFile);

    initSpy.mockRestore();
  });
});
