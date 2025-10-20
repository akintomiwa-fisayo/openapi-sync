[![NPM Version](https://img.shields.io/npm/v/openapi-sync.svg)](https://www.npmjs.com/package/openapi-sync)
[![License](https://img.shields.io/npm/l/openapi-sync.svg)](https://github.com/akintomiwa-fisayo/openapi-sync/blob/main/LICENSE)
[![Tests](https://img.shields.io/badge/tests-passing-brightgreen.svg)](https://github.com/akintomiwa-fisayo/openapi-sync)

**OpenAPI Sync** is a powerful developer tool that automates the synchronization of your API documentation with your codebase using OpenAPI (formerly Swagger) specifications. It generates TypeScript types, endpoint definitions, and comprehensive documentation from your OpenAPI schema, ensuring your API documentation stays up-to-date with your code.

## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Configuration](#configuration)
- [Usage](#usage)
- [Generated Output](#generated-output)
- [Custom Code Injection](#custom-code-injection)
- [Validation Schemas](#validation-schemas)
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
- Exclude/include endpoints by exact path or regex patterns
- Tag-based filtering, method-specific filtering, and pattern matching
- Folder splitting configuration for organized code generation
- OperationId-based naming for better type and endpoint names
- Flexible output directory structure with custom folder organization
- URL transformation and text replacement rules
- Configurable documentation generation
- Support for multiple API specifications
- Custom code injection, preserve your custom code between regenerations

### 🛡️ **Enterprise Ready**

- Network error handling with exponential backoff retry
- Schema validation using Redocly OpenAPI Core
- State persistence to track changes
- Environment-aware (disables auto-sync in production)
- TypeScript support with full type safety

### 🔐 **Runtime Validation Support**

- Generate runtime validation schemas using Zod, Yup, or Joi
- Automatically create validation schemas from OpenAPI specifications
- Support for all OpenAPI data types and constraints
- Format validations (email, uuid, url, datetime, etc.)
- Min/max constraints for strings, numbers, and arrays
- Pattern matching and enum validations
- Validation files generated alongside type files
- Flexible naming with prefix, suffix, and custom formatting

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

  // NEW: Folder splitting configuration
  folderSplit: {
    byTags: true, // Create folders based on endpoint tags
    customFolder: ({ method, path, tags, operationId }) => {
      // Custom logic to determine folder structure
      if (tags?.includes("admin")) return "admin";
      if (tags?.includes("public")) return "public";
      if (path.startsWith("/api/v1/")) return "v1";
      return null; // Use default folder structure
    },
  },

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
    exclude: {
      // Exclude endpoints by tags
      tags: ["deprecated", "internal"],
      // Exclude individual endpoints by path and method
      endpoints: [
        // Exact path match
        { path: "/admin/users", method: "DELETE" },
        // Regex pattern match
        { regex: "^/internal/.*", method: "GET" },
        { regex: ".*/debug$", method: "GET" },
        // Don't specify method to exclude all methods
        { path: "/debug/logs" },
      ],
    },
    include: {
      // Include endpoints by tags
      tags: ["public"],
      // Include individual endpoints by path and method
      endpoints: [
        // Exact path match
        { path: "/public/users", method: "GET" },
        // Regex pattern match
        { regex: "^/public/.*", method: "GET" },
        { regex: ".*/logs$", method: "GET" },
        // Don't specify method to include all methods
        { path: "/public/logs" },
      ],
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
| `folderSplit`     | `IConfigFolderSplit`     | Configuration for folder splitting            | -        |

#### Type Configuration (`types`)

| Property              | Type       | Description                                             |
| --------------------- | ---------- | ------------------------------------------------------- |
| `name.prefix`         | `string`   | Prefix for generated type names                         |
| `name.useOperationId` | `boolean`  | Use OpenAPI operationId for type naming when available  |
| `name.format`         | `function` | Custom naming function with source context and metadata |
| `doc.disable`         | `boolean`  | Disable JSDoc generation for types                      |

**OperationId-based Type Naming:**

When `useOperationId` is set to `true`, the system will use the OpenAPI `operationId` for type naming:

- **Query Types**: `{operationId}Query` (e.g., `getUserByIdQuery`)
- **DTO Types**: `{operationId}DTO` (e.g., `createUserDTO`)
- **Response Types**: `{operationId}{code}Response` (e.g., `getUserById200Response`)

If `operationId` is not available, the system falls back to the default path-based naming convention.

#### Endpoint Configuration (`endpoints`)

| Property              | Type                                                      | Description                                               |
| --------------------- | --------------------------------------------------------- | --------------------------------------------------------- |
| `value.replaceWords`  | `IConfigReplaceWord[]`                                    | URL transformation rules                                  |
| `value.includeServer` | `boolean`                                                 | Include server URL in endpoints                           |
| `value.type`          | `"string" \| "object"`                                    | Output format for endpoints                               |
| `name.prefix`         | `string`                                                  | Prefix for endpoint names                                 |
| `name.useOperationId` | `boolean`                                                 | Use OpenAPI operationId for naming                        |
| `name.format`         | `function`                                                | Custom naming function for endpoints                      |
| `doc.disable`         | `boolean`                                                 | Disable JSDoc generation for endpoints                    |
| `doc.showCurl`        | `boolean`                                                 | Include cURL examples in documentation                    |
| `exclude.tags`        | `string[]`                                                | Exclude endpoints by tags                                 |
| `exclude.endpoints`   | `Array<{path?: string, regex?: string, method?: Method}>` | Exclude specific endpoints by exact path or regex pattern |
| `include.tags`        | `string[]`                                                | Include endpoints by tags                                 |
| `include.endpoints`   | `Array<{path?: string, regex?: string, method?: Method}>` | Include specific endpoints by exact path or regex pattern |

#### Folder Splitting Configuration (`folderSplit`)

| Property       | Type       | Description                                   |
| -------------- | ---------- | --------------------------------------------- |
| `byTags`       | `boolean`  | Create folders based on endpoint tags         |
| `customFolder` | `function` | Custom function to determine folder structure |

**Folder Splitting Examples:**

```typescript
// Split by tags - creates folders like "admin/", "public/", "user/"
folderSplit: {
  byTags: true,
}

// Custom folder logic
folderSplit: {
  customFolder: ({ method, path, tags, operationId }) => {
    // Admin endpoints go to admin folder
    if (tags?.includes("admin")) return "admin";

    // Public endpoints go to public folder
    if (tags?.includes("public")) return "public";

    // API versioning
    if (path.startsWith("/api/v1/")) return "v1";
    if (path.startsWith("/api/v2/")) return "v2";

    // Method-based organization
      const method = data.method.toLowerCase();
    if (method === "get") return "read";
    if (method === "post" || method === "PUT") return "write";

    return null; // Use default structure
  },
}
```

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

### Default Structure

```
src/api/
├── petstore/
│   ├── endpoints.ts      # Endpoint URLs and metadata
│   └── types.ts          # Endpoint-specific types
├── auth-api/
│    ├── endpoints.ts     # Endpoint URLs and metadata
│    └── types.ts         # Endpoint-specific types
└── shared.ts             # Shared component types
```

### Folder Splitting Structure

When `folderSplit.byTags` is enabled or custom folder logic is used:

```
src/api/
├── petstore/
│   ├── admin/                # Endpoints with "admin" tag
│   │   ├── endpoints.ts
│   │   └── types.ts
│   ├── public/               # Endpoints with "public" tag
│   │   ├── endpoints.ts
│   │   └── types.ts
│   └── user/                 # Endpoints with "user" tag
│       ├── endpoints.ts
│       └── types.ts
│── auth-api/
│   ├── v1/                   # Custom folder logic
│   │   ├── endpoints.ts
│   │   └── types.ts
│   └── v2/
│       ├── endpoints.ts
│       └── types.ts
└── shared.ts             # Shared component types
```

### Generated Endpoints

When `endpoints.value.type` is set to `"string"`

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

When `endpoints.value.type` is set to `"object"`, each endpoint is generated as an object containing metadata:

````typescript
// endpoints.ts (with type: "object")
/**
 * **Method**: `POST`
 * **Summary**: Add a new pet to the store
 * **Tags**: [pet]
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
  tags: ["pet"],
};

export const getPetById = {
  method: "GET",
  operationId: "getPetById",
  url: (petId: string) => `/pet/${petId}`,
  tags: ["pet"],
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

## Custom Code Injection

OpenAPI Sync supports preserving custom code between regenerations using special comment markers. This allows you to add your own custom endpoints, types, or utility functions that will survive when the generated code is updated.

### How It Works

Custom code is preserved using special comment markers in the generated files. Any code you add between these markers will be preserved when the files are regenerated.

### Configuration

Add the `customCode` configuration to your `openapi.sync.ts` file:

```typescript
import { IConfig } from "openapi-sync/types";

export default {
  refetchInterval: 5000,
  folder: "./src/api",
  api: {
    petstore: "https://petstore3.swagger.io/api/v3/openapi.json",
  },
  customCode: {
    enabled: true, // Enable custom code preservation (default: true)
    position: "bottom", // Position of custom code: "top", "bottom", or "both"
    markerText: "CUSTOM CODE", // Custom marker text (default: "CUSTOM CODE")
    includeInstructions: true, // Include helpful instructions (default: true)
  },
} as IConfig;
```

### Configuration Options

| Option                | Type                          | Default         | Description                                |
| --------------------- | ----------------------------- | --------------- | ------------------------------------------ |
| `enabled`             | `boolean`                     | `true`          | Enable or disable custom code preservation |
| `position`            | `"top" \| "bottom" \| "both"` | `"bottom"`      | Where to place custom code markers         |
| `markerText`          | `string`                      | `"CUSTOM CODE"` | Custom text for markers                    |
| `includeInstructions` | `boolean`                     | `true`          | Include helpful instructions in markers    |

### Usage Example

After running OpenAPI Sync for the first time, your generated files will include custom code markers:

**endpoints.ts**

```typescript
// AUTO-GENERATED FILE - DO NOT EDIT OUTSIDE CUSTOM CODE MARKERS
export const getPet = (petId: string) => `/pet/${petId}`;
export const createPet = "/pet";
export const updatePet = (petId: string) => `/pet/${petId}`;

// ============================================================
// 🔒 CUSTOM CODE START
// Add your custom code above this line
// This section will be preserved during regeneration
// ============================================================

// ============================================================
// 🔒 CUSTOM CODE END
// ============================================================
```

### Adding Custom Code

Simply add your custom code between the markers:

**endpoints.ts**

```typescript
export const getPet = (petId: string) => `/pet/${petId}`;
export const createPet = "/pet";

// ============================================================
// 🔒 CUSTOM CODE START
// ============================================================

// Custom endpoints for legacy API
export const legacyGetPet = (petId: string) => `/api/v1/pet/${petId}`;
export const customSearch = "/api/search";

// Custom utility function
export const buildPetUrl = (petId: string, includePhotos: boolean) => {
  const base = getPet(petId);
  return includePhotos ? `${base}?include=photos` : base;
};

// ============================================================
// 🔒 CUSTOM CODE END
// ============================================================

export const updatePet = (petId: string) => `/pet/${petId}`;
```

### Custom Types

You can also add custom types in the `types.ts` and `shared.ts` files:

**types.ts**

```typescript
import * as Shared from "./shared";

export type IGetPetByIdResponse = Shared.IPet;
export type ICreatePetDTO = {
  name: string;
  status?: "available" | "pending" | "sold";
};

// ============================================================
// 🔒 CUSTOM CODE START
// ============================================================

// Custom type extending generated types
export interface IPetWithMetadata extends Shared.IPet {
  fetchedAt: Date;
  cached: boolean;
}

// Custom utility type
export type PartialPet = Partial<Shared.IPet>;

// Custom enum
export enum PetStatus {
  Available = "available",
  Pending = "pending",
  Sold = "sold",
}

// ============================================================
// 🔒 CUSTOM CODE END
// ============================================================
```

### Position Options

#### Bottom Position (Default)

Custom code markers appear at the bottom of the file:

```typescript
// Generated code...
export const endpoint1 = "/api/v1";

// 🔒 CUSTOM CODE START
// Your custom code here
// 🔒 CUSTOM CODE END
```

#### Top Position

Custom code markers appear at the top of the file:

```typescript
// 🔒 CUSTOM CODE START
// Your custom code here
// 🔒 CUSTOM CODE END

// Generated code...
export const endpoint1 = "/api/v1";
```

#### Both Positions

Custom code markers appear at both top and bottom:

```typescript
// 🔒 CUSTOM CODE START (TOP)
// Top custom code
// 🔒 CUSTOM CODE END

// Generated code...

// 🔒 CUSTOM CODE START (BOTTOM)
// Bottom custom code
// 🔒 CUSTOM CODE END
```

### Best Practices

1. **Don't Edit Outside Markers**: Only add code between the custom code markers. Code outside these markers will be overwritten.

2. **Use Descriptive Names**: Use clear, descriptive names for your custom code to avoid conflicts with generated code.

3. **Keep It Organized**: Group related custom code together and add comments explaining its purpose.

4. **Test After Regeneration**: After regenerating, verify your custom code is still present and working correctly.

5. **Version Control**: Commit your custom code changes separately from regeneration to track what's custom vs generated.

### Use Cases

#### Legacy API Support

```typescript
// 🔒 CUSTOM CODE START
// Support for legacy v1 API that's not in OpenAPI spec
export const legacyLogin = "/api/v1/auth/login";
export const legacyLogout = "/api/v1/auth/logout";
// 🔒 CUSTOM CODE END
```

#### Custom Utilities

```typescript
// 🔒 CUSTOM CODE START
// Utility functions for working with generated endpoints
export const isPublicEndpoint = (endpoint: string): boolean => {
  return endpoint.startsWith("/public/");
};

export const requiresAuth = (endpoint: string): boolean => {
  return !isPublicEndpoint(endpoint);
};
// 🔒 CUSTOM CODE END
```

#### Type Extensions

```typescript
// 🔒 CUSTOM CODE START
// Extended types with additional client-side fields
export interface IUserWithUI extends Shared.IUser {
  isLoading?: boolean;
  hasError?: boolean;
  lastFetched?: Date;
}
// 🔒 CUSTOM CODE END
```

### Disabling Custom Code Preservation

If you want to disable custom code preservation (not recommended for most use cases):

```typescript
export default {
  // ... other config
  customCode: {
    enabled: false, // Disables custom code preservation
  },
} as IConfig;
```

⚠️ **Warning**: When disabled, all files will be completely overwritten on each regeneration.

## Validation Schemas

OpenAPI Sync can automatically generate runtime validation schemas using **Zod**, **Yup**, or **Joi** from your OpenAPI specification. This feature enables runtime validation of API requests, responses, and data structures in any JavaScript/TypeScript environment (frontend, backend, testing, etc.).

### Configuration

Add the `validations` configuration to your `openapi.sync.ts` file:

```typescript
import { IConfig } from "openapi-sync/types";

const config: IConfig = {
  refetchInterval: 5000,
  folder: "./src/api",
  api: {
    petstore: "https://petstore3.swagger.io/api/v3/openapi.json",
  },

  // Enable validation schema generation
  validations: {
    disable: false, // Enable validation (default: false)
    library: "zod", // Validation library: "zod" | "yup" | "joi"

    // Optionally specify which types to generate validations for
    generate: {
      query: true, // Generate query parameter validations (default: true)
      dto: true, // Generate request body validations (default: true)
    },

    name: {
      prefix: "I", // Prefix for schema names (default: "I")
      suffix: "Schema", // Suffix for schema names (default: "Schema")
      useOperationId: true, // Use operationId from OpenAPI spec
      format: (source, data, defaultName) => {
        // Optional: Custom naming function
        if (source === "shared") {
          return `${data.name}`;
        }
        return defaultName;
      },
    },
  },
};

export default config;
```

### Installation

When using validation schemas, you need to install your chosen validation library as a peer dependency:

```bash
# For Zod
npm install zod

# For Yup
npm install yup

# For Joi
npm install joi
```

**Note:** All three validation libraries (Zod, Yup, and Joi) are fully supported.

### Generated Files

When validation is enabled, `validation.ts` files are generated alongside your `types.ts` files:

#### Without Folder Splitting

```
src/api/
├── petstore/
│   ├── endpoints.ts
│   └── types/
│       ├── index.ts              # TypeScript types
│       ├── shared.ts             # Shared component types
│       └── validation.ts         # Validation schemas (NEW!)
```

#### With Folder Splitting

```
src/api/
├── petstore/
│   ├── pet/
│   │   ├── endpoints.ts
│   │   ├── types.ts
│   │   └── validation.ts         # Validation for pet endpoints (NEW!)
│   └── store/
│       ├── endpoints.ts
│       ├── types.ts
│       └── validation.ts         # Validation for store endpoints (NEW!)
```

### Generated Validation Schemas

OpenAPI Sync generates validation schemas that mirror your OpenAPI specification. The syntax depends on your chosen library.

**Note:** When a validation schema references shared components (like `Category` or `Tag` from `#/components/schemas`), the shared schema is automatically resolved and inlined directly into the validation file. This means you don't need to manage separate `shared.validation.ts` files or import statements—everything is self-contained in each `validation.ts` file.

#### Zod Example

```typescript
// src/api/petstore/types/validation.ts
import { z } from "zod";

// Query parameter validation
export const IFindPetsByStatusQuerySchema = z.object({
  status: z.enum(["available", "pending", "sold"]).optional(),
});

// Request body (DTO) validation
// Note: Shared schemas like Category and Tag are automatically inlined
export const IAddPetDTOSchema = z.object({
  id: z.number().int().optional(),
  name: z.string().min(1),
  category: z
    .object({
      id: z.number().int().optional(),
      name: z.string().optional(),
    })
    .optional(),
  photoUrls: z.array(z.string()),
  tags: z
    .array(
      z.object({
        id: z.number().int().optional(),
        name: z.string().optional(),
      })
    )
    .optional(),
  status: z.enum(["available", "pending", "sold"]).optional(),
});

// Response validation
export const IGetPetById200ResponseSchema = z.object({
  id: z.number().int().optional(),
  name: z.string(),
  category: z
    .object({
      id: z.number().int().optional(),
      name: z.string().optional(),
    })
    .optional(),
  photoUrls: z.array(z.string()),
  tags: z
    .array(
      z.object({
        id: z.number().int().optional(),
        name: z.string().optional(),
      })
    )
    .optional(),
  status: z.enum(["available", "pending", "sold"]).optional(),
});
```

#### Yup Example

```typescript
// src/api/petstore/types/validation.ts
import * as yup from "yup";

// Shared schemas are automatically inlined
export const IAddPetDTOSchema = yup.object({
  id: yup.number().integer().optional(),
  name: yup.string().min(1),
  category: yup
    .object({
      id: yup.number().integer().optional(),
      name: yup.string().optional(),
    })
    .optional(),
  photoUrls: yup.array().of(yup.string()),
  tags: yup
    .array()
    .of(
      yup.object({
        id: yup.number().integer().optional(),
        name: yup.string().optional(),
      })
    )
    .optional(),
  status: yup.mixed().oneOf(["available", "pending", "sold"]).optional(),
});
```

#### Joi Example

```typescript
// src/api/petstore/types/validation.ts
import Joi from "joi";

// Shared schemas are automatically inlined
export const IAddPetDTOSchema = Joi.object({
  id: Joi.number().integer().optional(),
  name: Joi.string().min(1),
  category: Joi.object({
    id: Joi.number().integer().optional(),
    name: Joi.string().optional(),
  }).optional(),
  photoUrls: Joi.array().items(Joi.string()),
  tags: Joi.array()
    .items(
      Joi.object({
        id: Joi.number().integer().optional(),
        name: Joi.string().optional(),
      })
    )
    .optional(),
  status: Joi.valid("available", "pending", "sold").optional(),
});
```

### Selective Validation Generation

Validation schemas are generated **only for queries and DTOs**. Response validation is not supported as it's typically only needed for testing and adds unnecessary overhead.

#### Default Behavior (Query and DTO)

```typescript
const config: IConfig = {
  // ... other config
  validations: {
    library: "zod",
    // By default: query ✅, dto ✅
    // No need to specify generate config for default behavior
  },
};
```

This default is ideal for:

- **Backend APIs**: Validate incoming requests (queries and DTOs)
- **Frontend Applications**: Validate forms and query parameters
- **Performance**: Focused validation for what matters most

#### Generate Only Query Validations

```typescript
const config: IConfig = {
  // ... other config
  validations: {
    library: "zod",
    generate: {
      query: true,
      dto: false, // Disable DTO validation
    },
  },
};
```

#### Generate Only DTOs

```typescript
const config: IConfig = {
  // ... other config
  validations: {
    library: "yup",
    generate: {
      query: false,
      dto: true, // Only validate request bodies
    },
  },
};
```

### Supported Validations

OpenAPI Sync automatically converts OpenAPI constraints to validation library equivalents. Below are examples using Zod syntax:

#### String Validations

- **format: email** → `z.string().email()`
- **format: uuid** → `z.string().uuid()`
- **format: uri** → `z.string().url()`
- **format: date-time** → `z.string().datetime()`
- **format: date** → `z.string().date()`
- **minLength** → `z.string().min(n)`
- **maxLength** → `z.string().max(n)`
- **pattern** → `z.string().regex(/pattern/)`

#### Number Validations

- **type: integer** → `z.number().int()`
- **minimum** → `z.number().min(n)`
- **maximum** → `z.number().max(n)`
- **exclusiveMinimum** → `z.number().gt(n)`
- **exclusiveMaximum** → `z.number().lt(n)`

#### Array Validations

- **items** → `z.array(itemSchema)`
- **minItems** → `z.array().min(n)`
- **maxItems** → `z.array().max(n)`

#### Object Validations

- **properties** → `z.object({...})`
- **additionalProperties** → `z.record(valueSchema)`
- **required** → Required fields (no `.optional()`)

#### Complex Types

- **enum** → `z.enum([...])`
- **enum (nullable)** → `z.enum([...]).nullable()` - Automatically merges enum values with null
- **anyOf** → `z.union([...])` - Smart detection for nullable enums
- **oneOf** → `z.union([...])`
- **allOf** → `z.intersection().merge()`
- **nullable** → `.nullable()`

**Note on Nullable Enums**: OpenAPI specs often represent nullable enums as `anyOf` with separate enum schemas (e.g., `[{enum: ["A", "B"]}, {enum: [null]}]`). OpenAPI Sync automatically detects this pattern and generates clean enum schemas like `z.enum(["A", "B"]).nullable()` instead of complex unions.

**Example:**

```yaml
# OpenAPI Schema
anyOf:
  - enum: ["DAYS", "WEEKS", "MONTHS"]
  - enum: [""]
  - enum: [null]
```

```typescript
// ✅ Generated (Clean)
z.enum(["DAYS", "WEEKS", "MONTHS", ""]).nullable();

// ❌ NOT Generated (Messy)
z.union([z.enum(["DAYS", "WEEKS", "MONTHS"]), z.enum([""]), z.enum([null])]);
```

### Usage Examples

#### Express Middleware

```typescript
import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { IAddPetDTOSchema } from "./src/api/petstore/types/validation";
import { IAddPetDTO } from "./src/api/petstore/types";

// Basic validation middleware
export const validateAddPet = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    IAddPetDTOSchema.parse(req.body);
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: "Validation failed",
        details: error.errors,
      });
    } else {
      next(error);
    }
  }
};

// Use in routes
import { Router } from "express";
import { addPet } from "./src/api/petstore/endpoints";

const router = Router();

router.post(addPet, validateAddPet, async (req, res) => {
  const pet = req.body as IAddPetDTO;
  // Your business logic here
  res.status(201).json({ success: true });
});
```

#### Express Middleware with Yup

```typescript
import { Request, Response, NextFunction } from "express";
import * as yup from "yup";
import { IAddPetDTOSchema } from "./src/api/petstore/types/validation";

export const validateAddPetYup = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    await IAddPetDTOSchema.validate(req.body);
    next();
  } catch (error) {
    if (error instanceof yup.ValidationError) {
      res.status(400).json({
        error: "Validation failed",
        details: error.errors,
      });
    } else {
      next(error);
    }
  }
};
```

#### Express Middleware with Joi

```typescript
import { Request, Response, NextFunction } from "express";
import { IAddPetDTOSchema } from "./src/api/petstore/types/validation";

export const validateAddPetJoi = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { error } = IAddPetDTOSchema.validate(req.body);

  if (error) {
    res.status(400).json({
      error: "Validation failed",
      details: error.details.map((detail) => ({
        field: detail.path.join("."),
        message: detail.message,
      })),
    });
  } else {
    next();
  }
};
```

#### Generic Validation Helper

```typescript
import { z } from "zod";
import { Request, Response, NextFunction } from "express";

// Generic validation middleware factory
export const validate = <T extends z.ZodTypeAny>(schema: T) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          error: "Validation failed",
          details: error.errors.map((err) => ({
            field: err.path.join("."),
            message: err.message,
          })),
        });
      } else {
        next(error);
      }
    }
  };
};

// Usage
import { IAddPetDTOSchema } from "./src/api/petstore/types/validation";
router.post("/pet", validate(IAddPetDTOSchema), async (req, res) => {
  // req.body is now validated
});
```

#### Query Parameter Validation

```typescript
import { IFindPetsByStatusQuerySchema } from "./src/api/petstore/types/validation";

router.get("/pets", async (req, res) => {
  try {
    const query = IFindPetsByStatusQuerySchema.parse(req.query);
    // query is now validated and typed
    const pets = await findPets(query);
    res.json(pets);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: "Invalid query parameters" });
    }
  }
});
```

#### Response Validation (for testing)

```typescript
import { IGetPetById200ResponseSchema } from "./src/api/petstore/types/validation";

describe("GET /pet/:id", () => {
  it("should return a valid pet", async () => {
    const response = await request(app).get("/pet/123");

    // Validate response against schema
    expect(() =>
      IGetPetById200ResponseSchema.parse(response.body)
    ).not.toThrow();
  });
});
```

#### Safe Parsing

```typescript
import { IAddPetDTOSchema } from "./src/api/petstore/types/validation";

// Use safeParse for non-throwing validation
const result = IAddPetDTOSchema.safeParse(req.body);

if (result.success) {
  const pet = result.data; // Typed and validated
  // Process pet
} else {
  console.error("Validation errors:", result.error.errors);
  res.status(400).json({ errors: result.error.errors });
}
```

#### Type Inference

```typescript
import { IAddPetDTOSchema } from "./src/api/petstore/types/validation";

// Infer TypeScript type from Zod schema
type AddPetDTO = z.infer<typeof IAddPetDTOSchema>;

// This is equivalent to importing IAddPetDTO
```

### Advanced Configuration

#### With Folder Splitting

```typescript
const config: IConfig = {
  folder: "./src/api",
  api: {
    petstore: "https://petstore3.swagger.io/api/v3/openapi.json",
  },

  // Organize by tags
  folderSplit: {
    byTags: true,
  },

  // Validation works seamlessly with folder splitting
  validations: {
    library: "zod",
    name: {
      useOperationId: true,
    },
  },
};
```

Each folder will have its own `validation.ts` file with schemas automatically inlined:

```typescript
// src/api/petstore/pet/validation.ts
import { z } from "zod";

export const IAddPetDTOSchema = z.object({
  // Pet-specific validation schemas with shared types inlined
  name: z.string(),
  category: z
    .object({
      id: z.number().int().optional(),
      name: z.string().optional(),
    })
    .optional(),
});
```

#### With Custom Validation Naming

```typescript
const config: IConfig = {
  // ... other config
  validations: {
    library: "zod",
    name: {
      prefix: "",
      suffix: "Validator",
      useOperationId: true,
      format: (source, data, defaultName) => {
        // Custom naming for validation schemas
        if (source === "shared") {
          return `${data.name}Validation`;
        }
        return defaultName;
      },
    },
  },
  types: {
    name: {
      prefix: "I",
      useOperationId: true,
    },
  },
};
```

### Best Practices

1. **Always validate user input**: Use validation middleware on all endpoints that accept user data
2. **Validate at the edge**: Validate data as early as possible in your request pipeline
3. **Use safeParse for optional validation**: When you want to handle validation errors gracefully
4. **Validate responses in tests**: Ensure your API returns correctly shaped data
5. **Keep validation schemas in sync**: Re-run OpenAPI Sync when your API specification changes
6. **Type inference**: Use `z.infer<typeof Schema>` when you only need the type
7. **Error formatting**: Transform Zod errors into user-friendly messages for your API clients

### Limitations

- Validation schemas are regenerated on each sync (use custom code markers if you need to add custom validations)
- Some complex OpenAPI features may not have direct validation library equivalents across all libraries (e.g., `allOf` is handled differently in Zod, Yup, and Joi)
- For best results, ensure your OpenAPI schema includes detailed constraint information (min/max values, formats, patterns, etc.)

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
  IConfigExclude,
  IConfigInclude,
  IConfigDoc,
} from "openapi-sync/types";
```

## Advanced Examples

### Advanced Folder Splitting Configuration

```typescript
// openapi.sync.ts
import { IConfig } from "openapi-sync/types";

const config: IConfig = {
  refetchInterval: 5000,
  folder: "./src/api",
  api: {
    "main-api": "https://api.example.com/openapi.json",
  },

  // Advanced folder splitting with multiple strategies
  folderSplit: {
    byTags: true, // Enable tag-based splitting
    customFolder: ({ method, path, tags, operationId }) => {
      // Priority-based folder assignment

      // 1. Admin endpoints always go to admin folder
      if (tags?.includes("admin")) return "admin";

      // 2. Public API endpoints
      if (tags?.includes("public")) return "public";

      // 3. Version-based splitting
      if (path.startsWith("/api/v1/")) return "v1";
      if (path.startsWith("/api/v2/")) return "v2";

      // 4. Method-based organization for remaining endpoints
      if (method === "GET") return "read";
      if (method === "POST" || method === "PUT" || method === "PATCH")
        return "write";
      if (method === "DELETE") return "delete";

      // 5. OperationId-based splitting for specific operations
      if (operationId?.includes("Auth")) return "auth";
      if (operationId?.includes("User")) return "user";

      return null; // Use default structure
    },
  },

  // Enhanced type naming with operationId support
  types: {
    name: {
      prefix: "I",
      useOperationId: true, // Use operationId when available
      format: (source, data, defaultName) => {
        if (source === "endpoint" && data.operationId) {
          // Use operationId for better naming
          switch (data.type) {
            case "query":
              return `${data.operationId}Query`;
            case "dto":
              return `${data.operationId}DTO`;
            case "response":
              return `${data.operationId}${data.code}Response`;
          }
        }
        return defaultName;
      },
    },
  },

  // Enhanced endpoint configuration
  endpoints: {
    name: {
      useOperationId: true, // Use operationId for endpoint names
      format: ({ operationId, method, path }, defaultName) => {
        if (operationId) return operationId;
        return defaultName;
      },
    },
    exclude: {
      tags: ["deprecated", "internal"],
      endpoints: [
        { regex: "^/internal/.*" },
        { path: "/debug", method: "GET" },
      ],
    },
  },
};

export default config;
```

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
// Advanced type name formatting with operationId support
const config: IConfig = {
  // ... other config
  types: {
    name: {
      prefix: "",
      useOperationId: true, // Use operationId when available
      format: (source, data, defaultName) => {
        if (source === "shared") {
          // Shared types: UserProfile, OrderStatus, etc.
          return `${data.name}`;
        } else if (source === "endpoint") {
          // Use operationId if available and configured
          if (data.operationId) {
            switch (data.type) {
              case "query":
                return `${data.operationId}Query`;
              case "dto":
                return `${data.operationId}DTO`;
              case "response":
                return `${data.operationId}${data.code}Response`;
              default:
                return defaultName;
            }
          }

          // Fallback to path-based naming
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

### Endpoint Filtering and Selection

```typescript
// Advanced endpoint filtering configuration
const config: IConfig = {
  // ... other config
  endpoints: {
    // ... other endpoint config
    exclude: {
      // Exclude endpoints by tags
      tags: ["deprecated", "internal", "admin"],
      // Exclude specific endpoints by exact path or regex pattern
      endpoints: [
        // Exact path matches
        { path: "/admin/users", method: "DELETE" },
        { path: "/admin/settings", method: "PUT" },
        // Regex pattern matches
        { regex: "^/internal/.*", method: "GET" },
        { regex: ".*/debug$", method: "POST" },
        // Exclude all methods for a specific path
        { path: "/debug/logs" },
      ],
    },
    include: {
      // Include only public endpoints
      tags: ["public", "user"],
      // Include specific endpoints by exact path or regex pattern
      endpoints: [
        // Exact path matches
        { path: "/public/users", method: "GET" },
        { path: "/public/profile", method: "PUT" },
        // Regex pattern matches
        { regex: "^/public/.*", method: "GET" },
        { regex: ".*/health$", method: "GET" },
      ],
    },
  },
};
```

### Path vs Regex Filtering

```typescript
// Demonstrating the difference between path and regex filtering
const config: IConfig = {
  // ... other config
  endpoints: {
    exclude: {
      endpoints: [
        // Exact path match - only excludes exactly "/api/users"
        { path: "/api/users", method: "GET" },

        // Regex match - excludes all paths starting with "/api/users"
        { regex: "^/api/users.*", method: "GET" },

        // Regex match - excludes all paths ending with "/debug"
        { regex: ".*/debug$", method: "GET" },

        // Regex match - excludes paths with specific pattern
        { regex: "^/internal/.*/admin$", method: "POST" },
      ],
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

## Changelog

- v2.1.13: Fix dts type fixes and Clean up tsup build config and introduction of unit testing
- v2.1.12: Add automatic sync support for function-based config, improved handling of missing OpenAPI urls
- v2.1.11: Folder splitting configuration for organized code generation
- v2.1.10: OperationId-based naming for types and endpoints, enhanced filtering and tag support
- v2.1.9: Enhanced JSONStringify function improvements
- v2.1.8: File extension corrections and path handling
- v2.1.7: Endpoint tags support in API documentation
- v2.1.6: Improved handling of nullable fields in generated types
- v2.1.5: Fixed bug with recursive schema references
- v2.1.4: Enhanced error messages on invalid config
- v2.1.3: Add more informative debugging logs
- v2.1.2: Support enum descriptions in output
- v2.1.1: Update dependencies, minor TypeScript type fixes
- v2.1.0: Initial v2 major release with new sync engine
- v2.0.0: Major refactor and breaking changes for v2

## License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

## Contributing

Contributions are welcome! Please read our contributing guidelines and submit pull requests to our GitHub repository.
