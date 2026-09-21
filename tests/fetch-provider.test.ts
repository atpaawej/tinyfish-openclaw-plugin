import { expect, it } from "vitest";
import { normalizeFetch } from "../src/fetch-provider.js";
it("normalizes successful page results", () => expect(normalizeFetch({ results: [{ url: "https://example.com", finalUrl: "https://example.com/final", title: "Title", description: "Desc", language: "en", text: "Body" }] })).toEqual({ results: [{ url: "https://example.com/final", title: "Title", description: "Desc", language: "en", text: "Body" }] }));
it("preserves successful pages alongside per-url failures", () => expect(normalizeFetch({ results: [{ url: "https://example.com", text: "ok" }], errors: [{ url: "https://bad.example" }] })).toEqual({ results: [{ url: "https://example.com", text: "ok" }], errors: [{ url: "https://bad.example", error: "TinyFish could not fetch this URL." }] }));
it("rejects malformed result items", () => expect(normalizeFetch({ results: [{ url: "not-url", text: 3 }] })).toEqual({ results: [] }));
