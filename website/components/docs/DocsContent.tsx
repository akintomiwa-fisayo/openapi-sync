"use client";

import CodeBlock from "./CodeBlock";
import VideoTutorial from "./VideoTutorial";
import { getVideoTutorial } from "@/lib/videoTutorials";

export default function DocsContent() {
  const comingSoonId = "vmUVIqhZrHg";
  return (
    <div className="prose prose-gray dark:prose-invert max-w-none prose-headings:text-gray-900 dark:prose-headings:text-white prose-h1:text-gray-900 dark:prose-h1:text-white prose-h2:text-gray-900 dark:prose-h2:text-white prose-h3:text-gray-900 dark:prose-h3:text-white prose-h4:text-gray-900 dark:prose-h4:text-white prose-p:text-gray-600 dark:prose-p:text-gray-300 prose-strong:text-gray-900 dark:prose-strong:text-white prose-code:text-gray-900 dark:prose-code:text-white">
      {/* Introduction */}
      <section id="introduction" className="mb-16">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
          Documentation
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-300 mb-6">
          OpenAPI Sync is a powerful developer tool that automates the
          generation of TypeScript types, API clients (Fetch, Axios, React
          Query, SWR, RTK Query), runtime validation schemas (Zod, Yup, Joi),
          and endpoint definitions from your OpenAPI specifications in
          real-time.
        </p>
        <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-600 dark:border-red-500 p-4 rounded mb-6">
          <p className="text-sm text-gray-700 dark:text-gray-300 mb-0">
            <strong>Latest Version:</strong> 5.0.0 - Major improvements to
            client generation with bug fixes, better TypeScript support, and
            enhanced developer experience!
          </p>
        </div>

        <VideoTutorial
          videoId={getVideoTutorial("introduction")?.videoId || comingSoonId}
          title={
            getVideoTutorial("introduction")?.title ||
            "Getting Started with OpenAPI Sync"
          }
          description={getVideoTutorial("introduction")?.description}
          duration={getVideoTutorial("introduction")?.duration}
        />
      </section>

      {/* Installation */}
      <section id="installation" className="mb-16">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          Installation
        </h2>

        <VideoTutorial
          videoId={getVideoTutorial("installation")?.videoId || comingSoonId}
          title={
            getVideoTutorial("installation")?.title || "Installation & Setup"
          }
          description={getVideoTutorial("installation")?.description}
          duration={getVideoTutorial("installation")?.duration}
        />

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

        <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-600 dark:border-yellow-500 p-4 rounded mt-4">
          <p className="text-sm text-gray-700 dark:text-gray-300">
            <strong>⚠️ macOS Big Sur Users:</strong> If you encounter an esbuild
            installation error (
            <code className="text-xs bg-yellow-100 dark:bg-yellow-900/40 px-1 rounded">
              Symbol not found: _SecTrustCopyCertificateChain
            </code>
            ), please install esbuild@0.17.19 first:{" "}
            <code className="text-xs bg-yellow-100 dark:bg-yellow-900/40 px-1 rounded">
              npm install esbuild@0.17.19
            </code>{" "}
            then install openapi-sync. See{" "}
            <a
              href="#troubleshooting"
              className="text-yellow-700 dark:text-yellow-400 hover:underline font-semibold"
            >
              Troubleshooting
            </a>{" "}
            for details.
          </p>
        </div>
      </section>

      {/* Quick Start */}
      <section id="quick-start" className="mb-16">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          Quick Start
        </h2>

        <VideoTutorial
          videoId={getVideoTutorial("quickStart")?.videoId || comingSoonId}
          title={
            getVideoTutorial("quickStart")?.title || "Quick Start Tutorial"
          }
          description={getVideoTutorial("quickStart")?.description}
          duration={getVideoTutorial("quickStart")?.duration}
        />

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

        <VideoTutorial
          videoId={getVideoTutorial("basicConfig")?.videoId || comingSoonId}
          title={
            getVideoTutorial("basicConfig")?.title || "Basic Configuration"
          }
          description={getVideoTutorial("basicConfig")?.description}
          duration={getVideoTutorial("basicConfig")?.duration}
        />

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

        <VideoTutorial
          videoId={getVideoTutorial("folderSplitting")?.videoId || comingSoonId}
          title={
            getVideoTutorial("folderSplitting")?.title ||
            "Folder Splitting & Organization"
          }
          description={getVideoTutorial("folderSplitting")?.description}
          duration={getVideoTutorial("folderSplitting")?.duration}
        />

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

        <VideoTutorial
          videoId={
            getVideoTutorial("validationSchemas")?.videoId || comingSoonId
          }
          title={
            getVideoTutorial("validationSchemas")?.title ||
            "Runtime Validation with Zod, Yup & Joi"
          }
          description={getVideoTutorial("validationSchemas")?.description}
          duration={getVideoTutorial("validationSchemas")?.duration}
        />

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

        <VideoTutorial
          videoId={getVideoTutorial("customCode")?.videoId || comingSoonId}
          title={
            getVideoTutorial("customCode")?.title || "Custom Code Preservation"
          }
          description={getVideoTutorial("customCode")?.description}
          duration={getVideoTutorial("customCode")?.duration}
        />

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

        <VideoTutorial
          videoId={
            getVideoTutorial("endpointFiltering")?.videoId || comingSoonId
          }
          title={
            getVideoTutorial("endpointFiltering")?.title ||
            "Endpoint Filtering & Selection"
          }
          description={getVideoTutorial("endpointFiltering")?.description}
          duration={getVideoTutorial("endpointFiltering")?.duration}
        />

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

      {/* API Client Generation */}
      <section id="client-generation" className="mb-16">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          API Client Generation
        </h2>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          Automatically generate fully-typed API clients and hooks for popular
          libraries directly from your OpenAPI specifications.
        </p>

        <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-600 dark:border-blue-500 p-4 rounded mb-6">
          <p className="text-sm text-gray-700 dark:text-gray-300 mb-0">
            Generate clients for Fetch, Axios, React Query, SWR, and RTK Query
            with full TypeScript support!
          </p>
        </div>

        <VideoTutorial
          videoId={
            getVideoTutorial("clientGenerationOverview")?.videoId ||
            comingSoonId
          }
          title={
            getVideoTutorial("clientGenerationOverview")?.title ||
            "API Client Generation Overview"
          }
          description={
            getVideoTutorial("clientGenerationOverview")?.description
          }
          duration={getVideoTutorial("clientGenerationOverview")?.duration}
        />

        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
          Supported Client Types
        </h3>
        <ul className="list-disc pl-6 mb-6 text-gray-600 dark:text-gray-300">
          <li>
            <strong>fetch</strong> - Native browser Fetch API with TypeScript
            types
          </li>
          <li>
            <strong>axios</strong> - Axios client with interceptors and error
            handling
          </li>
          <li>
            <strong>react-query</strong> - React Query/TanStack Query hooks (v4
            & v5)
          </li>
          <li>
            <strong>swr</strong> - SWR hooks for React
          </li>
          <li>
            <strong>rtk-query</strong> - Redux Toolkit Query API slice
          </li>
        </ul>

        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
          Basic Usage
        </h3>
        <CodeBlock
          code={`# Generate Fetch client
npx openapi-sync generate-client --type fetch

# Generate Axios client
npx openapi-sync generate-client --type axios

# Generate React Query hooks
npx openapi-sync generate-client --type react-query

# Generate SWR hooks
npx openapi-sync generate-client --type swr

# Generate RTK Query API
npx openapi-sync generate-client --type rtk-query`}
          language="bash"
        />

        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 mt-6">
          Filter by Tags or Endpoints
        </h3>
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          Generate clients for specific endpoints only:
        </p>
        <CodeBlock
          code={`# Filter by tags
npx openapi-sync generate-client --type fetch --tags pets,users

# Filter by endpoint names
npx openapi-sync generate-client --type axios --endpoints getPetById,createPet

# Generate for specific API
npx openapi-sync generate-client --type react-query --api petstore

# Specify output directory
npx openapi-sync generate-client --type swr --output ./src/clients

# Set base URL
npx openapi-sync generate-client --type fetch --base-url https://api.example.com`}
          language="bash"
        />

        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 mt-6">
          React Query Example
        </h3>
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          Complete example using React Query hooks:
        </p>
        <CodeBlock
          code={`// 1. Generate the client
// npx openapi-sync generate-client --type react-query

// 2. Setup in your app
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import apiClient from "./api/petstore/client/client";

// Configure API client
apiClient.updateConfig({
  baseURL: "https://api.example.com",
  headers: {
    Authorization: "Bearer your-auth-token",
  },
});

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <YourComponent />
    </QueryClientProvider>
  );
}

// 3. Use in components
import { useGetPetById, useCreatePet } from "./api/petstore/client/hooks";

function PetDetails({ petId }: { petId: string }) {
  // Query hook for GET requests
  const { data, isLoading, error } = useGetPetById({ petId });

  // Mutation hook for POST/PUT/PATCH/DELETE
  const createPet = useCreatePet({
    onSuccess: (newPet) => {
      console.log("Pet created:", newPet);
    },
  });

  const handleCreate = () => {
    createPet.mutate({
      data: {
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
      <p>Status: {data?.status}</p>
      <button onClick={handleCreate}>Create New Pet</button>
    </div>
  );
}`}
          language="typescript"
        />

        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 mt-6">
          Fetch Client Example
        </h3>
        <CodeBlock
          code={`import { setApiConfig, getPetById, createPet } from "./api/petstore/client";

// Configure the client
setApiConfig({
  baseURL: "https://api.example.com",
  auth: { token: "your-token" },
  headers: {
    "X-Custom-Header": "value",
  },
});

// Use the client
async function fetchPet(petId: string) {
  try {
    const pet = await getPetById({ petId });
    console.log("Pet:", pet);
  } catch (error) {
    if (error instanceof ApiError) {
      console.error("API Error:", error.statusCode, error.response);
    }
  }
}

async function addNewPet() {
  const newPet = await createPet({
    data: {
      name: "Max",
      species: "dog",
      age: 3,
    },
  });
  console.log("Created:", newPet);
}`}
          language="typescript"
        />

        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 mt-6">
          Axios Client Example
        </h3>
        <CodeBlock
          code={`import apiClient from "./api/petstore/client";

// Configure the client
apiClient.updateConfig({
  baseURL: "https://api.example.com",
  timeout: 10000,
  headers: {
    "X-App-Version": "1.0.0",
    Authorization: "Bearer your-auth-token",
  },
});

// Use the client
async function example() {
  // GET request
  const pet = await apiClient.getPetById({ petId: "123" });
  
  // POST request
  const newPet = await apiClient.createPet({
    data: {
      name: "Buddy",
      species: "dog",
    },
  });
  
  // PUT request
  await apiClient.updatePet(
    { petId: "123" },
    { name: "Buddy Updated" }
  );
  
  // DELETE request
  await apiClient.deletePet({ petId: "123" });
}`}
          language="typescript"
        />

        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 mt-6">
          SWR Hooks Example
        </h3>
        <CodeBlock
          code={`import { useGetPetById, useCreatePet } from "./api/petstore/client/hooks";

function PetProfile({ petId }: { petId: string }) {
  // SWR automatically handles caching, revalidation, and more
  const { data, error, isLoading, mutate } = useGetPetById({ petId });

  const { trigger, isMutating } = useCreatePet();

  const handleCreate = async () => {
    try {
      const newPet = await trigger({
        arg: {
          data: {
            name: "Charlie",
            species: "cat",
          },
        },
      });
      // Revalidate the pet list
      mutate();
    } catch (err) {
      console.error("Failed to create pet:", err);
    }
  };

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error loading pet</div>;

  return (
    <div>
      <h2>{data?.name}</h2>
      <button onClick={handleCreate} disabled={isMutating}>
        {isMutating ? "Creating..." : "Create New Pet"}
      </button>
    </div>
  );
}`}
          language="typescript"
        />

        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 mt-6">
          RTK Query Example
        </h3>
        <CodeBlock
          code={`// 1. Setup store
import { configureStore } from "@reduxjs/toolkit";
import { apiApi } from "./api/petstore/client/api";

export const store = configureStore({
  reducer: {
    [apiApi.reducerPath]: apiApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(apiApi.middleware),
});

// 2. Use in components
import { useGetPetByIdQuery, useCreatePetMutation } from "./api/petstore/client/api";

function PetCard({ petId }: { petId: string }) {
  const { data, isLoading, error } = useGetPetByIdQuery({ 
    params: { petId } 
  });
  
  const [createPet, { isLoading: isCreating }] = useCreatePetMutation();

  const handleCreate = async () => {
    try {
      await createPet({
        data: {
          name: "Luna",
          species: "cat",
        },
      }).unwrap();
      alert("Pet created!");
    } catch (err) {
      console.error("Failed:", err);
    }
  };

  return (
    <div>
      {isLoading && <div>Loading...</div>}
      {error && <div>Error!</div>}
      {data && (
        <div>
          <h3>{data.name}</h3>
          <p>{data.species}</p>
        </div>
      )}
      <button onClick={handleCreate} disabled={isCreating}>
        Create Pet
      </button>
    </div>
  );
}`}
          language="typescript"
        />

        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 mt-6">
          Generated File Structure
        </h3>
        <CodeBlock
          code={`api/
└── petstore/
    ├── client/
    │   ├── client.ts      # Base API client
    │   ├── hooks.ts       # React Query/SWR hooks
    │   ├── api.ts         # RTK Query API (if applicable)
    │   ├── index.ts       # Exports
    │   └── README.md      # Usage documentation
    ├── endpoints.ts
    ├── types/
    │   ├── index.ts
    │   └── shared.ts
    └── validations.ts`}
          language="text"
        />

        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 mt-6">
          Configuration Options
        </h3>
        <CodeBlock
          code={`// openapi.sync.ts
import { IConfig } from "openapi-sync/types";

const config: IConfig = {
  folder: "./src/api",
  api: {
    petstore: "https://petstore3.swagger.io/api/v3/openapi.json",
  },
  // Client generation configuration
  clientGeneration: {
    enabled: true,
    type: "react-query",
    baseURL: "https://api.example.com",
    tags: ["pets", "users"],  // Optional: filter by tags
    endpoints: ["getPetById"], // Optional: specific endpoints
    auth: {
      type: "bearer",
      in: "header",
    },
    errorHandling: {
      generateErrorClasses: true,
    },
    reactQuery: {
      version: 5,
      mutations: true,
      infiniteQueries: false,
    },
  },
};

export default config;`}
          language="typescript"
        />

        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 mt-6">
          Custom Code Preservation
        </h3>
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          Generated clients preserve your custom code during regeneration:
        </p>
        <CodeBlock
          code={`// client.ts (Generated)

// Auto-generated client code...

// ============================================================
// 🔒 CUSTOM CODE START
// Add your custom code below this line
// This section will be preserved during regeneration
// ============================================================

// Your custom helper functions
export function buildPaginatedUrl(
  baseUrl: string,
  page: number,
  limit: number
) {
  return \`\${baseUrl}?page=\${page}&limit=\${limit}\`;
}

// Custom interceptors
export function setupCustomInterceptors() {
  // Your custom logic
}

// 🔒 CUSTOM CODE END
// ============================================================`}
          language="typescript"
        />

        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 mt-6">
          CLI Options Reference
        </h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 border border-gray-200 dark:border-gray-700 rounded-lg">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Option
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Description
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Example
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              <tr className="hover:bg-gray-50 dark:hover:bg-gray-800">
                <td className="px-4 py-3 text-sm font-mono text-gray-900 dark:text-white">
                  --type, -t
                </td>
                <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                  Client type to generate (required)
                </td>
                <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                  fetch, axios, react-query, swr, rtk-query
                </td>
              </tr>
              <tr className="hover:bg-gray-50 dark:hover:bg-gray-800">
                <td className="px-4 py-3 text-sm font-mono text-gray-900 dark:text-white">
                  --api, -a
                </td>
                <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                  Specific API from config
                </td>
                <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                  --api petstore
                </td>
              </tr>
              <tr className="hover:bg-gray-50 dark:hover:bg-gray-800">
                <td className="px-4 py-3 text-sm font-mono text-gray-900 dark:text-white">
                  --tags
                </td>
                <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                  Filter by endpoint tags
                </td>
                <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                  --tags pets,users
                </td>
              </tr>
              <tr className="hover:bg-gray-50 dark:hover:bg-gray-800">
                <td className="px-4 py-3 text-sm font-mono text-gray-900 dark:text-white">
                  --endpoints, -e
                </td>
                <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                  Filter by endpoint names
                </td>
                <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                  --endpoints getPetById,createPet
                </td>
              </tr>
              <tr className="hover:bg-gray-50 dark:hover:bg-gray-800">
                <td className="px-4 py-3 text-sm font-mono text-gray-900 dark:text-white">
                  --output, -o
                </td>
                <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                  Output directory
                </td>
                <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                  --output ./src/clients
                </td>
              </tr>
              <tr className="hover:bg-gray-50 dark:hover:bg-gray-800">
                <td className="px-4 py-3 text-sm font-mono text-gray-900 dark:text-white">
                  --base-url, -b
                </td>
                <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                  Base URL for requests
                </td>
                <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                  --base-url https://api.example.com
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* v5.0.0 Client Improvements */}
        <div className="bg-green-50 dark:bg-green-900/20 border-l-4 border-green-600 dark:border-green-500 p-4 rounded mb-6 mt-8">
          <p className="text-sm text-gray-700 dark:text-gray-300 mb-0">
            <strong>New in v5.0.0:</strong> All client generators now include
            comprehensive inline documentation, better ESLint compliance, and
            improved folder splitting support!
          </p>
        </div>

        <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4 mt-8">
          RTK Query Enhancements (v5.0.0)
        </h3>

        <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
          Simplified Redux Store Setup
        </h4>
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          When using folder splitting, RTK Query now generates an{" "}
          <code className="text-sm bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
            apis.ts
          </code>{" "}
          file with a helper object that makes Redux store configuration
          incredibly simple:
        </p>
        <CodeBlock
          code={`// Before v5.0.0 (Complex setup)
import { configureStore } from '@reduxjs/toolkit';
import { petsApi } from './pets/api';
import { usersApi } from './users/api';
import { ordersApi } from './orders/api';

export const store = configureStore({
  reducer: {
    [petsApi.reducerPath]: petsApi.reducer,
    [usersApi.reducerPath]: usersApi.reducer,
    [ordersApi.reducerPath]: ordersApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware()
      .concat(petsApi.middleware)
      .concat(usersApi.middleware)
      .concat(ordersApi.middleware),
});`}
          language="typescript"
        />
        <CodeBlock
          code={`// After v5.0.0 (Simple setup!)
import { configureStore } from '@reduxjs/toolkit';
import { setupApiStore } from './api/petstore/apis';

export const store = configureStore({
  reducer: setupApiStore.reducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(setupApiStore.middleware),
});

// That's it! All API slices are automatically configured ✨`}
          language="typescript"
        />

        <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 mt-6">
          Unique Reducer Paths
        </h4>
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          Each API slice now has a unique{" "}
          <code className="text-sm bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
            reducerPath
          </code>{" "}
          based on its folder name, preventing conflicts:
        </p>
        <CodeBlock
          code={`// Generated pets/api.ts
const petsApi = createApi({
  reducerPath: 'petsApi',  // ✅ Unique!
  // ...
});

// Generated users/api.ts
const usersApi = createApi({
  reducerPath: 'usersApi',  // ✅ Unique!
  // ...
});

// No more "Duplicate property" TypeScript errors!`}
          language="typescript"
        />

        <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 mt-6">
          Default Exports for Better Imports
        </h4>
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          API slices now export as default, making imports cleaner:
        </p>
        <CodeBlock
          code={`// Clean default import
import petsApi from './pets/api';
import { useGetPetsQuery } from './pets/api';

// Or use the aggregated apis.ts
import { petsApi, useGetPetsQuery } from './apis';`}
          language="typescript"
        />

        <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4 mt-8">
          SWR Improvements (v5.0.0)
        </h3>

        <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
          Fixed Mutation Type Errors
        </h4>
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          SWR mutation hooks now have correct TypeScript types, fixing the
          double-nesting issue:
        </p>
        <CodeBlock
          code={`// v5.0.0 - Correct types! ✅
export function useCreatePet(
  config?: SWRMutationConfiguration<
    Pet,
    Error,
    string,
    { data: PetRequest }  // Correct: single level
  >
) {
  return useSWRMutation(
    'createPet',
    async (_, { arg }: { arg: { data: PetRequest } }) => {
      return apiClient.createPet(arg);
    },
    config
  );
}

// Usage - works perfectly!
const { trigger } = useCreatePet();
await trigger({ arg: { data: { name: 'Fluffy' } } });`}
          language="typescript"
        />

        <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 mt-6">
          Comprehensive Inline Documentation
        </h4>
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          Every generated SWR hooks file now includes 230+ lines of usage
          examples and patterns:
        </p>
        <CodeBlock
          code={`/**
 * SWR Hooks - Complete Usage Guide
 * 
 * ## Quick Start
 * 
 * 1. Configure SWR globally:
 * \`\`\`typescript
 * <SWRConfig value={{ revalidateOnFocus: false }}>
 *   {children}
 * </SWRConfig>
 * \`\`\`
 * 
 * ## Examples
 * 
 * ### Reading Data (GET)
 * \`\`\`typescript
 * const { data, error, isLoading } = useGetPets();
 * \`\`\`
 * 
 * ### Creating Data (POST)
 * \`\`\`typescript
 * const { trigger, isMutating } = useCreatePet();
 * await trigger({ arg: { data: { name: 'Luna' } } });
 * \`\`\`
 * 
 * ### Optimistic Updates
 * \`\`\`typescript
 * revalidate({ ...data, name: newName }, false);
 * await trigger({ arg: { ... } });
 * await revalidate(); // Sync with server
 * \`\`\`
 * 
 * [... 200+ more lines of examples ...]
 */`}
          language="typescript"
        />

        <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4 mt-8">
          Fetch Client Fixes (v5.0.0)
        </h3>

        <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
          Fixed Naming Conflicts
        </h4>
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          Endpoint imports are now automatically aliased to prevent naming
          conflicts:
        </p>
        <CodeBlock
          code={`// Generated imports (aliased to avoid conflicts)
import {
  getPets as getPets_endpoint,
  getPetById as getPetById_endpoint,
  createPet as createPet_endpoint,
} from './endpoints';

// Generated functions (no conflict!)
export async function getPets() {
  const _url = getPets_endpoint;  // Uses aliased import
  return fetchAPI(_url, { method: 'GET' });
}

export async function getPetById(params: { url: { id: string } }) {
  const _url = getPetById_endpoint(params.url.id);  // Uses aliased import
  return fetchAPI(_url, { method: 'GET' });
}`}
          language="typescript"
        />

        <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 mt-6">
          ESLint-Compliant Default Exports
        </h4>
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          Default exports now use named variables, satisfying ESLint rules:
        </p>
        <CodeBlock
          code={`// v5.0.0 - ESLint compliant! ✅
const apiClient = {
  setApiConfig,
  getPets,
  getPetById,
  createPet,
};

export default apiClient;

// No more "Assign object to variable" ESLint warnings!`}
          language="typescript"
        />

        <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4 mt-8">
          File Organization Improvements (v5.0.0)
        </h3>

        <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
          Non-Folder-Split Mode
        </h4>
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          When folder splitting is disabled, files are now generated directly at
          the root level:
        </p>
        <CodeBlock
          code={`api/
└── petstore/
    ├── clients.ts       # All API client functions
    ├── hooks.ts         # All React Query/SWR hooks  
    ├── endpoints.ts     # Endpoint definitions
    ├── types.ts         # TypeScript types
    └── validations.ts   # Validation schemas

# Clean, simple structure for smaller APIs!`}
          language="text"
        />

        <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 mt-6">
          Folder-Split Mode
        </h4>
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          With folder splitting, each tag gets its own folder with complete
          isolation:
        </p>
        <CodeBlock
          code={`api/
└── petstore/
    ├── clients.ts       # Aggregates all clients (Fetch/Axios)
    ├── hooks.ts         # Aggregates all hooks (React Query/SWR)
    ├── apis.ts          # Aggregates all APIs (RTK Query) + setupApiStore
    ├── pets/
    │   ├── client.ts    # Pet-specific client
    │   ├── hooks.ts     # Pet-specific hooks
    │   ├── api.ts       # Pet-specific RTK Query API
    │   ├── types.ts     # Pet-specific types
    │   └── endpoints.ts # Pet-specific endpoints
    └── users/
        ├── client.ts
        ├── hooks.ts
        ├── api.ts
        ├── types.ts
        └── endpoints.ts

# Perfect for large APIs with many endpoints!`}
          language="text"
        />

        <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-600 dark:border-blue-500 p-4 rounded mt-6">
          <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
            <strong>💡 Migration Tip:</strong> To get all these improvements,
            simply regenerate your clients:
          </p>
          <CodeBlock
            code={`npx openapi-sync generate-client --type [your-type]`}
            language="bash"
          />
          <p className="text-sm text-gray-700 dark:text-gray-300 mt-2 mb-0">
            All improvements are backwards compatible - your existing code will
            continue to work!
          </p>
        </div>
      </section>

      {/* CLI Usage */}
      <section id="cli-usage" className="mb-16">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          CLI Usage
        </h2>

        <VideoTutorial
          videoId={getVideoTutorial("cliUsage")?.videoId || comingSoonId}
          title={
            getVideoTutorial("cliUsage")?.title || "CLI Commands & Options"
          }
          description={getVideoTutorial("cliUsage")?.description}
          duration={getVideoTutorial("cliUsage")?.duration}
        />

        <CodeBlock
          code={`# Sync API types and endpoints
npx openapi-sync

# Generate API client
npx openapi-sync generate-client --type react-query

# Run with custom refetch interval
npx openapi-sync --refreshinterval 30000
npx openapi-sync -ri 30000

# Get help
npx openapi-sync --help
npx openapi-sync generate-client --help`}
          language="bash"
        />

        <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4 mt-8">
          CLI Improvements (v5.0.0)
        </h3>

        <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
          CLI Arguments Override Config
        </h4>
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          CLI options now correctly override configuration file settings:
        </p>
        <CodeBlock
          code={`# Config file says type: "fetch"
# But CLI argument takes precedence:
npx openapi-sync generate-client --type rtk-query

# Result: Generates RTK Query (not Fetch) ✅

# This works for all options:
npx openapi-sync generate-client \\
  --type swr \\
  --base-url https://api.example.com \\
  --tags pets,users

# CLI values override config values!`}
          language="bash"
        />

        <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 mt-6">
          Streamlined Interactive Setup
        </h4>
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          The interactive setup wizard is now simpler - selecting folder
          splitting automatically enables tag-based organization:
        </p>
        <CodeBlock
          code={`# npx openapi-sync init

? Organize generated code into folders by OpenAPI tags? Yes
# ✅ Automatically enables byTags: true
# (No extra question needed!)

? Generate API client code? Yes
? Which client type would you like? React Query
# ... continues with setup`}
          language="bash"
        />
      </section>

      {/* Programmatic Usage */}
      <section id="programmatic-usage" className="mb-16">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          Programmatic Usage
        </h2>

        <VideoTutorial
          videoId={
            getVideoTutorial("programmaticUsage")?.videoId || comingSoonId
          }
          title={
            getVideoTutorial("programmaticUsage")?.title ||
            "Programmatic API Usage"
          }
          description={getVideoTutorial("programmaticUsage")?.description}
          duration={getVideoTutorial("programmaticUsage")?.duration}
        />

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

        <VideoTutorial
          videoId={getVideoTutorial("troubleshooting")?.videoId || comingSoonId}
          title={
            getVideoTutorial("troubleshooting")?.title ||
            "Common Issues & Troubleshooting"
          }
          description={getVideoTutorial("troubleshooting")?.description}
          duration={getVideoTutorial("troubleshooting")?.duration}
        />

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

        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 mt-6">
          macOS Big Sur (11.x) - esbuild Installation Error
        </h3>
        <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-600 dark:border-red-500 p-4 rounded mb-4">
          <p className="text-sm text-gray-900 dark:text-white mb-2">
            <strong>Error:</strong> dyld: Symbol not found:
            _SecTrustCopyCertificateChain
          </p>
          <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
            <strong>Cause:</strong> The default esbuild version requires macOS
            12.0+ APIs that aren&apos;t available in Big Sur (darwin 20.x).
          </p>
          <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
            <strong>Solution 1:</strong> Install compatible esbuild first:
          </p>
          <CodeBlock
            code={`# Install compatible esbuild first
npm install esbuild@0.17.19

# Then install openapi-sync
npm install openapi-sync`}
            language="bash"
          />
          <p className="text-sm text-gray-700 dark:text-gray-300 mt-3 mb-2">
            <strong>Solution 2:</strong> Add an override to your package.json:
          </p>
          <CodeBlock
            code={`{
  "overrides": {
    "esbuild": "0.17.19"
  }
}`}
            language="json"
          />
          <p className="text-sm text-gray-700 dark:text-gray-300 mt-3">
            <strong>Note:</strong> This issue only affects macOS Big Sur. Users
            on macOS 12+ are not affected and will get the latest esbuild
            version automatically.
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
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          Track the evolution of OpenAPI Sync with detailed release notes and
          version history.
        </p>

        <div className="space-y-6">
          {/* v5.0.0 - Latest */}
          <div className="border-l-4 border-green-600 dark:border-green-500 pl-4 bg-green-50 dark:bg-green-900/10 p-4 rounded-r">
            <div className="flex items-center gap-2 mb-2">
              <h4 className="font-bold text-lg text-gray-900 dark:text-white">
                v5.0.0
              </h4>
              <span className="px-2 py-1 text-xs font-semibold bg-green-600 text-white rounded-full">
                LATEST
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                October 25, 2025
              </span>
            </div>
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3">
              Major improvements to client generation with enhanced TypeScript
              support, better developer experience, and critical bug fixes
            </p>
            <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1 ml-4">
              <li>
                🎉 <strong>RTK Query:</strong> Simplified Redux store setup with
                setupApiStore helper (15 lines → 5 lines)
              </li>
              <li>
                ✅ <strong>RTK Query:</strong> Unique reducer paths per folder
                preventing TypeScript conflicts
              </li>
              <li>
                ✅ <strong>RTK Query:</strong> Default exports for cleaner
                imports
              </li>
              <li>
                ✅ <strong>SWR:</strong> Fixed mutation hooks type errors (no
                more double-nesting)
              </li>
              <li>
                📚 <strong>SWR:</strong> Added 230+ lines of comprehensive
                inline documentation and usage examples
              </li>
              <li>
                ✅ <strong>Fetch:</strong> Fixed naming conflicts with aliased
                endpoint imports (_endpoint suffix)
              </li>
              <li>
                ✅ <strong>Fetch:</strong> ESLint-compliant default exports
                using named variables
              </li>
              <li>
                🚀 <strong>CLI:</strong> Arguments now correctly override config
                file settings
              </li>
              <li>
                🎯 <strong>CLI:</strong> Streamlined interactive setup
                (auto-enables byTags when folder splitting)
              </li>
              <li>
                📦 <strong>Structure:</strong> Non-folder-split mode generates
                files directly at root (clients.ts, hooks.ts)
              </li>
              <li>
                🎨 <strong>DX:</strong> Better TypeScript support across all
                client types
              </li>
              <li>
                ⚡ <strong>Performance:</strong> Optimized code generation and
                improved error handling
              </li>
            </ul>
          </div>

          {/* v4.1.0 */}
          <div className="border-l-4 border-blue-600 dark:border-blue-500 pl-4">
            <div className="flex items-center gap-2 mb-2">
              <h4 className="font-semibold text-gray-900 dark:text-white">
                v4.1.0
              </h4>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                2024
              </span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              API Client Generation - Generate fully-typed clients for Fetch,
              Axios, React Query, SWR, and RTK Query with custom code
              preservation
            </p>
          </div>

          {/* v4.0.0 */}
          <div className="border-l-4 border-red-600 dark:border-red-500 pl-4">
            <div className="flex items-center gap-2 mb-2">
              <h4 className="font-semibold text-gray-900 dark:text-white">
                v4.0.0
              </h4>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                2024
              </span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Major release with validation schema generation support (Zod, Yup,
              Joi) for runtime type validation
            </p>
          </div>

          {/* v2.1.13 */}
          <div className="border-l-4 border-gray-300 dark:border-gray-700 pl-4">
            <div className="flex items-center gap-2 mb-2">
              <h4 className="font-semibold text-gray-900 dark:text-white">
                v2.1.13
              </h4>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Type definition fixes, clean up tsup build configuration, and
              introduction of comprehensive unit testing
            </p>
          </div>

          {/* v2.1.11 */}
          <div className="border-l-4 border-gray-300 dark:border-gray-700 pl-4">
            <div className="flex items-center gap-2 mb-2">
              <h4 className="font-semibold text-gray-900 dark:text-white">
                v2.1.11
              </h4>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Folder splitting configuration for organized code generation by
              tags or custom logic
            </p>
          </div>

          {/* v2.1.10 */}
          <div className="border-l-4 border-gray-300 dark:border-gray-700 pl-4">
            <div className="flex items-center gap-2 mb-2">
              <h4 className="font-semibold text-gray-900 dark:text-white">
                v2.1.10
              </h4>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              OperationId-based naming for types and endpoints, enhanced
              filtering and tag support
            </p>
          </div>
        </div>

        <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-600 dark:border-blue-500 p-4 rounded">
          <p className="text-sm text-gray-700 dark:text-gray-300">
            <strong>📖 Full Changelog:</strong> For complete release notes and
            detailed changes, visit the{" "}
            <a
              href="/changelog"
              className="text-blue-600 dark:text-blue-400 hover:underline font-semibold"
            >
              dedicated Changelog page
            </a>
            .
          </p>
        </div>
      </section>
    </div>
  );
}
