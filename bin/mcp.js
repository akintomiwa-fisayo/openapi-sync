#!/usr/bin/env node

/**
 * openapi-sync MCP Server entry point.
 *
 * Starts the Model Context Protocol server over stdio so that AI agents
 * (Claude Desktop, Cursor, Copilot, etc.) can call openapi-sync operations
 * as structured tool invocations.
 *
 * Usage — add to Claude Desktop config
 * (~/ Library/Application Support/Claude/claude_desktop_config.json):
 *
 *   {
 *     "mcpServers": {
 *       "openapi-sync": {
 *         "command": "npx",
 *         "args": ["-y", "openapi-sync-mcp"],
 *         "cwd": "/path/to/your/project"
 *       }
 *     }
 *   }
 *
 * Usage — add to Cursor config (.cursor/mcp.json in project root):
 *
 *   {
 *     "mcpServers": {
 *       "openapi-sync": {
 *         "command": "npx",
 *         "args": ["-y", "openapi-sync-mcp"],
 *         "cwd": "${workspaceFolder}"
 *       }
 *     }
 *   }
 */

const args = process.argv.slice(2);
if (args.includes("--help") || args.includes("-h")) {
  console.log(`openapi-sync MCP Server

Starts the Model Context Protocol server over stdio for AI agent workflows.

Usage:
  npx openapi-sync-mcp [options]

Options:
  -h, --help     Show help
  -v, --version  Show version

Available MCP Tools:
  openapi_sync_init                 Create openapi.sync config (non-interactive, with auth)
  openapi_sync_validate             Validate config and specs without writing files
  openapi_sync_doctor               Run diagnostic health checks
  openapi_sync_list_endpoints       List endpoints from configured specs
  openapi_sync_get_endpoint_details Get full endpoint details by operationId or name
  openapi_sync_read_generated_type  Read generated TypeScript interface or type
  openapi_sync_sync                 Run full sync (types, endpoints, schemas)
  openapi_sync_generate_client      Generate typed client (fetch, axios, react-query, swr, rtk-query, next-fetch)
  openapi_sync_read_config          Read current openapi.sync config file
  openapi_sync_purge                Purge stale generated files (supports dryRun and yes)

Claude Desktop / Cursor Configuration:
  Add to your MCP settings file:
  {
    "mcpServers": {
      "openapi-sync": {
        "command": "npx",
        "args": ["-y", "openapi-sync-mcp"]
      }
    }
  }
`);
  process.exit(0);
}

if (args.includes("--version") || args.includes("-v")) {
  const pkg = require("../package.json");
  console.log(pkg.version);
  process.exit(0);
}

require("../dist/mcp/server.js");
