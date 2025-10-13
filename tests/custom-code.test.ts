import {
  extractCustomCode,
  createCustomCodeMarker,
  mergeCustomCode,
} from "../helpers";

describe("Custom Code Preservation", () => {
  describe("extractCustomCode", () => {
    it("should extract custom code from file with markers", () => {
      const fileContent = `// Some generated code
export const endpoint1 = "/api/v1";

// ============================================================
// 🔒 CUSTOM CODE START
// ============================================================

export const customEndpoint = "/custom/api";

// ============================================================
// 🔒 CUSTOM CODE END
// ============================================================

export const endpoint2 = "/api/v2";`;

      const result = extractCustomCode(fileContent);

      expect(result.afterGenerated).toContain("CUSTOM CODE START");
      expect(result.afterGenerated).toContain("customEndpoint");
      expect(result.afterGenerated).toContain("CUSTOM CODE END");
      expect(result.beforeGenerated).toBe("");
    });

    it("should extract custom code at top of file", () => {
      const fileContent = `// ============================================================
// 🔒 CUSTOM CODE START
// ============================================================

export const customHelper = () => {};

// ============================================================
// 🔒 CUSTOM CODE END
// ============================================================

export const endpoint1 = "/api/v1";`;

      const result = extractCustomCode(fileContent);

      expect(result.beforeGenerated).toContain("CUSTOM CODE START");
      expect(result.beforeGenerated).toContain("customHelper");
      expect(result.afterGenerated).toBe("");
    });

    it("should extract both top and bottom custom code", () => {
      const fileContent = `// ============================================================
// 🔒 CUSTOM CODE START
// ============================================================

export const topCustom = "top";

// ============================================================
// 🔒 CUSTOM CODE END
// ============================================================

export const endpoint1 = "/api/v1";

// ============================================================
// 🔒 CUSTOM CODE START
// ============================================================

export const bottomCustom = "bottom";

// ============================================================
// 🔒 CUSTOM CODE END
// ============================================================`;

      const result = extractCustomCode(fileContent);

      expect(result.beforeGenerated).toContain("topCustom");
      expect(result.afterGenerated).toContain("bottomCustom");
    });

    it("should return empty strings when no markers found", () => {
      const fileContent = `export const endpoint1 = "/api/v1";
export const endpoint2 = "/api/v2";`;

      const result = extractCustomCode(fileContent);

      expect(result.beforeGenerated).toBe("");
      expect(result.afterGenerated).toBe("");
    });

    it("should handle custom marker text", () => {
      const fileContent = `export const existing = "/api/existing";

// ============================================================
// 🔒 MY CUSTOM MARKER START
// ============================================================

export const custom = "test";

// ============================================================
// 🔒 MY CUSTOM MARKER END
// ============================================================`;

      const result = extractCustomCode(fileContent, "MY CUSTOM MARKER");

      expect(result.afterGenerated).toContain("MY CUSTOM MARKER START");
      expect(result.afterGenerated).toContain("custom");
    });
  });

  describe("createCustomCodeMarker", () => {
    it("should create top marker with instructions", () => {
      const marker = createCustomCodeMarker("top", "CUSTOM CODE", true);

      expect(marker).toContain("🔒 CUSTOM CODE START");
      expect(marker).toContain("🔒 CUSTOM CODE END");
      expect(marker).toContain("Add your custom code below this line");
      expect(marker).toContain("preserved during regeneration");
    });

    it("should create bottom marker with instructions", () => {
      const marker = createCustomCodeMarker("bottom", "CUSTOM CODE", true);

      expect(marker).toContain("🔒 CUSTOM CODE START");
      expect(marker).toContain("🔒 CUSTOM CODE END");
      expect(marker).toContain("Add your custom code above this line");
    });

    it("should create marker without instructions", () => {
      const marker = createCustomCodeMarker("top", "CUSTOM CODE", false);

      expect(marker).toContain("🔒 CUSTOM CODE START");
      expect(marker).toContain("🔒 CUSTOM CODE END");
      expect(marker).not.toContain("Add your custom code");
    });

    it("should handle custom marker text", () => {
      const marker = createCustomCodeMarker("bottom", "MY MARKER", true);

      expect(marker).toContain("🔒 MY MARKER START");
      expect(marker).toContain("🔒 MY MARKER END");
    });
  });

  describe("mergeCustomCode", () => {
    it("should create new file with bottom marker when no existing file", () => {
      const generated = `export const endpoint1 = "/api/v1";
export const endpoint2 = "/api/v2";`;

      const result = mergeCustomCode(generated, null, {
        position: "bottom",
      });

      expect(result).toContain(generated);
      expect(result).toContain("🔒 CUSTOM CODE START");
      expect(result).toContain("🔒 CUSTOM CODE END");
      expect(result.indexOf(generated)).toBeLessThan(
        result.indexOf("🔒 CUSTOM CODE START")
      );
    });

    it("should create new file with top marker when no existing file", () => {
      const generated = `export const endpoint1 = "/api/v1";`;

      const result = mergeCustomCode(generated, null, {
        position: "top",
      });

      expect(result).toContain(generated);
      expect(result).toContain("🔒 CUSTOM CODE START");
      expect(result.indexOf("🔒 CUSTOM CODE START")).toBeLessThan(
        result.indexOf(generated)
      );
    });

    it("should preserve existing custom code at bottom", () => {
      const existing = `export const oldEndpoint = "/api/old";

// ============================================================
// 🔒 CUSTOM CODE START
// ============================================================

export const myCustom = "/custom";

// ============================================================
// 🔒 CUSTOM CODE END
// ============================================================`;

      const generated = `export const newEndpoint = "/api/new";`;

      const result = mergeCustomCode(generated, existing, {
        position: "bottom",
      });

      expect(result).toContain("newEndpoint");
      expect(result).toContain("myCustom");
      expect(result).not.toContain("oldEndpoint");
      expect(result.indexOf("newEndpoint")).toBeLessThan(
        result.indexOf("myCustom")
      );
    });

    it("should preserve existing custom code at top", () => {
      const existing = `// ============================================================
// 🔒 CUSTOM CODE START
// ============================================================

export const myHelper = () => {};

// ============================================================
// 🔒 CUSTOM CODE END
// ============================================================

export const oldEndpoint = "/api/old";`;

      const generated = `export const newEndpoint = "/api/new";`;

      const result = mergeCustomCode(generated, existing, {
        position: "top",
      });

      expect(result).toContain("newEndpoint");
      expect(result).toContain("myHelper");
      expect(result).not.toContain("oldEndpoint");
      expect(result.indexOf("myHelper")).toBeLessThan(
        result.indexOf("newEndpoint")
      );
    });

    it("should preserve both top and bottom custom code", () => {
      const existing = `// ============================================================
// 🔒 CUSTOM CODE START
// ============================================================

export const topCustom = "top";

// ============================================================
// 🔒 CUSTOM CODE END
// ============================================================

export const oldEndpoint = "/api/old";

// ============================================================
// 🔒 CUSTOM CODE START
// ============================================================

export const bottomCustom = "bottom";

// ============================================================
// 🔒 CUSTOM CODE END
// ============================================================`;

      const generated = `export const newEndpoint = "/api/new";`;

      const result = mergeCustomCode(generated, existing, {
        position: "both",
      });

      expect(result).toContain("topCustom");
      expect(result).toContain("newEndpoint");
      expect(result).toContain("bottomCustom");
      expect(result).not.toContain("oldEndpoint");

      const topIndex = result.indexOf("topCustom");
      const newIndex = result.indexOf("newEndpoint");
      const bottomIndex = result.indexOf("bottomCustom");

      expect(topIndex).toBeLessThan(newIndex);
      expect(newIndex).toBeLessThan(bottomIndex);
    });

    it("should handle custom marker text", () => {
      const existing = `// 🔒 MY MARKER START
export const custom = "test";
// 🔒 MY MARKER END`;

      const generated = `export const new = "new";`;

      const result = mergeCustomCode(generated, existing, {
        markerText: "MY MARKER",
      });

      expect(result).toContain("custom");
      expect(result).toContain("new");
    });

    it("should create markers without instructions when configured", () => {
      const generated = `export const endpoint = "/api";`;

      const result = mergeCustomCode(generated, null, {
        includeInstructions: false,
      });

      expect(result).not.toContain("Add your custom code");
      expect(result).toContain("🔒 CUSTOM CODE START");
    });

    it("should preserve multiline custom code", () => {
      const existing = `// ============================================================
// 🔒 CUSTOM CODE START
// ============================================================

export const customFunction = () => {
  console.log("This is custom");
  return {
    test: true,
    value: 42
  };
};

export interface ICustomType {
  id: string;
  name: string;
}

// ============================================================
// 🔒 CUSTOM CODE END
// ============================================================`;

      const generated = `export const endpoint = "/api";`;

      const result = mergeCustomCode(generated, existing);

      expect(result).toContain("customFunction");
      expect(result).toContain("console.log");
      expect(result).toContain("ICustomType");
      expect(result).toContain("endpoint");
    });
  });
});
