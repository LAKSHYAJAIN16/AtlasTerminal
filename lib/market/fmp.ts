import type { MarketDataProvider, Quote } from "./types";

type FmpQuote = { symbol: string; name?: string; price?: number; change?: number; changePercentage?: number; volume?: number; timestamp?: number; exchange?: string };

export async function fmpGet<T>(path: string, revalidate = 300): Promise<T> {
  const apiKey = process.env.FMP_API_KEY;
  if (!apiKey) throw new Error("FMP_API_KEY is not configured.");
  const separator = path.includes("?") ? "&" : "?";
  const response = await fetch(`https://financialmodelingprep.com/stable/${path}${separator}apikey=${encodeURIComponent(apiKey)}`, { next: { revalidate } });
  if (!response.ok) throw new Error(`FMP request failed with ${response.status}.`);
  return await response.json() as T;
}

/** Server-only adapter. Activate only after confirming commercial display rights. */
export class FmpMarketDataProvider implements MarketDataProvider {
  constructor(private readonly apiKey: string) {}

  async getQuote(symbol: string): Promise<Quote> {
    const [quote] = await fmpGet<FmpQuote[]>(`quote?symbol=${encodeURIComponent(symbol)}`, 60);
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
