import { IConfig, PresetName } from "../types";

export type { PresetName };

export type PresetDefinition = Omit<IConfig, "api" | "preset">;

export const PRESETS: Record<PresetName, PresetDefinition> = {
  "react-query-zod": {
    clientGeneration: {
      enabled: true,
      type: "react-query",
      reactQuery: { version: 5, mutations: true },
    },
    validations: { library: "zod" },
    customCode: { enabled: true, position: "bottom" },
    types: { name: { prefix: "I", useOperationId: true } },
    endpoints: { name: { useOperationId: true }, doc: { showCurl: false } },
  },
  "react-query-yup": {
    clientGeneration: {
      enabled: true,
      type: "react-query",
      reactQuery: { version: 5, mutations: true },
    },
    validations: { library: "yup" },
    customCode: { enabled: true, position: "bottom" },
    types: { name: { prefix: "I", useOperationId: true } },
    endpoints: { name: { useOperationId: true }, doc: { showCurl: false } },
  },
  "swr-zod": {
    clientGeneration: { enabled: true, type: "swr", swr: { mutations: true } },
    validations: { library: "zod" },
    customCode: { enabled: true, position: "bottom" },
    types: { name: { prefix: "I", useOperationId: true } },
    endpoints: { name: { useOperationId: true }, doc: { showCurl: false } },
  },
  "swr-yup": {
    clientGeneration: { enabled: true, type: "swr", swr: { mutations: true } },
    validations: { library: "yup" },
    customCode: { enabled: true, position: "bottom" },
    types: { name: { prefix: "I", useOperationId: true } },
    endpoints: { name: { useOperationId: true }, doc: { showCurl: false } },
  },
  "axios-zod": {
    clientGeneration: { enabled: true, type: "axios" },
    validations: { library: "zod" },
    customCode: { enabled: true, position: "bottom" },
    types: { name: { prefix: "I", useOperationId: true } },
    endpoints: { name: { useOperationId: true }, doc: { showCurl: false } },
  },
  "axios-joi": {
    clientGeneration: { enabled: true, type: "axios" },
    validations: { library: "joi" },
    customCode: { enabled: true, position: "bottom" },
    types: { name: { prefix: "I", useOperationId: true } },
    endpoints: { name: { useOperationId: true }, doc: { showCurl: false } },
  },
  "fetch-zod": {
    clientGeneration: { enabled: true, type: "fetch" },
    validations: { library: "zod" },
    customCode: { enabled: true, position: "bottom" },
    types: { name: { prefix: "I", useOperationId: true } },
    endpoints: { name: { useOperationId: true }, doc: { showCurl: false } },
  },
  "rtk-query-zod": {
    clientGeneration: {
      enabled: true,
      type: "rtk-query",
      rtkQuery: { apiName: "api", baseQuery: "fetchBaseQuery" },
    },
    validations: { library: "zod" },
    customCode: { enabled: true, position: "bottom" },
    types: { name: { prefix: "I", useOperationId: true } },
    endpoints: { name: { useOperationId: true }, doc: { showCurl: false } },
  },
  "next-fetch": {
    clientGeneration: { enabled: true, type: "fetch", next: true },
    validations: { disable: true },
    customCode: { enabled: true, position: "bottom" },
    types: { name: { prefix: "I", useOperationId: true } },
    endpoints: { name: { useOperationId: true }, doc: { showCurl: false } },
  },
  "python-basic": {
    language: "python",
    types: { name: { prefix: "", useOperationId: true } },
    endpoints: { name: { useOperationId: true }, doc: { showCurl: false } },
  },
};

/**
 * Given a preset name and user's raw config, deep-merge the preset defaults
 * under the user config. User values always take precedence.
 *
 * Deep merge rules:
 * - If both preset and user have an object at the same key, merge recursively.
 * - If user has a value at any key, it wins completely.
 * - Preset values only apply when the user has NOT specified that key.
 */
export function applyPreset(
  userConfig: IConfig,
  presetName: string
): IConfig {
  const preset = PRESETS[presetName as PresetName];
  if (!preset) {
    throw new Error(
      `Unknown preset "${presetName}". Valid presets: ${Object.keys(PRESETS).join(", ")}`
    );
  }
  return deepMergePreset(preset, userConfig) as IConfig;
}

/** Recursively merge src into target. target values win on conflict. */
function deepMergePreset(src: any, target: any): any {
  if (typeof src !== "object" || src === null) return target ?? src;
  if (typeof target !== "object" || target === null) return target ?? src;
  const result: any = { ...src };
  for (const key of Object.keys(target)) {
    if (key in src && typeof src[key] === "object" && typeof target[key] === "object" && !Array.isArray(target[key])) {
      result[key] = deepMergePreset(src[key], target[key]);
    } else {
      result[key] = target[key];
    }
  }
  return result;
}
