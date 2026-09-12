# Agent fix brief — openapi-sync DX / agent-path bugs

This file is the handoff from a 2026-09-12 live E2E review of `openapi-sync@6.3.2`.
Work in **this repository** (`/Users/user1/Documents/openapi-sync`). Do not treat
the playground as the product unless a ticket says so.

## Retest status (2026-09-12 08:02 rebuild — OAS-14/15 + playground)

Rebuilt local `dist` at 06:55 (`rm -rf dist && tsup`), wiped playground
configs, first-time inited React + Next, re-ran CLI + MCP + docs + browser.

Live E2E: **57/57**. Full Jest: **341 passed**, 41 skipped (open-handles
warning after exit 0). OAS unit files: 49/49.

| ID | Live retest | Notes |
| --- | --- | --- |
| OAS-1 | **Fixed** | `list-endpoints` after init-only added `.openapi-sync` cache only |
| OAS-2 | **Fixed** | `--output ./src/clients-axios` wrote that path |
| OAS-3 | **Fixed** | `--preset react-query-zod --run-sync` wrote `clients.ts` + `hooks.ts`; nextSteps 1–4 |
| OAS-4 | **Fixed** | validate 401 includes `code`, `status`, `url`, `recovery` |
| OAS-5 | **Fixed** | `--output-folder` / `--validation-library` work on validate |
| OAS-6 | **Fixed** | CLI `purge --yes --json` returns `purged` |
| OAS-7 | **Fixed** | Manifest tracking + purge respects client type switches (resolved in OAS-12) |
| OAS-8 | **Fixed** | `next-fetch` has `NextFetchOptions` / `revalidate` (preset + CLI `--type`) |
| OAS-9 | **Fixed** | MCP version `6.3.2`, `--help` exits, init accepts `preset` + `authType` |
| OAS-10 | **Fixed** | CLI `init --auth-type bearer --auth-token '${env.SPEC_TOKEN}' --run-sync` writes config + clients (515ms) |
| OAS-11 | **Fixed** | `init --run-sync` without auth: `success: false`, exit 1, “initial sync failed”, no generated source |
| OAS-12 | **Fixed** | `purge` does not regenerate client preset; respects `manifest.clientTypes` + `lastClientType`; unmocked live tests pass |
| OAS-13 | **Fixed** | `llms.txt` Workflow 1 includes auth flags; byte-identical to `website/public/llms.txt`; DocsContent updated; `--show-curl` default `false` |
| OAS-14 | **Fixed** | Default output folder `""` (project root), layout `./<apiName>/...`, `baseURL` stays default `""` |
| OAS-15 | **Fixed** | MCP = CLI parity: added `openapi_sync_purge`, `next-fetch`, 8 auth flags, config overrides across tools, updated `--help` |

OAS-1 through OAS-15 are **DONE**. Do not re-do them
unless a regression appears. Remaining work is **P2** (playground
`OAS-P1`).

**Review canvas (human summary):**
`/Users/user1/.cursor/projects/Users-user1-Documents-Openapi-sync-playground/canvases/openapi-sync-e2e-review.canvas.tsx`

**Playground (manual / integration checks only):**
`/Users/user1/Documents/Openapi-sync playground`

---

## How to use this file

1. Pick the **next unchecked ticket in Suggested order**. Do not start P2 work
   before P0 tickets are done unless a human asks.
2. Read the ticket end to end before editing. Each one is self-contained.
3. Keep the CLI a thin wrapper. Put behavior in `Openapi-sync/` or root
   `index.ts` / `client-generators.ts` as noted.
4. After each ticket: add or update Jest tests, run them, then `npm test`.
5. If you change CLI flags, `--json` shapes, or programmatic exports, update
   `README.md` **and** `llms.txt` **and** `website/public/llms.txt` in the same PR.
6. Do not commit playground `_e2e-*` scratch dirs or generated app files unless
   the ticket is playground-only.

```bash
npm test
npm run build
node ./bin/cli.js --help
```

---

## Constraints (do not violate)

- Stay agent-safe: no new stdin prompts on `sync`, `validate`, `list-endpoints`,
  `get-endpoint`, `read-type`, `generate-client`, `doctor`, `purge --yes`, or
  `init --no-interactive`.
- Keep `--json` as a single JSON object on stdout. Logs go to stderr.
- Keep existing flag names working. New names must be **aliases**, not renames.
- Do not change generated TypeScript public names for existing Nest/Petstore
  fixtures unless a ticket asks.
- Do not start a long `refetchInterval` loop from MCP tools.

---

## Suggested order

OAS-1–15 are **done**. Next work is playground-only `OAS-P1`.

Playground-only follow-ups: `OAS-P1`.

---

## OAS-1 — `list-endpoints` / `get-endpoint` write generated files

**Severity:** P0  
**Status:** open

### Goal

Inspect commands must not write types, endpoints, validations, or clients.

### Problem

`ListEndpoints` and `GetEndpointDetails` call `OpenapiSync()` after `resetState()`.
`OpenapiSync` always generates files when the in-memory spec differs.

Docs claim no side effects:

- `README.md` agent table: `list-endpoints` / `get-endpoint` — no files written
- `llms.txt` same claim
- `bin/cli.js` command help: “No files are written.”

### Repro

```bash
# empty project
npx openapi-sync init --no-interactive \
  --api-name backend \
  --api-file "/Users/user1/Documents/Openapi-sync playground/backend-nestjs/openapi.json" \
  --output-folder ./out \
  --config-format json --json

# only config + maybe .openapi-sync/cache.json should exist
find . -type f

npx openapi-sync list-endpoints --json
find . -type f
# BUG: ./out/backend/endpoints.ts, types/index.ts, types/shared.ts appear
```

`get-endpoint` does the same when the in-memory store is empty.

### Expected

- `list-endpoints` and `get-endpoint` return JSON only.
- Allowed writes: `.openapi-sync/endpoints.json` / cache (optional, documented).
- Forbidden writes: anything under `config.folder`.
- `validate` stays side-effect free for generated source (already true).

### Likely files

- `index.ts` — `ListEndpoints`, `GetEndpointDetails`
- `Openapi-sync/index.ts` — `processOpenapiSync` always writes
- `Openapi-sync/validate.ts` — reuse this fetch/parse path
- `Openapi-sync/endpoint-store.ts` — store parsed endpoints without codegen
- `tests/phase2.test.ts`, `tests/cli.test.ts`, `tests/agent-audit.test.ts`

### Implementation notes

Best approach: extract “fetch spec + collect `EndpointInfo[]`” from
`processOpenapiSync` without the write-file tail. `validate` already fetches
without writing source — do not duplicate axios/auth logic; share helpers from
`spec-auth.ts` / `validate.ts`.

CLI `list-endpoints --use-cache` currently defaults **false**. After this fix,
defaulting CLI `--use-cache` to **true** when `.openapi-sync/endpoints.json`
exists is OK, but correctness must not depend on it. First call with empty
cache must still be read-only for generated source.

MCP `openapi_sync_list_endpoints` already defaults `useCache: true`. Keep that.

### Tests

- Init config only, run `ListEndpoints({ silent: true })`, assert no
  `endpoints.ts` / `types/**` under `folder`.
- Same for `GetEndpointDetails`.
- Assert `.openapi-sync/endpoints.json` may exist.
- Existing list/filter/pagination tests still pass.

### Acceptance

- [ ] Repro above creates no files under `./out` after `list-endpoints` or `get-endpoint`
- [ ] `--json` payload shape unchanged (`Record<api, EndpointSummary[]>`)
- [ ] Docs remain true (no need to weaken “no files written” for source)

### Do not

- Disable codegen inside `Init` / `sync`
- Make `list-endpoints` require a prior sync

---

## OAS-2 — `--output` / `clientGeneration.outputDir` ignored in flat mode

**Severity:** P0  
**Status:** open

### Goal

Client files go to the directory the user/agent asked for.

### Problem

`generateClients()` computes `clientOutputDir` from `clientConfig.outputDir`,
then **ignores it** in the non-folder-split branch and always writes to
`path.join(outputFolder, apiName)` (`clients.ts` / `hooks.ts` / `api.ts`).

Folder-split mode already honors `outputDir`. README claims custom client
directory is fully supported.

### Repro

```bash
# project already synced, folder ./src/api, api name backend
npx openapi-sync generate-client --type fetch --output ./src/api/backend/users-client --json
```

**Actual:** writes `./src/api/backend/clients.ts` (overwrites any existing
React Query / axios client).  
**Expected:** writes `./src/api/backend/users-client/clients.ts` (or that
folder’s equivalent), and does not replace `./src/api/backend/clients.ts`
unless that *is* the resolved output dir.

Also broken via config:

```ts
clientGeneration: { enabled: true, type: "fetch", outputDir: "./src/clients" }
```

### Likely files

- `Openapi-sync/client-generation.ts` — non-split `switch` around line 219
- `index.ts` — `GenerateClient` already passes `outputDir`
- `bin/cli.js` — `--output` / `-o` already passed as `argv.output`
- `tests/client-generation.test.ts`, `tests/phase1.test.ts`

### Implementation notes

In the non-split branch, resolve:

```ts
const destDir = clientConfig.outputDir
  ? (path.isAbsolute(clientConfig.outputDir)
      ? clientConfig.outputDir
      : path.join(process.cwd(), clientConfig.outputDir))
  : path.join(outputFolder, apiName);
```

Fix relative imports to `types` / `endpoints` when `destDir` is not the API
folder (today the code blindly rewrites `../types` → `./types`). Compute the
relative path from `destDir` to the API types/endpoints.

Dry-run planned files in `bin/cli.js` (`computePlannedFiles`) must use the
same dest.

### Tests

- Flat mode + `outputDir` writes only under that dir
- Existing client in `{folder}/{api}/clients.ts` is left untouched
- Import paths from a nested `outputDir` compile (string assertions on
  `from '...'`)
- Folder-split + `outputDir` still works

### Acceptance

- [ ] `--output` and config `clientGeneration.outputDir` honored in flat mode
- [ ] Dry-run `--json` `plannedFiles` match what is written
- [ ] README sentence about custom client directory is true for both layouts

---

## OAS-3 — Preset / `sync` does not generate the advertised client

**Severity:** P0  
**Status:** open  
**Depends on:** OAS-2 (so generated clients land in the right place)

### Goal

If a preset or config enables client generation, one `sync` (or
`init --run-sync`) writes the client. `nextSteps` always tell the agent the
truth.

### Problem

Presets set `clientGeneration.enabled: true` and a `type`
(`Openapi-sync/presets.ts`). `Init()` / default CLI `sync` never calls
`GenerateClient`.

`nonInteractiveInit({ runSync: true })` only generates a client when
`clientType` is passed — **not** when only `preset` is set.

`nextSteps` skips item 3 unless `clientType` is set, so numbering becomes
`1, 2, 4`. The success message always says “Run `npx openapi-sync` to generate
types” even after `--run-sync`.

### Repro

```bash
npx openapi-sync init --no-interactive \
  --api-name petstore \
  --api-url https://petstore3.swagger.io/api/v3/openapi.json \
  --preset react-query-zod \
  --run-sync \
  --json
```

**Actual:** types + endpoints + validations only. No `hooks.ts` / `clients.ts`.
`nextSteps` has no generate-client line.  
**Expected:** client files for `react-query` as well, or an explicit next step
that includes `--type react-query`. Product intent for this ticket: **generate
the client**.

Also:

```bash
npx openapi-sync --preset react-query-zod --api-url <url> --folder ./src/api --json
```

should write the client when the resolved config has `clientGeneration.enabled`.

### Likely files

- `index.ts` — `Init`
- `Openapi-sync/presets.ts` — `applyPreset`
- `Openapi-sync/interactive-init.ts` — `nonInteractiveInit` `runSync` + `checklist`
- `Openapi-sync/config-loader.ts` — resolved config after preset merge
- `bin/cli.js` — default `sync` command
- `tests/init.test.ts`, `tests/presets.test.ts`, `tests/interactive-init.test.ts`

### Implementation notes

After successful type/endpoint generation in `Init`, if
`config.clientGeneration?.enabled` and `config.clientGeneration?.type`, call
the same path as `GenerateClient` (prefer extracting a shared function so
`Init` does not double-fetch the spec).

Resolve type from preset when the user only passed `--preset`.

`nextSteps` rules:

1. If a client will be generated by the next sync, say so:
   `npx openapi-sync` (types + client).
2. If a client type is known but not auto-run, include
   `npx openapi-sync generate-client --type <type>`.
3. Number items 1, 2, 3, 4 with no gaps.
4. If `runSync` succeeded, message should say files were generated, not
   “run sync”.

Do **not** generate a client when `clientGeneration.enabled` is false or
missing (manual configs without a client preset).

Peer-dep warnings stay warnings; do not fail sync only because zod / react-query
is not installed.

### Tests

- `init --preset react-query-zod --run-sync` writes hooks + clients
- `init --preset next-fetch --run-sync` writes fetch `clients.ts`, no
  `validations.ts`
- `init --preset react-query-zod` **without** `--run-sync` writes config only;
  `nextSteps` includes generate-client or “sync writes client”
- `Init()` with a config that has no `clientGeneration` does not write clients
- `nextSteps` numbering has no gaps

### Acceptance

- [ ] Preset users get the client from `sync` / `--run-sync`
- [ ] Agent JSON `nextSteps` is complete and correctly numbered
- [ ] Manual configs without client generation stay types-only

---

## OAS-4 — 401/403 errors have no recovery hint

**Severity:** P0  
**Status:** open

### Goal

Protected-spec failures return `SPEC_FETCH_FAILED` (or equivalent) plus an
actionable recovery string. Agents should not have to guess `--auth-type`.

### Problem

Unreachable/unauthorized specs often surface axios’s
`Request failed with status code 401`. No `code`, no mention of
`--auth-type`, `api.*.auth`, or `--prompt-auth`.

Missing env (`${env.SPEC_TOKEN}`) is already excellent — keep that path.

`SpecFetchError` already exists in `errors.ts` with code `SPEC_FETCH_FAILED`.
Validate currently stringifies axios errors instead of throwing it.

### Repro

```bash
# playground frontend-nextjs config has no auth; backend requires auth
cd "/Users/user1/Documents/Openapi-sync playground/frontend-nextjs"
npx openapi-sync validate --json
```

**Actual:**

```json
{ "valid": false, "apis": { "backend": { "error": "Could not fetch/read spec: Request failed with status code 401" } } }
```

**Expected:** stable `code: "SPEC_FETCH_FAILED"`, status `401`, URL, and a
`recovery` / message that lists:

- add `auth` on the API source in `openapi.sync.ts`
- or `--auth-type bearer --auth-token …` (and basic / apiKey / custom)
- or `--prompt-auth` for humans

Same for `sync`, `doctor` spec check, and `generate-client`.

### Likely files

- `errors.ts` — `SpecFetchError` (extend `toJSON` with `status`, `url`, `recovery`)
- `Openapi-sync/validate.ts`
- `Openapi-sync/index.ts` fetch path
- `Openapi-sync/doctor.ts`
- `bin/cli.js` — `--json` error envelope
- `tests/spec-auth.test.ts`, `tests/cli.test.ts`

### Implementation notes

Map HTTP 401/403 (and network failures) to `SpecFetchError`. Do not leak
token values. Recovery text can mention flag names, not secrets.

`--json` for `validate` should include the code on the per-API object,
e.g. `apis.backend.code`, without breaking `valid` / `error` string fields
(keep `error` human-readable; add `code` + `recovery`).

### Tests

- Mock 401 → `code === "SPEC_FETCH_FAILED"`, message contains `auth`
- Missing env still uses the existing env-not-set message (do not regress)
- 200 with valid spec unchanged

### Acceptance

- [ ] 401/403 JSON is machine-routable (`code`) and tells the next command
- [ ] No credentials printed

---

## OAS-5 — CLI flag names diverge between `init` and everyone else

**Severity:** P1  
**Status:** open

### Goal

Agents can copy flags from `init --help` and reuse them on `sync` /
`generate-client` / `validate`.

### Problem

| init | sync / shared CLI | Meaning |
| --- | --- | --- |
| `--validation-library` | `--validation-lib`, `--validations-library` | validation lib |
| `--output-folder` | `--folder` | output dir |
| `--types-prefix` | `--type-prefix` | interface prefix |
| `--folder-split` | `--split-by-tags` | tag folders |

`.strict()` makes the “wrong” name a hard fail (`CLI_PARSE_ERROR`).

### Likely files

- `bin/cli.js` — `addCliConfigOptions`, `init` builder
- `Openapi-sync/cli-config.ts`
- `tests/cli-config.test.ts`, `tests/cli.test.ts`

### Implementation notes

Accept **both** names on all commands that take that setting. Do not remove
current names. Prefer documenting one canonical name in README/llms.txt
(recommend the `init` names **or** the sync names — pick one and list aliases).

Suggested canonical (match current `init`, friendlier):

- `--validation-library` (alias `--validation-lib`)
- `--output-folder` (alias `--folder`)
- `--types-prefix` (alias `--type-prefix`)
- `--folder-split` (alias `--split-by-tags`)

Wire aliases through `cli-config.ts` so `--config-json` / zero-config still works.

### Tests

- `sync --output-folder ./tmp --validation-library zod` loads the same as
  `--folder` / `--validation-lib`
- `init --folder ./src/api` still works if you also alias the other way
- `--json` parse error no longer fires for the alias

### Acceptance

- [ ] Every alias in the table works on `init`, `sync`, `validate`,
      `generate-client`
- [ ] README + `llms.txt` list aliases
- [ ] No existing flag removed

---

## OAS-6 — `Purge()` programmatic API does not match docs

**Severity:** P1  
**Status:** open

### Goal

Code following README / `llms.txt` actually deletes stale files and can read
`purged`.

### Problem

Docs:

```ts
const purgeResult = await Purge({ yes: true, silent: true });
console.log("Purged files:", purgeResult.purged);
```

Actual (`index.ts`):

- Option is `deleteFiles` (`yes` is ignored)
- Return is `{ stalePaths, deleted, errors }` — no `purged`, no `success`

CLI `purge --yes` is fine; this is the library API + docs drift.

### Likely files

- `index.ts` — `Purge`
- `types.ts` if you add a result type
- `README.md`, `llms.txt`, `website/public/llms.txt`
- `tests/manifest-purge.test.ts`

### Implementation notes

Accept `yes` as an alias of `deleteFiles`.

Return backward-compatible extras:

```ts
{
  success: errors.length === 0,
  stalePaths,
  deleted,
  purged: deleted, // alias
  errors,
  message?: string
}
```

Do not remove `stalePaths` / `deleted`.

### Tests

- `Purge({ yes: true })` deletes the same files as `{ deleteFiles: true }`
- Result has both `purged` and `deleted` (same array)
- `{ yes: false }` / default still does not delete

### Acceptance

- [ ] README example runs as written
- [ ] CLI `--json` can keep `purged` (already does on CLI path)

---

## OAS-7 — Switching client types leaves orphans; purge misses them

**Severity:** P1  
**Status:** fixed (resolved by OAS-12; live-verified 2026-09-12 06:55)  
**Depends on:** OAS-3, OAS-6

### Goal

`purge` removes client files that the current client type no longer emits
(`hooks.ts` after moving to rtk-query, etc.).

### Problem

Generating `react-query` / `swr` writes `clients.ts` + `hooks.ts`. Then
`rtk-query` writes `api.ts` and leaves the old files. Manifest tracks
`Init` writes, not client artifacts. `purge --dry-run` reports
“No stale files found.”

### Repro

```bash
npx openapi-sync generate-client --type swr
npx openapi-sync generate-client --type rtk-query
npx openapi-sync purge --dry-run --json
# stale should include hooks.ts / leftover clients.ts if unused
```

### Likely files

- `Openapi-sync/manifest.ts`
- `index.ts` — `GenerateClient`, `Purge`, `Init`
- `Openapi-sync/client-generation.ts` — return written paths (already does)
- `tests/manifest-purge.test.ts`

### Implementation notes

Record client file paths in `.openapi-sync/manifest.json` (per API, or a
`clients` key). Stale = previously written client files not in the latest
`generateClients()` result.

Do **not** delete user files outside the manifest. Custom-code sections in
files that are still generated must be preserved (existing merge).

Dry-run lists those paths; `--yes` / `deleteFiles` / `yes` deletes them.

### Tests

- swr then rtk-query → `hooks.ts` appears in `stalePaths`
- purge deletes it and leaves `api.ts`
- custom code in a *still-generated* file is kept

### Acceptance

- [ ] Repro’s `purge --dry-run --json` lists leftover client files
- [ ] `purge --yes` removes them

---

## OAS-8 — `next-fetch` preset is generic fetch

**Severity:** P1  
**Status:** open  
**Depends on:** OAS-3 (so `sync` with the preset actually emits a client)

### Goal

Either emit a Next.js App Router-friendly client, or stop advertising
“caching headers / Server Components” until you do.

### Problem

Preset `next-fetch` sets `clientGeneration.type: "fetch"` and disables
validations. Generated `clients.ts` is the same generic `fetch` helper:
empty `baseURL`, no `cache`, no `next: { revalidate }`, no `cookies()`.

README: “Server Components-friendly fetch calls with caching headers”.

### Decision (implement this)

Generate a **Next-aware fetch client** when type is `fetch` **and**
(`preset === "next-fetch"` or `clientGeneration.next === true` or
`clientGeneration.type === "next-fetch"` if you add that type).

Minimum viable output:

- Accept `cache` / `revalidate` / `tags` in the per-call options (or a
  module-level `setApiConfig`)
- Pass them through as `fetch(url, { cache, next: { revalidate, tags } })`
- Keep it runnable in a Server Component (no React hooks)
- Document how to set `baseURL` (`process.env` in `openapi.sync.ts` or
  `setApiConfig`)

Do **not** add a React client provider. Do not pull in `next` as a
hard dependency — only emit types that match the Fetch API + Next’s
`RequestInit` extras (you can type them locally).

If this is too large for one pass, the acceptable fallback is: change
docs/preset description to “native fetch, no Next cache helpers” **and**
open a follow-up. Prefer implementing the helpers.

### Likely files

- `client-generators.ts` — `generateFetchClient`
- `Openapi-sync/presets.ts`
- `Openapi-sync/client-generation.ts`
- `types.ts` — optional `clientGeneration.next`
- `tests/client-generation.test.ts`
- `README.md` / `llms.txt` preset table

### Tests

- `next-fetch` generated source contains `revalidate` or `next:`
- `fetch-zod` / plain `--type fetch` stays generic (no Next-only API required)
- No `from 'next/...'` import unless you have a good reason

### Acceptance

- [ ] Docs match generated code
- [ ] Playground Next client *can* be used from a Server Component without
      extra wrappers (manual check OK)

---

## OAS-9 — MCP + init polish

**Severity:** P2  
**Status:** open  
**Depends on:** OAS-3, OAS-5

Split into three small commits if needed.

### 9a — MCP server version and help

- `mcp/server.ts` hardcodes `version: "1.0.0"`. Read
  `package.json` version (`6.3.2`).
- `npx openapi-sync-mcp --help` currently starts the stdio server. If
  `process.argv` includes `--help` / `-h` / `--version` / `-v`, print and
  exit **before** connecting stdio. Never write help to stdout after
  the MCP transport is up (stdout is JSON-RPC).

Files: `mcp/server.ts`, `bin/mcp.js`

### 9b — MCP `openapi_sync_init` missing preset and auth

Add optional tool args aligned with CLI:

- `preset`
- `apiUrl` already covered by `apiSource`
- `authType` / token fields **or** document that auth belongs in the
  generated config and must be edited after init

Agents cannot set a preset via MCP today.

Files: `mcp/server.ts`, `Openapi-sync/interactive-init.ts`

Do **not** add `refetchInterval` as a encouraged MCP `sync` input. If the
field stays, description must say “omit unless you want a long-lived
process timer; not for one-shot agent calls.”

### 9c — Non-interactive TS config should use `defineConfig`

Today:

```ts
import { IConfig } from "openapi-sync";
const config: IConfig = { "folder": "./src/api", ... };
export default config;
```

Emit:

```ts
import { defineConfig } from "openapi-sync";

export default defineConfig({
  folder: "./src/api",
  api: { backend: "..." },
  preset: "react-query-zod",
});
```

Unquoted keys, `defineConfig`, no JSON-style dump. Interactive wizard
should use the same template.

Files: `Openapi-sync/interactive-init.ts`, `tests/interactive-init.test.ts`,
`tests/init.test.ts`

### Acceptance

- [ ] MCP `initialize` `serverInfo.version` matches `package.json`
- [ ] `node bin/mcp.js --help` exits 0 and does not hang
- [ ] MCP init can set `preset`
- [ ] `init --config-format typescript` output compiles and uses `defineConfig`

---

## OAS-10 — CLI `init` rejects auth flags

**Severity:** P0  
**Status:** fixed (live-verified 2026-09-12 05:34)

### Goal

`npx openapi-sync init --no-interactive --auth-type bearer --auth-token '${env.SPEC_TOKEN}'` writes a config with `auth` and does not throw `CLI_PARSE_ERROR`.

### Problem

`nonInteractiveInit` and MCP `openapi_sync_init` already accept `authType` / `authToken`. The `init` yargs command in `bin/cli.js` does **not** call `addAuthOptions()` and is `.strict()`, so first-time protected-spec setup via CLI fails.

MCP is the only first-run path that can store spec auth today.

### Repro

```bash
npx openapi-sync init --no-interactive \
  --api-name backend \
  --api-url http://localhost:3001/api-json \
  --auth-type bearer \
  --auth-token '${env.SPEC_TOKEN}' \
  --preset react-query-zod \
  --json
```

**Actual:**

```json
{ "success": false, "error": { "code": "CLI_PARSE_ERROR", "message": "Unknown arguments: auth-type, authType, auth-token, authToken" } }
```

**Expected:** config written with `api.backend.auth`, exit 0.

### Likely files

- `bin/cli.js` — `init` builder; pass auth fields into `nonInteractiveInit`
- `Openapi-sync/interactive-init.ts` — already implements auth
- `tests/cli.test.ts` / new `tests/oas10-init-auth.test.ts`

### Acceptance

- [ ] Repro exits 0 and config contains `auth.type: "bearer"`
- [ ] `--help` on `init` lists `--auth-type` and friends
- [ ] `.strict()` still rejects truly unknown flags

---

## OAS-11 — `init --run-sync` reports success when sync failed

**Severity:** P0  
**Status:** fixed (live-verified 2026-09-12 05:34)

### Goal

If `Init()` returns `success: false` (or writes no sources), `init --run-sync --json` must be `success: false` with the real errors (e.g. `SPEC_FETCH_FAILED`).

### Problem

```ts
const { Init } = await import("../index");
await Init({ silent });
```

`Init` never throws on 401; it returns `{ success: false, errors }`. That return is ignored. Message is always “Files generated successfully.”

### Repro

```bash
# protected spec, no auth
npx openapi-sync init --no-interactive \
  --api-name backend \
  --api-url http://localhost:3001/api-json \
  --preset fetch-zod \
  --run-sync --json
```

**Actual:** exit 0, `success: true`, “Files generated successfully.”, no `src/api/**` files.  
**Expected:** exit 1, `success: false`, errors include 401 / `SPEC_FETCH_FAILED`, config may still exist.

### Likely files

- `Openapi-sync/interactive-init.ts` — `runSync` block
- `index.ts` — `Init` return type (already correct)
- `tests/init.test.ts`

### Acceptance

- [ ] Repro JSON `success === false` and `errors.length > 0`
- [ ] Successful `--run-sync` (local file or authed URL) still `success: true`

---

## OAS-12 — `purge` undoes `generate-client` type switches

**Severity:** P1  
**Status:** fixed  
**Depends on:** OAS-7

### Goal

After `generate-client --type swr` then `generate-client --type rtk-query`,
`purge --dry-run --json` lists leftover `hooks.ts` and **keeps** `api.ts`.

### Problem

`GenerateClient` records client files in the manifest. `Purge` then calls
`Init()`, which regenerates the **config preset** client (e.g. `fetch-zod` →
`clients.ts` only). That marks both the previous SWR `hooks.ts` **and** the
just-generated RTK `api.ts` as stale.

Live repro (05:34, `_e2e-round3/leftover2`):

```
stalePaths: [hooks.ts, api.ts]
manifest.clients.backend: [clients.ts]
manifest.staleClients.backend: [hooks.ts, api.ts]
```

Unit tests in `tests/oas7-client-purge.test.ts` mock `Init` and therefore
pass. The live workflow does not.

### Repro

```bash
npx openapi-sync init --no-interactive --api-name backend --api-file ./openapi.json --preset fetch-zod --run-sync
npx openapi-sync generate-client --type swr
npx openapi-sync generate-client --type rtk-query
npx openapi-sync purge --dry-run --json
# stale should include hooks.ts only, not api.ts
```

### Likely files

- `index.ts` — `Purge` / `Init` / `GenerateClient`
- `Openapi-sync/manifest.ts` — persist last client `type` per API
- `tests/oas7-client-purge.test.ts` — add an unmocked filesystem test

### Implementation notes

Do **not** delete the latest `generate-client` output just because the
config preset still says `fetch` / `swr`. Options (pick one):

1. Persist `lastClientType` + last client paths; `Init`/`Purge` treat those
   as the active client unless config `clientGeneration.type` was explicitly
   changed.
2. Have `generate-client` update `clientGeneration.type` in the config file
   (bigger behavior change — document it).
3. Make `Purge` use `getStaleClientPaths()` only and **not** re-run client
   generation from the preset.

### Acceptance

- [x] Repro dry-run lists `hooks.ts` and does not list `api.ts`
- [x] `purge --yes` deletes `hooks.ts` and leaves `api.ts`
- [x] Custom code in a still-generated file is kept
- [x] Add a live-style Jest test that writes real temp files (no mocked `Init`)

---

## OAS-13 — `llms.txt` first-time workflow has no auth flags

**Severity:** P1  
**Status:** fixed

### Goal

An agent following `llms.txt` **COMMON AGENT WORKFLOWS / Workflow 1** can
set up a **protected** spec without hitting 401.

### Problem

README now documents `init --auth-type bearer --auth-token '${env.SPEC_TOKEN}'`.
`llms.txt` lists the flags in the init table, but Workflow 1 still has no
auth. Website `DocsContent.tsx` only shows `--auth-type` on zero-config
`npx openapi-sync`, not on `init`. `--show-curl` is documented as default
`true`; CLI default is `false`.

### Likely files

- `llms.txt`
- `website/public/llms.txt` (must stay identical)
- `website/components/docs/DocsContent.tsx`
- `README.md` (already has the init+auth example)

### Acceptance

- [x] Workflow 1 includes `--auth-type` / `--auth-token` (or a comment that
      they are required for protected specs)
- [x] DocsContent has an `init --no-interactive` example with auth
- [x] `--show-curl` default in llms matches CLI (`false`)
- [x] `llms.txt` and `website/public/llms.txt` stay byte-identical


---

## OAS-14 — Default output folder is `""` (project root) & empty `baseURL`

**Severity:** P1  
**Status:** fixed

### Goal

When `--output-folder` / `folder` is omitted, files land at `./<apiName>/...` (e.g. `./backend/...` or `./api/...`) instead of adding an artificial `src/api` or `api` nesting. Generated client `baseURL` stays default `""`.

### Details

- Default `folder` is `""` in CLI `init`, programmatic `nonInteractiveInit`, `interactiveInit`, `cli-config.ts`, `openapi.sync.schema.json`, and MCP `openapi_sync_init`.
- Nullish coalescing `folder ?? ""` ensures `""` is preserved and not coerced to a fallback string like `"api"`.
- Layout `{folder}/{apiName}/...` resolves to `./<apiName>/...` without creating any unwanted top-level `api/` or `src/` directory.
- Client generation `baseURL` remains default `""`.

### Acceptance

- [x] `init --no-interactive --api-name backend` outputs to `./backend/...`
- [x] Config schema and documentation specify default `""` (project root)
- [x] Generated client `baseURL` stays `""`

---

## OAS-15 — MCP = CLI argument parity & tool completeness

**Severity:** P1  
**Status:** fixed

### Goal

MCP tools provide parity with the CLI: all CLI auth flags, config overrides, `purge`, and `next-fetch` client type are exposed and documented.

### Details

- Added `openapi_sync_purge` MCP tool with `yes`/`deleteFiles` and `dryRun` options.
- Added `next-fetch` to `openapi_sync_generate_client` type enum.
- Exposed all 8 auth flags (`authType`, `authToken`, `authUsername`, `authPassword`, `authApiKeyHeader`, `authApiKeyValue`, `authHeaderName`, `authHeaderValue`) and CLI config overrides across MCP tools (`validate`, `doctor`, `list_endpoints`, `get_endpoint_details`, `read_generated_type`, `sync`).
- Updated `bin/mcp.js --help` to document all 10 tools.
- Synced `llms.txt`, `website/public/llms.txt`, and `README.md`.

### Acceptance

- [x] All 10 MCP tools registered and discoverable via `tools/list`
- [x] `bin/mcp.js --help` lists all 10 tools and exits cleanly
- [x] Auth and CLI overrides passed into programmatic functions from MCP tools

---

## OAS-P1 — Playground harness (optional, not the npm package)

**Severity:** P2 / docs  
**Repo:** `/Users/user1/Documents/Openapi-sync playground`

Only do this if a human asks. Package tickets above do not require it.

| Item | Action |
| --- | --- |
| Next.js `openapi.sync.ts` has no spec auth | **Done (05:34)** — first-time init wrote bearer `${env.SPEC_TOKEN}` |
| React `App.tsx` preset tab | **Done** — shows live URL + bearer `${env.SPEC_TOKEN}` |
| Neither frontend imports generated clients | **Done** — React Query health hook + Next server `AppController_getHealth` (browser `{status:ok}`) |
| No `.cursor/mcp.json` | **Done** — playground root `.cursor/mcp.json` with local `mcp.js` + `SPEC_TOKEN` |
| Nest Swagger omits `minLength` / `format: email` | **Done** — `CreateUserDto` has `format: email`, `minLength: 6` on `@ApiProperty` |
| Scratch dirs `_e2e-*` | **Done** — `_e2e-round3/4` and `_e2e-results.json` removed |

---

## Out of scope (do not “fix” unless asked)

- Renaming Nest `UsersController_findAll` hooks — that is the spec
  `operationId`. A future `types.name.format` / strip-controller-prefix
  option is a new feature, not these tickets.
- Interactive wizard TTY UX (default preset = none) — nice-to-have only.
- Auto-gitignore of the entire output folder — controversial; do not
  expand that in non-interactive init.
- Publishing to npm / changelog website copy except `llms.txt` sync.
- `axios-retry` 20-attempt policy (ECONNREFUSED was fast; leave unless
  you have a hanging-timeout repro).

---

## Done when

OAS-1–13 stay green on `npm test` + `npm run build`. Remaining optional
work is P2 / OAS-P1 only.
