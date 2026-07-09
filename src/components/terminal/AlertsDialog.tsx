import { useEffect, useMemo, useState } from "react";
import { useAlerts, useKlinechartsUI } from "react-klinecharts-ui";
import { useT } from "@/i18n";
import type { AlertCondition } from "react-klinecharts-ui";
import { Plus, Trash2, BellRing, Bell } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn, formatPrice } from "@/lib/utils";

interface AlertsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialPrice?: number | null;
}

const CONDITIONS: { value: AlertCondition; labelKey: string }[] = [
  { value: "crossing_up", labelKey: "al.crossingUp" },
  { value: "crossing_down", labelKey: "al.crossingDown" },
  { value: "crossing", labelKey: "al.crossing" },
];

export function AlertsDialog({ open, onOpenChange, initialPrice }: AlertsDialogProps) {
  const t = useT();
  const { alerts, addAlert, removeAlert, clearAlerts } = useAlerts();
  const { state } = useKlinechartsUI();
  const [price, setPrice] = useState("");
  const [condition, setCondition] = useState<AlertCondition>("crossing_up");
  const [message, setMessage] = useState("");
  const [source, setSource] = useState<"price" | "indicator">("price");
  const [indicatorId, setIndicatorId] = useState("");
  const [figureKey, setFigureKey] = useState("");

  // Prefill the price when opened from a right-click on the chart.
  useEffect(() => {
    if (open && initialPrice != null) setPrice(String(initialPrice));
  }, [open, initialPrice]);

  // Build the list of indicator figures from the chart so the user can alert on
  // e.g. RSI crossing 70 or a MACD signal crossover.
  const indOptions = useMemo(() => {
    const chart = state.chart;
    if (!chart) return [];
    const all = chart.getIndicators?.() ?? [];
    return all
      .filter((i: { figures?: unknown[] }) => (i.figures?.length ?? 0) > 0)
      .map((i: { id?: string; name?: string; figures?: { key?: string }[] }) => ({
        indicatorId: i.id ?? i.name ?? "",
        name: i.name ?? "",
        figures: (i.figures ?? []).map((f: { key?: string }) => f.key ?? "").filter(Boolean),
      }));
  }, [state.chart]);

  const add = () => {
    const p = parseFloat(price);
    if (!Number.isFinite(p)) return;
    if (source === "indicator" && indicatorId && figureKey) {
      addAlert(p, condition, message.trim() || undefined, undefined, {
        type: "indicator",
        indicatorId,
        figureKey,
      });
    } else {
      addAlert(p, condition, message.trim() || undefined);
    }
    setPrice("");
    setMessage("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t("al.title")}</DialogTitle>
          <DialogDescription>
            {t("al.desc")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <div className="flex gap-1">
            {(["price", "indicator"] as const).map((s) => (
              <Button
                key={s}
                variant={source === s ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setSource(s)}
              >
                {s === "price" ? t("al.price") : t("al.indicator")}
              </Button>
            ))}
          </div>
          {source === "indicator" && (
            <div className="flex gap-2">
              <select
                value={indicatorId}
                onChange={(e) => {
                  setIndicatorId(e.target.value);
                  setFigureKey("");
                }}
                className="h-8 flex-1 rounded-md border border-input bg-transparent px-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
              >
                <option value="" className="bg-popover">{t("al.indicatorPh")}</option>
                {indOptions.map((o) => (
                  <option key={o.indicatorId} value={o.indicatorId} className="bg-popover">
                    {o.name}
                  </option>
                ))}
              </select>
              <select
                value={figureKey}
                onChange={(e) => setFigureKey(e.target.value)}
                className="h-8 w-28 rounded-md border border-input bg-transparent px-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
              >
                <option value="" className="bg-popover">{t("al.figurePh")}</option>
                {indOptions
                  .find((o) => o.indicatorId === indicatorId)
                  ?.figures.map((f) => (
                    <option key={f} value={f} className="bg-popover">
                      {f}
                    </option>
                  ))}
              </select>
            </div>
          )}
          <div className="flex gap-2">
            <Input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder={source === "indicator" ? t("al.thresholdPh") : t("al.pricePh")}
              className="h-8"
            />
            <select
              value={condition}
              onChange={(e) => setCondition(e.target.value as AlertCondition)}
              className="h-8 rounded-md border border-input bg-transparent px-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
            >
              {CONDITIONS.map((c) => (
                <option key={c.value} value={c.value} className="bg-popover">
                  {t(c.labelKey)}
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={t("al.msgPh")}
              className="h-8"
              onKeyDown={(e) => e.key === "Enter" && add()}
            />
            <Button size="icon-sm" onClick={add}>
              <Plus className="size-4" />
            </Button>
          </div>
        </div>

        <ScrollArea className="max-h-64 rounded-md border border-border">
          {alerts.length === 0 ? (
            <div className="px-3 py-8 text-center text-sm text-muted-foreground">
              {t("al.empty")}
            </div>
          ) : (
            <ul className="p-1">
              {alerts.map((a) => (
                <li
                  key={a.id}
                  className="flex items-center justify-between gap-2 rounded-md px-3 py-1.5 hover:bg-accent/50"
                >
                  <span className="flex items-center gap-2 text-sm">
                    {a.triggered ? (
                      <BellRing className="size-3.5 text-primary" />
                    ) : (
                      <Bell className="size-3.5 text-muted-foreground" />
                    )}
                    <span className={cn("font-mono tabular-nums", a.triggered && "text-primary")}>
                      {formatPrice(a.price)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {t(CONDITIONS.find((c) => c.value === a.condition)?.labelKey ?? "")}
                    </span>
                  </span>
                  <Button variant="ghost" size="icon-sm" onClick={() => removeAlert(a.id)}>
                    <Trash2 className="size-3.5" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </ScrollArea>

        {alerts.length > 0 && (
          <div className="flex justify-end">
            <Button variant="outline" size="sm" onClick={clearAlerts}>
              {t("common.clear")}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
