import {
  GetObjectCommand,
  ListObjectsV2Command,
  S3Client,
} from "@aws-sdk/client-s3";
import { gunzipSync } from "node:zlib";

const endpoint = process.env.MASSIVE_S3_ENDPOINT ?? "https://files.massive.com";
const bucket = process.env.MASSIVE_S3_BUCKET ?? "flatfiles";

function getClient() {
  const accessKeyId = process.env.MASSIVE_S3_ACCESS_KEY_ID;
  const secretAccessKey = process.env.MASSIVE_S3_SECRET_ACCESS_KEY;
  if (!accessKeyId || !secretAccessKey) {
    throw new Error("Massive Flat Files S3 credentials are not configured.");
  }
  return new S3Client({
    endpoint,
    region: "us-east-1",
    forcePathStyle: true,
    credentials: { accessKeyId, secretAccessKey },
  });
}

export type MassiveCandle = {
  date: string;
  close: number;
  open: number;
  high: number;
  low: number;
  volume: number;
};

const candleCache = new Map<
  string,
  { candles: MassiveCandle[]; expiresAt: number }
>();

function dayAggregatePrefix(date: Date) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `us_stocks_sip/day_aggs_v1/${year}/${month}/`;
}

async function getAggregateKeys(client: S3Client) {
  const months = Array.from({ length: 14 }, (_, index) => {
    const date = new Date();
    date.setUTCDate(1);
    date.setUTCMonth(date.getUTCMonth() - index);
    return dayAggregatePrefix(date);
  });
  const pages = await Promise.all(
    months.map((Prefix) =>
      client.send(
        new ListObjectsV2Command({ Bucket: bucket, Prefix, MaxKeys: 100 }),
      ),
    ),
  );
  return pages
    .flatMap((page) => page.Contents ?? [])
    .map((entry) => entry.Key)
    .filter((key): key is string => Boolean(key?.endsWith(".csv.gz")))
    .sort()
    .reverse();
}

async function readDailyCandle(
  client: S3Client,
  key: string,
  symbol: string,
): Promise<MassiveCandle | null> {
  let response;
  try {
    response = await client.send(
      new GetObjectCommand({ Bucket: bucket, Key: key }),
    );
  } catch (error) {
    const status =
      typeof error === "object" && error !== null && "$metadata" in error
        ? (error as { $metadata?: { httpStatusCode?: number } }).$metadata
            ?.httpStatusCode
        : undefined;
    throw new Error(
      `Massive could not download ${key}${status ? ` (HTTP ${status})` : ""}.`,
      { cause: error },
    );
  }
  if (!response.Body) return null;
  const bytes = await response.Body.transformToByteArray();
  const [header, ...rows] = gunzipSync(bytes).toString("utf8").trim().split(/\r?\n/);
  const fields = header.split(",");
  const column = (name: string) => fields.indexOf(name);
  const ticker = column("ticker");
  const close = column("close");
  const open = column("open");
  const high = column("high");
  const low = column("low");
  const volume = column("volume");
  const windowStart = column("window_start");
  if ([ticker, close, open, high, low, volume, windowStart].some((index) => index < 0)) {
    throw new Error("Massive day aggregate schema was not recognized.");
  }
  const row = rows.find((value) => value.startsWith(`${symbol},`));
  if (!row) return null;
  const values = row.split(",");
  const timestamp = Number(values[windowStart]);
  return {
    date: new Date(timestamp / 1_000_000).toISOString().slice(0, 10),
    close: Number(values[close]),
    open: Number(values[open]),
    high: Number(values[high]),
    low: Number(values[low]),
    volume: Number(values[volume]),
  };
}

async function mapWithConcurrency<T, R>(
  values: T[],
  concurrency: number,
  mapper: (value: T) => Promise<R>,
) {
  const results = new Array<R>(values.length);
  let next = 0;
  const workers = Array.from({ length: Math.min(concurrency, values.length) }, async () => {
    while (next < values.length) {
      const index = next;
      next += 1;
      results[index] = await mapper(values[index]);
    }
  });
  await Promise.all(workers);
  return results;
}

/**
 * Returns one accurate end-of-day point per trading week from Massive Flat
 * Files. This is a resilient chart fallback, not a replacement for a live
 * intraday feed. In production, ingest this feed into a database overnight.
 */
export async function getMassiveWeeklyCandles(symbol: string) {
  const cached = candleCache.get(symbol);
  if (cached && cached.expiresAt > Date.now()) return cached.candles;
  const client = getClient();
  const keys = await getAggregateKeys(client);
  // The files are newest first. Every fifth trading day produces a compact,
  // one-year weekly chart while keeping first-load S3 transfer reasonable.
  const weeklyKeys = keys.filter((_, index) => index % 5 === 0).slice(0, 54);
  const candles = (
    await mapWithConcurrency(
      weeklyKeys,
      4,
      (key) => readDailyCandle(client, key, symbol),
    )
  )
    .filter((candle): candle is MassiveCandle => candle !== null)
    .sort((left, right) => left.date.localeCompare(right.date));
  candleCache.set(symbol, {
    candles,
    expiresAt: Date.now() + 12 * 60 * 60 * 1000,
  });
  return candles;
}

/** Verifies historical-data access without exposing credentials or downloading a large dataset. */
export async function getMassiveFlatFilesStatus() {
  const client = getClient();
  const response = await client.send(new ListObjectsV2Command({
    Bucket: bucket,
    Prefix: "us_stocks_sip/",
    MaxKeys: 1,
  }));
  const sampleKey = response.Contents?.[0]?.Key;
  let downloadAuthorized = false;
  if (sampleKey) {
    try {
      await client.send(
        new GetObjectCommand({ Bucket: bucket, Key: sampleKey }),
      );
      downloadAuthorized = true;
    } catch {
      // Listing alone is not sufficient for historical-chart ingestion.
    }
  }
  return {
    source: "massive-flat-files",
    connected: downloadAuthorized,
    scope: downloadAuthorized ? "historical-bulk-data" : "list-only",
    endpoint,
    bucket,
    sampleObjectAvailable: Boolean(sampleKey),
    message: downloadAuthorized
      ? "Historical files are available for ingestion."
      : "Credentials can list files but cannot download them; verify Flat Files plan access.",
  };
}
