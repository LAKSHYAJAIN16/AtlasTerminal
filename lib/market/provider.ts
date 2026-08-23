import { FmpMarketDataProvider } from "./fmp";
import { MockMarketDataProvider } from "./mock";
import type { MarketDataProvider } from "./types";

/**
 * The client never receives provider credentials. FMP becomes active only when
 * a commercial-display key is configured; otherwise every route remains usable
 * with explicit mock/demo provenance.
 */
export function getMarketDataProvider(): MarketDataProvider {
  const apiKey = process.env.FMP_API_KEY;
  return apiKey ? new FmpMarketDataProvider(apiKey) : new MockMarketDataProvider();
}
