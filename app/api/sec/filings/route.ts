import { getRecentFilings } from "@/lib/sec/filings";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const cik = new URL(request.url).searchParams.get("cik")?.trim();
  if (!cik) return Response.json({ error: "A CIK is required." }, { status: 400 });

  try {
    const filings = await getRecentFilings(cik);
    return Response.json({ filings, source: "sec-edgar", cacheMinutes: 60 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load SEC filings.";
    return Response.json({ error: message }, { status: 502 });
  }
}
