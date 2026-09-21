import { Type } from "typebox";
import { TinyFishClient } from "./tinyfish-client.js";
import { resolveCredential, unavailableMessage } from "./config.js";
const params = Type.Object({ urls: Type.Array(Type.String()), format: Type.Optional(Type.Union([Type.Literal("markdown"), Type.Literal("html"), Type.Literal("json")])), ttl: Type.Optional(Type.Number()), purpose: Type.Optional(Type.String()) });
const validUrl = (value) => typeof value === "string" && /^https?:\/\/[^\s]+$/i.test(value);
export function normalizeFetch(payload) {
    const pages = Array.isArray(payload?.results) ? payload.results : Array.isArray(payload?.data) ? payload.data : [];
    const results = pages.flatMap((page) => validUrl(page?.url ?? page?.finalUrl) && typeof page?.text === "string" ? [{ url: page.finalUrl ?? page.url, title: page.title ? String(page.title) : undefined, description: page.description ? String(page.description) : undefined, language: page.language ? String(page.language) : undefined, text: page.text }] : []);
    const errors = Array.isArray(payload?.errors) ? payload.errors.map((error) => ({ url: validUrl(error?.url) ? error.url : undefined, error: "TinyFish could not fetch this URL." })) : undefined;
    return errors?.length ? { results, errors } : { results };
}
export function createFetchProvider() {
    return { id: "tinyfish", label: "TinyFish", hint: "Fetch pages through TinyFish.", envVars: ["TINYFISH_API_KEY"], placeholder: "tf-...", signupUrl: "https://tinyfish.ai", credentialPath: "plugins.entries.tinyfish-web.config.apiKey", requiresCredential: true, getCredentialValue: (config) => config?.apiKey, setCredentialValue: (target, value) => { target.apiKey = value; }, createTool: (ctx) => ({ description: "Fetch pages through TinyFish.", parameters: params, execute: async (args, execution) => { const credential = resolveCredential(ctx?.config?.plugins?.entries?.["tinyfish-web"]?.config ?? ctx?.fetchConfig); if (!credential.apiKey)
                throw new Error(unavailableMessage()); const result = await new TinyFishClient({ apiKey: credential.apiKey }).fetch({ ...args, format: args.format ?? "markdown", signal: execution?.signal }); return normalizeFetch(result); } }) };
}
