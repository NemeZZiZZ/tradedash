import { useCallback, useMemo } from "react";
import { KLineChart } from "react-klinecharts";
import { useKlinechartsUI, createDataLoader } from "react-klinecharts-ui";
import { cn } from "@/lib/utils";

/**
 * A compact chart canvas for non-primary grid cells. Restores active indicators
 * on (re)mount like the primary ChartView, but omits the context menu /
 * buy-sell overlay (those operate on the primary cell via the global chrome).
 */
export function SecondaryChartView({ className }: { className?: string }) {
  const { state, dispatch, datafeed } = useKlinechartsUI();

  const dataLoader = useMemo(
    () => createDataLoader(datafeed, dispatch),
    [datafeed, dispatch],
  );

  const handleReady = useCallback(
    (chart: import("klinecharts").Chart) => {
      dispatch({ type: "SET_CHART", chart });
      state.mainIndicators.forEach((name) => {
        chart.createIndicator(
          { name, id: `main_${name}` },
          { isStack: true, pane: { id: "candle_pane" } },
        );
      });
      Object.keys(state.subIndicators).forEach((name) => {
        chart.createIndicator({ name, id: `sub_${name}` });
      });
    },
    // Restore once per chart instance using the lists at mount time.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dispatch],
  );

  return (
    <div className={cn("relative h-full w-full", className)}>
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
    </div>
  );
}
