# OpenAPI Sync - Comprehensive Documentation

[![NPM Version](https://img.shields.io/npm/v/openapi-sync.svg)](https://www.npmjs.com/package/openapi-sync)
[![License](https://img.shields.io/npm/l/openapi-sync.svg)](https://github.com/akintomiwa-fisayo/openapi-sync/blob/main/LICENSE)

**OpenAPI Sync** is a powerful developer tool that automates the synchronization of your API documentation with your codebase using OpenAPI (formerly Swagger) specifications. It generates TypeScript types, endpoint definitions, and comprehensive documentation from your OpenAPI schema, ensuring your API documentation stays up-to-date with your code.

## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Configuration](#configuration)
- [Usage](#usage)
- [Generated Output](#generated-output)
- [API Reference](#api-reference)
- [Advanced Examples](#advanced-examples)
- [Troubleshooting](#troubleshooting)

## Features

### 🔄 **Real-time API Synchronization**

- Automatically fetches and syncs OpenAPI specifications from remote URLs
- Supports both JSON and YAML formats
- Configurable refetch intervals for development environments
- Smart caching to avoid unnecessary regeneration

### 📝 **Automatic Type Generation**

- Generates TypeScript interfaces for all API endpoints
- Creates type definitions for request/response bodies
- Supports complex nested objects, arrays, and unions
- Handles nullable types and optional properties
- Generates shared component types from OpenAPI components

### 🔧 **Highly Configurable**

- Customizable naming conventions for types and endpoints
- Flexible output directory structure
- URL transformation and text replacement rules
- Configurable documentation generation
- Support for multiple API specifications

### 🛡️ **Enterprise Ready**

- Network error handling with exponential backoff retry
- Schema validation using Redocly OpenAPI Core
- State persistence to track changes
- Environment-aware (disables auto-sync in production)
- TypeScript support with full type safety

### 📚 **Rich Documentation**

- Generates comprehensive JSDoc comments
- Includes cURL examples for each endpoint
- Security scheme documentation
- Request/response type documentation
- Markdown-formatted type references

## Installation

### NPM Package

```bash
npm install openapi-sync
```

### Global Installation

```bash
npm install -g openapi-sync
```

### Direct Usage (No Installation)

```bash
npx openapi-sync
```

## Quick Start

1. **Create a configuration file** in your project root:

```json
// openapi.sync.json
{
  "refetchInterval": 5000,
  "folder": "./src/api",
  "api": {
    "petstore": "https://petstore3.swagger.io/api/v3/openapi.json"
  }
}
```

2. **Run the sync command**:

```bash
npx openapi-sync
```

3. **Use the generated types and endpoints**:

```typescript
import { getPetById } from "./src/api/petstore/endpoints";
import { IPet, IGetPetByIdResponse } from "./src/api/petstore/types";

// Use the endpoint URL
const petUrl = getPetById("123"); // Returns: "/pet/123"

// Use the generated types
const pet: IPet = {
  id: 1,
  name: "Fluffy",
  status: "available",
};
```

## Configuration

OpenAPI Sync supports multiple configuration file formats:

- `openapi.sync.json` (JSON format)
- `openapi.sync.ts` (TypeScript format)
- `openapi.sync.js` (JavaScript format)

### Basic Configuration

```json
{
  "refetchInterval": 5000,
  "folder": "./src/api",
  "api": {
    "petstore": "https://petstore3.swagger.io/api/v3/openapi.json",
    "jsonplaceholder": "https://jsonplaceholder.typicode.com/openapi.yaml"
  },
  "server": 0
}
```

### Advanced Configuration

```typescript
// openapi.sync.ts
import { IConfig } from "openapi-sync/types";

const config: IConfig = {
  refetchInterval: 10000,
  folder: "./src/generated/api",
  api: {
    "main-api": "https://api.example.com/openapi.json",
    "auth-api": "https://auth.example.com/openapi.yaml",
  },
  server: "https://api.example.com", // Override server URL

  // Type generation configuration
  types: {
    name: {
      prefix: "I", // Prefix for interface names
      format: (source, data, defaultName) => {
        if (source === "shared") {
          return `${data.name}Type`;
        } else if (source === "endpoint") {
          return `${data.method?.toUpperCase()}${data.path?.replace(
            /\//g,
            "_"
          )}${data.type}`;
        }
        return defaultName;
      },
    },
    doc: {
      disable: false, // Enable/disable JSDoc generation
    },
  },

  // Endpoint generation configuration
  endpoints: {
    value: {
      replaceWords: [
        {
          replace: "/api/v\\d+/", // Remove version from URLs
          with: "/",
        },
        {
          replace: "/internal/",
          with: "/",
          type: "endpoint",
        },
      ],
      includeServer: true, // Include server URL in endpoints
      type: "object", // Generate as objects instead of strings
    },
    name: {
      prefix: "API_",
      useOperationId: true, // Use operationId from OpenAPI spec
      format: ({ method, path, summary, operationId }, defaultName) => {
        if (operationId) return operationId;
        return path.replace(/\//g, "_").replace(/{|}/g, "");
      },
    },
    doc: {
      disable: false,
      showCurl: true, // Include cURL examples in documentation
    },
  },
};

export default config;
```

### Configuration Options Reference

#### Root Configuration

| Property          | Type                     | Description                                   | Default  |
| ----------------- | ------------------------ | --------------------------------------------- | -------- |
| `refetchInterval` | `number`                 | Milliseconds between API refetches (dev only) | -        |
| `folder`          | `string`                 | Output directory for generated files          | `""`     |
| `api`             | `Record<string, string>` | Map of API names to OpenAPI spec URLs         | Required |
| `server`          | `number \| string`       | Server index or custom server URL             | `0`      |

#### Type Configuration (`types`)

| Property      | Type       | Description                        |
| ------------- | ---------- | ---------------------------------- |
| `name.prefix` | `string`   | Prefix for generated type names    |
| `name.format` | `function` | Custom naming function for types   |
| `doc.disable` | `boolean`  | Disable JSDoc generation for types |

#### Endpoint Configuration (`endpoints`)

| Property              | Type                   | Description                            |
| --------------------- | ---------------------- | -------------------------------------- |
| `value.replaceWords`  | `IConfigReplaceWord[]` | URL transformation rules               |
| `value.includeServer` | `boolean`              | Include server URL in endpoints        |
| `value.type`          | `"string" \| "object"` | Output format for endpoints            |
| `name.prefix`         | `string`               | Prefix for endpoint names              |
| `name.useOperationId` | `boolean`              | Use OpenAPI operationId for naming     |
| `name.format`         | `function`             | Custom naming function for endpoints   |
| `doc.disable`         | `boolean`              | Disable JSDoc generation for endpoints |
| `doc.showCurl`        | `boolean`              | Include cURL examples in documentation |

## Usage

### CLI Usage

#### Basic Commands

```bash
# Run with default configuration
npx openapi-sync

# Run with custom refetch interval
npx openapi-sync --refreshinterval 30000
npx openapi-sync -ri 30000

# Get help
npx openapi-sync --help
```

#### CLI Options

| Option              | Alias | Type     | Description                           |
| ------------------- | ----- | -------- | ------------------------------------- |
| `--refreshinterval` | `-ri` | `number` | Override refetch interval from config |

### Programmatic Usage

#### Basic Usage

```typescript
import { Init } from "openapi-sync";

// Initialize with default config
await Init();

// Initialize with custom options
await Init({
  refetchInterval: 30000,
});
```

#### Advanced Integration

```typescript
import { Init } from "openapi-sync";

// In your application startup
export const initializeAPI = async () => {
  try {
    await Init({
      refetchInterval: process.env.NODE_ENV === "development" ? 5000 : 0,
    });
    console.log("API types synchronized successfully");
  } catch (error) {
    console.error("Failed to sync API types:", error);
    throw error;
  }
};

// Call during app initialization
initializeAPI();
```

#### Function-based Configuration

```typescript
// openapi.sync.ts
import { IConfig } from "openapi-sync/types";

export default (): IConfig => {
  const baseConfig = {
    refetchInterval: 5000,
    folder: "./src/api",
    api: {},
  };

  // Dynamic configuration based on environment
  if (process.env.NODE_ENV === "development") {
    baseConfig.api = {
      "local-api": "http://localhost:3000/openapi.json",
    };
  } else {
    baseConfig.api = {
      "prod-api": "https://api.production.com/openapi.json",
    };
  }

  return baseConfig;
};
```

## Generated Output

OpenAPI Sync generates a structured output in your specified folder:

```
src/api/
├── petstore/
│   ├── endpoints.ts          # Endpoint URLs and metadata
│   └── types/
│       ├── index.ts          # Endpoint-specific types
│       └── shared.ts         # Shared component types
└── auth-api/
    ├── endpoints.ts
    └── types/
        ├── index.ts
        └── shared.ts
```

### Generated Endpoints

#### String Format (Default)

````typescript
// endpoints.ts
/**
 * **Method**: `GET`
 * **Summary**: Find pet by ID
 * **Tags**: [pet]
 * **OperationId**: getPetById
 * **Response**:
 *   - **200**:
 *     ```typescript
 *       {
 *         "id": number;
 *         "name": string;
 *         "status": ("available"|"pending"|"sold");
 *       }
 *     ```
 *
 * ```bash
 * curl -X GET "https://petstore3.swagger.io/api/v3/pet/123" \
 *   -H "accept: application/json"
 * ```
 */
export const getPetById = (petId: string) => `/pet/${petId}`;

/**
 * **Method**: `POST`
 * **Summary**: Add a new pet to the store
 */
export const addPet = "/pet";
````

#### Object Format

````typescript
// endpoints.ts (with type: "object")
/**
 * **Method**: `POST`
 * **Summary**: Add a new pet to the store
 * **DTO**:
 *   ```typescript
 *     {
 *       "name": string;
 *       "photoUrls": string[];
 *       "status": ("available"|"pending"|"sold");
 *     }
 *   ```
 */
export const addPet = {
  method: "POST",
  operationId: "addPet",
  url: "/pet",
};

export const getPetById = {
  method: "GET",
  operationId: "getPetById",
  url: (petId: string) => `/pet/${petId}`,
};
````

### Generated Types

#### Endpoint Types

```typescript
// types/index.ts
import * as Shared from "./shared";

// Query parameter types
export type IFindPetsByStatusQuery = {
  status?: "available" | "pending" | "sold";
};

// Request body types (DTO)
export type IAddPetDTO = {
  id?: number;
  name: string;
  category?: Shared.ICategory;
  photoUrls: string[];
  tags?: Shared.ITag[];
  status?: "available" | "pending" | "sold";
};

// Response types
export type IGetPetById200Response = {
  id?: number;
  name: string;
  category?: Shared.ICategory;
  photoUrls: string[];
  tags?: Shared.ITag[];
  status?: "available" | "pending" | "sold";
};
```

#### Shared Component Types

```typescript
// types/shared.ts
/**
 * A category for a pet
 */
export type ICategory = {
  id?: number;
  name?: string;
};

/**
 * A tag for a pet
 */
export type ITag = {
  id?: number;
  name?: string;
};

export type IPet = {
  id?: number;
  name: string;
  category?: ICategory;
  photoUrls: string[];
  tags?: ITag[];
  status?: "available" | "pending" | "sold";
};
```

## API Reference

### Exported Functions

#### `Init(options?: { refetchInterval?: number }): Promise<void>`

Initializes OpenAPI sync with the specified configuration.

**Parameters:**

- `options.refetchInterval` - Override the refetch interval from config file

**Example:**

```typescript
import { Init } from "openapi-sync";

await Init({ refetchInterval: 10000 });
```

### Exported Types

All types from the `types.ts` file are available for import:

```typescript
import {
  IConfig,
  IOpenApiSpec,
  IOpenApSchemaSpec,
  IConfigReplaceWord,
} from "openapi-sync/types";
```

## Advanced Examples

### Multi-Environment Configuration

```typescript
// openapi.sync.ts
import { IConfig } from "openapi-sync/types";

const getConfig = (): IConfig => {
  const env = process.env.NODE_ENV || "development";

  const baseConfig: IConfig = {
    refetchInterval: env === "development" ? 5000 : 0,
    folder: "./src/api",
    api: {},
    types: {
      name: {
        prefix: "I",
        format: (source, data, defaultName) => {
          if (source === "endpoint" && data.type === "response") {
            return `${defaultName.replace(/Response$/, "")}Data`;
          }
          return defaultName;
        },
      },
    },
  };

  switch (env) {
    case "development":
      baseConfig.api = {
        "local-api": "http://localhost:3000/api/openapi.json",
      };
      break;
    case "staging":
      baseConfig.api = {
        "staging-api": "https://staging-api.example.com/openapi.json",
      };
      break;
    case "production":
      baseConfig.api = {
        "prod-api": "https://api.example.com/openapi.json",
      };
      break;
  }

  return baseConfig;
};

export default getConfig;
```

### Custom Type Formatting

```typescript
// Advanced type name formatting
const config: IConfig = {
  // ... other config
  types: {
    name: {
      prefix: "",
      format: (source, data, defaultName) => {
        if (source === "shared") {
          // Shared types: UserProfile, OrderStatus, etc.
          return `${data.name}`;
        } else if (source === "endpoint") {
          const method = data.method?.toUpperCase();
          const cleanPath = data.path
            ?.replace(/[{}\/]/g, "_")
            .replace(/_+/g, "_");

          switch (data.type) {
            case "query":
              return `${method}${cleanPath}Query`;
            case "dto":
              return `${method}${cleanPath}Request`;
            case "response":
              return `${method}${cleanPath}${data.code}Response`;
            default:
              return defaultName;
          }
        }
        return defaultName;
      },
    },
  },
};
```

### URL Transformation Rules

```typescript
const config: IConfig = {
  // ... other config
  endpoints: {
    value: {
      replaceWords: [
        // Remove API versioning from URLs
        {
          replace: "/api/v[0-9]+/",
          with: "/",
        },
        // Remove internal prefixes
        {
          replace: "/internal/",
          with: "/",
        },
        // Transform specific paths
        {
          replace: "/users/profile",
          with: "/profile",
        },
      ],
      includeServer: true,
      type: "object",
    },
    name: {
      format: ({ method, path, operationId }, defaultName) => {
        // Use operationId if available, otherwise generate from path
        if (operationId) {
          return operationId.replace(/[^a-zA-Z0-9]/g, "");
        }

        // Generate meaningful names from path and method
        const cleanPath = path
          .replace(/^\//, "")
          .replace(/\//g, "_")
          .replace(/{([^}]+)}/g, "By$1")
          .replace(/[^a-zA-Z0-9_]/g, "");

        return `${method.toLowerCase()}${cleanPath}`;
      },
    },
  },
};
```

### Integration with Build Process

#### Package.json Scripts

```json
{
  "scripts": {
    "api:sync": "openapi-sync",
    "api:sync:watch": "openapi-sync --refreshinterval 3000",
    "prebuild": "npm run api:sync",
    "build": "tsc",
    "dev": "concurrently \"npm run api:sync:watch\" \"npm run dev:server\""
  }
}
```

#### Pre-commit Hook

```bash
#!/bin/sh
# .husky/pre-commit

# Sync API types before commit
npm run api:sync

# Add generated files to commit
git add src/api/
```

#### CI/CD Integration

```yaml
# .github/workflows/build.yml
name: Build
on: [push, pull_request]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: "16"

      - name: Install dependencies
        run: npm ci

      - name: Sync API types
        run: npm run api:sync
        env:
          NODE_ENV: production

      - name: Build
        run: npm run build
```

### Error Handling and Monitoring

```typescript
import { Init } from "openapi-sync";

const initializeAPIWithRetry = async (maxRetries = 3) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await Init({
        refetchInterval: process.env.NODE_ENV === "development" ? 5000 : 0,
      });

      console.log("✅ API types synchronized successfully");
      return;
    } catch (error) {
      console.error(`❌ Attempt ${attempt} failed:`, error.message);

      if (attempt === maxRetries) {
        console.error("🚨 Failed to sync API types after all retries");
        throw error;
      }

      // Wait before retry
      await new Promise((resolve) => setTimeout(resolve, 2000 * attempt));
    }
  }
};

// Usage in your app
initializeAPIWithRetry().catch((error) => {
  // Handle critical error - maybe use cached types or exit
  console.error("Critical: Could not sync API types", error);
  process.exit(1);
});
```

## Troubleshooting

### Common Issues

#### 1. Configuration File Not Found

```
Error: No config found
```

**Solution:** Ensure you have one of these files in your project root:

- `openapi.sync.json`
- `openapi.sync.ts`
- `openapi.sync.js`

#### 2. Network Timeout Errors

```
Error: timeout of 60000ms exceeded
```

**Solution:** The tool includes automatic retry with exponential backoff. If issues persist:

- Check your internet connection
- Verify the OpenAPI spec URL is accessible
- Consider increasing timeout in your configuration

#### 3. TypeScript Compilation Errors

```
Error: Cannot find module './src/api/petstore/types'
```

**Solution:**

- Ensure the sync process completed successfully
- Check that the `folder` path in config is correct
- Verify TypeScript can resolve the generated paths

#### 4. Invalid OpenAPI Specification

```
Error: Schema validation failed
```

**Solution:**

- Validate your OpenAPI spec using online validators
- Check for syntax errors in YAML/JSON
- Ensure the spec follows OpenAPI 3.0+ standards

### Performance Optimization

#### 1. Reduce Refetch Frequency

```json
{
  "refetchInterval": 30000 // Increase to 30 seconds
}
```

#### 2. Disable Documentation Generation

```json
{
  "types": { "doc": { "disable": true } },
  "endpoints": { "doc": { "disable": true } }
}
```

#### 3. Use Specific Output Folders

```json
{
  "folder": "./src/api" // Specific path instead of root
}
```

### Debugging

#### Enable Verbose Logging

```typescript
// Set environment variable for debugging
process.env.DEBUG = "openapi-sync:*";

import { Init } from "openapi-sync";
await Init();
```

#### Check Generated State

The tool maintains state in `db.json` to track changes:

```json
// db.json
{
  "petstore": {
    "openapi": "3.0.0",
    "info": { "title": "Petstore API" }
    // ... full OpenAPI spec
  }
}
```

### Getting Help

1. **Check the Issues**: [GitHub Issues](https://github.com/akintomiwa-fisayo/openapi-sync/issues)
2. **Create a Bug Report**: Include your configuration and error logs
3. **Feature Requests**: Describe your use case and expected behavior

---

## License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

## Contributing

Contributions are welcome! Please read our contributing guidelines and submit pull requests to our GitHub repository.
