import { describe, it, expect, vi } from "vitest";
import { DatafeedRegistry } from "./registry";
import type { DataSource, KLineData } from "./types";

function makeSource(id: string, tickers: string[]): DataSource {
  return {
    id,
    label: id.toUpperCase(),
    async searchSymbols() {
      return tickers.map((ticker) => ({ ticker }));
    },
    async getHistoryKLineData() {
      return [{ timestamp: 1, open: 1, high: 1, low: 1, close: 1 }] as KLineData[];
    },
    subscribe: vi.fn(),
    unsubscribe: vi.fn(),
  };
}

describe("DatafeedRegistry", () => {
  it("tags search results with their source and label", async () => {
    const reg = new DatafeedRegistry([makeSource("a", ["X"]), makeSource("b", ["Y"])]);
    const res = await reg.searchSymbols("");
    expect(res).toEqual([
      { ticker: "X", source: "a", exchange: "A" },
      { ticker: "Y", source: "b", exchange: "B" },
    ]);
  });

  it("restricts search to a single source via scope", async () => {
    const reg = new DatafeedRegistry([makeSource("a", ["X"]), makeSource("b", ["Y"])]);
    reg.setSearchScope("b");
    const res = await reg.searchSymbols("");
    expect(res.map((r) => r.ticker)).toEqual(["Y"]);
    reg.setSearchScope(null);
    expect((await reg.searchSymbols("")).length).toBe(2);
  });

  it("routes subscribe to the source owning the symbol", () => {
    const a = makeSource("a", []);
    const b = makeSource("b", []);
    const reg = new DatafeedRegistry([a, b]);
    const period = { span: 1, type: "minute" as const, label: "1m" };
    reg.subscribe({ ticker: "Y", source: "b" } as never, period, () => {});
    expect(b.subscribe).toHaveBeenCalledOnce();
    expect(a.subscribe).not.toHaveBeenCalled();
  });

  it("falls back to the first source for untagged symbols", () => {
    const a = makeSource("a", []);
    const reg = new DatafeedRegistry([a, makeSource("b", [])]);
    const period = { span: 1, type: "minute" as const, label: "1m" };
    reg.unsubscribe({ ticker: "Z" } as never, period);
    expect(a.unsubscribe).toHaveBeenCalledOnce();
  });
});
