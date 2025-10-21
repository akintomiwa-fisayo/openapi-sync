"use client";

import { useState } from "react";
import { FiCopy, FiCheck } from "react-icons/fi";

const examples = [
  {
    category: "Basic Configuration",
    title: "Simple Setup",
    description: "Get started with a minimal configuration",
    code: `// openapi.sync.json
{
  "refetchInterval": 5000,
  "folder": "./src/api",
  "api": {
    "petstore": "https://petstore3.swagger.io/api/v3/openapi.json"
  }
}`,
  },
  {
    category: "Validation Schemas",
    title: "Zod Validation",
    description: "Generate Zod schemas for runtime validation",
    code: `// openapi.sync.ts
import { IConfig } from "openapi-sync/types";

const config: IConfig = {
  folder: "./src/api",
  api: {
    myapi: "https://api.example.com/openapi.json"
  },
  validations: {
    library: "zod",
    generate: {
      query: true,
      dto: true
    }
  }
};

export default config;`,
  },
  {
    category: "Validation Schemas",
    title: "Using Generated Validation",
    description: "Validate API requests with generated schemas",
    code: `import { IAddPetDTOSchema } from "./src/api/petstore/validation";
import { z } from "zod";

// Validate request body
try {
  const validatedData = IAddPetDTOSchema.parse(req.body);
  // Data is now validated and typed
} catch (error) {
  if (error instanceof z.ZodError) {
    console.error("Validation errors:", error.errors);
  }
}`,
  },
  {
    category: "Folder Splitting",
    title: "Organize by Tags",
    description: "Split generated code into folders based on API tags",
    code: `// openapi.sync.ts
const config: IConfig = {
  folder: "./src/api",
  api: {
    myapi: "https://api.example.com/openapi.json"
  },
  folderSplit: {
    byTags: true  // Creates folders like admin/, user/, etc.
  }
};

export default config;`,
  },
  {
    category: "Folder Splitting",
    title: "Custom Folder Logic",
    description: "Use custom logic to determine folder structure",
    code: `folderSplit: {
  customFolder: ({ method, path, tags }) => {
    // Admin endpoints
    if (tags?.includes("admin")) return "admin";
    
    // API versioning
    if (path.startsWith("/api/v1/")) return "v1";
    if (path.startsWith("/api/v2/")) return "v2";
    
    // Method-based organization
    if (method === "GET") return "read";
    if (method === "POST") return "create";
    
    return null; // Use default
  }
}`,
  },
  {
    category: "Endpoint Filtering",
    title: "Exclude Endpoints",
    description: "Filter out endpoints you don't need",
    code: `endpoints: {
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
}`,
  },
  {
    category: "Endpoint Filtering",
    title: "Include Only Specific Endpoints",
    description: "Generate code only for selected endpoints",
    code: `endpoints: {
  include: {
    // Include only public endpoints
    tags: ["public"],
    
    // Include specific endpoints
    endpoints: [
      { path: "/public/users", method: "GET" },
      { regex: "^/public/.*" }
    ]
  }
}`,
  },
  {
    category: "Type Customization",
    title: "Custom Type Names",
    description: "Customize how types are named",
    code: `types: {
  name: {
    prefix: "I",
    useOperationId: true,
    format: (source, data, defaultName) => {
      if (source === "shared") {
        return \`\${data.name}Type\`;
      }
      if (source === "endpoint" && data.operationId) {
        return \`\${data.operationId}\${data.type}\`;
      }
      return defaultName;
    }
  }
}`,
  },
  {
    category: "Endpoint Configuration",
    title: "Endpoint as Objects",
    description: "Generate endpoints as objects with metadata",
    code: `endpoints: {
  value: {
    type: "object",
    includeServer: true
  }
}

// Generated output:
export const getPetById = {
  method: "GET",
  operationId: "getPetById",
  url: (petId: string) => \`/pet/\${petId}\`,
  tags: ["pet"]
};`,
  },
  {
    category: "Custom Code",
    title: "Preserve Custom Code",
    description: "Add custom code that survives regeneration",
    code: `// endpoints.ts (after generation)
export const getPet = (petId: string) => \`/pet/\${petId}\`;

// 🔒 CUSTOM CODE START
// Add your custom endpoints here
export const legacyGetPet = (id: string) => \`/api/v1/pet/\${id}\`;

export const buildPetUrl = (petId: string, includePhotos: boolean) => {
  const base = getPet(petId);
  return includePhotos ? \`\${base}?include=photos\` : base;
};
// 🔒 CUSTOM CODE END`,
  },
  {
    category: "Advanced",
    title: "Multi-Environment Setup",
    description: "Different configs for different environments",
    code: `// openapi.sync.ts
export default (): IConfig => {
  const env = process.env.NODE_ENV || "development";
  
  const baseConfig: IConfig = {
    refetchInterval: env === "development" ? 5000 : 0,
    folder: "./src/api",
    api: {}
  };
  
  if (env === "development") {
    baseConfig.api = {
      "local": "http://localhost:3000/openapi.json"
    };
  } else {
    baseConfig.api = {
      "prod": "https://api.example.com/openapi.json"
    };
  }
  
  return baseConfig;
};`,
  },
  {
    category: "Advanced",
    title: "Express Middleware Validation",
    description: "Create validation middleware for Express",
    code: `import { Request, Response, NextFunction } from "express";
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
router.post("/pet", validate(IAddPetDTOSchema), handler);`,
  },
];

export default function Examples() {
  const [activeCategory, setActiveCategory] = useState("all");
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const categories = [
    "all",
    ...Array.from(new Set(examples.map((e) => e.category))),
  ];

  const filteredExamples =
    activeCategory === "all"
      ? examples
      : examples.filter((e) => e.category === activeCategory);

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <section id="examples" className="py-20 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-900">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Comprehensive Examples
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Real-world examples showing TypeScript generation, validation schemas, 
            and endpoint synchronization
          </p>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap justify-center gap-3 mb-12">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`px-6 py-2 rounded-full font-medium transition-all ${
                activeCategory === category
                  ? "bg-red-600 text-white shadow-lg"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {category === "all" ? "All Examples" : category}
            </button>
          ))}
        </div>

        {/* Examples Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {filteredExamples.map((example, index) => (
            <div
              key={index}
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden hover:shadow-lg transition-all"
            >
              <div className="p-6 bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
                <div className="inline-block px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-xs font-semibold rounded-full mb-3">
                  {example.category}
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  {example.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm">{example.description}</p>
              </div>

              <div className="bg-gray-900">
                <div className="px-4 py-3 bg-gray-800 flex items-center justify-between">
                  <span className="text-gray-400 text-xs">typescript</span>
                  <button
                    onClick={() => copyToClipboard(example.code, index)}
                    className="text-gray-400 hover:text-white transition-colors flex items-center space-x-2"
                  >
                    {copiedIndex === index ? (
                      <>
                        <FiCheck className="text-green-400" />
                        <span className="text-xs text-green-400">Copied!</span>
                      </>
                    ) : (
                      <>
                        <FiCopy />
                        <span className="text-xs">Copy</span>
                      </>
                    )}
                  </button>
                </div>
                <pre className="p-4 overflow-x-auto max-h-80">
                  <code className="text-xs text-gray-300">{example.code}</code>
                </pre>
              </div>
            </div>
          ))}
        </div>

        {/* More Examples CTA */}
        <div className="mt-12 text-center">
          <div className="inline-block bg-gradient-to-br from-red-50 to-rose-50 dark:from-gray-800 dark:to-gray-900 rounded-xl p-8 border border-red-100 dark:border-red-900">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
              Need More Examples?
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6 max-w-2xl">
              Check out our comprehensive documentation with detailed examples,
              best practices, and troubleshooting guides.
            </p>
            <a
              href="/docs"
              className="inline-block bg-red-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-red-700 transition-all shadow-lg hover:shadow-xl"
            >
              View Full Documentation
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
