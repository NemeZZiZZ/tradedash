import type {
  DataSource,
  DepthLevel,
  DepthSnapshot,
  KLineData,
  PartialSymbolInfo,
  SymbolInfo,
  TerminalPeriod,
} from "./types";

/**
 * Offline synthetic source — deterministic random-walk candles plus a live
 * tick generator. Demonstrates the registry's ability to host more than one
 * source and provides a fully offline fallback (prefixed with "SIM:").
 */
const SYMBOLS: PartialSymbolInfo[] = [
  { ticker: "SIM:TREND", name: "Simulated Uptrend", pricePrecision: 2, volumePrecision: 2 },
  { ticker: "SIM:RANGE", name: "Simulated Range", pricePrecision: 2, volumePrecision: 2 },
  { ticker: "SIM:VOLATILE", name: "Simulated Volatile", pricePrecision: 2, volumePrecision: 2 },
];

function periodMs(period: TerminalPeriod): number {
  const unit: Record<string, number> = {
    minute: 60_000,
    hour: 3_600_000,
    day: 86_400_000,
    week: 604_800_000,
    month: 2_592_000_000,
  };
  return (unit[period.type] ?? 86_400_000) * period.span;
}

function seedFor(ticker: string): { base: number; drift: number; vol: number } {
  switch (ticker) {
    case "SIM:TREND":
      return { base: 100, drift: 0.0008, vol: 0.012 };
    case "SIM:VOLATILE":
      return { base: 500, drift: 0, vol: 0.05 };
    default:
      return { base: 250, drift: 0, vol: 0.018 };
  }
}

export class SyntheticDataSource implements DataSource {
  readonly id = "synthetic";
  readonly label = "Simulated";

  private timers = new Map<string, ReturnType<typeof setInterval>>();
  private last = new Map<string, KLineData>();

  async searchSymbols(search: string): Promise<PartialSymbolInfo[]> {
    const q = search.trim().toUpperCase();
    return q ? SYMBOLS.filter((s) => s.ticker.includes(q)) : SYMBOLS;
  }

  async getHistoryKLineData(
    symbol: SymbolInfo,
    period: TerminalPeriod,
    _from: number,
    to: number,
  ): Promise<KLineData[]> {
    const step = periodMs(period);
    const { base, drift, vol } = seedFor(symbol.ticker);
    const count = 800;
    const out: KLineData[] = [];
    let price = base;

    const startTs = to - count * step;
    for (let i = 0; i < count; i++) {
      const timestamp = startTs + i * step;
      const open = price;
      const shock = (Math.random() - 0.5) * 2 * vol;
      const close = Math.max(0.01, open * (1 + drift + shock));
      const high = Math.max(open, close) * (1 + Math.random() * vol * 0.6);
      const low = Math.min(open, close) * (1 - Math.random() * vol * 0.6);
      const volume = 500 + Math.random() * 5000;
      out.push({ timestamp, open, high, low, close, volume, turnover: volume * close });
      price = close;
    }
    this.last.set(symbol.ticker, out[out.length - 1]);
    return out;
  }

  subscribe(
    symbol: SymbolInfo,
    period: TerminalPeriod,
    callback: (data: KLineData) => void,
  ): void {
    this.unsubscribe(symbol);
    const step = periodMs(period);
    const { vol } = seedFor(symbol.ticker);

    const timer = setInterval(() => {
      const prev = this.last.get(symbol.ticker);
      if (!prev) return;
      const now = Date.now();
      const barStart = Math.floor(now / step) * step;
      const isNewBar = barStart > prev.timestamp;
      const shock = (Math.random() - 0.5) * 2 * vol * 0.3;
      const close = Math.max(0.01, prev.close * (1 + shock));
      const bar: KLineData = isNewBar
        ? {
            timestamp: barStart,
            open: prev.close,
            high: Math.max(prev.close, close),
            low: Math.min(prev.close, close),
            close,
            volume: 100 + Math.random() * 500,
            turnover: 0,
          }
        : {
            ...prev,
            close,
            high: Math.max(prev.high, close),
            low: Math.min(prev.low, close),
            volume: (prev.volume ?? 0) + Math.random() * 50,
          };
      this.last.set(symbol.ticker, bar);
      callback(bar);
    }, 1000);

    this.timers.set(symbol.ticker, timer);
  }

  unsubscribe(symbol: SymbolInfo): void {
    const timer = this.timers.get(symbol.ticker);
    if (timer) {
      clearInterval(timer);
      this.timers.delete(symbol.ticker);
    }
  }

  subscribeDepth(
    symbol: SymbolInfo,
    callback: (depth: DepthSnapshot) => void,
  ): () => void {
    const tick = () => {
      const mid = this.last.get(symbol.ticker)?.close ?? 100;
      const step = mid * 0.0004;
      const bids: DepthLevel[] = [];
      const asks: DepthLevel[] = [];
      let bp = mid;
      let ap = mid;
      for (let i = 0; i < 20; i++) {
        bp -= step * (0.5 + Math.random());
        ap += step * (0.5 + Math.random());
        const size = () => Number((Math.random() * 8 + 0.4).toFixed(3));
        bids.push([Number(bp.toFixed(2)), size()]);
        asks.push([Number(ap.toFixed(2)), size()]);
      }
      callback({ bids, asks });
    };
    tick();
    const t = setInterval(tick, 500);
    return () => clearInterval(t);
  }
}
