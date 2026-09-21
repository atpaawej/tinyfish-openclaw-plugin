export type SearchRequest = {
    query: string;
    count?: number;
    language?: string;
    country?: string;
    freshness?: string;
    domains?: string[];
    signal?: AbortSignal;
};
export type FetchRequest = {
    urls: string[];
    format?: "markdown" | "html" | "json";
    ttl?: number;
    purpose?: string;
    signal?: AbortSignal;
};
export type TinyFishErrorKind = "auth" | "rate-limit" | "transient" | "http" | "timeout" | "invalid-response";
export declare class TinyFishError extends Error {
    readonly kind: TinyFishErrorKind;
    readonly status?: number | undefined;
    readonly retryAfter?: number | undefined;
    constructor(kind: TinyFishErrorKind, message: string, status?: number | undefined, retryAfter?: number | undefined);
}
export type TinyFishClientOptions = {
    apiKey: string;
    searchBaseUrl?: string;
    fetchBaseUrl?: string;
    timeoutMs?: number;
    fetchImpl?: typeof fetch;
};
export declare class TinyFishClient {
    private readonly options;
    private readonly http;
    private readonly timeoutMs;
    private readonly searchBaseUrl;
    private readonly fetchBaseUrl;
    constructor(options: TinyFishClientOptions);
    search(input: SearchRequest): Promise<unknown>;
    fetch(input: FetchRequest): Promise<unknown>;
    private request;
}
