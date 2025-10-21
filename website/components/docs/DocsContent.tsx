"use client";

import CodeBlock from "./CodeBlock";

export default function DocsContent() {
  return (
    <div className="prose prose-gray dark:prose-invert max-w-none prose-headings:text-gray-900 dark:prose-headings:text-white prose-h1:text-gray-900 dark:prose-h1:text-white prose-h2:text-gray-900 dark:prose-h2:text-white prose-h3:text-gray-900 dark:prose-h3:text-white prose-h4:text-gray-900 dark:prose-h4:text-white prose-p:text-gray-600 dark:prose-p:text-gray-300 prose-strong:text-gray-900 dark:prose-strong:text-white prose-code:text-gray-900 dark:prose-code:text-white">
      {/* Introduction */}
      <section id="introduction" className="mb-16">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
          Documentation
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-300 mb-6">
          OpenAPI Sync is a powerful developer tool that automates the
          generation of TypeScript types, runtime validation schemas (Zod, Yup,
          Joi), and endpoint definitions from your OpenAPI specifications in
          real-time.
        </p>
        <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-600 dark:border-red-500 p-4 rounded">
          <p className="text-sm text-gray-700 dark:text-gray-300 mb-0">
            <strong>Latest Version:</strong> 4.0.0 - Now with Zod, Yup & Joi
            validation support
          </p>
        </div>
      </section>

      {/* Installation */}
      <section id="installation" className="mb-16">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          Installation
        </h2>
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          Install OpenAPI Sync using your preferred package manager:
        </p>
        <CodeBlock
          code={`# NPM
npm install openapi-sync

# Yarn
yarn add openapi-sync

# PNPM
pnpm add openapi-sync

# Global Installation
npm install -g openapi-sync

# Direct Usage (No Installation)
npx openapi-sync`}
          language="bash"
        />
      </section>

      {/* Quick Start */}
      <section id="quick-start" className="mb-16">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          Quick Start
        </h2>

        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
          1. Create Configuration
        </h3>
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          Create a configuration file in your project root:
        </p>
        <CodeBlock
          code={`// openapi.sync.json
{
  "refetchInterval": 5000,
  "folder": "./src/api",
  "api": {
    "petstore": "https://petstore3.swagger.io/api/v3/openapi.json"
  }
}`}
          language="json"
        />

        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 mt-6">
          2. Run Sync Command
        </h3>
        <CodeBlock code={`npx openapi-sync`} language="bash" />

        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 mt-6">
          3. Use Generated Code
        </h3>
        <CodeBlock
          code={`import { getPetById } from "./src/api/petstore/endpoints";
import { IPet } from "./src/api/petstore/types";

// Use the endpoint URL
const petUrl = getPetById("123"); // Returns: "/pet/123"

// Use the generated types
const pet: IPet = {
  id: 1,
  name: "Fluffy",
  status: "available"
};`}
          language="typescript"
        />
      </section>

      {/* Basic Configuration */}
      <section id="basic-config" className="mb-16">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          Basic Configuration
        </h2>
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          OpenAPI Sync supports multiple configuration formats:
        </p>
        <ul className="list-disc pl-6 mb-4 text-gray-600 dark:text-gray-300">
          <li>
            <code>openapi.sync.json</code> - JSON format
          </li>
          <li>
            <code>openapi.sync.ts</code> - TypeScript format
          </li>
          <li>
            <code>openapi.sync.js</code> - JavaScript format
          </li>
        </ul>

        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 mt-6">
          Configuration Options
        </h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 border border-gray-200 dark:border-gray-700 rounded-lg">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Property
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Type
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Description
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              <tr className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <td className="px-4 py-3 text-sm font-mono text-gray-900 dark:text-white">
                  refetchInterval
                </td>
                <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                  number
                </td>
                <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                  Milliseconds between API refetches (dev only)
                </td>
              </tr>
              <tr className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <td className="px-4 py-3 text-sm font-mono text-gray-900 dark:text-white">
                  folder
                </td>
                <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                  string
                </td>
                <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                  Output directory for generated files
                </td>
              </tr>
              <tr className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <td className="px-4 py-3 text-sm font-mono text-gray-900 dark:text-white">
                  api
                </td>
                <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                  Record&lt;string, string&gt;
                </td>
                <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                  Map of API names to OpenAPI spec URLs
                </td>
              </tr>
              <tr className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <td className="px-4 py-3 text-sm font-mono text-gray-900 dark:text-white">
                  server
                </td>
                <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                  number | string
                </td>
                <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                  Server index or custom server URL
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Folder Splitting */}
      <section id="folder-splitting" className="mb-16">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          Folder Splitting
        </h2>
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          Organize your generated code into folders based on tags or custom
          logic.
        </p>

        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
          Split by Tags
        </h3>
        <CodeBlock
          code={`folderSplit: {
  byTags: true  // Creates folders like admin/, user/, pet/
}`}
          language="typescript"
        />

        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 mt-6">
          Custom Folder Logic
        </h3>
        <CodeBlock
          code={`folderSplit: {
  customFolder: ({ method, path, tags, operationId }) => {
    // Admin endpoints go to admin folder
    if (tags?.includes("admin")) return "admin";
    
    // API versioning
    if (path.startsWith("/api/v1/")) return "v1";
    if (path.startsWith("/api/v2/")) return "v2";
    
    // Method-based organization
    if (method === "GET") return "read";
    if (method === "POST" || method === "PUT") return "write";
    
    return null; // Use default structure
  }
}`}
          language="typescript"
        />

        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 mt-6">
          Generated Structure
        </h3>
        <CodeBlock
          code={`src/api/
├── petstore/
│   ├── admin/
│   │   ├── endpoints.ts
│   │   └── types.ts
│   ├── user/
│   │   ├── endpoints.ts
│   │   └── types.ts
│   └── pet/
│       ├── endpoints.ts
│       └── types.ts
└── shared.ts`}
          language="text"
        />
      </section>

      {/* Validation Schemas */}
      <section id="validation-schemas" className="mb-16">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          Validation Schemas
        </h2>
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          Generate runtime validation schemas using Zod, Yup, or Joi from your
          OpenAPI specification.
        </p>

        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
          Configuration
        </h3>
        <CodeBlock
          code={`validations: {
  library: "zod",  // "zod" | "yup" | "joi"
  generate: {
    query: true,   // Generate query parameter validations
    dto: true      // Generate request body validations
  },
  name: {
    prefix: "I",
    suffix: "Schema",
    useOperationId: true
  }
}`}
          language="typescript"
        />

        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 mt-6">
          Installation
        </h3>
        <CodeBlock
          code={`# For Zod
npm install zod

# For Yup
npm install yup

# For Joi
npm install joi`}
          language="bash"
        />

        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 mt-6">
          Usage Example
        </h3>
        <CodeBlock
          code={`import { IAddPetDTOSchema } from "./src/api/petstore/validation";
import { z } from "zod";

// Validate request body
try {
  const validatedData = IAddPetDTOSchema.parse(req.body);
  // Data is now validated and typed
} catch (error) {
  if (error instanceof z.ZodError) {
    console.error("Validation errors:", error.errors);
  }
}`}
          language="typescript"
        />

        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 mt-6">
          Express Middleware
        </h3>
        <CodeBlock
          code={`import { Request, Response, NextFunction } from "express";
import { z } from "zod";

export const validate = <T extends z.ZodTypeAny>(schema: T) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          error: "Validation failed",
          details: error.errors
        });
      }
    }
  };
};

// Usage
import { IAddPetDTOSchema } from "./api/validation";
router.post("/pet", validate(IAddPetDTOSchema), handler);`}
          language="typescript"
        />
      </section>

      {/* Custom Code Preservation */}
      <section id="custom-code" className="mb-16">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          Custom Code Preservation
        </h2>
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          Add your own custom code that will survive when files are regenerated.
        </p>

        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
          Configuration
        </h3>
        <CodeBlock
          code={`customCode: {
  enabled: true,              // Enable custom code preservation
  position: "bottom",         // "top" | "bottom" | "both"
  markerText: "CUSTOM CODE",  // Custom marker text
  includeInstructions: true   // Include helpful instructions
}`}
          language="typescript"
        />

        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 mt-6">
          Usage
        </h3>
        <CodeBlock
          code={`// endpoints.ts (after generation)
export const getPet = (petId: string) => \`/pet/\${petId}\`;

// 🔒 CUSTOM CODE START
// Add your custom code here - it will be preserved
export const legacyGetPet = (id: string) => \`/api/v1/pet/\${id}\`;

export const buildPetUrl = (petId: string, includePhotos: boolean) => {
  const base = getPet(petId);
  return includePhotos ? \`\${base}?include=photos\` : base;
};
// 🔒 CUSTOM CODE END

export const updatePet = (petId: string) => \`/pet/\${petId}\`;`}
          language="typescript"
        />
      </section>

      {/* Endpoint Filtering */}
      <section id="endpoint-filtering" className="mb-16">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          Endpoint Filtering
        </h2>
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          Control which endpoints are included in code generation.
        </p>

        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
          Exclude Endpoints
        </h3>
        <CodeBlock
          code={`endpoints: {
  exclude: {
    // Exclude by tags
    tags: ["deprecated", "internal"],
    
    // Exclude specific endpoints
    endpoints: [
      { path: "/admin/users", method: "DELETE" },
      { regex: "^/internal/.*", method: "GET" },
      { path: "/debug" }  // All methods
    ]
  }
}`}
          language="typescript"
        />

        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 mt-6">
          Include Only Specific Endpoints
        </h3>
        <CodeBlock
          code={`endpoints: {
  include: {
    // Include only public endpoints
    tags: ["public"],
    
    // Include specific endpoints
    endpoints: [
      { path: "/public/users", method: "GET" },
      { regex: "^/public/.*" }
    ]
  }
}`}
          language="typescript"
        />
      </section>

      {/* CLI Usage */}
      <section id="cli-usage" className="mb-16">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          CLI Usage
        </h2>
        <CodeBlock
          code={`# Run with default configuration
npx openapi-sync

# Run with custom refetch interval
npx openapi-sync --refreshinterval 30000
npx openapi-sync -ri 30000

# Get help
npx openapi-sync --help`}
          language="bash"
        />
      </section>

      {/* Programmatic Usage */}
      <section id="programmatic-usage" className="mb-16">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          Programmatic Usage
        </h2>
        <CodeBlock
          code={`import { Init } from "openapi-sync";

// Initialize with default config
await Init();

// Initialize with custom options
await Init({
  refetchInterval: 30000
});

// With error handling
try {
  await Init({
    refetchInterval: process.env.NODE_ENV === "development" ? 5000 : 0
  });
  console.log("API types synchronized successfully");
} catch (error) {
  console.error("Failed to sync API types:", error);
}`}
          language="typescript"
        />
      </section>

      {/* Troubleshooting */}
      <section id="troubleshooting" className="mb-16">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          Troubleshooting
        </h2>

        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
          Configuration File Not Found
        </h3>
        <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-600 dark:border-red-500 p-4 rounded mb-4">
          <p className="text-sm text-gray-900 dark:text-white mb-2">
            <strong>Error:</strong> No config found
          </p>
          <p className="text-sm text-gray-700 dark:text-gray-300">
            <strong>Solution:</strong> Ensure you have one of these files in
            your project root:
            <code className="text-gray-900 dark:text-white bg-gray-200 dark:bg-gray-800 px-1 rounded">
              openapi.sync.json
            </code>
            ,{" "}
            <code className="text-gray-900 dark:text-white bg-gray-200 dark:bg-gray-800 px-1 rounded">
              openapi.sync.ts
            </code>
            , or{" "}
            <code className="text-gray-900 dark:text-white bg-gray-200 dark:bg-gray-800 px-1 rounded">
              openapi.sync.js
            </code>
          </p>
        </div>

        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 mt-6">
          Network Timeout Errors
        </h3>
        <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-600 dark:border-red-500 p-4 rounded mb-4">
          <p className="text-sm text-gray-900 dark:text-white mb-2">
            <strong>Error:</strong> timeout of 60000ms exceeded
          </p>
          <p className="text-sm text-gray-700 dark:text-gray-300">
            <strong>Solution:</strong> The tool includes automatic retry with
            exponential backoff. Check your internet connection and verify the
            OpenAPI spec URL is accessible.
          </p>
        </div>

        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 mt-6">
          TypeScript Compilation Errors
        </h3>
        <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-600 dark:border-red-500 p-4 rounded mb-4">
          <p className="text-sm text-gray-900 dark:text-white mb-2">
            <strong>Error:</strong> Cannot find module
            &apos;./src/api/petstore/types&apos;
          </p>
          <p className="text-sm text-gray-700 dark:text-gray-300">
            <strong>Solution:</strong> Ensure the sync process completed
            successfully and check that the folder path in config is correct.
          </p>
        </div>
      </section>

      {/* API Reference */}
      <section id="api-reference" className="mb-16">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          API Reference
        </h2>

        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
          Init(options?: InitOptions)
        </h3>
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          Initializes OpenAPI sync with the specified configuration.
        </p>
        <CodeBlock
          code={`import { Init } from "openapi-sync";

await Init({ 
  refetchInterval: 10000 
});`}
          language="typescript"
        />

        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 mt-6">
          Exported Types
        </h3>
        <CodeBlock
          code={`import {
  IConfig,
  IOpenApiSpec,
  IOpenApSchemaSpec,
  IConfigReplaceWord,
  IConfigExclude,
  IConfigInclude,
  IConfigDoc
} from "openapi-sync/types";`}
          language="typescript"
        />
      </section>

      {/* Changelog */}
      <section id="changelog" className="mb-16">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          Changelog
        </h2>
        <div className="space-y-4">
          <div className="border-l-4 border-red-600 dark:border-red-500 pl-4">
            <h4 className="font-semibold text-gray-900 dark:text-white">
              v4.0.0
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Major release with validation schema generation support (Zod, Yup,
              Joi)
            </p>
          </div>
          <div className="border-l-4 border-gray-300 dark:border-gray-700 pl-4">
            <h4 className="font-semibold text-gray-900 dark:text-white">
              v2.1.13
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Fix dts type fixes and Clean up tsup build config and introduction
              of unit testing
            </p>
          </div>
          <div className="border-l-4 border-gray-300 dark:border-gray-700 pl-4">
            <h4 className="font-semibold text-gray-900 dark:text-white">
              v2.1.11
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Folder splitting configuration for organized code generation
            </p>
          </div>
          <div className="border-l-4 border-gray-300 dark:border-gray-700 pl-4">
            <h4 className="font-semibold text-gray-900 dark:text-white">
              v2.1.10
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              OperationId-based naming for types and endpoints, enhanced
              filtering and tag support
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
