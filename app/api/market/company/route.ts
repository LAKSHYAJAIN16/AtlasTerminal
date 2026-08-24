import { fmpGet } from "@/lib/market/fmp";

export const runtime = "nodejs";

function symbolFrom(request: Request) {
  const symbol = new URL(request.url).searchParams.get("symbol")?.trim().toUpperCase();
  if (!symbol || !/^[A-Z.\-]{1,12}$/.test(symbol)) throw new Error("A valid U.S. ticker symbol is required.");
  return symbol;
}

export async function GET(request: Request) {
  try {
    const symbol = symbolFrom(request);
    const [profile, incomeStatement, ratios, estimates, peers] = await Promise.all([
      fmpGet<unknown[]>(`profile?symbol=${symbol}`, 3600),
      fmpGet<unknown[]>(`income-statement?symbol=${symbol}&period=annual&limit=5`, 3600),
      fmpGet<unknown[]>(`ratios-ttm?symbol=${symbol}`, 3600),
      fmpGet<unknown[]>(`analyst-estimates?symbol=${symbol}&period=annual&page=0&limit=5`, 86400),
      fmpGet<unknown[]>(`stock-peers?symbol=${symbol}`, 86400)
    ]);
    return Response.json({ symbol, profile: profile[0] ?? null, incomeStatement, ratios: ratios[0] ?? null, estimates, peers, source: "fmp", cacheMinutes: 60 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load company data.";
    return Response.json({ error: message }, { status: 502 });
  }
}
