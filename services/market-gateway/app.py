"""Atlas live-market gateway.

This service is deliberately separate from Next.js: it holds a single upstream
Databento session and multiplexes normalized quote events to all Atlas clients.
"""
import asyncio
import json
import os
import time
from collections import defaultdict
from contextlib import suppress
from typing import Any

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from redis.asyncio import Redis

app = FastAPI(title="Atlas Market Gateway")
redis = Redis.from_url(os.environ["REDIS_URL"], decode_responses=True)
clients: set[WebSocket] = set()
subscriptions: dict[WebSocket, set[str]] = defaultdict(set)
latest: dict[str, dict[str, Any]] = {}
PRICE_SCALE = 1_000_000_000


def quote_event(symbol: str, bid: float | None, ask: float | None, last: float | None, event_ts: int) -> dict[str, Any]:
    """The only event shape exposed to Atlas clients."""
    return {
        "type": "quote",
        "symbol": symbol,
        "bid": bid,
        "ask": ask,
        # `price` is the last reported trade, never a bid or ask presented as
        # though it were a trade. The UI leaves it blank until one is received.
        "price": last,
        "asOf": event_ts,
        "receivedAt": int(time.time() * 1000),
        "source": "databento",
        "feed": "Databento US Equities Mini",
        "realtime": True,
        "stale": False,
    }


async def publish(event: dict[str, Any]) -> None:
    latest[event["symbol"]] = event
    await redis.setex(f"quote:{event['symbol']}", 30, json.dumps(event))
    payload = json.dumps(event)
    for client in tuple(clients):
        if event["symbol"] not in subscriptions[client]:
            continue
        with suppress(Exception):
            await client.send_text(payload)


@app.get("/health")
async def health() -> dict[str, Any]:
    return {"ok": True, "provider": "databento", "clients": len(clients), "symbols": len(latest)}


@app.get("/snapshot")
async def snapshot(symbols: str) -> dict[str, Any]:
    requested = [symbol.strip().upper() for symbol in symbols.split(",") if symbol.strip()]
    rows: list[dict[str, Any]] = []
    for symbol in requested:
        cached = latest.get(symbol)
        if cached is None:
            raw = await redis.get(f"quote:{symbol}")
            cached = json.loads(raw) if raw else None
        if cached is not None:
            rows.append(cached)
    return {"quotes": rows, "source": "databento", "realtime": True}


@app.websocket("/ws")
async def ws(socket: WebSocket) -> None:
    await socket.accept()
    clients.add(socket)
    try:
        while True:
            message = json.loads(await socket.receive_text())
            action = message.get("type")
            symbols = {str(symbol).upper() for symbol in message.get("symbols", [])}
            if action == "subscribe":
                subscriptions[socket].update(symbols)
                for symbol in symbols:
                    if symbol in latest:
                        await socket.send_text(json.dumps(latest[symbol]))
            elif action == "unsubscribe":
                subscriptions[socket].difference_update(symbols)
            elif action == "heartbeat":
                await socket.send_text(json.dumps({"type": "heartbeat", "at": int(time.time() * 1000)}))
    except WebSocketDisconnect:
        pass
    finally:
        clients.discard(socket)
        subscriptions.pop(socket, None)


def databento_price(value: Any) -> float | None:
    """Normalize the DBN int64 price field, whose unit is 1e-9 dollars."""
    if value is None:
        return None
    try:
        value = int(value)
    except (TypeError, ValueError):
        return None
    # DBN uses INT64_MAX as an unavailable price sentinel.
    if value >= 9_000_000_000_000_000_000:
        return None
    return value / PRICE_SCALE


def run_databento_stream(loop: asyncio.AbstractEventLoop) -> None:
    """Run Databento's blocking client outside FastAPI's event loop.

    Live MBP-1 records contain only an instrument ID. SymbolMappingMsg records
    map that ID back to the raw ticker; a browser never sees provider internals.
    """
    import databento as db  # type: ignore

    api_key = os.environ["DATABENTO_API_KEY"]
    tracked = [
        symbol.strip().upper()
        for symbol in os.environ.get(
            "ATLAS_BOOTSTRAP_SYMBOLS",
            "NVDA,MSFT,META,AMD,TSM,CRWD,AVGO,QQQ,SPY,IWM,TLT,UUP",
        ).split(",")
        if symbol.strip()
    ]
    symbol_directory: dict[int, str] = {}
    last_trades: dict[str, float] = {}
    client = db.Live(key=api_key)

    def on_record(record: Any) -> None:
        if isinstance(record, db.SymbolMappingMsg):
            symbol_directory[record.instrument_id] = record.stype_out_symbol.upper()
            return
        symbol = symbol_directory.get(record.instrument_id)
        if not symbol:
            return
        if isinstance(record, db.TradeMsg):
            trade = databento_price(getattr(record, "price", None))
            if trade is None:
                return
            last_trades[symbol] = trade
            prior = latest.get(symbol, {})
            event = quote_event(
                symbol,
                prior.get("bid"),
                prior.get("ask"),
                trade,
                int(record.ts_event / 1_000_000),
            )
            asyncio.run_coroutine_threadsafe(publish(event), loop)
            return
        if not isinstance(record, db.MBP1Msg):
            return
        level = record.levels[0]
        bid = databento_price(getattr(level, "bid_px", None))
        ask = databento_price(getattr(level, "ask_px", None))
        event = quote_event(
            symbol,
            bid,
            ask,
            last_trades.get(symbol),
            int(record.ts_event / 1_000_000),
        )
        asyncio.run_coroutine_threadsafe(publish(event), loop)

    client.subscribe(
        dataset="EQUS.MINI",
        schema="mbp-1",
        stype_in="raw_symbol",
        symbols=tracked,
    )
    client.subscribe(
        dataset="EQUS.MINI",
        schema="trades",
        stype_in="raw_symbol",
        symbols=tracked,
    )
    client.add_callback(on_record)
    client.start()
    client.block_for_close()


async def databento_ingest() -> None:
    """Restart the blocking provider client with bounded backoff on failures."""
    loop = asyncio.get_running_loop()
    while True:
        try:
            await asyncio.to_thread(run_databento_stream, loop)
        except Exception as error:
            print(f"Databento stream stopped: {error}", flush=True)
            await asyncio.sleep(5)
        else:
            await asyncio.sleep(1)


@app.on_event("startup")
async def startup() -> None:
    if os.getenv("DATABENTO_API_KEY"):
        app.state.ingest_task = asyncio.create_task(databento_ingest())
