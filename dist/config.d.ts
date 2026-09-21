export type PluginConfig = {
    apiKey?: unknown;
} | undefined;
export type Credential = {
    apiKey?: string;
    source: "config" | "env" | "missing";
};
export declare function resolveCredential(config?: PluginConfig, env?: NodeJS.ProcessEnv): Credential;
export declare function unavailableMessage(): string;
