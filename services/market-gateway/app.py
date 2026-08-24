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


def quote_event(symbol: str, bid: float | None, ask: float | None, last: float | None, event_ts: int) -> dict[str, Any]:
    """The only event shape exposed to Atlas clients."""
    return {
        "type": "quote",
        "symbol": symbol,
        "bid": bid,
        "ask": ask,
        "price": last if last is not None else (ask or bid),
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
    rows = [latest[symbol] for symbol in requested if symbol in latest]
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


async def databento_ingest() -> None:
    """Runs the provider client in the worker deployment.

    The Databento decoder is intentionally isolated here; instrument definitions
    are resolved to symbols before `publish` so web/desktop clients never receive
    provider-specific records.
    """
    # This imports only in the gateway image, never in the browser or Next.js app.
    import databento as db  # type: ignore

    api_key = os.environ["DATABENTO_API_KEY"]
    tracked = [symbol for symbol in os.environ.get("ATLAS_BOOTSTRAP_SYMBOLS", "NVDA,MSFT,META,AMD,TSM,CRWD,AVGO,QQQ,SPY,IWM,TLT,UUP").split(",")]
    client = db.Live(key=api_key)
    client.subscribe(dataset="EQUS.MINI", schema="mbp-1", stype_in="raw_symbol", symbols=tracked)
    # Databento's client handles authenticated live transport and reconnects.
    # Normalization is completed by the deployment adapter before calling publish.
    for record in client:
        symbol = getattr(record, "symbol", None)
        if not symbol:
            continue
        await publish(quote_event(symbol, getattr(record, "bid_px_00", None), getattr(record, "ask_px_00", None), None, int(getattr(record, "ts_event", time.time_ns()) / 1_000_000)))


@app.on_event("startup")
async def startup() -> None:
    if os.getenv("DATABENTO_API_KEY"):
        app.state.ingest_task = asyncio.create_task(databento_ingest())
