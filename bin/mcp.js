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

require("../dist/mcp/server.js");
