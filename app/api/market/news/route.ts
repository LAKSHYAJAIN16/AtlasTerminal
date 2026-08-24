import { fmpGet } from "@/lib/market/fmp";
import { getFinnhubCompanyNews } from "@/lib/market/finnhub";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const symbol = new URL(request.url).searchParams
    .get("symbol")
    ?.trim()
    .toUpperCase();
  if (!symbol || !/^[A-Z.\-]{1,12}$/.test(symbol))
    return Response.json(
      { error: "A valid U.S. ticker symbol is required." },
      { status: 400 },
    );
  try {
    if (process.env.FINNHUB_API_KEY) {
      const news = await getFinnhubCompanyNews(symbol);
      return Response.json(
        { symbol, news, source: "finnhub", cacheMinutes: 0 },
        { headers: { "Cache-Control": "no-store" } },
      );
    }
    const news = await fmpGet<unknown[]>(
      `news/stock?symbols=${symbol}&page=0&limit=20`,
      300,
    );
    return Response.json({ symbol, news, source: "fmp", cacheMinutes: 5 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to load news.";
    return Response.json({ error: message }, { status: 502 });
  }
}
