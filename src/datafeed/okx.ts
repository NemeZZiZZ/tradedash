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

const REST = "https://www.okx.com/api/v5";
const WS = "wss://ws.okx.com:8443/ws/v5/public";

const POPULAR: PartialSymbolInfo[] = [
  { ticker: "BTC-USDT", name: "Bitcoin / Tether", pricePrecision: 1, volumePrecision: 6 },
  { ticker: "ETH-USDT", name: "Ethereum / Tether", pricePrecision: 2, volumePrecision: 5 },
  { ticker: "SOL-USDT", name: "Solana / Tether", pricePrecision: 3, volumePrecision: 2 },
];

/** Our period → OKX bar string (1m / 1H / 1D / 1W / 1M). */
function periodToBar(period: TerminalPeriod): string {
  const { span, type } = period;
  switch (type) {
    case "minute":
      return `${span}m`;
    case "hour":
      return `${span}H`;
    case "day":
      return `${span}D`;
    case "week":
      return `${span}W`;
    case "month":
      return `${span}M`;
    default:
      return "1D";
  }
}

function precisionFromStep(step: string): number {
  const s = parseFloat(step).toString();
  const dot = s.indexOf(".");
  return dot === -1 ? 0 : s.length - dot - 1;
}

interface OkxInstrument {
  instId: string;
  baseCcy: string;
  quoteCcy: string;
  state: string;
  tickSz: string;
  lotSz: string;
}

export class OkxDataSource implements DataSource {
  readonly id = "okx";
  readonly label = "OKX";

  private universe: PartialSymbolInfo[] | null = null;
  private universePromise: Promise<PartialSymbolInfo[]> | null = null;

  private socket: ManagedSocket | null = null;
  // arg key `candle<bar>|<instId>` -> subscribers
  private topics = new Map<string, Set<(data: KLineData) => void>>();

  private loadUniverse(): Promise<PartialSymbolInfo[]> {
    if (this.universe) return Promise.resolve(this.universe);
    if (this.universePromise) return this.universePromise;

    this.universePromise = fetch(`${REST}/public/instruments?instType=SPOT`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("instruments failed"))))
      .then((data: { data: OkxInstrument[] }) => {
        const list = (data.data ?? [])
          .filter((s) => s.state === "live" && (s.quoteCcy === "USDT" || s.quoteCcy === "USDC"))
          .map<PartialSymbolInfo>((s) => ({
            ticker: s.instId,
            name: `${s.baseCcy} / ${s.quoteCcy}`,
            shortName: s.instId,
            pricePrecision: s.tickSz ? precisionFromStep(s.tickSz) : 2,
            volumePrecision: s.lotSz ? precisionFromStep(s.lotSz) : 2,
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
    // Match both "BTCUSDT" and "BTC-USDT" styles.
    const qDash = q.replace(/-/g, "");
    return universe
      .filter((s) => s.ticker.replace(/-/g, "").includes(qDash))
      .slice(0, 50);
  }

  async getHistoryKLineData(
    symbol: SymbolInfo,
    period: TerminalPeriod,
    _from: number,
    to: number,
  ): Promise<KLineData[]> {
    const url = new URL(`${REST}/market/candles`);
    url.searchParams.set("instId", symbol.ticker);
    url.searchParams.set("bar", periodToBar(period));
    url.searchParams.set("after", String(to));
    url.searchParams.set("limit", "300");

    const res = await fetch(url.toString());
    if (!res.ok) return [];
    const data: { data?: string[][] } = await res.json();
    const list = data.data ?? [];
    // OKX returns newest-first; the chart expects oldest-first.
    return list
      .map((k) => ({
        timestamp: Number(k[0]),
        open: parseFloat(k[1]),
        high: parseFloat(k[2]),
        low: parseFloat(k[3]),
        close: parseFloat(k[4]),
        volume: parseFloat(k[5]),
        turnover: parseFloat(k[7] ?? k[6]),
      }))
      .reverse();
  }

  private argFor(symbol: SymbolInfo, period: TerminalPeriod) {
    return { channel: `candle${periodToBar(period)}`, instId: symbol.ticker };
  }

  private keyOf(arg: { channel: string; instId: string }) {
    return `${arg.channel}|${arg.instId}`;
  }

  private ensureSocket(): ManagedSocket {
    if (this.socket) return this.socket;
    this.socket = new ManagedSocket(WS, {
      ping: () => "ping",
      pingIntervalMs: 25_000,
      onOpen: () => {
        for (const key of this.topics.keys()) {
          const [channel, instId] = key.split("|");
          this.socket!.send({ op: "subscribe", args: [{ channel, instId }] });
        }
      },
      onMessage: (raw) => {
        const msg = raw as {
          arg?: { channel: string; instId: string };
          data?: string[][];
        };
        if (!msg.arg || !msg.data) return;
        const callbacks = this.topics.get(this.keyOf(msg.arg));
        if (!callbacks) return;
        for (const k of msg.data) {
          const bar: KLineData = {
            timestamp: Number(k[0]),
            open: parseFloat(k[1]),
            high: parseFloat(k[2]),
            low: parseFloat(k[3]),
            close: parseFloat(k[4]),
            volume: parseFloat(k[5]),
            turnover: parseFloat(k[7] ?? k[6]),
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
    const arg = this.argFor(symbol, period);
    const key = this.keyOf(arg);
    const existing = this.topics.get(key);
    if (existing) {
      existing.add(callback);
      return;
    }
    this.topics.set(key, new Set([callback]));
    this.ensureSocket().send({ op: "subscribe", args: [arg] });
  }

  unsubscribe(symbol: SymbolInfo, period: TerminalPeriod): void {
    const arg = this.argFor(symbol, period);
    if (!this.topics.delete(this.keyOf(arg))) return;
    this.socket?.send({ op: "unsubscribe", args: [arg] });
  }

  subscribeDepth(
    symbol: SymbolInfo,
    callback: (depth: DepthSnapshot) => void,
  ): () => void {
    const arg = { channel: "books", instId: symbol.ticker };
    const book = new OrderBookState();
    const socket = new ManagedSocket(WS, {
      ping: () => "ping",
      pingIntervalMs: 25_000,
      onOpen: () => socket.send({ op: "subscribe", args: [arg] }),
      onMessage: (raw) => {
        const msg = raw as {
          arg?: { channel: string; instId: string };
          action?: string;
          data?: Array<{ bids?: string[][]; asks?: string[][] }>;
        };
        if (msg.arg?.channel !== "books" || msg.arg.instId !== symbol.ticker || !msg.data) {
          return;
        }
        for (const d of msg.data) {
          if (msg.action === "snapshot") book.applySnapshot(d.bids ?? [], d.asks ?? []);
          else book.applyDelta(d.bids, d.asks);
        }
        callback(book.top(20));
      },
    });
    socket.open();
    return () => {
      socket.send({ op: "unsubscribe", args: [arg] });
      socket.close();
    };
  }
}
