import { useCallback, useEffect, useMemo, useRef } from "react";
import { KLineChart } from "react-klinecharts";
import type { Chart } from "klinecharts";
import { useKlinechartsUI, createDataLoader } from "react-klinecharts-ui";
import type { DatafeedRegistry } from "@/datafeed";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { cn } from "@/lib/utils";
import { useTerminalActions } from "./actions";
import { ChartBuySell } from "./ChartBuySell";
import { useT } from "@/i18n";

interface ChartViewProps {
  className?: string;
}

/**
 * Renders the KLineChart canvas wired to the registry datafeed, and restores
 * any active indicators when the chart (re)mounts.
 */
export function ChartView({ className }: ChartViewProps) {
  const t = useT();
  const { state, dispatch, datafeed } = useKlinechartsUI();
  const { open, screenshot, tradeMode } = useTerminalActions();

  const dataLoader = useMemo(
    () => createDataLoader(datafeed, dispatch),
    [datafeed, dispatch],
  );

  // Read latest indicator lists in onReady without re-creating the callback.
  const mainIndicatorsRef = useRef(state.mainIndicators);
  const subIndicatorsRef = useRef(state.subIndicators);
  useEffect(() => {
    mainIndicatorsRef.current = state.mainIndicators;
    subIndicatorsRef.current = state.subIndicators;
  }, [state.mainIndicators, state.subIndicators]);

  const handleReady = useCallback(
    (chart: Chart) => {
      dispatch({ type: "SET_CHART", chart });

      mainIndicatorsRef.current.forEach((name) => {
        chart.createIndicator(
          { name, id: `main_${name}` },
          { isStack: true, pane: { id: "candle_pane" } },
        );
      });

      const subUpdates: Record<string, string> = {};
      Object.keys(subIndicatorsRef.current).forEach((name) => {
        const id = `sub_${name}`;
        chart.createIndicator({ name, id });
        const ind = chart.getIndicators({ id })[0];
        if (ind?.paneId) subUpdates[name] = ind.paneId;
      });
      if (Object.keys(subUpdates).length > 0) {
        dispatch({
          type: "SET_SUB_INDICATORS",
          indicators: { ...subIndicatorsRef.current, ...subUpdates },
        });
      }
    },
    [dispatch],
  );

  // Depth-of-market overlay on the chart. `depthOn` comes from the shared
  // actions context so the Toolbar toggle and this effect stay in sync.
  // The raw DepthSnapshot {bids,asks} is transformed into the
  // DepthOverlayExtendData {rows,maxQty} shape the depthOverlay template reads.
  const { depthOn } = useTerminalActions();
  const depthRegistry = datafeed as unknown as DatafeedRegistry;
  const depthSymbol = state.symbol as Parameters<DatafeedRegistry["supportsDepth"]>[0];
  const supportsDepth = depthSymbol ? depthRegistry.supportsDepth?.(depthSymbol) ?? false : false;
  useEffect(() => {
    const chart = state.chart;
    const sym = depthSymbol;
    if (!chart || !sym || !depthOn || !supportsDepth) return;
    const toExtend = (snap: { bids: [number, number][]; asks: [number, number][] }) => {
      const rows = [
        ...snap.asks.map(([price, qty]) => ({ price, qty, side: "ask" as const })),
        ...snap.bids.map(([price, qty]) => ({ price, qty, side: "bid" as const })),
      ];
      const maxQty = rows.reduce((m, r) => Math.max(m, r.qty), 0) || 1;
      return { rows, maxQty };
    };
    let overlayId: string | null = null;
    const unsub = depthRegistry.subscribeDepth?.(sym, (snap) => {
      const extendData = toExtend(snap);
      if (!overlayId) {
        const created = chart.createOverlay({
          name: "depthOverlay",
          points: [{ value: snap.asks[0]?.[0] ?? 0 }],
          extendData,
        });
        overlayId = typeof created === "string" ? created : Array.isArray(created) ? (created[0] ?? null) : null;
      } else {
        chart.overrideOverlay({ id: overlayId, extendData });
      }
    });
    return () => {
      unsub?.();
      if (overlayId) chart.removeOverlay?.({ id: overlayId });
      overlayId = null;
    };
  }, [state.chart, depthSymbol, depthOn, supportsDepth, depthRegistry]);

  // Price under the last right-click, used to prefill the alert / order-line dialogs.
  const containerRef = useRef<HTMLDivElement>(null);
  const clickPriceRef = useRef<number | null>(null);
  const capturePrice = (e: React.MouseEvent) => {
    const el = containerRef.current;
    const chart = state.chart;
    if (!el || !chart) return;
    const rect = el.getBoundingClientRect();
    const res = chart.convertFromPixel([{ x: e.clientX - rect.left, y: e.clientY - rect.top }]);
    const pt = Array.isArray(res) ? res[0] : res;
    if (typeof pt?.value === "number") {
      const prec = state.symbol?.pricePrecision ?? 2;
      clickPriceRef.current = Number(pt.value.toFixed(prec));
    } else {
      clickPriceRef.current = null;
    }
  };
  const priceOpts = () =>
    clickPriceRef.current != null ? { price: clickPriceRef.current } : undefined;

  return (
    <ContextMenu>
      <ContextMenuTrigger
        render={
          <div
            ref={containerRef}
            onContextMenu={capturePrice}
            className={cn("relative h-full w-full", className)}
          >
            <KLineChart
              className="absolute inset-0"
              dataLoader={dataLoader}
              symbol={state.symbol ?? undefined}
              period={state.period}
              locale={state.locale}
              timezone={state.timezone}
              styles={state.theme}
              onReady={handleReady}
            />
            {tradeMode && <ChartBuySell />}
          </div>
        }
      />
      <ContextMenuContent>
        <ContextMenuItem onClick={() => open("indicators")}>{t("toolbar.indicators")}</ContextMenuItem>
        <ContextMenuItem onClick={() => open("alerts", priceOpts())}>{t("menu.addAlert")}</ContextMenuItem>
        <ContextMenuItem onClick={() => open("orderLines", priceOpts())}>{t("menu.orderLine")}</ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem onClick={() => open("settings")}>{t("toolbar.settings")}</ContextMenuItem>
        <ContextMenuItem onClick={screenshot}>{t("toolbar.screenshot")}</ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem onClick={() => state.chart?.scrollToRealTime?.(0)}>
          {t("menu.toRealtime")}
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
