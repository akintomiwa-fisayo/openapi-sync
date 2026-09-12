# OpenAPI Sync - Complete Video Tutorial Script

## Opening (0:00 - 0:30)

**[Screen: Terminal/VS Code]**

"Hi! Welcome to OpenAPI Sync - a powerful developer tool that automates the synchronization between your API documentation and your codebase. If you're tired of manually writing TypeScript types, API client code, and validation schemas, this tool is for you."

"In this video, I'll show you every feature OpenAPI Sync offers - from basic setup to advanced client generation. Let's dive in!"

---

## Section 1: What is OpenAPI Sync? (0:30 - 1:15)

**[Screen: Show OpenAPI Sync website or README]**

"OpenAPI Sync takes your OpenAPI specification - also known as Swagger - and automatically generates:

- TypeScript interfaces and types
- Type-safe API clients for Fetch, Axios, React Query, SWR, and RTK Query
- Runtime validation schemas using Zod, Yup, or Joi
- Endpoint definitions
- And comprehensive documentation with JSDoc comments

The best part? It keeps everything synchronized in real-time, so when your API changes, your code updates automatically."

**[Visual: Show diagram or flow: OpenAPI Spec → OpenAPI Sync → Generated Code]**

---

## Section 2: Installation (1:15 - 1:45)

**[Screen: Terminal]**

"Installation is straightforward. You have three options:"

**[Type the following commands, one at a time]**

```bash
# Install locally in your project
npm install openapi-sync

# Or install globally
npm install -g openapi-sync

# Or use directly without installation
npx openapi-sync
```

"For this tutorial, I'll use npx to run it directly."

---

## Section 3: Interactive Setup Wizard (1:45 - 3:30)

**[Screen: Terminal in project directory]**

"The easiest way to get started is with the interactive setup wizard. Let's run it:"

```bash
npx openapi-sync init
```

**[Show the interactive prompts and fill them in]**

"The wizard walks you through all the configuration options:

1. **Configuration file format** - You can choose TypeScript, JSON, or JavaScript. I'll select TypeScript for better type safety.

2. **API specification source** - You can use a remote URL or a local file. I'll use the Petstore API for this demo: https://petstore3.swagger.io/api/v3/openapi.json

3. **Output folder** - Where should the generated code go? I'll use ./src/api

4. **Folder organization** - Should files be split by tags? This is great for large APIs. I'll enable this.

5. **Client generation** - Do you want to generate API client code? Absolutely! I'll select React Query, but we'll explore all client types later.

6. **Validation library** - Should we generate validation schemas? Yes! I'll choose Zod.

7. **Custom code preservation** - This lets you add your own code that survives regeneration. Very useful!

8. **Type naming preferences** - You can add prefixes or use operation IDs for naming.

9. **Endpoint filtering** - Want to exclude certain endpoints or tags? You can configure that here.

10. **Documentation options** - Include cURL examples in your generated code? Definitely helpful!"

**[Show the generated openapi.sync.ts file]**

"And just like that, we have our configuration file ready!"

---

## Section 4: Running the Sync (3:30 - 4:30)

**[Screen: Terminal]**

"Now let's run the sync command to generate our code:"

```bash
npx openapi-sync
```

**[Show the console output with progress messages]**

"Watch as OpenAPI Sync fetches the specification, validates it, and generates all the code."

**[Show the generated folder structure in VS Code]**

```
src/api/
├── petstore/
│   ├── pet/
│   │   ├── types.ts
│   │   ├── endpoints.ts
│   │   └── validation.ts
│   ├── store/
│   │   ├── types.ts
│   │   ├── endpoints.ts
│   │   └── validation.ts
│   └── user/
│       ├── types.ts
│       ├── endpoints.ts
│       └── validation.ts
```

"Notice how the code is organized by tags - pet, store, and user. This makes navigation incredibly easy for large APIs."

---

## Section 5: TypeScript Types (4:30 - 5:30)

**[Screen: Open types.ts file]**

"Let's look at the generated TypeScript types. OpenAPI Sync creates fully-typed interfaces from your OpenAPI schema."

**[Show example interface]**

```typescript
export interface IPet {
  id?: number;
  name: string;
  category?: ICategory;
  photoUrls: string[];
  tags?: ITag[];
  status?: "available" | "pending" | "sold";
}
```

"Notice:

- Optional properties are correctly marked with `?`
- Arrays are properly typed
- Enums become TypeScript union types
- Nested objects reference other interfaces
- Everything is fully typed with IntelliSense support!"

**[Demonstrate autocomplete in VS Code]**

---

## Section 6: Endpoint Definitions (5:30 - 6:15)

**[Screen: Open endpoints.ts file]**

"The generated endpoints file contains type-safe functions for building your API URLs:"

**[Show example]**

```typescript
/**
 * Get pet by ID
 * @param petId - ID of pet to return
 */
export const getPetById = (petId: string | number) => `/pet/${petId}`;

/**
 * Update an existing pet
 */
export const updatePet = () => `/pet`;
```

"These functions:

- Are type-safe with proper parameter types
- Include JSDoc documentation
- Handle URL path parameters
- Can include cURL examples in the comments"

**[Show usage example]**

```typescript
import { getPetById } from "./src/api/petstore/pet/endpoints";

const url = getPetById(123); // "/pet/123"
```

---

## Section 7: Runtime Validation Schemas (6:15 - 7:30)

**[Screen: Open validation.ts file]**

"One of the most powerful features is runtime validation schema generation. OpenAPI Sync supports Zod, Yup, and Joi."

**[Show Zod schema example]**

```typescript
import { z } from "zod";

export const IPetSchema = z.object({
  id: z.number().optional(),
  name: z.string().min(1),
  category: ICategorySchema.optional(),
  photoUrls: z.array(z.string()),
  tags: z.array(ITagSchema).optional(),
  status: z.enum(["available", "pending", "sold"]).optional(),
});
```

"All your OpenAPI constraints are preserved:

- Required fields
- String patterns and formats
- Number ranges (min, max)
- Array validations
- Nested object validation"

**[Show usage example]**

```typescript
import { IPetSchema } from "./src/api/petstore/pet/validation";

// Validate data at runtime
try {
  const validatedPet = IPetSchema.parse(incomingData);
  // Now you're 100% sure the data is valid!
} catch (error) {
  console.error("Validation failed:", error.errors);
}
```

"This is perfect for validating API responses or request bodies in your Express/Fastify middleware!"

---

## Section 8: API Client Generation - Overview (7:30 - 8:00)

**[Screen: Terminal]**

"Now let's explore one of the newest and most powerful features - automatic API client generation. OpenAPI Sync can generate fully-typed clients for five different libraries:

1. **Fetch** - Native browser Fetch API
2. **Axios** - Popular HTTP client
3. **React Query** - TanStack Query for React
4. **SWR** - React Hooks for data fetching
5. **RTK Query** - Redux Toolkit Query

Let me show you each one!"

---

## Section 9: Fetch Client (8:00 - 9:00)

**[Screen: Terminal]**

"First, let's generate a Fetch client:"

```bash
npx openapi-sync generate-client --type fetch
```

**[Show generated client.ts file]**

"The Fetch client includes:

- Type-safe API functions
- Automatic request/response handling
- Error handling with custom error classes
- Configuration for base URL and headers"

**[Show usage example]**

```typescript
import { setApiConfig, getPetById, createPet } from "./src/api/petstore/client";

// Configure once
setApiConfig({
  baseURL: "https://api.example.com",
  headers: {
    Authorization: "Bearer your-token",
  },
});

// Use anywhere
async function fetchPet() {
  try {
    const pet = await getPetById({ petId: "123" });
    console.log(pet.name); // Fully typed!
  } catch (error) {
    if (error instanceof ApiError) {
      console.error("API Error:", error.statusCode);
    }
  }
}
```

"Notice how everything is type-safe - petId parameter, response data, everything!"

---

## Section 10: Axios Client (9:00 - 9:45)

**[Screen: Terminal]**

"Next, let's generate an Axios client:"

```bash
npx openapi-sync generate-client --type axios
```

**[Show generated files]**

"The Axios client provides:

- Automatic instance configuration
- Request/response interceptors
- Timeout handling
- Full TypeScript support"

**[Show usage]**

```typescript
import apiClient from "./src/api/petstore/client";

// Configure the client
apiClient.updateConfig({
  baseURL: "https://api.example.com",
  timeout: 10000,
  headers: { "X-Api-Key": "your-key" },
});

// Make requests
const pet = await apiClient.getPetById({ petId: "123" });
const newPet = await apiClient.createPet({
  data: { name: "Fluffy", status: "available" },
});
```

"Perfect for Node.js backends or React apps!"

---

## Section 11: React Query Hooks (9:45 - 11:00)

**[Screen: Terminal]**

"React Query is one of the most popular data fetching libraries. Let's generate hooks:"

```bash
npx openapi-sync generate-client --type react-query
```

**[Show generated hooks.ts file]**

"You get fully-typed hooks for all your endpoints!"

**[Show React component example]**

```typescript
import { useGetPetById, useCreatePet } from "./src/api/petstore/client/hooks";

function PetDetails({ petId }: { petId: string }) {
  // Query hook for GET requests
  const { data, isLoading, error } = useGetPetById({
    url: { petId },
    query: { includePhotos: true },
  });

  // Mutation hook for POST/PUT/PATCH/DELETE
  const createPet = useCreatePet({
    onSuccess: (newPet) => {
      console.log("Pet created:", newPet);
    },
  });

  const handleCreate = () => {
    createPet.mutate({
      data: {
        name: "Max",
        photoUrls: ["https://example.com/photo.jpg"],
        status: "available",
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
}
```

"Everything is type-safe:

- Parameters are validated at compile time
- Response data is properly typed
- Mutations have correct argument types
- IntelliSense works everywhere!"

---

## Section 12: SWR Hooks (11:00 - 11:45)

**[Screen: Terminal]**

"SWR is another excellent data fetching library. Let's generate SWR hooks:"

```bash
npx openapi-sync generate-client --type swr
```

**[Show the massive inline documentation in v5.0.0]**

"In version 5.0, we added over 230 lines of comprehensive documentation to every generated SWR hooks file, with examples for every pattern!"

**[Show usage]**

```typescript
import { useGetPetById, useCreatePet } from "./src/api/petstore/client/hooks";

function PetCard({ petId }: { petId: string }) {
  // SWR handles caching, revalidation, and more automatically
  const { data, error, isLoading, mutate } = useGetPetById({ petId });

  const { trigger, isMutating } = useCreatePet();

  const handleCreate = async () => {
    const newPet = await trigger({
      arg: { data: { name: "Charlie", status: "available" } },
    });
    // Revalidate the data
    mutate();
  };

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error!</div>;

  return (
    <div>
      <h2>{data?.name}</h2>
      <button onClick={handleCreate} disabled={isMutating}>
        {isMutating ? "Creating..." : "Create New"}
      </button>
    </div>
  );
}
```

---

## Section 13: RTK Query (11:45 - 13:00)

**[Screen: Terminal]**

"Finally, Redux Toolkit Query. This one has some amazing improvements in version 5.0:"

```bash
npx openapi-sync generate-client --type rtk-query
```

**[Show generated api.ts files and apis.ts aggregator]**

"Version 5.0 introduces the `setupApiStore` helper that reduces Redux configuration from about 15 lines to just 5 lines!"

**[Show before and after comparison]**

```typescript
// Before v5.0 - Complex setup
import { configureStore } from "@reduxjs/toolkit";
import { petsApi } from "./pets/api";
import { usersApi } from "./users/api";

export const store = configureStore({
  reducer: {
    [petsApi.reducerPath]: petsApi.reducer,
    [usersApi.reducerPath]: usersApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware()
      .concat(petsApi.middleware)
      .concat(usersApi.middleware),
});

// After v5.0 - Simple setup! ✨
import { configureStore } from "@reduxjs/toolkit";
import { setupApiStore } from "./api/petstore/apis";

export const store = configureStore({
  reducer: setupApiStore.reducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(setupApiStore.middleware),
});
// That's it! All API slices are automatically configured
```

**[Show component usage]**

```typescript
import {
  useGetPetByIdQuery,
  useCreatePetMutation,
} from "./api/petstore/client/api";

function PetManager({ petId }: { petId: string }) {
  const { data, isLoading } = useGetPetByIdQuery({
    params: { petId },
  });

  const [createPet, { isLoading: isCreating }] = useCreatePetMutation();

  const handleCreate = async () => {
    try {
      await createPet({
        data: { name: "Luna", status: "available" },
      }).unwrap();
      alert("Pet created!");
    } catch (err) {
      console.error("Failed:", err);
    }
  };

  return (
    <div>
      {isLoading ? <div>Loading...</div> : <div>{data?.name}</div>}
      <button onClick={handleCreate} disabled={isCreating}>
        Create Pet
      </button>
    </div>
  );
}
```

"Each API slice also gets a unique reducer path based on its folder name, preventing TypeScript conflicts!"

---

## Section 14: Filtering and Customization (13:00 - 14:00)

**[Screen: Terminal]**

"You can filter which endpoints to generate clients for:"

```bash
# Generate client for specific tags only
npx openapi-sync generate-client --type fetch --tags pet,user

# Generate for specific endpoints
npx openapi-sync generate-client --type axios --endpoints getPetById,createPet

# Generate for a specific API (if you have multiple)
npx openapi-sync generate-client --type react-query --api petstore

# Custom output directory
npx openapi-sync generate-client --type swr --output ./src/clients

# Set base URL
npx openapi-sync generate-client --type fetch --base-url https://api.example.com
```

"This is perfect when you only need certain parts of a large API!"

---

## Section 15: Folder Splitting (14:00 - 15:00)

**[Screen: VS Code showing folder structure]**

"OpenAPI Sync offers powerful folder organization options. You can split by tags or use custom logic."

**[Show configuration]**

```typescript
// openapi.sync.ts
const config = {
  folderSplit: {
    byTags: true, // Split by OpenAPI tags
  },
};
```

"This creates organized folders like:"

```
api/petstore/
├── pet/
│   ├── types.ts
│   ├── endpoints.ts
│   ├── validation.ts
│   └── client.ts
├── user/
│   ├── types.ts
│   ├── endpoints.ts
│   └── validation.ts
└── store/
    ├── types.ts
    ├── endpoints.ts
    └── validation.ts
```

"Or you can use custom logic:"

```typescript
folderSplit: {
  customFolder: ({ method, path, tags, operationId }) => {
    if (tags?.includes("admin")) return "admin";
    if (path.startsWith("/api/v1/")) return "v1";
    if (path.startsWith("/api/v2/")) return "v2";
    if (method === "GET") return "read";
    if (method === "POST" || method === "PUT") return "write";
    return null;
  };
}
```

"You have complete control over how your code is organized!"

---

## Section 16: Custom Code Preservation (15:00 - 16:00)

**[Screen: Show generated file with custom code markers]**

"One of the most important features is custom code preservation. You can add your own code that survives regeneration."

**[Show the custom code markers]**

```typescript
// Generated endpoints
export const getPet = (petId: string) => `/pet/${petId}`;

// ============================================================
// 🔒 CUSTOM CODE START
// Add your custom code below this line
// This section will be preserved during regeneration
// ============================================================

// Your custom helper functions
export const legacyGetPet = (id: string) => `/api/v1/pet/${id}`;

export const buildPetUrl = (petId: string, includePhotos: boolean) => {
  const base = getPet(petId);
  return includePhotos ? `${base}?include=photos` : base;
};

// 🔒 CUSTOM CODE END
// ============================================================

export const updatePet = (petId: string) => `/pet/${petId}`;
```

"When you regenerate, everything between the markers is preserved!"

**[Show configuration]**

```typescript
customCode: {
  enabled: true,
  position: "bottom",  // "top" | "bottom" | "both"
  markerText: "CUSTOM CODE",
  includeInstructions: true
}
```

---

## Section 17: Endpoint Filtering (16:00 - 16:45)

**[Screen: Show configuration]**

"You can exclude or include specific endpoints based on tags, paths, or methods:"

```typescript
endpoints: {
  exclude: {
    tags: ["deprecated", "internal"],
    endpoints: [
      { path: "/admin/users", method: "DELETE" },
      { regex: "^/internal/.*" },
      { path: "/debug" }  // All methods
    ]
  }
}

// Or include only specific endpoints
endpoints: {
  include: {
    tags: ["public"],
    endpoints: [
      { path: "/public/users", method: "GET" },
      { regex: "^/public/.*" }
    ]
  }
}
```

"This is great for:

- Excluding deprecated endpoints
- Hiding internal APIs
- Generating only public-facing client code"

---

## Section 18: Real-time Synchronization (16:45 - 17:30)

**[Screen: Show terminal with sync running]**

"In development, OpenAPI Sync can watch your API spec and automatically regenerate when it changes:"

```bash
npx openapi-sync --refreshinterval 5000
```

**[Show configuration]**

```typescript
{
  refetchInterval: 5000; // Check every 5 seconds (dev only)
}
```

"This only runs in development mode (NODE_ENV !== 'production'). In production, it runs once and exits."

**[Show console output with detected changes]**

"When your API changes:

- OpenAPI Sync detects the change
- Regenerates all affected files
- Preserves your custom code
- Updates types and clients automatically

You never have to manually update your types again!"

---

## Section 19: Advanced Configuration (17:30 - 18:15)

**[Screen: Show complete configuration file]**

"Let's look at a complete advanced configuration:"

```typescript
import { IConfig } from "openapi-sync/types";

const config: IConfig = {
  refetchInterval: 10000,
  folder: "./src/api",

  api: {
    "main-api": "https://api.example.com/openapi.json",
    "auth-service": "https://auth.example.com/openapi.json",
  },

  server: 0, // or custom URL

  folderSplit: {
    byTags: true,
  },

  types: {
    name: {
      prefix: "I",
      suffix: "",
      useOperationId: true,
    },
  },

  endpoints: {
    exclude: {
      tags: ["deprecated", "internal"],
    },
    doc: {
      showCurl: true,
    },
  },

  validations: {
    library: "zod",
    generate: {
      query: true,
      dto: true,
    },
    name: {
      prefix: "I",
      suffix: "Schema",
      useOperationId: true,
    },
  },

  customCode: {
    enabled: true,
    position: "bottom",
    markerText: "CUSTOM CODE",
    includeInstructions: true,
  },
};

export default config;
```

"You have complete control over every aspect of code generation!"

---

## Section 20: Version 5.0.0 Improvements (18:15 - 19:30)

**[Screen: Show changelog or comparison]**

"Let me quickly highlight the major improvements in version 5.0.0:

**RTK Query Improvements:**

- ✅ Simplified store setup with `setupApiStore` helper
- ✅ Unique reducer paths per folder - no more TypeScript conflicts
- ✅ Default exports for cleaner imports

**SWR Improvements:**

- ✅ Fixed mutation type errors - no more double-nesting issues
- ✅ 230+ lines of comprehensive inline documentation
- ✅ Examples for every common pattern

**Fetch Client Improvements:**

- ✅ Fixed naming conflicts with aliased imports
- ✅ ESLint-compliant default exports

**CLI Improvements:**

- ✅ CLI arguments now correctly override config file
- ✅ Streamlined interactive setup

**File Organization:**

- ✅ Better structure for non-folder-split mode
- ✅ Cleaner aggregator files"

"All these improvements are fully backwards compatible!"

---

## Section 21: Documentation & JSDoc Comments (19:30 - 20:00)

**[Screen: Show generated files with JSDoc]**

"Every generated function includes comprehensive JSDoc comments:"

````typescript
/**
 * Find pet by ID
 * Returns a single pet
 *
 * @param petId - ID of pet to return
 * @returns Pet object
 *
 * @example
 * ```bash
 * curl -X GET "https://petstore.swagger.io/v2/pet/1" \
 *   -H "accept: application/json"
 * ```
 */
export const getPetById = (petId: string | number) => `/pet/${petId}`;
````

"When enabled, you get:

- Parameter descriptions
- Return type documentation
- cURL examples for testing
- Usage examples

Perfect for team collaboration!"

---

## Section 22: Programmatic Usage (20:00 - 20:30)

**[Screen: Show Node.js script]**

"You can also use OpenAPI Sync programmatically in your build scripts:"

```typescript
import { Init } from "openapi-sync";

async function generateApi() {
  try {
    await Init({
      refetchInterval: process.env.NODE_ENV === "development" ? 5000 : 0,
    });
    console.log("✅ API types synchronized successfully");
  } catch (error) {
    console.error("❌ Failed to sync API types:", error);
    process.exit(1);
  }
}

generateApi();
```

"Add this to your package.json scripts:"

```json
{
  "scripts": {
    "sync-api": "node sync-api.js",
    "dev": "npm run sync-api && next dev",
    "build": "npm run sync-api && next build"
  }
}
```

"Now your API is always in sync!"

---

## Section 23: Multiple APIs (20:30 - 21:00)

**[Screen: Show configuration with multiple APIs]**

"You can manage multiple API specifications in one project:"

```typescript
{
  api: {
    "main-api": "https://api.example.com/openapi.json",
    "auth-service": "https://auth.example.com/openapi.json",
    "payment-service": "./openapi/payment.yaml",
  }
}
```

"This generates separate folders:"

```
src/api/
├── main-api/
│   ├── types.ts
│   ├── endpoints.ts
│   └── client.ts
├── auth-service/
│   ├── types.ts
│   ├── endpoints.ts
│   └── client.ts
└── payment-service/
    ├── types.ts
    ├── endpoints.ts
    └── client.ts
```

"Each API is completely isolated with its own types and clients!"

---

## Section 24: Best Practices (21:00 - 22:00)

**[Screen: Show checklist or bullet points]**

"Here are some best practices when using OpenAPI Sync:

1. **Version Control** - Commit your generated files. This makes code reviews easier and provides a clear history of API changes.

2. **CI/CD Integration** - Add sync to your build pipeline to catch API mismatches early:

   ```bash
   npm run sync-api && npm run test
   ```

3. **Use Type Guards** - Combine generated types with runtime validation:

   ```typescript
   const validatedData = IPetSchema.parse(response);
   const pet: IPet = validatedData; // Now 100% type-safe!
   ```

4. **Custom Code Sections** - Use these for business logic, middleware, and helper functions.

5. **Folder Splitting** - Enable for large APIs (50+ endpoints), keep flat for smaller ones.

6. **Tag Your Endpoints** - In your OpenAPI spec, use tags to organize endpoints logically.

7. **Development Workflow**:
   - Run with `refetchInterval` during development
   - Disable in production
   - Use git diff to review API changes"

---

## Section 25: Common Use Cases (22:00 - 23:00)

**[Screen: Show code examples]**

"Let me show you some common use cases:

**Backend API Validation:**

```typescript
// Express middleware
import { validate } from "./middleware/validate";
import { IAddPetSchema } from "./api/petstore/validation";

router.post("/pet", validate(IAddPetSchema), async (req, res) => {
  // req.body is validated and typed!
  const pet = await createPet(req.body);
  res.json(pet);
});
```

**Frontend Data Fetching:**

```typescript
// React component with React Query
function PetList() {
  const { data, isLoading } = useGetPets({});

  return (
    <div>
      {isLoading ? (
        <Spinner />
      ) : (
        <ul>
          {data?.map((pet) => (
            <li key={pet.id}>{pet.name}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

**Type-Safe API Calls:**

```typescript
// Fetch client in any context
import { getPetById } from "./api/petstore/client";

async function fetchPet(id: string) {
  const pet = await getPetById({ petId: id });
  // pet is fully typed as IPet
  console.log(pet.name, pet.status);
}
```

**Microservices Integration:**

```typescript
// Different services, all type-safe
import { authenticateUser } from "./api/auth-service/client";
import { processPayment } from "./api/payment-service/client";
import { createOrder } from "./api/main-api/client";

async function checkout(user, cart) {
  const auth = await authenticateUser({ userId: user.id });
  const payment = await processPayment({ amount: cart.total });
  const order = await createOrder({ data: { cart, payment } });
  return order;
}
```

---

## Section 26: Troubleshooting (23:00 - 23:30)

**[Screen: Show common errors and solutions]**

"If you run into issues:

**Config Not Found:**

- Ensure `openapi.sync.json`, `.ts`, or `.js` exists in project root
- Check file naming is exact

**Network Errors:**

- OpenAPI Sync has automatic retry with exponential backoff
- Verify your OpenAPI spec URL is accessible
- Check firewall or proxy settings

**TypeScript Errors:**

- Make sure sync completed successfully
- Check that folder paths in config are correct
- Restart your TypeScript server

**Generated Code Issues:**

- Delete the output folder and regenerate
- Check your OpenAPI spec is valid
- Update to the latest version of openapi-sync"

---

## Section 27: Resources & Community (23:30 - 24:00)

**[Screen: Show website and links]**

"For more information:

📘 **Full Documentation:** https://openapi-sync.com

🐙 **GitHub Repository:** https://github.com/akintomiwa-fisayo/openapi-sync

📦 **npm Package:** https://www.npmjs.com/package/openapi-sync

📝 **Changelog:** Check the website for detailed version history

💬 **Issues & Questions:** Open an issue on GitHub

💰 **Support the Project:**

- GitHub Sponsors
- Open Collective
- Patreon

All links are in the README!"

---

## Closing (24:00 - 24:30)

**[Screen: Show final demo or summary]**

"And that's OpenAPI Sync! To recap, it:

- ✅ Generates TypeScript types automatically
- ✅ Creates type-safe API clients for 5 different libraries
- ✅ Generates runtime validation schemas
- ✅ Keeps everything synchronized in real-time
- ✅ Preserves your custom code
- ✅ Organizes code intelligently
- ✅ Includes comprehensive documentation

Whether you're building a small app or an enterprise system, OpenAPI Sync eliminates the manual work of keeping your API documentation and code in sync.

Give it a try in your next project! Install it with:

```bash
npx openapi-sync init
```

Thanks for watching! If this was helpful, please star the project on GitHub and share it with your team. See you in the next video!"

**[End screen with links and subscribe button]**

---

## Video Chapters (for YouTube description)

```
0:00 - Introduction
0:30 - What is OpenAPI Sync?
1:15 - Installation
1:45 - Interactive Setup Wizard
3:30 - Running the Sync
4:30 - TypeScript Types
5:30 - Endpoint Definitions
6:15 - Runtime Validation Schemas
7:30 - API Client Generation Overview
8:00 - Fetch Client
9:00 - Axios Client
9:45 - React Query Hooks
11:00 - SWR Hooks
11:45 - RTK Query
13:00 - Filtering & Customization
14:00 - Folder Splitting
15:00 - Custom Code Preservation
16:00 - Endpoint Filtering
16:45 - Real-time Synchronization
17:30 - Advanced Configuration
18:15 - Version 5.0.0 Improvements
19:30 - Documentation & JSDoc
20:00 - Programmatic Usage
20:30 - Multiple APIs
21:00 - Best Practices
22:00 - Common Use Cases
23:00 - Troubleshooting
23:30 - Resources & Community
24:00 - Closing
```

## Notes for Recording

1. **Pace**: Speak clearly but not too slowly. This is a technical tutorial.

2. **Screen Setup**: Have two windows ready - Terminal and VS Code side by side

3. **Demo API**: Use Petstore API for consistency with documentation

4. **Highlighting**: Use cursor highlighting or a tool like KeyCastr to show keyboard shortcuts

5. **Terminal**: Use a clean terminal with good contrast

6. **VS Code**: Use a popular theme with good readability

7. **Zoom**: Zoom in on important code sections

8. **Transitions**: Use simple transitions between sections

9. **Music**: Soft background music at low volume (optional)

10. **Length**: Aim for 24-25 minutes total. Can be split into multiple shorter videos if needed.

## Alternative: Series Approach

You could also split this into a video series:

1. **Part 1: Getting Started** (5-7 min) - Sections 1-6
2. **Part 2: Validation & Basic Clients** (5-7 min) - Sections 7-10
3. **Part 3: React Hooks** (5-7 min) - Sections 11-13
4. **Part 4: Advanced Features** (5-7 min) - Sections 14-19
5. **Part 5: Best Practices** (3-5 min) - Sections 20-26

This makes content more digestible and increases watch time across multiple videos.
