import { useOrderLines } from "react-klinecharts-ui";
import { useLivePrice } from "@/hooks/use-live-price";
import { useT } from "@/i18n";
import { cn, formatPrice } from "@/lib/utils";

/**
 * Floating Sell / Buy buttons (top-left of the chart, TradingView-style).
 * Clicking drops a draggable order line at the current price.
 */
export function ChartBuySell() {
  const t = useT();
  const { last } = useLivePrice();
  const { createOrderLine } = useOrderLines();

  const place = (side: "long" | "short") => {
    if (last == null) return;
    createOrderLine({
      price: last,
      draggable: true,
      color: side === "long" ? "#26a69a" : "#ef5350",
      text: `${side === "long" ? "BUY" : "SELL"} @ ${formatPrice(last)}`,
      line: { width: 2, style: "solid" },
    });
  };

  const price = formatPrice(last);

  return (
    <div className="pointer-events-auto absolute right-2 top-2 z-20 flex gap-1">
      <button
        onClick={() => place("short")}
        className={cn(
          "rounded-l-md flex flex-col items-start px-2.5 py-1 text-start transition-colors",
          "bg-background border border-bear/50 hover:bg-bear/15",
        )}
      >
        <span className="text-xs uppercase text-bear font-semibold">
          {t("trade.sell")}
        </span>
        <span className="font-mono text-xs font-semibold tabular-nums text-bear">
          {price}
        </span>
      </button>
      <button
        onClick={() => place("long")}
        className={cn(
          "rounded-r-md flex flex-col items-end px-2.5 py-1 text-end transition-colors",
          "bg-background border border-bull/50 hover:bg-bull/15",
        )}
      >
        <span className="text-xs uppercase text-bull font-semibold">
          {t("trade.buy")}
        </span>
        <span className="font-mono text-xs font-semibold tabular-nums text-bull">
          {price}
        </span>
      </button>
    </div>
  );
}
