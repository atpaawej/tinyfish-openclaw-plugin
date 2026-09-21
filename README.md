# TinyFish OpenClaw Plugin

An open-source OpenClaw plugin that provides TinyFish-powered native `web_search` and `web_fetch` providers.

## Status

Design and implementation plan are complete. The plugin implementation is next.

## Planned capabilities

- Native OpenClaw `web_search` provider backed by TinyFish Search
- Native OpenClaw `web_fetch` provider backed by TinyFish Fetch
- Secure API-key onboarding through `openclaw onboard`
- JavaScript-heavy page extraction
- No duplicate advanced-search tool in v1

TinyFish Search and Fetch are free, but their REST APIs require a TinyFish account and API key.

See:

- [`docs/superpowers/specs/2026-09-22-tinyfish-web-provider-design.md`](docs/superpowers/specs/2026-09-22-tinyfish-web-provider-design.md)
- [`docs/superpowers/plans/2026-09-22-tinyfish-web-provider.md`](docs/superpowers/plans/2026-09-22-tinyfish-web-provider.md)
