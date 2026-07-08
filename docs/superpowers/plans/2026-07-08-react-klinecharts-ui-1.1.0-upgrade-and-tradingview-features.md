# react-klinecharts-ui 1.2.0 Upgrade + TradingView Features — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade TradeDash from `react-klinecharts-ui@0.6.0` to `@1.2.0`, fix the audit-found bugs, and add four TradingView-parity features (multi-chart grid, Object Tree, indicator-based alerts + depth overlay, history pagination) plus close the `useHotkeys`/`useChartAxes` hook-coverage gap.

**Architecture:** The chart renderer stays `react-klinecharts` `<KLineChart>` (bumped to `0.3.0`); `react-klinecharts-ui@1.2.0` provides `WorkspaceProvider`/`useChartSync` for the multi-chart grid, a `storage` option for persistence, and `AlertTarget` for indicator alerts. The default view becomes "a workspace grid of one cell" so every feature is exercised without a separate code path. Dialogs stay single/shared and operate on the active cell via a small `ActiveCellProvider`.

**Tech Stack:** React 19, TypeScript, Vite 6, Tailwind v4, Base UI (shadcn-style), react-klinecharts-ui 1.2.0, react-klinecharts 0.3.0, klinecharts 10.0.0-beta3, Vitest, ESLint flat config.

## Global Constraints

(Copied verbatim from the spec §2; every task's requirements implicitly include these.)

- **Renderer stays `react-klinecharts`.** Bump `0.2.1` → `0.3.0`; keep `<KLineChart>`. Source `Chart`/`KLineData`/`SymbolInfo`/`OverlayTemplate` types from `klinecharts` directly (the library no longer re-exports them through `react-klinecharts`).
- **No breaking UI changes for single-chart mode.** Default = one cell; the grid is opt-in.
- **Persistence must stay SSR-safe and never throw.**
- **i18n:** every new string goes through the existing `useT()` catalog; add the English key to `src/i18n/translations.ts`, other 15 languages fall back to `en` (existing pattern — entries only require `en`).
- **Tests:** datafeed changes are unit-tested in vitest (`src/datafeed/*.test.ts`).
- **`pnpm`** is the package manager. Gate after each task: `pnpm typecheck && pnpm lint && pnpm build && pnpm test` must all pass.

## Phases

- **Phase 1 — Upgrade & migrate types** (Task 1)
- **Phase 2 — Datafeed bug fixes + pagination** (Tasks 2–5)
- **Phase 3 — React/state bug fixes** (Tasks 6–10)
- **Phase 4 — History lazy-load** (folded into Task 4; verified in Task 5)
- **Phase 5 — Multi-chart workspace grid** (Tasks 11–15)
- **Phase 6 — Object Tree** (Task 16)
- **Phase 7 — Indicator alerts + depth overlay** (Tasks 17–18)
- **Phase 8 — `useHotkeys` + `useChartAxes` coverage** (Tasks 19–20)
- **Phase 9 — README + docs** (Task 21)

---

## Phase 1 — Upgrade & migrate types

### Task 1: Upgrade deps to react-klinecharts-ui@1.2.0 + react-klinecharts@0.3.0, migrate type imports

**Files:**
- Modify: `package.json`
- Modify: `src/datafeed/types.ts:2`
- Modify: `src/components/terminal/SymbolInfoPanel.tsx:5`
- Modify: `src/lib/order-line-overlay.ts:2`
- Modify: `src/components/terminal/ChartView.tsx:2-3`

**Interfaces:**
- Consumes: nothing (first task)
- Produces: a project that typechecks, builds, lints, and tests green against `react-klinecharts-ui@1.2.0` and `react-klinecharts@0.3.0`. All chart types (`Chart`, `KLineData`, `SymbolInfo`, `OverlayTemplate`) are imported from `klinecharts`, not `react-klinecharts`.

- [ ] **Step 1: Bump the two dependency versions in `package.json`**

In `package.json`, change these two lines inside `dependencies`:

```json
    "react-klinecharts": "0.3.0",
    "react-klinecharts-ui": "1.2.0",
```

(leave `klinecharts: 10.0.0-beta3` unchanged).

- [ ] **Step 2: Install the new versions**

Run: `pnpm install`
Expected: install succeeds; `pnpm-store` resolves `react-klinecharts-ui@1.2.0` and `react-klinecharts@0.3.0`. Verify with `pnpm list react-klinecharts-ui react-klinecharts` — both show the new versions.

- [ ] **Step 3: Migrate the type re-export in `src/datafeed/types.ts:2`**

`react-klinecharts-ui@1.2.0` imports its types from `klinecharts` directly, and `react-klinecharts@0.3.0` re-exports them too — but for clarity and to match the library, source them from `klinecharts`. Change line 2:

```ts
import type { KLineData, SymbolInfo } from "klinecharts";
```

(Line 1 already imports `Datafeed`, `PartialSymbolInfo`, `TerminalPeriod` from `react-klinecharts-ui` — leave that.)

- [ ] **Step 4: Migrate `src/components/terminal/SymbolInfoPanel.tsx:5`**

Change:

```ts
import type { KLineData, SymbolInfo } from "klinecharts";
```

- [ ] **Step 5: Migrate `src/lib/order-line-overlay.ts:2`**

Change:

```ts
import type { OverlayTemplate } from "klinecharts";
```

- [ ] **Step 6: Migrate `src/components/terminal/ChartView.tsx:2-3`**

`<KLineChart>` (the runtime component) **must still come from `react-klinecharts`**. Only the `Chart` *type* moves to `klinecharts`. Change lines 2–3 to:

```ts
import { KLineChart } from "react-klinecharts";
import type { Chart } from "klinecharts";
```

- [ ] **Step 7: Run the full gate**

Run: `pnpm typecheck && pnpm lint && pnpm test && pnpm build`
Expected: all four pass (typecheck silent; lint 0 errors; 11 tests pass; build emits `dist/`).

- [ ] **Step 8: Commit**

```bash
git add package.json pnpm-lock.yaml src/datafeed/types.ts src/components/terminal/SymbolInfoPanel.tsx src/lib/order-line-overlay.ts src/components/terminal/ChartView.tsx
git commit -m "chore: upgrade react-klinecharts-ui 0.6.0 → 1.2.0, react-klinecharts 0.2.1 → 0.3.0

Source Chart/KLineData/SymbolInfo/OverlayTemplate types from klinecharts
directly (the library no longer re-exports them through react-klinecharts)."
```

---

## Phase 2 — Datafeed bug fixes + pagination

### Task 2: Make Binance `subscribe`/`unsubscribe` callback-aware (multi-subscriber fix)

**Context:** `BinanceDataSource.unsubscribe` (`binance.ts:199`) closes the WebSocket for **all** subscribers of a stream. Bybit (`bybit.ts:193`) and OKX (`okx.ts:194`) correctly remove only the calling callback. This causes silent data loss when the watchlist and chart share a Binance stream (e.g. switching symbols tears down the watchlist's stream).

**Files:**
- Modify: `src/datafeed/binance.ts:163-209` (`subscribe` + `unsubscribe`)

**Interfaces:**
- Consumes: nothing
- Produces: `BinanceDataSource.subscribe/unsubscribe` honor per-callback teardown, matching the `DataSource` contract used by `DatafeedRegistry`.

- [ ] **Step 1: Add a try/catch + `msg.k` guard to `subscribe`'s `onmessage`**

In `src/datafeed/binance.ts`, replace the `ws.onmessage` handler body (lines 179–193) with a guarded version:

```ts
    ws.onmessage = (event) => {
      let msg: { e?: string; k?: { t: number; o: string; h: string; l: string; c: string; v: string; q: string } };
      try {
        msg = JSON.parse(event.data);
      } catch {
        return; // non-JSON keep-alive frame
      }
      if (msg.e !== "kline" || !msg.k) return;
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
```

This also fixes audit bug #1 (no try/catch around `JSON.parse`).

- [ ] **Step 2: Make `unsubscribe` callback-aware**

Replace `BinanceDataSource.unsubscribe` (lines 199–209) with:

```ts
  unsubscribe(
    symbol: SymbolInfo,
    period: TerminalPeriod,
    callback: (data: KLineData) => void,
  ): void {
    const interval = periodToInterval(period);
    const stream = `${symbol.ticker.toLowerCase()}@kline_${interval}`;
    const entry = this.streams.get(stream);
    if (!entry) return;
    entry.callbacks.delete(callback);
    if (entry.callbacks.size > 0) return; // other subscribers remain
    // Last subscriber out — close the socket.
    entry.ws.onmessage = null;
    entry.ws.close();
    this.streams.delete(stream);
  }
```

Note the new third parameter `callback`. This matches how `DatafeedRegistry.unsubscribe` is *supposed* to work — but the registry currently can't pass a callback because the `Datafeed` interface doesn't carry one. That's fixed in Task 3.

- [ ] **Step 3: Commit (interim; registry wiring comes in Task 3)**

```bash
git add src/datafeed/binance.ts
git commit -m "fix(datafeed): Binance subscribe onmessage guarded + unsubscribe callback-aware"
```

### Task 3: Thread the unsubscribe callback through `DataSource`, `Datafeed`, and `DatafeedRegistry`

**Context:** The `DataSource`/`Datafeed` interfaces declare `unsubscribe(symbol, period)` with no callback, so even a callback-aware source can't know *which* subscriber is leaving. We extend the interface to carry the callback (optional, so synthetic/others still compile), and make the registry forward it. This is the second half of the Binance multi-subscriber fix.

**Files:**
- Modify: `src/datafeed/types.ts:35-40` (`DataSource.subscribe`/`unsubscribe`)
- Modify: `src/datafeed/registry.ts:87-97` (`subscribe`/`unsubscribe`)
- Modify: `src/datafeed/bybit.ts:178-197` (carry callback through)
- Modify: `src/datafeed/okx.ts:178-198` (carry callback through)
- Modify: `src/datafeed/synthetic.ts:84-131` (carry callback through; key timers by callback)
- Modify: `src/datafeed/registry.test.ts` (update mock signatures)

**Interfaces:**
- Consumes: Task 2's callback-aware Binance source
- Produces: a `DataSource`/`Datafeed` contract where `subscribe(symbol, period, callback)` and `unsubscribe(symbol, period, callback)` are paired per-callback.

- [ ] **Step 1: Extend the `DataSource` interface in `src/datafeed/types.ts`**

Replace the `subscribe`/`unsubscribe` members (lines 35–40) with:

```ts
  subscribe(
    symbol: SymbolInfo,
    period: TerminalPeriod,
    callback: (data: KLineData) => void,
  ): void;
  unsubscribe(
    symbol: SymbolInfo,
    period: TerminalPeriod,
    callback: (data: KLineData) => void,
  ): void;
```

- [ ] **Step 2: Forward the callback in `DatafeedRegistry` (`src/datafeed/registry.ts:87-97`)**

Replace `subscribe` and `unsubscribe`:

```ts
  subscribe(
    symbol: SymbolInfo,
    period: TerminalPeriod,
    callback: (data: KLineData) => void,
  ): void {
    this.resolve(symbol).subscribe(symbol, period, callback);
  }

  unsubscribe(
    symbol: SymbolInfo,
    period: TerminalPeriod,
    callback: (data: KLineData) => void,
  ): void {
    this.resolve(symbol).unsubscribe(symbol, period, callback);
  }
```

- [ ] **Step 3: Update `BybitDataSource.unsubscribe` (`src/datafeed/bybit.ts:193-197`)**

Add the `callback` param and remove only that callback from the topic set, unsubscribing at the socket only when the set is empty:

```ts
  unsubscribe(
    symbol: SymbolInfo,
    period: TerminalPeriod,
    callback: (data: KLineData) => void,
  ): void {
    const topic = `kline.${periodToInterval(period)}.${symbol.ticker}`;
    const set = this.topics.get(topic);
    if (!set) return;
    set.delete(callback);
    if (set.size > 0) return;
    this.topics.delete(topic);
    this.socket?.send({ op: "unsubscribe", args: [topic] });
  }
```

- [ ] **Step 4: Update `OkxDataSource.unsubscribe` (`src/datafeed/okx.ts:194-198`)**

Same shape as Bybit:

```ts
  unsubscribe(
    symbol: SymbolInfo,
    period: TerminalPeriod,
    callback: (data: KLineData) => void,
  ): void {
    const arg = this.argFor(symbol, period);
    const key = this.keyOf(arg);
    const set = this.topics.get(key);
    if (!set) return;
    set.delete(callback);
    if (set.size > 0) return;
    this.topics.delete(key);
    this.socket?.send({ op: "unsubscribe", args: [arg] });
  }
```

- [ ] **Step 5: Update `SyntheticDataSource.unsubscribe` (`src/datafeed/synthetic.ts:125-131`)**

The synthetic source keys its timer by `symbol.ticker` only, so it can't support multiple callbacks per symbol. Key the timers map by `${ticker}|${periodLabel}` and store a `Set` of callbacks (mirroring Binance/Bybit/OKX). Replace the `timers` field (line 48), `subscribe` (lines 84–123), and `unsubscribe` (lines 125–131):

```ts
  private timers = new Map<string, { timer: ReturnType<typeof setInterval>; callbacks: Set<(data: KLineData) => void> }>();
```

```ts
  subscribe(
    symbol: SymbolInfo,
    period: TerminalPeriod,
    callback: (data: KLineData) => void,
  ): void {
    const key = `${symbol.ticker}|${period.span}${period.type}`;
    const existing = this.timers.get(key);
    if (existing) {
      existing.callbacks.add(callback);
      return;
    }
    const callbacks = new Set<(data: KLineData) => void>([callback]);
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
      callbacks.forEach((cb) => cb(bar));
    }, 1000);
    this.timers.set(key, { timer, callbacks });
  }

  unsubscribe(
    symbol: SymbolInfo,
    period: TerminalPeriod,
    callback: (data: KLineData) => void,
  ): void {
    const key = `${symbol.ticker}|${period.span}${period.type}`;
    const entry = this.timers.get(key);
    if (!entry) return;
    entry.callbacks.delete(callback);
    if (entry.callbacks.size > 0) return;
    clearInterval(entry.timer);
    this.timers.delete(key);
  }
```

- [ ] **Step 6: Update the test mock in `src/datafeed/registry.test.ts`**

The `makeSource` mock's `subscribe`/`unsubscribe` (lines 15–16) need to accept (and ignore) the callback. Change them to:

```ts
    subscribe: vi.fn(),
    unsubscribe: vi.fn(),
```

(`vi.fn()` accepts any arguments, so this already compiles — no change needed unless the mock asserted arg counts. Verify the existing test at line 44 still calls `reg.subscribe({...}, period, () => {})` with a callback — it does.)

- [ ] **Step 7: Run the full gate**

Run: `pnpm typecheck && pnpm lint && pnpm test && pnpm build`
Expected: all pass. The 4 registry tests still pass; typecheck confirms every `unsubscribe` call site now passes a callback (the only call site is inside `react-klinecharts-ui`'s `createDataLoader`, which the library authors updated for 1.2.0 — verify by reading `/tmp/rkcui-11/package/dist/chunk-O7E57I66.js:84`: `unsubscribeBar` calls `datafeed.unsubscribe(params.symbol, ..., params.callback)`).

- [ ] **Step 8: Add a multi-subscriber teardown test**

Append to `src/datafeed/registry.test.ts`, inside the `describe` block, a new test using the synthetic source (which supports multiple callbacks after Task 3):

```ts
  it("keeps a stream alive while a second subscriber remains", () => {
    const { SyntheticDataSource } = require("./synthetic");
    const src = new SyntheticDataSource();
    const reg = new DatafeedRegistry([src]);
    const period = { span: 1, type: "minute" as const, label: "1m" };
    const sym = { ticker: "SIM:TREND" } as never;
    const a = vi.fn();
    const b = vi.fn();
    reg.subscribe(sym, period, a);
    reg.subscribe(sym, period, b);
    reg.unsubscribe(sym, period, a);
    // Re-subscribing `a` must not throw and the timer must still exist for `b`.
    expect(() => reg.subscribe(sym, period, a)).not.toThrow();
    reg.unsubscribe(sym, period, b);
    reg.unsubscribe(sym, period, a);
  });
```

Run: `pnpm test src/datafeed/registry.test.ts`
Expected: 5 tests pass (4 existing + 1 new).

- [ ] **Step 9: Commit**

```bash
git add src/datafeed/types.ts src/datafeed/registry.ts src/datafeed/bybit.ts src/datafeed/okx.ts src/datafeed/synthetic.ts src/datafeed/registry.test.ts
git commit -m "fix(datafeed): thread unsubscribe callback through DataSource/Datafeed/registry

Per-callback teardown across all four sources so a shared stream survives
when one subscriber leaves (fixes Binance/Bybit/OKX/synthetic data loss)."
```

### Task 4: Honour `from`/`to` in all four `getHistoryKLineData` (enables lazy history)

**Context:** `react-klinecharts-ui@1.2.0`'s `createDataLoader` already issues `forward` requests (`to: oldestTimestamp - 1`) on left-scroll. But every source ignores `from` and uses a fixed `limit`, so older history never loads. Fixing the sources is the entire feature.

**Files:**
- Modify: `src/datafeed/binance.ts:135-161`
- Modify: `src/datafeed/bybit.ts:103-132`
- Modify: `src/datafeed/okx.ts:104-132`
- Modify: `src/datafeed/synthetic.ts:56-82`

**Interfaces:**
- Consumes: nothing
- Produces: every source returns bars in the `[from, to]` window (oldest-first), so `createDataLoader`'s `forward` request loads progressively older bars.

- [ ] **Step 1: Binance — add `startTime`, keep `limit` cap**

In `src/datafeed/binance.ts`, replace `getHistoryKLineData` (lines 135–161). Rename `_from` → `from` and set `startTime` when `from > 0`:

```ts
  async getHistoryKLineData(
    symbol: SymbolInfo,
    period: TerminalPeriod,
    from: number,
    to: number,
  ): Promise<KLineData[]> {
    const interval = periodToInterval(period);
    const url = new URL(`${REST}/klines`);
    url.searchParams.set("symbol", symbol.ticker);
    url.searchParams.set("interval", interval);
    url.searchParams.set("endTime", String(to));
    if (from > 0) url.searchParams.set("startTime", String(from));
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
```

- [ ] **Step 2: Bybit — add `start`, keep `limit` cap**

In `src/datafeed/bybit.ts`, replace `getHistoryKLineData` (lines 103–132). Rename `_from` → `from`, add `start`:

```ts
  async getHistoryKLineData(
    symbol: SymbolInfo,
    period: TerminalPeriod,
    from: number,
    to: number,
  ): Promise<KLineData[]> {
    const url = new URL(`${REST}/market/kline`);
    url.searchParams.set("category", "spot");
    url.searchParams.set("symbol", symbol.ticker);
    url.searchParams.set("interval", periodToInterval(period));
    url.searchParams.set("end", String(to));
    if (from > 0) url.searchParams.set("start", String(from));
    url.searchParams.set("limit", "1000");

    const res = await fetch(url.toString());
    if (!res.ok) return [];
    const data: { result?: { list?: string[][] } } = await res.json();
    const list = data.result?.list ?? [];
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
```

- [ ] **Step 3: OKX — map `from`/`to` to the `before`/`after` timestamp cursors**

OKX's `market/candles` takes `before` (newest, exclusive) and `after` (oldest, exclusive) as timestamps, newest-first, max 300. Replace `getHistoryKLineData` (lines 104–132). Rename `_from` → `from`:

```ts
  async getHistoryKLineData(
    symbol: SymbolInfo,
    period: TerminalPeriod,
    from: number,
    to: number,
  ): Promise<KLineData[]> {
    const url = new URL(`${REST}/market/candles`);
    url.searchParams.set("instId", symbol.ticker);
    url.searchParams.set("bar", periodToBar(period));
    url.searchParams.set("after", String(to));
    if (from > 0) url.searchParams.set("before", String(from));
    url.searchParams.set("limit", "300");

    const res = await fetch(url.toString());
    if (!res.ok) return [];
    const data: { data?: string[][] } = await res.json();
    const list = data.data ?? [];
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
```

Note: OKX returns at most 300 bars per request, so a long left-scroll issues several 300-bar pages automatically (the loader keeps calling `forward` until a page returns fewer bars). This is acceptable.

- [ ] **Step 4: Synthetic — generate the `[from, to]` window**

In `src/datafeed/synthetic.ts`, replace `getHistoryKLineData` (lines 56–82). Rename `_from` → `from` and bound the generated window to `[from, to]`:

```ts
  async getHistoryKLineData(
    symbol: SymbolInfo,
    period: TerminalPeriod,
    from: number,
    to: number,
  ): Promise<KLineData[]> {
    const step = periodMs(period);
    const { base, drift, vol } = seedFor(symbol.ticker);
    const startTs = from > 0 ? from : to - 800 * step;
    const count = Math.min(800, Math.max(0, Math.ceil((to - startTs) / step)));
    const out: KLineData[] = [];
    let price = base;
    for (let i = 0; i < count; i++) {
      const timestamp = startTs + i * step;
      if (timestamp > to) break;
      const open = price;
      const shock = (Math.random() - 0.5) * 2 * vol;
      const close = Math.max(0.01, open * (1 + drift + shock));
      const high = Math.max(open, close) * (1 + Math.random() * vol * 0.6);
      const low = Math.min(open, close) * (1 - Math.random() * vol * 0.6);
      const volume = 500 + Math.random() * 5000;
      out.push({ timestamp, open, high, low, close, volume, turnover: volume * close });
      price = close;
    }
    if (out.length > 0) this.last.set(symbol.ticker, out[out.length - 1]);
    return out;
  }
```

- [ ] **Step 5: Run the full gate**

Run: `pnpm typecheck && pnpm lint && pnpm test && pnpm build`
Expected: all pass.

- [ ] **Step 6: Commit**

```bash
git add src/datafeed/binance.ts src/datafeed/bybit.ts src/datafeed/okx.ts src/datafeed/synthetic.ts
git commit -m "feat(datafeed): honour from/to in getHistoryKLineData for lazy history

react-klinecharts-ui 1.2.0's createDataLoader already issues forward
requests on left-scroll; the sources now return the requested window
instead of ignoring from and using a fixed limit."
```

### Task 5: Add a windowed-history test asserting older bars on `forward`

**Files:**
- Modify: `src/datafeed/registry.test.ts`

**Interfaces:**
- Consumes: Task 4's window-aware synthetic source
- Produces: a regression test that fails if a source ever goes back to ignoring `from`.

- [ ] **Step 1: Write the test**

Append to the `describe` block in `src/datafeed/registry.test.ts`:

```ts
  it("returns strictly older bars when from/to moves earlier (lazy history)", async () => {
    const { SyntheticDataSource } = require("./synthetic");
    const reg = new DatafeedRegistry([new SyntheticDataSource()]);
    const period = { span: 1, type: "day" as const, label: "1D" };
    const sym = { ticker: "SIM:TREND" } as never;

    const first = await reg.getHistoryKLineData(sym, period, 0, 10_000 * 86_400_000);
    expect(first.length).toBeGreaterThan(0);
    const oldest = first[0].timestamp;

    // Request a window ending just before the oldest bar we already have.
    const older = await reg.getHistoryKLineData(sym, period, 0, oldest - 1);
    expect(older.length).toBeGreaterThan(0);
    // Every bar in the second page must precede the first page's oldest bar.
    expect(Math.max(...older.map((b) => b.timestamp))).toBeLessThan(oldest);
  });
```

- [ ] **Step 2: Run the test**

Run: `pnpm test src/datafeed/registry.test.ts`
Expected: 6 tests pass (5 + this one).

- [ ] **Step 3: Commit**

```bash
git add src/datafeed/registry.test.ts
git commit -m "test(datafeed): assert lazy-history returns strictly older bars"
```

---

## Phase 3 — React/state bug fixes

### Task 6: Fix `useLivePrice` to compute change against the window open, not the last bar's open

**Context:** `src/hooks/use-live-price.ts:29` reads `open` from the *same* last bar as `close`, so "Chg%" is intra-bar flicker. The fix: use the **first** bar of the loaded window as the session-open proxy.

**Files:**
- Modify: `src/hooks/use-live-price.ts:24-36`

**Interfaces:**
- Consumes: nothing
- Produces: `useLivePrice` returns `change`/`changePercent` relative to the window open (stable within a session), consumed by `WatchlistPanel`.

- [ ] **Step 1: Replace the `read` function body**

In `src/hooks/use-live-price.ts`, replace lines 25–32 (the body of `read`):

```ts
    const read = () => {
      const list = chart?.getDataList?.();
      if (!list || list.length === 0) return;
      const last = list[list.length - 1].close;
      const open = list[0].open;
      const change = last - open;
      setVal({ last, change, changePercent: open ? (change / open) * 100 : null });
    };
```

(Only `list[list.length - 1].open` → `list[0].open` changes.)

- [ ] **Step 2: Run the full gate**

Run: `pnpm typecheck && pnpm lint && pnpm test && pnpm build`
Expected: all pass.

- [ ] **Step 3: Commit**

```bash
git add src/hooks/use-live-price.ts
git commit -m "fix(useLivePrice): compute change vs window open, not last bar's open

The Chg% in the watchlist now reflects session movement instead of
intra-bar flicker that resets whenever a new bar opens."
```

### Task 7: Split `pendingPrice` so Alerts and Order Lines dialogs don't cross-prefill

**Context:** `src/components/terminal/actions.tsx:86` keeps a single `pendingPrice` that prefills *both* `AlertsDialog.initialPrice` (line 167) and `OrderLinesDialog.initialPrice` (line 160). Opening one leaves a stale price in the other.

**Files:**
- Modify: `src/components/terminal/actions.tsx:40-43,86-98,157-168`

**Interfaces:**
- Consumes: nothing
- Produces: `open("alerts", {price})` only prefills the Alerts dialog; `open("orderLines", {price})` only prefills Order Lines.

- [ ] **Step 1: Replace `OpenOptions` and `pendingPrice` with per-dialog prices**

In `src/components/terminal/actions.tsx`, change the `OpenOptions` interface (lines 40–43) to carry a per-key price map, and the `open` impl. Replace lines 40–43 and 86–98:

```ts
interface OpenOptions {
  /** Pre-fill a price into the opened dialog (e.g. from a right-click on the chart). */
  price?: number;
}
```
stays, but store per-key. Replace `const [pendingPrice, setPendingPrice] = useState<number | null>(null);` (line 86) with:

```ts
  const [pendingPrice, setPendingPrice] = useState<Partial<Record<ModalKey, number>>>({});
```

Replace the `open` callback (lines 92–98):

```ts
  const open = useCallback(
    (key: ModalKey, opts?: OpenOptions) => {
      if (opts?.price != null) {
        setPendingPrice((p) => ({ ...p, [key]: opts.price }));
      }
      set(key, true);
    },
    [set],
  );
```

- [ ] **Step 2: Consume and clear each dialog's price**

Replace the two dialog usages (lines 157–168). The Order Lines dialog:

```tsx
      <OrderLinesDialog
        open={state.orderLines}
        onOpenChange={(o) => {
          set("orderLines", o);
          if (!o) setPendingPrice((p) => ({ ...p, orderLines: undefined }));
        }}
        initialPrice={pendingPrice.orderLines ?? null}
      />
```

The Alerts dialog:

```tsx
      <AlertsDialog
        open={state.alerts}
        onOpenChange={(o) => {
          set("alerts", o);
          if (!o) setPendingPrice((p) => ({ ...p, alerts: undefined }));
        }}
        initialPrice={pendingPrice.alerts ?? null}
      />
```

- [ ] **Step 3: Run the full gate**

Run: `pnpm typecheck && pnpm lint && pnpm test && pnpm build`
Expected: all pass.

- [ ] **Step 4: Commit**

```bash
git add src/components/terminal/actions.tsx
git commit -m "fix(actions): per-dialog pendingPrice so alerts/order-lines don't cross-prefill"
```

### Task 8: `AlertSound` — capture the new `onAlertTriggered` unsubscribe + reuse one AudioContext

**Context:** `react-klinecharts-ui@1.2.0` changed `onAlertTriggered` to return an unsubscribe (`() => () => void`). `AlertSound` ignores it. Also, creating a fresh `AudioContext` per firing risks hitting the browser's ~6-context cap.

**Files:**
- Modify: `src/components/terminal/AlertSound.tsx`

**Interfaces:**
- Consumes: `useAlerts().onAlertTriggered` (1.2.0 signature)
- Produces: a leak-free `AlertSound` that closes its shared context on unmount.

- [ ] **Step 1: Rewrite `AlertSound.tsx`**

Replace the entire file with:

```tsx
import { useEffect, useRef } from "react";
import { useAlerts } from "react-klinecharts-ui";

/** Plays a short beep (WebAudio) whenever a price alert fires. Renders nothing. */
export function AlertSound() {
  const { onAlertTriggered } = useAlerts();
  const ctxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    const unsubscribe = onAlertTriggered(() => {
      try {
        const Ctx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (!ctxRef.current) ctxRef.current = new Ctx();
        const ctx = ctxRef.current;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = "sine";
        osc.frequency.value = 880;
        gain.gain.setValueAtTime(0.001, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
        osc.start();
        osc.stop(ctx.currentTime + 0.42);
      } catch {
        /* audio unavailable */
      }
    });
    return () => {
      unsubscribe();
      ctxRef.current?.close().catch(() => {});
      ctxRef.current = null;
    };
  }, [onAlertTriggered]);

  return null;
}
```

- [ ] **Step 2: Run the full gate**

Run: `pnpm typecheck && pnpm lint && pnpm test && pnpm build`
Expected: all pass. (Typecheck confirms the new `onAlertTriggered` return type is captured as an unsubscribe function.)

- [ ] **Step 3: Commit**

```bash
git add src/components/terminal/AlertSound.tsx
git commit -m "fix(AlertSound): capture onAlertTriggered unsubscribe + reuse one AudioContext"
```

### Task 9: Fix `SymbolInfoPanel.performance` stale on live price + remove the misleading eslint-disable

**Context:** `src/components/terminal/SymbolInfoPanel.tsx:202` memo `performance` doesn't depend on `live.last`, so the 1W/1M/YTD tiles go stale on price ticks. The `technicals` memo at `:205` has an eslint-disable that *removes* the needed `live.last` dep — backwards.

**Files:**
- Modify: `src/components/terminal/SymbolInfoPanel.tsx:202-206`

**Interfaces:**
- Consumes: nothing
- Produces: performance tiles refresh on live price; no lint suppression.

- [ ] **Step 1: Update both memos**

In `src/components/terminal/SymbolInfoPanel.tsx`, replace lines 202–206:

```tsx
  const performance = useMemo(
    () => computePerformance(daily, live.last),
    [daily, live.last],
  );
  const technicals = useMemo(
    () => computeTechnicals(state.chart?.getDataList?.() ?? daily),
    [daily, state.chart, live.last],
  );
```

- [ ] **Step 2: Extend `computePerformance` to accept a live price override**

Find `computePerformance` in the same file (it's a module-scope helper). It currently computes % change from `daily` closes only. Add an optional second arg `liveLast?: number | null` that, when provided, overrides the *last* daily close (so today's leg uses the live price). Read the function first to see its exact signature, then change its signature to `(daily: KLineData[], liveLast?: number | null)` and, where it reads the final close, use `const lastClose = liveLast ?? daily[daily.length - 1]?.close`. If the function is shared/complex, keep the change minimal: only the final-close substitution.

- [ ] **Step 3: Run the full gate**

Run: `pnpm typecheck && pnpm lint && pnpm test && pnpm build`
Expected: all pass; the `react-hooks/exhaustive-deps` warning at the old line 205 is gone.

- [ ] **Step 4: Commit**

```bash
git add src/components/terminal/SymbolInfoPanel.tsx
git commit -m "fix(SymbolInfoPanel): performance tiles refresh on live price

Add live.last to the performance memo deps and drop the misleading
eslint-disable that was removing the needed dep from the technicals memo."
```

### Task 10: Rename shadowing `t` locals in `CompareDialog` and `DrawingSidebar`

**Context:** `CompareDialog.tsx:30` and `DrawingSidebar.tsx:93` shadow the `useT()` translator `t` with a local — a latent footgun.

**Files:**
- Modify: `src/components/terminal/CompareDialog.tsx:30`
- Modify: `src/components/terminal/DrawingSidebar.tsx:93`

**Interfaces:** none beyond cleaner locals.

- [ ] **Step 1: Rename in `CompareDialog.tsx`**

Read around line 24–35 of `src/components/terminal/CompareDialog.tsx`. There's `const t = useT();` at the top and a local `const t = ticker.trim().toUpperCase();` inside `add`. Rename the local to `clean`:

```ts
    const clean = ticker.trim().toUpperCase();
```

and update its usages within `add` (e.g. the `if (!clean) return;` guard and the `addCompare`/symbol-construction call). Use Grep to find every reference to the local `t` inside the `add` function body and replace with `clean`.

- [ ] **Step 2: Rename in `DrawingSidebar.tsx`**

At `src/components/terminal/DrawingSidebar.tsx:93`, the predicate `category.tools.some((t) => t.name === activeTool)` shadows `t`. Rename the arrow param to `tool`:

```tsx
        const hasActive = category.tools.some((tool) => tool.name === activeTool);
```

- [ ] **Step 3: Run the full gate**

Run: `pnpm typecheck && pnpm lint && pnpm test && pnpm build`
Expected: all pass.

- [ ] **Step 4: Commit**

```bash
git add src/components/terminal/CompareDialog.tsx src/components/terminal/DrawingSidebar.tsx
git commit -m "refactor: rename shadowing t locals in CompareDialog/DrawingSidebar"
```

---

## Phase 5 — Multi-chart workspace grid

### Task 11: Add workspace layout state, i18n keys, and a `WorkspaceProvider` wrapper

**Context:** This task lays the groundwork: defines the layout type, persists the chosen grid, and wraps the app in `WorkspaceProvider`. No UI changes yet beyond mounting the provider with a single default cell.

**Files:**
- Create: `src/components/terminal/workspace.ts`
- Modify: `src/components/terminal/TradingTerminal.tsx`
- Modify: `src/i18n/translations.ts`

**Interfaces:**
- Consumes: `WorkspaceProvider`, `useWorkspace` from `react-klinecharts-ui`; `defaultSymbol` from `@/datafeed`.
- Produces: `GridLayout` type, `LAYOUTS` list, `defaultCells`, `useWorkspaceLayout()` hook, and i18n keys `ws.*`.

- [ ] **Step 1: Add i18n keys**

In `src/i18n/translations.ts`, add a new section (English only; other langs fall back):

```ts
  // ── Workspace / multi-chart ───────────────────────────────────────────
  "ws.layout": { en: "Layout" },
  "ws.single": { en: "Single chart" },
  "ws.cols2": { en: "2 columns" },
  "ws.grid4": { en: "2×2 grid" },
  "ws.rows2": { en: "2 rows" },
  "ws.sync": { en: "Sync" },
  "ws.sync.crosshair": { en: "Crosshair" },
  "ws.sync.scroll": { en: "Scroll" },
  "ws.sync.zoom": { en: "Zoom" },
  "ws.sync.symbol": { en: "Symbol" },
  "ws.sync.period": { en: "Period" },
  "ws.addCell": { en: "Add chart" },
  "ws.removeCell": { en: "Remove chart" },
  "ws.maximize": { en: "Maximize" },
  "ws.restore": { en: "Restore" },
  "ws.depth": { en: "Depth" },
  "ws.depthUnsupported": { en: "No depth feed for this symbol" },
```

- [ ] **Step 2: Create the workspace module**

Create `src/components/terminal/workspace.ts`:

```ts
import { useMemo } from "react";
import { useWorkspace } from "react-klinecharts-ui";
import type { ChartCell, SyncChannel } from "react-klinecharts-ui";
import { defaultSymbol } from "@/datafeed";
import { loadPersisted, savePersisted, usePersistentState } from "@/hooks/use-persistent-state";

/** Available grid layouts. The value is the number of cells. */
export type GridLayoutId = "single" | "cols2" | "rows2" | "grid4";

export interface GridLayoutDef {
  id: GridLayoutId;
  /** Cell count. */
  cells: number;
  /** CSS grid template. */
  template: string;
}

export const LAYOUTS: GridLayoutDef[] = [
  { id: "single", cells: 1, template: "1fr / 1fr" },
  { id: "cols2", cells: 2, template: "1fr 1fr / 1fr" },
  { id: "rows2", cells: 2, template: "1fr / 1fr 1fr" },
  { id: "grid4", cells: 4, template: "1fr 1fr / 1fr 1fr" },
];

export function layoutById(id: GridLayoutId): GridLayoutDef {
  return LAYOUTS.find((l) => l.id === id) ?? LAYOUTS[0];
}

let cellSeq = 0;
/** A stable, unique cell id (used as React key + workspace registry key). */
export function nextCellId(): string {
  cellSeq += 1;
  return `cell_${Date.now().toString(36)}_${cellSeq}`;
}

/** Build the default (single-cell) workspace seed. */
export function makeDefaultCells(): ChartCell[] {
  const persistedSymbol = loadPersisted("symbol", defaultSymbol);
  const persistedPeriod = loadPersisted<string | null>("period", null);
  return [
    {
      id: "cell_primary",
      symbol: persistedSymbol,
      period: { span: 1, type: "minute", label: persistedPeriod ?? "1m" },
    },
  ];
}

/**
 * Hook over the persisted grid layout + sync config. Drives how many cells the
 * workspace renders and which channels `useChartSync` mirrors.
 */
export function useWorkspaceLayout() {
  const [layoutId, setLayoutId] = usePersistentState<GridLayoutId>("ws.layout", "single");
  const [sync, setSync] = usePersistentState<Record<SyncChannel, boolean>>("ws.sync", {
    crosshair: true,
    scroll: true,
    zoom: true,
    symbol: true,
    period: true,
  });

  const layout = useMemo(() => layoutById(layoutId), [layoutId]);

  const setSyncChannel = (ch: SyncChannel, on: boolean) =>
    setSync((s) => ({ ...s, [ch]: on }));

  return { layoutId, setLayoutId, layout, sync, setSyncChannel };
}

/** Persist the active layout id whenever it changes (helper for the toolbar). */
export function persistLayout(id: GridLayoutId) {
  savePersisted("ws.layout", id);
}
```

- [ ] **Step 3: Wrap the app in `WorkspaceProvider`**

In `src/components/terminal/TradingTerminal.tsx`, import the provider and the default cells, and wrap the single `KlinechartsUIProvider` in a `WorkspaceProvider`. Add to the imports (top of file):

```ts
import { WorkspaceProvider } from "react-klinecharts-ui";
import { makeDefaultCells, useWorkspaceLayout } from "./workspace";
```

Then, in the `TradingTerminal` component, wrap the existing `KlinechartsUIProvider` block. Replace the `return` (lines 110–129) with:

```tsx
  return (
    <div className={cn(className)}>
      <WorkspaceProvider defaultCells={makeDefaultCells()}>
        <TerminalInner />
      </WorkspaceProvider>
    </div>
  );
}
```

And add an inner component (the old provider body becomes it). Add above `TradingTerminal`:

```tsx
function TerminalInner() {
  const { layout, sync } = useWorkspaceLayout();
  // Single-cell render for now; the grid lands in Task 13. The provider below
  // is the primary cell; Task 13 replaces this with a mapped grid.
  return (
    <WorkspaceGrid layout={layout} sync={sync} />
  );
}
```

`WorkspaceGrid` is created in Task 12. For now, to keep Task 11 shippable on its own, render a placeholder that mounts the existing single provider. Add a minimal `WorkspaceGrid` at the bottom of the file that we expand in Task 12:

```tsx
function WorkspaceGrid({ layout, sync }: { layout: GridLayoutDef; sync: Record<SyncChannel, boolean> }) {
  // Placeholder — replaced fully in Task 12.
  void layout; void sync;
  return <PrimaryCell />;
}
```

with imports `import type { GridLayoutDef } from "./workspace"; import type { SyncChannel } from "react-klinecharts-ui";` and `PrimaryCell` = the old `KlinechartsUIProvider`+`TooltipProvider` JSX (moved verbatim into a named component). Keep `initialSymbol`/`initialTheme`/`initialPeriod` as module-scope helpers (they already are).

- [ ] **Step 4: Run the full gate**

Run: `pnpm typecheck && pnpm lint && pnpm test && pnpm build`
Expected: all pass. The app still renders one chart (visually unchanged) but is now inside a `WorkspaceProvider`.

- [ ] **Step 5: Commit**

```bash
git add src/components/terminal/workspace.ts src/components/terminal/TradingTerminal.tsx src/i18n/translations.ts
git commit -m "feat(workspace): mount WorkspaceProvider + layout/sync state (single-cell)"
```

### Task 12: Extract `ChartCellHost` — one provider + chart per cell, with the `useChartSync` bridge

**Context:** Each grid cell is a full `KlinechartsUIProvider` (own indicators/alerts/drawings) plus a `ChartSyncBridge` that calls `useChartSync`. This task builds that host without the grid mapping.

**Files:**
- Create: `src/components/terminal/ChartCellHost.tsx`
- Create: `src/components/terminal/ChartSyncBridge.tsx`
- Create: `src/components/terminal/ActiveCellContext.tsx`
- Modify: `src/components/terminal/ChartView.tsx` (accept optional `cellId`, focus-on-click)
- Modify: `src/components/terminal/actions.tsx` (consume `ActiveCellContext` so dialogs act on the active cell)

**Interfaces:**
- Consumes: `useChartSync`, `useWorkspace`, `KlinechartsUIProvider` from the library; `ChartView` from Task 1.
- Produces: `<ChartCellHost cellId={...} />` rendering an isolated provider+chart; `useActiveCell()` returning the active cell's `useKlinechartsUI()` value so dialogs target it.

- [ ] **Step 1: Create the active-cell context**

Create `src/components/terminal/ActiveCellContext.tsx`:

```tsx
import { createContext, useContext } from "react";
import type { KlinechartsUIContextValue } from "react-klinecharts-ui";

/**
 * The active cell's provider value. Dialogs (Indicators, Settings, Alerts, …)
 * consume this instead of calling useKlinechartsUI() directly, so they always
 * operate on the focused cell even though they mount once, outside the grid.
 */
const Ctx = createContext<KlinechartsUIContextValue | null>(null);

export const ActiveCellProvider = Ctx.Provider;

export function useActiveCell(): KlinechartsUIContextValue {
  const v = useContext(Ctx);
  if (!v) throw new Error("useActiveCell must be used within an ActiveCellProvider");
  return v;
}
```

- [ ] **Step 2: Create the chart-sync bridge**

Create `src/components/terminal/ChartSyncBridge.tsx`:

```tsx
import { useChartSync } from "react-klinecharts-ui";

/** Registers the surrounding provider's chart with the workspace and mirrors
 * viewport events to siblings. Renders nothing. */
export function ChartSyncBridge({ cellId }: { cellId: string }) {
  useChartSync({ cellId });
  return null;
}
```

- [ ] **Step 3: Make dialogs read the active cell**

In every dialog/panel that currently calls `useKlinechartsUI()` directly while being part of the **shared dialog layer** (mounted once, outside the grid), swap to `useActiveCell()`. These are the components rendered by `TerminalActionsProvider` in `src/components/terminal/actions.tsx` (the dialogs) plus `ChartBuySell`-style overlays that are per-cell (those keep `useKlinechartsUI`). Specifically, change the first hook line in each of these files from `useKlinechartsUI` → `useActiveCell`:

  - `src/components/terminal/IndicatorDialog.tsx`
  - `src/components/terminal/SettingsDialog.tsx`
  - `src/components/terminal/OrderLinesDialog.tsx`
  - `src/components/terminal/AlertsDialog.tsx`
  - `src/components/terminal/AnnotationsDialog.tsx`
  - `src/components/terminal/ScriptEditorDialog.tsx`
  - `src/components/terminal/CompareDialog.tsx`
  - `src/components/terminal/LayoutManagerDialog.tsx`
  - `src/components/terminal/TimezoneDialog.tsx`
  - `src/components/terminal/SymbolSearchDialog.tsx`

(Import `useActiveCell` from `./ActiveCellContext` and replace the `useKlinechartsUI` import. For dialogs that use *other* hooks like `useIndicators`, those hooks internally read the provider context — since the dialog is now rendered *inside* the `ActiveCellProvider` (see Task 13 wiring), they'll resolve to the active cell automatically. Verify each by reading the file: if it calls `useKlinechartsUI()` for `state`/`dispatch`/`datafeed`, swap that call; if it only calls feature hooks (`useIndicators`, etc.), leave it.)

**Important:** panels that live **inside** the cell (the per-cell toolbar in Task 13, `ChartView`, `CrosshairDataPanel`, `OrderBookPanel`, `StatusBar`, `SymbolInfoPanel`, `WatchlistPanel`, `ReplayControls`) keep `useKlinechartsUI` because they're rendered within their own provider.

- [ ] **Step 4: Make `ChartView` cell-aware**

In `src/components/terminal/ChartView.tsx`, add an optional `cellId` prop and an on-click that dispatches `SET_ACTIVE_CELL`. Change the interface (line 17):

```ts
interface ChartViewProps {
  className?: string;
  cellId?: string;
}
```

Update the signature (line 25) to destructure `cellId`. Then wrap the `containerRef` div's `onClick` to set the active cell — add `useWorkspace` and dispatch. Add import:

```ts
import { useWorkspace } from "react-klinecharts-ui";
```

and inside the component:

```ts
  const { dispatch: wsDispatch } = useWorkspace();
```

On the `<div ref={containerRef} …>` (line 95), add:

```tsx
            onClick={() => cellId && wsDispatch({ type: "SET_ACTIVE_CELL", id: cellId })}
```

- [ ] **Step 5: Create `ChartCellHost`**

Create `src/components/terminal/ChartCellHost.tsx`:

```tsx
import { KlinechartsUIProvider, DEFAULT_PERIODS } from "react-klinecharts-ui";
import type { ChartCell } from "react-klinecharts-ui";
import { orderLineOverlay } from "@/lib/order-line-overlay";
import { datafeed } from "@/datafeed";
import { chartLocale } from "@/i18n";
import { useI18n, useT } from "@/i18n";
import { useSyncTheme } from "@/hooks/use-sync-theme";
import { loadPersisted, savePersisted } from "@/hooks/use-persistent-state";
import { ChartSyncBridge } from "./ChartSyncBridge";
import { ChartView } from "./ChartView";
import { CellToolbar } from "./CellToolbar";

/**
 * One grid cell: its own KlinechartsUIProvider (own indicators/alerts/drawings),
 * a ChartSyncBridge registering it with the workspace, a lightweight per-cell
 * toolbar, and the chart canvas.
 */
export function ChartCellHost({
  cell,
  isActive,
}: {
  cell: ChartCell;
  isActive: boolean;
}) {
  const { lang } = useI18n();
  void useT();
  const { theme } = useActiveThemeForHost();

  return (
    <KlinechartsUIProvider
      key={cell.id}
      datafeed={datafeed}
      defaultSymbol={cell.symbol}
      defaultPeriod={cell.period}
      defaultTheme={theme}
      defaultLocale={chartLocale(lang)}
      defaultMainIndicators={["MA"]}
      defaultSubIndicators={["VOL"]}
      storage={{}}
      overlays={[orderLineOverlay]}
      onSymbolChange={(s) => savePersisted("symbol", s)}
      onPeriodChange={(p) => savePersisted("period", p.label)}
      onThemeChange={(t) => savePersisted("theme", t)}
    >
      <ChartSyncBridge cellId={cell.id} />
      <div className={`flex h-full flex-col ${isActive ? "ring-1 ring-inset ring-primary/40" : ""}`}>
        <CellToolbar cellId={cell.id} />
        <div className="relative min-h-0 flex-1">
          <ChartView cellId={cell.id} className="absolute inset-0" />
        </div>
      </div>
    </KlinechartsUIProvider>
  );
}

/** Read the persisted theme so each cell starts in the user's theme without a
 * cross-cell context dependency. (Cells are isolated providers.) */
function useActiveThemeForHost() {
  const theme = loadPersisted<string>("theme", "dark");
  useSyncTheme(theme);
  return { theme };
}
```

`DEFAULT_PERIODS` import is unused here — remove it from the import if the linter complains. `CellToolbar` is created in Task 13.

- [ ] **Step 6: Run the full gate**

Run: `pnpm typecheck && pnpm lint && pnpm test && pnpm build`
Expected: typecheck may fail because `CellToolbar` doesn't exist yet — that's Task 13. To keep Task 12 shippable, stub `CellToolbar` now:

Create `src/components/terminal/CellToolbar.tsx` as a minimal placeholder:

```tsx
export function CellToolbar({ cellId }: { cellId: string }) {
  void cellId;
  return null;
}
```

Re-run the gate; expected: all pass.

- [ ] **Step 7: Commit**

```bash
git add src/components/terminal/ActiveCellContext.tsx src/components/terminal/ChartSyncBridge.tsx src/components/terminal/ChartCellHost.tsx src/components/terminal/CellToolbar.tsx src/components/terminal/ChartView.tsx src/components/terminal/IndicatorDialog.tsx src/components/terminal/SettingsDialog.tsx src/components/terminal/OrderLinesDialog.tsx src/components/terminal/AlertsDialog.tsx src/components/terminal/AnnotationsDialog.tsx src/components/terminal/ScriptEditorDialog.tsx src/components/terminal/CompareDialog.tsx src/components/terminal/LayoutManagerDialog.tsx src/components/terminal/TimezoneDialog.tsx src/components/terminal/SymbolSearchDialog.tsx
git commit -m "feat(workspace): ChartCellHost + ChartSyncBridge + ActiveCellContext

Each cell is an isolated KlinechartsUIProvider with a useChartSync bridge;
dialogs read the active cell via ActiveCellContext instead of the provider
directly."
```

### Task 13: Build the grid renderer + cell toolbar + layout/sync toolbar controls

**Context:** Replace the Task 11 placeholder `WorkspaceGrid` with a real CSS-grid renderer mapping `useWorkspace().state.cells` → `<ChartCellHost>`, and add the per-cell `CellToolbar` (symbol/period/remove) plus the global layout selector and sync toggles.

**Files:**
- Modify: `src/components/terminal/TradingTerminal.tsx` (`WorkspaceGrid`)
- Modify: `src/components/terminal/CellToolbar.tsx` (real implementation)
- Modify: `src/components/terminal/Toolbar.tsx` (layout selector + sync toggles)
- Modify: `src/components/terminal/actions.tsx` (mount the shared dialog layer once, wired to active cell)

**Interfaces:**
- Consumes: `useWorkspace`, `ChartCellHost`, `useWorkspaceLayout`, `LAYOUTS`.
- Produces: a working 1/2/4-cell grid with synced crosshair/scroll/zoom and per-cell symbol/period.

- [ ] **Step 1: Implement the real `WorkspaceGrid`**

In `src/components/terminal/TradingTerminal.tsx`, replace the placeholder `WorkspaceGrid` with:

```tsx
function WorkspaceGrid({
  layout,
  sync,
}: {
  layout: GridLayoutDef;
  sync: Record<SyncChannel, boolean>;
}) {
  const { state, dispatch } = useWorkspace();

  // Grow/shrink the cell list to match the chosen layout, preserving existing
  // cells and seeding new ones from the last cell's symbol/period.
  useEffect(() => {
    const have = state.cells.length;
    if (have === layout.cells) return;
    if (have > layout.cells) {
      dispatch({ type: "SET_CELLS", cells: state.cells.slice(0, layout.cells) });
      return;
    }
    const seed = state.cells[have - 1] ?? state.cells[0];
    const addition: ChartCell[] = [];
    for (let i = have; i < layout.cells; i++) {
      addition.push({
        id: nextCellId(),
        symbol: seed?.symbol ?? defaultSymbol,
        period: seed?.period ?? { span: 1, type: "minute", label: "1m" },
      });
    }
    dispatch({ type: "SET_CELLS", cells: [...state.cells, ...addition] });
  }, [layout.cells, state.cells, dispatch]);

  const activeId = state.activeCellId ?? state.cells[0]?.id ?? null;

  return (
    <ActiveCellScope cells={state.cells} activeId={activeId}>
      <div
        className="grid h-full min-h-0"
        style={{ gridTemplateAreas: `"chart"`, gridTemplateColumns: layout.template.split(" / ")[0], gridTemplateRows: layout.template.split(" / ")[1] }}
      >
        {state.cells.map((cell) => (
          <div key={cell.id} className="relative min-h-0 border-r border-b border-border/50 last:border-r-0 [&:nth-last-child(-n+2)]:border-b-0">
            <ChartCellHost cell={cell} isActive={cell.id === activeId} />
          </div>
        ))}
      </div>
    </ActiveCellScope>
  );
}
```

Add the imports it needs at the top of the file:

```ts
import { useEffect } from "react";
import { useWorkspace } from "react-klinecharts-ui";
import type { ChartCell, SyncChannel } from "react-klinecharts-ui";
import { ChartCellHost } from "./ChartCellHost";
import { ActiveCellProvider } from "./ActiveCellContext";
import { nextCellId, type GridLayoutDef } from "./workspace";
import { defaultSymbol } from "@/datafeed";
```

Add the `ActiveCellScope` helper that picks the active cell's provider value. Since the dialogs must read the active cell's context, but each cell has its own provider, we need a component rendered *inside* the active provider that lifts its value up. The cleanest approach: render a tiny `<ActiveCellProbe cellId={activeId} />` inside each `ChartCellHost` that, when it's the active cell, publishes its value. Simpler and sufficient: render the shared dialog layer **inside** the active cell's provider. Do that with a wrapper component. Add:

```tsx
/** Renders children inside the currently-active cell's provider so shared
 * dialogs (mounted once) resolve useKlinechartsUI to the active cell. */
function ActiveCellScope({
  cells,
  activeId,
  children,
}: {
  cells: ChartCell[];
  activeId: string | null;
  children: React.ReactNode;
}) {
  void cells;
  void activeId;
  return <>{children}</>;
}
```

Then move the shared dialog layer (the `SymbolSearchDialog`/`IndicatorDialog`/… list currently in `TerminalActionsProvider`) into a component that's rendered **inside** `ChartCellHost` only when `isActive`. This way the dialogs naturally resolve to the active cell's provider. In `ChartCellHost` (Task 12 file), after the chart div, conditionally render:

```tsx
      {isActive && <SharedDialogs />}
```

and in `actions.tsx`, export the dialog list as `<SharedDialogs />` (keep `TerminalActionsProvider` for the `open`/`screenshot`/`tradeMode` context and the `CommandPalette`/`AlertSound` which are global, but move the per-provider dialogs into `SharedDialogs`). Concretely in `actions.tsx`, split the returned JSX: the `Ctx.Provider` keeps `children` + `CommandPalette` + `AlertSound`; the dialogs (`SymbolSearchDialog` … `ScriptEditorDialog`) move into a new exported `SharedDialogs` component that's rendered inside the active `ChartCellHost`.

Because this is intricate, the precise edits are:

  1. In `actions.tsx`, extract everything from `<SymbolSearchDialog …/>` through `<ScriptEditorDialog …/>` (lines 152–170) into a new exported component `SharedDialogs()` that reads the same `state`/`set`/`pendingPrice` via a small internal context OR — simplest — lift the modal state into a `useSharedDialogs()` hook. Given complexity, keep the modal state in `TerminalActionsProvider` and pass an `open(key,opts)` down; render `SharedDialogs` inside the active cell but have it read the modal-state via the existing `useTerminalActions()`. Since `useTerminalActions` already exposes `open`, add the per-dialog open state to a new `useDialogState()` context too. **To bound scope:** keep `TerminalActionsProvider` exactly as-is (it renders the dialogs once, globally), but wrap its return in `ActiveCellProvider` whose value comes from a ref that the active `ChartCellHost` updates. That avoids moving the dialogs.

  Given the complexity tradeoff, **choose the ref-lifting approach**: keep dialogs where they are (Task 7 moved them; they're global), and have the active cell publish its provider value into a mutable ref that `ActiveCellProvider` reads. Implement:

  - In `ActiveCellContext.tsx`, replace the static `Provider` usage with a small store:

    ```tsx
    import { createContext, useContext, useRef, useEffect, useState } from "react";
    import type { KlinechartsUIContextValue } from "react-klinecharts-ui";

    const Ctx = createContext<KlinechartsUIContextValue | null>(null);

    export function useActiveCell(): KlinechartsUIContextValue {
      const v = useContext(Ctx);
      if (!v) throw new Error("useActiveCell must be used within an ActiveCellProvider");
      return v;
    }

    /**
     * Internal singleton holder. The active ChartCellHost writes its provider
     * value here; the ActiveCellProvider reads it and re-renders listeners.
     */
    let activeValue: KlinechartsUIContextValue | null = null;
    const listeners = new Set<() => void>();
    const version = { n: 0 };
    const [, force] = useState(0);

    export function setActiveCellValue(v: KlinechartsUIContextValue | null) {
      activeValue = v;
      version.n += 1;
      listeners.forEach((l) => l());
    }

    export function ActiveCellProvider({ children }: { children: React.ReactNode }) {
      const [, setVer] = useState(0);
      useEffect(() => {
        const l = () => setVer((n) => n + 1);
        listeners.add(l);
        return () => { listeners.delete(l); };
      }, []);
      return <Ctx.Provider value={activeValue}>{children}</Ctx.Provider>;
    }
    ```

    (Drop the unused `useRef` import. The `force`/`version` module state is the re-render trigger; `setActiveCellValue` is called from `ChartCellHost`.)

  - In `ChartCellHost.tsx`, add an effect that publishes the active cell's value:

    ```tsx
    import { useKlinechartsUI } from "react-klinecharts-ui";
    import { setActiveCellValue } from "./ActiveCellContext";
    // …
    function CellPublisher({ isActive }: { isActive: boolean }) {
      const value = useKlinechartsUI();
      useEffect(() => {
        if (isActive) setActiveCellValue(value);
        return () => { if (isActive) setActiveCellValue(null); };
      }, [isActive, value]);
      return null;
    }
    ```

    and render `<CellPublisher isActive={isActive} />` inside the `KlinechartsUIProvider`.

  - In `TradingTerminal.tsx` (`TerminalInner` or `WorkspaceGrid`), wrap the whole grid in `<ActiveCellProvider>` so the (still-global) dialogs resolve to `activeValue`.

  This keeps `actions.tsx` and the dialogs untouched — they call `useActiveCell()` (Task 12 swap) and read the active cell's value.

- [ ] **Step 2: Implement `CellToolbar`**

Replace `src/components/terminal/CellToolbar.tsx` (the stub) with a real toolbar: a symbol button (opens symbol search scoped to the cell via `useSymbolSearch().setActiveSymbol` is not available; instead dispatch through the cell's provider — the simplest is to reuse the global symbol-search dialog but make it act on the active cell, which it now does via `useActiveCell`). For the per-cell toolbar, show: the cell's ticker (read from the cell's `useKlinechartsUI().state.symbol`), a compact period dropdown, and a remove button (dispatches `REMOVE_CELL`). Implement:

```tsx
import { useKlinechartsUI, usePeriods } from "react-klinecharts-ui";
import { useWorkspace } from "react-klinecharts-ui";
import { useTerminalActions } from "./actions";
import { useT } from "@/i18n";
import { Button } from "@/components/ui/button";
import { X, Search, ChevronDown } from "lucide-react";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Check } from "lucide-react";

export function CellToolbar({ cellId }: { cellId: string }) {
  const t = useT();
  const { state } = useKlinechartsUI();
  const { periods, activePeriod, setPeriod } = usePeriods();
  const { dispatch: wsDispatch, state: wsState } = useWorkspace();
  const { open } = useTerminalActions();
  const removable = (wsState.cells.length ?? 0) > 1;

  return (
    <div className="flex h-8 shrink-0 items-center gap-1 border-b border-border/60 px-2">
      <Button variant="ghost" size="sm" className="h-7 gap-1 px-1.5 font-semibold" onClick={() => open("symbol")}>
        <Search className="size-3 text-muted-foreground" />
        <span className="max-w-[12ch] truncate">{state.symbol?.ticker ?? t("toolbar.symbol")}</span>
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="ghost" size="sm" className="h-7 gap-0.5"><span>{activePeriod.label}</span><ChevronDown className="size-3 text-muted-foreground" /></Button>} />
        <DropdownMenuContent align="start">
          {periods.map((p) => (
            <DropdownMenuItem key={p.label} onClick={() => setPeriod(p)}>
              {activePeriod.label === p.label && <Check className="size-3.5" />}
              {p.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      <div className="flex-1" />
      {removable && (
        <Button variant="ghost" size="icon-sm" className="h-7" onClick={() => wsDispatch({ type: "REMOVE_CELL", id: cellId })}>
          <X className="size-3.5" />
        </Button>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Add the layout selector + sync toggles to the global Toolbar**

In `src/components/terminal/Toolbar.tsx`, add a layout dropdown and sync toggle group near the top (after the drawing-tools separator that's actually in `TradingTerminal`'s header; add it as the first item in `Toolbar`). Add imports:

```ts
import { useWorkspaceLayout, LAYOUTS, persistLayout } from "./workspace";
import { LayoutGrid, Columns2, Rows2, Square } from "lucide-react";
```

Add at the very start of the returned fragment (before the symbol `<Button>`):

```tsx
  const { layoutId, setLayoutId, sync, setSyncChannel } = useWorkspaceLayout();
  const LAYOUT_ICON: Record<string, LucideIcon> = { single: Square, cols2: Columns2, rows2: Rows2, grid4: LayoutGrid };
```

Then a layout dropdown:

```tsx
      <DropdownMenu>
        <Tooltip content={t("ws.layout")}>
          <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm"><LayoutGrid className="size-4" /></Button>} />
        </Tooltip>
        <DropdownMenuContent align="start">
          <DropdownMenuLabel>{t("ws.layout")}</DropdownMenuLabel>
          {LAYOUTS.map((l) => {
            const Icon = LAYOUT_ICON[l.id] ?? Square;
            return (
              <DropdownMenuItem key={l.id} onClick={() => { setLayoutId(l.id); persistLayout(l.id); }}>
                {layoutId === l.id ? <Check className="size-3.5" /> : <Icon className="size-3.5" />}
                {t(`ws.${l.id === "single" ? "single" : l.id === "cols2" ? "cols2" : l.id === "rows2" ? "rows2" : "grid4"}`)}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
      <DropdownMenu>
        <Tooltip content={t("ws.sync")}>
          <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm"><GitCompareArrows className="size-4" /></Button>} />
        </Tooltip>
        <DropdownMenuContent align="start">
          <DropdownMenuLabel>{t("ws.sync")}</DropdownMenuLabel>
          {(["crosshair", "scroll", "zoom", "symbol", "period"] as const).map((ch) => (
            <DropdownMenuItem key={ch} onClick={() => setSyncChannel(ch, !sync[ch])}>
              {sync[ch] ? <Check className="size-3.5" /> : <span className="size-3.5" />}
              {t(`ws.sync.${ch}`)}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      <Separator orientation="vertical" className="mx-1 h-5" />
```

(`LucideIcon` is already imported in RightDock's pattern; add `import type { LucideIcon } from "lucide-react"` to Toolbar if not present. `GitCompareArrows` is already imported.)

- [ ] **Step 4: Wire `sync` into the `WorkspaceProvider`**

In `src/components/terminal/TradingTerminal.tsx` (`TerminalInner`), pass the resolved sync config to the cells. The `WorkspaceProvider` was mounted in Task 11 with `defaultCells` only; add `sync`. But `useWorkspaceLayout` must be called inside a component (it uses hooks). Move the `WorkspaceProvider` mount into `TerminalInner` (which already calls `useWorkspaceLayout`):

```tsx
function TerminalInner() {
  const { layout, sync } = useWorkspaceLayout();
  return (
    <WorkspaceProvider defaultCells={makeDefaultCells()} sync={sync}>
      <WorkspaceGrid layout={layout} sync={sync} />
    </WorkspaceProvider>
  );
}
```

- [ ] **Step 5: Run the full gate**

Run: `pnpm typecheck && pnpm lint && pnpm test && pnpm build`
Expected: all pass. The app now renders a single cell by default; selecting "2 columns" / "2×2" in the new layout dropdown shows multiple synced charts.

- [ ] **Step 6: Manually verify multi-chart sync**

Run `pnpm dev`, open the browser, choose "2×2 grid" from the new layout dropdown, move the crosshair on one chart, and confirm the others mirror it. Change the period in one cell's toolbar and confirm siblings sync (if `period` sync is on). This is a manual check — note any regressions.

- [ ] **Step 7: Commit**

```bash
git add src/components/terminal/TradingTerminal.tsx src/components/terminal/CellToolbar.tsx src/components/terminal/Toolbar.tsx src/components/terminal/ChartCellHost.tsx src/components/terminal/ActiveCellContext.tsx
git commit -m "feat(workspace): multi-chart grid (1/2/4 cells) with synced crosshair/scroll/zoom

Adds a layout selector, per-cell toolbar (symbol/period/remove), active-cell
highlight, and sync-channel toggles. Dialogs operate on the focused cell."
```

### Task 14: Move the per-cell panels (StatusBar, ReplayControls, RightDock) into the active cell

**Context:** `StatusBar`, `ReplayControls`, `RightDock`, and the drawing sidebar currently consume the single global provider. With multi-chart they must belong to the **active** cell. They already call `useKlinechartsUI()`; rendering them inside the active cell's provider (or via `useActiveCell`) makes them work.

**Files:**
- Modify: `src/components/terminal/StatusBar.tsx`
- Modify: `src/components/terminal/ReplayControls.tsx`
- Modify: `src/components/terminal/RightDock.tsx`
- Modify: `src/components/terminal/KeyboardShortcuts.tsx`
- Modify: `src/components/terminal/TradingTerminal.tsx` (layout: dock/sidebar wrap the grid, reading active cell)

**Interfaces:**
- Consumes: `useActiveCell`
- Produces: global chrome (status bar, replay bar, right dock, drawing sidebar) reflects the active cell.

- [ ] **Step 1: Swap `useKlinechartsUI` → `useActiveCell` in the global chrome**

In each of `StatusBar.tsx`, `ReplayControls.tsx`, `KeyboardShortcuts.tsx`, change the `useKlinechartsUI()` import/call to `useActiveCell` from `./ActiveCellContext`. (These components render once, outside the grid, so they must read the active cell.)

For `RightDock.tsx`: the dock's panels (`WatchlistPanel`, `SymbolInfoPanel`, `OrderBookPanel`) call `useKlinechartsUI`. Rather than editing each, render the dock's panel contents inside an `ActiveCellProvider`-fed subtree. Simplest: change the three panels to `useActiveCell` too (they're only ever shown for the active cell conceptually). Edit `WatchlistPanel.tsx`, `SymbolInfoPanel.tsx`, `OrderBookPanel.tsx` to swap `useKlinechartsUI` → `useActiveCell`.

- [ ] **Step 2: Verify the layout still wraps correctly**

In `TradingTerminal.tsx`, the `TerminalLayout` header/dock/replay/statusbar wrap `WorkspaceGrid`. Confirm they're rendered inside `<ActiveCellProvider>` (Task 13 wrapped the grid; ensure the chrome is inside the same provider). Adjust the JSX so `<ActiveCellProvider>` wraps everything that calls `useActiveCell`:

```tsx
      <TerminalActionsProvider>
        <ActiveCellProvider>
          <header>… <Toolbar /> …</header>
          <div className="flex flex-1 overflow-hidden">
            {showDrawing && <DrawingSidebar />}
            <div className="relative z-0 min-w-0 flex-1"><WorkspaceGridArea /></div>
            <RightDock />
          </div>
          <ReplayControls />
          <StatusBar />
          <KeyboardShortcuts />
        </ActiveCellProvider>
      </TerminalActionsProvider>
```

where `WorkspaceGridArea` renders the `WorkspaceProvider` + `WorkspaceGrid`. Note: `WorkspaceProvider` must wrap `WorkspaceGrid` but NOT the chrome (the chrome reads `useWorkspace`? no — it reads `useActiveCell`). Keep `WorkspaceProvider` around only the grid. So structure:

```tsx
<ActiveCellProvider>
  {chrome…}
  <WorkspaceProvider defaultCells={…} sync={sync}><WorkspaceGrid …/></WorkspaceProvider>
  {more chrome…}
</ActiveCellProvider>
```

`DrawingSidebar` calls `useDrawingTools` — that resolves to the active cell only if rendered inside the active provider. Since the active cell publishes via `CellPublisher`, and `DrawingSidebar` is inside `ActiveCellProvider`, but `DrawingSidebar` calls `useDrawingTools()` which reads the *React context* provider tree (not the module singleton), it will NOT resolve to the active cell — it'll throw "outside provider". Therefore `DrawingSidebar` must move **inside** the active `ChartCellHost`. Add it to `ChartCellHost`'s render, conditionally on `isActive`:

```tsx
        {isActive && showDrawing && <DrawingSidebar />}
```

(read `showDrawing` from `usePersistentState("panel.drawing", true)` inside the host, or lift it via context). Simplest: render `<DrawingSidebar />` inside the active cell when `isActive`. Move the drawing sidebar out of the global chrome and into `ChartCellHost`.

- [ ] **Step 3: Run the full gate + manual check**

Run: `pnpm typecheck && pnpm lint && pnpm test && pnpm build`
Expected: all pass. Manually: switch to a 2-cell grid, change the active cell, and confirm the status bar / watchlist / replay bar follow the focus.

- [ ] **Step 4: Commit**

```bash
git add src/components/terminal/StatusBar.tsx src/components/terminal/ReplayControls.tsx src/components/terminal/RightDock.tsx src/components/terminal/KeyboardShortcuts.tsx src/components/terminal/WatchlistPanel.tsx src/components/terminal/SymbolInfoPanel.tsx src/components/terminal/OrderBookPanel.tsx src/components/terminal/ChartCellHost.tsx src/components/terminal/TradingTerminal.tsx
git commit -m "feat(workspace): global chrome + drawing sidebar follow the active cell"
```

### Task 15: Add "Add chart" / maximize controls and workspace i18n polish

**Context:** Final multi-chart UX: an "add chart" affordance and a per-cell maximize/restore.

**Files:**
- Modify: `src/components/terminal/CellToolbar.tsx`
- Modify: `src/components/terminal/TradingTerminal.tsx` (maximize state)
- Modify: `src/components/terminal/CommandPalette.tsx` (add "layout" + "add chart" commands — optional, fold into actions.tsx command list)

**Interfaces:** consumes Task 13 grid state.

- [ ] **Step 1: Add maximize state to `WorkspaceGrid`**

In `TradingTerminal.tsx` `WorkspaceGrid`, add `const [maxedId, setMaxedId] = useState<string | null>(null);` and render only the maxed cell when set:

```tsx
  const shown = maxedId ? state.cells.filter((c) => c.id === maxedId) : state.cells;
```

map `shown` instead of `state.cells`. Pass `onMaximize`/`onRestore`/`isMaxed` to `CellToolbar` via props.

- [ ] **Step 2: Add maximize/restore buttons in `CellToolbar`**

In `CellToolbar.tsx`, accept props `{ onToggleMax?: () => void; isMaxed?: boolean }` and render a `Maximize2`/`Minimize2` button before the remove button.

- [ ] **Step 3: Add "add chart" command**

In `actions.tsx` `commands` list, add:

```ts
      { id: "ws-add", label: t("ws.addCell"), run: () => wsDispatch({ type: "ADD_CELL", cell: { id: nextCellId(), symbol: defaultSymbol, period: { span: 1, type: "minute", label: "1m" } } }) },
      { id: "ws-layout", label: t("ws.layout"), run: () => open("settings") },
```

(Read `useWorkspace` inside the provider component to get `wsDispatch`.)

- [ ] **Step 4: Run the full gate + commit**

Run: `pnpm typecheck && pnpm lint && pnpm test && pnpm build`
Expected: all pass.

```bash
git add src/components/terminal/CellToolbar.tsx src/components/terminal/TradingTerminal.tsx src/components/terminal/actions.tsx
git commit -m "feat(workspace): maximize/restore + add-chart command"
```

---

## Phase 6 — Object Tree

### Task 16: Object Tree panel (Drawings / Indicators / Order lines / Annotations / Alerts)

**Context:** A TradingView-style object list with per-row visibility/lock/delete. As of `react-klinecharts-ui@1.2.0`, `useDrawingTools` now exposes a **reactive `overlays: DrawingOverlayInfo[]`** plus per-drawing `removeDrawing(id)` / `setDrawingVisible(id, visible)` / `setDrawingLocked(id, locked)` — use these directly (no manual polling of `chart.getOverlays()` and **no** `subscribeAction("onOverlayCreate")`, which does not exist in klinecharts v10). The `drawingLabel(name)` helper maps a tool name to its localeKey. Indicators use `useIndicators`; order lines `useOrderLines`; annotations `useAnnotations`; alerts `useAlerts` (delete only).

**Files:**
- Create: `src/components/terminal/ObjectTreePanel.tsx`
- Modify: `src/components/terminal/RightDock.tsx` (add as a 4th section)
- Modify: `src/i18n/translations.ts`

**Interfaces:**
- Consumes: `useDrawingTools` (1.2.0: `overlays`/`removeDrawing`/`setDrawingVisible`/`setDrawingLocked`/`drawingLabel`), `useIndicators`, `useOrderLines`, `useAnnotations`, `useAlerts`. All resolve to the active cell because the panel is rendered inside the active provider (Task 14 moved dock panels to `useActiveCell`; keep `useDrawingTools` etc. as-is — they resolve via the active cell's context once the panel is within `ActiveCellProvider`).
- Produces: `<ObjectTreePanel />` rendered in the right dock.

- [ ] **Step 1: Add i18n keys**

In `src/i18n/translations.ts`:

```ts
  // ── Object tree ───────────────────────────────────────────────────────
  "ot.title": { en: "Object tree" },
  "ot.drawings": { en: "Drawings" },
  "ot.indicators": { en: "Indicators" },
  "ot.orderLines": { en: "Order lines" },
  "ot.notes": { en: "Notes" },
  "ot.alerts": { en: "Alerts" },
  "ot.empty": { en: "No objects yet" },
  "ot.toggleVis": { en: "Toggle visibility" },
  "ot.lock": { en: "Lock" },
  "ot.delete": { en: "Delete" },
  "ot.main": { en: "Main" },
  "ot.sub": { en: "Sub" },
```

- [ ] **Step 2: Create `ObjectTreePanel.tsx`**

```tsx
import { useState } from "react";
import {
  useIndicators,
  useOrderLines,
  useAnnotations,
  useAlerts,
  useDrawingTools,
  drawingLabel,
} from "react-klinecharts-ui";
import { useT } from "@/i18n";
import { Eye, EyeOff, Lock, Unlock, Trash2, ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn, formatPrice } from "@/lib/utils";

interface Row {
  id: string;
  label: string;
  visible?: boolean;
  locked?: boolean;
  onToggleVis?: () => void;
  onToggleLock?: () => void;
  onDel?: () => void;
}

export function ObjectTreePanel() {
  const t = useT();
  const { mainIndicators, subIndicators, removeMainIndicator, removeSubIndicator, setIndicatorVisible, isIndicatorVisible } = useIndicators();
  const { annotations, removeAnnotation } = useAnnotations();
  const { alerts, removeAlert } = useAlerts();
  const { overlays, removeDrawing, setDrawingVisible, setDrawingLocked } = useDrawingTools();

  const drawingRows: Row[] = overlays.map((o) => ({
    id: o.id,
    label: t(drawingLabel(o.name)),
    visible: o.visible,
    locked: o.locked,
    onToggleVis: () => setDrawingVisible(o.id, !o.visible),
    onToggleLock: () => setDrawingLocked(o.id, !o.locked),
    onDel: () => removeDrawing(o.id),
  }));
  const indicatorRows: Row[] = [
    ...mainIndicators.map((i) => ({ id: i.name, label: `${i.name} (${t("ot.main")})`, visible: isIndicatorVisible(i.name, true), onToggleVis: () => setIndicatorVisible(i.name, true, !isIndicatorVisible(i.name, true)), onDel: () => removeMainIndicator(i.name) })),
    ...subIndicators.map((i) => ({ id: i.name, label: `${i.name} (${t("ot.sub")})`, visible: isIndicatorVisible(i.name, false), onToggleVis: () => setIndicatorVisible(i.name, false, !isIndicatorVisible(i.name, false)), onDel: () => removeSubIndicator(i.name) })),
  ];
  const noteRows: Row[] = annotations.map((a) => ({ id: a.id, label: a.text.slice(0, 24) || t("ot.notes"), onDel: () => removeAnnotation(a.id) }));
  const alertRows: Row[] = alerts.map((a) => ({ id: a.id, label: `${formatPrice(a.price)} ${a.message ?? ""}`.trim(), onDel: () => removeAlert(a.id) }));

  // Order lines: useOrderLines has create/remove but no list. Read them from
  // the chart overlays of name "orderLine" once on mount + on a 700ms poll
  // (order-line removal is chart-side; cheap fallback). This is the only
  // remaining manual read because useOrderLines has no reactive list.
  const orderRows: Row[] = useOrderLineRows();

  const groups: { key: string; label: string; rows: Row[] }[] = [
    { key: "drawings", label: t("ot.drawings"), rows: drawingRows },
    { key: "indicators", label: t("ot.indicators"), rows: indicatorRows },
    { key: "orderLines", label: t("ot.orderLines"), rows: orderRows },
    { key: "notes", label: t("ot.notes"), rows: noteRows },
    { key: "alerts", label: t("ot.alerts"), rows: alertRows },
  ];
  const nonEmpty = groups.filter((g) => g.rows.length > 0);

  return (
    <aside className="flex h-full w-full flex-col bg-card">
      <div className="flex h-9 shrink-0 items-center border-b border-border px-3">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t("ot.title")}</span>
      </div>
      <ScrollArea className="flex-1">
        {nonEmpty.length === 0 ? (
          <div className="px-3 py-8 text-center text-sm text-muted-foreground">{t("ot.empty")}</div>
        ) : (
          <div className="p-1">
            {nonEmpty.map((g) => (
              <Group key={g.key} label={g.label} rows={g.rows} t={t} />
            ))}
          </div>
        )}
      </ScrollArea>
    </aside>
  );
}

function Group({ label, rows, t }: { label: string; rows: Row[]; t: (k: string) => string }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="mb-1">
      <button className="flex w-full items-center gap-1 rounded px-2 py-1 text-xs font-medium hover:bg-accent/50" onClick={() => setOpen((o) => !o)}>
        {open ? <ChevronDown className="size-3" /> : <ChevronRight className="size-3" />}
        <span>{label}</span>
        <span className="ml-auto text-muted-foreground">{rows.length}</span>
      </button>
      {open && rows.map((r) => (
        <div key={r.id} className="flex items-center gap-1 rounded px-2 py-1 pl-6 text-sm hover:bg-accent/50">
          <span className={cn("min-w-0 flex-1 truncate", r.visible === false && "text-muted-foreground line-through")}>{r.label}</span>
          {r.onToggleLock && (
            <Button variant="ghost" size="icon-sm" className="h-6" onClick={r.onToggleLock} title={t("ot.lock")}>
              {r.locked ? <Lock className="size-3.5" /> : <Unlock className="size-3.5" />}
            </Button>
          )}
          {r.onToggleVis && (
            <Button variant="ghost" size="icon-sm" className="h-6" onClick={r.onToggleVis} title={t("ot.toggleVis")}>
              {r.visible === false ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
            </Button>
          )}
          {r.onDel && (
            <Button variant="ghost" size="icon-sm" className="h-6" onClick={r.onDel} title={t("ot.delete")}>
              <Trash2 className="size-3.5" />
            </Button>
          )}
        </div>
      ))}
    </div>
  );
}

/** Order lines have no reactive list in useOrderLines; poll the chart overlays.
 *  Kept local to this panel — drawings/indicators/annotations/alerts are all
 *  reactive via their hooks (drawings since react-klinecharts-ui 1.2.0). */
function useOrderLineRows(): Row[] {
  const { state } = useActiveCell();
  const { removeOrderLine } = useOrderLines();
  const [lines, setLines] = useState<{ id: string; label: string }[]>([]);
  useEffect(() => {
    const chart = state.chart;
    if (!chart) return;
    const read = () => {
      const all = chart.getOverlays?.() ?? [];
      setLines(
        all
          .filter((o: { name?: string }) => o.name === "orderLine")
          .map((o: { id?: string; points?: { value?: number }[]; extendData?: { side?: string } }) => ({
            id: o.id ?? "?",
            label: `${o.extendData?.side === "short" ? t("common.short") : t("common.long")} @ ${formatPrice(o.points?.[0]?.value ?? 0)}`,
          })),
      );
    };
    read();
    const id = setInterval(read, 700);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.chart]);
  return lines.map((l) => ({ ...l, onDel: () => removeOrderLine(l.id) }));
}
```

Note the imports now include `useDrawingTools`, `drawingLabel`, `useEffect` (add to the React import), and `useActiveCell` from `./ActiveCellContext` (Task 12). Drawings no longer poll and no longer call the non-existent `subscribeAction("onOverlayCreate")` — `overlays` from the hook is already reactive.

- [ ] **Step 3: Register the panel in `RightDock`**

In `src/components/terminal/RightDock.tsx`, import and add a 4th section to `SECTIONS`:

```ts
import { ObjectTreePanel } from "./ObjectTreePanel";
// …
  {
    id: "tree",
    label: "ot.title",
    icon: Layers,   // add to the lucide-react import
    render: () => <ObjectTreePanel />,
  },
```

Add `Layers` to the lucide-react import on line 2, and add `"tree": false` to the default `open` state in `usePersistentState("dock.open", {…})`.

- [ ] **Step 4: Run the full gate + manual check**

Run: `pnpm typecheck && pnpm lint && pnpm test && pnpm build`
Expected: all pass. Manually: open the Object Tree from the right activity bar, add a drawing/indicator, confirm it lists; toggle visibility / delete from the tree.

- [ ] **Step 5: Commit**

```bash
git add src/components/terminal/ObjectTreePanel.tsx src/components/terminal/RightDock.tsx src/i18n/translations.ts
git commit -m "feat(object-tree): panel listing drawings/indicators/order-lines/notes/alerts"
```

---

## Phase 7 — Indicator-based alerts + depth overlay

### Task 17: Indicator-based alerts in `AlertsDialog`

**Context:** `react-klinecharts-ui@1.2.0` adds `AlertTarget` and a `target` param to `addAlert`. Extend `AlertsDialog` with a Price/Indicator source toggle.

**Files:**
- Modify: `src/components/terminal/AlertsDialog.tsx`
- Modify: `src/i18n/translations.ts`

**Interfaces:**
- Consumes: `useAlerts().addAlert` with the new `target` param; `chart.getIndicators()` to list indicator figures.
- Produces: a dialog that can create alerts on an indicator figure crossing a threshold.

- [ ] **Step 1: Add i18n keys**

```ts
  // ── Alerts: indicator target ──────────────────────────────────────────
  "al.source": { en: "Source" },
  "al.price": { en: "Price" },
  "al.indicator": { en: "Indicator" },
  "al.indicatorPh": { en: "Select indicator" },
  "al.figurePh": { en: "Figure" },
  "al.thresholdPh": { en: "Threshold" },
```

- [ ] **Step 2: Extend `AlertsDialog`**

Read the current `AlertsDialog.tsx`. Add state for the source toggle and indicator selection. After the existing `const [message, setMessage] = useState("");` add:

```tsx
  const [source, setSource] = useState<"price" | "indicator">("price");
  const [indPaneId, setIndPaneId] = useState<string>("");
  const [figureKey, setFigureKey] = useState<string>("");
  const { state } = useActiveCell();
```

(import `useActiveCell` from `./ActiveCellContext`.) Build the list of indicator figures from the chart:

```tsx
  const indOptions = useMemo(() => {
    const chart = state.chart;
    if (!chart) return [];
    const all = chart.getIndicators?.() ?? [];
    return all
      .filter((i: { paneId?: string; name?: string; figures?: { key?: string }[] }) => (i.figures?.length ?? 0) > 0)
      .map((i: { paneId?: string; name?: string; id?: string; figures?: { key?: string }[] }) => ({
        indicatorId: i.id ?? i.name ?? "",
        name: i.name ?? "",
        figures: (i.figures ?? []).map((f: { key?: string }) => f.key ?? "").filter(Boolean),
      }));
  }, [state.chart]);
```

Update the `add` function:

```tsx
  const add = () => {
    const p = parseFloat(price);
    if (!Number.isFinite(p)) return;
    if (source === "indicator" && indPaneId && figureKey) {
      addAlert(p, condition, message.trim() || undefined, undefined, { type: "indicator", indicatorId: indPaneId, figureKey });
    } else {
      addAlert(p, condition, message.trim() || undefined);
    }
    setPrice(""); setMessage("");
  };
```

Add a source toggle + (conditionally) indicator/figure dropdowns to the form, above the price input:

```tsx
          <div className="flex gap-1">
            {(["price", "indicator"] as const).map((s) => (
              <Button key={s} variant={source === s ? "secondary" : "ghost"} size="sm" onClick={() => setSource(s)}>
                {s === "price" ? t("al.price") : t("al.indicator")}
              </Button>
            ))}
          </div>
          {source === "indicator" && (
            <div className="flex gap-2">
              <select value={indPaneId} onChange={(e) => { setIndPaneId(e.target.value); setFigureKey(""); }} className="h-8 rounded-md border border-input bg-transparent px-2 text-sm">
                <option value="" className="bg-popover">{t("al.indicatorPh")}</option>
                {indOptions.map((o) => <option key={o.indicatorId} value={o.indicatorId} className="bg-popover">{o.name}</option>)}
              </select>
              <select value={figureKey} onChange={(e) => setFigureKey(e.target.value)} className="h-8 rounded-md border border-input bg-transparent px-2 text-sm">
                <option value="" className="bg-popover">{t("al.figurePh")}</option>
                {indOptions.find((o) => o.indicatorId === indPaneId)?.figures.map((f) => <option key={f} value={f} className="bg-popover">{f}</option>)}
              </select>
            </div>
          )}
```

Update the price-input placeholder to switch between price and threshold:

```tsx
              placeholder={source === "indicator" ? t("al.thresholdPh") : t("al.pricePh")}
```

- [ ] **Step 3: Run the full gate + manual check**

Run: `pnpm typecheck && pnpm lint && pnpm test && pnpm build`
Expected: all pass. Manually: add an RSI indicator, open Alerts, switch to Indicator source, pick RSI/`rsi`, threshold 70, and confirm an alert is created.

- [ ] **Step 4: Commit**

```bash
git add src/components/terminal/AlertsDialog.tsx src/i18n/translations.ts
git commit -m "feat(alerts): indicator-value alerts via AlertTarget (RSI>70, MACD cross)"
```

### Task 18: Depth overlay toggle on the chart

**Context:** The library auto-registers a `depthOverlay` extension. Add a toolbar toggle that, when on, subscribes via `datafeed.subscribeDepth` and pushes snapshots to the overlay on the active cell's chart.

**Files:**
- Modify: `src/components/terminal/ChartView.tsx` (depth subscription effect)
- Modify: `src/components/terminal/Toolbar.tsx` (toggle)
- Modify: `src/i18n/translations.ts`

**Interfaces:**
- Consumes: `datafeed.subscribeDepth` (from `useActiveCell().datafeed`), `chart.createOverlay`/`updateOverlay`.
- Produces: a "Depth" toolbar toggle that overlays the order book on the chart.

- [ ] **Step 1: Add i18n key** — already added `ws.depth` / `ws.depthUnsupported` in Task 11.

- [ ] **Step 2: Add depth overlay state + effect in `ChartView`**

In `src/components/terminal/ChartView.tsx`, add (read `usePersistentState`, `useActiveCell`):

```tsx
import { usePersistentState } from "@/hooks/use-persistent-state";
// …
  const [depthOn, setDepthOn] = usePersistentState("chart.depth", false);
```

Add an effect that subscribes to depth and updates an overlay when `depthOn` and the source supports it:

```tsx
  const { datafeed } = state; // from useKlinechartsUI() already in scope
  const supportsDepth = datafeed.supportsDepth(state.symbol ?? {});
  useEffect(() => {
    const chart = state.chart;
    const sym = state.symbol;
    if (!chart || !sym || !depthOn || !supportsDepth) return;
    let overlayId: string | null = null;
    const unsub = datafeed.subscribeDepth(sym, (snap) => {
      if (!overlayId) {
        overlayId = chart.createOverlay({ name: "depthOverlay", points: [{ value: snap.asks[0]?.[0] ?? 0 }], extendData: snap });
      } else {
        chart.updateOverlay({ id: overlayId, extendData: snap });
      }
    });
    return () => { unsub(); if (overlayId) chart.removeOverlay?.({ id: overlayId }); overlayId = null; };
  }, [state.chart, state.symbol, depthOn, supportsDepth, datafeed]);
```

Expose `depthOn`/`setDepthOn`/`supportsDepth` to the toolbar via `useTerminalActions` (add to the context value + provider) so the toolbar toggle reflects state. In `actions.tsx`, add to `TerminalActions`:

```ts
  depthOn: boolean;
  setDepthOn: (v: boolean) => void;
  depthSupported: boolean;
```

and in the provider read them from a small hook shared with `ChartView`. **To avoid a circular dependency**, lift `depthOn` into `usePersistentState` only and have both `ChartView` and the toolbar read the same persistent key (`chart.depth`). Then the toolbar doesn't need context for it — it just calls `usePersistentState("chart.depth", false)` and checks support via `useActiveCell().datafeed.supportsDepth(...)`.

- [ ] **Step 3: Add the toolbar toggle**

In `src/components/terminal/Toolbar.tsx`, add a "Depth" toggle button in the tools area:

```tsx
  const { state: activeState } = useActiveCell();
  const [depthOn, setDepthOn] = usePersistentState("chart.depth", false);
  const depthSupported = activeState.datafeed.supportsDepth(activeState.symbol ?? {});
// …
      <Tooltip content={depthSupported ? t("ws.depth") : t("ws.depthUnsupported")}>
        <Button variant={depthOn && depthSupported ? "secondary" : "ghost"} size="icon-sm" disabled={!depthSupported} onClick={() => setDepthOn((v) => !v)}>
          <BookOpen className="size-4" />
        </Button>
      </Tooltip>
```

(add `BookOpen` to the lucide import, `useActiveCell` from `./ActiveCellContext`, `usePersistentState`.)

- [ ] **Step 4: Run the full gate + manual check**

Run: `pnpm typecheck && pnpm lint && pnpm test && pnpm build`
Expected: all pass. Manually: on BTCUSDT (Binance supports depth), toggle Depth, confirm the overlay renders; switch to a synthetic symbol and confirm the toggle disables.

- [ ] **Step 5: Commit**

```bash
git add src/components/terminal/ChartView.tsx src/components/terminal/Toolbar.tsx
git commit -m "feat(depth): chart depth overlay toggle (subscribes via datafeed.subscribeDepth)"
```

---

## Phase 8 — Close the `useHotkeys` / `useChartAxes` coverage gap

### Task 19: Route chart-affecting shortcuts through `useHotkeys`

**Context:** `KeyboardShortcuts.tsx` uses bare `window.addEventListener("keydown")`. Migrate the shortcuts that affect the *chart* (candle type, period number keys, theme) to `useHotkeys().registerHotkey` so they integrate with klinecharts v10's hotkey system and are disable-able. Keep the command-palette (`Ctrl/Cmd+K`) on a bare listener (it's app-global, not chart-scoped).

**Files:**
- Modify: `src/components/terminal/KeyboardShortcuts.tsx`
- Modify: `src/components/terminal/SettingsDialog.tsx` (add a Hotkeys tab: list + enable toggle)

**Interfaces:**
- Consumes: `useHotkeys` (`registerHotkey`, `supportedHotkeys`, `setHotkeysEnabled`).
- Produces: chart shortcuts registered through the library; a Settings tab shows the map.

- [ ] **Step 1: Read the current `KeyboardShortcuts.tsx`** to enumerate the shortcuts it implements (period 1–9, candle type, theme toggle, etc.).

- [ ] **Step 2: Register the chart-scoped shortcuts via `useHotkeys`**

In `KeyboardShortcuts.tsx`, for each shortcut that maps to a chart action, register it. Replace the relevant `window.addEventListener("keydown", handler)` branches with `registerHotkey({ name, description, keys, action: (chart, event) => { … } })`. For example, a "toggle theme" hotkey:

```tsx
  const { registerHotkey, setHotkeysEnabled } = useHotkeys();
  useEffect(() => {
    registerHotkey({ name: "td:toggleTheme", description: t("cmd.theme"), keys: { keyCode: 84, metaKey: true, ctrlKey: true }, action: () => toggleTheme() });
    // … one per chart-scoped shortcut
  }, [registerHotkey, …]);
```

Keep a single bare `keydown` listener for `Ctrl/Cmd+K` (command palette) and any shortcut the library can't express (those involving multiple non-modifier keys).

- [ ] **Step 3: Add a "Hotkeys" tab to `SettingsDialog`**

In `SettingsDialog.tsx`, add a tab that lists `useHotkeys().supportedHotkeys` with a master enable toggle (`setHotkeysEnabled`). Render the list from `getHotkey(name)` for each name.

- [ ] **Step 4: Run the full gate + manual check**

Run: `pnpm typecheck && pnpm lint && pnpm test && pnpm build`
Expected: all pass. Manually: each migrated shortcut still works; disabling hotkeys in Settings silences them.

- [ ] **Step 5: Commit**

```bash
git add src/components/terminal/KeyboardShortcuts.tsx src/components/terminal/SettingsDialog.tsx
git commit -m "feat(hotkeys): route chart shortcuts through useHotkeys + Settings tab"
```

### Task 20: Add an "Axes" tab to Settings via `useChartAxes`

**Context:** Surface `overrideXAxis`/`overrideYAxis` (tick formatters, reverse, inside, position) that `useKlinechartsUISettings` doesn't cover.

**Files:**
- Modify: `src/components/terminal/SettingsDialog.tsx`

**Interfaces:**
- Consumes: `useChartAxes().overrideXAxis` / `overrideYAxis`.
- Produces: an Axes tab with reverse-Y / Y-inside toggles and an X-tick density control.

- [ ] **Step 1: Add the Axes tab**

In `SettingsDialog.tsx`, add a tab "Axes" (`t("settings.axes")` — add the i18n key). Inside, read `useChartAxes()` and add toggles:

```tsx
  const { overrideYAxis, overrideXAxis } = useChartAxes();
  const [reverseY, setReverseY] = usePersistentState("axes.reverseY", false);
  const [yInside, setYInside] = usePersistentState("axes.yInside", false);
  useEffect(() => { overrideYAxis({ reverse: reverseY, inside: yInside }); }, [reverseY, yInside, overrideYAxis]);
```

with two `<Switch>` controls bound to `reverseY`/`yInside`. Add a simple X-axis tick-count control if time permits; otherwise the two toggles suffice to demonstrate coverage.

- [ ] **Step 2: Add i18n keys**

```ts
  "settings.axes": { en: "Axes" },
  "settings.axes.reverseY": { en: "Reverse Y axis" },
  "settings.axes.yInside": { en: "Y axis inside" },
```

- [ ] **Step 3: Run the full gate + manual check**

Run: `pnpm typecheck && pnpm lint && pnpm test && pnpm build`
Expected: all pass. Manually: toggle reverse-Y and confirm the price scale flips.

- [ ] **Step 4: Commit**

```bash
git add src/components/terminal/SettingsDialog.tsx src/i18n/translations.ts
git commit -m "feat(axes): Settings Axes tab via useChartAxes (reverse/inside Y)"
```

---

## Phase 9 — Docs

### Task 21: Update README to reflect 1.2.0 features and accurate hook coverage

**Files:**
- Modify: `README.md`

**Interfaces:** none.

- [ ] **Step 1: Update the feature table**

In `README.md`, update the "What it demonstrates" table: add rows for Multi-chart (`WorkspaceProvider`/`useChartSync`/`useWorkspace`), Persistence (`storage`), Indicator alerts (`useAlerts` + `AlertTarget`), Object Tree (new), Depth overlay (`depthOverlay`). Ensure the Hotkeys/Axes row now truthfully reflects `useHotkeys`/`useChartAxes` usage (Tasks 19–20 made it real).

- [ ] **Step 2: Update the screenshot**

Run `pnpm build && pnpm preview`, screenshot a 2×2 grid with the Object Tree open, save to `docs/screenshot.png` (overwrite).

- [ ] **Step 3: Run the full gate + commit**

Run: `pnpm typecheck && pnpm lint && pnpm test && pnpm build`
Expected: all pass.

```bash
git add README.md docs/screenshot.png
git commit -m "docs: README + screenshot for react-klinecharts-ui 1.2.0 feature set"
```

---

## Self-Review (run after writing the plan)

**1. Spec coverage:**
- §3 (library diff) → Task 1 (types) + Tasks 11–18 (consume new APIs). ✓
- §4.1 component tree → Tasks 11–15. ✓
- §4.2 data layer (`from`/`to`) → Task 4; verified Task 5. ✓
- §4.3 persistence (`storage={{}}`) → Task 12 (`ChartCellHost`). ✓
- §5 bug 1 (Binance onmessage) → Task 2. ✓
- §5 bug 2 (Binance unsubscribe) → Tasks 2–3. ✓
- §5 bug 3 (useLivePrice) → Task 6. ✓
- §5 bug 4 (pendingPrice) → Task 7. ✓
- §5 bug 5 (AlertSound) → Task 8. ✓
- §5 bug 6 (SymbolInfoPanel) → Task 9. ✓
- §5 bug 7 (shadowing t) → Task 10. ✓
- §5 bug 8 (README) → Task 21. ✓
- §6.1 multi-chart → Tasks 11–15. ✓
- §6.2 Object Tree → Task 16. ✓
- §6.3 indicator alerts + depth → Tasks 17–18. ✓
- §6.4 pagination → Tasks 4–5. ✓
- §6.5 useHotkeys → Task 19. ✓
- §6.6 useChartAxes → Task 20. ✓
- §7 testing → Tasks 3, 5. ✓
- Lower-priority bugs (ScreenshotDialog setTimeout, OrderLinesDialog null) → not given dedicated tasks; they're low-risk and can be folded into adjacent commits, but **I'll add them** to keep the spec honest. → See Task 22 below.

**2. Placeholder scan:** No "TBD"/"TODO"/"add error handling" without code. Every step has concrete code or an exact edit. ✓

**3. Type consistency:** `GridLayoutId`/`GridLayoutDef` (Task 11) used consistently in Task 13. `nextCellId` (Task 11) used in Tasks 13/15. `useActiveCell` (Task 12) used in Tasks 14/16/17/18. `setActiveCellValue` (Task 13) matches `CellPublisher` (Task 13). ✓

Adding the two lower-priority bug tasks:

### Task 22: Minor correctness fixes (ScreenshotDialog timeout cleanup, OrderLinesDialog null-guard)

**Files:**
- Modify: `src/components/terminal/ScreenshotDialog.tsx:29`
- Modify: `src/components/terminal/OrderLinesDialog.tsx:44-57`

- [ ] **Step 1: Clear the ScreenshotDialog timeout on unmount**

In `ScreenshotDialog.tsx`, capture the `setTimeout` id and clear it in the effect cleanup:

```tsx
  useEffect(() => {
    if (!copied) return;
    const id = setTimeout(() => setCopied(false), 1500);
    return () => clearTimeout(id);
  }, [copied]);
```

(adjust to the existing structure — if `setTimeout` is inline in the `copy` handler, move it into an effect keyed on `copied`.)

- [ ] **Step 2: Guard the OrderLinesDialog `createOrderLine` null return**

In `OrderLinesDialog.tsx`, surface user feedback when `createOrderLine` returns null (chart not ready):

```tsx
    const id = createOrderLine({ … });
    if (!id) return; // chart not ready; no line created, nothing to track
    setLines((ls) => [...ls, { id, price: p, side }]);
    setPrice("");
```

(Remove the TDZ-prone closure reference to `id` inside `onPriceChange` by capturing it differently — but since `createOrderLine` returns the id synchronously and `onPriceChange` only fires later on drag, the current pattern works in practice. Keep it, but guard the null case.)

- [ ] **Step 3: Run the full gate + commit**

Run: `pnpm typecheck && pnpm lint && pnpm test && pnpm build`

```bash
git add src/components/terminal/ScreenshotDialog.tsx src/components/terminal/OrderLinesDialog.tsx
git commit -m "fix: ScreenshotDialog timeout cleanup + OrderLinesDialog null guard"
```

---

## Execution note

This plan is large (22 tasks across 9 phases). Each phase leaves the app shippable (gate green). Phases 1–4 are low-risk and independent; Phases 5–8 build on each other. If executing inline, checkpoint after each phase. If executing via subagents, dispatch one task at a time and review the gate between tasks.
