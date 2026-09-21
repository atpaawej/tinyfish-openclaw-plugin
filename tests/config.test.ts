import { expect, it } from "vitest";
import { resolveCredential } from "../src/config.js";
it("prefers configured key over environment", () => expect(resolveCredential({ apiKey: "config" }, { TINYFISH_API_KEY: "env" }).apiKey).toBe("config"));
it("uses environment fallback", () => expect(resolveCredential({}, { TINYFISH_API_KEY: "env" }).apiKey).toBe("env"));
it("reports unavailable without a key", () => expect(resolveCredential({}, {}).source).toBe("missing"));
