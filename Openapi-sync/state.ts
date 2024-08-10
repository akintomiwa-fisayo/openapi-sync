import { IOpenApiSpec } from "./types";

let state: Record<string, IOpenApiSpec> = {};

export const setState = (key: string, value: IOpenApiSpec) => {
  state[key] = value;
};

export const getState = (key: string): IOpenApiSpec | undefined => {
  return state[key];
};

export const resetState = () => {
  state = {};
};
