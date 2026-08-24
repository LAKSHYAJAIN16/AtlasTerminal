import { getMarketDataProvider } from "@/lib/market/provider";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const symbol = new URL(request.url).searchParams.get("symbol")?.trim().toUpperCase();
  if (!symbol || !/^[A-Z.\-]{1,12}$/.test(symbol)) {
    return Response.json({ error: "A valid U.S. ticker symbol is required." }, { status: 400 });
  }

  try {
    const quote = await getMarketDataProvider().getQuote(symbol);
    return Response.json(quote, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load quote.";
    return Response.json({ error: message }, { status: 404 });
  }
}
