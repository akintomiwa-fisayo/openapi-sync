import OpenapiSync from "./Openapi-sync";
import dotenv from "dotenv";
import path from "path";
import { resetState } from "./Openapi-sync/state";
import { IConfig } from "./types";

dotenv.config();

const rootUsingCwd = process.cwd();

export const Init = async (options?: { refetchInterval?: number }) => {
  // Load config file
  let configJS, configJson;
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
  const config: IConfig = configJS || configJson;

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
