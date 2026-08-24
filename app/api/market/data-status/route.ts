import { getMassiveFlatFilesStatus } from "@/lib/market/massive-flat-files";

export const runtime = "nodejs";

export async function GET() {
  try {
    return Response.json(await getMassiveFlatFilesStatus(), { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to verify the historical data connection.";
    return Response.json({ source: "massive-flat-files", connected: false, error: message }, { status: 502 });
  }
}
