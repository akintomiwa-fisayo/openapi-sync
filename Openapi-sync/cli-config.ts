import { IConfig, IApiSource, ISpecAuth, PresetName } from "../types";
import { applyPreset, PRESETS } from "./presets";

/**
 * Extract an ISpecAuth object from CLI argv flags.
 */
export function extractCliAuthFromArgv(argv: Record<string, any>): ISpecAuth | undefined {
  if (!argv) return undefined;

  const authType = argv["auth-type"] ?? argv.authType;
  const authToken = argv["auth-token"] ?? argv.authToken;
  const authUsername = argv["auth-username"] ?? argv.authUsername;
  const authPassword = argv["auth-password"] ?? argv.authPassword;
  const authName = argv["auth-name"] ?? argv.authName;
  const authValue = argv["auth-value"] ?? argv.authValue;
  const authIn = argv["auth-in"] ?? argv.authIn;
  const authHeader = argv["auth-header"] ?? argv.authHeader;

  if (authType === "bearer" || authToken) {
    return {
      type: "bearer",
      token: String(authToken || ""),
    };
  }

  if (authType === "basic" || (authUsername && authPassword)) {
    return {
      type: "basic",
      username: String(authUsername || ""),
      password: String(authPassword || ""),
    };
  }

  if (authType === "apiKey" || authName || authValue) {
    return {
      type: "apiKey",
      in: authIn === "query" ? "query" : "header",
      name: String(authName || "X-API-Key"),
      value: String(authValue || ""),
    };
  }

  if (authType === "custom" || authHeader) {
    const headers: Record<string, string> = {};
    const rawHeaders = Array.isArray(authHeader)
      ? authHeader
      : [authHeader].filter(Boolean);
    for (const h of rawHeaders) {
      if (typeof h === "string" && h.includes(":")) {
        const idx = h.indexOf(":");
        headers[h.slice(0, idx).trim()] = h.slice(idx + 1).trim();
      }
    }
    return {
      type: "custom",
      headers,
    };
  }

  return undefined;
}

/**
 * Parses comma-separated string or array into string array.
 */
function parseStringArray(val: any): string[] | undefined {
  if (!val) return undefined;
  if (Array.isArray(val)) return val.map(String);
  if (typeof val === "string") {
    return val.split(",").map((s) => s.trim()).filter(Boolean);
  }
  return undefined;
}

/**
 * Construct an in-memory IConfig from CLI flags, or merge CLI flags on top
 * of an existing disk configuration.
 *
 * Returns null if no disk configuration exists AND no API spec was supplied via CLI.
 */
export function buildConfigFromCli(
  argv: Record<string, any>,
  diskConfig?: IConfig | null
): IConfig | null {
  if (!argv && !diskConfig) return null;

  let base: Partial<IConfig> = {};

  // 1. If --config-json was passed, parse it as base
  if (argv?.["config-json"]) {
    try {
      base = typeof argv["config-json"] === "string"
        ? JSON.parse(argv["config-json"])
        : argv["config-json"];
    } catch (e: any) {
      throw new Error(`Invalid JSON passed to --config-json: ${e.message}`);
    }
  } else if (diskConfig) {
    base = { ...diskConfig };
  }

  // 2. Extract APIs from CLI flags
  const cliApis: Record<string, IApiSource> = {};
  const auth = extractCliAuthFromArgv(argv);

  // Check --api-url / apiUrl / --api-file / apiFile
  const apiUrlOrFile = argv?.["api-url"] ?? argv?.apiUrl ?? argv?.["api-file"] ?? argv?.apiFile;
  if (apiUrlOrFile) {
    const url = String(apiUrlOrFile).trim();
    const name = argv?.["api-name"] ?? argv?.apiName ?? (argv?.api && !argv.api.includes("=") && !argv.api.startsWith("http") ? argv.api : "api");
    cliApis[name] = auth ? { url, auth } : url;
  }

  // Check --api flag (could be key=value or URL or plain name)
  if (argv?.api) {
    const apiArgs = Array.isArray(argv.api) ? argv.api : [argv.api];
    for (const item of apiArgs) {
      if (typeof item === "string" && item.includes("=")) {
        const [k, v] = item.split("=");
        const trimmedK = k.trim();
        const trimmedV = v.trim();
        if (trimmedK && trimmedV) {
          cliApis[trimmedK] = auth ? { url: trimmedV, auth } : trimmedV;
        }
      } else if (typeof item === "string" && (item.startsWith("http://") || item.startsWith("https://") || item.endsWith(".json") || item.endsWith(".yaml") || item.endsWith(".yml"))) {
        // Direct URL passed to --api
        const name = argv["api-name"] || argv.apiName || "api";
        cliApis[name] = auth ? { url: item, auth } : item;
      }
    }
  }

  // Check if we have any APIs at all
  const hasCliApis = Object.keys(cliApis).length > 0;
  const hasBaseApis = Boolean(base.api && Object.keys(base.api).length > 0);

  if (!hasCliApis && !hasBaseApis) {
    // No API specified anywhere
    return null;
  }

  const mergedApis = {
    ...(base.api || {}),
    ...cliApis,
  };

  // If a global auth was provided and an API source has no auth, attach it
  if (auth) {
    for (const [k, v] of Object.entries(mergedApis)) {
      if (typeof v === "string") {
        mergedApis[k] = { url: v, auth };
      } else if (v && !v.auth) {
        mergedApis[k] = { ...v, auth };
      }
    }
  }

  const resolvedFolder =
    argv?.folder ??
    argv?.["output-folder"] ??
    argv?.outputFolder ??
    base.folder ??
    "";

  const result: IConfig = {
    folder: resolvedFolder,
    api: mergedApis,
  };

  if (argv?.preset || base.preset) {
    result.preset = (argv?.preset || base.preset) as PresetName;
  }

  if (argv?.language || base.language) {
    result.language = argv?.language || base.language;
  }

  if (argv?.server !== undefined || base.server !== undefined) {
    result.server = argv?.server !== undefined ? argv.server : base.server;
  }

  const refetchIntervalVal =
    argv?.["refetch-interval"] ??
    argv?.refetchInterval ??
    argv?.refreshinterval ??
    argv?.ri ??
    base.refetchInterval;
  if (refetchIntervalVal !== undefined) {
    result.refetchInterval = Number(refetchIntervalVal);
  }

  // Folder splitting
  const splitByTagsVal =
    argv?.["split-by-tags"] ??
    argv?.["folder-split"] ??
    argv?.folderSplit ??
    argv?.splitByTags;
  if (splitByTagsVal !== undefined || base.folderSplit) {
    result.folderSplit = {
      ...(base.folderSplit || {}),
      byTags: splitByTagsVal !== undefined ? Boolean(splitByTagsVal) : base.folderSplit?.byTags,
    };
  }

  // Custom code preservation
  if (
    argv?.["custom-code"] !== undefined ||
    argv?.["no-custom-code"] !== undefined ||
    argv?.["custom-code-position"] !== undefined ||
    argv?.["custom-code-marker"] !== undefined ||
    base.customCode
  ) {
    result.customCode = {
      ...(base.customCode || {}),
      enabled: argv?.["no-custom-code"]
        ? false
        : argv?.["custom-code"] !== undefined
        ? Boolean(argv["custom-code"])
        : base.customCode?.enabled ?? true,
      position: argv?.["custom-code-position"] || base.customCode?.position || "bottom",
      markerText: argv?.["custom-code-marker"] || base.customCode?.markerText || "CUSTOM CODE",
    };
  }

  // Validations
  const validationLib =
    argv?.["validation-lib"] ||
    argv?.["validations-library"] ||
    argv?.["validation-library"] ||
    argv?.validationLibrary;
  const validationsDisabled = argv?.["no-validations"] || argv?.["validations-disable"];
  if (
    validationLib ||
    validationsDisabled !== undefined ||
    argv?.["validations-query"] !== undefined ||
    argv?.["validations-dto"] !== undefined ||
    argv?.["validations-prefix"] !== undefined ||
    argv?.["validations-suffix"] !== undefined ||
    base.validations
  ) {
    result.validations = {
      ...(base.validations || {}),
      disable: validationsDisabled !== undefined ? Boolean(validationsDisabled) : base.validations?.disable,
      library: validationLib || base.validations?.library,
      generate: {
        ...(base.validations?.generate || {}),
        query: argv?.["validations-query"] !== undefined ? Boolean(argv["validations-query"]) : base.validations?.generate?.query,
        dto: argv?.["validations-dto"] !== undefined ? Boolean(argv["validations-dto"]) : base.validations?.generate?.dto,
      },
      name: {
        ...(base.validations?.name || {}),
        prefix: argv?.["validations-prefix"] || base.validations?.name?.prefix,
        suffix: argv?.["validations-suffix"] || base.validations?.name?.suffix,
      },
    };
  }

  // Client Generation
  const clientType = argv?.["client-type"];
  if (
    clientType ||
    argv?.["client-output"] ||
    argv?.["client-base-url"] ||
    argv?.["client-tags"] ||
    argv?.["client-mutations"] !== undefined ||
    argv?.["client-infinite"] !== undefined ||
    argv?.["client-react-query-version"] !== undefined ||
    argv?.["client-rtk-base-query"] !== undefined ||
    base.clientGeneration
  ) {
    result.clientGeneration = {
      ...(base.clientGeneration || {}),
      enabled: clientType ? true : base.clientGeneration?.enabled,
      type: clientType || base.clientGeneration?.type,
      outputDir: argv?.["client-output"] || base.clientGeneration?.outputDir,
      baseURL: argv?.["client-base-url"] || base.clientGeneration?.baseURL,
      tags: parseStringArray(argv?.["client-tags"]) || base.clientGeneration?.tags,
    };

    if (argv?.["client-mutations"] !== undefined || argv?.["client-react-query-version"] || argv?.["client-infinite"] !== undefined) {
      result.clientGeneration.reactQuery = {
        ...(base.clientGeneration?.reactQuery || {}),
        version: argv?.["client-react-query-version"] ? Number(argv["client-react-query-version"]) as 4 | 5 : base.clientGeneration?.reactQuery?.version,
        mutations: argv?.["client-mutations"] !== undefined ? Boolean(argv["client-mutations"]) : base.clientGeneration?.reactQuery?.mutations,
        infiniteQueries: argv?.["client-infinite"] !== undefined ? { disable: !argv["client-infinite"] } : base.clientGeneration?.reactQuery?.infiniteQueries,
      };
      result.clientGeneration.swr = {
        ...(base.clientGeneration?.swr || {}),
        mutations: argv?.["client-mutations"] !== undefined ? Boolean(argv["client-mutations"]) : base.clientGeneration?.swr?.mutations,
        infiniteQueries: argv?.["client-infinite"] !== undefined ? { disable: !argv["client-infinite"] } : base.clientGeneration?.swr?.infiniteQueries,
      };
    }

    if (argv?.["client-rtk-base-query"]) {
      result.clientGeneration.rtkQuery = {
        ...(base.clientGeneration?.rtkQuery || {}),
        baseQuery: argv["client-rtk-base-query"],
      };
    }
  }

  // Types & Documentation
  const noDocs = argv?.["no-docs"];
  const showCurl = argv?.["show-curl"];
  const typePrefix =
    argv?.["type-prefix"] !== undefined
      ? argv["type-prefix"]
      : argv?.["types-prefix"] !== undefined
      ? argv["types-prefix"]
      : argv?.typePrefix !== undefined
      ? argv.typePrefix
      : argv?.typesPrefix;
  const useOperationId = argv?.["use-operation-id"];

  if (typePrefix !== undefined || useOperationId !== undefined || base.types) {
    result.types = {
      ...(base.types || {}),
      name: {
        ...(base.types?.name || {}),
        prefix: typePrefix !== undefined ? typePrefix : base.types?.name?.prefix,
        useOperationId: useOperationId !== undefined ? Boolean(useOperationId) : base.types?.name?.useOperationId,
      },
    };
  }

  const endpointType = argv?.["endpoint-type"] || argv?.endpointType;
  if (
    useOperationId !== undefined ||
    noDocs !== undefined ||
    showCurl !== undefined ||
    argv?.["exclude-tags"] ||
    argv?.["include-tags"] ||
    endpointType !== undefined ||
    base.endpoints
  ) {
    result.endpoints = {
      ...(base.endpoints || {}),
      ...(endpointType !== undefined || base.endpoints?.value
        ? {
            value: {
              ...(base.endpoints?.value || {}),
              ...(endpointType !== undefined ? { type: endpointType } : {}),
            },
          }
        : {}),
      name: {
        ...(base.endpoints?.name || {}),
        useOperationId: useOperationId !== undefined ? Boolean(useOperationId) : base.endpoints?.name?.useOperationId,
      },
      doc: {
        ...(base.endpoints?.doc || {}),
        disable: noDocs !== undefined ? Boolean(noDocs) : base.endpoints?.doc?.disable,
        showCurl: showCurl !== undefined ? Boolean(showCurl) : base.endpoints?.doc?.showCurl,
      },
      exclude: {
        ...(base.endpoints?.exclude || {}),
        tags: parseStringArray(argv?.["exclude-tags"]) || base.endpoints?.exclude?.tags,
      },
      include: {
        ...(base.endpoints?.include || {}),
        tags: parseStringArray(argv?.["include-tags"]) || base.endpoints?.include?.tags,
      },
    };
  }

  // 4. Apply preset if preset is specified
  if (result.preset) {
    return applyPreset(result, result.preset);
  }

  return result;
}
