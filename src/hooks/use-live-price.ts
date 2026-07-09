import { useEffect, useState } from "react";
import { useKlinechartsUI } from "react-klinecharts-ui";

/**
 * Latest price + intraday change, read by polling the chart's own data list
 * (`chart.getDataList()`). This avoids opening a second datafeed subscription
 * (which would share — and on teardown close — the chart's stream).
 */
export function useLivePrice(): {
  last: number | null;
  change: number | null;
  changePercent: number | null;
} {
  const { state } = useKlinechartsUI();
  const [val, setVal] = useState<{ last: number | null; change: number | null; changePercent: number | null }>({
    last: null,
    change: null,
    changePercent: null,
  });

  const chart = state.chart;
  const ticker = state.symbol?.ticker;

  useEffect(() => {
    const read = () => {
      const list = chart?.getDataList?.();
      if (!list || list.length === 0) return;
      const last = list[list.length - 1].close;
      const open = list[0].open;
      const change = last - open;
      setVal({ last, change, changePercent: open ? (change / open) * 100 : null });
    };
    read();
    const t = setInterval(read, 700);
    return () => clearInterval(t);
  }, [chart, ticker]);

  return val;
}
