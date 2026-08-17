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
//   npx openapi-sync init -y \
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
  process.stdout.write(JSON.stringify(data, null, 2) + "\n", () => {
    process.exit(exitCode);
  });
}

/**
 * Determine the exit code from a SyncResult or ValidationResult.
 */
function exitCodeFromResult(result) {
  if (result.success === false || result.valid === false) return 1;
  if (result.errors && result.errors.length > 0) return 1;
  return 0;
}

/**
 * Detect --json anywhere in argv (including before subcommand).
 */
function hasJsonFlag(argv = process.argv) {
  return argv.includes("--json");
}

/**
 * Write a structured CLI error and exit.
 */
function jsonErrorExit(code, message, extra = {}) {
  jsonExit(
    {
      success: false,
      error: {
        code,
        message,
        ...extra,
      },
    },
    1
  );
}

/**
 * Safely load openapi.sync configuration without writing files.
 */
function getLoadedConfig() {
  const path = require("path");
  const fs = require("fs");
  const cwd = process.cwd();
  const candidates = [
    path.join(cwd, "openapi.sync.js"),
    path.join(cwd, "openapi.sync.ts"),
    path.join(cwd, "openapi.sync.json"),
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) {
      try {
        if (c.endsWith(".json")) {
          return JSON.parse(fs.readFileSync(c, "utf-8"));
        }
        try {
          require("esbuild-register");
        } catch (_) {}
        const loaded = require(c);
        return loaded?.default || loaded;
      } catch (_) {}
    }
  }
  return null;
}

/**
 * Normalize array arguments that might be comma-separated or space-separated.
 */
function normalizeArrayArg(arg) {
  if (!arg) return undefined;
  const items = Array.isArray(arg) ? arg : [arg];
  const flattened = items
    .flatMap((item) => (typeof item === "string" ? item.split(",") : []))
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
  return flattened.length > 0 ? flattened : undefined;
}

/**
 * Compute the canonical list of client output files for a given client type
 * and API folder path. Used as a fallback in --dry-run when dryRunClientFiles
 * cannot be loaded (e.g. dist not built yet).
 *
 * @param {string} clientType - One of fetch | axios | react-query | swr | rtk-query
 * @param {string} apiFolderPath - Absolute path to the API output folder
 * @returns {string[]} Planned file paths
 */
function computePlannedFiles(clientType, apiFolderPath) {
  const path = require("path");
  switch (clientType) {
    case "rtk-query":
      return [path.join(apiFolderPath, "api.ts")];
    case "react-query":
    case "swr":
      return [
        path.join(apiFolderPath, "clients.ts"),
        path.join(apiFolderPath, "hooks.ts"),
      ];
    case "fetch":
    case "axios":
    default:
      return [path.join(apiFolderPath, "clients.ts")];
  }
}

// ── CLI definition ────────────────────────────────────────────────────────────

const cli = yargs(hideBin(process.argv))
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
        .option("interactive", {
          type: "boolean",
          default: true,
          description:
            "Run the interactive wizard (default). Use --no-interactive or -y to skip prompts.",
        })
        .option("yes", {
          alias: "y",
          type: "boolean",
          default: false,
          description: "Non-interactive mode (alias for --no-interactive).",
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
          "$0 init -y --api-name petstore --api-url https://petstore3.swagger.io/api/v3/openapi.json",
          "Non-interactive setup (agent use)"
        )
        .example(
          "$0 init -y --api-name myapi --api-url https://api.example.com/openapi.json --client-type react-query --validation-library zod --json",
          "Full non-interactive setup with JSON output"
        );
    },
    async (argv) => {
      const nonInteractive =
        argv.interactive === false || argv.y === true || argv.yes === true;

      if (nonInteractive) {
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
                "You must provide --api-url or --api-file when using non-interactive init.",
            },
          };
          if (argv.json) return jsonExit(err, 1);
          console.error(`❌ ${err.error.message}`);
          process.exit(1);
        }

        try {
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

          if (!result.success) {
            console.error(`❌ ${result.message}`);
            if (result.errors?.length) {
              result.errors.forEach((e) => console.error(`   ${e}`));
            }
            process.exit(1);
          }
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          if (argv.json) {
            return jsonErrorExit("INIT_FAILED", message);
          }
          console.error(`❌ ${message}`);
          process.exit(1);
        }
      } else {
        // ── Interactive wizard path (human use) ───────────────────────────
        try {
          await OpenApisync.InteractiveInit();
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          if (argv.json) {
            return jsonErrorExit("INIT_FAILED", message);
          }
          console.error(`❌ ${message}`);
          process.exit(1);
        }
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
      try {
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
      } catch (err) {
        const result = {
          success: false,
          error: {
            code: "ENDPOINT_NOT_FOUND",
            message: err.message,
          },
        };
        if (argv.json) return jsonExit(result, 1);
        console.error(`❌ ${err.message}`);
        process.exit(1);
      }
    }
  )

  // ── `read-type` command ──────────────────────────────────────────────────
  .command(
    "read-type",
    "Read one generated TypeScript interface or type declaration by name",
    (yargs) => {
      return yargs
        .option("api", {
          alias: "a",
          type: "string",
          description: "API name from your config",
          demandOption: true,
        })
        .option("type-name", {
          alias: "t",
          type: "string",
          description: "Exported interface or type name to read",
          demandOption: true,
        })
        .option("offset", {
          type: "number",
          description: "Starting line offset (0-indexed) for paginating large type definitions",
        })
        .option("max-lines", {
          alias: "limit",
          type: "number",
          description: "Maximum number of lines to return",
        })
        .example("$0 read-type --api petstore --type-name Pet --json", "Read the generated Pet type");
    },
    async (argv) => {
      try {
        const declaration = await OpenApisync.ReadGeneratedType({
          apiName: argv.api,
          typeName: argv["type-name"],
          offset: argv.offset,
          maxLines: argv["max-lines"] || argv.limit,
          silent: argv.silent || argv.json,
        });

        if (argv.json) {
          return jsonExit(
            {
              apiName: argv.api,
              typeName: argv["type-name"],
              declaration,
            },
            0
          );
        }

        console.log(declaration);
      } catch (err) {
        const result = {
          success: false,
          error: {
            code: "TYPE_NOT_FOUND",
            message: err.message,
          },
        };
        if (argv.json) return jsonExit(result, 1);
        console.error(`❌ ${err.message}`);
        process.exit(1);
      }
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
        // Dry-run: validate + estimate planned files based on actual config
        const silent = argv.silent || argv.json;
        const validation = await OpenApisync.ValidateConfig({ silent });
        const config = getLoadedConfig();
        const configuredFolder = config?.folder || "api";
        const path = require("path");
        const plannedFilesByApi = {};

        const isPython = Boolean(config?.python || config?.language === "python");
        const ext = isPython ? "py" : "ts";
        const isFolderSplit = Boolean(config?.folderSplit?.byTags);

        for (const [apiName, apiResult] of Object.entries(validation.apis)) {
          const apiFolderPath = path.join(process.cwd(), configuredFolder, apiName);
          const planned = [];

          if (isFolderSplit) {
            planned.push(path.join(apiFolderPath, `shared.${ext}`));
            planned.push(path.join(apiFolderPath, `endpoints.${ext}`));
          } else {
            planned.push(path.join(apiFolderPath, "types", `shared.${ext}`));
            planned.push(path.join(apiFolderPath, "types", `index.${ext}`));
            planned.push(path.join(apiFolderPath, `endpoints.${ext}`));
          }

          if (config?.validations && config.validations.disable !== true && !isPython) {
            planned.push(path.join(apiFolderPath, "validations.ts"));
          }
          plannedFilesByApi[apiName] = planned;
        }

        const allPlannedFiles = Object.values(plannedFilesByApi).flat();

        const dryRunResult = {
          dryRun: true,
          valid: validation.valid,
          plannedFiles: allPlannedFiles,
          fileCount: allPlannedFiles.length,
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
          console.log(`   Planned files (~${allPlannedFiles.length} spec files, excludes tag-split sub-files):`);
          allPlannedFiles.forEach((f) => console.log(`     ${f}`));
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
          description: "Filter endpoints by tags (e.g. --tags pet,user)",
        })
        .option("endpoints", {
          alias: "e",
          type: "array",
          description:
            "Filter endpoints by operationId, generated name, or path (e.g. --endpoints getPetById,PostPet or /pet/{petId})",
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
        .option("verbose", {
          type: "boolean",
          description: "In --dry-run mode, also include the full endpoint listing in output",
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
      const tags = normalizeArrayArg(argv.tags);
      const endpoints = normalizeArrayArg(argv.endpoints);

      if (argv["dry-run"]) {
        // —— Compact dry-run: show planned file paths without writing ——
        const silent = argv.silent || argv.json;
        const path = require("path");

        const validation = await OpenApisync.ValidateConfig({ silent });
        const config = getLoadedConfig();
        const configuredFolder = config?.folder || "api";

        // Build the planned file list per API
        const perApi = {};
        let totalFileCount = 0;
        let totalEndpointCount = 0;

        for (const [apiName, apiResult] of Object.entries(validation.apis)) {
          const endpointCount = apiResult.endpointCount || apiResult.operationCount || 0;
          totalEndpointCount += endpointCount;

          const basePath = path.join(process.cwd(), configuredFolder);
          const apiFolderPath = argv.output
            ? (path.isAbsolute(argv.output) ? argv.output : path.join(process.cwd(), argv.output))
            : (config?.clientGeneration?.outputDir
              ? (path.isAbsolute(config.clientGeneration.outputDir)
                  ? config.clientGeneration.outputDir
                  : path.join(process.cwd(), config.clientGeneration.outputDir))
              : path.join(basePath, apiName));

          const plannedFiles = computePlannedFiles(argv.type, apiFolderPath);

          perApi[apiName] = { endpointCount, plannedFiles };
          totalFileCount += plannedFiles.length;
        }

        let endpointsByApi = undefined;
        if (argv.verbose) {
          endpointsByApi = await OpenApisync.ListEndpoints({
            apiName: argv.api,
            tags,
            silent,
          });
        }

        let filteredEndpointCount = totalEndpointCount;
        if (tags?.length || endpoints?.length) {
          try {
            const allEndpointsMap = await OpenApisync.ListEndpoints({
              apiName: argv.api,
              tags,
              silent: true,
            });
            let matched = 0;
            for (const epList of Object.values(allEndpointsMap)) {
              if (endpoints && endpoints.length > 0) {
                const norm = (s) => (s || "").toLowerCase().replace(/[-_/\s]/g, "");
                const targetNorms = endpoints.map(norm);
                const targetLowers = endpoints.map((e) => e.toLowerCase());
                const matchingEps = epList.filter((e) => {
                  return (
                    endpoints.includes(e.name) ||
                    endpoints.includes(e.operationId) ||
                    endpoints.includes(e.path) ||
                    targetLowers.includes(e.name.toLowerCase()) ||
                    targetLowers.includes((e.operationId || "").toLowerCase()) ||
                    targetLowers.includes(e.path.toLowerCase()) ||
                    targetNorms.includes(norm(e.name)) ||
                    targetNorms.includes(norm(e.operationId)) ||
                    targetNorms.includes(norm(e.path))
                  );
                });
                matched += matchingEps.length;
              } else {
                matched += epList.length;
              }
            }
            filteredEndpointCount = matched;
          } catch (_) {}
        }

        const dryRunResult = {
          dryRun: true,
          type: argv.type,
          plannedFiles: Object.values(perApi).flatMap((a) => a.plannedFiles),
          fileCount: totalFileCount,
          endpointCount: (tags?.length || endpoints?.length) ? filteredEndpointCount : totalEndpointCount,
          totalEndpointCount,
          filteredEndpointCount,
          warnings: [],
          message: validation.valid
            ? `Would generate a ${argv.type} client. Run without --dry-run to write files.`
            : "Validation failed. Fix errors before generating client.",
          ...(argv.verbose ? { endpoints: endpointsByApi } : {}),
        };

        if (!validation.valid) {
          if (argv.json) return jsonExit({ ...dryRunResult, success: false, errors: validation.configErrors }, 1);
          console.error(`\n❌ Validation failed. Fix errors before generating client.\n`);
          process.exit(1);
        }

        if (argv.json) return jsonExit(dryRunResult, 0);
        console.log(`\n✅ Dry run: would generate ${argv.type} client.`);
        console.log(`   Planned files (${totalFileCount}):`);
        dryRunResult.plannedFiles.forEach((f) => console.log(`     ${f}`));
        for (const [api, info] of Object.entries(perApi)) {
          console.log(`   ${api}: ${info.endpointCount} endpoints`);
        }
        return;
      }

      // Sync + generate client
      const silent = argv.silent || argv.json;
      const result = await OpenApisync.GenerateClient({
        type: argv.type,
        apiName: argv.api,
        tags,
        endpoints,
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

  // ── `doctor` command ───────────────────────────────────────────────────────
  .command(
    "doctor",
    "Run diagnostic health check on config, specs, peer dependencies, cache, and directory permissions",
    () => {},
    async (argv) => {
      const silent = argv.silent || argv.json;
      const result = await OpenApisync.Doctor({ silent });

      if (argv.json) {
        return jsonExit(result, result.healthy ? 0 : 1);
      }

      process.exit(result.healthy ? 0 : 1);
    }
  )

  .example("$0 init", "Interactive setup wizard (human)")
  .example(
    "$0 init -y --api-name petstore --api-url https://petstore3.swagger.io/api/v3/openapi.json",
    "Non-interactive init (agent)"
  )
  .example("$0 validate --json", "Validate config + specs (no file writes)")
  .example("$0 doctor --json", "Run diagnostic health checks")
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
  .fail((msg, err, yargsInstance) => {
    const message = err?.message || msg;
    if (hasJsonFlag()) {
      jsonErrorExit("CLI_PARSE_ERROR", message);
    }
    if (err) {
      console.error(err.message || err);
    } else {
      console.error(message);
    }
    console.error(yargsInstance.help());
    process.exit(1);
  })
  .strict();

cli.parse();
