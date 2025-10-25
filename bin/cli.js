#!/usr/bin/env node

const OpenApisync = require("../dist/index");

const yargs = require("yargs/yargs");
const { hideBin } = require("yargs/helpers");

// Setup yargs with commands
const argv = yargs(hideBin(process.argv))
  .command(
    "init",
    "Interactive setup wizard to create configuration",
    () => {},
    async () => {
      await OpenApisync.InteractiveInit();
    }
  )
  .command(
    ["$0", "sync"],
    "Sync OpenAPI specifications and generate types",
    (yargs) => {
      return yargs.option("refreshinterval", {
        alias: "ri",
        type: "number",
        description: "Interval at which to refetch specifications",
      });
    },
    (argv) => {
      OpenApisync.Init({
        refetchInterval: argv.refreshinterval,
      });
    }
  )
  .command(
    "generate-client",
    "Generate API client from OpenAPI specification",
    (yargs) => {
      return yargs
        .option("type", {
          alias: "t",
          type: "string",
          description: "Client type to generate",
          choices: ["fetch", "axios", "react-query", "swr", "rtk-query"],
          demandOption: true,
        })
        .option("api", {
          alias: "a",
          type: "string",
          description:
            "API name from config (generates for all APIs if not specified)",
        })
        .option("tags", {
          type: "array",
          description: "Filter endpoints by tags",
        })
        .option("endpoints", {
          alias: "e",
          type: "array",
          description: "Filter by specific endpoint names",
        })
        .option("output", {
          alias: "o",
          type: "string",
          description: "Output directory for generated client",
        })
        .option("base-url", {
          alias: "b",
          type: "string",
          description: "Base URL for API requests",
        })
        .example(
          "$0 generate-client --type fetch",
          "Generate fetch client for all APIs"
        )
        .example(
          "$0 generate-client --type react-query --api petstore",
          "Generate React Query hooks for petstore API"
        )
        .example(
          "$0 generate-client --type axios --tags pets,users",
          "Generate axios client for endpoints with pets or users tags"
        )
        .example(
          "$0 generate-client --type swr --endpoints getPetById,createPet",
          "Generate SWR hooks for specific endpoints"
        );
    },
    async (argv) => {
      // First, sync API specs and generate types/endpoints
      console.log("🔄 Syncing API specifications first...\n");
      await OpenApisync.Init();

      console.log("\n🚀 Now generating client...\n");

      // Then generate the client
      await OpenApisync.GenerateClient({
        type: argv.type,
        apiName: argv.api,
        tags: argv.tags,
        endpoints: argv.endpoints,
        outputDir: argv.output,
        baseURL: argv["base-url"],
      });
    }
  )
  .example("$0 init", "Start interactive setup wizard")
  .example("$0", "Sync API types and endpoints")
  .example("$0 --refreshinterval 10000", "Sync with 10s refresh interval")
  .help()
  .alias("help", "h")
  .version()
  .alias("version", "v")
  .demandCommand(1, "You need to specify a command")
  .strict().argv;
