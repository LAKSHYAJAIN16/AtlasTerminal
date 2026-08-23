"use client";

import { FormEvent, useMemo, useState } from "react";

type SymbolRow = { symbol: string; company: string; price: number; change: number; volume: string };

const watchlist: SymbolRow[] = [
  { symbol: "NVDA", company: "NVIDIA Corporation", price: 174.58, change: 2.14, volume: "188.4M" },
  { symbol: "MSFT", company: "Microsoft Corporation", price: 507.12, change: 0.62, volume: "22.1M" },
  { symbol: "META", company: "Meta Platforms", price: 781.64, change: -0.48, volume: "11.8M" },
  { symbol: "CRWD", company: "CrowdStrike", price: 462.10, change: 1.37, volume: "3.6M" },
  { symbol: "TSM", company: "Taiwan Semiconductor", price: 238.85, change: 0.91, volume: "14.2M" }
];

const news = [
  ["10:41", "Semiconductors push higher as data-center spending stays firm"],
  ["10:16", "NVIDIA supplier checks point to resilient Blackwell demand"],
  ["09:48", "Markets weigh Jackson Hole remarks and rates path"],
  ["09:31", "Chip shares lead opening rotation into growth"],
];

function Trend({ up = true }: { up?: boolean }) {
  return <span className={up ? "trend up" : "trend down"}>{up ? "▲" : "▼"}</span>;
}

function Panel({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return <section className="panel"><header className="panel-head"><span>{title}</span>{action}</header>{children}</section>;
}

export default function Home() {
  const [activeSymbol, setActiveSymbol] = useState("NVDA");
  const [command, setCommand] = useState("");
  const [notice, setNotice] = useState("Workspace synced just now");
  const active = useMemo(() => watchlist.find((row) => row.symbol === activeSymbol) ?? watchlist[0], [activeSymbol]);

  function runCommand(event: FormEvent) {
    event.preventDefault();
    const input = command.trim().toUpperCase();
    const match = watchlist.find((row) => input.includes(row.symbol));
    if (match) {
      setActiveSymbol(match.symbol);
      setNotice(`Focused ${match.symbol} across linked panels`);
    } else if (input) {
      setNotice(`Command ready: ${command}`);
    }
    setCommand("");
  }

  return (
    <main className="terminal-shell">
      <aside className="side-rail" aria-label="Workspace navigation">
        <div className="mark" aria-label="Atlas Terminal">A<span>·</span></div>
        <nav>
          <button className="rail-item active" aria-label="Research workspace">⌁</button>
          <button className="rail-item" aria-label="Watchlists">◫</button>
          <button className="rail-item" aria-label="Screener">⌘</button>
          <button className="rail-item" aria-label="Alerts">◌</button>
        </nav>
        <button className="avatar" aria-label="Your account">L</button>
      </aside>

      <section className="terminal">
        <header className="topbar">
          <div className="workspace-name"><span className="link-dot"></span><strong>Northstar</strong><span className="muted">Private workspace</span></div>
          <form className="command" onSubmit={runCommand}>
            <span className="command-mark">›</span>
            <input value={command} onChange={(event) => setCommand(event.target.value)} placeholder="Open a symbol, chart, filing, or screen…" aria-label="Terminal command" />
            <kbd>⌘ K</kbd>
          </form>
          <div className="market-status"><span className="market-orb"></span>US market open <span>15m delayed</span></div>
        </header>

        <div className="workspace">
          <section className="hero panel">
            <header className="hero-head">
              <div><p className="eyebrow"><span className="link-dot"></span> LINKED RESEARCH</p><h1>{active.company} <span>{active.symbol}</span></h1></div>
              <div className="hero-actions"><button>Follow</button><button>•••</button></div>
            </header>
            <div className="quote-row">
              <div className="price">${active.price.toFixed(2)}</div>
              <div className={active.change >= 0 ? "quote-change positive" : "quote-change negative"}><Trend up={active.change >= 0} /> {Math.abs(active.change).toFixed(2)}%</div>
              <div className="quote-meta">NASDAQ · USD<br/><span>Volume {active.volume}</span></div>
              <div className="quote-meta">Session range<br/><span>$169.32 — $176.11</span></div>
              <div className="quote-meta">Market cap<br/><span>$4.26T</span></div>
            </div>
            <div className="chart-tools"><div><button className="selected">1D</button><button>5D</button><button>1M</button><button>YTD</button><button>1Y</button></div><div><button>Indicators</button><button>Compare</button><button>⌁ Linked</button></div></div>
            <div className="chart-wrap" aria-label="Illustrative stock price chart">
              <svg viewBox="0 0 1000 250" role="img" aria-label="NVDA intraday chart trending upward">
                <defs><linearGradient id="fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#5de0a0" stopOpacity=".27"/><stop offset="1" stopColor="#5de0a0" stopOpacity="0"/></linearGradient></defs>
                {[35, 85, 135, 185, 235].map((y) => <line key={y} x1="0" x2="1000" y1={y} y2={y} className="grid-line" />)}
                <path d="M0 211 L42 199 L72 205 L105 173 L142 181 L177 154 L208 165 L247 123 L286 133 L319 113 L353 129 L384 98 L420 111 L459 75 L492 91 L526 66 L565 86 L602 59 L639 72 L674 38 L709 55 L746 24 L782 46 L823 31 L865 53 L904 20 L943 35 L1000 10 L1000 250 L0 250 Z" fill="url(#fill)" />
                <path d="M0 211 L42 199 L72 205 L105 173 L142 181 L177 154 L208 165 L247 123 L286 133 L319 113 L353 129 L384 98 L420 111 L459 75 L492 91 L526 66 L565 86 L602 59 L639 72 L674 38 L709 55 L746 24 L782 46 L823 31 L865 53 L904 20 L943 35 L1000 10" fill="none" className="price-line" />
                <circle cx="1000" cy="10" r="5" className="price-dot" />
              </svg>
              <div className="chart-label high">176.11</div><div className="chart-label low">169.32</div>
            </div>
            <footer className="chart-footer"><span>09:30</span><span>11:00</span><span>12:30</span><span>14:00</span><span>16:00 ET</span></footer>
          </section>

          <Panel title="WATCHLIST · CORE GROWTH" action={<button className="panel-button">＋</button>}>
            <div className="table-head"><span>SYMBOL</span><span>LAST</span><span>CHG</span></div>
            <div className="watchlist">
              {watchlist.map((item) => <button key={item.symbol} className={item.symbol === activeSymbol ? "watch-row current" : "watch-row"} onClick={() => { setActiveSymbol(item.symbol); setNotice(`Focused ${item.symbol} across linked panels`); }}><span><strong>{item.symbol}</strong><small>{item.company}</small></span><span>${item.price.toFixed(2)}</span><span className={item.change >= 0 ? "positive" : "negative"}><Trend up={item.change >= 0} />{Math.abs(item.change).toFixed(2)}%</span></button>)}
            </div>
            <button className="panel-footer">Open full watchlist <span>→</span></button>
          </Panel>

          <Panel title="RESEARCH SIGNALS" action={<span className="panel-status">4 new</span>}>
            <div className="signals">
              <article><span className="signal-type">ESTIMATES</span><p>FY26 revenue consensus rose 3.1% in the past 30 days.</p><span className="signal-time">Yesterday</span></article>
              <article><span className="signal-type">OWNERSHIP</span><p>Institutional ownership is 66.3%; 13F changes await licensed feed.</p><span className="signal-time">2 days ago</span></article>
              <article><span className="signal-type">FILINGS</span><p>Latest SEC filing is ready for review and linking to your notes.</p><span className="signal-time">3 days ago</span></article>
            </div>
            <button className="panel-footer">Open company research <span>→</span></button>
          </Panel>

          <Panel title="MARKET WIRE" action={<button className="panel-button">↗</button>}>
            <div className="news-list">{news.map(([time, headline]) => <article key={time}><time>{time}</time><p>{headline}</p></article>)}</div>
            <button className="panel-footer">Open news monitor <span>→</span></button>
          </Panel>
        </div>
        <footer className="statusbar"><span><i></i>{notice}</span><span>Data source: demo adapter · Quote data shown with 15-minute delay</span></footer>
      </section>
    </main>
  );
}
