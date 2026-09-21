import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { createSearchProvider } from "./search-provider.js";
import { createFetchProvider } from "./fetch-provider.js";

export const register = (api: any) => {
  api.registerWebSearchProvider(createSearchProvider());
  api.registerWebFetchProvider(createFetchProvider());
};
export default definePluginEntry({ id: "tinyfish-web", name: "TinyFish Web", description: "Native TinyFish web search and fetch providers.", register });
