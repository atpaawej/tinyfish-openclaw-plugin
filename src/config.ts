export type PluginConfig = { apiKey?: unknown } | undefined;
export type Credential = { apiKey?: string; source: "config" | "env" | "missing" };
export function resolveCredential(config?: PluginConfig, env: NodeJS.ProcessEnv = process.env): Credential {
  const configured = typeof config?.apiKey === "string" ? config.apiKey.trim() : "";
  if (configured) return { apiKey: configured, source: "config" };
  const fromEnv = env.TINYFISH_API_KEY?.trim();
  if (fromEnv) return { apiKey: fromEnv, source: "env" };
  return { source: "missing" };
}
export function unavailableMessage() { return "TinyFish is unavailable: configure TINYFISH_API_KEY or plugins.entries.tinyfish-web.config.apiKey."; }
