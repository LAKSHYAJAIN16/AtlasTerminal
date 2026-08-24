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
