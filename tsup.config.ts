import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["index.ts"],
  format: ["cjs", "esm"],
  dts: true,
  clean: true,
  external: [
    "axios",
    "axios-retry",
    "@apidevtools/swagger-parser",
    "js-yaml",
    "yargs",
    "esbuild-register",
    "curl-generator",
    "fs",
    "path",
  ],
  minify: process.env.ANALYZE ? false : true, // Disable minification for analysis
  sourcemap: false, // Disabled - source maps not needed for consumers (saves ~180KB)
  treeshake: true,
  esbuildOptions(options) {
    // Remove pure function calls
    options.pure = [
      "console.log",
      "console.warn",
      // "console.error",
      // "console.info",
      "console.debug",
    ];
  },
});
