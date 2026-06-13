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
 * | `openapi_sync_validate` | Validate config + specs without writing files |
 * | `openapi_sync_list_endpoints` | List all endpoints from configured specs |
 * | `openapi_sync_sync` | Run full sync (generate types, endpoints, schemas) |
 * | `openapi_sync_generate_client` | Generate a typed API client |
 * | `openapi_sync_init` | Create an openapi.sync config file (non-interactive) |
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
// MCP server instance
// ─────────────────────────────────────────────────────────────────────────────

const server = new McpServer({
  name: "openapi-sync",
  version: "1.0.0",
});

// ─────────────────────────────────────────────────────────────────────────────
// Tool: openapi_sync_validate
// ─────────────────────────────────────────────────────────────────────────────

server.tool(
  "openapi_sync_validate",
  "Validate the openapi-sync config file and all configured API specs without " +
    "writing any files to disk. Use this as a pre-flight check before syncing. " +
    "Returns a structured result with per-API validity and endpoint counts.",
  {},
  async () => {
    log("[openapi-sync-mcp] Running validate...");
    try {
      const result = await ValidateConfig({ silent: true });
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
  }
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
    apiName: z
      .string()
      .optional()
      .describe(
        "Limit results to a specific API name from the config. " +
          "Omit to list endpoints for all configured APIs."
      ),
    tags: z
      .array(z.string())
      .optional()
      .describe(
        "Filter endpoints to only those with one of these OpenAPI tags."
      ),
  },
  async ({ apiName, tags }) => {
    log("[openapi-sync-mcp] Listing endpoints...");
    try {
      const result = await ListEndpoints({ apiName, tags, silent: true });
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
  }
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
        "If set, enables continuous auto-sync at this interval (ms). " +
          "Omit for a single one-time sync."
      ),
  },
  async ({ refetchInterval }) => {
    log("[openapi-sync-mcp] Running sync...");
    try {
      const result = await Init({ refetchInterval, silent: true });
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
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// Tool: openapi_sync_generate_client
// ─────────────────────────────────────────────────────────────────────────────

server.tool(
  "openapi_sync_generate_client",
  "Generate a fully-typed API client for one or all configured APIs. " +
    "Supports: fetch, axios, react-query, swr, rtk-query. " +
    "Syncs the latest spec first, then writes client files to disk. " +
    "Returns a SyncResult with the list of files written.",
  {
    type: z
      .enum(["fetch", "axios", "react-query", "swr", "rtk-query"])
      .describe("The type of API client to generate."),
    apiName: z
      .string()
      .optional()
      .describe(
        "API name from the config to generate a client for. " +
          "Omit to generate for all configured APIs."
      ),
    baseURL: z
      .string()
      .optional()
      .describe(
        "Base URL to bake into the generated client (e.g. https://api.example.com). " +
          "Can be overridden at runtime in the generated code."
      ),
    tags: z
      .array(z.string())
      .optional()
      .describe("Only generate client methods for endpoints with these tags."),
    endpoints: z
      .array(z.string())
      .optional()
      .describe(
        "Only generate client methods for these specific endpoint names / operationIds."
      ),
    outputDir: z
      .string()
      .optional()
      .describe(
        "Custom output directory for the generated client files. " +
          "Defaults to the path set in your openapi.sync config."
      ),
  },
  async ({ type, apiName, baseURL, tags, endpoints, outputDir }) => {
    log(`[openapi-sync-mcp] Generating ${type} client...`);
    try {
      const result = await GenerateClient({
        type,
        apiName,
        baseURL,
        tags,
        endpoints,
        outputDir,
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
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// Tool: openapi_sync_init
// ─────────────────────────────────────────────────────────────────────────────

server.tool(
  "openapi_sync_init",
  "Create an openapi.sync config file in the current working directory without " +
    "any interactive prompts. Use this to set up a project from scratch. " +
    "After calling this tool, run openapi_sync_validate and then openapi_sync_sync.",
  {
    apiName: z
      .string()
      .describe(
        "A short identifier for this API used as a folder name and config key " +
          "(e.g. 'petstore', 'my-api'). Letters, numbers, hyphens and underscores only."
      ),
    apiSource: z
      .string()
      .describe(
        "URL to the OpenAPI spec (https://...) or relative path to a local file " +
          "(e.g. ./api/openapi.yaml)."
      ),
    outputFolder: z
      .string()
      .optional()
      .default("./src/api")
      .describe("Output folder for generated files (default: ./src/api)."),
    configFormat: z
      .enum(["typescript", "json", "javascript"])
      .optional()
      .default("typescript")
      .describe("Config file format (default: typescript)."),
    clientType: z
      .enum(["react-query", "swr", "fetch", "axios", "rtk-query"])
      .optional()
      .describe(
        "Client type to pre-configure in the config. Omit to skip client generation."
      ),
    validationLibrary: z
      .enum(["zod", "yup", "joi"])
      .optional()
      .describe(
        "Validation library to pre-configure. Omit to skip validation schema generation."
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
        "Prefix for generated TypeScript interface names (default: 'I', e.g. IPet)."
      ),
    excludeTags: z
      .array(z.string())
      .optional()
      .describe(
        "Tags to exclude from generation (e.g. ['deprecated', 'internal'])."
      ),
    runSync: z
      .boolean()
      .optional()
      .default(false)
      .describe(
        "If true, immediately run a full sync after creating the config file."
      ),
  },
  async ({
    apiName,
    apiSource,
    outputFolder,
    configFormat,
    clientType,
    validationLibrary,
    folderSplit,
    typesPrefix,
    excludeTags,
    runSync,
  }) => {
    log("[openapi-sync-mcp] Creating config...");
    try {
      const result = await nonInteractiveInit({
        apiName,
        apiSource,
        outputFolder,
        configFormat,
        clientType,
        validationLibrary,
        folderSplit,
        typesPrefix,
        excludeTags,
        runSync,
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
  }
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
                  2
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
  }
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
