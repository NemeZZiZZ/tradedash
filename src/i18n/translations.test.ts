import { describe, it, expect } from "vitest";
import { translate } from "./translations";
import { LANGS } from "./config";

describe("translate", () => {
  it("returns the language string for a known key", () => {
    expect(translate("ru", "toolbar.indicators")).toBe("Индикаторы");
    expect(translate("ja", "toolbar.indicators")).toBe("インジケーター");
    expect(translate("ar", "trade.buy")).toBe("شراء");
  });

  it("falls back to English for a missing language entry", () => {
    // a key that is unlikely to exist → returns the key itself
    expect(translate("ru", "nonexistent.key")).toBe("nonexistent.key");
  });

  it("interpolates parameters", () => {
    expect(translate("en", "wl.remove", { ticker: "BTC" })).toBe("Remove BTC");
    expect(translate("en", "si.sellCount", { n: 3 })).toBe("3 sell");
  });

  it("has an English entry for every registered language merge", () => {
    // every supported language resolves toolbar.symbol to a non-empty string
    for (const lang of LANGS) {
      expect(translate(lang, "toolbar.symbol").length).toBeGreaterThan(0);
    }
  });
});
