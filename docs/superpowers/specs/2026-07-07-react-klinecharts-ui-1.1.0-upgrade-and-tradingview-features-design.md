# Upgrade to react-klinecharts-ui 1.1.0 + TradingView feature parity

**Date:** 2026-07-07
**Status:** Design (awaiting approval)
**Scope:** Library upgrade, bug fixes, and four TradingView-parity features

---

## 1. Context & goals

TradeDash is a live demo terminal built on the headless `react-klinecharts-ui`
library. It currently pins `react-klinecharts-ui@0.6.0`. The library shipped a
major release — **`1.1.0`** (the latest; `1.0.0` is an intermediate) — that
adds primitives directly relevant to the user's goals:

- `WorkspaceProvider` + `useChartSync` + `useWorkspace` — a multi-chart grid
  coordinator with crosshair/scroll/zoom/symbol/period mirroring.
- `storage` provider option + `StorageAdapter` — persistence of alerts,
  settings, and the active indicator set to `localStorage` (or a custom
  adapter).
- `AlertTarget` (`price` | `indicator`) on `useAlerts().addAlert` — alerts on
  indicator figure values (RSI > 70, MACD signal crossover).
- `onAlertTriggered` now returns an unsubscribe and supports multiple
  listeners (was last-writer-wins).

The user wants three things, in order of priority:

1. **Upgrade** the app to the new library version.
2. **Audit the code for errors** and fix the real ones.
3. **Maximise TradingView parity** — specifically: multi-chart grid, Object
   Tree, indicator-based alerts + depth overlay, and history pagination /
   lazy-load.

A bonus outcome: achieve **full hook coverage** of the library. Today two
hooks (`useHotkeys`, `useChartAxes`) are entirely unused, yet the README claims
otherwise. The new `useChartSync`/`useWorkspace` hooks will be consumed by the
multi-chart feature.

---

## 2. Constraints

- **Renderer stays `react-klinecharts`.** `1.1.0` re-added `react-klinecharts`
  (`>=0.3.0`) as a peer dependency, so the existing `<KLineChart>` component
  remains the bridge to klinecharts. We bump `react-klinecharts` `0.2.1` →
  `0.3.0` and keep `<KLineChart>` for chart lifecycle. Types are sourced from
  `klinecharts` directly (the library no longer re-exports them through
  `react-klinecharts`).
- **No breaking UI changes for single-chart mode.** The default experience
  remains one chart; the grid is opt-in.
- **Persistence must stay SSR-safe and never throw** (the library already
  guards `localStorage` access; we follow that lead).
- **i18n:** every new string goes through the existing `useT()` catalog and is
  added to the English base; other 15 languages get the English key as a
  fallback (existing pattern).
- **Tests:** datafeed changes are unit-tested (existing vitest harness).

---

## 3. What changed in the library (0.6.0 → 1.1.0)

Verified by diffing `dist/index.d.ts` and the runtime bundles.

### 3.1 Dependency graph
- 0.6.0 imported `registerOverlay`/`registerIndicator`/`registerHotkey`/
  `getHotkey`/`getSupportedHotkeys` and all chart types **from
  `react-klinecharts`**.
- 1.1.0 imports them **directly from `klinecharts`**, and declares
  `react-klinecharts@>=0.3.0` as an explicit peer dependency. The renderer
  (`<KLineChart>`) is still provided by `react-klinecharts`.

### 3.2 New APIs (full list)
| Export | Kind | Purpose |
|---|---|---|
| `WorkspaceProvider` | Component | Top-level coordinator over a grid of `KlinechartsUIProvider`s |
| `useWorkspace` | Hook | Read workspace state (cells, active cell) + dispatch |
| `useChartSync` | Hook | Bridge inside each provider: registers chart + mirrors viewport events |
| `ChartCell`, `WorkspaceState`, `WorkspaceAction`, `SyncChannel`, `SyncConfig` | Types | Grid model |
| `DEFAULT_SYNC_CONFIG` | Const | All sync channels on by default |
| `storage` (provider option), `StorageOptions`, `StorageAdapter`, `StorageNamespace`, `ResolvedStorage` | API | Persistence |
| `DEFAULT_STORAGE_NAMESPACES`, `DEFAULT_STORAGE_KEY_PREFIX` | Consts | `"rkui:"` prefix, alerts/settings/indicators |
| `createDefaultStorage`, `resolveStorage` | Helpers | SSR-safe localStorage + resolver |
| `AlertTarget`, `target` param on `addAlert` | API | Indicator-value alerts |
| `onAlertTriggered` → `() => () => void` | API change | Returns unsubscribe; multiple listeners |

### 3.3 `createDataLoader` now paginates
The 0.6.0 loader fetched a single window. The 1.1.0 loader tracks
`oldestTimestamp` and, on `params.type === "forward"`, requests history with
`to: oldestTimestamp - 1` — i.e. it **already drives lazy-load**. The gap is in
the app's datafeed sources, which ignore `from`.

---

## 4. Architecture

### 4.1 Component tree (target)

```
<App> (I18nProvider)
  <TradingTerminal>
    <WorkspaceProvider defaultCells={[…]} sync={…}>        ← NEW (1.1.0)
      <ChartGrid>                                            ← NEW
        maps cells → <ChartCellHost cellId={c.id} />
          <KlinechartsUIProvider                             ← one per cell
              storage={{}}                                    ← NEW (1.1.0)
              …>
            <ChartSyncBridge cellId={c.id} />                ← NEW (useChartSync)
            <CellToolbar cellId={c.id} />                    ← NEW (per-cell symbol/TF)
            <ChartView cellId={c.id} />                      ← refactored
            <CellOverlays />                                 ← replay/statusbar per cell
          </KlinechartsUIProvider>
      </ChartGrid>
    </WorkspaceProvider>
    <GlobalToolbar />                                         ← layout/sync controls
    <GlobalOverlays />                                        ← dialogs (single shared)
```

Key decisions:

- **Single shared dialog layer.** Dialogs (Indicators, Settings, Alerts, …) are
  expensive and conceptually global. They mount **once**, outside the grid, and
  operate on the **active cell's** provider. The active cell id is read from
  `useWorkspace()`, and a small `ActiveCellProvider` re-exports the active
  cell's `useKlinechartsUI()` value so dialog components are unchanged. This
  keeps the existing dialog code (which calls `useKlinechartsUI()` at its top)
  working without per-cell duplication.
- **Per-cell toolbar (lightweight).** Each cell shows its symbol, period, and a
  compact action row (indicators, drawing toggle, cell menu). The global
  toolbar keeps layout controls (grid 1/2/4/8-up, sync toggles), theme,
  fullscreen, and the command palette trigger.
- **`ChartView` gains an optional `cellId`.** When inside a workspace it
  behaves identically (same `<KLineChart>` + `onReady` + indicator restore),
  but the price-capture context-menu routes the dialog `open()` to the active
  cell. The `cellId` is only needed for the focus/active-cell highlight and
  symbol/period read-back via `useChartSync`.
- **Single-cell mode = grid of one.** Rather than two code paths, the default
  workspace has one cell. This eliminates a branch and means every feature is
  exercised in the default view.

### 4.2 Data layer changes

- **`getHistoryKLineData` honours `from`/`to`.** Each source (Binance, Bybit,
  OKX, synthetic) switches from a fixed `limit` to a windowed query: when
  `from > 0`, query the `[from, to]` window with a page cap (e.g. 1000 bars,
  or the exchange's max). `createDataLoader`'s `forward` requests (`to:
  oldestTimestamp - 1`) then load progressively older bars on left-scroll.
  This is the entirety of the "lazy history" feature — the library and
  klinecharts already issue the requests.
- **Binance `subscribe`/`unsubscribe` become callback-aware** (see §5).

### 4.3 Persistence model

| State | Before | After |
|---|---|---|
| Alerts | in-memory (lost on reload) | `storage={{}}` → `localStorage`, key `rkui:alerts` |
| Chart settings | in-memory | `rkui:settings` |
| Active indicators | in-memory + manual restore in `onReady` | `rkui:indicators` (library hydrates); `onReady` restore kept as fallback for custom indicators |
| Symbol/period/theme | app-level `usePersistentState` (unchanged) | unchanged |
| Drawings / layouts | `useLayoutManager` snapshot keys (unchanged) | unchanged |
| Watchlist / annotations / script | in-memory | in-memory (library roadmap; out of scope here) |

We pass `storage={{}}` to each cell's provider so multi-chart persists
per-cell. The app's existing `usePersistentState` for symbol/period/theme is
retained because those drive the *initial* workspace cells and are read before
the provider mounts.

---

## 5. Bug fixes (from audit)

Concrete, prioritised. All are real findings (file:line verified).

### Datafeed (correctness)
1. **Binance `subscribe` `onmessage` has no try/catch** (`binance.ts:179`).
   Wrap in try/catch and guard `msg.k`, matching Bybit/OKX. A malformed frame
   currently throws inside the WebSocket handler and kills the stream.
2. **Binance `unsubscribe` tears down the stream for ALL subscribers**
   (`binance.ts:199`). Make it remove only the calling `callback` from
   `entry.callbacks`, and close the socket only when the set is empty —
   matching Bybit (`bybit.ts:193`) and OKX (`okx.ts:194`). This fixes silent
   data loss when watchlist + chart share a stream.
3. **`useLivePrice` computes change against the same bar's open**
   (`use-live-price.ts:29`). It reads `open` from the *last* bar, so "Chg%"
   is intra-bar flicker, not session change. Compute against the first bar of
   the loaded window (session open proxy) — consistent with the field name and
   with `SymbolInfoPanel.dayChangePct`.

### React/state correctness
4. **`pendingPrice` shared between Alerts and Order Lines dialogs**
   (`actions.tsx:86,157-168`). Split into `pendingAlertPrice` /
   `pendingOrderLinePrice`, or clear after consumption, so opening one dialog
   doesn't prefill the other with a stale price.
5. **`AlertSound` ignores the new `onAlertTriggered` unsubscribe**
   (`AlertSound.tsx`). `1.1.0` returns an unsubscribe; capture it in the effect
   cleanup to avoid a dangling listener. Also collapse to one shared
   `AudioContext` (browsers cap ~6) instead of one per firing.
6. **`SymbolInfoPanel.performance` memo doesn't depend on `live.last`**
   (`SymbolInfoPanel.tsx:202`). The 1W/1M/YTD tiles go stale on price ticks.
   Add `live.last` to the dep array (and fix the misleading eslint-disable at
   `:205` that *removes* the needed dep).
7. **Variable `t` shadows the translator** (`CompareDialog.tsx:30`,
   `DrawingSidebar.tsx:93`). Rename the locals (`ticker`/`tool`) to avoid
   clobbering `useT()`.

### Documentation
8. **README overstates hook coverage.** `useHotkeys` and `useChartAxes` are
   claimed but unused. We now **actually wire them** (see §6.5/§6.6), making
   the README accurate.

### Lower-priority (apply opportunistically)
- `ScreenshotDialog.copy()` `setTimeout` cleanup (`ScreenshotDialog.tsx:29`).
- `OrderLinesDialog` `id`-before-assignment + `null` handling
  (`OrderLinesDialog.tsx:44`) — guard the `createOrderLine` `null` return and
  surface user feedback.

---

## 6. TradingView-parity features (design)

### 6.1 Multi-chart grid (WorkspaceProvider)
- **Layout selector** in the global toolbar: 1 / 2 (horizontal) / 2×2 / 2×2+
  (4) / 3-column. Persisted via `usePersistentState("workspace.layout", …)`.
- **`ChartGrid`** renders the active layout as a CSS grid of `ChartCellHost`s.
  Cell list lives in `useWorkspace().state.cells`; layout changes dispatch
  `SET_CELLS` (preserve existing cells, add/remove as needed, default new
  cells to the active cell's symbol/period).
- **Per-cell header:** symbol button (opens symbol search scoped to that
  cell), period dropdown, an "add indicator" icon, and a cell menu (remove
  cell, sync on/off, maximize). Clicking anywhere in a cell dispatches
  `SET_ACTIVE_CELL` (used by the shared dialog layer).
- **Sync toggles** in the global toolbar (crosshair / scroll / zoom / symbol /
  period), fed to `WorkspaceProvider`'s `sync` prop. Default all on.
- **Active cell highlight:** a subtle ring on the focused cell.
- **Maximize:** a cell-menu action that temporarily renders only that cell
  (local state in `ChartGrid`, not persisted).

### 6.2 Object Tree (new panel, left or right dock)
- New `ObjectTreePanel` listing, grouped: **Drawings**, **Indicators** (main +
  sub), **Order lines**, **Annotations**, **Alerts** (read-only links).
  Sources: `useDrawingTools()`, `useIndicators()`, `useOrderLines()`,
  `useAnnotations()`, `useAlerts()`.
- Per-row controls: visibility toggle, lock (drawings — via the drawing hook's
  lock API), rename (annotations/order lines), delete. "Eye" icon toggles
  visibility without removing.
- **Selection → focus:** clicking a drawing row calls the drawing hook's
  select API (if exposed) to highlight it on the chart.
- Empty state: "No objects yet. Add a drawing or indicator."
- Toggled from the right activity bar (alongside watchlist / symbol info /
  order book) and via the command palette.

### 6.3 Indicator-based alerts + depth overlay
- **`AlertsDialog`** gains a "Source" toggle: **Price** (current behaviour) vs
  **Indicator**. When "Indicator" is selected:
  - A dropdown lists active sub-indicators that expose numeric figures
    (RSI → `rsi`, MACD → `macd`/`signal`, …), sourced from
    `state.subIndicators` + the indicator figure metadata via
    `chart.getIndicators()`.
  - The threshold input becomes the indicator value (e.g. 70).
  - `addAlert(price, condition, message, extendData, { type: "indicator",
    indicatorId, figureKey })` is called.
- The **`alertLine` overlay** already draws for price alerts; indicator alerts
  render as a horizontal line on the indicator pane (best-effort — the library
  draws the crossing line on the main pane by default; we annotate the message
  with the indicator/figure so the user knows what it watches).
- **Depth overlay on chart:** register the library's `depthOverlay` extension
  (already auto-registered via `registerExtensions`) and surface a toolbar
  toggle that, when on, subscribes via `datafeed.subscribeDepth` and pushes
  the snapshot to the overlay. Off by default (heavy). When a source has no
  depth feed, the toggle is disabled with a tooltip.

### 6.4 History pagination / lazy-load
- Fix the four `getHistoryKLineData` implementations to honour `from`/`to`
  (§4.2). Concretely:
  - **Binance:** drop fixed `limit: 1000`; use `startTime`/`endTime` from
    `from`/`to` with `limit` capped at 1000 per page.
  - **Bybit:** `start`/`end` params (already supports), cap `limit`.
  - **OKX:** `before`/`after` bar cursors → map to `from`/`to` timestamp.
  - **Synthetic:** generate the `[from, to]` window deterministically.
- Add a vitest case asserting that a second `getHistoryKLineData` call with an
  earlier `to` returns strictly older bars than the first.

### 6.5 `useHotkeys` integration (closes README gap)
- Register the app's custom keyboard shortcuts **through** the library's hotkey
  system (`registerHotkey`/`setHotkeysEnabled`) instead of bare
  `window.addEventListener("keydown")` in `KeyboardShortcuts.tsx`, where they
  overlap with klinecharts v10's own hotkeys (drawing tools, etc.). Keep a
  thin fallback listener only for shortcuts the library can't express (e.g.
  opening the command palette). Add a "Hotkeys" section to the Settings dialog
  showing the active map and an enable/disable toggle.

### 6.6 `useChartAxes` integration (closes README gap)
- Surface axis overrides that `useKlinechartsUISettings` doesn't cover: custom
  **tick formatters** (`overrideXAxis`/`overrideYAxis` `createTicks`), axis
  **name/inside/reverse/position** per pane. Add an "Axes" tab to the Settings
  dialog with: X-axis tick density, Y-axis price format (auto / decimal count
  / compact), and "reverse Y axis" / "Y axis inside" toggles bound to
  `overrideYAxis`.

---

## 7. Testing strategy

- **Unit (vitest):**
  - Datafeed: extend `registry.test.ts` with a "windowed history" test
    asserting `forward` requests return older bars; add a Binance-mock test
    for callback-aware `unsubscribe` (multi-subscriber teardown).
  - `useLivePrice`: test that change is computed against the window open, not
    the last bar's open.
- **Manual / Playwright (optional, if time permits):**
  - Grid: open 2×2, change symbol in one cell, verify siblings' crosshair
    sync; toggle scroll-sync off and verify independence.
  - Lazy-load: scroll left and confirm older bars appear (network tab shows a
    second history request).
  - Indicator alert: set RSI crossing 70, force a tick, confirm `onAlertTriggered` fires.
- **No new framework.** Existing vitest + eslint + tsc gates stay the source
  of truth; the CI workflow already runs them.

---

## 8. Build sequence (high-level — detailed plan follows)

1. **Upgrade & migrate types** — bump versions, switch type imports to
   `klinecharts`, run `pnpm typecheck` to green. Add `storage={{}}` (no
   behaviour change yet beyond persistence).
2. **Bug fixes (§5)** — small, isolated commits; tests for datafeed fixes.
3. **Lazy history (§6.4)** — source changes + test. Independent of UI work.
4. **Workspace grid (§6.1)** — `WorkspaceProvider` + `ChartGrid` +
   `ActiveCellProvider`; single-cell mode becomes "grid of one".
5. **Object Tree (§6.2)** — panel reading existing hooks.
6. **Indicator alerts + depth (§6.3)** — dialog extension + overlay toggle.
7. **`useHotkeys` + `useChartAxes` (§6.5/§6.6)** — close coverage gaps.
8. **README + screenshots** — update the feature table and screenshot.

Each step leaves the app shippable (typecheck + build + lint + tests green).

---

## 9. Out of scope (explicit)

- Server-persisted workspaces, tabbed layouts (library roadmap).
- Email/push/webhook alert delivery (WebAudio beep stays).
- Multiple watchlists / sortable watchlist columns.
- Mobile/touch drawing UX overhaul.
- Migrating chart rendering off `react-klinecharts` to direct
  `klinecharts.init()` (no benefit; `1.1.0` keeps `react-klinecharts` as a
  peer).

---

## 10. Risks & mitigations

| Risk | Mitigation |
|---|---|
| Multi-provider perf: each cell runs its own pollers (alerts, live price, depth) | Default to 1 cell; cap grid at 4; depth overlay off by default; document the cost |
| `useChartSync` scroll sync is right-edge-aligned, not pixel-exact (library note) | Acceptable; document in the sync-toggle tooltip |
| Per-cell persistence key collisions | Library namespaces by provider instance; verify cells restore independently |
| Binance windowed query may hit rate limits on aggressive scroll | Cap page size; reuse the existing `currentGen` guard in the loader (already cancels stale requests) |
| `useHotkeys` migration could regress existing shortcuts | Keep the bare listener as fallback during migration; manually verify each shortcut |

---

## 11. Open questions (resolved during planning)

- *Renderer:* keep `react-klinecharts` `<KLineChart>` (decided — it's a peer
  dep again in 1.1.0).
- *Grid model:* full per-cell providers (decided — matches library design).
- *Dialogs:* shared single layer operating on the active cell (decided —
  avoids duplication, keeps dialog code unchanged).
