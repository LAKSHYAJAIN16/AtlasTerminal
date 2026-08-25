export type TerminalNewsItem = {
  title: string;
  created: string;
  url: string;
  source: string;
};

type FinnhubNews = {
  headline?: string;
  datetime?: number;
  url?: string;
  source?: string;
};

type FinnhubCandles = {
  c?: number[];
  h?: number[];
  l?: number[];
  o?: number[];
  t?: number[];
  v?: number[];
  s?: string;
};

export type FinnhubCandle = {
  date: string;
  close: number;
  open: number;
  high: number;
  low: number;
  volume: number;
};

export async function getFinnhubDailyCandles(
  symbol: string,
): Promise<FinnhubCandle[]> {
  const token = process.env.FINNHUB_API_KEY;
  if (!token) throw new Error("FINNHUB_API_KEY is not configured.");
  const end = Math.floor(Date.now() / 1000);
  const start = end - 370 * 24 * 60 * 60;
  const url = new URL("https://finnhub.io/api/v1/stock/candle");
  url.searchParams.set("symbol", symbol);
  url.searchParams.set("resolution", "D");
  url.searchParams.set("from", String(start));
  url.searchParams.set("to", String(end));
  url.searchParams.set("token", token);
  const response = await fetch(url, { next: { revalidate: 3600 } });
  if (!response.ok)
    throw new Error(`Finnhub candle request failed with ${response.status}.`);
  const data = (await response.json()) as FinnhubCandles;
  if (
    data.s !== "ok" ||
    !data.c ||
    !data.o ||
    !data.h ||
    !data.l ||
    !data.t ||
    !data.v
  ) {
    throw new Error("Finnhub returned no daily candle data for this symbol.");
  }
  return data.c
    .map((close, index) => ({
      date: new Date(data.t![index] * 1000).toISOString().slice(0, 10),
      close,
      open: data.o![index],
      high: data.h![index],
      low: data.l![index],
      volume: data.v![index],
    }))
    .reverse();
}

export async function getFinnhubCompanyNews(
  symbol: string,
): Promise<TerminalNewsItem[]> {
  const token = process.env.FINNHUB_API_KEY;
  if (!token) throw new Error("FINNHUB_API_KEY is not configured.");

  const end = new Date();
  const start = new Date(end);
  start.setDate(start.getDate() - 7);
  const date = (value: Date) => value.toISOString().slice(0, 10);
  const url = new URL("https://finnhub.io/api/v1/company-news");
  url.searchParams.set("symbol", symbol);
  url.searchParams.set("from", date(start));
  url.searchParams.set("to", date(end));
  url.searchParams.set("token", token);

  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Finnhub news request failed with ${response.status}.`);
  }
  const data = (await response.json()) as FinnhubNews[];
  if (!Array.isArray(data))
    throw new Error("Finnhub returned an invalid news response.");
  return data.slice(0, 20).flatMap((item) => {
    if (!item.headline || !item.url) return [];
    return [
      {
        title: item.headline,
        created: item.datetime
          ? new Date(item.datetime * 1000).toISOString()
          : new Date().toISOString(),
        url: item.url,
        source: item.source ?? "Finnhub",
      },
    ];
  });
}
