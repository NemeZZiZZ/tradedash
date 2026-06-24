import { useEffect, useState } from "react";
import { useAlerts } from "react-klinecharts-ui";
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
  const [price, setPrice] = useState("");
  const [condition, setCondition] = useState<AlertCondition>("crossing_up");
  const [message, setMessage] = useState("");

  // Prefill the price when opened from a right-click on the chart.
  useEffect(() => {
    if (open && initialPrice != null) setPrice(String(initialPrice));
  }, [open, initialPrice]);

  const add = () => {
    const p = parseFloat(price);
    if (!Number.isFinite(p)) return;
    addAlert(p, condition, message.trim() || undefined);
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
          <div className="flex gap-2">
            <Input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder={t("al.pricePh")}
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
