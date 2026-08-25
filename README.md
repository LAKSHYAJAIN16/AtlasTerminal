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

## Data configuration

Copy `.env.example` to `.env.local`.

### Lowest-cost safe stack

1. **SEC EDGAR — free:** filings and XBRL-derived company facts. Set `SEC_USER_AGENT` to an identifiable Atlas support contact. Atlas caches data and must stay below SEC fair-access limits.
2. **FMP commercial display agreement — quote required:** fundamentals, ratios, historical prices, estimates, and licensed news. FMP personal plans cannot display data inside a multi-user app.
3. **Alpaca — individual-only development:** free live IEX or delayed SIP is useful for a personal sandbox. Do not use it as Atlas's shared product quote source without an appropriate business agreement.
4. **Options, consolidated real-time SIP, premium news:** defer until users pay for dedicated data add-ons. These are the cost drivers that make a $19 base plan uneconomic.

The web app shows live prices only when its dedicated gateway is connected. If
the gateway is unavailable, price cells intentionally remain blank rather than
presenting stale or generated data as current. The SEC filing route is
available at `/api/sec/filings?cik=0000320193` once `SEC_USER_AGENT` is
configured.

Never add provider keys to client-side environment variables or commit `.env.local`.

## Current checkpoints

- Original keyboard-first terminal shell with linked-symbol interaction
- Watchlist, research signals, market wire, and responsive layout
- Server-only FMP/Finnhub/SEC research adapters
- WebSocket gateway contract for live Databento US Equities Mini BBO/trade data
- Native Windows desktop shell (`npm run tauri:dev`)

## Next slices

Production deployment, persistent multi-user workspaces/alerts, an entitled
Databento key, and the licensing/security review needed before selling access.
