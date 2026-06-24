import type { DepthLevel, DepthSnapshot } from "./types";

type RawLevel = [string, string] | string[];

/**
 * Maintains an order book from a snapshot followed by incremental deltas
 * (the model used by Bybit `orderbook.*` and OKX `books`). A size of `0`
 * removes the level. `top(n)` returns the best `n` levels per side.
 */
export class OrderBookState {
  private bids = new Map<number, number>();
  private asks = new Map<number, number>();

  reset() {
    this.bids.clear();
    this.asks.clear();
  }

  applySnapshot(bids: RawLevel[], asks: RawLevel[]) {
    this.reset();
    this.applyDelta(bids, asks);
  }

  applyDelta(bids: RawLevel[] = [], asks: RawLevel[] = []) {
    this.merge(this.bids, bids);
    this.merge(this.asks, asks);
  }

  private merge(side: Map<number, number>, levels: RawLevel[]) {
    for (const lvl of levels) {
      const price = parseFloat(lvl[0]);
      const size = parseFloat(lvl[1]);
      if (!Number.isFinite(price)) continue;
      if (size > 0) side.set(price, size);
      else side.delete(price);
    }
  }

  top(n: number): DepthSnapshot {
    const bids = this.sorted(this.bids, (a, b) => b - a).slice(0, n);
    const asks = this.sorted(this.asks, (a, b) => a - b).slice(0, n);
    return { bids, asks };
  }

  private sorted(
    side: Map<number, number>,
    cmp: (a: number, b: number) => number,
  ): DepthLevel[] {
    return [...side.entries()]
      .sort((a, b) => cmp(a[0], b[0]))
      .map(([price, size]) => [price, size] as DepthLevel);
  }
}
