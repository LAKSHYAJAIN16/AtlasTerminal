# Atlas Terminal

Private, invite-only equity research workspace. Atlas is an original terminal
interface with web and desktop shells; it never substitutes mock prices for a
disconnected live feed.

## Run locally

```powershell
npm install
npm run dev
```

Open `http://localhost:3000`.

## Tech stack

- **Web/desktop shell:** Next.js 15 (App Router) + React 19 + TypeScript, served from `app/`.
- **Desktop packaging:** Tauri (Rust, `src-tauri/`) wraps the same Next.js workspace into a native Windows window; `desktop-shell/` is the loader page it points at.
- **Server-side market/research adapters** (`lib/market/`, `lib/sec/`): typed clients for FMP, Finnhub, SEC EDGAR/XBRL, and Massive Flat Files (S3-compatible historical data), all called only from API routes (`app/api/market/*`, `app/api/sec/*`) — never from the browser.
- **Live data gateway** (`services/market-gateway/`): a separate Python service (FastAPI + Redis, `redis.asyncio`) that holds one upstream Databento session and fans out normalized BBO/trade events to every connected Atlas client over a WebSocket; the client subscribes to it via `lib/market/live-client.ts` and `NEXT_PUBLIC_LIVE_GATEWAY_URL`.
- **Planned/optional integrations** referenced in `.env.example`: Supabase (persistence), Resend (email), Stripe (billing) — not yet required to run the terminal locally.

## Data configuration

Copy `.env.example` to `.env.local`.

### Lowest-cost safe stack

1. **SEC EDGAR — free:** filings and XBRL-derived company facts. Set `SEC_USER_AGENT` to an identifiable Atlas support contact. Atlas caches data and must stay below SEC fair-access limits.
2. **FMP commercial display agreement — quote required:** fundamentals, ratios, historical prices, estimates, and licensed news. FMP personal plans cannot display data inside a multi-user app.
3. **Alpaca — individual-only development:** free live IEX or delayed SIP is useful for a personal sandbox. Do not use it as Atlas's shared product quote source without an appropriate business agreement.
4. **Options, consolidated real-time SIP, premium news:** defer until users pay for dedicated data add-ons. These are the cost drivers that make a $19 base plan uneconomic.

When the Databento gateway is connected, the terminal shows its real-time BBO
and trade stream. With no gateway, it can show FMP's provider-labelled delayed
quotes; it never invents a price, bid/ask, or trade print. The client batches
the delayed watchlist request and marks the entire surface `DELAYED`. The SEC
filing route is available at `/api/sec/filings?cik=0000320193` once
`SEC_USER_AGENT` is configured.

Never add provider keys to client-side environment variables or commit `.env.local`.

### Running the live gateway (optional)

The Databento BBO/trade stream is served by a separate Python process, not
Next.js:

```powershell
cd services/market-gateway
pip install -r requirements.txt
# requires REDIS_URL and DATABENTO_API_KEY (see .env.example)
uvicorn app:app --port 8080
```

Point the terminal at it with `NEXT_PUBLIC_LIVE_GATEWAY_URL` (defaults to
`ws://localhost:8080/ws`). Without it running, the terminal falls back to
FMP's provider-labelled delayed quotes, as above — it still never invents a
price.

## Current checkpoints

- Original keyboard-first terminal shell with linked-symbol interaction
- Watchlist, research signals, market wire, and responsive layout
- Server-only FMP/Finnhub/SEC research adapters
- WebSocket gateway contract for live Databento US Equities Mini BBO/trade data
- Native Windows desktop shell (`npm run tauri:dev`)

## Desktop build

`npm run tauri:dev` starts the same Next workspace on port 1420 and opens the
native window. `npm run tauri:build` produces the Windows installer under
`src-tauri/target/release/bundle/msi/`. The desktop app and browser use the
same local API routes; neither contains a second/mock data path.

## Next slices

Production deployment, persistent multi-user workspaces/alerts, an entitled
Databento key, and the licensing/security review needed before selling access.
