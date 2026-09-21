export type SearchRequest = { query: string; count?: number; language?: string; country?: string; freshness?: string; domains?: string[]; signal?: AbortSignal };
export type FetchRequest = { urls: string[]; format?: "markdown" | "html" | "json"; ttl?: number; purpose?: string; signal?: AbortSignal };
export type TinyFishErrorKind = "auth" | "rate-limit" | "transient" | "http" | "timeout" | "invalid-response";
export class TinyFishError extends Error { constructor(public readonly kind: TinyFishErrorKind, message: string, public readonly status?: number, public readonly retryAfter?: number) { super(message); this.name = "TinyFishError"; } }
export type TinyFishClientOptions = { apiKey: string; searchBaseUrl?: string; fetchBaseUrl?: string; timeoutMs?: number; fetchImpl?: typeof fetch };

const safeRetryAfter = (value: string | null) => { const n = value ? Number(value) : NaN; return Number.isFinite(n) && n >= 0 ? Math.min(n, 3600) : undefined; };

export class TinyFishClient {
  private readonly http: typeof fetch;
  private readonly timeoutMs: number;
  private readonly searchBaseUrl: string;
  private readonly fetchBaseUrl: string;
  constructor(private readonly options: TinyFishClientOptions) {
    this.http = options.fetchImpl ?? fetch;
    this.timeoutMs = options.timeoutMs ?? 20_000;
    this.searchBaseUrl = options.searchBaseUrl ?? "https://api.search.tinyfish.ai";
    this.fetchBaseUrl = options.fetchBaseUrl ?? "https://api.fetch.tinyfish.ai";
  }
  search(input: SearchRequest): Promise<unknown> {
    const params = new URLSearchParams({ query: input.query });
    if (input.count !== undefined) params.set("count", String(input.count));
    if (input.language) params.set("language", input.language);
    if (input.country) params.set("country", input.country);
    if (input.freshness) params.set("freshness", input.freshness);
    for (const domain of input.domains ?? []) params.append("domain", domain);
    return this.request(`${this.searchBaseUrl}/search?${params}`, { method: "GET" }, input.signal);
  }
  fetch(input: FetchRequest): Promise<unknown> {
    const body: Record<string, unknown> = { urls: input.urls, format: input.format ?? "markdown" };
    if (input.ttl !== undefined) body.ttl = input.ttl;
    if (input.purpose) body.purpose = input.purpose;
    return this.request(`${this.fetchBaseUrl}/fetch`, { method: "POST", body: JSON.stringify(body) }, input.signal);
  }
  private async request(url: string, init: RequestInit, signal?: AbortSignal): Promise<unknown> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(new Error("TinyFish request timeout")), this.timeoutMs);
    const abort = () => controller.abort(signal?.reason);
    signal?.addEventListener("abort", abort, { once: true });
    try {
      const response = await this.http(url, { ...init, signal: controller.signal, headers: { Accept: "application/json", "Content-Type": "application/json", "X-API-Key": this.options.apiKey } });
      if (!response.ok) {
        const retryAfter = safeRetryAfter(response.headers.get("retry-after"));
        const kind: TinyFishErrorKind = response.status === 401 || response.status === 403 ? "auth" : response.status === 429 ? "rate-limit" : response.status >= 500 ? "transient" : "http";
        throw new TinyFishError(kind, kind === "auth" ? "TinyFish authentication failed; check the configured API key." : kind === "rate-limit" ? "TinyFish rate limit reached; retry later." : `TinyFish request failed with HTTP ${response.status}.`, response.status, retryAfter);
      }
      try { return await response.json(); } catch { throw new TinyFishError("invalid-response", "TinyFish returned invalid JSON."); }
    } catch (error) {
      if (error instanceof TinyFishError) throw error;
      if (signal?.aborted) throw error;
      if (controller.signal.aborted) throw new TinyFishError("timeout", "TinyFish request timed out.");
      throw new TinyFishError("http", "TinyFish request could not be completed.");
    } finally { clearTimeout(timer); signal?.removeEventListener("abort", abort); }
  }
}
