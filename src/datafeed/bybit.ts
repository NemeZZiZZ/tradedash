import { ManagedSocket } from "./ws";
import { OrderBookState } from "./orderbook";
import type {
  DataSource,
  DepthSnapshot,
  KLineData,
  PartialSymbolInfo,
  SymbolInfo,
  TerminalPeriod,
} from "./types";

const REST = "https://api.bybit.com/v5";
const WS = "wss://stream.bybit.com/v5/public/spot";

const POPULAR: PartialSymbolInfo[] = [
  { ticker: "BTCUSDT", name: "Bitcoin / Tether", pricePrecision: 2, volumePrecision: 6 },
  { ticker: "ETHUSDT", name: "Ethereum / Tether", pricePrecision: 2, volumePrecision: 5 },
  { ticker: "SOLUSDT", name: "Solana / Tether", pricePrecision: 3, volumePrecision: 2 },
];

/** Our period → Bybit kline interval (minutes, or D/W/M). */
function periodToInterval(period: TerminalPeriod): string {
  const { span, type } = period;
  switch (type) {
    case "minute":
      return String(span);
    case "hour":
      return String(span * 60);
    case "day":
      return "D";
    case "week":
      return "W";
    case "month":
      return "M";
    default:
      return "D";
  }
}

function precisionFromStep(step: string): number {
  const s = parseFloat(step).toString();
  const dot = s.indexOf(".");
  return dot === -1 ? 0 : s.length - dot - 1;
}

interface BybitInstrument {
  symbol: string;
  baseCoin: string;
  quoteCoin: string;
  status: string;
  priceFilter: { tickSize: string };
  lotSizeFilter: { basePrecision: string };
}

export class BybitDataSource implements DataSource {
  readonly id = "bybit";
  readonly label = "Bybit";

  private universe: PartialSymbolInfo[] | null = null;
  private universePromise: Promise<PartialSymbolInfo[]> | null = null;

  private socket: ManagedSocket | null = null;
  private topics = new Map<string, Set<(data: KLineData) => void>>();

  private loadUniverse(): Promise<PartialSymbolInfo[]> {
    if (this.universe) return Promise.resolve(this.universe);
    if (this.universePromise) return this.universePromise;

    this.universePromise = fetch(`${REST}/market/instruments-info?category=spot`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("instruments failed"))))
      .then((data: { result: { list: BybitInstrument[] } }) => {
        const list = (data.result?.list ?? [])
          .filter((s) => s.status === "Trading" && (s.quoteCoin === "USDT" || s.quoteCoin === "USDC"))
          .map<PartialSymbolInfo>((s) => ({
            ticker: s.symbol,
            name: `${s.baseCoin} / ${s.quoteCoin}`,
            shortName: s.symbol,
            pricePrecision: s.priceFilter?.tickSize
              ? precisionFromStep(s.priceFilter.tickSize)
              : 2,
            volumePrecision: s.lotSizeFilter?.basePrecision
              ? precisionFromStep(s.lotSizeFilter.basePrecision)
              : 2,
          }));
        this.universe = list;
        return list;
      })
      .catch(() => {
        this.universe = POPULAR;
        return POPULAR;
      });

    return this.universePromise;
  }

  async searchSymbols(search: string): Promise<PartialSymbolInfo[]> {
    const q = search.trim().toUpperCase();
    if (!q) return POPULAR;
    const universe = this.universe ?? (await this.loadUniverse());
    return universe.filter((s) => s.ticker.includes(q)).slice(0, 50);
  }

  async getHistoryKLineData(
    symbol: SymbolInfo,
    period: TerminalPeriod,
    _from: number,
    to: number,
  ): Promise<KLineData[]> {
    const url = new URL(`${REST}/market/kline`);
    url.searchParams.set("category", "spot");
    url.searchParams.set("symbol", symbol.ticker);
    url.searchParams.set("interval", periodToInterval(period));
    url.searchParams.set("end", String(to));
    url.searchParams.set("limit", "1000");

    const res = await fetch(url.toString());
    if (!res.ok) return [];
    const data: { result?: { list?: string[][] } } = await res.json();
    const list = data.result?.list ?? [];
    // Bybit returns newest-first; the chart expects oldest-first.
    return list
      .map((k) => ({
        timestamp: Number(k[0]),
        open: parseFloat(k[1]),
        high: parseFloat(k[2]),
        low: parseFloat(k[3]),
        close: parseFloat(k[4]),
        volume: parseFloat(k[5]),
        turnover: parseFloat(k[6]),
      }))
      .reverse();
  }

  private ensureSocket(): ManagedSocket {
    if (this.socket) return this.socket;
    this.socket = new ManagedSocket(WS, {
      ping: () => ({ op: "ping" }),
      pingIntervalMs: 20_000,
      onOpen: () => {
        // Restore all topics after a (re)connect.
        for (const topic of this.topics.keys()) {
          this.socket!.send({ op: "subscribe", args: [topic] });
        }
      },
      onMessage: (raw) => {
        const msg = raw as {
          topic?: string;
          data?: Array<{
            start: number;
            open: string;
            high: string;
            low: string;
            close: string;
            volume: string;
            turnover: string;
          }>;
        };
        if (!msg.topic || !msg.data) return;
        const callbacks = this.topics.get(msg.topic);
        if (!callbacks) return;
        for (const k of msg.data) {
          const bar: KLineData = {
            timestamp: Number(k.start),
            open: parseFloat(k.open),
            high: parseFloat(k.high),
            low: parseFloat(k.low),
            close: parseFloat(k.close),
            volume: parseFloat(k.volume),
            turnover: parseFloat(k.turnover),
          };
          callbacks.forEach((cb) => cb(bar));
        }
      },
    });
    return this.socket;
  }

  subscribe(
    symbol: SymbolInfo,
    period: TerminalPeriod,
    callback: (data: KLineData) => void,
  ): void {
    const topic = `kline.${periodToInterval(period)}.${symbol.ticker}`;
    const existing = this.topics.get(topic);
    if (existing) {
      existing.add(callback);
      return;
    }
    this.topics.set(topic, new Set([callback]));
    this.ensureSocket().send({ op: "subscribe", args: [topic] });
  }

  unsubscribe(symbol: SymbolInfo, period: TerminalPeriod): void {
    const topic = `kline.${periodToInterval(period)}.${symbol.ticker}`;
    if (!this.topics.delete(topic)) return;
    this.socket?.send({ op: "unsubscribe", args: [topic] });
  }

  subscribeDepth(
    symbol: SymbolInfo,
    callback: (depth: DepthSnapshot) => void,
  ): () => void {
    const topic = `orderbook.50.${symbol.ticker}`;
    const book = new OrderBookState();
    const socket = new ManagedSocket(WS, {
      ping: () => ({ op: "ping" }),
      pingIntervalMs: 20_000,
      onOpen: () => socket.send({ op: "subscribe", args: [topic] }),
      onMessage: (raw) => {
        const msg = raw as {
          topic?: string;
          type?: string;
          data?: { b?: string[][]; a?: string[][] };
        };
        if (msg.topic !== topic || !msg.data) return;
        if (msg.type === "snapshot") book.applySnapshot(msg.data.b ?? [], msg.data.a ?? []);
        else book.applyDelta(msg.data.b, msg.data.a);
        callback(book.top(20));
      },
    });
    socket.open();
    return () => {
      socket.send({ op: "unsubscribe", args: [topic] });
      socket.close();
    };
  }
}
