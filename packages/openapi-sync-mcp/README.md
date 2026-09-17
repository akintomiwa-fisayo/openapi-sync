# openapi-sync-mcp

> **Model Context Protocol (MCP) server for [OpenAPI Sync](https://openapi-sync.com)**.  
> Gives AI coding assistants (Cursor, Claude Desktop, Windsurf, Zed, Antigravity) type-safe, direct tool access to your backend API contracts without blowing past prompt token budgets.

[![npm version](https://img.shields.io/npm/v/openapi-sync-mcp.svg)](https://www.npmjs.com/package/openapi-sync-mcp)
[![smithery badge](https://smithery.ai/badge/openapi-sync-mcp)](https://smithery.ai/server/openapi-sync-mcp)
[![Install in Cursor](https://img.shields.io/badge/Cursor-Add%20to%20Cursor-blue?logo=cursor)](cursor://anysphere.cursor-deeplink/mcp/install?name=openapi-sync&config=eyJjb21tYW5kIjoibnB4IiwiYXJncyI6WyIteSIsIm9wZW5hcGktc3luYy1tY3AiXX0=)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](LICENSE)

---

## Why use OpenAPI Sync via MCP?

Pasting huge 5MB–15MB Swagger / OpenAPI JSON specifications into an AI prompt wastes context tokens, causes rate limits, and leads to hallucinations.

With `openapi-sync-mcp`, your AI coding agent uses **targeted tool calls over stdio** to inspect only what it needs for the task at hand:

* 🔎 **Find endpoints** by path pattern or tag without loading entire specs into context.
* 📦 **Fetch operation details** (parameters, query arguments, request bodies, responses) for a single operation.
* 📝 **Read generated TypeScript interfaces** and schemas on demand.
* ⚙️ **Run health checks (`doctor`) and syncs** autonomously.

---

## Quickstart

Run directly via `npx` (no global installation needed):

```bash
npx openapi-sync-mcp
```

Or view available tools and help:

```bash
npx openapi-sync-mcp --help
```

---

## IDE & Host Setup

### 1. Cursor Setup

Add the following to your project's `.cursor/mcp.json` file:

```json
{
  "mcpServers": {
    "openapi-sync": {
      "command": "npx",
      "args": ["-y", "openapi-sync-mcp"],
      "cwd": "${workspaceFolder}"
    }
  }
}
```

Or add it globally via **Cursor Settings** $\rightarrow$ **Features** $\rightarrow$ **MCP** $\rightarrow$ **+ Add New MCP Server**.

---

### 2. Claude Desktop Setup

Edit your Claude Desktop configuration:
* **macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
* **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "openapi-sync": {
      "command": "npx",
      "args": ["-y", "openapi-sync-mcp"],
      "cwd": "/path/to/your/project"
    }
  }
}
```

Restart Claude Desktop, and the hammer icon 🔨 will appear with all 10 tools available.

---

### 3. Windsurf (Codeium) Setup

Add to `~/.codeium/windsurf/mcp_config.json`:

```json
{
  "mcpServers": {
    "openapi-sync": {
      "command": "npx",
      "args": ["-y", "openapi-sync-mcp"]
    }
  }
}
```

---

### 4. Zed Setup

Add to your Zed `settings.json` under `context_servers`:

```json
{
  "context_servers": [
    {
      "name": "openapi-sync",
      "command": {
        "path": "npx",
        "args": ["-y", "openapi-sync-mcp"]
      }
    }
  ]
}
```

---

### 5. Google Antigravity Setup

Add to your global Antigravity configuration (`~/.gemini/config/mcp_config.json`) or project root (`.agents/mcp_config.json`):

```json
{
  "mcpServers": {
    "openapi-sync": {
      "command": "npx",
      "args": ["-y", "openapi-sync-mcp"]
    }
  }
}
```

---

## Available MCP Tools (10)

| Tool | Description |
| :--- | :--- |
| `openapi_sync_init` | Create `openapi.sync` config file non-interactively with auth support |
| `openapi_sync_validate` | Validate config and remote/local specs without writing files |
| `openapi_sync_doctor` | Run full diagnostic health checks on config, specs, cache, and paths |
| `openapi_sync_list_endpoints` | List endpoints filtered by path pattern, tag, method, or API name |
| `openapi_sync_get_endpoint_details` | Retrieve full parameter, request body, and response types for an operation |
| `openapi_sync_read_generated_type` | Read specific generated TypeScript type or interface |
| `openapi_sync_sync` | Execute full synchronization (types, endpoints, validation schemas) |
| `openapi_sync_generate_client` | Generate typed client (`fetch`, `axios`, `react-query`, `swr`, `rtk-query`, `next-fetch`) |
| `openapi_sync_read_config` | Inspect current `openapi.sync` configuration |
| `openapi_sync_purge` | Detect and purge stale generated files |

---

## Related Packages & Documentation

* **Main Package:** [openapi-sync](https://www.npmjs.com/package/openapi-sync)
* **Official Website:** [openapi-sync.com](https://openapi-sync.com)
* **Documentation & MCP Guide:** [openapi-sync.com/docs#mcp](https://openapi-sync.com/docs#mcp)
* **Agent LLM Index:** [openapi-sync.com/llms.txt](https://openapi-sync.com/llms.txt)
* **GitHub Repository:** [github.com/akintomiwa-fisayo/openapi-sync](https://github.com/akintomiwa-fisayo/openapi-sync)

---

## License

ISC © [P-Technologies](https://github.com/akintomiwa-fisayo)
