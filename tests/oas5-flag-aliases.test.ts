import { buildConfigFromCli } from "../Openapi-sync/cli-config";

describe("OAS-5: CLI flag names aliases between init, sync, validate, generate-client", () => {
  it("buildConfigFromCli handles canonical and alias flags interchangeably", () => {
    // Canonical init names
    const config1 = buildConfigFromCli({
      "api-url": "https://example.com/openapi.json",
      "output-folder": "./custom-output",
      "validation-library": "zod",
      "types-prefix": "T",
      "folder-split": true,
    });

    // Shared CLI names
    const config2 = buildConfigFromCli({
      "api-url": "https://example.com/openapi.json",
      folder: "./custom-output",
      "validation-lib": "zod",
      "type-prefix": "T",
      "split-by-tags": true,
    });

    expect(config1).not.toBeNull();
    expect(config2).not.toBeNull();

    expect(config1?.folder).toBe("./custom-output");
    expect(config2?.folder).toBe("./custom-output");

    expect(config1?.validations?.library).toBe("zod");
    expect(config2?.validations?.library).toBe("zod");

    expect(config1?.types?.name?.prefix).toBe("T");
    expect(config2?.types?.name?.prefix).toBe("T");

    expect(config1?.folderSplit?.byTags).toBe(true);
    expect(config2?.folderSplit?.byTags).toBe(true);
  });

  it("buildConfigFromCli also recognizes validations-library alias", () => {
    const config = buildConfigFromCli({
      "api-url": "https://example.com/openapi.json",
      "validations-library": "yup",
    });

    expect(config?.validations?.library).toBe("yup");
  });
});
