# Openapi-sync

**Openapi-sync** is a developer-friendly tool designed to keep your API up-to-date by leveraging OpenAPI schemas. It automates the generation of endpoint URIs and type definitions, including shared types, directly from your OpenAPI specification. Whether you need real-time synchronization before commits or periodic updates, openapi-sync ensures your API structure is always current and consistent. With an easy-to-use CLI, this tool integrates seamlessly into your development workflow, making API maintenance simpler and more reliable.

## Installation

To install `openapi-sync`, run the following command:

```bash
npm install openapi-sync
```

## Configuration

Create an `openapi.sync.json` file at the root of your project to configure openapi-sync. You can use the provided [`openapi.sync.sample.json`](https://github.com/akintomiwa-fisayo/openapi-sync/blob/master/openapi.sync.sample.json) as reference.

## Usage

To start using openapi-sync, simply run the following command in your terminal:

```bash
npx openapi-sync
```

You can also add it as a script in your package.json for easy access:

```json
"scripts": {
  "api-sync": "npx openapi-sync",
}
```

## Features

- Automated Endpoint URI Generation: Effortlessly generate endpoint URIs from your OpenAPI schema.
- Type Generation: Automatically create all types defined in your API schema, including shared types, for better code consistency.
- Flexible CLI Commands: Sync your API at any point in the development process on app start, pre-commit, or via manual triggers.
