# Openapi-sync

[![NPM Version](https://img.shields.io/npm/v/openapi-sync.svg)](https://www.npmjs.com/package/openapi-sync)
[![License](https://img.shields.io/npm/l/openapi-sync.svg)](https://github.com/akintomiwa-fisayo/openapi-sync/blob/main/LICENSE)

**Openapi-sync** is a powerful developer tool that automates the synchronization of your API documentation with your codebase using OpenAPI (formerly Swagger) specifications. It generates TypeScript types and endpoint definitions from your OpenAPI schema, ensuring your API documentation stays up-to-date with your code.

## Features

- 🔄 Real-time API Synchronization
- 📝 Automatic Type Generation
- 🔄 Periodic API Refetching
- 📁 Configurable Output Directory
- 🔄 Customizable Naming Conventions
- 🔄 Endpoint URL Transformation
- 🔄 Schema Validation
- 🔄 CLI Integration
- 🔄 TypeScript Support
- 🔄 YAML and JSON Support

## Installation

Install the package using npm:

```bash
npm install openapi-sync
```

Or use it directly via npx:

```bash
npx openapi-sync
```

## Configuration

Create a `openapi.sync.json` file in your project root with the following structure:

```json
{
  "refetchInterval": 5000, // milliseconds between API refetches
  "folder": "/path/to/output", // output directory for generated files
  "api": {
    "example1": "https://api.example.com/openapi.json",
    "example2": "https://api.example.com/openapi.yaml"
  },
  "naming": {
    "replaceWords": [
      {
        "replace": "Api",
        "with": "",
        "type": "endpoint"
      }
    ]
  },
  "endpoints": {
    "value": {
      "replaceWords": [
        {
          "replace": "/api/v\\d/",
          "with": ""
        }
      ]
    }
  }
}
```

## Usage

### CLI Commands

```bash
# Basic usage
npx openapi-sync

# With custom refetch interval
npx openapi-sync --refreshinterval 30000
```

### Programmatic Usage

```typescript
import { Init } from "openapi-sync";

// Initialize with custom options
await Init({
  refetchInterval: 30000, // optional, defaults to config value
});
```

## Output Generation

The tool generates:

1. TypeScript interfaces for API endpoints
2. Type definitions for request/response bodies
3. Shared component types
4. Endpoint URL constants

## Type Generation

The tool supports:

- Primitive types (string, number, boolean, etc.)
- Complex types (objects, arrays)
- Enums
- Nullable types
- Any types
- Shared components
- Request/response bodies

## Error Handling

The tool includes:

- Network error retries
- Schema validation
- Type generation error handling
- State persistence

## API Documentation

For detailed API documentation, please refer to the [OpenAPI specification](https://spec.openapis.org/oas/v3.0.3).

## License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

## Support

For support, please open an issue in the GitHub repository.

## Acknowledgments

- Thanks to the OpenAPI Initiative for the OpenAPI specification
- Thanks to all contributors and users of this package
- Flexible CLI Commands: Sync your API at any point in the development process on app start, pre-commit, or via manual triggers.
