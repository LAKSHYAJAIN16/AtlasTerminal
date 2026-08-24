"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type Quote = { ticker: string; name: string };
type LiveQuote = {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number | null;
  source: string;
  delayMinutes: number;
  asOf: string;
};
type CompanyData = {
  profile: {
    companyName?: string;
    exchange?: string;
    marketCap?: number;
    industry?: string;
    sector?: string;
    fullTimeEmployees?: number;
    description?: string;
  } | null;
  incomeStatement: Array<{
    revenue?: number;
    grossProfit?: number;
    eps?: number;
  }>;
  ratios: {
    priceToEarningsRatioTTM?: number;
    priceToSalesRatioTTM?: number;
    enterpriseValueMultipleTTM?: number;
    dividendYieldTTM?: number;
  } | null;
};
type Candle = { date: string; close: number };
type NewsItem = {
  title?: string;
  created?: string;
  url?: string;
  source?: string;
  site?: string;
};

const quotes: Quote[] = [
  { ticker: "NVDA", name: "NVIDIA" },
  { ticker: "MSFT", name: "Microsoft" },
  { ticker: "META", name: "Meta Platforms" },
  { ticker: "AMD", name: "Advanced Micro Devices" },
  { ticker: "TSM", name: "Taiwan Semiconductor" },
  { ticker: "CRWD", name: "CrowdStrike" },
  { ticker: "AVGO", name: "Broadcom" },
];
const benchmarks: Quote[] = [
  { ticker: "QQQ", name: "Nasdaq 100" },
  { ticker: "SPY", name: "S&P 500" },
  { ticker: "IWM", name: "Russell 2000" },
  { ticker: "TLT", name: "20+ Year Treasury" },
  { ticker: "UUP", name: "U.S. Dollar" },
];
const stories = [
  "Semiconductor leadership remains broad into the afternoon",
  "Cloud software names regain momentum as yields ease",
  "Analysts raise compute estimates after supplier checks",
  "Investors parse central-bank symposium remarks",
  "Institutional ownership filings update across technology",
  "Index futures hold gains as breadth improves",
];
const movers = [
  "INTC",
  "NVDA",
  "SMCI",
  "PLTR",
  "SOFI",
  "HIMS",
  "BBAI",
  "RKLB",
  "RDDT",
  "IONQ",
];
const pulses = [
  { ticker: "QQQ", value: "+0.89%", up: true },
  { ticker: "SPX", value: "+0.28%", up: true },
  { ticker: "VIX", value: "-2.40%", up: true },
  { ticker: "US10Y", value: "+0.04%", up: false },
  { ticker: "DXY", value: "-0.21%", up: true },
];
const number = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 1,
  notation: "compact",
});
const price = (value: number) =>
  value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
const percent = (value: number) =>
  `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;

function Panel({
  title,
  children,
  className = "",
  linked = true,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
  linked?: boolean;
  onClose?: () => void;
}) {
  return (
    <section className={`terminal-panel ${className}`}>
      <header>
        <span>
          {title}
          {linked && <b>⌁</b>}
        </span>
        <div>
          <button type="button" title="Pin panel">
            ⌑
          </button>
          <button type="button" title="Panel settings">
            ⚙
          </button>
          {onClose && (
            <button type="button" title="Close panel" onClick={onClose}>
              ×
            </button>
          )}
        </div>
      </header>
      {children}
    </section>
  );
}
function Sparkline({ up = true }: { up?: boolean }) {
  return (
    <svg className="sparkline" viewBox="0 0 300 78" preserveAspectRatio="none">
      <path
        d={
          up
            ? "M0 59 L25 55 L49 61 L72 38 L99 47 L122 27 L148 40 L177 19 L203 33 L229 13 L258 27 L278 9 L300 18"
            : "M0 18 L25 25 L49 15 L72 32 L99 24 L122 43 L148 34 L177 52 L203 44 L229 61 L258 48 L278 69 L300 58"
        }
      />
    </svg>
  );
}

export default function Home() {
  const [symbol, setSymbol] = useState("NVDA");
  const [input, setInput] = useState("");
  const [status, setStatus] = useState("Delayed data · demo provider");
  const [workspace, setWorkspace] = useState("Research");
  const [researchView, setResearchView] = useState("Snapshot");
  const [newsSource, setNewsSource] = useState("All sources");
  const [hiddenPanels, setHiddenPanels] = useState<string[]>([]);
  const [liveQuotes, setLiveQuotes] = useState<Record<string, LiveQuote>>({});
  const [company, setCompany] = useState<CompanyData | null>(null);
  const [candles, setCandles] = useState<Candle[]>([]);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [newsError, setNewsError] = useState<string | null>(null);
  const current = useMemo(
    () => quotes.find((quote) => quote.ticker === symbol) ?? quotes[0],
    [symbol],
  );
  const focus = (ticker: string) => {
    setSymbol(ticker);
    setStatus(`${ticker} focused across linked panels`);
  };
  const submit = (event: FormEvent) => {
    event.preventDefault();
    const ticker = input
      .toUpperCase()
      .split(/\s+/)
      .find((token) => /^[A-Z]{1,5}(?:\.[A-Z])?$/.test(token));
    if (ticker) focus(ticker);
    else if (input.trim())
      setStatus(
        "Enter a valid U.S. ticker symbol, for example: NVDA or chart MSFT.",
      );
    setInput("");
  };
  const closePanel = (id: string) => {
    setHiddenPanels((current) => [...current, id]);
    setStatus(`${id} panel closed. Reload to restore the default workspace.`);
  };
  useEffect(() => {
    let active = true;
    const refreshQuotes = async () => {
      try {
        const results = await Promise.all(
          [...quotes, ...benchmarks].map(async ({ ticker }) => {
            const response = await fetch(`/api/market/quote?symbol=${ticker}`, {
              cache: "no-store",
            });
            if (!response.ok) throw new Error(ticker);
            return (await response.json()) as LiveQuote;
          }),
        );
        if (!active) return;
        setLiveQuotes(
          Object.fromEntries(results.map((quote) => [quote.symbol, quote])),
        );
        const asOf = results[0]?.asOf
          ? new Date(results[0].asOf).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            })
          : "—";
        setStatus(`FMP quote refresh · ${asOf} · updates every 10 seconds`);
      } catch {
        if (active)
          setStatus(
            "Live quote connection unavailable; retrying in 10 seconds.",
          );
      }
    };
    void refreshQuotes();
    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") void refreshQuotes();
    }, 10_000);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, []);
  const activeQuote = liveQuotes[symbol];
  const activeLast = activeQuote ? price(activeQuote.price) : "—";
  const activeChange = activeQuote ? percent(activeQuote.changePercent) : "—";
  const activeUp = activeQuote ? activeQuote.change >= 0 : false;
  useEffect(() => {
    let active = true;
    Promise.all([
      fetch(`/api/market/company?symbol=${symbol}`).then((response) =>
        response.ok ? response.json() : null,
      ),
      fetch(`/api/market/candles?symbol=${symbol}`).then((response) =>
        response.ok ? response.json() : null,
      ),
    ]).then(([companyResult, candleResult]) => {
      if (!active) return;
      setCompany(companyResult as CompanyData | null);
      setCandles((candleResult?.candles ?? []) as Candle[]);
    });
    return () => {
      active = false;
    };
  }, [symbol]);
  useEffect(() => {
    let active = true;
    setNews([]);
    setNewsError(null);
    fetch(`/api/market/news?symbol=${symbol}`)
      .then(async (response) => {
        const body = (await response.json()) as {
          news?: NewsItem[];
          error?: string;
        };
        if (!active) return;
        if (!response.ok) {
          setNewsError(body.error ?? "News is unavailable for this data plan.");
          return;
        }
        setNews(body.news ?? []);
      })
      .catch(() => active && setNewsError("News connection unavailable."));
    return () => {
      active = false;
    };
  }, [symbol]);
  const chartPath = useMemo(() => {
    const points = candles.slice().reverse();
    if (points.length < 2) return "";
    const closes = points.map((point) => point.close);
    const low = Math.min(...closes);
    const high = Math.max(...closes);
    const span = high - low || 1;
    return points
      .map(
        (point, index) =>
          `${index ? "L" : "M"}${((index / (points.length - 1)) * 640).toFixed(1)} ${(215 - ((point.close - low) / span) * 180).toFixed(1)}`,
      )
      .join(" ");
  }, [candles]);
  const companyName = company?.profile?.companyName ?? current.name;
  const income = company?.incomeStatement[0];
  const ratio = company?.ratios;
  const compactMoney = (value?: number) =>
    value == null ? "—" : `$${number.format(value)}`;

  return (
    <main className="atlas-terminal">
      <div className="terminal-topline">
        <span>
          ATLAS <i>TERMINAL</i>
        </span>
        <span>Northstar / Research screen 01</span>
        <span>{status}</span>
      </div>
      <form className="terminal-command" onSubmit={submit}>
        <span>›</span>
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="type a symbol, research command, or help"
          aria-label="Terminal command"
        />
        <kbd>ENTER</kbd>
      </form>
      <div className="terminal-tabs">
        {["Research", "Markets", "Watchlists", "Screeners", "Alerts"].map(
          (item) => (
            <button
              type="button"
              key={item}
              className={workspace === item ? "on" : ""}
              onClick={() => {
                setWorkspace(item);
                setStatus(`${item} workspace selected`);
              }}
            >
              {item}
            </button>
          ),
        )}
        <span>US EQUITIES · 15 MIN DELAY</span>
      </div>
      <div className="terminal-grid">
        {!hiddenPanels.includes("quote") && (
          <Panel
            title="QUOTE MONITOR"
            className="monitor"
            linked={false}
            onClose={() => closePanel("quote")}
          >
            <div className="panel-tabs">
              <b>Core Growth</b>
              <button
                type="button"
                onClick={() => setStatus("AI watchlist selected")}
              >
                AI
              </button>
              <button
                type="button"
                onClick={() => setStatus("Software watchlist selected")}
              >
                Software
              </button>
              <button
                type="button"
                onClick={() => setStatus("Macro watchlist selected")}
              >
                Macro
              </button>
            </div>
            <div className="quote-table">
              <div className="quote-head">
                <span>TICKER</span>
                <span>LAST</span>
                <span>BID</span>
                <span>ASK</span>
                <span>CHG</span>
                <span>VOL</span>
              </div>
              {quotes.map((quote) => {
                const live = liveQuotes[quote.ticker];
                const up = live ? live.change >= 0 : false;
                return (
                  <button
                    type="button"
                    key={quote.ticker}
                    onClick={() => focus(quote.ticker)}
                    className={
                      quote.ticker === symbol
                        ? "quote-line selected"
                        : "quote-line"
                    }
                  >
                    <span>{quote.ticker}</span>
                    <span>{live ? price(live.price) : "—"}</span>
                    <span>—</span>
                    <span>—</span>
                    <span className={up ? "gain" : "loss"}>
                      {live ? percent(live.changePercent) : "—"}
                    </span>
                    <span>
                      {live?.volume != null ? number.format(live.volume) : "—"}
                    </span>
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              className="add-row"
              onClick={() =>
                setStatus(
                  "Instrument entry will be enabled with persisted watchlists",
                )
              }
            >
              Add an instrument
            </button>
          </Panel>
        )}
        {!hiddenPanels.includes("news") && (
          <Panel
            title={`NEWS · ${symbol} US`}
            className="news"
            onClose={() => closePanel("news")}
          >
            <div className="news-actions">
              <input placeholder="Search headlines" />
              <button
                type="button"
                onClick={() =>
                  setNewsSource((source) =>
                    source === "All sources" ? "Company news" : "All sources",
                  )
                }
              >
                {newsSource}
              </button>
              <button
                type="button"
                onClick={() =>
                  setStatus(
                    "News filters will apply once the news provider is entitled",
                  )
                }
              >
                Filters
              </button>
            </div>
            <div className="headline-list">
              {newsError ? (
                <p className="panel-message">
                  {newsError}
                  <br />
                  <span>
                    Configure an entitled FMP or Benzinga Newsfeed plan to
                    enable this panel.
                  </span>
                </p>
              ) : news.length ? (
                news.map((item, index) => (
                  <a
                    key={item.url ?? `${item.title}-${index}`}
                    href={item.url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <time>
                      {item.created
                        ? new Date(item.created).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "—"}
                    </time>
                    <strong>{item.title ?? "Untitled news item"}</strong>
                    <span>{item.source ?? item.site ?? "Licensed news"}</span>
                  </a>
                ))
              ) : (
                <p className="panel-message">
                  Loading licensed news for {symbol}…
                </p>
              )}
            </div>
          </Panel>
        )}
        {!hiddenPanels.includes("map") && (
          <Panel
            title="MARKET MAP"
            className="map"
            linked={false}
            onClose={() => closePanel("map")}
          >
            <div className="heatmap">
              <div className="heat one">
                MEGA CAP<b>—</b>
              </div>
              <div className="heat two">
                SOFTWARE<b>—</b>
              </div>
              <div className="heat red">
                HEALTH<b>—</b>
              </div>
              <div className="heat three">
                SEMIS<b>—</b>
              </div>
              <div className="heat four">
                FINANCIALS<b>—</b>
              </div>
              <div className="heat five">
                ENERGY<b>—</b>
              </div>
              <div className="heat six">
                INDUSTRIALS<b>—</b>
              </div>
            </div>
            <footer>Sector-return data source required</footer>
          </Panel>
        )}
        {!hiddenPanels.includes("research") && (
          <Panel
            title={`COMPANY RESEARCH · ${symbol} US`}
            className="research"
            onClose={() => closePanel("research")}
          >
            <div className="company-strip">
              <div className="company-mark">{symbol.slice(0, 1)}</div>
              <div>
                <h1>{companyName}</h1>
                <p>
                  {company?.profile?.exchange ?? "NASDAQ"} ·{" "}
                  {company?.profile?.industry ?? "Common stock"} · USD
                </p>
              </div>
              <div className={activeUp ? "last gain" : "last loss"}>
                {activeLast}
                <small>{activeChange}</small>
              </div>
            </div>
            <div className="research-tabs">
              {["Snapshot", "Financials", "Filings", "Peers", "Estimates"].map(
                (view) => (
                  <button
                    type="button"
                    key={view}
                    className={researchView === view ? "on" : ""}
                    onClick={() => {
                      setResearchView(view);
                      setStatus(`${view} selected for ${symbol}`);
                    }}
                  >
                    {view}
                  </button>
                ),
              )}
            </div>
            <div className="research-layout">
              <div className="chart">
                <div className="chart-stat">
                  <b>{researchView} · 1Y</b>
                  <span className={activeUp ? "gain" : "loss"}>
                    {activeChange} today
                  </span>
                </div>
                <svg viewBox="0 0 640 245" preserveAspectRatio="none">
                  <path
                    className="grid"
                    d="M0 35H640M0 90H640M0 145H640M0 200H640"
                  />
                  <path className="candle" d={chartPath} />
                </svg>
                <div className="chart-years">
                  <span>1Y ago</span>
                  <span>9M</span>
                  <span>6M</span>
                  <span>Today</span>
                </div>
              </div>
              <aside className="stats">
                <h2>{researchView}</h2>
                {[
                  ["Exchange", company?.profile?.exchange ?? "—"],
                  ["Market cap", compactMoney(company?.profile?.marketCap)],
                  [
                    "P / Earnings",
                    ratio?.priceToEarningsRatioTTM
                      ? `${ratio.priceToEarningsRatioTTM.toFixed(1)}x`
                      : "—",
                  ],
                  [
                    "P / Sales",
                    ratio?.priceToSalesRatioTTM
                      ? `${ratio.priceToSalesRatioTTM.toFixed(1)}x`
                      : "—",
                  ],
                  [
                    "EV / EBITDA",
                    ratio?.enterpriseValueMultipleTTM
                      ? `${ratio.enterpriseValueMultipleTTM.toFixed(1)}x`
                      : "—",
                  ],
                  [
                    "Employees",
                    company?.profile?.fullTimeEmployees?.toLocaleString() ??
                      "—",
                  ],
                ].map(([name, value]) => (
                  <p key={name}>
                    <span>{name}</span>
                    <b>{value}</b>
                  </p>
                ))}
              </aside>
            </div>
            <div className="mini-stats">
              <article>
                <span>Revenue (annual)</span>
                <b>{compactMoney(income?.revenue)}</b>
                <em>FMP reported</em>
              </article>
              <article>
                <span>Gross profit</span>
                <b>{compactMoney(income?.grossProfit)}</b>
                <em>FMP reported</em>
              </article>
              <article>
                <span>Diluted EPS</span>
                <b>{income?.eps?.toFixed(2) ?? "—"}</b>
                <em>FMP reported</em>
              </article>
              <article>
                <span>Dividend yield</span>
                <b>
                  {ratio?.dividendYieldTTM
                    ? percent(ratio.dividendYieldTTM * 100)
                    : "—"}
                </b>
                <em>TTM</em>
              </article>
            </div>
          </Panel>
        )}
        <Panel title="WATCHLIST ACTIVITY" className="active" linked={false}>
          <div className="active-table">
            <div>
              <span>SYMBOL</span>
              <span>LAST</span>
              <span>CHG</span>
              <span>VOL</span>
            </div>
            {quotes.map(({ ticker }) => {
              const live = liveQuotes[ticker];
              const up = live ? live.change >= 0 : false;
              return (
              <button
                key={ticker}
                onClick={() => focus(ticker)}
              >
                <strong>{ticker}</strong>
                <span>{live ? price(live.price) : "—"}</span>
                <span className={up ? "gain" : "loss"}>{live ? percent(live.changePercent) : "—"}</span>
                <span>{live?.volume != null ? number.format(live.volume) : "—"}</span>
              </button>
              );
            })}
          </div>
        </Panel>
        <Panel title="SHORT INTEREST" className="short" linked={false}>
          <p className="panel-message">Short-interest data provider is not connected yet.<br/><span>No estimated or placeholder figures are displayed.</span></p>
        </Panel>
        <Panel title="MARKET PULSE" className="pulse" linked={false}>
          {benchmarks.map(({ ticker }) => {
            const live = liveQuotes[ticker];
            const up = live ? live.change >= 0 : false;
            return <button key={ticker} className="pulse-line" onClick={() => focus(ticker)}>
              <b>{ticker}</b>
              <span className={up ? "gain" : "loss"}>{live ? percent(live.changePercent) : "—"}</span>
            </button>
          })}
        </Panel>
      </div>
      <footer className="terminal-status">
        <span>● CONNECTED</span>
        <span>SYMBOL FOCUS: {symbol}</span>
        <span>Data is delayed. Not investment advice.</span>
      </footer>
    </main>
  );
}
