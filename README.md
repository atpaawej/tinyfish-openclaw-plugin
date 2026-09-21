# TinyFish Web Provider for OpenClaw

This plugin registers TinyFish as the native backend for OpenClaw's `web_search` and `web_fetch` capabilities. It does not add `advanced_web_search` or a custom TinyFish tool.

## Install and configure

```bash
openclaw plugins install git+https://github.com/atpaawej/tinyfish-openclaw-plugin.git#main
openclaw onboard
```

The GitHub install is used until the package is published to npm. After publication, the npm form is `openclaw plugins install @tinyfish/openclaw-web-provider`.

Select TinyFish during onboarding and paste an API key from a TinyFish account. Search and Fetch are free, but REST access requires the key and may be rate-limited; free does not mean anonymous or unlimited.

Alternatively, set `TINYFISH_API_KEY` in the Gateway environment, or configure the sensitive plugin value:

```json5
{
  plugins: { entries: { "tinyfish-web": { enabled: true, config: { apiKey: "..." } } } },
  tools: { web: { search: { provider: "tinyfish" }, fetch: { provider: "tinyfish" } } }
}
```

Use the standard native `web_search` and `web_fetch` tools. Supported search fields are the host's standard query, count, language, country, freshness, and domain filters. TinyFish-only fields such as `purpose`, `domain_type`, and publication-year controls are intentionally not added to the native schema in v1.

## Troubleshooting

- Missing key: configure onboarding, `plugins.entries.tinyfish-web.config.apiKey`, or `TINYFISH_API_KEY`, then restart the Gateway.
- `401`/`403`: check the account key and restart the Gateway after changing it.
- `429`: wait for the provider's rate limit window and retry.
- Network failures/timeouts: verify Gateway egress and restart after configuration changes.
