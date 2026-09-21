# TinyFish Web Provider Plugin Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an OpenClaw plugin that registers TinyFish as the native backend for `web_search` and `web_fetch` without adding a duplicate advanced-search tool.

**Architecture:** A thin OpenClaw adapter layer will register two provider entries and delegate HTTP transport to a shared TinyFish client. Search and fetch adapters will translate host parameters, validate TinyFish responses, and return host-compatible provider results. OpenClaw remains responsible for tool schemas, caching, external-content wrapping, SSRF policy, and provider selection.

**Tech Stack:** TypeScript ESM, OpenClaw plugin SDK, Node 24+, native `fetch`, TypeBox or the SDK's provider types, Vitest, npm/pnpm.

**Spec:** `docs/superpowers/specs/2026-09-22-tinyfish-web-provider-design.md`

## Global Constraints

- Use the plugin id `tinyfish-web` and provider id `tinyfish`.
- Keep the public model-facing tools named `web_search` and `web_fetch`; do not register `advanced_web_search` or `tinyfish_search` in v1.
- TinyFish Search and Fetch are free, but REST requests require a TinyFish account/API key; do not promise anonymous access or unlimited quota.
- Use `TINYFISH_API_KEY` or the host-supported plugin config/SecretRef path; never expose credentials in provider results or errors.
- Use TinyFish Search at `https://api.search.tinyfish.ai` and Fetch at `https://api.fetch.tinyfish.ai`.
- Declare onboarding metadata so installed users can select TinyFish and securely provide the key during `openclaw onboard`.
- Keep OpenClaw's host limits and safety boundaries authoritative.
- Use native `fetch` with abortable timeouts; do not add a browser-automation dependency.
- Runtime dependencies belong in `dependencies` or `optionalDependencies`, not only `devDependencies`.

---

### Task 1: Scaffold the package and pin the host contract

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `vitest.config.ts`
- Create: `openclaw.plugin.json`
- Create: `src/index.ts`
- Create: `tests/contract.test.ts`
- Create: `tests/onboarding-manifest.test.ts`

**Interfaces:**
- Produces package metadata, manifest ownership declarations, onboarding metadata, and an entry point that later tasks extend.
- Consumes the installed OpenClaw SDK types after confirming the current provider registration names, provider interfaces, and onboarding/auth metadata contract.

- [ ] **Step 1: Inspect the available OpenClaw SDK contract**

Run:

```bash
npm view openclaw version
npm view openclaw peerDependencies --json
```

Install the selected compatible SDK as a peer/dev dependency, then inspect its exported provider types and existing Firecrawl provider declarations:

```bash
npm pack openclaw --pack-destination /tmp/tinyfish-openclaw-sdk
```

Use the installed package's declarations to confirm the exact runtime registration method and the `webSearchProviders`/`webFetchProviders` manifest contract before writing adapters.

- [ ] **Step 2: Write the failing manifest contract test**

```ts
import { describe, expect, it } from "vitest";
import manifest from "../openclaw.plugin.json";

it("declares TinyFish web provider ownership without custom tools", () => {
  expect(manifest.id).toBe("tinyfish-web");
  expect(manifest.contracts).toMatchObject({
    webSearchProviders: ["tinyfish"],
    webFetchProviders: ["tinyfish"],
  });
  expect(manifest.contracts.tools ?? []).toEqual([]);
});

it("declares key evidence and onboarding metadata", () => {
  expect(manifest.setup.providers).toContainEqual(
    expect.objectContaining({ id: "tinyfish", envVars: ["TINYFISH_API_KEY"] }),
  );
  expect(manifest.providerAuthChoices).toContainEqual(
    expect.objectContaining({ provider: "tinyfish", appGuidedSecret: true }),
  );
});
```

- [ ] **Step 3: Run the contract test and verify it fails**

Run:

```bash
npm test -- tests/contract.test.ts
```

Expected: FAIL because the package files and manifest do not exist yet.

- [ ] **Step 4: Add package metadata and manifest**

Use TypeScript ESM, a build script that emits `dist/`, a test script, and a peer dependency range compatible with the inspected OpenClaw SDK. Declare `webSearchProviders` and `webFetchProviders` ownership for `tinyfish`; declare no agent tools. Point the runtime extension entry at `./dist/index.js`.

Add a strict plugin `configSchema` with a sensitive `apiKey` field, setup metadata declaring `TINYFISH_API_KEY`, and a `providerAuthChoices` entry that tells OpenClaw onboarding to collect one pasted secret for TinyFish. Add concise label/help/website metadata and configure onboarding to select the native web providers after successful credential setup. Use the exact field names supported by the inspected host version.

- [ ] **Step 5: Add the typed entry-point shell**

Create `src/index.ts` exporting the OpenClaw plugin entry and an empty `register(api)` function using the current SDK's official entry-point helper. Do not make network calls during registration.

- [ ] **Step 6: Run the build and contract tests**

Run:

```bash
npm run build
npm test -- tests/contract.test.ts tests/onboarding-manifest.test.ts
```

Expected: both commands pass.

- [ ] **Step 7: Commit the scaffold**

```bash
git add package.json tsconfig.json vitest.config.ts openclaw.plugin.json src/index.ts tests/contract.test.ts
git commit -m "chore: scaffold TinyFish OpenClaw provider plugin"
```

If this workspace remains non-git, preserve the same checkpoint as a reviewed filesystem state.

---

### Task 2: Implement the shared TinyFish HTTP client

**Files:**
- Create: `src/tinyfish-client.ts`
- Create: `tests/tinyfish-client.test.ts`

**Interfaces:**
- Produces `TinyFishClient` with `search()` and `fetch()` methods, injected API key, base URLs, timeout, and fetch implementation.
- Consumes no OpenClaw runtime types; this file is independently testable with mocked HTTP.

- [ ] **Step 1: Write failing client tests**

Cover these exact cases:

```ts
it("sends the API key and encoded search parameters", async () => { /* assert GET URL and X-API-Key */ });
it("sends a batch fetch payload and markdown format", async () => { /* assert POST body */ });
it("throws a redacted error for non-2xx responses", async () => { /* assert key is absent */ });
it("aborts a request at the configured timeout", async () => { /* assert AbortError/timeout error */ });
it("classifies 401, 429, and 5xx responses without exposing credentials", async () => { /* assert safe errors and retry metadata */ });
```

- [ ] **Step 2: Run the client tests to verify failure**

```bash
npm test -- tests/tinyfish-client.test.ts
```

Expected: FAIL because `TinyFishClient` is not implemented.

- [ ] **Step 3: Implement the client**

Define request/response types for the documented TinyFish Search and Fetch JSON envelopes. Send `X-API-Key`, use `Accept: application/json`, encode search query parameters with `URLSearchParams`, serialize fetch requests as JSON, combine caller cancellation with the timeout, and parse JSON only after a successful HTTP status. Classify `401`/`403` as credential or account setup failures, `429` as rate limited with bounded `Retry-After` guidance when present, and `5xx` as transient provider failures. Error messages may contain status and a bounded generic diagnostic but must never include request headers or the API key.

- [ ] **Step 4: Run the client tests**

```bash
npm test -- tests/tinyfish-client.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit the client**

```bash
git add src/tinyfish-client.ts tests/tinyfish-client.test.ts
git commit -m "feat: add TinyFish search and fetch HTTP client"
```

---

### Task 3: Implement the native web-search provider adapter

**Files:**
- Create: `src/search-provider.ts`
- Modify: `src/index.ts`
- Create: `tests/search-provider.test.ts`

**Interfaces:**
- Produces a provider entry with id `tinyfish`, display name `TinyFish`, availability detection, and a search handler matching the inspected OpenClaw SDK contract.
- Consumes `TinyFishClient.search()` and returns the host's structured search result shape.

- [ ] **Step 1: Write failing adapter tests**

Cover:

```ts
it("maps query, count, language, country, and date filters", async () => { /* assert client input */ });
it("normalizes title, URL, snippet, publication date, and site name", async () => { /* assert provider output */ });
it("returns an empty result list without inventing an answer", async () => { /* assert empty result behavior */ });
it("reports unavailable when no API key is configured", async () => { /* assert availability */ });
it("does not register an advanced or custom search tool", async () => { /* inspect registration calls */ });
```

- [ ] **Step 2: Run the adapter tests to verify failure**

```bash
npm test -- tests/search-provider.test.ts
```

Expected: FAIL because the provider adapter is not implemented.

- [ ] **Step 3: Implement parameter translation and normalization**

Map the host's standard fields to TinyFish's supported fields. Preserve only valid HTTP(S) URLs, map `snippet` from TinyFish's snippet field, derive `siteName` from TinyFish's site name, and preserve publication dates only when valid. Keep TinyFish-only `purpose`, `domain_type`, and publication-year controls out of the native provider schema in v1.

- [ ] **Step 4: Register the provider from `src/index.ts`**

Construct configuration from plugin config first and `TINYFISH_API_KEY` second according to host conventions. Register the search provider using the exact SDK method confirmed in Task 1. Registration must be side-effect free until a search call is made.

- [ ] **Step 5: Run the adapter tests and build**

```bash
npm test -- tests/search-provider.test.ts
npm run build
```

Expected: PASS and successful build.

- [ ] **Step 6: Commit the search provider**

```bash
git add src/search-provider.ts src/index.ts tests/search-provider.test.ts
 git commit -m "feat: register TinyFish as native web search provider"
```

---

### Task 4: Implement the native web-fetch provider adapter

**Files:**
- Create: `src/fetch-provider.ts`
- Modify: `src/index.ts`
- Create: `tests/fetch-provider.test.ts`

**Interfaces:**
- Produces a provider entry with id `tinyfish`, display name `TinyFish`, availability detection, and a fetch handler matching the inspected OpenClaw SDK contract.
- Consumes `TinyFishClient.fetch()` and returns host-compatible page results plus isolated per-URL errors.

- [ ] **Step 1: Write failing fetch tests**

Cover:

```ts
it("passes one or more URLs and the requested output format", async () => { /* assert client input */ });
it("normalizes successful title, final URL, description, language, and text", async () => { /* assert provider output */ });
it("preserves successful pages when one URL fails", async () => { /* assert partial results */ });
it("returns a safe provider error for malformed TinyFish results", async () => { /* assert validation */ });
```

- [ ] **Step 2: Run the fetch tests to verify failure**

```bash
npm test -- tests/fetch-provider.test.ts
```

Expected: FAIL because the fetch provider is not implemented.

- [ ] **Step 3: Implement fetch translation and normalization**

Send the URL batch to TinyFish, default to Markdown, pass through only supported format/TTL/purpose fields, validate each result's URL and text, and convert `errors[]` into the host's per-URL failure representation. Do not implement local SSRF checks that conflict with OpenClaw's host policy; OpenClaw remains the authority for URL safety.

- [ ] **Step 4: Register the fetch provider**

Register it through the exact SDK method confirmed in Task 1 and declare its manifest ownership. Reuse the same credential/config resolution and client factory as search without creating a second credential-loading implementation.

- [ ] **Step 5: Run tests and build**

```bash
npm test -- tests/fetch-provider.test.ts
npm run build
```

Expected: PASS and successful build.

- [ ] **Step 6: Commit the fetch provider**

```bash
git add src/fetch-provider.ts src/index.ts tests/fetch-provider.test.ts
 git commit -m "feat: register TinyFish as native web fetch provider"
```

---

### Task 5: Implement onboarding credential setup and provider availability

**Files:**
- Create: `src/config.ts`
- Create: `tests/config.test.ts`
- Modify: `src/index.ts`
- Modify: `openclaw.plugin.json`

**Interfaces:**
- Produces one shared credential/config resolver used by both providers, plus manifest/runtime setup behavior for secure onboarding.
- Consumes host-provided plugin config, SecretRef resolution, and environment metadata confirmed in Task 1.

- [ ] **Step 1: Write failing configuration tests**

Cover:

```ts
it("prefers the configured SecretRef/resolved plugin key over the environment", async () => { /* assert precedence */ });
it("uses TINYFISH_API_KEY when plugin config has no key", async () => { /* assert env fallback */ });
it("reports unavailable without a key without making a network request", async () => { /* assert no client call */ });
it("marks API-key UI metadata as sensitive", async () => { /* assert manifest hint */ });
```

- [ ] **Step 2: Run the configuration tests to verify failure**

```bash
npm test -- tests/config.test.ts
```

Expected: FAIL because the shared resolver and onboarding wiring are not implemented.

- [ ] **Step 3: Implement the shared resolver and availability behavior**

Resolve the host-normalized plugin credential first, then the Gateway environment fallback. Return a typed unavailable state when neither exists. Do not call TinyFish during detection. Ensure the provider adapters use this resolver so search and fetch cannot disagree about credentials.

- [ ] **Step 4: Wire onboarding metadata and runtime activation**

Add the provider auth choice, `setup.providers` env metadata, sensitive UI hints, and any host-required setup/runtime entry. The onboarding action must save one API key, enable the plugin, and select both `tools.web.search.provider` and `tools.web.fetch.provider` without registering a custom tool. Keep payment/wallet language out of the setup flow because Search and Fetch are free, while clearly explaining that an API key is still required.

- [ ] **Step 5: Run configuration and provider tests**

```bash
npm test -- tests/config.test.ts tests/search-provider.test.ts tests/fetch-provider.test.ts
npm run build
```

Expected: PASS and successful build.

- [ ] **Step 6: Commit onboarding support**

```bash
git add src/config.ts src/index.ts openclaw.plugin.json tests/config.test.ts
git commit -m "feat: add TinyFish onboarding and credential detection"
```

---

### Task 6: Add package documentation and end-to-end validation

**Files:**
- Create: `README.md`
- Create: `tests/registration.test.ts`
- Modify: `package.json` if validation scripts need refinement

**Interfaces:**
- Produces install/configuration documentation and a test proving both native provider registrations occur with no custom agent tool.
- Consumes the manifest, entry point, and mocked adapters from Tasks 1–4.

- [ ] **Step 1: Write the registration test**

Use a fake OpenClaw API object that records provider registrations, invoke `register(api)`, and assert exactly one `tinyfish` web-search provider and one `tinyfish` web-fetch provider are registered. Assert that no `registerTool` call occurs.

- [ ] **Step 2: Run the registration test to verify failure**

```bash
npm test -- tests/registration.test.ts
```

Expected: FAIL until the final registration wiring is complete.

- [ ] **Step 3: Finish registration wiring and scripts**

Ensure the package exports built JavaScript, runs unit tests, and performs TypeScript checking. Keep registration lazy and avoid importing a network client that executes at module load.

- [ ] **Step 4: Write `README.md`**

Document:

```text
npm install / OpenClaw plugin install
TinyFish account and API-key creation
openclaw onboard provider selection and secure key entry
TINYFISH_API_KEY environment fallback
plugins.entries.tinyfish-web configuration
 tools.web.search.provider = "tinyfish"
 tools.web.fetch.provider = "tinyfish"
 native web_search/web_fetch usage examples
Search and Fetch are free but require an API key and may be rate-limited
supported standard search fields
TinyFish-only fields intentionally deferred from native tool schemas
why advanced_web_search is intentionally not included in v1
troubleshooting for missing keys, 401/429 errors, and Gateway restart
```

Do not document unsupported provider-specific fields as if they were available through native `web_search`.

- [ ] **Step 5: Run the complete verification suite**

```bash
npm run typecheck
npm test
npm run build
npm pack --dry-run
```

Expected: typecheck, all tests, build, and package contents pass; the tarball includes `dist/`, `openclaw.plugin.json`, `README.md`, and package metadata.

- [ ] **Step 6: Commit the completed package**

```bash
git add README.md package.json tests/registration.test.ts dist .gitignore
 git commit -m "docs: finalize TinyFish OpenClaw web provider plugin"
```

If the project is not initialized as a git repository, report that verification limitation rather than initializing or committing without user approval.

---

## Plan self-review

- **Spec coverage:** Search provider, fetch provider, shared authentication, onboarding, credential detection, quota-safe errors, host-owned security, no advanced tool, package shape, tests, and README are covered by Tasks 1–6.
- **Placeholder check:** No implementation step depends on an unspecified requirement; the only discovery step is explicitly limited to pinning the installed OpenClaw SDK contract before provider code is written.
- **Type consistency:** `TinyFishClient` is the shared transport dependency for both adapters; the config resolver is shared by both adapters; both adapters register the same provider id and manifest contracts; tests verify the exact no-custom-tool decision.
- **Scope:** The plan contains one cohesive subsystem: a single TinyFish OpenClaw provider package with search, fetch, and onboarding surfaces that must ship together for the approved design.
