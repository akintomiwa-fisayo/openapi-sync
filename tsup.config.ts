import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["index.ts", "mcp/server.ts", "Openapi-sync/interactive-init.ts"],
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
    "@modelcontextprotocol/sdk",
    "zod",
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
