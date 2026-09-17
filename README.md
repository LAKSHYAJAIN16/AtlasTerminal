# Atlas Terminal

I'm building Atlas as a private, invite-only equity research workspace -- basically my own take on a Bloomberg-style terminal, with a web shell and a native desktop shell. The one rule I've held myself to the whole way through: it never substitutes mock prices for a disconnected live feed. If the data isn't real, it says so instead of faking it.

## Run it locally

```powershell
npm install
npm run dev
```

Then open `http://localhost:3000`.

## How it's put together

- **Web/desktop shell:** Next.js 15 (App Router) + React 19 + TypeScript, served from `app/`.
- **Desktop packaging:** Tauri (Rust, `src-tauri/`) wraps the same Next.js workspace into a native Windows window; `desktop-shell/` is the loader page it points at.
- **Market/research adapters** (`lib/market/`, `lib/sec/`): typed clients for FMP, Finnhub, SEC EDGAR/XBRL, and Massive Flat Files (S3-compatible historical data). These only ever get called from API routes (`app/api/market/*`, `app/api/sec/*`) -- never from the browser.
- **Live data gateway** (`services/market-gateway/`): a separate Python service (FastAPI + Redis) that holds one upstream Databento session and fans normalized BBO/trade events out to every connected Atlas client over a WebSocket. The client talks to it through `lib/market/live-client.ts` and `NEXT_PUBLIC_LIVE_GATEWAY_URL`.
- I've also stubbed out `.env.example` entries for Supabase (persistence), Resend (email), and Stripe (billing), but none of that's required to run the terminal locally yet.

## Setting up data sources

Copy `.env.example` to `.env.local`. Here's how I'm thinking about cost while keeping things legit:

1. **SEC EDGAR (free)** -- filings and XBRL-derived company facts. Set `SEC_USER_AGENT` to something that identifies Atlas so I stay under SEC's fair-access limits.
2. **FMP, commercial display agreement (quote required)** -- fundamentals, ratios, historical prices, estimates, licensed news. FMP's personal plans explicitly can't be shown inside a multi-user app, so this needs the real commercial tier.
3. **Alpaca, individual-only** -- free live IEX or delayed SIP data, fine for my own sandbox testing, but not something I'd use as Atlas's shared product quote source without an actual business agreement.
4. **Options, consolidated real-time SIP, premium news** -- I'm deferring all of this until users are actually paying for dedicated add-ons. These are exactly the costs that would make a cheap base plan uneconomical.

When the Databento gateway is connected, the terminal shows its real-time BBO and trade stream. Without it, it falls back to FMP's provider-labelled delayed quotes -- it never invents a price, bid/ask, or trade print, and the whole watchlist surface gets marked `DELAYED` so nobody's misled. SEC filings are available at `/api/sec/filings?cik=0000320193` once `SEC_USER_AGENT` is set.

One rule that matters a lot: never put provider keys in client-side env vars, and never commit `.env.local`.

### Running the live gateway (optional)

The Databento BBO/trade stream runs as its own Python process, separate from Next.js:

```powershell
cd services/market-gateway
pip install -r requirements.txt
# requires REDIS_URL and DATABENTO_API_KEY (see .env.example)
uvicorn app:app --port 8080
```

Point the terminal at it with `NEXT_PUBLIC_LIVE_GATEWAY_URL` (defaults to `ws://localhost:8080/ws`). Without it running, you just get FMP's delayed quotes instead -- same rule, it still never makes up a price.

## Where things stand

- Original keyboard-first terminal shell with linked-symbol interaction
- Watchlist, research signals, market wire, responsive layout
- Server-only FMP/Finnhub/SEC research adapters
- WebSocket gateway contract for live Databento US Equities Mini BBO/trade data
- Native Windows desktop shell (`npm run tauri:dev`)

## Desktop build

`npm run tauri:dev` starts the same Next workspace on port 1420 and opens the native window. `npm run tauri:build` produces the Windows installer under `src-tauri/target/release/bundle/msi/`. The desktop app and the browser share the exact same local API routes -- there's no second/mock data path lurking anywhere.

## What's next

Production deployment, persistent multi-user workspaces and alerts, an entitled Databento key, and the licensing/security review I'd need before actually selling access to anyone.
