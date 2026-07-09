import { useState } from "react";
import { useKlinechartsUI, usePeriods } from "react-klinecharts-ui";
import { useT } from "@/i18n";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Compact per-cell toolbar for non-primary grid cells: symbol display, period
 * dropdown, and remove. Symbol switching here uses the cell's own provider
 * (setPeriod from usePeriods). The symbol button opens a small inline input.
 */
export function SecondaryToolbar({ onRemove }: { onRemove: () => void }) {
  const t = useT();
  const { state, dispatch } = useKlinechartsUI();
  const { periods, activePeriod, setPeriod } = usePeriods();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");

  const commitSymbol = () => {
    const v = draft.trim().toUpperCase();
    if (v) {
      dispatch({
        type: "SET_SYMBOL",
        symbol: { ...(state.symbol ?? { ticker: v, pricePrecision: 2, volumePrecision: 2 }), ticker: v },
      });
    }
    setEditing(false);
    setDraft("");
  };

  return (
    <div className="flex h-8 shrink-0 items-center gap-1 border-b border-border/60 px-2">
      {editing ? (
        <input
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commitSymbol}
          onKeyDown={(e) => {
            if (e.key === "Enter") commitSymbol();
            if (e.key === "Escape") {
              setEditing(false);
              setDraft("");
            }
          }}
          placeholder={state.symbol?.ticker ?? t("toolbar.symbol")}
          className="h-6 w-28 rounded border border-input bg-transparent px-1.5 text-xs outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
        />
      ) : (
        <button
          onClick={() => setEditing(true)}
          className={cn("max-w-[14ch] truncate rounded px-1 text-xs font-semibold hover:bg-accent/50")}
        >
          {state.symbol?.ticker ?? t("toolbar.symbol")}
        </button>
      )}

      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button variant="ghost" size="sm" className="h-7 gap-0.5 px-1.5">
              <span className="text-xs">{activePeriod.label}</span>
              <ChevronDown className="size-3 text-muted-foreground" />
            </Button>
          }
        />
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
      <Button variant="ghost" size="icon-sm" className="h-7" onClick={onRemove} title={t("ws.removeCell")}>
        <X className="size-3.5" />
      </Button>
    </div>
  );
}
