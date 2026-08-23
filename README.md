# Atlas Terminal

Private, invite-only equity research workspace. The initial UI is a working terminal shell backed by a server-only market-data adapter and intentionally defaults to labelled mock data.

## Run locally

```powershell
npm install
npm run dev
```

Open `http://localhost:3000`.

## Data configuration

Copy `.env.example` to `.env.local` and provide `FMP_API_KEY` only after acquiring a commercial display/data-license agreement. Without it, `/api/market/quote?symbol=NVDA` uses seeded 15-minute delayed demo data.

Never add provider keys to client-side environment variables or commit `.env.local`.

## Current checkpoints

- Original keyboard-first terminal shell with linked-symbol interaction
- Watchlist, research signals, market wire, and responsive layout
- Provider-normalized quote API with mock and FMP adapters

## Next slices

Supabase invite-only workspaces, persisted layouts/watchlists, SEC filing browser, fundamentals, and alert delivery.
