import fs from "fs";
import path from "path";
import axios from "axios";
import SwaggerParser from "@apidevtools/swagger-parser";
import { DoctorResult, DoctorCheckItem, IConfig } from "../types";
import { makeLogger } from "../logger";
import { checkPeerDependencies } from "./client-generation";
import { getCachePath } from "./state";
import { getStoredEndpoints } from "./endpoint-store";
import { tryLoadConfig } from "./config-loader";

/**
 * Diagnostic health check for OpenAPI Sync project setup.
 *
 * Validates:
 * 1. Configuration file existence and syntax
 * 2. API spec accessibility and endpoint count
 * 3. Required peer dependencies for clients and validation libraries
 * 4. Cache status and storage
 * 5. Output directory permissions
 *
 * **Agent-safe** — returns structured DoctorResult.
 *
 * @param {Object} [options]
 * @param {boolean} [options.silent=false] - Suppress console output
 * @returns {Promise<DoctorResult>} Structured diagnostic report
 * @public
 */
const rootUsingCwd = process.cwd();

export const runDoctor = async (options?: { silent?: boolean }): Promise<DoctorResult> => {
  const silent = options?.silent ?? false;
  const log = makeLogger(silent);

  const checks: DoctorCheckItem[] = [];
  const recommendations: string[] = [];

  log.log("\n🩺 Running OpenAPI Sync Doctor...\n");

  // 1. Config Check
  const configResult = tryLoadConfig();
  const foundConfigPath = configResult.foundPath;
  const loadedConfig = configResult.config;

  if (!foundConfigPath) {
    checks.push({
      id: "config-file",
      name: "Configuration File",
      status: "fail",
      message: "No openapi.sync configuration file found in working directory.",
      details: { error: configResult.error },
    });
    recommendations.push("Run 'npx openapi-sync init' to create a configuration file.");
  } else if (!loadedConfig) {
    checks.push({
      id: "config-file",
      name: "Configuration File",
      status: "fail",
      message: configResult.error || `Failed to parse ${path.basename(foundConfigPath)}.`,
      details: { configFile: foundConfigPath, error: configResult.error },
    });
    recommendations.push("Fix syntax or type errors in your openapi.sync config file.");
  } else if (!loadedConfig.api || Object.keys(loadedConfig.api).length === 0) {
    checks.push({
      id: "config-file",
      name: "Configuration File",
      status: "fail",
      message: `Configuration at ${path.basename(foundConfigPath)} has no 'api' definitions.`,
      details: { configFile: foundConfigPath },
    });
    recommendations.push("Define at least one API under the 'api' block in your configuration.");
  } else {
    const apiCount = Object.keys(loadedConfig.api).length;
    checks.push({
      id: "config-file",
      name: "Configuration File",
      status: "pass",
      message: `Found valid configuration: ${path.basename(foundConfigPath)} (${apiCount} API${apiCount > 1 ? "s" : ""} configured).`,
      details: { configFile: foundConfigPath, apis: Object.keys(loadedConfig.api) },
    });

    // Check for potential folder name duplicate nesting
    if (loadedConfig.folder && loadedConfig.api) {
      const normalizedFolder = loadedConfig.folder.replace(/\\/g, "/").replace(/\/$/, "");
      const folderBase = path.basename(normalizedFolder);
      for (const apiName of Object.keys(loadedConfig.api)) {
        if (folderBase.toLowerCase() === apiName.toLowerCase()) {
          checks.push({
            id: "folder-nesting",
            name: "Output Folder Structure",
            status: "warn",
            message: `Config folder '${loadedConfig.folder}' matches API name '${apiName}'. Output will be written to '${path.join(loadedConfig.folder, apiName)}'.`,
            details: {
              folder: loadedConfig.folder,
              apiName,
              resolvedPath: path.join(loadedConfig.folder, apiName),
            },
          });
          recommendations.push(
            `If you prefer flat output for '${apiName}', set 'folder' to '${path.dirname(loadedConfig.folder) === "." ? "./src/api" : path.dirname(loadedConfig.folder)}'.`
          );
        }
      }
    }
  }

  // 2. Spec Connectivity & Validation Check
  if (loadedConfig && loadedConfig.api) {
    for (const [apiName, apiSource] of Object.entries(loadedConfig.api)) {
      try {
        let specData: any;
        if (typeof apiSource === "string" && (apiSource.startsWith("http://") || apiSource.startsWith("https://"))) {
          const res = await axios.get(apiSource, { timeout: 10000 });
          specData = res.data;
        } else if (typeof apiSource === "string") {
          const localPath = path.isAbsolute(apiSource) ? apiSource : path.join(rootUsingCwd, apiSource);
          if (!fs.existsSync(localPath)) {
            throw new Error(`Local file not found: ${localPath}`);
          }
          specData = fs.readFileSync(localPath, "utf-8");
          if (typeof specData === "string" && (specData.trim().startsWith("{") || specData.trim().startsWith("["))) {
            specData = JSON.parse(specData);
          }
        }

        const parsed: any = await SwaggerParser.parse(specData);
        let opCount = 0;
        if (parsed.paths) {
          for (const p of Object.values(parsed.paths) as any[]) {
            if (p && typeof p === "object") {
              const methods = ["get", "post", "put", "delete", "patch", "options", "head", "trace"];
              for (const m of methods) {
                if (p[m]) opCount++;
              }
            }
          }
        }

        checks.push({
          id: `spec-${apiName}`,
          name: `API Spec: ${apiName}`,
          status: "pass",
          message: `Reachable and valid (${opCount} operations found).`,
          details: { apiName, source: apiSource, operationCount: opCount },
        });
      } catch (err: any) {
        checks.push({
          id: `spec-${apiName}`,
          name: `API Spec: ${apiName}`,
          status: "fail",
          message: `Spec error: ${err.message}`,
          details: { apiName, source: apiSource, error: err.message },
        });
        recommendations.push(`Verify network access or schema validity for ${apiName} at ${apiSource}.`);
      }
    }
  }

  // 3. Peer Dependencies Check
  const clientType = loadedConfig?.clientGeneration?.type;
  const validationLib = loadedConfig?.validations?.library;
  const peerWarnings = checkPeerDependencies(clientType, validationLib);

  if (peerWarnings.length === 0) {
    checks.push({
      id: "peer-dependencies",
      name: "Peer Dependencies",
      status: "pass",
      message: "All required peer dependencies for client/validation generation are installed.",
      details: { clientType, validationLibrary: validationLib },
    });
  } else {
    checks.push({
      id: "peer-dependencies",
      name: "Peer Dependencies",
      status: "warn",
      message: `Missing peer dependencies: ${peerWarnings.length} warning(s).`,
      details: { warnings: peerWarnings },
    });
    peerWarnings.forEach((w) => recommendations.push(w));
  }

  // 4. Cache Check
  const cachePath = getCachePath();
  const cacheExists = fs.existsSync(cachePath);
  let cacheSize = 0;
  if (cacheExists) {
    try {
      const stats = fs.statSync(cachePath);
      cacheSize = stats.size;
    } catch (_) {}
  }

  checks.push({
    id: "cache-storage",
    name: "Persistent Cache",
    status: "pass",
    message: cacheExists
      ? `Cache active at .openapi-sync/cache.json (${Math.round(cacheSize / 1024)} KB).`
      : "Cache initialized at .openapi-sync/cache.json (clean).",
    details: { cachePath, exists: cacheExists, sizeBytes: cacheSize },
  });

  // 5. Output Directory Check
  const outputDir = path.join(rootUsingCwd, loadedConfig?.folder || "api");
  try {
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    fs.accessSync(outputDir, fs.constants.W_OK);
    checks.push({
      id: "output-directory",
      name: "Output Directory",
      status: "pass",
      message: `Output directory writable: ${path.relative(rootUsingCwd, outputDir) || outputDir}`,
      details: { outputDir },
    });
  } catch (err: any) {
    checks.push({
      id: "output-directory",
      name: "Output Directory",
      status: "fail",
      message: `Output directory not writable: ${err.message}`,
      details: { outputDir, error: err.message },
    });
    recommendations.push(`Ensure directory '${outputDir}' exists and is writable.`);
  }

  const healthy = checks.every((c) => c.status !== "fail");

  // Format log output
  checks.forEach((c) => {
    const icon = c.status === "pass" ? "✅" : c.status === "warn" ? "⚠️ " : "❌";
    log.log(`${icon} [${c.name}] ${c.message}`);
  });

  if (recommendations.length > 0) {
    log.log("\n💡 Recommendations:");
    recommendations.forEach((r, i) => log.log(`   ${i + 1}. ${r}`));
  }

  log.log(healthy ? "\n✨ Doctor check passed! Project is healthy.\n" : "\n❌ Doctor check found issues.\n");

  return {
    healthy,
    checks,
    recommendations,
  };
};
