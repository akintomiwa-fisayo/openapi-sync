import path from "path";
import { IOpenApiSpec } from "./types";
import fs from "fs";

const dbPath = path.join(__dirname, "../", "../db.json");
let state: Record<string, IOpenApiSpec> = require(dbPath);

const updateDB = (data: typeof state) => {
  fs.writeFileSync(dbPath, JSON.stringify(data));
};
export const setState = (key: string, value: IOpenApiSpec) => {
  state[key] = value;
  updateDB(state);
};

export const getState = (key: string): IOpenApiSpec | undefined => {
  return state[key];
};

export const resetState = () => {
  state = {};
  updateDB(state);
};
