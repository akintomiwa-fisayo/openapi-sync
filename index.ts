import OpenapiSync from "./Openapi-sync";
import dotenv from "dotenv";
import path from "path";
import { resetState } from "./Openapi-sync/state";

dotenv.config();

const rootUsingCwd = process.cwd();

const Init = async () => {
  // Load config file
  const config = require(path.join(rootUsingCwd, "openapi.sync.json"));
  const apiNames = Object.keys(config.api);

  resetState();
  for (let i = 0; i < apiNames.length; i += 1) {
    const apiName = apiNames[i];
    const apiUrl = config.api[apiName];

    OpenapiSync(apiUrl, apiName);
  }
};

Init();
