import { useEffect, useMemo, useState } from "react";
import { useKlinechartsUI } from "react-klinecharts-ui";
import { useT } from "@/i18n";
import { datafeed } from "@/datafeed";
import type { DepthSnapshot } from "@/datafeed";
import { Skeleton } from "@/components/ui/skeleton";
import { cn, formatPrice } from "@/lib/utils";

interface Row {
  price: number;
  size: number;
  total: number;
}

/** Cumulate sizes from the inside (best price) outward. */
function withTotals(levels: [number, number][]): Row[] {
  let run = 0;
  return levels.map(([price, size]) => {
    run += size;
    return { price, size, total: run };
  });
}

export function OrderBookPanel() {
  const t = useT();
  const { state } = useKlinechartsUI();
  const symbol = state.symbol;
  const ticker = symbol?.ticker ?? "";
  const pricePrec = symbol?.pricePrecision ?? 2;
  const sizePrec = Math.min(symbol?.volumePrecision ?? 3, 4);

  const supported = symbol ? datafeed.supportsDepth(symbol) : false;
  const [depth, setDepth] = useState<DepthSnapshot | null>(null);

  useEffect(() => {
    setDepth(null);
    if (!symbol || !supported) return;
    const unsubscribe = datafeed.subscribeDepth(symbol, setDepth);
    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticker, supported]);

  const view = useMemo(() => {
    if (!depth) return null;
    const asks = withTotals(depth.asks.slice(0, 50));
    const bids = withTotals(depth.bids.slice(0, 50));
    const maxTotal = Math.max(
      asks[asks.length - 1]?.total ?? 0,
      bids[bids.length - 1]?.total ?? 0,
      1,
    );
    const bestAsk = asks[0]?.price;
    const bestBid = bids[0]?.price;
    const spread = bestAsk && bestBid ? bestAsk - bestBid : null;
    const spreadPct = spread && bestBid ? (spread / bestBid) * 100 : null;
    const mid = bestAsk && bestBid ? (bestAsk + bestBid) / 2 : null;
    return { asks, bids, maxTotal, spread, spreadPct, mid };
  }, [depth]);

  const sizeFmt = (n: number) =>
    n.toLocaleString("en-US", { maximumFractionDigits: sizePrec });

  const RowLine = ({ row, side }: { row: Row; side: "ask" | "bid" }) => (
    <div className="relative grid grid-cols-[1fr_auto_auto] items-center gap-2 px-3 py-[3px] font-mono text-xs tabular-nums">
      <div
        className={cn(
          "absolute inset-y-0 end-0 -z-0",
          side === "ask" ? "bg-bear/10" : "bg-bull/10",
        )}
        style={{ width: `${(row.total / (view?.maxTotal ?? 1)) * 100}%` }}
      />
      <span className={cn("z-0", side === "ask" ? "text-bear" : "text-bull")}>
        {formatPrice(row.price, pricePrec)}
      </span>
      <span className="z-0 text-end text-foreground/90">
        {sizeFmt(row.size)}
      </span>
      <span className="z-0 w-16 text-end text-muted-foreground">
        {sizeFmt(row.total)}
      </span>
    </div>
  );

  return (
    <aside className="flex h-full w-full flex-col bg-card">
      <div className="flex h-9 shrink-0 items-center justify-between border-b border-border px-3">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {t("dock.orderbook")}
        </span>
        <span className="font-mono text-xs text-muted-foreground">
          {ticker}
        </span>
      </div>

      <div className="grid grid-cols-[1fr_auto_auto] gap-2 border-b border-border px-3 py-1 text-[10px] uppercase text-muted-foreground">
        <span>{t("ob.price")}</span>
        <span className="text-end">{t("ob.size")}</span>
        <span className="w-16 text-end">{t("ob.total")}</span>
      </div>

      {!supported ? (
        <div className="flex flex-1 items-center justify-center p-4 text-center text-xs text-muted-foreground">
          {t("ob.unsupported")}
        </div>
      ) : !view ? (
        <div className="flex flex-1 flex-col gap-1 p-2">
          {Array.from({ length: 16 }).map((_, i) => (
            <Skeleton key={i} className="h-4 w-full" />
          ))}
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col">
          {/* Asks: best ask sits just above the spread row; scroll up for depth. */}
          <div className="flex min-h-0 flex-1 flex-col-reverse overflow-y-auto [&::-webkit-scrollbar-thumb]:rounded [&::-webkit-scrollbar-thumb]:bg-muted-foreground/30 [&::-webkit-scrollbar]:w-1.5">
            {view.asks.map((row) => (
              <RowLine key={`a-${row.price}`} row={row} side="ask" />
            ))}
          </div>

          <div className="flex shrink-0 items-baseline justify-between border-y border-border bg-muted/30 px-3 py-1.5">
            <span className="font-mono text-sm font-semibold">
              {view.mid != null ? formatPrice(view.mid, pricePrec) : "—"}
            </span>
            <span className="text-xs text-muted-foreground">
              {t("ob.spread")}{" "}
              {view.spread != null ? formatPrice(view.spread, pricePrec) : "—"}
              {view.spreadPct != null && ` · ${view.spreadPct.toFixed(3)}%`}
            </span>
          </div>

          <div className="flex min-h-0 flex-1 flex-col overflow-y-auto [&::-webkit-scrollbar-thumb]:rounded [&::-webkit-scrollbar-thumb]:bg-muted-foreground/30 [&::-webkit-scrollbar]:w-1.5">
            {view.bids.map((row) => (
              <RowLine key={`b-${row.price}`} row={row} side="bid" />
            ))}
          </div>
        </div>
      )}
    </aside>
  );
}
