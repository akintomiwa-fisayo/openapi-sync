````instructions
## Purpose
Short, actionable guidance to help automated coding agents (Copilot / AI assistants) become productive in this repository.

Keep suggestions small and focused. Reference the files below when changing behavior and always run tests after edits.

## Big picture
- Core library: `Openapi-sync/` — TypeScript implementation. Primary entry: `Openapi-sync/index.ts`.
- CLI: `bin/cli.js` — shipped binary name is `openapi-sync` (see `package.json` -> `bin`).
- Website: `website/` — Next.js consumer app; treat it as a separate consumer (not part of publishing flow).
- Tests: `tests/` — Jest tests; `tests/setup.ts` configures test runtime.
- Types & helpers: root `types.ts`, `helpers.ts`, `client-generators.ts`.
- Fixtures/state: `db.json` used as a local state/fixture in builds and tests.

## Precise developer workflows & commands
- Install dependencies (clean):
```bash
npm ci
````

- Run full test suite (Jest):

```bash
npm test
```

You can run an individual test file with Jest's pattern, e.g. `npx jest tests/client-generation.test.ts`.

- Build (bundled output in `dist/`):

```bash
npm run build
```

Notes: `npm run build` runs `rm -rf dist db.json && tsup && echo '{}' > db.json` — the build deletes `db.json` and writes an empty JSON. Do not keep important state in `db.json`.

- Publish package (local flow):

```bash
npm run publish-package
```

This runs the build and then `npm publish`.

- Quick CLI smoke test:

```bash
node ./bin/cli.js --help
```

## Exact configs to reference

- `package.json` scripts: `build`, `publish-package`, `test`, `test:coverage`.
- `tsup.config.ts` (build): entry `index.ts`, outputs CommonJS & ESM, generates typings (`dts: true`), marks several runtime deps as external (axios, swagger-parser, js-yaml, yargs, curl-generator, etc.). Minification is disabled when `ANALYZE` env var is set.
- `jest.config.js`: preset `ts-jest`, roots `tests/`, `setupFilesAfterEnv` points to `tests/setup.ts`, `testTimeout` is 30000ms.

## Project-specific conventions & patterns (do this in PRs)

- Keep runtime/library logic inside `Openapi-sync/`. The CLI should remain a thin wrapper that calls library exports (`Openapi-sync/*`).
- Client generation logic lives in `Openapi-sync/client-generation.ts` and `client-generators.ts`. If changing output shape, add/modify unit tests in `tests/` (e.g. `tests/client-generation.test.ts`).
- Shared types are at the repo root in `types.ts`; prefer using them across the codebase rather than duplicating interfaces.
- State is JSON-serializable (`state.ts` and `db.json`). Avoid introducing non-serializable or environment-global state there.

## Integration points & quick pointers

- Binary name: `openapi-sync` -> `bin/cli.js`. Keep CLI flags stable: `init`, default `sync`, `generate-client`, `--help`, `--version`.
- Consumers: `website/` consumes the library; if you change exports, ensure website builds remain intact (it has its own package.json).
- External libs treated as runtime dependencies: `axios`, `@apidevtools/swagger-parser`, `curl-generator`, `prompts`, `yargs`.

## Editing rules for automated agents (must-follow)

1. Run the relevant tests locally for your change (`npm test tests/<file>.test.ts`).
2. Preserve CLI public API and `bin/cli.js` behavior where possible. If changing, update tests and README examples that rely on CLI flags.
3. When updating generator output, prefer small unit tests asserting structure over end-to-end regeneration. Add fixtures in `tests/fixtures/` (create new file rather than mutating `db.json`).
4. Never rely on `db.json` as persisted state across builds — the `build` script wipes it.

## Where to look for examples

- Generator flow: `Openapi-sync/index.ts` -> `Openapi-sync/client-generation.ts` -> `client-generators.ts`.
- State and persistence: `Openapi-sync/state.ts`, `Openapi-sync/endpoint-store.ts`, `db.json`.
- CLI orchestration: `bin/cli.js`, `Openapi-sync/interactive-init.ts`.
- Tests: `tests/` and `tests/setup.ts`.

## Tests & test environment

- The test setup (`tests/setup.ts`) mocks filesystem and HTTP/network dependencies to keep tests hermetic. Notable mocks:
  - `fs` methods (`existsSync`, `writeFileSync`, `readFileSync`, `promises.mkdir`, `promises.writeFile`) are mocked.
  - `axios.create().get` is mocked; `axios-retry` and `@apidevtools/swagger-parser` are mocked too.
  - Console methods are mocked to reduce test noise.

## CI & lint suggestions

- Recommended minimal CI job (install → test → build):
  1. `npm ci`
  2. `npm test`
  3. `npm run build` (optional; note `build` wipes `db.json` and reinitializes it)
- If you add linting, include a `lint` npm script and run it before tests in CI.

## PR checklist for automated agents

- Small, focused PRs: one logical change per PR (e.g., generator tweak, bug fix).
- Add/update unit tests (`tests/*.test.ts`) for changed behavior. Run `npx jest <file>` locally before pushing.
- Do not modify `db.json`; add fixtures under `tests/fixtures/` instead.
- Preserve CLI flags and exported library function signatures where possible. If changing the public API, update tests and README examples.
- Ensure changes are JSON-serializable when they interact with `Openapi-sync/state.ts` or `db.json`.

If you want this condensed further or prefer adding example GitHub Actions workflow snippets, commit message templates, or a PR template, tell me which to include and I will iterate.

````
## Purpose
Short, actionable guidance to help automated coding agents (Copilot / AI assistants) become productive in this repository.

Keep suggestions small and focused. Reference the files below when changing behavior and always run tests after edits.

## Big picture
- Core library: `Openapi-sync/` — TypeScript implementation. Primary entry: `Openapi-sync/index.ts`.
- CLI: `bin/cli.js` — shipped binary name is `openapi-sync` (see `package.json` -> `bin`).
- Website: `website/` — Next.js consumer app; treat it as a separate consumer (not part of publishing flow).
- Tests: `tests/` — Jest tests; `tests/setup.ts` configures test runtime.
- Types & helpers: root `types.ts`, `helpers.ts`, `client-generators.ts`.
- Fixtures/state: `db.json` used as a local state/fixture in builds and tests.

## Precise developer workflows & commands
- Install dependencies (clean):
```bash
npm ci
````

- Run full test suite (Jest):

```bash
npm test
```

You can run an individual test file with Jest's pattern, e.g. `npx jest tests/client-generation.test.ts`.

- Build (bundled output in `dist/`):

```bash
npm run build
```

Notes: `npm run build` runs `rm -rf dist db.json && tsup && echo '{}' > db.json` — the build deletes `db.json` and writes an empty JSON. Do not keep important state in `db.json`.

- Publish package (local flow):

```bash
npm run publish-package
```

This runs the build and then `npm publish`.

- Quick CLI smoke test:

```bash
node ./bin/cli.js --help
```

## Exact configs to reference

- `package.json` scripts: `build`, `publish-package`, `test`, `test:coverage`.
- `tsup.config.ts` (build): entry `index.ts`, outputs CommonJS & ESM, generates typings (`dts: true`), marks several runtime deps as external (axios, swagger-parser, js-yaml, yargs, curl-generator, etc.). Minification is disabled when `ANALYZE` env var is set.
- `jest.config.js`: preset `ts-jest`, roots `tests/`, `setupFilesAfterEnv` points to `tests/setup.ts`, `testTimeout` is 30000ms.

## Project-specific conventions & patterns (do this in PRs)

- Keep runtime/library logic inside `Openapi-sync/`. The CLI should remain a thin wrapper that calls library exports (`Openapi-sync/*`).
- Client generation logic lives in `Openapi-sync/client-generation.ts` and `client-generators.ts`. If changing output shape, add/modify unit tests in `tests/` (e.g. `tests/client-generation.test.ts`).
- Shared types are at the repo root in `types.ts`; prefer using them across the codebase rather than duplicating interfaces.
- State is JSON-serializable (`state.ts` and `db.json`). Avoid introducing non-serializable or environment-global state there.

## Integration points & quick pointers

- Binary name: `openapi-sync` -> `bin/cli.js`. Keep CLI flags stable: `init`, default `sync`, `generate-client`, `--help`, `--version`.
- Consumers: `website/` consumes the library; if you change exports, ensure website builds remain intact (it has its own package.json).
- External libs treated as runtime dependencies: `axios`, `@apidevtools/swagger-parser`, `curl-generator`, `prompts`, `yargs`.

## Editing rules for automated agents (must-follow)

1. Run the relevant tests locally for your change (`npm test tests/<file>.test.ts`).
2. Preserve CLI public API and `bin/cli.js` behavior where possible. If changing, update tests and README examples that rely on CLI flags.
3. When updating generator output, prefer small unit tests asserting structure over end-to-end regeneration. Add fixtures in `tests/fixtures/` (create new file rather than mutating `db.json`).
4. Never rely on `db.json` as persisted state across builds — the `build` script wipes it.

## Where to look for examples

- Generator flow: `Openapi-sync/index.ts` -> `Openapi-sync/client-generation.ts` -> `client-generators.ts`.
- State and persistence: `Openapi-sync/state.ts`, `Openapi-sync/endpoint-store.ts`, `db.json`.
- CLI orchestration: `bin/cli.js`, `Openapi-sync/interactive-init.ts`.
- Tests: `tests/` and `tests/setup.ts`.

If you want this condensed further or prefer adding CI/lint steps and example PR templates, tell me which to include and I will iterate.
