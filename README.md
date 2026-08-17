[![NPM Version](https://img.shields.io/npm/v/openapi-sync.svg)](https://www.npmjs.com/package/openapi-sync)
[![License](https://img.shields.io/npm/l/openapi-sync.svg)](https://github.com/akintomiwa-fisayo/openapi-sync/blob/main/LICENSE)
[![Tests](https://img.shields.io/badge/tests-passing-brightgreen.svg)](https://github.com/akintomiwa-fisayo/openapi-sync)

# OpenAPI Sync

**OpenAPI Sync** is a powerful developer tool that automates the synchronization of your API documentation with your codebase using OpenAPI (formerly Swagger) specifications. It generates TypeScript types, fully-typed API clients (Fetch, Axios, React Query, SWR, RTK Query), endpoint definitions, runtime validation schemas (Zod, Yup, Joi), and comprehensive documentation from your OpenAPI schema—ensuring type safety from API specification through client implementation to runtime validation.

> 📘 **[Full documentation available at openapi-sync.com](https://openapi-sync.com)**

## Features

### 🎉 v6.3.0 - AI Agent Ecosystem & End-to-End Type Safety

- 🤖 **First-Class AI Agent & MCP Integration** - Built-in Model Context Protocol server (`npx openapi-sync-mcp`) and inspection commands (`list-endpoints`, `get-endpoint`, `read-type`, `validate`) allow AI agents and developer tools to safely explore APIs without reloading specs.
- 🛡️ **Pure JSON stdout Contract** - All commands support `--json` emitting pure, machine-parsable JSON to stdout with explicit `sync` and `client` phase stats, while sending progress logs to stderr.
- 🚀 **Full Path Parameter Pipeline** - Recursive `$ref` resolution, schema-derived parameter typing (`(projectId: number) => ...`), distinct Path vs. Query JSDoc and validation separation, and typed client parameter passing.
- 🐍 **Python Type & Endpoint Generation** - Generate Python `dataclass` definitions and type-safe `Endpoint` constants alongside TypeScript types with automated token sanitization.
- 📦 **Tag-Split & Flat Mode Flexibility** - Clean flat output by default (`folderSplit: {}`), tag subdirectories with `byTags: true`, and custom client output directories (`clientGeneration.outputDir`) with automatic relative import resolution.
- ⚡ **Non-Interactive Initialization** - Scriptable `npx openapi-sync init --no-interactive` / `init -y` setup wizard with full flag support for CI/CD and automation.

### 🎉 v5.0.0 - Enhanced Client Generation & Developer Experience

- 🚀 **Fully-Typed API Client Generation** - Generate type-safe clients for Fetch, Axios, React Query, SWR, and RTK Query with comprehensive inline documentation
- ⚡ **RTK Query Simplified Setup** - New `setupApiStore` helper reduces Redux configuration from ~15 lines to ~5 lines
- ✅ **Perfect TypeScript Support** - Fixed SWR mutation types, ESLint-compliant Fetch clients, and unique RTK Query reducer paths
- 🎨 **Better File Organization** - Streamlined non-folder-split mode with `clients.ts` and `hooks.ts` directly at root
- 🔧 **CLI Improvements** - Arguments now correctly override config file settings as expected
- 📚 **230+ Lines of SWR Documentation** - Every generated hooks file includes comprehensive usage examples

### Core Features

- 🔄 **Real-time API Synchronization** - Automatically syncs OpenAPI specs from remote URLs with configurable intervals
- 📝 **Automatic Type Generation** - Generates TypeScript interfaces for all endpoints with full nested support
- 🔐 **Runtime Validation** - Generate Zod, Yup, or Joi schemas from OpenAPI specs with all constraints preserved
- 🎯 **Interactive Setup Wizard** - Streamlined configuration with auto-enabled tag-based folder splitting
- 🛡️ **Enterprise Ready** - Error handling, validation, state persistence, and custom code preservation
- 📦 **Folder Splitting** - Organize code by tags or custom logic with aggregator files for easy imports
- 📚 **Rich Documentation** - JSDoc comments with cURL examples and inline usage guides
- 🤖 **Agent-Ready Endpoints** - Browse endpoints with pagination and path filtering, inspect deep endpoint details, and read generated types without reloading the spec
- 🔄 **Custom Code Injection** - Preserve your custom code between regenerations with protected sections

[View all features →](https://openapi-sync.com/docs#features)

## Installation

```bash
npm install openapi-sync
# or
npm install -g openapi-sync
# or use directly
npx openapi-sync
```

> ⚠️ **macOS Big Sur Users:** If you encounter an esbuild error (`Symbol not found: _SecTrustCopyCertificateChain`), install `esbuild@0.17.19` first. See [Troubleshooting](#troubleshooting) for details.

---

## 🤖 Using with AI Agents

All CLI commands and programmatic APIs are **agent-safe** — no interactive prompts, fully non-blocking. Use `--json` for machine-readable output and `--silent` to suppress logs.

> **Full agent reference:** [`llms.txt`](./llms.txt) — a structured discovery file for LLMs, Copilots, and MCP tools.

### Agent Quick-Start (no prompts)

```bash
# 1. Create config (all settings as flags — no stdin required)
npx openapi-sync init --no-interactive \
  --api-name petstore \
  --api-url https://petstore3.swagger.io/api/v3/openapi.json \
  --output-folder ./src/api \
  --client-type react-query \
  --validation-library zod \
  --config-format typescript \
  --json

# 2. Validate config + specs before writing any files
npx openapi-sync validate --json

# 3. Sync — generate types, endpoints, and schemas
npx openapi-sync --json

# 4. Generate a typed API client
npx openapi-sync generate-client --type react-query --json
```

### Machine-Readable Output (`--json`)

Every command emits a single, pure JSON object to `stdout` when `--json` is passed, making it safe to pipe directly into `jq` or consume from automated agents. All human-readable progress logs are suppressed or directed to `stderr`.

```bash
$ npx openapi-sync --json
{
  "success": true,
  "apis": ["petstore"],
  "filesWritten": ["src/api/petstore/types.ts", "src/api/petstore/endpoints.ts"],
  "endpointCount": 20,
  "warnings": [],
  "errors": [],
  "phases": {
    "sync": { "filesWritten": ["src/api/petstore/types.ts", "src/api/petstore/endpoints.ts"], "endpointCount": 20 },
    "client": { "filesWritten": [], "endpointCount": 20 }
  }
}
```

```bash
$ npx openapi-sync validate --json
{
  "valid": true,
  "apis": { "petstore": { "valid": true, "endpointCount": 20 } },
  "configErrors": []
}
```

```bash
$ npx openapi-sync list-endpoints --json
{
  "petstore": [
    { "name": "getPetById", "method": "GET", "path": "/pet/{petId}", "tags": ["pet"], "summary": "Find pet by ID" },
    { "name": "addPet", "method": "POST", "path": "/pet", "tags": ["pet"], "summary": "Add a new pet" }
  ]
}
```

```bash
$ npx openapi-sync list-endpoints --api petstore --path-contains pet --limit 2 --offset 0 --json
```

```bash
$ npx openapi-sync get-endpoint --api petstore --operation-id getPetById --json
```

```bash
$ npx openapi-sync read-type --api petstore --type-name Pet --json
```

### Dry Run (preview without writing files)

Compact, fast previews of planned files:

```bash
npx openapi-sync --dry-run --json
npx openapi-sync generate-client --type fetch --dry-run --json
```

### Layouts & Output Directories

- **Flat Mode (Default):** When `folderSplit` is omitted or empty (`{}`), files are placed directly in the API folder (`endpoints.ts`, `types/index.ts`, `types/shared.ts`).
- **Tag-Split Mode:** Setting `folderSplit: { byTags: true }` organizes endpoints into tag subfolders (e.g. `{tag}/endpoints.ts`, `{tag}/types.ts`, `shared.ts`).
- **Custom Client Directory:** `clientGeneration.outputDir` is fully supported with folder splitting. Clients are placed in `{outputDir}/{tag}/client.ts` and aggregated at `{outputDir}/clients.ts` with relative imports resolving back to your generated types.

### Programmatic API (TypeScript)

```typescript
import {
  ValidateConfig,
  Init,
  GenerateClient,
  ListEndpoints,
  GetEndpointDetails,
  ReadGeneratedType,
} from "openapi-sync";

// Pre-flight check — no files written
const validation = await ValidateConfig({ silent: true });
if (!validation.valid) throw new Error(JSON.stringify(validation));

// Inspect API surface with pagination and filtering
const endpoints = await ListEndpoints({
  apiName: "petstore",
  pathContains: "pet",
  limit: 5,
  offset: 0,
  silent: true,
});
console.log(endpoints.petstore.length, "endpoints found");

// Inspect a single endpoint in full detail
const detail = await GetEndpointDetails({ apiName: "petstore", operationId: "getPetById", silent: true });
console.log(detail.endpoint.path);

// Read an exact generated type declaration
const typeDecl = await ReadGeneratedType({ apiName: "petstore", typeName: "Pet", silent: true });
console.log(typeDecl);

// Sync and get structured result
const syncResult = await Init({ silent: true });
if (!syncResult.success) throw new Error(JSON.stringify(syncResult));
console.log("Files written:", syncResult.filesWritten);

// Generate client
const clientResult = await GenerateClient({ type: "react-query", silent: true });
console.log(JSON.stringify(clientResult));
```

### Exit Codes

| Code | Meaning |
|------|---------|
| `0` | Success |
| `1` | Config error or validation failed |
| `2` | Network / spec fetch error |
| `3` | Generation / file write error |

### Agent-safe vs Interactive Commands

| Command | Agent-safe? |
|---------|------------|
| `npx openapi-sync` | ✅ |
| `npx openapi-sync validate` | ✅ |
| `npx openapi-sync list-endpoints` | ✅ |
| `npx openapi-sync generate-client` | ✅ |
| `npx openapi-sync init --no-interactive` | ✅ |
| `npx openapi-sync init` (no flag) | ❌ Requires stdin |

---

## Quick Start

### Option 1: Interactive Setup (Recommended) 🎯

The easiest way to get started is with the interactive setup wizard:

```bash
npx openapi-sync init
```

The wizard will guide you through:

- 📝 Configuration file format selection (TypeScript, JSON, or JavaScript)
- 🌐 API specification source (URL or local file)
- 📁 Folder organization options (split by tags or custom logic)
- 🚀 Client generation options (React Query, SWR, Fetch, Axios, RTK Query)
- ✅ Validation library setup (Zod, Yup, Joi)
- 🔧 Custom code preservation settings
- 🏷️ Type naming preferences (operationId usage, prefix)
- 🚫 Endpoint filtering (exclude by tags)
- 📚 Documentation options (cURL examples)

### Option 2: Manual Setup

**1. Create `openapi.sync.json` in your project root:**

```json
{
	"refetchInterval": 5000,
	"folder": "./src/api",
	"api": {
		"petstore": "https://petstore3.swagger.io/api/v3/openapi.json"
	}
}
```

**2. Run the sync command:**

```bash
npx openapi-sync
```

**3. Use generated types and endpoints:**

```typescript
import { getPetById } from "./src/api/petstore/endpoints";
import { IPet } from "./src/api/petstore/types";

const petUrl = getPetById("123"); // Returns: "/pet/123"
```

[View detailed quick start guide →](https://openapi-sync.com/docs#quick-start)

## API Client Generation

Generate fully-typed API clients with hooks for popular libraries:

### Generate Fetch Client

```bash
npx openapi-sync generate-client --type fetch
```

### Generate Axios Client

```bash
npx openapi-sync generate-client --type axios
```

### Generate React Query Hooks

```bash
npx openapi-sync generate-client --type react-query --api petstore
```

### Generate SWR Hooks

```bash
npx openapi-sync generate-client --type swr
```

### Generate RTK Query API

```bash
npx openapi-sync generate-client --type rtk-query
```

### Filter by Tags or Endpoints

```bash
# Filter by tags
npx openapi-sync generate-client --type fetch --tags pets,users

# Filter by specific endpoints
npx openapi-sync generate-client --type axios --endpoints getPetById,createPet
```

### Usage Example (React Query)

**1. Generate the client:**

```bash
npx openapi-sync generate-client --type react-query
```

**2. Use in your React components:**

```typescript
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useGetPetById, useCreatePet } from "./api/petstore/client/hooks";
import apiClient from "./api/petstore/client/client";

// Configure API client
apiClient.updateConfig({
  baseURL: "https://api.example.com",
  headers: {
    Authorization: "Bearer your-auth-token",
  },
});

function PetDetails({ petId }: { petId: string }) {
  // Query hook for GET requests with structured params
  const { data, isLoading, error } = useGetPetById({
    url: { petId }, // Path parameters
    query: { includeOwner: true }, // Query parameters (if any)
  });

  // Mutation hook for POST/PUT/PATCH/DELETE requests
  const createPet = useCreatePet({
    onSuccess: () => {
      console.log("Pet created!");
    },
  });

  const handleCreate = () => {
    createPet.mutate({
      data: {
        // Request body
        name: "Fluffy",
        species: "cat",
      },
    });
  };

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <h1>{data?.name}</h1>
      <button onClick={handleCreate}>Create New Pet</button>
    </div>
  );
}
```

### Client Generation Options

| Option            | Description              | Example                                             |
| ----------------- | ------------------------ | --------------------------------------------------- |
| `--type, -t`      | Client type to generate  | `fetch`, `axios`, `react-query`, `swr`, `rtk-query` |
| `--api, -a`       | Specific API from config | `--api petstore`                                    |
| `--tags`          | Filter by endpoint tags  | `--tags pets,users`                                 |
| `--endpoints, -e` | Filter by endpoint names | `--endpoints getPetById,createPet`                  |
| `--output, -o`    | Output directory         | `--output ./src/clients`                            |
| `--base-url, -b`  | Base URL for requests    | `--base-url https://api.example.com`                |

### Custom Code Preservation

Generated clients support custom code sections that are preserved during regeneration:

```typescript
// client.ts (Generated)

// ============================================================
// 🔒 CUSTOM CODE START
// Add your custom code below this line
// This section will be preserved during regeneration
// ============================================================

// Your custom helper functions, middleware, etc.

// 🔒 CUSTOM CODE END
// ============================================================
```

[View complete client generation guide →](https://openapi-sync.com/docs#client-generation)

## Configuration

Supports multiple configuration formats: `openapi.sync.json`, `openapi.sync.ts`, or `openapi.sync.js`

**Basic Example:**

```json
{
	"refetchInterval": 5000,
	"folder": "./src/api",
	"api": {
		"petstore": "https://petstore3.swagger.io/api/v3/openapi.json"
	}
}
```

**Advanced TypeScript Example:**

```typescript
import { IConfig } from "openapi-sync";

const config: IConfig = {
	refetchInterval: 10000,
	folder: "./src/api",
	api: {
		"main-api": "https://api.example.com/openapi.json",
	},
	folderSplit: { byTags: true },
	types: { name: { prefix: "I", useOperationId: true } },
	endpoints: {
		exclude: { tags: ["deprecated"] },
		doc: { showCurl: true },
	},
	validations: { library: "zod" },
};

export default config;
```

[View full configuration options →](https://openapi-sync.com/docs#configuration)

## CLI Commands

### Interactive Setup

```bash
npx openapi-sync init
```

Launch an interactive wizard that guides you through creating your configuration file. Perfect for first-time setup or exploring available options.

### Sync API Types

```bash
# Sync with default config
npx openapi-sync

# Sync with custom refetch interval
npx openapi-sync --refreshinterval 10000
```

Synchronize your OpenAPI specifications and generate TypeScript types, endpoints, and validation schemas.

### Generate API Client

```bash
# Generate React Query hooks
npx openapi-sync generate-client --type react-query

# Generate for specific API
npx openapi-sync generate-client --type axios --api petstore

# Generate with filters
npx openapi-sync generate-client --type fetch --tags pets,users

# Generate for specific endpoints
npx openapi-sync generate-client --type swr --endpoints getPetById,createPet
```

Generate fully-typed API clients for various frameworks and libraries.

### Available Options

| Command           | Description                           |
| ----------------- | ------------------------------------- |
| `init`            | Interactive setup wizard              |
| `sync` (default)  | Sync OpenAPI specs and generate types |
| `generate-client` | Generate API client code              |
| `--help, -h`      | Show help information                 |
| `--version, -v`   | Show version number                   |

## Documentation

For complete documentation including:

- **Configuration Options** - All available settings and customization
- **Generated Output** - Understanding generated files and structure
- **Custom Code Injection** - Preserve your code between regenerations
- **Validation Schemas** - Runtime validation with Zod, Yup, or Joi
- **Advanced Examples** - Complex configurations and use cases
- **API Reference** - Programmatic usage and type definitions
- **Troubleshooting** - Common issues and solutions

**Visit [openapi-sync.com](https://openapi-sync.com)**

---

## 🔌 MCP Server (Model Context Protocol)

`openapi-sync` ships a built-in MCP server that exposes all operations as **structured tool calls**. AI agents (Claude Desktop, Cursor, Copilot, and any MCP-compatible host) can call sync, validate, and generate operations directly — no CLI parsing needed.

### Starting the server

```bash
# Via npx (no global install required — recommended)
npx openapi-sync-mcp

# Or if installed globally
openapi-sync-mcp
```

> The server uses **stdio transport** — it reads JSON-RPC from stdin and writes responses to stdout. The `cwd` of the process is used as the project root for all operations.

### Claude Desktop configuration

Edit `~/Library/Application Support/Claude/claude_desktop_config.json`:

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

### Cursor configuration

Create `.cursor/mcp.json` in your project root:

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

### Available MCP tools

| Tool | Description |
|------|-------------|
| `openapi_sync_read_config` | Read the current config file — start here to understand what's configured |
| `openapi_sync_validate` | Validate config + specs without writing any files |
| `openapi_sync_list_endpoints` | List endpoints with tag filtering, pagination, path matching, and optional cache reuse |
| `openapi_sync_get_endpoint_details` | Return the full stored endpoint definition for one endpoint by operationId or name |
| `openapi_sync_read_generated_type` | Read the exact generated TypeScript interface/type declaration from the generated types file |
| `openapi_sync_sync` | Generate types, endpoints, and validation schemas |
| `openapi_sync_generate_client` | Generate a typed API client (fetch, axios, react-query, swr, rtk-query) |
| `openapi_sync_init` | Create an openapi.sync config file (non-interactive, no prompts) |

### Typical agent workflow via MCP

```
1. openapi_sync_read_config               → check if config exists
2. openapi_sync_init                      → create config if needed (non-interactive)
3. openapi_sync_validate                  → confirm specs are reachable and valid
4. openapi_sync_list_endpoints            → inspect a paged subset of endpoints or search by path; reuses cached endpoints by default
5. openapi_sync_get_endpoint_details      → inspect the full schema for one endpoint
6. openapi_sync_read_generated_type       → read a specific generated TypeScript declaration
7. openapi_sync_sync                      → generate types + schemas
8. openapi_sync_generate_client           → generate a typed client with optional cache reuse
```

### Tool input/output types

All tools return JSON-serialized versions of the same structured types used by the programmatic API:

- `openapi_sync_sync` → [`SyncResult`](#structured-return-types)
- `openapi_sync_generate_client` → [`SyncResult`](#structured-return-types)
- `openapi_sync_validate` → [`ValidationResult`](#structured-return-types)
- `openapi_sync_list_endpoints` → `Record<string, EndpointSummary[]>`
- `openapi_sync_get_endpoint_details` → `{ apiName, endpoint }`
- `openapi_sync_read_generated_type` → `string`
- `openapi_sync_init` → `{ success, configFile, message, errors }`
- `openapi_sync_read_config` → `{ found, file, path, content }`

---

## Troubleshooting

### macOS Big Sur (11.x) - esbuild Installation Error

**Error:** `dyld: Symbol not found: _SecTrustCopyCertificateChain` when installing `openapi-sync`

**Cause:** The default esbuild version requires macOS 12.0+ APIs that aren't available in Big Sur.

**Solution:** Install a compatible esbuild version before installing openapi-sync:

```bash
# Install compatible esbuild first
npm install esbuild@0.17.19

# Then install openapi-sync
npm install openapi-sync
```

Alternatively, add an override to your `package.json`:

```json
{
	"overrides": {
		"esbuild": "0.17.19"
	}
}
```

**Note:** This issue only affects macOS Big Sur (darwin 20.x). Users on macOS 12+ are not affected.

---

## License

ISC License - see [LICENSE](LICENSE) file for details.

## Contributing

Contributions welcome! Submit pull requests to our [GitHub repository](https://github.com/akintomiwa-fisayo/openapi-sync).

### Contributors

A special thanks to the following contributors for their valuable work on this project:

<a href="https://github.com/akintomiwa-fisayo">
  <img src="https://github.com/akintomiwa-fisayo.png" width="50" height="50" alt="Fisayo Akintomiwa" style="border-radius: 50%;" />
</a>
<a href="https://github.com/akintomiwaopemipo">
  <img src="https://github.com/akintomiwaopemipo.png" width="50" height="50" alt="Opemipo Akintomiwa" style="border-radius: 50%;" />
</a>
<a href="https://github.com/ayotunde-codes">
  <img src="https://github.com/ayotunde-codes.png" width="50" height="50" alt="Ayotunde Obasa" style="border-radius: 50%;" />
</a>

---

## Support / Donate

If you find OpenAPI Sync useful and would like to support its development, thank you — your support helps pay for hosting, CI, and ongoing maintenance.

You can support the project in any of the following ways:

- Sponsor the maintainer on GitHub: https://github.com/sponsors/akintomiwa-fisayo
- Back the project on Open Collective (placeholder): https://opencollective.com/fisayo-akintomiwa
  <!-- - Become a patron on Patreon (placeholder): https://patreon.com/openapi_sync -->
  <!-- - One-time donation via PayPal (placeholder): https://paypal.me/yourname -->

Thank you for considering supporting the project — every bit helps.

**[📘 Full Documentation](https://openapi-sync.com) | [GitHub](https://github.com/akintomiwa-fisayo/openapi-sync) | [npm](https://www.npmjs.com/package/openapi-sync)**
