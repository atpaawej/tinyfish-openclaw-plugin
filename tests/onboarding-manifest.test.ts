import { expect, it } from "vitest";
import manifest from "../openclaw.plugin.json";
it("marks the API key sensitive and documents native selection", () => {
  expect(manifest.uiHints.apiKey.sensitive).toBe(true);
  expect(manifest.contracts.tools).toEqual([]);
  expect(manifest.setup.requiresRuntime).toBe(false);
});
