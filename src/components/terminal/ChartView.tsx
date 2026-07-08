import { useCallback, useEffect, useMemo, useRef } from "react";
import { KLineChart } from "react-klinecharts";
import type { Chart } from "klinecharts";
import { useKlinechartsUI, createDataLoader } from "react-klinecharts-ui";
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
