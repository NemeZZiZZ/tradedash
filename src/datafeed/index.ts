import { createDatafeed } from "./registry";
import { BinanceDataSource } from "./binance";
import { BybitDataSource } from "./bybit";
import { OkxDataSource } from "./okx";
import { SyntheticDataSource } from "./synthetic";
import type { PartialSymbolInfo } from "./types";

export * from "./types";
export { DatafeedRegistry, createDatafeed } from "./registry";
export { BinanceDataSource } from "./binance";
export { BybitDataSource } from "./bybit";
export { OkxDataSource } from "./okx";
export { SyntheticDataSource } from "./synthetic";

/**
 * Default terminal datafeed. All sources below are CORS-friendly public APIs
 * with native kline WebSockets — no API key and no backend proxy required.
 * Synthetic is the offline fallback. Add or reorder sources to plug in more.
 */
export const datafeed = createDatafeed([
  new BinanceDataSource(),
  new BybitDataSource(),
  new OkxDataSource(),
  new SyntheticDataSource(),
]);

export const defaultSymbol: PartialSymbolInfo = {
  ticker: "BTCUSDT",
  name: "Bitcoin / TetherUS",
  pricePrecision: 2,
  volumePrecision: 5,
  source: "binance",
};
