"use client";

import { FormEvent, useMemo, useState } from "react";

type Quote = { ticker: string; name: string; last: string; bid: string; ask: string; change: string; volume: string; up: boolean };

const quotes: Quote[] = [
  { ticker: "NVDA", name: "NVIDIA Corp", last: "174.58", bid: "174.56", ask: "174.61", change: "+2.14%", volume: "188.4M", up: true },
  { ticker: "MSFT", name: "Microsoft Corp", last: "507.12", bid: "507.08", ask: "507.16", change: "+0.62%", volume: "22.1M", up: true },
  { ticker: "META", name: "Meta Platforms", last: "781.64", bid: "781.20", ask: "781.82", change: "-0.48%", volume: "11.8M", up: false },
  { ticker: "AMD", name: "Advanced Micro", last: "151.63", bid: "151.60", ask: "151.66", change: "-1.20%", volume: "43.2M", up: false },
  { ticker: "TSM", name: "Taiwan Semi", last: "238.85", bid: "238.81", ask: "238.89", change: "+0.91%", volume: "14.2M", up: true },
  { ticker: "CRWD", name: "CrowdStrike", last: "462.10", bid: "462.00", ask: "462.19", change: "+1.37%", volume: "3.6M", up: true },
  { ticker: "AVGO", name: "Broadcom Inc", last: "341.22", bid: "341.18", ask: "341.28", change: "-0.34%", volume: "19.5M", up: false }
];
const stories = ["Semiconductor leadership remains broad into the afternoon", "Cloud software names regain momentum as yields ease", "Analysts raise compute estimates after supplier checks", "Investors parse central-bank symposium remarks", "Institutional ownership filings update across technology", "Index futures hold gains as breadth improves"];
const movers = ["INTC", "NVDA", "SMCI", "PLTR", "SOFI", "HIMS", "BBAI", "RKLB", "RDDT", "IONQ"];
const pulses = [{ ticker: "QQQ", value: "+0.89%", up: true }, { ticker: "SPX", value: "+0.28%", up: true }, { ticker: "VIX", value: "-2.40%", up: true }, { ticker: "US10Y", value: "+0.04%", up: false }, { ticker: "DXY", value: "-0.21%", up: true }];

function Panel({ title, children, className = "", linked = true }: { title: string; children: React.ReactNode; className?: string; linked?: boolean }) {
  return <section className={`terminal-panel ${className}`}><header><span>{title}{linked && <b>⌁</b>}</span><div><button title="Pin">⌑</button><button title="Settings">⚙</button><button title="Close">×</button></div></header>{children}</section>;
}
function Sparkline({ up = true }: { up?: boolean }) { return <svg className="sparkline" viewBox="0 0 300 78" preserveAspectRatio="none"><path d={up ? "M0 59 L25 55 L49 61 L72 38 L99 47 L122 27 L148 40 L177 19 L203 33 L229 13 L258 27 L278 9 L300 18" : "M0 18 L25 25 L49 15 L72 32 L99 24 L122 43 L148 34 L177 52 L203 44 L229 61 L258 48 L278 69 L300 58"} /></svg>; }

export default function Home() {
  const [symbol, setSymbol] = useState("NVDA");
  const [input, setInput] = useState("");
  const [status, setStatus] = useState("Delayed data · demo provider");
  const current = useMemo(() => quotes.find((quote) => quote.ticker === symbol) ?? quotes[0], [symbol]);
  const focus = (ticker: string) => { setSymbol(ticker); setStatus(`${ticker} focused across linked panels`); };
  const submit = (event: FormEvent) => { event.preventDefault(); const found = quotes.find((quote) => input.toUpperCase().includes(quote.ticker)); if (found) focus(found.ticker); else if (input.trim()) setStatus(`Command not found: ${input}`); setInput(""); };

  return <main className="atlas-terminal">
    <div className="terminal-topline"><span>ATLAS <i>TERMINAL</i></span><span>Northstar / Research screen 01</span><span>{status}</span></div>
    <form className="terminal-command" onSubmit={submit}><span>›</span><input value={input} onChange={(event) => setInput(event.target.value)} placeholder="type a symbol, research command, or help" aria-label="Terminal command"/><kbd>ENTER</kbd></form>
    <div className="terminal-tabs"><button className="on">Research</button><button>Markets</button><button>Watchlists</button><button>Screeners</button><button>Alerts</button><span>US EQUITIES · 15 MIN DELAY</span></div>
    <div className="terminal-grid">
      <Panel title="QUOTE MONITOR" className="monitor" linked={false}><div className="panel-tabs"><b>Core Growth</b><button>AI</button><button>Software</button><button>Macro</button><button>…</button></div><div className="quote-table"><div className="quote-head"><span>TICKER</span><span>LAST</span><span>BID</span><span>ASK</span><span>CHG</span><span>VOL</span></div>{quotes.map((quote) => <button key={quote.ticker} onClick={() => focus(quote.ticker)} className={quote.ticker === symbol ? "quote-line selected" : "quote-line"}><span>{quote.ticker}</span><span>{quote.last}</span><span>{quote.bid}</span><span>{quote.ask}</span><span className={quote.up ? "gain" : "loss"}>{quote.change}</span><span>{quote.volume}</span></button>)}</div><button className="add-row">Add an instrument</button></Panel>
      <Panel title={`NEWS · ${symbol} US`} className="news"><div className="news-actions"><input placeholder="Search headlines"/><button>All sources</button><button>Filters</button></div><div className="headline-list">{stories.map((story, index) => <button key={story}><time>{`${10 - index}:${index ? "1" : "4"}${index} ET`}</time><strong>{story}</strong><span>{index % 2 ? "Reuters" : "Market Wire"}</span></button>)}</div></Panel>
      <Panel title="MARKET MAP" className="map" linked={false}><div className="heatmap"><div className="heat one">MEGA CAP<b>+1.4%</b></div><div className="heat two">SOFTWARE<b>+0.8%</b></div><div className="heat red">HEALTH<b>-1.1%</b></div><div className="heat three">SEMIS<b>+2.3%</b></div><div className="heat four">FINANCIALS<b>+0.4%</b></div><div className="heat five">ENERGY<b>+1.0%</b></div><div className="heat six">INDUSTRIALS<b>+0.2%</b></div></div><footer>Universe: US large cap · 100 instruments</footer></Panel>
      <Panel title={`COMPANY RESEARCH · ${symbol} US`} className="research"><div className="company-strip"><div className="company-mark">{symbol.slice(0, 1)}</div><div><h1>{current.name}</h1><p>NASDAQ · Common stock · USD</p></div><div className={current.up ? "last gain" : "last loss"}>{current.last}<small>{current.change}</small></div></div><div className="research-tabs"><button className="on">Snapshot</button><button>Financials</button><button>Filings</button><button>Peers</button><button>Estimates</button></div><div className="research-layout"><div className="chart"><div className="chart-stat"><b>${current.last}</b><span className={current.up ? "gain" : "loss"}>{current.change} today</span></div><svg viewBox="0 0 640 245" preserveAspectRatio="none"><path className="grid" d="M0 35H640M0 90H640M0 145H640M0 200H640"/><path className="candle" d="M0 170 L30 158 L51 164 L75 127 L103 141 L129 105 L157 114 L186 77 L214 91 L246 60 L275 78 L305 48 L330 59 L357 34 L385 63 L414 47 L443 90 L471 76 L498 112 L530 92 L554 129 L584 114 L614 137 L640 124"/></svg><div className="chart-years"><span>2023</span><span>2024</span><span>2025</span><span>2026</span></div></div><aside className="stats"><h2>Snapshot</h2>{[["Exchange", "NASDAQ"],["Market cap", "$4.26T"],["P / Earnings", "43.8x"],["EV / Revenue", "31.0x"],["52 week range", "$86 — $176"],["Short interest", "1.2%"]].map(([name,value]) => <p key={name}><span>{name}</span><b>{value}</b></p>)}</aside></div><div className="mini-stats"><article><span>Revenue (TTM)</span><b>$130.5B</b><em className="gain">+114.2%</em></article><article><span>Gross margin</span><b>75.0%</b><em className="gain">+4.1pp</em></article><article><span>Forward EPS</span><b>$5.14</b><em className="gain">+7.2%</em></article><article><span>Target median</span><b>$186.00</b><em className="gain">+6.3%</em></article></div></Panel>
      <Panel title="MOST ACTIVE" className="active" linked={false}><div className="active-table"><div><span>SYMBOL</span><span>LAST</span><span>CHG</span><span>VOL</span></div>{movers.map((ticker, index) => <button key={ticker} onClick={() => ticker === "NVDA" && focus(ticker)}><strong>{ticker}</strong><span>{(22.3 + index * 7.12).toFixed(2)}</span><span className={index % 3 ? "gain" : "loss"}>{index % 3 ? "+" : "-"}{(index + .28).toFixed(2)}%</span><span>{(7 + index * 3.4).toFixed(1)}M</span></button>)}</div></Panel>
      <Panel title="SHORT INTEREST" className="short" linked={false}><div className="short-meta"><span>Updated Aug 15, 2026</span><button>Refresh</button></div><div className="interest"><p>Short interest ratio <b>1.5</b></p><Sparkline/><p>Shares sold short <b>59.2M</b></p><Sparkline up={false}/></div></Panel>
      <Panel title="MARKET PULSE" className="pulse" linked={false}>{pulses.map(({ ticker, value, up }) => <button key={ticker} className="pulse-line"><b>{ticker}</b><span className={up ? "gain" : "loss"}>{value}</span></button>)}</Panel>
    </div>
    <footer className="terminal-status"><span>● CONNECTED</span><span>SYMBOL FOCUS: {symbol}</span><span>Data is delayed. Not investment advice.</span></footer>
  </main>;
}
