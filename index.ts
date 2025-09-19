import OpenapiSync from "./Openapi-sync";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import { resetState } from "./Openapi-sync/state";
import { IConfig } from "./types";

// Re-export modules for user consumption
export * from "./types";
export * from "./helpers";
export * from "./regex";

dotenv.config();

const rootUsingCwd = process.cwd();

export const Init = async (options?: { refetchInterval?: number }) => {
  // Load config file
  let configJS;
  // Register TypeScript loader before requiring the file
  try {
    require("esbuild-register");
  } catch (registerError) {
    throw registerError;
  }

  const jsConfigPath = path.join(rootUsingCwd, "openapi.sync.");
  const tsConfigPath = path.join(rootUsingCwd, "openapi.sync.ts");
  const jsonConfigPath = path.join(rootUsingCwd, "openapi.sync.json");
  const configPaths = [jsConfigPath, tsConfigPath, jsonConfigPath];
  try {
    for (const configPath of configPaths) {
      if (fs.existsSync(configPath)) {
        configJS = require(configPath);

        if (Object.keys(configJS).length === 1 && configJS.default) {
          configJS = configJS.default;
        }
      }
    }
  } catch (e) {
    console.log(e);
  }

  if (typeof configJS === "function") {
    configJS = configJS();
  }
  const config: IConfig = configJS;

  if (!config) {
    throw new Error("No config found");
  }
  const apiNames = Object.keys(config.api);
  const refetchInterval =
    options &&
    "refetchInterval" in options &&
    !isNaN(options?.refetchInterval as number)
      ? options.refetchInterval
      : config.refetchInterval;
  resetState();
  for (let i = 0; i < apiNames.length; i += 1) {
    const apiName = apiNames[i];
    const apiUrl = config.api[apiName];

    OpenapiSync(apiUrl, apiName, config, refetchInterval);
  }
};
