import type { MarketDataProvider, Quote } from "./types";

const quotes: Record<string, Omit<Quote, "source" | "asOf">> = {
  NVDA: { symbol: "NVDA", name: "NVIDIA Corporation", exchange: "NASDAQ", currency: "USD", price: 174.58, change: 3.66, changePercent: 2.14, volume: 188_400_000, delayMinutes: 15 },
  MSFT: { symbol: "MSFT", name: "Microsoft Corporation", exchange: "NASDAQ", currency: "USD", price: 507.12, change: 3.12, changePercent: 0.62, volume: 22_100_000, delayMinutes: 15 },
  META: { symbol: "META", name: "Meta Platforms, Inc.", exchange: "NASDAQ", currency: "USD", price: 781.64, change: -3.75, changePercent: -0.48, volume: 11_800_000, delayMinutes: 15 }
};

export class MockMarketDataProvider implements MarketDataProvider {
  async getQuote(symbol: string): Promise<Quote> {
    const normalized = symbol.trim().toUpperCase();
    const quote = quotes[normalized];
    if (!quote) throw new Error(`No mock quote is available for ${normalized}.`);
    return { ...quote, source: "mock", asOf: new Date().toISOString() };
  }
}
