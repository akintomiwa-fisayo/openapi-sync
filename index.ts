import OpenapiSync from "./Openapi-sync";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import { resetState } from "./Openapi-sync/state";
import { IConfig } from "./types";

dotenv.config();

const rootUsingCwd = process.cwd();

export const Init = async (options?: { refetchInterval?: number }) => {
  // Load config file
  let configJS, configJson, configTS;
  try {
    configJS = require(path.join(rootUsingCwd, "openapi.sync.js"));
  } catch (e) {
    // console.log(e);
  }

  try {
    configJson = require(path.join(rootUsingCwd, "openapi.sync.json"));
  } catch (e) {
    // console.log(e);
  }

  try {
    // Check if TypeScript config file exists first
    const tsConfigPath = path.join(rootUsingCwd, "openapi.sync.ts");
    if (fs.existsSync(tsConfigPath)) {
      // Register TypeScript loader before requiring the file
      try {
        require("esbuild-register");
      } catch (registerError) {
        throw registerError;
      }

      // Now try to load TypeScript config
      configTS = require(tsConfigPath);
    }
  } catch (e) {}

  const config: IConfig = configTS || configJS || configJson;

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
