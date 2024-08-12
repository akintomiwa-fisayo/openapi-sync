# Openapi-sync

**Openapi-sync** leverages the power of OpenAPI schemas, just like Swagger UI, Postman, Redoc, and other popular tools. This package automates the creation of endpoint URIs and all defined types (including shared types) in a simple and developer-friendly manner and ensures your API remains up-to-date by checking for updates at intervals or right before committing your code (pre-commit).

## Installation

To install `openapi-sync`, run the following command:

```bash
npm install openapi-sync
```

## Configuration

Create an `openapi.sync.json` file at the root of your project to configure openapi-sync. You can use the provided `openapi.sync.sample.json` as a reference.

## Usage

To start using openapi-sync, simply run the following command in your terminal:

```bash
npx openapi-sync
```

You can also add it as a script in your package.json for easy access:

```bash
"scripts": {
  "api-sync": "openapi-sync",
}
```

## Features

- Endpoint URI Generation: Automatically generate endpoint URIs from your OpenAPI schema.
- Types Generation: Generate all defined types, including shared types, from your OpenAPI schema.
- CLI Commands: Use the command-line interface to regenerate files at any time—on app start, pre-commit, or whenever needed.
