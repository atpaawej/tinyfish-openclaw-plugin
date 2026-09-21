# TinyFish Web Provider Plugin Design

## Goal

Create an OpenClaw plugin that makes TinyFish the backend for OpenClaw's native `web_search` and `web_fetch` capabilities.

## Scope

The plugin will register two native provider surfaces:

- A web-search provider with id `tinyfish` that calls `GET https://api.search.tinyfish.ai`.
- A web-fetch provider with id `tinyfish` that calls `POST https://api.fetch.tinyfish.ai`.

OpenClaw users will continue to call the standard `web_search` and `web_fetch` tools. The plugin will not add a custom `tinyfish_search` or `advanced_web_search` tool in the first release.

## Configuration and onboarding

TinyFish Search and Fetch are free services, but their REST endpoints require a TinyFish account and API key in the `X-API-Key` header. The plugin will read `TINYFISH_API_KEY` from the Gateway process environment and support the equivalent plugin configuration value under `plugins.entries.tinyfish-web.config.apiKey`, subject to the host's SecretRef/config conventions. Credentials must never be included in model-visible output or error messages.

The manifest will declare setup metadata for `TINYFISH_API_KEY`, a provider-auth choice, and user-facing setup copy. OpenClaw onboarding should offer TinyFish after the plugin is installed, prompt for the key, save it through the host's secure credential/config path, and enable the TinyFish search and fetch providers. The plugin must not imply that free service means anonymous access or unlimited quota.

Users select the providers with:

```json5
{
  tools: {
    web: {
      search: { provider: "tinyfish" },
      fetch: { provider: "tinyfish" }
    }
  },
  plugins: {
    entries: {
      "tinyfish-web": { enabled: true }
    }
  }
}
```

## Search behavior

The provider will translate OpenClaw's standard search parameters into TinyFish parameters where supported: query, result count, country/location, language, freshness/date limits, and relevant domain filters. TinyFish-specific fields such as `purpose`, `domain_type`, and publication-year filters will not be exposed through a second tool in v1 because OpenClaw's native tool schema does not provide a stable provider-specific extension surface.

The provider will normalize TinyFish results into OpenClaw's structured result shape, preserving title, URL, snippet, publication date when present, and site name when available. It will clamp or defer result-count limits to the OpenClaw host contract rather than bypassing host safety limits.

## Fetch behavior

The provider will accept one or more URLs according to the host web-fetch contract, call TinyFish's batch fetch endpoint, and convert successful results into the host's fetch-provider result shape. Per-URL failures will remain isolated when the host contract supports partial results. Markdown will be the default requested format, with supported host options passed through only when their meaning matches TinyFish's API.

## Error, quota, and safety behavior

- Missing credentials or unavailable configuration will make the provider unavailable and produce an actionable setup error.
- Non-success HTTP responses, including `401`, `403`, `429`, and `5xx`, malformed JSON, timeouts, and per-item API errors will be converted to host-compatible provider errors without exposing the API key.
- Rate-limit responses will preserve retry guidance when the OpenClaw provider contract supports it, without promising unlimited free usage.
- The plugin will not make live network requests during onboarding availability detection; it will check only configured credential evidence.
- The implementation will use request timeouts and abort signals supplied by OpenClaw where available.
- URLs and external content remain untrusted; the plugin will rely on OpenClaw's provider boundary for content wrapping, caching, SSRF policy, and model-facing normalization.
- The plugin will not implement browser automation or arbitrary agent workflows.

## Package shape

The package will contain a TypeScript ESM runtime entry, an `openclaw.plugin.json` manifest declaring web-search and web-fetch provider contracts, a small TinyFish HTTP client, provider adapters, unit tests with mocked HTTP, and README setup instructions.

The package will target the OpenClaw plugin SDK version available during implementation and declare a compatible peer dependency. Runtime imports will be packaged in `dependencies`, while test/build dependencies remain development-only.

## Testing and acceptance

The implementation is acceptable when:

1. The package builds and its manifest is valid.
2. Search requests contain the expected authentication and translated query parameters.
3. Search responses normalize correctly, including empty results and optional metadata.
4. Fetch requests send the expected batch payload and format options.
5. Fetch partial failures do not corrupt successful page results.
6. Timeout, HTTP, malformed-payload, and missing-credential paths return safe actionable errors.
7. No custom advanced search tool is registered.
8. The README documents installation, environment configuration, provider selection, and the deliberate v1 limitation around TinyFish-specific search fields.
