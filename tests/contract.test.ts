import { describe, expect, it } from "vitest";
import manifest from "../openclaw.plugin.json";

describe("manifest contract", () => {
  it("declares TinyFish web provider ownership without custom tools", () => {
    expect(manifest.id).toBe("tinyfish-web");
    expect(manifest.contracts).toMatchObject({ webSearchProviders: ["tinyfish"], webFetchProviders: ["tinyfish"] });
    expect(manifest.contracts.tools ?? []).toEqual([]);
  });
  it("declares key evidence and onboarding metadata", () => {
    expect(manifest.setup.providers).toContainEqual(expect.objectContaining({ id: "tinyfish", envVars: ["TINYFISH_API_KEY"] }));
    expect(manifest.providerAuthChoices).toContainEqual(expect.objectContaining({ provider: "tinyfish", appGuidedSecret: true }));
  });
});
