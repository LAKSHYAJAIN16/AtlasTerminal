import type { MarketDataProvider, Quote } from "./types";

type FmpQuote = { symbol: string; name?: string; price?: number; change?: number; changePercentage?: number; volume?: number; timestamp?: number; exchange?: string };

type CacheEntry = { value: unknown; expiresAt: number };

const responseCache = new Map<string, CacheEntry>();
const inFlight = new Map<string, Promise<unknown>>();

const pause = (milliseconds: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, milliseconds));

async function requestFmp<T>(path: string, revalidate: number): Promise<T> {
  const apiKey = process.env.FMP_API_KEY;
  if (!apiKey) throw new Error("FMP_API_KEY is not configured.");
  const separator = path.includes("?") ? "&" : "?";
  const url = `https://financialmodelingprep.com/stable/${path}${separator}apikey=${encodeURIComponent(apiKey)}`;

  // Symbol pages need several independent fundamentals endpoints. FMP can rate
  // limit the final request even at ordinary UI load volume, so retry that
  // explicit provider signal rather than returning a misleading empty chart.
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const response = await fetch(
      url,
      revalidate === 0
        ? { cache: "no-store" }
        : { next: { revalidate } },
    );
    if (response.ok) return (await response.json()) as T;
    if (response.status === 429 && attempt < 2) {
      const retryAfter = Number(response.headers.get("retry-after"));
      const waitMs = retryAfter > 0 ? retryAfter * 1000 : 2000 * (attempt + 1);
      await pause(waitMs);
      continue;
    }
    throw new Error(`FMP request failed with ${response.status}.`);
  }
  throw new Error("FMP request rate limit retry budget was exhausted.");
}

export async function fmpGet<T>(path: string, revalidate = 300): Promise<T> {
  if (revalidate === 0) return requestFmp<T>(path, revalidate);

  const now = Date.now();
  const cached = responseCache.get(path);
  if (cached && cached.expiresAt > now) return cached.value as T;

  const pending = inFlight.get(path) as Promise<T> | undefined;
  if (pending) return pending;

  const request = requestFmp<T>(path, revalidate)
    .then((value) => {
      responseCache.set(path, {
        value,
        expiresAt: Date.now() + revalidate * 1000,
      });
      return value;
    })
    .finally(() => inFlight.delete(path));
  inFlight.set(path, request);
  return request;
}

/** Server-only adapter. Activate only after confirming commercial display rights. */
export class FmpMarketDataProvider implements MarketDataProvider {
  constructor(private readonly apiKey: string) {}

  async getQuote(symbol: string): Promise<Quote> {
    const [quote] = await fmpGet<FmpQuote[]>(`quote?symbol=${encodeURIComponent(symbol)}`, 0);
    if (!quote || quote.price == null) throw new Error(`FMP returned no quote for ${symbol}.`);
    return {
      symbol: quote.symbol,
      name: quote.name ?? quote.symbol,
      exchange: quote.exchange ?? "US",
      currency: "USD",
      price: quote.price,
      change: quote.change ?? 0,
      changePercent: quote.changePercentage ?? 0,
      volume: quote.volume ?? null,
      asOf: quote.timestamp ? new Date(quote.timestamp * 1000).toISOString() : new Date().toISOString(),
      delayMinutes: 15,
      source: "fmp"
    };
  }
}
