import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["index.ts"],
  format: ["cjs", "esm"],
  dts: true,
  clean: true,
  minify: true,
  esbuildOptions(options) {
    options.pure = [
      "console.log",
      "console.warn",
      "console.error",
      "console.info",
      "console.debug",
    ];
  },
});
