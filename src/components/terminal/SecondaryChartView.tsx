import { useCallback, useEffect, useMemo, useRef } from "react";
import { KLineChart } from "react-klinecharts";
import type { Chart } from "klinecharts";
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

  // Mirror the latest indicator lists into refs so onReady (registered once on
  // mount) reads the current lists rather than the stale first-render closure.
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
      Object.keys(subIndicatorsRef.current).forEach((name) => {
        chart.createIndicator({ name, id: `sub_${name}` });
      });
    },
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
