# Atlas Terminal

> A private, invite-only equity research workspace -- my own take on a Bloomberg-style terminal, web + native desktop.

I'm building Atlas as a Bloomberg-style terminal with a web shell and a native desktop shell. The one rule I've held to the whole way through: it never substitutes mock prices for a disconnected live feed -- if the data isn't real, it says so instead of faking it.

## Run it locally
```powershell
npm install
npm run dev
```
Then open `http://localhost:3000`.

## How it's put together
- Next.js 15 (App Router) + React 19 + TypeScript shell, served from `app/`
- Tauri (`src-tauri/`) wraps the same Next.js workspace into a native Windows window; `desktop-shell/` is its loader page
- `lib/market/`, `lib/sec/` -- typed clients for FMP, Finnhub, SEC EDGAR/XBRL, and Massive Flat Files, called only from API routes (`app/api/market/*`, `app/api/sec/*`), never from the browser
- `services/market-gateway/` -- a separate Python (FastAPI + Redis) service holding one upstream Databento session, fanning normalized BBO/trade events to every client over WebSocket via `lib/market/live-client.ts`
- `.env.example` also has stubs for Supabase/Resend/Stripe, none required to run locally yet

## Data sources

Copy `.env.example` to `.env.local`:
1. **SEC EDGAR (free)** -- filings + XBRL company facts; set `SEC_USER_AGENT` to stay under SEC's fair-access limits
2. **FMP (commercial display agreement required)** -- fundamentals, ratios, historical prices, estimates, licensed news; FMP's personal plans can't be shown inside a multi-user app
3. **Alpaca (individual-only)** -- free live IEX/delayed SIP data for my own sandbox testing, not a shared product quote source without a business agreement
4. **Options, consolidated real-time SIP, premium news** -- deferred until users are paying for add-ons

With the Databento gateway connected the terminal shows real-time BBO/trade data; without it, it falls back to FMP's delayed quotes and marks the whole watchlist `DELAYED` -- it never invents a price. SEC filings: `/api/sec/filings?cik=0000320193` once `SEC_USER_AGENT` is set. Never put provider keys in client-side env vars, never commit `.env.local`.

### Live gateway (optional)
```powershell
cd services/market-gateway
pip install -r requirements.txt
# requires REDIS_URL and DATABENTO_API_KEY (see .env.example)
uvicorn app:app --port 8080
```
Point the terminal at it with `NEXT_PUBLIC_LIVE_GATEWAY_URL` (defaults to `ws://localhost:8080/ws`). Without it, same fallback rule -- delayed FMP quotes, never a made-up price.

## Desktop build
`npm run tauri:dev` starts the same Next workspace on port 1420 in a native window; `npm run tauri:build` produces the Windows installer under `src-tauri/target/release/bundle/msi/`. Same local API routes as the browser -- no second data path.

## Where things stand
- Keyboard-first terminal shell with linked-symbol interaction
- Watchlist, research signals, market wire, responsive layout
- Server-only FMP/Finnhub/SEC research adapters
- WebSocket gateway contract for live Databento US Equities Mini BBO/trade data
- Native Windows desktop shell (`npm run tauri:dev`)

## What's next
Production deployment, persistent multi-user workspaces and alerts, an entitled Databento key, and a licensing/security review before selling access to anyone.
