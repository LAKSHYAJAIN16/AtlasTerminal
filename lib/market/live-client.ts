"use client";

import { useEffect, useMemo, useState } from "react";

export type LiveQuote = {
  symbol: string;
  bid?: number | null;
  ask?: number | null;
  price?: number | null;
  change?: number | null;
  changePercent?: number | null;
  volume?: number | null;
  asOf: number;
  receivedAt: number;
  source: string;
  feed: string;
  realtime: boolean;
  stale: boolean;
};

export function useAtlasLiveQuotes(symbols: string[]) {
  const [quotes, setQuotes] = useState<Record<string, LiveQuote>>({});
  const [connection, setConnection] = useState<
    "connecting" | "live" | "unavailable"
  >("connecting");
  const symbolKey = useMemo(
    () => [...new Set(symbols)].sort().join(","),
    [symbols],
  );
  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_LIVE_GATEWAY_URL;
    if (!url) {
      setConnection("unavailable");
      return;
    }
    let socket: WebSocket | undefined;
    let retry: number | undefined;
    let closed = false;
    const connect = () => {
      setConnection("connecting");
      socket = new WebSocket(url);
      socket.onopen = () => {
        setConnection("live");
        socket?.send(
          JSON.stringify({ type: "subscribe", symbols: symbolKey.split(",") }),
        );
      };
      socket.onmessage = (event) => {
        const message = JSON.parse(event.data) as LiveQuote & { type?: string };
        if (message.type === "quote" && message.symbol)
          setQuotes((current) => ({ ...current, [message.symbol]: message }));
      };
      socket.onerror = () => socket?.close();
      socket.onclose = () => {
        if (!closed) {
          setConnection("unavailable");
          retry = window.setTimeout(connect, 2_000);
        }
      };
    };
    connect();
    return () => {
      closed = true;
      if (retry) window.clearTimeout(retry);
      socket?.close();
    };
  }, [symbolKey]);
  return { quotes, connection };
}
