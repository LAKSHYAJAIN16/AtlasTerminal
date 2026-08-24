import { fmpGet } from "@/lib/market/fmp";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const symbol = new URL(request.url).searchParams.get("symbol")?.trim().toUpperCase();
  if (!symbol || !/^[A-Z.\-]{1,12}$/.test(symbol)) return Response.json({ error: "A valid U.S. ticker symbol is required." }, { status: 400 });
  const now = new Date();
  const from = new Date(now);
  from.setFullYear(now.getFullYear() - 1);
  const date = (value: Date) => value.toISOString().slice(0, 10);
  try {
    const candles = await fmpGet<unknown[]>(`historical-price-eod/full?symbol=${symbol}&from=${date(from)}&to=${date(now)}`, 3600);
    return Response.json({ symbol, candles, source: "fmp", interval: "1d", delayMinutes: 15 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load chart data.";
    return Response.json({ error: message }, { status: 502 });
  }
}
