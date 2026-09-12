import prompts from "prompts";
import fs from "fs";
import path from "path";
import { makeLogger } from "../logger";
import { PRESETS, PresetName } from "./presets";

interface InitAnswers {
  configFormat: "json" | "typescript" | "javascript";
  preset?: string;
  apiSource: "url" | "file";
  apiUrl?: string;
  apiFile?: string;
  apiName: string;
  outputFolder: string;
  enableFolderSplit: boolean;
  generateClient: boolean;
  clientType?: "fetch" | "axios" | "react-query" | "swr" | "rtk-query";
  enableValidation: boolean;
  validationLibrary?: "zod" | "yup" | "joi";
  enableCustomCode: boolean;
  typesUseOperationId: boolean;
  typesPrefix?: string;
  excludeEndpointsByTags: boolean;
  excludeTags?: string;
  showCurlInDocs: boolean;
  refetchInterval?: number;
  runSync: boolean;
}

const isTestEnvironment =
  process.env.NODE_ENV === "test" || process.env.JEST_WORKER_ID !== undefined;

export function serializeObjectToTs(obj: any, indentLevel = 0): string {
  const indent = " ".repeat(indentLevel);
  const nextIndent = " ".repeat(indentLevel + 2);

  if (obj === null) return "null";
  if (obj === undefined) return "undefined";
  if (typeof obj === "string") return JSON.stringify(obj);
  if (typeof obj === "number" || typeof obj === "boolean") return String(obj);

  if (Array.isArray(obj)) {
    if (obj.length === 0) return "[]";
    const items = obj.map((item) => `${nextIndent}${serializeObjectToTs(item, indentLevel + 2)}`).join(",\n");
    return `[\n${items}\n${indent}]`;
  }

  if (typeof obj === "object") {
    const keys = Object.keys(obj);
    if (keys.length === 0) return "{}";
    const props = keys.map((key) => {
      const isValidIdentifier = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key);
      const formattedKey = isValidIdentifier ? key : JSON.stringify(key);
      const val = serializeObjectToTs(obj[key], indentLevel + 2);
      return `${nextIndent}${formattedKey}: ${val}`;
    }).join(",\n");
    return `{\n${props}\n${indent}}`;
  }

  return JSON.stringify(obj);
}

/**
 * Interactive CLI wizard for creating OpenAPI Sync configuration
 *
 * Guides users through an interactive setup process to create an openapi.sync
 * configuration file. Prompts for API sources, output preferences, client generation,
 * validation libraries, and more. Optionally runs the initial sync after setup.
 *
 * @returns {Promise<void>}
 * @throws {Error} When user cancels the wizard or configuration creation fails
 *
 * @public
 */
export async function interactiveInit(): Promise<void> {
  if (!isTestEnvironment) {
    console.log("\n🚀 Welcome to OpenAPI Sync!\n");
    console.log("Let's set up your project with a few quick questions...\n");
  }

  try {
    const answers = await prompts(
      [
        {
          type: "select",
          name: "configFormat",
          message: "What configuration format would you like to use?",
          choices: [
            { title: "TypeScript (openapi.sync.ts)", value: "typescript" },
            { title: "JSON (openapi.sync.json)", value: "json" },
            { title: "JavaScript (openapi.sync.js)", value: "javascript" },
          ],
          initial: 0,
        },
        {
          type: "select",
          name: "apiSource",
          message: "Where is your OpenAPI specification?",
          choices: [
            {
              title: "URL (e.g., https://api.example.com/openapi.json)",
              value: "url",
            },
            { title: "Local file", value: "file" },
          ],
          initial: 0,
        },
        {
          type: (prev) => (prev === "url" ? "text" : null),
          name: "apiUrl",
          message: "Enter the OpenAPI specification URL:",
          validate: (value: string) =>
            value.startsWith("http://") || value.startsWith("https://")
              ? true
              : "Please enter a valid URL starting with http:// or https://",
        },
        {
          type: (prev, answers) =>
            answers.apiSource === "file" ? "text" : null,
          name: "apiFile",
          message: "Enter the path to your OpenAPI file:",
          validate: (value: string) =>
            value.trim() !== "" ? true : "Please enter a valid file path",
        },
        {
          type: "text",
          name: "apiName",
          message: "What would you like to name this API?",
          initial: "myapi",
          validate: (value: string) =>
            /^[a-zA-Z0-9_-]+$/.test(value)
              ? true
              : "API name must contain only letters, numbers, hyphens, and underscores",
        },
        {
          type: "text",
          name: "outputFolder",
          message: "Where should generated files be saved? (empty for project root)",
          initial: "",
          validate: (value: string) => {
            if (!value || value.trim() === "") {
              return true;
            }

            // Prevent dangerous root paths
            const normalizedPath = path.normalize(value);
            if (
              normalizedPath === "/" ||
              normalizedPath === "C:\\" ||
              normalizedPath === "\\"
            ) {
              return "Cannot use filesystem root directory. Please use a project subfolder or project root ''";
            }

            // Warn about absolute paths outside project
            if (path.isAbsolute(value)) {
              const cwd = process.cwd();
              if (!value.startsWith(cwd)) {
                return "⚠️  Warning: Using absolute path outside project directory. Recommended: use relative path like './src/api'";
              }
            }

            return true;
          },
        },
        {
          type: "select",
          name: "preset",
          message: "Choose a preset (or 'none' to configure manually):",
          choices: [
            {
              title: "none (configure manually)",
              description: "Skip preset — configure client, validations, and naming options by hand",
              value: null,
            },
            {
              title: "react-query-zod (React Query v5 + Zod)",
              description: "TanStack React Query v5 hooks, Zod validation schemas, mutation hooks",
              value: "react-query-zod",
            },
            {
              title: "react-query-yup (React Query v5 + Yup)",
              description: "TanStack React Query v5 hooks, Yup validation schemas, mutation hooks",
              value: "react-query-yup",
            },
            {
              title: "swr-zod (SWR + Zod)",
              description: "Vercel SWR hooks with mutation support, Zod validation schemas",
              value: "swr-zod",
            },
            {
              title: "swr-yup (SWR + Yup)",
              description: "Vercel SWR hooks with mutation support, Yup validation schemas",
              value: "swr-yup",
            },
            {
              title: "axios-zod (Axios + Zod)",
              description: "Standalone typed Axios client instance, Zod validation schemas",
              value: "axios-zod",
            },
            {
              title: "axios-joi (Axios + Joi)",
              description: "Standalone typed Axios client, Joi validation schemas (Node.js/backend)",
              value: "axios-joi",
            },
            {
              title: "fetch-zod (Fetch + Zod)",
              description: "Zero-dependency native Fetch API client, Zod validation schemas",
              value: "fetch-zod",
            },
            {
              title: "rtk-query-zod (RTK Query + Zod)",
              description: "Redux Toolkit Query API slice with fetchBaseQuery, Zod validation",
              value: "rtk-query-zod",
            },
            {
              title: "next-fetch (Next.js Fetch)",
              description: "Next.js App Router Fetch client without runtime validation bundle overhead",
              value: "next-fetch",
            },
            {
              title: "python-basic (Python Dataclasses)",
              description: "Python dataclass types and endpoint constants (no TypeScript validation)",
              value: "python-basic",
            },
          ],
          initial: 0,
          limit: 12,
        },
        {
          type: (prev, answers) => (answers.preset ? null : "confirm"),
          name: "enableFolderSplit",
          message: "Organize generated code into folders by OpenAPI tags?",
          initial: false,
        },
        {
          type: (prev, answers) => (answers.preset ? null : "confirm"),
          name: "generateClient",
          message: "Generate API client code?",
          initial: true,
        },
        {
          type: (prev, answers) => (!answers.preset && answers.generateClient ? "select" : null),
          name: "clientType",
          message: "Which client type would you like?",
          choices: [
            {
              title: "React Query (Recommended for React)",
              value: "react-query",
            },
            { title: "RTK Query (Redux Toolkit)", value: "rtk-query" },
            { title: "SWR", value: "swr" },
            { title: "Fetch API", value: "fetch" },
            { title: "Axios", value: "axios" },
          ],
          initial: 0,
        },
        {
          type: (prev, answers) => (answers.preset ? null : "confirm"),
          name: "enableValidation",
          message: "Enable runtime validation schemas?",
          initial: true,
        },
        {
          type: (prev, answers) => (!answers.preset && answers.enableValidation ? "select" : null),
          name: "validationLibrary",
          message: "Which validation library?",
          choices: [
            { title: "Zod (Recommended)", value: "zod" },
            { title: "Yup", value: "yup" },
            { title: "Joi", value: "joi" },
          ],
          initial: 0,
        },
        {
          type: (prev, answers) => (answers.preset ? null : "confirm"),
          name: "enableCustomCode",
          message: "Enable custom code preservation?",
          initial: true,
        },
        {
          type: (prev, answers) => (answers.preset ? null : "confirm"),
          name: "typesUseOperationId",
          message: "Use operationId from OpenAPI spec for type names?",
          initial: true,
        },
        {
          type: (prev, answers) => (answers.preset ? null : "text"),
          name: "typesPrefix",
          message:
            "Prefix for TypeScript interface names (leave empty for none):",
          initial: "I",
        },
        {
          type: (prev, answers) => (answers.preset ? null : "confirm"),
          name: "excludeEndpointsByTags",
          message: "Exclude endpoints by tags (e.g., deprecated, internal)?",
          initial: false,
        },
        {
          type: (prev, answers) => (!answers.preset && answers.excludeEndpointsByTags ? "text" : null),
          name: "excludeTags",
          message: "Enter tags to exclude (comma-separated):",
          initial: "deprecated,internal",
        },
        {
          type: (prev, answers) => (answers.preset ? null : "confirm"),
          name: "showCurlInDocs",
          message: "Include cURL examples in generated documentation?",
          initial: false,
        },
        {
          type: (prev, answers) => (answers.preset ? null : "number"),
          name: "refetchInterval",
          message:
            "Refetch interval in milliseconds (0 to disable auto-refresh):",
          initial: 0,
          min: 0,
        },
        {
          type: "confirm",
          name: "runSync",
          message: "Run initial sync after setup?",
          initial: true,
        },
      ],
      {
        onCancel: () => {
          if (!isTestEnvironment) {
            console.log("\n❌ Setup cancelled.");
            process.exit(0);
          }
          throw new Error("Setup cancelled");
        },
      }
    );

    // Generate configuration object
    const config: any = {
      refetchInterval: answers.refetchInterval || undefined,
      folder: answers.outputFolder ?? "",
      api: {
        [answers.apiName]: answers.apiUrl || answers.apiFile,
      },
    };

    if (answers.preset) {
      config.preset = answers.preset;
      if (answers.enableFolderSplit) {
        config.folderSplit = {
          byTags: true,
        };
      }
      if (answers.excludeEndpointsByTags && answers.excludeTags) {
        config.endpoints = {
          exclude: {
            tags: answers.excludeTags.split(",").map((tag: string) => tag.trim()),
          },
        };
      }
    } else {
      // Add folder split config (automatically enable byTags when folder splitting is enabled)
      if (answers.enableFolderSplit) {
        config.folderSplit = {
          byTags: true,
        };
      }

      // Add types config
      config.types = {
        name: {
          prefix: answers.typesPrefix || "",
          useOperationId: answers.typesUseOperationId,
        },
      };

      // Add endpoints config
      config.endpoints = {
        name: {
          useOperationId: answers.typesUseOperationId,
        },
        doc: {
          showCurl: answers.showCurlInDocs,
        },
      };

      // Add endpoint exclusions
      if (answers.excludeEndpointsByTags && answers.excludeTags) {
        config.endpoints.exclude = {
          tags: answers.excludeTags.split(",").map((tag: string) => tag.trim()),
        };
      }

      // Add client generation config
      if (answers.generateClient && answers.clientType) {
        config.clientGeneration = {
          enabled: true,
          type: answers.clientType,
          outputDir: path.join(answers.outputFolder, answers.apiName, "client"),
        };

        // Add framework-specific configs
        if (answers.clientType === "react-query") {
          config.clientGeneration.reactQuery = {
            version: 5,
            mutations: true,
          };
        } else if (answers.clientType === "swr") {
          config.clientGeneration.swr = {
            mutations: true,
          };
        }
      }

      // Add validation config
      if (answers.enableValidation && answers.validationLibrary) {
        config.validations = {
          library: answers.validationLibrary,
        };
      }

      // Add custom code config
      if (answers.enableCustomCode) {
        config.customCode = {
          enabled: true,
          position: "bottom",
        };
      }
    }

    // Generate config file content
    let configContent: string;
    let configFileName: string;

    if (answers.configFormat === "json") {
      configFileName = "openapi.sync.json";
      const jsonConfig = {
        $schema: "./node_modules/openapi-sync/openapi.sync.schema.json",
        ...config,
      };
      configContent = JSON.stringify(jsonConfig, null, 2);
    } else if (answers.configFormat === "typescript") {
      configFileName = "openapi.sync.ts";
      configContent = `// @see node_modules/openapi-sync/openapi.sync.schema.json
import { defineConfig } from "openapi-sync";

export default defineConfig(${serializeObjectToTs(config, 0)});
`;
    } else {
      // javascript
      configFileName = "openapi.sync.js";
      configContent = `// @see node_modules/openapi-sync/openapi.sync.schema.json
/** @type {import('openapi-sync').IConfig} */
module.exports = ${JSON.stringify(config, null, 2)};
`;
    }

    // Check if config file already exists
    const configPath = path.join(process.cwd(), configFileName);
    if (fs.existsSync(configPath)) {
      const overwrite = await prompts({
        type: "confirm",
        name: "value",
        message: `${configFileName} already exists. Overwrite?`,
        initial: false,
      });

      if (!overwrite.value) {
        if (!isTestEnvironment) {
          console.log("\n❌ Configuration file not created.");
          process.exit(0);
        }
        throw new Error("Configuration file not created");
      }
    }

    // Write config file
    fs.writeFileSync(configPath, configContent, "utf-8");

    if (!isTestEnvironment) {
      console.log("\n✅ Configuration created successfully!");
      console.log(`📄 File: ${configFileName}\n`);
    }

    // Create output folder if it doesn't exist
    if (answers.outputFolder && answers.outputFolder.trim() !== "") {
      const outputFolderPath = path.isAbsolute(answers.outputFolder)
        ? answers.outputFolder
        : path.join(process.cwd(), answers.outputFolder);

      if (!fs.existsSync(outputFolderPath)) {
        try {
          fs.mkdirSync(outputFolderPath, { recursive: true });
          if (!isTestEnvironment) {
            console.log(`✅ Created output folder: ${answers.outputFolder}\n`);
          }
        } catch (error: any) {
          if (!isTestEnvironment) {
            console.warn(`⚠️  Could not create output folder: ${error.message}`);
            console.warn(
              `   The folder will be created automatically during sync.\n`
            );
          }
        }
      }
    }

    // Create .gitignore entry if it doesn't exist
    const gitignorePath = path.join(process.cwd(), ".gitignore");
    if (fs.existsSync(gitignorePath)) {
      const gitignoreContent = fs.readFileSync(gitignorePath, "utf-8");
      if (!gitignoreContent.includes(answers.outputFolder)) {
        fs.appendFileSync(
          gitignorePath,
          `\n# OpenAPI Sync generated files\n${answers.outputFolder}\n`
        );
        if (!isTestEnvironment) {
          console.log("✅ Added output folder to .gitignore\n");
        }
      }
    }

    if (!isTestEnvironment) {
      // Show next steps
      console.log("📚 Next steps:\n");
      console.log(`   1. Review the configuration in ${configFileName}`);

      if (answers.preset) {
        const presetInstallMap: Record<string, string> = {
          "react-query-zod": "npm install @tanstack/react-query axios zod",
          "react-query-yup": "npm install @tanstack/react-query axios yup",
          "swr-zod": "npm install swr axios zod",
          "swr-yup": "npm install swr axios yup",
          "axios-zod": "npm install axios zod",
          "axios-joi": "npm install axios joi",
          "fetch-zod": "npm install zod",
          "rtk-query-zod": "npm install @reduxjs/toolkit react-redux zod",
          "next-fetch": "",
          "python-basic": "pip install requests",
        };
        const installCmd = presetInstallMap[answers.preset];
        if (installCmd) {
          console.log(`   2. Install preset dependencies:`);
          console.log(`      ${installCmd}`);
        }
      } else {
        if (answers.generateClient && answers.clientType) {
          console.log(`   2. Install client dependencies:`);
          if (answers.clientType === "axios") {
            console.log(`      npm install axios`);
          } else if (answers.clientType === "react-query") {
            console.log(`      npm install @tanstack/react-query`);
          } else if (answers.clientType === "swr") {
            console.log(`      npm install swr`);
          } else if (answers.clientType === "rtk-query") {
            console.log(`      npm install @reduxjs/toolkit react-redux`);
          }
        }

        if (answers.enableValidation && answers.validationLibrary) {
          console.log(
            `   ${
              answers.generateClient ? "3" : "2"
            }. Install validation library:`
          );
          console.log(`      npm install ${answers.validationLibrary}`);
        }
      }
    }

    // Run initial sync if requested
    if (answers.runSync && !isTestEnvironment) {
      console.log("\n🔄 Running initial sync...\n");

      try {
        // Import and run the sync
        const { Init, GenerateClient } = await import("../index");
        const initResult = await Init({
          refetchInterval: answers.refetchInterval,
        });

        if (!initResult.success) {
          console.error("\n❌ Error during sync:");
          if (initResult.errors?.length) {
            initResult.errors.forEach((e) => console.error(`   ${e}`));
          }
          console.log(
            "\n⚠️  Configuration was created successfully, but sync failed."
          );
          console.log("   You can run sync manually with: npx openapi-sync\n");
        } else {
          // Generate client if enabled
          if (answers.generateClient && answers.clientType) {
            console.log("\n🚀 Generating API client...\n");
            await GenerateClient({
              type: answers.clientType,
              apiName: answers.apiName,
            });
          }

          console.log(
            "\n✨ Setup complete! Your API types and client are ready to use.\n"
          );
        }
      } catch (syncError: any) {
        console.error("\n❌ Error during sync:", syncError.message);
        console.log(
          "\n⚠️  Configuration was created successfully, but sync failed."
        );
        console.log("   You can run sync manually with: npx openapi-sync\n");
        if (syncError.stack && process.env.DEBUG) {
          console.error(syncError.stack);
        }
      }
    } else if (!isTestEnvironment) {
      console.log(
        `\n   ${
          answers.generateClient || answers.enableValidation ? "4" : "3"
        }. Run sync to generate types:`
      );
      console.log(`      npx openapi-sync`);

      if (answers.generateClient && answers.clientType) {
        console.log(
          `\n   ${
            answers.generateClient || answers.enableValidation ? "5" : "4"
          }. Generate API client:`
        );
        console.log(
          `      npx openapi-sync generate-client --type ${answers.clientType}`
        );
      }

      console.log("\n✨ Setup complete!\n");
    }

    if (!isTestEnvironment) {
      // Show helpful tips
      console.log("💡 Helpful tips:");
      console.log(
        `   • Generated types will be in: ${answers.outputFolder}/${answers.apiName}/`
      );
      if (answers.generateClient) {
        console.log(
          `   • Generated client will be in: ${answers.outputFolder}/${answers.apiName}/client/`
        );
      }
      console.log(`   • Run 'npx openapi-sync --help' for more options`);
      if (answers.generateClient && answers.clientType) {
        console.log(
          `   • Regenerate client anytime: 'npx openapi-sync generate-client --type ${answers.clientType}'`
        );
      }
      console.log("");
    }
  } catch (error: any) {
    if (!isTestEnvironment) {
      console.error("\n❌ Error during setup:", error.message);
      process.exit(1);
    }
    throw error;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Non-interactive init (agent-safe)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Options accepted by {@link nonInteractiveInit}.
 * Each field corresponds to a `--flag` on the CLI `init` command.
 *
 * @public
 */
export interface NonInteractiveInitOptions {
  /** Optional preset name (e.g. "react-query-zod") */
  preset?: string;
  /** API name used as the key in `config.api` (e.g. `"petstore"`) */
  apiName: string;
  /** URL or local file path to the OpenAPI spec */
  apiSource?: string;
  /** Direct URL to OpenAPI spec */
  apiUrl?: string;
  /** Path to local OpenAPI spec file */
  apiFile?: string;
  /** Output folder for generated files (default: `""` project root) */
  outputFolder?: string;
  /** Config file format (default: `"typescript"`) */
  configFormat?: "typescript" | "json" | "javascript";
  /** Client type to generate (omit to skip client generation) */
  clientType?: "react-query" | "swr" | "fetch" | "axios" | "rtk-query";
  /** Validation library (omit to skip validation schema generation) */
  validationLibrary?: "zod" | "yup" | "joi";
  /** Organize files into folders by OpenAPI tags (default: `false`) */
  folderSplit?: boolean;
  /** Prefix for generated TypeScript interface names (default: `"I"`) */
  typesPrefix?: string;
  /** Use operationId from spec for naming (default: `true`) */
  useOperationId?: boolean;
  /** Tags to exclude from generation */
  excludeTags?: string[];
  /** Include cURL examples in generated docs (default: `false`) */
  showCurl?: boolean;
  /** Auto-refetch interval in milliseconds (omit to disable) */
  refetchInterval?: number;
  /** Run an initial sync after creating the config (default: `false`) */
  runSync?: boolean;
  /** Suppress all console output (default: `false`) */
  silent?: boolean;
  /** Spec authentication type (bearer, basic, apiKey, custom) */
  authType?: "bearer" | "basic" | "apiKey" | "custom";
  /** Auth token or password */
  authToken?: string;
  /** Basic auth username */
  authUsername?: string;
  /** Basic auth password */
  authPassword?: string;
  /** API key header or param name */
  authName?: string;
  /** API key secret value */
  authValue?: string;
  /** API key location (header or query) */
  authIn?: "header" | "query";
  /** Header name or 'Key: Value' string for custom auth */
  authHeader?: string;
  /** Full auth configuration object if pre-constructed */
  auth?: import("../types").ISpecAuth;
}

/**
 * Create an openapi-sync config file without any interactive prompts.
 *
 * This is the **agent-safe** counterpart to {@link interactiveInit}. Pass all
 * settings as a plain options object — no stdin required.
 *
 * CLI equivalent:
 * ```bash
 * npx openapi-sync init --no-interactive \
 *   --api-name petstore \
 *   --api-url https://petstore3.swagger.io/api/v3/openapi.json \
 *   --client-type react-query \
 *   --validation-library zod
 * ```
 *
 * @returns Structured result; `success` is false when the config write or sync fails.
 *
 * @public
 */
export const nonInteractiveInit = async (
  opts: NonInteractiveInitOptions
): Promise<{
  success: boolean;
  configFile: string;
  message: string;
  errors: string[];
  nextSteps?: string[];
}> => {
  const silent = opts.silent ?? false;
  const log = makeLogger(silent);
  const errors: string[] = [];

  const {
    apiName,
    outputFolder = "",
    configFormat = "typescript",
    clientType,
    validationLibrary,
    folderSplit = false,
    typesPrefix = "I",
    useOperationId = true,
    excludeTags = [],
    showCurl = false,
    refetchInterval,
    runSync = false,
  } = opts;

  const apiSource = opts.apiSource || opts.apiUrl || opts.apiFile || "";

  // ── Construct config object ───────────────────────────────────────────────
  const apiEntry = (() => {
    if (opts.auth) {
      return { url: apiSource, auth: opts.auth };
    }
    if (opts.authType) {
      if (opts.authType === "bearer") {
        return { url: apiSource, auth: { type: "bearer", token: opts.authToken || "" } };
      } else if (opts.authType === "basic") {
        return {
          url: apiSource,
          auth: {
            type: "basic",
            username: opts.authUsername || "",
            password: opts.authPassword || opts.authToken || "",
          },
        };
      } else if (opts.authType === "apiKey") {
        return {
          url: apiSource,
          auth: {
            type: "apiKey",
            in: opts.authIn || "header",
            name: opts.authName || opts.authHeader || "X-API-Key",
            value: opts.authValue || opts.authToken || "",
          },
        };
      } else if (opts.authType === "custom") {
        if (opts.authHeader && opts.authHeader.includes(":")) {
          const idx = opts.authHeader.indexOf(":");
          return {
            url: apiSource,
            auth: {
              type: "custom",
              headers: { [opts.authHeader.slice(0, idx).trim()]: opts.authHeader.slice(idx + 1).trim() },
            },
          };
        }
        return {
          url: apiSource,
          auth: {
            type: "custom",
            headers: opts.authHeader ? { [opts.authHeader]: opts.authToken || "" } : {},
          },
        };
      }
    }
    return apiSource;
  })();

  const config: any = {
    folder: outputFolder,
    api: { [apiName]: apiEntry },
  };

  if (opts.preset) {
    config.preset = opts.preset;
    if (folderSplit) {
      config.folderSplit = { byTags: true };
    }
    if (refetchInterval && refetchInterval > 0) {
      config.refetchInterval = refetchInterval;
    }
    if (excludeTags.length > 0) {
      config.endpoints = { exclude: { tags: excludeTags } };
    }
    if (clientType) {
      config.clientGeneration = {
        enabled: true,
        type: clientType,
        outputDir: path.join(outputFolder, apiName, "client"),
      };
      if (clientType === "react-query") {
        config.clientGeneration.reactQuery = { version: 5, mutations: true };
      } else if (clientType === "swr") {
        config.clientGeneration.swr = { mutations: true };
      }
    }
    if (validationLibrary) {
      config.validations = { library: validationLibrary };
    }
  } else {
    if (refetchInterval && refetchInterval > 0) {
      config.refetchInterval = refetchInterval;
    }

    if (folderSplit) {
      config.folderSplit = { byTags: true };
    }

    config.types = {
      name: { prefix: typesPrefix, useOperationId },
    };

    config.endpoints = {
      name: { useOperationId },
      doc: { showCurl },
    };

    if (excludeTags.length > 0) {
      config.endpoints.exclude = { tags: excludeTags };
    }

    if (clientType) {
      config.clientGeneration = {
        enabled: true,
        type: clientType,
        outputDir: path.join(outputFolder, apiName, "client"),
      };
      if (clientType === "react-query") {
        config.clientGeneration.reactQuery = { version: 5, mutations: true };
      } else if (clientType === "swr") {
        config.clientGeneration.swr = { mutations: true };
      }
    }

    if (validationLibrary) {
      config.validations = { library: validationLibrary };
    }

    config.customCode = { enabled: true, position: "bottom" };
  }

  // ── Serialise to chosen format ───────────────────────────────────────────
  let configContent: string;
  let configFileName: string;

  if (configFormat === "json") {
    configFileName = "openapi.sync.json";
    const jsonConfig = {
      $schema: "./node_modules/openapi-sync/openapi.sync.schema.json",
      ...config,
    };
    configContent = JSON.stringify(jsonConfig, null, 2);
  } else if (configFormat === "typescript") {
    configFileName = "openapi.sync.ts";
    configContent =
      `// @see node_modules/openapi-sync/openapi.sync.schema.json\n` +
      `import { defineConfig } from "openapi-sync";\n\n` +
      `export default defineConfig(${serializeObjectToTs(config, 0)});\n`;
  } else {
    configFileName = "openapi.sync.js";
    configContent =
      `// @see node_modules/openapi-sync/openapi.sync.schema.json\n` +
      `/** @type {import('openapi-sync').IConfig} */\n` +
      `module.exports = ${JSON.stringify(config, null, 2)};\n`;
  }

  const configPath = path.join(process.cwd(), configFileName);

  // ── Write config file ────────────────────────────────────────────────────
  try {
    fs.writeFileSync(configPath, configContent, "utf-8");
    log.log(`\n✅ Config written: ${configFileName}`);
  } catch (err: any) {
    errors.push(`Failed to write config: ${err.message}`);
    return {
      success: false,
      configFile: configFileName,
      message: "Config write failed.",
      errors,
    };
  }

  // ── Create output folder (best-effort) ───────────────────────────────────
  if (outputFolder && outputFolder.trim() !== "") {
    const absOutput = path.isAbsolute(outputFolder)
      ? outputFolder
      : path.join(process.cwd(), outputFolder);
    if (!fs.existsSync(absOutput)) {
      try { fs.mkdirSync(absOutput, { recursive: true }); } catch { /* ok */ }
    }
  }

  const resolvedClientType =
    clientType || (opts.preset && PRESETS[opts.preset as PresetName]?.clientGeneration?.type);
  const clientWillBeGenerated = !!(
    resolvedClientType ||
    (config.clientGeneration && config.clientGeneration.enabled && config.clientGeneration.type)
  );

  // ── Optionally run initial sync ──────────────────────────────────────────
  if (runSync) {
    log.log("\n🔄 Running initial sync...");
    try {
      const { Init } = await import("../index");
      const syncResult = await Init({ silent });
      if (!syncResult.success) {
        if (syncResult.errors && syncResult.errors.length > 0) {
          errors.push(...syncResult.errors);
        } else {
          errors.push("Initial sync failed to generate files.");
        }
      } else {
        log.log("✅ Sync complete.");
      }
    } catch (err: any) {
      errors.push(`Sync failed: ${err.message}`);
    }
  }

  const rawSteps: { label: string; cmd: string }[] = [
    { label: "Validate:      ", cmd: "npx openapi-sync validate" },
    {
      label: "Sync:          ",
      cmd: clientWillBeGenerated
        ? "npx openapi-sync (types + client)"
        : "npx openapi-sync",
    },
  ];

  if (resolvedClientType) {
    rawSteps.push({
      label: "Client:        ",
      cmd: `npx openapi-sync generate-client --type ${resolvedClientType}`,
    });
  }

  rawSteps.push({
    label: "Health Check:  ",
    cmd: "npx openapi-sync doctor",
  });

  const checklist = rawSteps.map(
    (step, index) => `${index + 1}. ${step.label} ${step.cmd}`
  );

  if (!silent && !isTestEnvironment) {
    log.log("📋 First-run checklist:");
    checklist.forEach((step) => log.log(`   ${step}`));
    log.log("");
  }

  let message: string;
  if (errors.length > 0) {
    message = `Config created: ${configFileName}, but initial sync failed (${errors.length} error${errors.length > 1 ? "s" : ""}).`;
  } else if (runSync) {
    message = `Config created: ${configFileName}. Files generated successfully.`;
  } else {
    message = `Config created: ${configFileName}. Run \`npx openapi-sync\` to generate ${clientWillBeGenerated ? "types and clients" : "types"}.`;
  }

  log.log(`\n${message}\n`);

  return { success: errors.length === 0, configFile: configFileName, message, errors, nextSteps: checklist };
}
