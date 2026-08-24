export const runtime = "nodejs";

export async function GET() {
  const gatewayUrl = process.env.NEXT_PUBLIC_LIVE_GATEWAY_URL;
  const configured = Boolean(process.env.DATABENTO_API_KEY && gatewayUrl);
  return Response.json({
    provider: "databento",
    feed: "Databento US Equities Mini",
    configured,
    realtime: configured,
    gatewayConfigured: Boolean(gatewayUrl),
    message: configured
      ? "Real-time gateway is configured."
      : "Databento credentials and a live gateway URL are required; no delayed quote fallback is active.",
  }, { headers: { "Cache-Control": "no-store" } });
}
