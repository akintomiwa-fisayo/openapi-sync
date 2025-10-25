// Test setup file
import { jest } from "@jest/globals";

// Mock console methods to avoid noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
};

// Mock fs operations for testing
jest.mock("fs", () => {
  const actualFs = jest.requireActual("fs");
  return {
    ...(actualFs as any),
    existsSync: jest.fn(),
    writeFileSync: jest.fn(),
    readFileSync: jest.fn(),
    promises: {
      mkdir: jest.fn(),
      writeFile: jest.fn(),
    },
  };
});

// Mock axios for API calls
jest.mock("axios", () => ({
  create: jest.fn(() => ({
    get: jest.fn(),
  })),
}));

// Mock axios-retry
jest.mock("axios-retry", () => ({
  __esModule: true,
  default: jest.fn(),
}));

// Mock @apidevtools/swagger-parser
jest.mock("@apidevtools/swagger-parser", () => ({
  validate: jest.fn(),
  parse: jest.fn(),
}));

// Mock curl-generator
jest.mock("curl-generator", () => ({
  CurlGenerator: jest.fn(),
}));

// Mock esbuild-register
jest.mock("esbuild-register", () => ({}));

// Set up test environment
Object.defineProperty(process.env, "NODE_ENV", {
  value: "test",
  writable: true,
  enumerable: true,
  configurable: true,
});
