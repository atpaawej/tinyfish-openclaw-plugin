import { Type } from "typebox";
import { TinyFishClient } from "./tinyfish-client.js";
import { resolveCredential, unavailableMessage } from "./config.js";

const params = Type.Object({ query: Type.String(), count: Type.Optional(Type.Number()), language: Type.Optional(Type.String()), country: Type.Optional(Type.String()), freshness: Type.Optional(Type.String()), domains: Type.Optional(Type.Array(Type.String())) });
const validUrl = (value: unknown): value is string => typeof value === "string" && /^https?:\/\/[^\s]+$/i.test(value);
const validDate = (value: unknown) => typeof value === "string" && !Number.isNaN(Date.parse(value)) ? value : undefined;
export function normalizeSearch(payload: any) {
  const rows = Array.isArray(payload?.results) ? payload.results : Array.isArray(payload?.data) ? payload.data : [];
  return { results: rows.flatMap((row: any) => validUrl(row?.url ?? row?.link) ? [{ title: String(row.title ?? ""), url: row.url ?? row.link, snippet: String(row.snippet ?? row.description ?? ""), ...(validDate(row.publishedDate ?? row.published_at) ? { publishedDate: validDate(row.publishedDate ?? row.published_at) } : {}), ...(row.siteName || row.site_name ? { siteName: String(row.siteName ?? row.site_name) } : {}) }] : []) };
}
export function createSearchProvider() {
  return { id: "tinyfish", label: "TinyFish", hint: "Search the web through TinyFish.", envVars: ["TINYFISH_API_KEY"], placeholder: "tf-...", signupUrl: "https://tinyfish.ai", credentialPath: "plugins.entries.tinyfish-web.config.apiKey", requiresCredential: true, getCredentialValue: (config?: Record<string, unknown>) => config?.apiKey, setCredentialValue: (target: Record<string, unknown>, value: unknown) => { target.apiKey = value; }, createTool: (ctx: any) => ({ description: "Search the web through TinyFish.", parameters: params, execute: async (args: any, execution?: { signal?: AbortSignal }) => { const credential = resolveCredential(ctx?.config?.plugins?.entries?.["tinyfish-web"]?.config ?? ctx?.searchConfig); if (!credential.apiKey) throw new Error(unavailableMessage()); const result = await new TinyFishClient({ apiKey: credential.apiKey }).search({ ...args, signal: execution?.signal }); return normalizeSearch(result); } }) };
}
