import type { MarketDataProvider, Quote } from "./types";

type FmpQuote = { symbol: string; name?: string; price?: number; change?: number; changePercentage?: number; volume?: number; timestamp?: number; exchange?: string };

/** Server-only adapter. Activate only after confirming commercial display rights. */
export class FmpMarketDataProvider implements MarketDataProvider {
  constructor(private readonly apiKey: string) {}

  async getQuote(symbol: string): Promise<Quote> {
    const response = await fetch(`https://financialmodelingprep.com/stable/quote?symbol=${encodeURIComponent(symbol)}`, {
      headers: { apikey: this.apiKey },
      next: { revalidate: 60 }
    });
    if (!response.ok) throw new Error(`FMP quote request failed with ${response.status}.`);
    const [quote] = (await response.json()) as FmpQuote[];
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
