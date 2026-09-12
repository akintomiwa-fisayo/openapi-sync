[![NPM Version](https://img.shields.io/npm/v/openapi-sync.svg)](https://www.npmjs.com/package/openapi-sync)
[![License](https://img.shields.io/npm/l/openapi-sync.svg)](https://github.com/akintomiwa-fisayo/openapi-sync/blob/main/LICENSE)
[![Tests](https://img.shields.io/badge/tests-passing-brightgreen.svg)](https://github.com/akintomiwa-fisayo/openapi-sync)

# OpenAPI Sync

**OpenAPI Sync** is a powerful developer tool that automates the synchronization of your API documentation with your codebase using OpenAPI (formerly Swagger) specifications. It generates TypeScript types, fully-typed API clients (Fetch, Next.js Fetch, Axios, React Query, SWR, RTK Query), endpoint definitions, runtime validation schemas (Zod, Yup, Joi), and comprehensive documentation from your OpenAPI schema—ensuring type safety from API specification through client implementation to runtime validation.

> 📘 **[Full documentation available at openapi-sync.com](https://openapi-sync.com)**

## Core Features

- ⚡ **Zero-Config Presets** - 10 pre-configured framework presets (React Query, SWR, Axios, Fetch, RTK Query, Next.js, Python) for instant setup
- 🔄 **Real-time API Synchronization** - Automatically syncs OpenAPI specs from remote URLs with configurable intervals
- 📝 **Automatic Type Generation** - Generates TypeScript interfaces for all endpoints with full nested support
- 🔐 **Runtime Validation** - Generate Zod, Yup, or Joi schemas from OpenAPI specs with all constraints preserved
- 🎯 **Interactive Setup Wizard** - Streamlined configuration with auto-enabled tag-based folder splitting
- 🛡️ **Enterprise Ready** - Error handling, validation, state persistence, and custom code preservation
- 📦 **Folder Splitting** - Organize code by tags or custom logic with aggregator files for easy imports
- 📚 **Rich Documentation** - JSDoc comments with cURL examples and inline usage guides
- 🤖 **Agent-Ready Endpoints** - Browse endpoints with pagination and path filtering, inspect deep endpoint details, and read generated types without reloading the spec
- 🩺 **Diagnostic Doctor** - Diagnostic health checks for config validity, spec accessibility, peer dependencies, cache, and folder write permissions
- 🧹 **Stale File Purge** - Manifest-based stale code detection and cleanup with dry-run support to prevent orphaned code
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

# Or for protected specs, configure auth directly on init:
npx openapi-sync init --no-interactive \
  --api-name backend \
  --api-url https://api.example.com/openapi.json \
  --auth-type bearer \
  --auth-token '${env.SPEC_TOKEN}' \
  --preset react-query-zod \
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
- **Custom Client Directory:** `clientGeneration.outputDir` (or CLI `--output`) is fully supported in both flat and folder-split layouts. In flat mode, clients are placed directly in `{outputDir}/clients.ts` (or `api.ts`), while in folder-split mode clients are placed in `{outputDir}/{tag}/client.ts` and aggregated at `{outputDir}/clients.ts`, with relative imports resolving back to your generated types and endpoints.

### Programmatic API (TypeScript)

```typescript
import {
  ValidateConfig,
  Init,
  GenerateClient,
  ListEndpoints,
  GetEndpointDetails,
  ReadGeneratedType,
  Doctor,
  Purge,
} from "openapi-sync";

// Pre-flight check — no files written
const validation = await ValidateConfig({ silent: true });
if (!validation.valid) throw new Error(JSON.stringify(validation));

// Diagnostic health check on config, specs, peer dependencies, and directories
const health = await Doctor({ silent: true });
console.log("Health check:", health.healthy ? "All checks passed" : "Issues detected");

// Inspect API surface with pagination and filtering
const endpoints = await ListEndpoints({
  apiName: "petstore",
  pathContains: "pet",
  limit: 5,
  offset: 0,
  silent: true,
});
console.log(endpoints.petstore.length, "endpoints found");

// Inspect a single endpoint in full detail (4-tier fuzzy matching)
const detail = await GetEndpointDetails({ apiName: "petstore", operationId: "getPetById", silent: true });
console.log(detail.endpoint.path);

// Read an exact generated type declaration (with optional line pagination)
const typeDecl = await ReadGeneratedType({ apiName: "petstore", typeName: "Pet", silent: true });
console.log(typeDecl);

// Sync and get structured result
const syncResult = await Init({ silent: true });
if (!syncResult.success) throw new Error(JSON.stringify(syncResult));
console.log("Files written:", syncResult.filesWritten);

// Generate client
const clientResult = await GenerateClient({ type: "react-query", silent: true });
console.log(JSON.stringify(clientResult));

// Detect and purge stale files from disk
const purgeResult = await Purge({ yes: true, silent: true });
console.log("Purged files:", purgeResult.purged);
```

### Exit Codes

| Code | Meaning |
|------|---------|
| `0` | Success |
| `1` | Config error or validation failed |
| `2` | Network / spec fetch error |
| `3` | Generation / file write error |

### Agent-safe vs Interactive Commands

| Command | Agent-safe? | Description |
|---------|:-----------:|-------------|
| `npx openapi-sync` | ✅ | Sync specs, generate types, endpoints, schemas |
| `npx openapi-sync validate` | ✅ | Validate config + specs; no files written |
| `npx openapi-sync doctor` | ✅ | Diagnostic health check on config, network, peer deps, cache |
| `npx openapi-sync list-endpoints` | ✅ | List endpoints with filtering and pagination; no files written |
| `npx openapi-sync get-endpoint` | ✅ | Inspect detailed schema for one endpoint by operationId or name |
| `npx openapi-sync read-type` | ✅ | Read generated TypeScript declaration block |
| `npx openapi-sync generate-client` | ✅ | Generate typed API client (fetch, next-fetch, axios, react-query, swr, rtk-query) |
| `npx openapi-sync purge --yes` | ✅ | Remove stale generated files without prompting |
| `npx openapi-sync init --no-interactive` | ✅ | Create config file without prompts |
| `npx openapi-sync init` (no flag) | ❌ | Interactive wizard (requires stdin) |

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

## ⚡ Presets (Zero-Config Framework Setup)

Presets bundle opinionated defaults for your framework, client library, and validation stack into a single name. Instead of configuring dozens of settings by hand, pick a preset during `npx openapi-sync init` or set `"preset": "<name>"` in your config file. Any explicit configuration values you define always override preset defaults.

| Preset Name | Target Framework / HTTP Client | Validation Library | Features Configured | Recommended Dependencies |
| :--- | :--- | :--- | :--- | :--- |
| `react-query-zod` *(Default/Recommended)* | TanStack React Query v5 | Zod | Typed Query & Mutation hooks, Zod schemas, preserved custom code, operationId naming | `npm i @tanstack/react-query axios zod` |
| `react-query-yup` | TanStack React Query v5 | Yup | Typed Query & Mutation hooks, Yup validation schemas, preserved custom code | `npm i @tanstack/react-query axios yup` |
| `swr-zod` | Vercel SWR | Zod | SWR hooks with mutation support (`useSWRMutation`), Zod schemas, preserved custom code | `npm i swr axios zod` |
| `swr-yup` | Vercel SWR | Yup | SWR hooks with mutation support, Yup schemas, preserved custom code | `npm i swr axios yup` |
| `axios-zod` | Axios Client | Zod | Standalone typed Axios client instance, Zod schemas, preserved custom code | `npm i axios zod` |
| `axios-joi` | Axios Client | Joi | Standalone typed Axios client, Joi validation schemas (great for Node.js backends) | `npm i axios joi` |
| `fetch-zod` | Native Fetch API | Zod | Zero-dependency native fetch client, Zod runtime validation | `npm i zod` |
| `rtk-query-zod` | Redux Toolkit Query | Zod | RTK Query API slice definitions with `fetchBaseQuery`, Zod schemas | `npm i @reduxjs/toolkit react-redux zod` |
| `next-fetch` | Next.js (App/Pages router) | Disabled | Server Components-friendly fetch calls with caching headers, validation disabled for zero bundle bloat | *(Built into Next.js)* |
| `python-basic` | Python | N/A | Generates Python dataclasses / `TypedDict` types, no TypeScript runtime validation | `pip install requests` |

### Using a Preset

**In the CLI Setup Wizard:**
```bash
npx openapi-sync init
# Select your preset from the interactive menu with rich descriptions
```

**Non-Interactive / CI:**
```bash
npx openapi-sync init --preset react-query-zod --api-name petstore --api-url https://petstore3.swagger.io/api/v3/openapi.json
```

**In JSON (`openapi.sync.json`):**
```json
{
  "$schema": "./node_modules/openapi-sync/openapi.sync.schema.json",
  "preset": "react-query-zod",
  "api": {
    "petstore": "https://petstore3.swagger.io/api/v3/openapi.json"
  }
}
```

**In TypeScript (`openapi.sync.ts`):**
```typescript
import { defineConfig } from "openapi-sync";

export default defineConfig({
  preset: "react-query-zod",
  api: {
    petstore: "https://petstore3.swagger.io/api/v3/openapi.json",
  },
  // User values cleanly override preset defaults:
  folder: "./src/api",
});
```

[View presets guide on website →](https://openapi-sync.com/docs#presets)

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

### Generate Next.js Fetch Client (App Router & Server Components)

```bash
npx openapi-sync generate-client --type next-fetch
# Or use --preset next-fetch during init / sync
```

**Usage in Next.js App Router (Server Components):**

```typescript
// app/pets/[id]/page.tsx (Server Component — no React hooks needed)
import { getPetById, setApiConfig } from "@/api/petstore/clients";

// Set baseURL at runtime or via environment variables
setApiConfig({ baseURL: process.env.API_BASE_URL || "https://api.example.com" });

export default async function PetPage({ params }: { params: { id: string } }) {
  // Built-in Next.js App Router cache and tag-based revalidation
  const pet = await getPetById(
    { url: { petId: params.id } },
    {
      cache: "force-cache",
      next: { revalidate: 3600, tags: ["pets"] },
    }
  );

  return <div><h1>{pet.name}</h1></div>;
}
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

| Option            | Description              | Example                                                                |
| ----------------- | ------------------------ | ---------------------------------------------------------------------- |
| `--type, -t`      | Client type to generate  | `fetch`, `next-fetch`, `axios`, `react-query`, `swr`, `rtk-query`      |
| `--api, -a`       | Specific API from config | `--api petstore`                                                       |
| `--tags`          | Filter by endpoint tags  | `--tags pets,users`                                                    |
| `--endpoints, -e` | Filter by endpoint names | `--endpoints getPetById,createPet`                                     |
| `--output, -o`    | Output directory         | `--output ./src/clients`                                               |
| `--base-url, -b`  | Base URL for requests    | `--base-url https://api.example.com`                                   |

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

### 🔐 Protected Specs & Stored Authentication (`auth`)

Fetch OpenAPI specifications protected behind Bearer tokens, Basic auth, API keys, or custom headers.

> ⚠️ **IMPORTANT FOR HUMANS & AI AGENTS:**
> Referencing environment variables for credentials **requires using a TypeScript (`openapi.sync.ts`) or JavaScript (`openapi.sync.js`) configuration file**.
> Static JSON (`openapi.sync.json`) does not support JavaScript runtime expressions like `process.env`. Always use `openapi.sync.ts` or `openapi.sync.js` when dynamic environment variables are needed to keep secrets safe and prevent invalid JSON syntax errors.

**TypeScript Example (`openapi.sync.ts`):**

```typescript
import { defineConfig } from "openapi-sync";

export default defineConfig({
  folder: "./src/api",
  api: {
    // 1. Protected with Bearer token
    billingApi: {
      url: "https://api.example.com/billing/openapi.json",
      auth: {
        type: "bearer",
        token: process.env.BILLING_API_TOKEN!,
      },
    },

    // 2. Protected with Basic auth
    internalApi: {
      url: "https://internal.example.com/spec.json",
      auth: {
        type: "basic",
        username: process.env.INTERNAL_USER!,
        password: process.env.INTERNAL_PASSWORD!,
      },
    },

    // 3. Protected with API Key (header or query)
    analyticsApi: {
      url: "https://analytics.example.com/openapi.json",
      auth: {
        type: "apiKey",
        in: "header",
        name: "X-API-Key",
        value: process.env.ANALYTICS_KEY!,
      },
    },
  },
});
```

**JavaScript Example (`openapi.sync.js`):**

```javascript
/** @type {import('openapi-sync').IConfig} */
module.exports = {
  folder: "./src/api",
  api: {
    protectedApi: {
      url: "https://api.example.com/openapi.json",
      auth: {
        type: "bearer",
        token: process.env.MY_SPEC_TOKEN,
      },
    },
  },
};
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

### Zero-Config CLI Execution & Config Overrides

You can run `openapi-sync` directly from terminal scripts or CI/CD pipelines **without creating a configuration file on disk**. Pass any property supported by the configuration file via CLI flags:

```bash
# Zero-config sync with preset
npx openapi-sync --api-url https://petstore3.swagger.io/api/v3/openapi.json --preset react-query-zod --folder ./src/api

# Zero-config sync with protected spec
npx openapi-sync --api-url https://api.example.com/openapi.json --auth-type bearer --auth-token "$MY_TOKEN" --preset next-fetch

# Multiple APIs via CLI
npx openapi-sync --api users=https://api.example.com/users.json --api billing=https://api.example.com/billing.json --preset axios-zod

# Override existing disk config properties on-the-fly
npx openapi-sync --folder ./dist/api --validation-lib yup --no-docs

# Raw JSON configuration via CLI
npx openapi-sync --config-json '{"api":{"main":"https://api.example.com/spec.json"},"preset":"react-query-zod"}'
```

> [!NOTE]
> If run without a configuration file on disk and without necessary CLI flags (e.g. `--api-url`, `--api <name>=<url>`, or `--config-json`), `openapi-sync` will display the standard `ConfigNotFoundError`, prompting you to run `npx openapi-sync init`.


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

### Available Commands & Options

| Command           | Description                                                                 |
| ----------------- | --------------------------------------------------------------------------- |
| `init`            | Interactive setup wizard (or non-interactive with `-y` / `--no-interactive`) |
| `sync` (default)  | Sync OpenAPI specs and generate types, endpoints, and validation schemas   |
| `generate-client` | Generate typed API client code (`fetch`, `axios`, `react-query`, `swr`, `rtk-query`) |
| `validate`        | Validate configuration and remote/local specs without writing files         |
| `doctor`          | Run diagnostic health checks on config, specs, peer dependencies, and cache |
| `purge`           | Detect and remove stale generated files that no longer exist in specs       |
| `list-endpoints`  | List all discovered endpoints with filtering, tags, and pagination          |
| `get-endpoint`    | Inspect details, parameters, and generated code for a specific endpoint     |
| `read-type`       | Extract and display generated TypeScript type definitions for any schema    |
| `--help, -h`      | Show help information                                                       |
| `--version, -v`   | Show version number                                                         |

#### CLI Flag Aliases
Flags are interchangeable across `init`, `sync`, `validate`, and `generate-client`:
- **Output folder**: `--output-folder` or `--folder` (`-f`) (defaults to project root `""`)
- **Validation library**: `--validation-library` or `--validation-lib` (`--validations-library`)
- **Tag folder split**: `--folder-split` or `--split-by-tags`
- **Type prefix**: `--types-prefix` or `--type-prefix`

### Diagnostic Health Checks (`doctor`)

Run an automated environment audit to diagnose config syntax, specification accessibility, optional peer dependencies (`zod`, `yup`, `joi`), cache state, and directory write permissions:

```bash
# Run human-readable diagnostic report
npx openapi-sync doctor

# Run machine-readable health check for agents and CI
npx openapi-sync doctor --json
```

**Output Example:**
```json
{
  "healthy": true,
  "checks": [
    { "name": "Configuration", "status": "ok", "message": "Valid openapi.sync.ts found" },
    { "name": "Spec Reachability: petstore", "status": "ok", "message": "HTTP 200 OK (20 endpoints)" },
    { "name": "Peer Dependency: zod", "status": "ok", "message": "zod v3.23.8 installed" },
    { "name": "Output Directory", "status": "ok", "message": "./src/api is writable" }
  ],
  "recommendations": []
}
```

### Stale File Detection & Cleanup (`purge`)

Whenever endpoints or schemas are removed from your OpenAPI specification, previously generated files can become orphaned in your codebase. `openapi-sync` tracks generated artifacts via `.openapi-sync/manifest.json` and automatically detects stale files.

```bash
# Preview what stale files would be deleted without making changes
npx openapi-sync purge --dry-run

# Preview stale files as JSON (for CI / AI agents)
npx openapi-sync purge --dry-run --json

# Delete stale files without an interactive prompt
npx openapi-sync purge --yes

# Limit purge to a single configured API
npx openapi-sync purge --api petstore --yes
```

### Inspecting Endpoints & Types (`get-endpoint`, `read-type`)

AI agents and developers can query specific endpoint metadata or read generated type declarations without loading huge files or blowing LLM context windows:

```bash
# Inspect full endpoint definition by operationId
npx openapi-sync get-endpoint --operation-id getPetById --json

# Inspect endpoint using 4-tier fuzzy matching by name or path
npx openapi-sync get-endpoint --name pet_update --json

# Read exact generated TypeScript type definition
npx openapi-sync read-type --api petstore --type-name Pet --json
```

### Typed Error Codes & Recovery

All CLI commands and programmatic methods throw structured error objects extending `OpenApiSyncError`. Each error exposes a stable `code` string:

| Error Code | Error Class | Common Cause | Recommended Recovery Action |
|:---|:---|:---|:---|
| `CONFIG_NOT_FOUND` | `ConfigNotFoundError` | No `openapi.sync.{ts,js,json}` in cwd | Run `npx openapi-sync init -y` or supply `--api-url` |
| `CONFIG_PARSE_FAILED` | `ConfigParseError` | Syntax or evaluation error in config file | Check config file syntax; check `.env` variable exports |
| `CONFIG_INVALID` | `ConfigValidationError` | Missing required fields (e.g. empty `api`) | Ensure `api` mapping contains at least one valid source |
| `SPEC_FETCH_FAILED` | `SpecFetchError` | Network timeout, DNS failure, 401/403/404 | Verify URL; add `--auth-type` or configure `auth` block |
| `SPEC_READ_FAILED` | `SpecReadError` | Local file does not exist or unreadable | Check relative file path in `api` configuration |
| `SPEC_PARSE_FAILED` | `SpecParseError` | Malformed OpenAPI JSON or YAML spec | Validate spec with Swagger Editor / `openapi-sync validate` |
| `GENERATION_FAILED` | `GenerationError` | Filesystem write permission error | Ensure target directory has write permissions |
| `UNKNOWN_API` | `UnknownApiError` | `--api <name>` does not match any config key | Check configured API names using `list-endpoints --json` |

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
| `openapi_sync_validate` | Validate config + specs without writing any files (supports auth and config overrides) |
| `openapi_sync_doctor` | Run full diagnostic health check on config, specs, peer dependencies, and cache |
| `openapi_sync_list_endpoints` | List endpoints with tag filtering, pagination, path matching, and optional cache reuse |
| `openapi_sync_get_endpoint_details` | Return the full stored endpoint definition for one endpoint by operationId or name |
| `openapi_sync_read_generated_type` | Read the exact generated TypeScript interface/type declaration from the generated types file |
| `openapi_sync_sync` | Generate types, endpoints, and validation schemas |
| `openapi_sync_generate_client` | Generate a typed API client (fetch, next-fetch, axios, react-query, swr, rtk-query) |
| `openapi_sync_purge` | Detect and remove stale generated files (supports dryRun and yes) |
| `openapi_sync_init` | Create an openapi.sync config file (non-interactive, with first-class auth & runSync) |

### Typical agent workflow via MCP

```
1. openapi_sync_read_config               → check if config exists
2. openapi_sync_init                      → create config if needed (non-interactive, default folder "")
3. openapi_sync_doctor                    → verify environment, spec reachability, and peer dependencies
4. openapi_sync_validate                  → confirm specs are reachable and valid
5. openapi_sync_list_endpoints            → inspect a paged subset of endpoints or search by path
6. openapi_sync_get_endpoint_details      → inspect the full schema for one endpoint
7. openapi_sync_read_generated_type       → read a specific generated TypeScript declaration
8. openapi_sync_sync                      → generate types + schemas
9. openapi_sync_generate_client           → generate a typed client with optional cache reuse
10. openapi_sync_purge                    → clean up stale files when specs evolve
```

### Tool input/output types

All tools return JSON-serialized versions of the same structured types used by the programmatic API:

- `openapi_sync_sync` → [`SyncResult`](#structured-return-types)
- `openapi_sync_generate_client` → [`SyncResult`](#structured-return-types)
- `openapi_sync_validate` → [`ValidationResult`](#structured-return-types)
- `openapi_sync_doctor` → `DoctorResult` (`{ healthy, checks, recommendations }`)
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
