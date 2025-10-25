import prompts from "prompts";
import fs from "fs";
import path from "path";

interface InitAnswers {
  configFormat: "json" | "typescript" | "javascript";
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
          message: "Where should generated files be saved?",
          initial: "./src/api",
          validate: (value: string) => {
            if (!value || value.trim() === "") {
              return "Output folder cannot be empty";
            }

            // Prevent dangerous root paths
            const normalizedPath = path.normalize(value);
            if (
              normalizedPath === "/" ||
              normalizedPath === "C:\\" ||
              normalizedPath === "\\"
            ) {
              return "Cannot use filesystem root directory. Please use a project subfolder like './src/api'";
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
          type: "confirm",
          name: "enableFolderSplit",
          message: "Organize generated code into folders by OpenAPI tags?",
          initial: false,
        },
        {
          type: "confirm",
          name: "generateClient",
          message: "Generate API client code?",
          initial: true,
        },
        {
          type: (prev) => (prev ? "select" : null),
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
          type: "confirm",
          name: "enableValidation",
          message: "Enable runtime validation schemas?",
          initial: true,
        },
        {
          type: (prev) => (prev ? "select" : null),
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
          type: "confirm",
          name: "enableCustomCode",
          message: "Enable custom code preservation?",
          initial: true,
        },
        {
          type: "confirm",
          name: "typesUseOperationId",
          message: "Use operationId from OpenAPI spec for type names?",
          initial: true,
        },
        {
          type: "text",
          name: "typesPrefix",
          message:
            "Prefix for TypeScript interface names (leave empty for none):",
          initial: "I",
        },
        {
          type: "confirm",
          name: "excludeEndpointsByTags",
          message: "Exclude endpoints by tags (e.g., deprecated, internal)?",
          initial: false,
        },
        {
          type: (prev) => (prev ? "text" : null),
          name: "excludeTags",
          message: "Enter tags to exclude (comma-separated):",
          initial: "deprecated,internal",
        },
        {
          type: "confirm",
          name: "showCurlInDocs",
          message: "Include cURL examples in generated documentation?",
          initial: true,
        },
        {
          type: "number",
          name: "refetchInterval",
          message:
            "Refetch interval in milliseconds (0 to disable auto-refresh):",
          initial: 5000,
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
      folder: answers.outputFolder,
      api: {
        [answers.apiName]: answers.apiUrl || answers.apiFile,
      },
    };

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

    // Generate config file content
    let configContent: string;
    let configFileName: string;

    if (answers.configFormat === "json") {
      configFileName = "openapi.sync.json";
      configContent = JSON.stringify(config, null, 2);
    } else if (answers.configFormat === "typescript") {
      configFileName = "openapi.sync.ts";
      configContent = `import { IConfig } from "openapi-sync";

const config: IConfig = ${JSON.stringify(config, null, 2)};

export default config;
`;
    } else {
      // javascript
      configFileName = "openapi.sync.js";
      configContent = `module.exports = ${JSON.stringify(config, null, 2)};
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

    // Run initial sync if requested
    if (answers.runSync && !isTestEnvironment) {
      console.log("\n🔄 Running initial sync...\n");

      try {
        // Import and run the sync
        const { Init, GenerateClient } = await import("../index");
        await Init({
          refetchInterval: answers.refetchInterval,
        });

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
