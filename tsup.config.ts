import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["index.ts", "helpers.ts", "regex.ts"],
  format: ["cjs", "esm"],
  dts: true,
  clean: true,
  minify: true,
  esbuildOptions(options) {
    // Remove pure option that's causing issues
    // options.pure = [
    //   "console.log",
    //   "console.warn",
    //   "console.error",
    //   "console.info",
    //   "console.debug",
    // ];
  },
});
