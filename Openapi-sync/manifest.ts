import fs from "fs";
import path from "path";

const MANIFEST_PATH = path.join(process.cwd(), ".openapi-sync", "manifest.json");

export type ManifestData = Record<string, any> & {
  clients?: Record<string, string[]>;
  staleClients?: Record<string, string[]>;
  clientTypes?: Record<string, string>;
  configClientTypes?: Record<string, string>;
};

/** Load the current manifest from disk. Returns {} if not found. */
export function loadManifest(): ManifestData {
  try {
    if (fs.existsSync(MANIFEST_PATH)) {
      return JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf-8"));
    }
  } catch (_) {}
  return {};
}

/** Save updated manifest to disk. */
export function saveManifest(manifest: ManifestData): void {
  try {
    const dir = path.dirname(MANIFEST_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2));
  } catch (_) {}
}

/**
 * Compute stale file paths for a given API:
 * stale = files in previous manifest for this API that are NOT in the current sync's written files.
 */
export function computeStalePaths(
  apiName: string,
  previousManifest: Record<string, any>,
  currentlyWritten: string[]
): string[] {
  const previous = Array.isArray(previousManifest[apiName]) ? previousManifest[apiName] : [];
  const currentSet = new Set(currentlyWritten);
  return previous.filter((p: string) => !currentSet.has(p));
}

/**
 * Record generated client files for an API in the manifest,
 * marking any previously generated client files that are no longer generated as stale.
 */
export function recordClientFiles(
  apiName: string,
  clientFiles: string[],
  manifest?: ManifestData,
  clientType?: string,
  configClientType?: string
): ManifestData {
  const currentManifest = manifest || loadManifest();
  if (!currentManifest.clients) {
    currentManifest.clients = {};
  }
  if (!currentManifest.staleClients) {
    currentManifest.staleClients = {};
  }
  if (!currentManifest.clientTypes) {
    currentManifest.clientTypes = {};
  }
  if (!currentManifest.configClientTypes) {
    currentManifest.configClientTypes = {};
  }
  if (clientType) {
    currentManifest.clientTypes[apiName] = clientType;
  }
  if (configClientType) {
    currentManifest.configClientTypes[apiName] = configClientType;
  }

  const prevClients: string[] = currentManifest.clients[apiName] || [];
  const newlyStale = prevClients.filter((f: string) => !clientFiles.includes(f));

  currentManifest.clients[apiName] = clientFiles;

  const existingStale: string[] = currentManifest.staleClients[apiName] || [];
  currentManifest.staleClients[apiName] = Array.from(
    new Set([...existingStale, ...newlyStale])
  ).filter((f: string) => !clientFiles.includes(f));

  if (!manifest) {
    saveManifest(currentManifest);
  }
  return currentManifest;
}

/**
 * Get all stale client file paths for an API (or across all APIs) that currently exist on disk.
 */
export function getStaleClientPaths(
  apiName?: string,
  manifest?: ManifestData
): string[] {
  const currentManifest = manifest || loadManifest();
  const staleMap = currentManifest.staleClients || {};
  const activeMap = currentManifest.clients || {};

  const apisToCheck = apiName ? [apiName] : Object.keys(staleMap);
  const stalePaths: string[] = [];

  for (const api of apisToCheck) {
    const list = staleMap[api] || [];
    const active = new Set(activeMap[api] || []);
    for (const filePath of list) {
      if (!active.has(filePath)) {
        try {
          if (fs.existsSync(filePath)) {
            stalePaths.push(filePath);
          }
        } catch (_) {}
      }
    }
  }

  return Array.from(new Set(stalePaths));
}

/**
 * Remove deleted paths from staleClients and file lists in the manifest.
 */
export function cleanPurgedClientPaths(
  purgedPaths: string[],
  manifest?: ManifestData
): ManifestData {
  const currentManifest = manifest || loadManifest();
  const purgedSet = new Set(purgedPaths);

  if (currentManifest.staleClients) {
    for (const api of Object.keys(currentManifest.staleClients)) {
      currentManifest.staleClients[api] = (currentManifest.staleClients[api] || []).filter(
        (p: string) => !purgedSet.has(p)
      );
    }
  }

  for (const key of Object.keys(currentManifest)) {
    if (Array.isArray(currentManifest[key])) {
      currentManifest[key] = currentManifest[key].filter((p: string) => !purgedSet.has(p));
    }
  }

  saveManifest(currentManifest);
  return currentManifest;
}

