[![NPM Version](https://img.shields.io/npm/v/openapi-sync.svg)](https://www.npmjs.com/package/openapi-sync)
[![License](https://img.shields.io/npm/l/openapi-sync.svg)](https://github.com/akintomiwa-fisayo/openapi-sync/blob/main/LICENSE)
[![Tests](https://img.shields.io/badge/tests-passing-brightgreen.svg)](https://github.com/akintomiwa-fisayo/openapi-sync)

# OpenAPI Sync

**OpenAPI Sync** is a powerful developer tool that automates the synchronization of your API documentation with your codebase using OpenAPI (formerly Swagger) specifications. It generates TypeScript types, endpoint definitions, runtime validation schemas (Zod, Yup, Joi), and comprehensive documentation from your OpenAPI schema—ensuring type safety from API specification to runtime validation.

> 📘 **[Full documentation available at openapi-sync.com](https://openapi-sync.com)**

## Features

- 🔄 **Real-time API Synchronization** - Automatically syncs OpenAPI specs from remote URLs
- 📝 **Automatic Type Generation** - Generates TypeScript interfaces for all endpoints
- 🔧 **Highly Configurable** - Customizable naming, filtering, and folder organization
- 🛡️ **Enterprise Ready** - Error handling, validation, and state persistence
- 🔐 **Runtime Validation** - Generate Zod, Yup, or Joi schemas from OpenAPI specs
- 📚 **Rich Documentation** - JSDoc comments with cURL examples
- 🔄 **Custom Code Injection** - Preserve your custom code between regenerations

[View all features →](https://openapi-sync.com/docs#features)

## Installation

```bash
npm install openapi-sync
# or
npm install -g openapi-sync
# or use directly
npx openapi-sync
```

## Quick Start

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
import { IConfig } from "openapi-sync/types";

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

## License

ISC License - see [LICENSE](LICENSE) file for details.

## Contributing

Contributions welcome! Submit pull requests to our [GitHub repository](https://github.com/akintomiwa-fisayo/openapi-sync).

---

**[📘 Full Documentation](https://openapi-sync.com) | [GitHub](https://github.com/akintomiwa-fisayo/openapi-sync) | [npm](https://www.npmjs.com/package/openapi-sync)**
