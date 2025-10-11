import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["index.ts"],
  format: ["cjs", "esm"],
  dts: true,
  clean: true,
  minify: process.env.ANALYZE ? false : true, // Disable minification for analysis
  sourcemap: false, // Disabled - source maps not needed for consumers (saves ~180KB)
  treeshake: true,
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
