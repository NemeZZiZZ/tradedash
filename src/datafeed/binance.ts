import type {
  DataSource,
  DepthLevel,
  DepthSnapshot,
  KLineData,
  PartialSymbolInfo,
  SymbolInfo,
  TerminalPeriod,
} from "./types";

const REST = "https://api.binance.com/api/v3";
const WS = "wss://stream.binance.com:9443/ws";

/** Popular pairs shown instantly before the full symbol list loads. */
const POPULAR: PartialSymbolInfo[] = [
  { ticker: "BTCUSDT", name: "Bitcoin / TetherUS", pricePrecision: 2, volumePrecision: 5 },
  { ticker: "ETHUSDT", name: "Ethereum / TetherUS", pricePrecision: 2, volumePrecision: 4 },
  { ticker: "SOLUSDT", name: "Solana / TetherUS", pricePrecision: 2, volumePrecision: 2 },
  { ticker: "BNBUSDT", name: "BNB / TetherUS", pricePrecision: 2, volumePrecision: 3 },
  { ticker: "XRPUSDT", name: "XRP / TetherUS", pricePrecision: 4, volumePrecision: 1 },
  { ticker: "DOGEUSDT", name: "Dogecoin / TetherUS", pricePrecision: 5, volumePrecision: 0 },
  { ticker: "ADAUSDT", name: "Cardano / TetherUS", pricePrecision: 4, volumePrecision: 1 },
  { ticker: "AVAXUSDT", name: "Avalanche / TetherUS", pricePrecision: 2, volumePrecision: 2 },
  { ticker: "LINKUSDT", name: "Chainlink / TetherUS", pricePrecision: 2, volumePrecision: 2 },
  { ticker: "DOTUSDT", name: "Polkadot / TetherUS", pricePrecision: 3, volumePrecision: 2 },
];

function periodToInterval(period: TerminalPeriod): string {
  const { span, type } = period;
  switch (type) {
    case "minute":
      return `${span}m`;
    case "hour":
      return `${span}h`;
    case "day":
      return `${span}d`;
    case "week":
      return `${span}w`;
    case "month":
      return `${span}M`;
    default:
      return "1d";
  }
}

function precisionFromTickSize(tickSize: string): number {
  // "0.01000000" -> 2 ; "1.00000000" -> 0
  const trimmed = parseFloat(tickSize).toString();
  const dot = trimmed.indexOf(".");
  return dot === -1 ? 0 : trimmed.length - dot - 1;
}

interface BinanceSymbolFilter {
  filterType: string;
  tickSize?: string;
  stepSize?: string;
}
interface BinanceSymbolRaw {
  symbol: string;
  status: string;
  baseAsset: string;
  quoteAsset: string;
  isSpotTradingAllowed: boolean;
  filters: BinanceSymbolFilter[];
}

export class BinanceDataSource implements DataSource {
  readonly id = "binance";
  readonly label = "Binance";

  private universe: PartialSymbolInfo[] | null = null;
  private universePromise: Promise<PartialSymbolInfo[]> | null = null;

  /**
   * One WebSocket per active kline stream, keyed by `<symbol>@kline_<interval>`,
   * fanning out to every subscriber of that stream. This lets the chart and the
   * watchlist (and multiple watchlist rows) share a stream without one
   * overwriting another's callback or fighting over a single connection.
   */
  private streams = new Map<
    string,
    { ws: WebSocket; callbacks: Set<(data: KLineData) => void> }
  >();

  /** Lazily fetch & cache the full tradable symbol universe. */
  private loadUniverse(): Promise<PartialSymbolInfo[]> {
    if (this.universe) return Promise.resolve(this.universe);
    if (this.universePromise) return this.universePromise;

    this.universePromise = fetch(`${REST}/exchangeInfo`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("exchangeInfo failed"))))
      .then((data: { symbols: BinanceSymbolRaw[] }) => {
        const list = data.symbols
          .filter(
            (s) =>
              s.status === "TRADING" &&
              s.isSpotTradingAllowed &&
              (s.quoteAsset === "USDT" || s.quoteAsset === "USDC"),
          )
          .map<PartialSymbolInfo>((s) => {
            const priceFilter = s.filters.find((f) => f.filterType === "PRICE_FILTER");
            const lotFilter = s.filters.find((f) => f.filterType === "LOT_SIZE");
            return {
              ticker: s.symbol,
              name: `${s.baseAsset} / ${s.quoteAsset}`,
              shortName: s.symbol,
              pricePrecision: priceFilter?.tickSize
                ? precisionFromTickSize(priceFilter.tickSize)
                : 2,
              volumePrecision: lotFilter?.stepSize
                ? precisionFromTickSize(lotFilter.stepSize)
                : 2,
            };
          });
        this.universe = list;
        return list;
      })
      .catch(() => {
        // Network blocked / offline — degrade to the curated popular list.
        this.universe = POPULAR;
        return POPULAR;
      });

    return this.universePromise;
  }

  async searchSymbols(search: string): Promise<PartialSymbolInfo[]> {
    const q = search.trim().toUpperCase();
    if (!q) return POPULAR;
    // Instant local match, then enrich with the full universe once available.
    const universe = this.universe ?? (await this.loadUniverse());
    return universe.filter((s) => s.ticker.includes(q)).slice(0, 50);
  }

  async getHistoryKLineData(
    symbol: SymbolInfo,
    period: TerminalPeriod,
    _from: number,
    to: number,
  ): Promise<KLineData[]> {
    const interval = periodToInterval(period);
    const url = new URL(`${REST}/klines`);
    url.searchParams.set("symbol", symbol.ticker);
    url.searchParams.set("interval", interval);
    url.searchParams.set("endTime", String(to));
    url.searchParams.set("limit", "1000");

    const res = await fetch(url.toString());
    if (!res.ok) return [];

    const data: unknown[][] = await res.json();
    return data.map((k) => ({
      timestamp: k[0] as number,
      open: parseFloat(k[1] as string),
      high: parseFloat(k[2] as string),
      low: parseFloat(k[3] as string),
      close: parseFloat(k[4] as string),
      volume: parseFloat(k[5] as string),
      turnover: parseFloat(k[7] as string),
    }));
  }

  subscribe(
    symbol: SymbolInfo,
    period: TerminalPeriod,
    callback: (data: KLineData) => void,
  ): void {
    const interval = periodToInterval(period);
    const stream = `${symbol.ticker.toLowerCase()}@kline_${interval}`;

    const existing = this.streams.get(stream);
    if (existing) {
      existing.callbacks.add(callback);
      return;
    }

    const callbacks = new Set<(data: KLineData) => void>([callback]);
    const ws = new WebSocket(`${WS}/${stream}`);
    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.e !== "kline") return;
      const k = msg.k;
      const bar: KLineData = {
        timestamp: k.t,
        open: parseFloat(k.o),
        high: parseFloat(k.h),
        low: parseFloat(k.l),
        close: parseFloat(k.c),
        volume: parseFloat(k.v),
        turnover: parseFloat(k.q),
      };
      callbacks.forEach((cb) => cb(bar));
    };
    // Intentional closes (StrictMode remount / symbol switch) surface as errors.
    ws.onerror = () => {};
    this.streams.set(stream, { ws, callbacks });
  }

  unsubscribe(symbol: SymbolInfo, period: TerminalPeriod): void {
    const interval = periodToInterval(period);
    const stream = `${symbol.ticker.toLowerCase()}@kline_${interval}`;
    const entry = this.streams.get(stream);
    if (!entry) return;
    // The Datafeed contract gives no callback to unsubscribe a single consumer,
    // so tearing down a stream closes it for all of its subscribers.
    entry.ws.onmessage = null;
    entry.ws.close();
    this.streams.delete(stream);
  }

  subscribeDepth(
    symbol: SymbolInfo,
    callback: (depth: DepthSnapshot) => void,
  ): () => void {
    // Partial-book stream: a full top-20 snapshot every 100ms (no merge needed).
    const ws = new WebSocket(`${WS}/${symbol.ticker.toLowerCase()}@depth20@100ms`);
    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data) as {
        bids?: [string, string][];
        asks?: [string, string][];
      };
      if (!msg.bids || !msg.asks) return;
      const map = (l: [string, string]): DepthLevel => [parseFloat(l[0]), parseFloat(l[1])];
      callback({ bids: msg.bids.map(map), asks: msg.asks.map(map) });
    };
    ws.onerror = () => {};
    return () => {
      ws.onmessage = null;
      ws.close();
    };
  }
}
