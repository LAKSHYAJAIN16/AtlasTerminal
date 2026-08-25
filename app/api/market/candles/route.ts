import { fmpGet } from "@/lib/market/fmp";
import { getFinnhubDailyCandles } from "@/lib/market/finnhub";
import { getMassiveWeeklyCandles } from "@/lib/market/massive-flat-files";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const symbol = new URL(request.url).searchParams.get("symbol")?.trim().toUpperCase();
  if (!symbol || !/^[A-Z.\-]{1,12}$/.test(symbol)) return Response.json({ error: "A valid U.S. ticker symbol is required." }, { status: 400 });
  const now = new Date();
  const from = new Date(now);
  from.setFullYear(now.getFullYear() - 1);
  const date = (value: Date) => value.toISOString().slice(0, 10);
  try {
    if (process.env.FINNHUB_API_KEY) {
      const candles = await getFinnhubDailyCandles(symbol);
      return Response.json({
        symbol,
        candles,
        source: "finnhub",
        interval: "1d",
        delayMinutes: null,
      });
    }
    const candles = await fmpGet<unknown[]>(`historical-price-eod/full?symbol=${symbol}&from=${date(from)}&to=${date(now)}`, 3600);
    return Response.json({ symbol, candles, source: "fmp", interval: "1d", delayMinutes: 15 });
  } catch (error) {
    try {
      const candles = await getMassiveWeeklyCandles(symbol);
      if (!candles.length) throw error;
      return Response.json({
        symbol,
        candles,
        source: "massive-flat-files",
        interval: "1w",
        delayMinutes: null,
        asOf: candles.at(-1)?.date,
      });
    } catch (fallbackError) {
      const message = fallbackError instanceof Error ? fallbackError.message : "Unable to load chart data.";
      return Response.json({ error: message }, { status: 502 });
    }
  }
}
