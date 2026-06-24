import { useEffect, useRef, useState } from "react";
import { useWatchlist } from "react-klinecharts-ui";
import { useT } from "@/i18n";
import type { WatchlistItem } from "react-klinecharts-ui";
import { Plus, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { loadPersisted, savePersisted } from "@/hooks/use-persistent-state";
import { cn, formatPrice, formatPercent } from "@/lib/utils";

const DEFAULT_LIST = ["BTCUSDT", "ETHUSDT", "SOLUSDT", "BNBUSDT", "XRPUSDT"];

function WatchRow({
  t,
  item,
  active,
  onSelect,
  onRemove,
}: {
  t: (k: string, p?: Record<string, string | number>) => string;
  item: WatchlistItem;
  active: boolean;
  onSelect: () => void;
  onRemove: () => void;
}) {
  const up = (item.changePercent ?? 0) >= 0;
  const [flash, setFlash] = useState<"up" | "down" | "">("");
  const prev = useRef<number | null>(null);

  useEffect(() => {
    if (item.lastPrice == null) return;
    if (prev.current != null && item.lastPrice !== prev.current) {
      setFlash(item.lastPrice > prev.current ? "up" : "down");
      const t = setTimeout(() => setFlash(""), 450);
      prev.current = item.lastPrice;
      return () => clearTimeout(t);
    }
    prev.current = item.lastPrice;
  }, [item.lastPrice]);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => e.key === "Enter" && onSelect()}
      className={cn(
        "group flex cursor-default items-center justify-between gap-2 px-3 py-1.5 transition-colors hover:bg-accent",
        active && "bg-primary/10",
        flash === "up" && "flash-up",
        flash === "down" && "flash-down",
      )}
    >
      <span className="truncate text-sm font-medium">{item.ticker}</span>
      <div className="flex items-center gap-2 text-end tabular-nums">
        <span className="text-xs">{formatPrice(item.lastPrice)}</span>
        <span className={cn("w-16 text-xs", up ? "text-bull" : "text-bear")}>
          {formatPercent(item.changePercent)}
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="opacity-0 transition-opacity group-hover:opacity-100"
          aria-label={t("wl.remove", { ticker: item.ticker })}
        >
          <X className="size-3.5 text-muted-foreground hover:text-foreground" />
        </button>
      </div>
    </div>
  );
}

export function WatchlistPanel() {
  const t = useT();
  const { items, addSymbol, removeSymbol, switchSymbol, activeSymbol } = useWatchlist();
  const [ticker, setTicker] = useState("");
  const seeded = useRef(false);

  // Seed once from persisted list (or defaults), then keep storage in sync.
  useEffect(() => {
    if (seeded.current) return;
    loadPersisted<string[]>("watchlist", DEFAULT_LIST).forEach(addSymbol);
    seeded.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (seeded.current) savePersisted("watchlist", items.map((i) => i.ticker));
  }, [items]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const tk = ticker.trim().toUpperCase();
    if (tk) {
      addSymbol(tk);
      setTicker("");
    }
  };

  return (
    <aside className="flex h-full w-full flex-col bg-card">
      <div className="flex h-9 shrink-0 items-center border-b border-border px-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {t("wl.title")}
      </div>

      <form onSubmit={submit} className="flex gap-1 border-b border-border p-2">
        <Input
          value={ticker}
          onChange={(e) => setTicker(e.target.value)}
          placeholder={t("wl.addPh")}
          className="h-7 text-xs"
        />
        <Button type="submit" size="icon-sm" variant="secondary">
          <Plus className="size-4" />
        </Button>
      </form>

      <ScrollArea className="min-h-0 flex-1">
        <ul className="py-1">
          {items.map((item) => (
            <li key={item.ticker}>
              <WatchRow
                t={t}
                item={item}
                active={item.ticker === activeSymbol}
                onSelect={() => switchSymbol(item.ticker)}
                onRemove={() => removeSymbol(item.ticker)}
              />
            </li>
          ))}
        </ul>
      </ScrollArea>
    </aside>
  );
}
