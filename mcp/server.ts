#!/usr/bin/env node

/**
 * @fileoverview openapi-sync MCP Server
 *
 * Exposes openapi-sync operations as Model Context Protocol (MCP) tools so that
 * AI agents (Claude Desktop, Cursor, Copilot, etc.) can call them directly as
 * structured tool invocations — no CLI parsing required.
 *
 * ## Starting the server
 *
 * ```bash
 * # Via npx (recommended for Claude Desktop / Cursor config)
 * npx openapi-sync-mcp
 *
 * # Or install globally
 * npm install -g openapi-sync
 * openapi-sync-mcp
 * ```
 *
 * ## Claude Desktop config (`~/Library/Application Support/Claude/claude_desktop_config.json`)
 *
 * ```json
 * {
 *   "mcpServers": {
 *     "openapi-sync": {
 *       "command": "npx",
 *       "args": ["-y", "openapi-sync-mcp"],
 *       "cwd": "/path/to/your/project"
 *     }
 *   }
 * }
 * ```
 *
 * ## Cursor config (`.cursor/mcp.json` in project root)
 *
 * ```json
 * {
 *   "mcpServers": {
 *     "openapi-sync": {
 *       "command": "npx",
 *       "args": ["-y", "openapi-sync-mcp"],
 *       "cwd": "${workspaceFolder}"
 *     }
 *   }
 * }
 * ```
 *
 * ## Available tools
 *
 * | Tool | Description |
 * |------|-------------|
 * | `openapi_sync_init` | Create openapi.sync config (non-interactive, with auth & runSync) |
 * | `openapi_sync_validate` | Validate config + specs without writing files |
 * | `openapi_sync_doctor` | Run diagnostic health checks |
 * | `openapi_sync_list_endpoints` | List all endpoints from configured specs |
 * | `openapi_sync_get_endpoint_details` | Get full details for an endpoint by operationId or name |
 * | `openapi_sync_read_generated_type` | Read exact generated TypeScript interface or type |
 * | `openapi_sync_sync` | Run full sync (generate types, endpoints, schemas) |
 * | `openapi_sync_generate_client` | Generate a typed API client (fetch, axios, react-query, swr, rtk-query, next-fetch) |
 * | `openapi_sync_purge` | Detect and remove stale generated files (supports dryRun and yes) |
 * | `openapi_sync_read_config` | Read the current config file contents |
 *
 * @module openapi-sync-mcp
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import {
  Init,
  GenerateClient,
  ValidateConfig,
  ListEndpoints,
  GetEndpointDetails,
  ReadGeneratedType,
  Doctor,
  Purge,
  tryLoadConfig,
  extractCliAuthFromArgv,
} from "../index.js";
import { nonInteractiveInit } from "../Openapi-sync/interactive-init.js";
import path from "path";
import fs from "fs";

// ─────────────────────────────────────────────────────────────────────────────
// IMPORTANT: When using stdio transport, NEVER write to stdout.
// All debug/info logging must go to stderr only.
// ─────────────────────────────────────────────────────────────────────────────
const log = (...args: any[]) => process.stderr.write(args.join(" ") + "\n");

const cwd = process.cwd();

// ─────────────────────────────────────────────────────────────────────────────
let packageVersion = "6.4.0";
try {
  const candidates: string[] = [];
  if (process.argv && process.argv[1]) {
    candidates.push(path.resolve(path.dirname(process.argv[1]), "../package.json"));
  }
  candidates.push(path.resolve(process.cwd(), "package.json"));
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      const parsed = JSON.parse(fs.readFileSync(candidate, "utf-8"));
      if (parsed.name === "openapi-sync" && parsed.version) {
        packageVersion = parsed.version;
        break;
      }
    }
  }
} catch (_) {}

// Check CLI flags before connecting stdio transport
const cliArgs = process.argv.slice(2);
if (cliArgs.includes("--help") || cliArgs.includes("-h")) {
  process.stdout.write(
    `openapi-sync MCP Server\n\nUsage: npx openapi-sync-mcp\n\nRuns an MCP server over stdio for AI agent workflows.\n\nAvailable tools:\n  openapi_sync_init                 Create openapi.sync config (non-interactive, with auth)\n  openapi_sync_validate             Validate config and specs without writing files\n  openapi_sync_doctor               Run diagnostic health checks\n  openapi_sync_list_endpoints       List endpoints from configured specs\n  openapi_sync_get_endpoint_details Get full endpoint details by operationId or name\n  openapi_sync_read_generated_type  Read generated TypeScript interface or type\n  openapi_sync_sync                 Run full sync (types, endpoints, schemas)\n  openapi_sync_generate_client      Generate typed client (fetch, axios, react-query, swr, rtk-query, next-fetch)\n  openapi_sync_read_config          Read current openapi.sync config file\n  openapi_sync_purge                Purge stale generated files (supports dryRun and yes)\n`,
  );
  process.exit(0);
}
if (cliArgs.includes("--version") || cliArgs.includes("-v")) {
  process.stdout.write(`${packageVersion}\n`);
  process.exit(0);
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared schemas & helpers for CLI argument parity
// ─────────────────────────────────────────────────────────────────────────────

const authZodSchema = {
  authType: z
    .enum(["bearer", "basic", "apiKey", "custom"])
    .optional()
    .describe("Spec authentication type (bearer, basic, apiKey, custom)."),
  authToken: z
    .string()
    .optional()
    .describe("Bearer token or password value / env var reference for auth."),
  authUsername: z.string().optional().describe("Username for basic auth."),
  authPassword: z.string().optional().describe("Password for basic auth."),
  authName: z
    .string()
    .optional()
    .describe("API key header or query param name (default: X-API-Key)."),
  authValue: z.string().optional().describe("API key secret value."),
  authIn: z
    .enum(["header", "query"])
    .optional()
    .describe("API key location: header or query (used with authType: apiKey)."),
  authHeader: z
    .string()
    .optional()
    .describe("Custom header in 'Key: Value' format (used with authType: custom)."),
};

const cliConfigOverridesZodSchema = {
  ...authZodSchema,
  apiUrl: z
    .string()
    .optional()
    .describe("Direct URL to OpenAPI specification (JSON or YAML)."),
  apiFile: z
    .string()
    .optional()
    .describe("Direct local file path to OpenAPI specification."),
  apiName: z
    .string()
    .optional()
    .describe("Name for the API (default: 'api')."),
  api: z
    .string()
    .optional()
    .describe("API specification source (<name>=<url>, direct URL, or name to filter)."),
  folder: z
    .string()
    .optional()
    .describe("Output directory for generated files (default: '' project root)."),
  outputFolder: z
    .string()
    .optional()
    .describe("Alias for folder."),
  preset: z
    .enum([
      "react-query-zod",
      "react-query-yup",
      "swr-zod",
      "swr-yup",
      "axios-zod",
      "axios-joi",
      "fetch-zod",
      "rtk-query-zod",
      "next-fetch",
      "python-basic",
    ])
    .optional()
    .describe("Named preset to apply automatically."),
  language: z
    .enum(["typescript", "python"])
    .optional()
    .describe("Target programming language."),
  server: z
    .string()
    .optional()
    .describe("Default server index or base URL override."),
  configJson: z
    .string()
    .optional()
    .describe("Raw JSON string defining an openapi-sync configuration."),
};

function buildCliArgsAndAuth(params: Record<string, any>) {
  const cliArgs: Record<string, any> = {};
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined) {
      cliArgs[k] = v;
      const kebab = k.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);
      cliArgs[kebab] = v;
    }
  }
  const auth = extractCliAuthFromArgv(cliArgs);
  return { cliArgs, auth };
}

function computePlannedFiles(clientType: string, apiFolderPath: string): string[] {
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
    case "next-fetch":
    case "axios":
    default:
      return [path.join(apiFolderPath, "clients.ts")];
  }
}

const server = new McpServer({
  name: "openapi-sync",
  version: packageVersion,
});

// ─────────────────────────────────────────────────────────────────────────────
// Tool: openapi_sync_validate
// ─────────────────────────────────────────────────────────────────────────────

server.tool(
  "openapi_sync_validate",
  "Validate the openapi-sync config file and all configured API specs without " +
    "writing any files to disk. Use this as a pre-flight check before syncing. " +
    "Returns a structured result with per-API validity and endpoint counts.",
  {
    ...cliConfigOverridesZodSchema,
  },
  async (params) => {
    log("[openapi-sync-mcp] Running validate...");
    try {
      const { cliArgs, auth } = buildCliArgsAndAuth(params);
      const result = await ValidateConfig({ silent: true, auth, cliArgs });
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    } catch (err: any) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              valid: false,
              configErrors: [err.message],
              apis: {},
            }),
          },
        ],
        isError: true,
      };
    }
  },
);

// ─────────────────────────────────────────────────────────────────────────────
// Tool: openapi_sync_list_endpoints
// ─────────────────────────────────────────────────────────────────────────────

server.tool(
  "openapi_sync_list_endpoints",
  "Fetch and parse all configured OpenAPI specs, then return a structured list " +
    "of every endpoint (name, HTTP method, path, tags, summary). No files are written. " +
    "Use this to understand the API surface before deciding on a client type or tag filters.",
  {
    tags: z
      .array(z.string())
      .optional()
      .describe(
        "Filter endpoints to only those with one of these OpenAPI tags.",
      ),
    limit: z
      .number()
      .int()
      .optional()
      .describe("Return at most this many endpoints."),
    offset: z
      .number()
      .int()
      .optional()
      .describe("Skip this many endpoints before returning results."),
    pathContains: z
      .string()
      .optional()
      .describe("Only include endpoints whose path contains this substring."),
    useCache: z
      .boolean()
      .optional()
      .describe(
        "Reuse previously stored endpoints instead of reloading the spec.",
      ),
    ...cliConfigOverridesZodSchema,
  },
  async (params) => {
    log("[openapi-sync-mcp] Listing endpoints...");
    try {
      const { cliArgs, auth } = buildCliArgsAndAuth(params);
      const result = await ListEndpoints({
        apiName: params.apiName,
        tags: params.tags,
        limit: params.limit,
        offset: params.offset,
        pathContains: params.pathContains,
        useCache: params.useCache ?? true,
        silent: true,
        auth,
        cliArgs,
      });
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    } catch (err: any) {
      return {
        content: [{ type: "text", text: `Error: ${err.message}` }],
        isError: true,
      };
    }
  },
);

// ─────────────────────────────────────────────────────────────────────────────
// Tool: openapi_sync_sync
// ─────────────────────────────────────────────────────────────────────────────

server.tool(
  "openapi_sync_sync",
  "Run a full openapi-sync — fetches all configured OpenAPI specs and writes " +
    "TypeScript types, endpoint builder functions, and optional validation schemas " +
    "(Zod/Yup/Joi) to disk. Returns a SyncResult with the list of files written " +
    "and any errors. Run this after validating your config.",
  {
    refetchInterval: z
      .number()
      .optional()
      .describe(
        "Auto-refetch interval in ms. Omit unless you want a long-lived process timer; not for one-shot agent calls.",
      ),
    ...cliConfigOverridesZodSchema,
  },
  async (params) => {
    log("[openapi-sync-mcp] Running sync...");
    try {
      const { cliArgs, auth } = buildCliArgsAndAuth(params);
      const result = await Init({
        refetchInterval: params.refetchInterval,
        silent: true,
        auth,
        cliArgs,
        apiName: params.apiName,
      });
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2),
          },
        ],
        isError: !result.success,
      };
    } catch (err: any) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              success: false,
              apis: [],
              filesWritten: [],
              endpointCount: 0,
              warnings: [],
              errors: [err.message],
            }),
          },
        ],
        isError: true,
      };
    }
  },
);

// ─────────────────────────────────────────────────────────────────────────────
// Tool: openapi_sync_get_endpoint_details
// ─────────────────────────────────────────────────────────────────────────────

server.tool(
  "openapi_sync_get_endpoint_details",
  "Return the full stored endpoint details for one specific endpoint by operationId or name.",
  {
    operationId: z
      .string()
      .optional()
      .describe("The operationId of the endpoint to look up."),
    name: z.string().optional().describe("The endpoint name to look up."),
    ...cliConfigOverridesZodSchema,
  },
  async (params) => {
    log("[openapi-sync-mcp] Fetching endpoint details...");
    try {
      const { cliArgs, auth } = buildCliArgsAndAuth(params);
      const result = await GetEndpointDetails({
        apiName: params.apiName,
        operationId: params.operationId,
        name: params.name,
        silent: true,
        auth,
        cliArgs,
      });
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    } catch (err: any) {
      return {
        content: [{ type: "text", text: `Error: ${err.message}` }],
        isError: true,
      };
    }
  },
);

// ─────────────────────────────────────────────────────────────────────────────
// Tool: openapi_sync_read_generated_type
// ─────────────────────────────────────────────────────────────────────────────

server.tool(
  "openapi_sync_read_generated_type",
  "Read the exact generated TypeScript interface or type declaration from the generated types file. Supports optional pagination for large types.",
  {
    typeName: z
      .string()
      .describe("The exported interface or type name to read."),
    offset: z
      .number()
      .optional()
      .describe(
        "Starting line offset (0-indexed) for paginating large type definitions.",
      ),
    maxLines: z
      .number()
      .optional()
      .describe("Maximum number of lines to return."),
    ...cliConfigOverridesZodSchema,
  },
  async (params) => {
    log("[openapi-sync-mcp] Reading generated type...");
    try {
      const { cliArgs } = buildCliArgsAndAuth(params);
      const result = await ReadGeneratedType({
        apiName: params.apiName,
        typeName: params.typeName,
        offset: params.offset,
        maxLines: params.maxLines,
        silent: true,
        cliArgs,
      });
      return {
        content: [
          {
            type: "text",
            text: result,
          },
        ],
      };
    } catch (err: any) {
      return {
        content: [{ type: "text", text: `Error: ${err.message}` }],
        isError: true,
      };
    }
  },
);

// ─────────────────────────────────────────────────────────────────────────────
// Tool: openapi_sync_doctor
// ─────────────────────────────────────────────────────────────────────────────

server.tool(
  "openapi_sync_doctor",
  "Run diagnostic health checks on openapi.sync configuration, API specs, peer dependencies, cache, and folder permissions. Returns structured health report and actionable recommendations.",
  {
    ...cliConfigOverridesZodSchema,
  },
  async (params) => {
    log("[openapi-sync-mcp] Running diagnostic health check...");
    try {
      const { cliArgs, auth } = buildCliArgsAndAuth(params);
      const result = await Doctor({ silent: true, auth, cliArgs });
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    } catch (err: any) {
      return {
        content: [{ type: "text", text: `Error: ${err.message}` }],
        isError: true,
      };
    }
  },
);

// ─────────────────────────────────────────────────────────────────────────────
// Tool: openapi_sync_generate_client
// ─────────────────────────────────────────────────────────────────────────────

server.tool(
  "openapi_sync_generate_client",
  "Generate a fully-typed API client for one or all configured APIs. " +
    "Supports: fetch, axios, react-query, swr, rtk-query, next-fetch. " +
    "Syncs the latest spec first, then writes client files to disk (unless dryRun: true). " +
    "Returns a SyncResult with the list of files written.",
  {
    type: z
      .enum(["fetch", "axios", "react-query", "swr", "rtk-query", "next-fetch"])
      .describe("The type of API client to generate."),
    baseURL: z
      .string()
      .optional()
      .describe(
        "Base URL to bake into the generated client (e.g. https://api.example.com). " +
          "Can be overridden at runtime in the generated code.",
      ),
    baseUrl: z
      .string()
      .optional()
      .describe("Alias for baseURL."),
    output: z
      .string()
      .optional()
      .describe("Output directory for generated client."),
    outputDir: z
      .string()
      .optional()
      .describe("Custom output directory for the generated client files (alias for output)."),
    tags: z
      .array(z.string())
      .optional()
      .describe("Only generate client methods for endpoints with these tags."),
    endpoints: z
      .array(z.string())
      .optional()
      .describe(
        "Only generate client methods for these specific endpoint names / operationIds.",
      ),
    useCache: z
      .boolean()
      .optional()
      .describe(
        "Reuse cached endpoints when available instead of reloading specs.",
      ),
    dryRun: z
      .boolean()
      .optional()
      .describe("Show what files would be written without writing them."),
    verbose: z
      .boolean()
      .optional()
      .describe("In dry-run mode, also include full endpoint listing in output."),
    ...cliConfigOverridesZodSchema,
  },
  async (params) => {
    log(`[openapi-sync-mcp] Generating ${params.type} client...`);
    try {
      const { cliArgs, auth } = buildCliArgsAndAuth(params);
      const effectiveOutputDir = params.outputDir || params.output;
      const effectiveBaseURL = params.baseURL ?? params.baseUrl;

      if (params.dryRun) {
        const validation = await ValidateConfig({ silent: true, auth, cliArgs });
        const loaded = tryLoadConfig(undefined, cliArgs);
        const config = loaded?.config || (params.apiUrl || params.apiFile ? {
          folder: params.folder ?? params.outputFolder ?? "",
          api: { [params.apiName || "api"]: params.apiUrl || params.apiFile || "" },
        } : null);

        const configuredFolder = config?.folder ?? "";
        const perApi: Record<string, { endpointCount: number; plannedFiles: string[] }> = {};
        let totalFileCount = 0;
        let totalEndpointCount = 0;

        for (const [apiName, apiResult] of Object.entries(validation.apis)) {
          if (params.apiName && apiName !== params.apiName) continue;
          const endpointCount = apiResult.endpointCount || apiResult.operationCount || 0;
          totalEndpointCount += endpointCount;

          const basePath = path.join(process.cwd(), configuredFolder);
          const apiFolderPath = effectiveOutputDir
            ? (path.isAbsolute(effectiveOutputDir) ? effectiveOutputDir : path.join(process.cwd(), effectiveOutputDir))
            : (config?.clientGeneration?.outputDir
              ? (path.isAbsolute(config.clientGeneration.outputDir)
                  ? config.clientGeneration.outputDir
                  : path.join(process.cwd(), config.clientGeneration.outputDir))
              : path.join(basePath, apiName));

          const plannedFiles = computePlannedFiles(params.type, apiFolderPath);
          perApi[apiName] = { endpointCount, plannedFiles };
          totalFileCount += plannedFiles.length;
        }

        let endpointsByApi: any = undefined;
        if (params.verbose) {
          endpointsByApi = await ListEndpoints({
            apiName: params.apiName,
            tags: params.tags,
            silent: true,
            auth,
            cliArgs,
          });
        }

        const dryRunResult = {
          dryRun: true,
          type: params.type,
          plannedFiles: Object.values(perApi).flatMap((a) => a.plannedFiles),
          fileCount: totalFileCount,
          endpointCount: totalEndpointCount,
          totalEndpointCount,
          filteredEndpointCount: totalEndpointCount,
          warnings: [],
          message: validation.valid
            ? `Would generate a ${params.type} client. Run without dryRun to write files.`
            : "Validation failed. Fix errors before generating client.",
          ...(params.verbose ? { endpoints: endpointsByApi } : {}),
        };

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(dryRunResult, null, 2),
            },
          ],
          isError: !validation.valid,
        };
      }

      const result = await GenerateClient({
        type: params.type,
        apiName: params.apiName,
        baseURL: effectiveBaseURL,
        tags: params.tags,
        endpoints: params.endpoints,
        outputDir: effectiveOutputDir,
        useCache: params.useCache ?? true,
        silent: true,
        auth,
        cliArgs,
      });

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2),
          },
        ],
        isError: !result.success,
      };
    } catch (err: any) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              success: false,
              apis: [],
              filesWritten: [],
              endpointCount: 0,
              warnings: [],
              errors: [err.message],
            }),
          },
        ],
        isError: true,
      };
    }
  },
);

// ─────────────────────────────────────────────────────────────────────────────
// Tool: openapi_sync_purge
// ─────────────────────────────────────────────────────────────────────────────

server.tool(
  "openapi_sync_purge",
  "Detect and remove generated files that no longer match your current OpenAPI spec. " +
    "Supports 'yes' to delete files without confirmation or 'dryRun' to preview.",
  {
    yes: z
      .boolean()
      .optional()
      .default(false)
      .describe("Delete stale files without confirmation prompt."),
    deleteFiles: z.boolean().optional().describe("Alias for yes."),
    dryRun: z
      .boolean()
      .optional()
      .default(false)
      .describe("Show which files would be deleted without deleting them."),
    ...cliConfigOverridesZodSchema,
  },
  async (params) => {
    log("[openapi-sync-mcp] Purging stale files...");
    try {
      const { cliArgs, auth } = buildCliArgsAndAuth(params);
      const result = await Purge({
        yes: params.yes || params.deleteFiles,
        deleteFiles: params.deleteFiles || params.yes,
        dryRun: params.dryRun,
        apiName: params.apiName,
        silent: true,
        auth,
        cliArgs,
      });
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2),
          },
        ],
        isError: !result.success,
      };
    } catch (err: any) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              success: false,
              stalePaths: [],
              deleted: [],
              purged: [],
              errors: [err.message],
            }),
          },
        ],
        isError: true,
      };
    }
  },
);

// ─────────────────────────────────────────────────────────────────────────────
// Tool: openapi_sync_init
// ─────────────────────────────────────────────────────────────────────────────

server.tool(
  "openapi_sync_init",
  "Create an openapi.sync config file in the current working directory without " +
    "any interactive prompts. First-class authentication and runSync are supported.",
  {
    apiName: z
      .string()
      .describe(
        "A short identifier for this API used as a folder name and config key " +
          "(e.g. 'petstore', 'my-api'). Letters, numbers, hyphens and underscores only.",
      ),
    apiSource: z
      .string()
      .optional()
      .describe(
        "URL to the OpenAPI spec (https://...) or relative path to a local file " +
          "(e.g. ./api/openapi.yaml).",
      ),
    apiUrl: z
      .string()
      .optional()
      .describe("Direct URL to OpenAPI specification (JSON or YAML)."),
    apiFile: z
      .string()
      .optional()
      .describe("Direct path to a local OpenAPI specification file."),
    outputFolder: z
      .string()
      .optional()
      .default("")
      .describe("Output folder for generated files (default: '' project root)."),
    configFormat: z
      .enum(["typescript", "json", "javascript"])
      .optional()
      .default("typescript")
      .describe("Config file format (default: typescript)."),
    clientType: z
      .enum(["react-query", "swr", "fetch", "axios", "rtk-query"])
      .optional()
      .describe(
        "Client type to pre-configure in the config. Omit to skip client generation.",
      ),
    validationLibrary: z
      .enum(["zod", "yup", "joi"])
      .optional()
      .describe(
        "Validation library to pre-configure. Omit to skip validation schema generation.",
      ),
    folderSplit: z
      .boolean()
      .optional()
      .default(false)
      .describe("Organize generated files into folders by OpenAPI tags."),
    typesPrefix: z
      .string()
      .optional()
      .default("I")
      .describe(
        "Prefix for generated TypeScript interface names (default: 'I', e.g. IPet).",
      ),
    useOperationId: z
      .boolean()
      .optional()
      .default(true)
      .describe("Use operationId from spec for naming (default: true)."),
    showCurl: z
      .boolean()
      .optional()
      .default(false)
      .describe("Include cURL examples in generated docs (default: false)."),
    refetchInterval: z
      .number()
      .optional()
      .describe("Auto-refetch interval in milliseconds (omit to disable)."),
    excludeTags: z
      .array(z.string())
      .optional()
      .describe(
        "Tags to exclude from generation (e.g. ['deprecated', 'internal']).",
      ),
    runSync: z
      .boolean()
      .optional()
      .default(false)
      .describe(
        "If true, immediately run a full sync after creating the config file.",
      ),
    preset: z
      .enum([
        "react-query-zod",
        "react-query-yup",
        "swr-zod",
        "swr-yup",
        "axios-zod",
        "axios-joi",
        "fetch-zod",
        "rtk-query-zod",
        "next-fetch",
        "python-basic",
      ])
      .optional()
      .describe(
        "Starter preset configuring client type, validation library, and conventions in one option.",
      ),
    ...authZodSchema,
  },
  async (params) => {
    log("[openapi-sync-mcp] Creating config...");
    try {
      const effectiveSource = params.apiSource || params.apiUrl || params.apiFile;
      if (!effectiveSource) {
        throw new Error("Missing required spec source: provide apiSource, apiUrl, or apiFile.");
      }
      const result = await nonInteractiveInit({
        apiName: params.apiName,
        apiSource: effectiveSource,
        apiUrl: params.apiUrl,
        apiFile: params.apiFile,
        outputFolder: params.outputFolder ?? "",
        configFormat: params.configFormat,
        clientType: params.clientType,
        validationLibrary: params.validationLibrary,
        folderSplit: params.folderSplit,
        typesPrefix: params.typesPrefix,
        useOperationId: params.useOperationId,
        showCurl: params.showCurl,
        excludeTags: params.excludeTags,
        refetchInterval: params.refetchInterval,
        runSync: params.runSync,
        preset: params.preset,
        authType: params.authType,
        authToken: params.authToken,
        authUsername: params.authUsername,
        authPassword: params.authPassword,
        authName: params.authName,
        authValue: params.authValue,
        authIn: params.authIn,
        authHeader: params.authHeader,
        silent: true,
      });
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2),
          },
        ],
        isError: !result.success,
      };
    } catch (err: any) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              success: false,
              configFile: "",
              message: err.message,
              errors: [err.message],
            }),
          },
        ],
        isError: true,
      };
    }
  },
);

// ─────────────────────────────────────────────────────────────────────────────
// Tool: openapi_sync_read_config
// ─────────────────────────────────────────────────────────────────────────────

server.tool(
  "openapi_sync_read_config",
  "Read the current openapi.sync config file from the working directory and " +
    "return its contents as a string. Useful to inspect what APIs are configured " +
    "before running sync or generate-client.",
  {},
  async () => {
    log("[openapi-sync-mcp] Reading config...");
    const configFiles = [
      path.join(cwd, "openapi.sync.ts"),
      path.join(cwd, "openapi.sync.js"),
      path.join(cwd, "openapi.sync.json"),
    ];

    for (const filePath of configFiles) {
      if (fs.existsSync(filePath)) {
        try {
          const content = fs.readFileSync(filePath, "utf-8");
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  {
                    found: true,
                    file: path.basename(filePath),
                    path: filePath,
                    content,
                  },
                  null,
                  2,
                ),
              },
            ],
          };
        } catch (err: any) {
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  found: false,
                  error: `Could not read ${filePath}: ${err.message}`,
                }),
              },
            ],
            isError: true,
          };
        }
      }
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            found: false,
            searched: configFiles,
            message:
              "No openapi.sync config file found. " +
              "Use the openapi_sync_init tool to create one.",
          }),
        },
      ],
    };
  },
);

// ─────────────────────────────────────────────────────────────────────────────
// Start server
// ─────────────────────────────────────────────────────────────────────────────

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  log("[openapi-sync-mcp] Server running on stdio. Ready for tool calls.");
}

main().catch((err) => {
  log("[openapi-sync-mcp] Fatal error:", err);
  process.exit(1);
});
