import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => vi.unstubAllEnvs());
import { normalizeSearch, createSearchProvider } from "../src/search-provider.js";
it("normalizes valid search results and drops invalid URLs", () => { expect(normalizeSearch({ results: [{ title: "T", url: "https://example.com", snippet: "S", publishedDate: "2025-01-01", siteName: "Example" }, { url: "javascript:bad" }] })).toEqual({ results: [{ title: "T", url: "https://example.com", snippet: "S", publishedDate: "2025-01-01", siteName: "Example" }] }); });
it("returns empty results without inventing an answer", () => expect(normalizeSearch({ results: [] })).toEqual({ results: [] }));
it("exposes no custom advanced tool", () => { const api = { registerTool: vi.fn(), registerWebSearchProvider: vi.fn() }; api.registerWebSearchProvider(createSearchProvider()); expect(api.registerTool).not.toHaveBeenCalled(); });
describe("credential", () => it("reports missing credential without calling network", async () => { vi.stubEnv("TINYFISH_API_KEY", ""); const tool = createSearchProvider().createTool({ config: { plugins: { entries: { "tinyfish-web": { config: {} } } } } }); await expect(tool.execute({ query: "x" })).rejects.toThrow("configure TINYFISH_API_KEY"); }));
