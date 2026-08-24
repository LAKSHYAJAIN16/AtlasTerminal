# Atlas Terminal

Private, invite-only equity research workspace. The initial UI is a working terminal shell backed by a server-only market-data adapter and intentionally defaults to labelled mock data.

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

Without a commercial provider entitlement, `/api/market/quote?symbol=NVDA` intentionally uses seeded 15-minute delayed demo data. The SEC filing route is available at `/api/sec/filings?cik=0000320193` once `SEC_USER_AGENT` is configured.

Never add provider keys to client-side environment variables or commit `.env.local`.

## Current checkpoints

- Original keyboard-first terminal shell with linked-symbol interaction
- Watchlist, research signals, market wire, and responsive layout
- Provider-normalized quote API with mock and FMP adapters

## Next slices

Supabase invite-only workspaces, persisted layouts/watchlists, SEC filing browser, fundamentals, and alert delivery.
