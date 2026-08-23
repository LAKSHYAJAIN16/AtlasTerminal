export type MarketDataDelay = 0 | 15 | 20;

export type Quote = {
  symbol: string;
  name: string;
  exchange: string;
  currency: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number | null;
  asOf: string;
  delayMinutes: MarketDataDelay;
  source: "mock" | "fmp" | "massive";
};

export interface MarketDataProvider {
  getQuote(symbol: string): Promise<Quote>;
}
