#!/usr/bin/env node

// ──────────────────────────────────────────────────────────────────────────────
// openapi-sync CLI
//
// AGENT USAGE GUIDE
// -----------------
// All commands support `--json` for machine-readable stdout and `--silent` to
// suppress progress logs. Exit codes: 0 = success, 1 = config error,
// 2 = network/spec error, 3 = generation error.
//
// Non-interactive init (no prompts, safe for agents):
//   npx openapi-sync init --no-interactive \
//     --api-name petstore \
//     --api-url https://petstore3.swagger.io/api/v3/openapi.json \
//     --output-folder ./src/api \
//     --client-type react-query \
//     --validation-library zod \
//     --config-format typescript
//
// Validate config and specs without writing files:
//   npx openapi-sync validate --json
//
// List all endpoints:
//   npx openapi-sync list-endpoints --json
//
// Sync (generate types + endpoints + validation schemas):
//   npx openapi-sync --json
//
// Generate a typed API client:
//   npx openapi-sync generate-client --type react-query --json
// ──────────────────────────────────────────────────────────────────────────────

const OpenApisync = require("../dist/index");

const yargs = require("yargs/yargs");
const { hideBin } = require("yargs/helpers");

// ── Output helpers ───────────────────────────────────────────────────────────

/**
 * Write a JSON result to stdout and exit with the appropriate code.
 * Used when --json flag is present.
 */
function jsonExit(data, exitCode = 0) {
  process.stdout.write(JSON.stringify(data, null, 2) + "\n");
  process.exit(exitCode);
}

/**
 * Determine the exit code from a SyncResult or ValidationResult.
 */
function exitCodeFromResult(result) {
  if (result.success === false || result.valid === false) return 1;
  if (result.errors && result.errors.length > 0) return 1;
  return 0;
}

// ── CLI definition ────────────────────────────────────────────────────────────

yargs(hideBin(process.argv))
  // ── Global flags ──────────────────────────────────────────────────────────
  .option("json", {
    type: "boolean",
    global: true,
    description:
      "Emit a single JSON object to stdout instead of human-readable logs. " +
      "Use this when calling from scripts or AI agents.",
    default: false,
  })
  .option("silent", {
    type: "boolean",
    global: true,
    description: "Suppress all console output (implied by --json).",
    default: false,
  })

  // ── `init` command ─────────────────────────────────────────────────────────
  .command(
    "init",
    "Create an openapi.sync config file (interactive or non-interactive)",
    (yargs) => {
      return yargs
        .option("no-interactive", {
          alias: "y",
          type: "boolean",
          description:
            "Skip all prompts and create config from flags + defaults. " +
            "Use this from scripts or AI agents.",
          default: false,
        })
        // All wizard fields available as flags so agents can pass everything:
        .option("api-name", {
          type: "string",
          description: "Name for this API (e.g. petstore)",
        })
        .option("api-url", {
          type: "string",
          description: "URL to the OpenAPI spec (JSON or YAML)",
        })
        .option("api-file", {
          type: "string",
          description: "Path to a local OpenAPI spec file",
        })
        .option("output-folder", {
          type: "string",
          description: "Output folder for generated files",
          default: "./src/api",
        })
        .option("config-format", {
          type: "string",
          choices: ["typescript", "json", "javascript"],
          description: "Config file format",
          default: "typescript",
        })
        .option("client-type", {
          type: "string",
          choices: ["react-query", "swr", "fetch", "axios", "rtk-query"],
          description: "API client type to generate",
        })
        .option("validation-library", {
          type: "string",
          choices: ["zod", "yup", "joi"],
          description: "Runtime validation library",
        })
        .option("folder-split", {
          type: "boolean",
          description: "Organize generated code into folders by OpenAPI tags",
          default: false,
        })
        .option("types-prefix", {
          type: "string",
          description: "Prefix for generated TypeScript interface names",
          default: "I",
        })
        .option("use-operation-id", {
          type: "boolean",
          description: "Use operationId from spec for type/function names",
          default: true,
        })
        .option("exclude-tags", {
          type: "string",
          description: "Comma-separated tags to exclude (e.g. deprecated,internal)",
        })
        .option("show-curl", {
          type: "boolean",
          description: "Include cURL examples in generated docs",
          default: true,
        })
        .option("refetch-interval", {
          type: "number",
          description: "Auto-refetch interval in ms (0 to disable)",
          default: 0,
        })
        .option("run-sync", {
          type: "boolean",
          description: "Run initial sync after creating config",
          default: false,
        })
        .example(
          "$0 init",
          "Interactive wizard (human use)"
        )
        .example(
          "$0 init --no-interactive --api-name petstore --api-url https://petstore3.swagger.io/api/v3/openapi.json",
          "Non-interactive setup (agent use)"
        )
        .example(
          "$0 init --no-interactive --api-name myapi --api-url https://api.example.com/openapi.json --client-type react-query --validation-library zod --json",
          "Full non-interactive setup with JSON output"
        );
    },
    async (argv) => {
      const noInteractive = argv["no-interactive"] || argv.y;

      if (noInteractive) {
        // ── Non-interactive path (agent-safe) ─────────────────────────────
        const silent = argv.silent || argv.json;

        const apiName = argv["api-name"] || "myapi";
        const apiSource = argv["api-url"] || argv["api-file"];

        if (!apiSource) {
          const err = {
            success: false,
            error: {
              code: "CONFIG_INVALID",
              message:
                "You must provide --api-url or --api-file when using --no-interactive.",
            },
          };
          if (argv.json) return jsonExit(err, 1);
          console.error(`❌ ${err.error.message}`);
          process.exit(1);
        }

        const { nonInteractiveInit } = require("../dist/Openapi-sync/interactive-init");

        const result = await nonInteractiveInit({
          apiName,
          apiSource,
          outputFolder: argv["output-folder"],
          configFormat: argv["config-format"],
          clientType: argv["client-type"],
          validationLibrary: argv["validation-library"],
          folderSplit: argv["folder-split"],
          typesPrefix: argv["types-prefix"],
          useOperationId: argv["use-operation-id"],
          excludeTags: argv["exclude-tags"]
            ? argv["exclude-tags"].split(",").map((t) => t.trim())
            : [],
          showCurl: argv["show-curl"],
          refetchInterval: argv["refetch-interval"] || undefined,
          runSync: argv["run-sync"],
          silent,
        });

        if (argv.json) {
          return jsonExit(result, result.success ? 0 : 1);
        }
      } else {
        // ── Interactive wizard path (human use) ───────────────────────────
        await OpenApisync.InteractiveInit();
      }
    }
  )

  // ── `validate` command ─────────────────────────────────────────────────────
  .command(
    "validate",
    "Validate the config file and all API specs without writing any files. " +
    "Safe to run repeatedly — no side effects.",
    () => { },
    async (argv) => {
      const silent = argv.silent || argv.json;

      const result = await OpenApisync.ValidateConfig({ silent });

      if (argv.json) {
        return jsonExit(result, result.valid ? 0 : 1);
      }

      process.exit(result.valid ? 0 : 1);
    }
  )

  // ── `list-endpoints` command ───────────────────────────────────────────────
  .command(
    "list-endpoints",
    "List all endpoints discovered from your OpenAPI specs. No files are written.",
    (yargs) => {
      return yargs
        .option("api", {
          alias: "a",
          type: "string",
          description: "Limit to a specific API from your config",
        })
        .option("tags", {
          type: "string",
          description: "Comma-separated tags to filter by",
        })
        .option("limit", {
          type: "number",
          description: "Maximum number of endpoints to return",
        })
        .option("offset", {
          type: "number",
          description: "Number of endpoints to skip before returning results",
        })
        .option("path-contains", {
          type: "string",
          description: "Only include endpoints whose path contains this substring",
        })
        .option("use-cache", {
          type: "boolean",
          description: "Reuse previously stored endpoints when available",
          default: false,
        })
        .example("$0 list-endpoints --json", "List all endpoints as JSON")
        .example(
          "$0 list-endpoints --api petstore --tags pet --json",
          "List pet-tagged endpoints for petstore"
        );
    },
    async (argv) => {
      const silent = argv.silent || argv.json;
      const tags = argv.tags
        ? argv.tags.split(",").map((t) => t.trim())
        : undefined;

      const result = await OpenApisync.ListEndpoints({
        apiName: argv.api,
        tags,
        limit: argv.limit,
        offset: argv.offset,
        pathContains: argv["path-contains"],
        useCache: argv["use-cache"],
        silent,
      });

      if (argv.json) {
        return jsonExit(result, 0);
      }

      // Human-readable output
      for (const [api, endpoints] of Object.entries(result)) {
        console.log(`\n📋 ${api} (${endpoints.length} endpoints)`);
        for (const ep of endpoints) {
          const tags = ep.tags?.length ? `  [${ep.tags.join(", ")}]` : "";
          console.log(`  ${ep.method.padEnd(7)} ${ep.path}${tags}`);
          if (ep.summary) console.log(`           ${ep.summary}`);
        }
      }
    }
  )

  // ── `get-endpoint` command ───────────────────────────────────────────────
  .command(
    "get-endpoint",
    "Fetch the full stored details for a single endpoint by operationId or name",
    (yargs) => {
      return yargs
        .option("operation-id", {
          type: "string",
          description: "OperationId of the endpoint to inspect",
        })
        .option("name", {
          type: "string",
          description: "Endpoint name to inspect",
        })
        .option("api", {
          alias: "a",
          type: "string",
          description: "Restrict the lookup to a specific API",
        })
        .example("$0 get-endpoint --operation-id getPetById", "Inspect one endpoint by operationId");
    },
    async (argv) => {
      const result = await OpenApisync.GetEndpointDetails({
        apiName: argv.api,
        operationId: argv["operation-id"],
        name: argv.name,
        silent: argv.silent || argv.json,
      });

      if (argv.json) {
        return jsonExit(result, 0);
      }

      console.log(JSON.stringify(result, null, 2));
    }
  )

  // ── `sync` / default command ───────────────────────────────────────────────
  .command(
    ["$0", "sync"],
    "Sync OpenAPI specifications and generate types, endpoints, and validation schemas",
    (yargs) => {
      return yargs
        .option("refreshinterval", {
          alias: "ri",
          type: "number",
          description: "Interval in ms to auto-refetch specifications",
        })
        .option("dry-run", {
          type: "boolean",
          description:
            "Show what files would be written without actually writing them",
          default: false,
        })
        .example("$0", "Sync all APIs")
        .example("$0 --json", "Sync and emit JSON result")
        .example("$0 --dry-run --json", "Preview what would be written");
    },
    async (argv) => {
      if (argv["dry-run"]) {
        // Dry-run: validate first to count endpoints, then report what would be written
        const silent = argv.silent || argv.json;
        const validation = await OpenApisync.ValidateConfig({ silent });

        const dryRunResult = {
          dryRun: true,
          valid: validation.valid,
          apis: validation.apis,
          message: validation.valid
            ? "Dry run complete. Run without --dry-run to write files."
            : "Validation failed. Fix errors before syncing.",
        };

        if (argv.json) {
          return jsonExit(dryRunResult, validation.valid ? 0 : 1);
        }

        if (validation.valid) {
          console.log("\n✅ Dry run: config and specs are valid.");
          console.log("   Run without --dry-run to write files.\n");
        } else {
          console.error("\n❌ Dry run: validation failed — see errors above.\n");
          process.exit(1);
        }
        return;
      }

      const silent = argv.silent || argv.json;
      const result = await OpenApisync.Init({
        refetchInterval: argv.refreshinterval,
        silent,
      });

      if (argv.json) {
        return jsonExit(result, exitCodeFromResult(result));
      }

      if (!result.success) process.exit(1);
    }
  )

  // ── `generate-client` command ──────────────────────────────────────────────
  .command(
    "generate-client",
    "Generate a type-safe API client from your OpenAPI specs",
    (yargs) => {
      return yargs
        .option("type", {
          alias: "t",
          type: "string",
          description: "Client type to generate",
          choices: ["fetch", "axios", "react-query", "swr", "rtk-query"],
          demandOption: true,
        })
        .option("api", {
          alias: "a",
          type: "string",
          description:
            "API name from config (generates for all APIs if not specified)",
        })
        .option("tags", {
          type: "array",
          description: "Filter endpoints by tags",
        })
        .option("endpoints", {
          alias: "e",
          type: "array",
          description: "Filter by specific endpoint names",
        })
        .option("output", {
          alias: "o",
          type: "string",
          description: "Output directory for generated client",
        })
        .option("base-url", {
          alias: "b",
          type: "string",
          description: "Base URL for API requests",
        })
        .option("use-cache", {
          type: "boolean",
          description: "Reuse cached endpoints when available instead of reloading specs",
          default: false,
        })
        .option("dry-run", {
          type: "boolean",
          description: "Show what files would be written without writing them",
          default: false,
        })
        .example(
          "$0 generate-client --type fetch --json",
          "Generate fetch client and emit JSON result"
        )
        .example(
          "$0 generate-client --type react-query --api petstore",
          "Generate React Query hooks for petstore"
        )
        .example(
          "$0 generate-client --type axios --tags pets,users",
          "Generate axios client filtered by tags"
        )
        .example(
          "$0 generate-client --type swr --endpoints getPetById,createPet",
          "Generate SWR hooks for specific endpoints"
        );
    },
    async (argv) => {
      if (argv["dry-run"]) {
        // Validate and list what would be generated
        const silent = argv.silent || argv.json;
        const endpoints = await OpenApisync.ListEndpoints({
          apiName: argv.api,
          tags: argv.tags,
          silent,
        });
        const dryRunResult = {
          dryRun: true,
          type: argv.type,
          apis: endpoints,
          message: `Would generate a ${argv.type} client. Run without --dry-run to write files.`,
        };
        if (argv.json) return jsonExit(dryRunResult, 0);
        console.log(`\n✅ Dry run: would generate ${argv.type} client.`);
        for (const [api, eps] of Object.entries(endpoints)) {
          console.log(`   ${api}: ${eps.length} endpoints`);
        }
        return;
      }

      // First sync to get fresh types
      const silent = argv.silent || argv.json;
      const silent2 = silent;
      await OpenApisync.Init({ silent: silent2 });

      const result = await OpenApisync.GenerateClient({
        type: argv.type,
        apiName: argv.api,
        tags: argv.tags,
        endpoints: argv.endpoints,
        outputDir: argv.output,
        baseURL: argv["base-url"],
        useCache: argv["use-cache"],
        silent,
      });

      if (argv.json) {
        return jsonExit(result, exitCodeFromResult(result));
      }

      if (!result.success) process.exit(1);
    }
  )

  .example("$0 init", "Interactive setup wizard (human)")
  .example(
    "$0 init --no-interactive --api-name petstore --api-url https://petstore3.swagger.io/api/v3/openapi.json",
    "Non-interactive init (agent)"
  )
  .example("$0 validate --json", "Validate config + specs (no file writes)")
  .example("$0 list-endpoints --json", "List all endpoints as JSON")
  .example("$0 --json", "Sync and get JSON result")
  .example(
    "$0 generate-client --type react-query --json",
    "Generate React Query hooks with JSON output"
  )
  .help()
  .alias("help", "h")
  .version()
  .alias("version", "v")
  .demandCommand(1, "You need to specify a command")
  .strict().argv;
