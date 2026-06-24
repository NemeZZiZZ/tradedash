import { useEffect, useState } from "react";
import { useOrderLines } from "react-klinecharts-ui";
import { useT } from "@/i18n";
import { Trash2, Plus } from "lucide-react";
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

interface OrderLinesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialPrice?: number | null;
}

interface Line {
  id: string;
  price: number;
  side: "long" | "short";
}

export function OrderLinesDialog({ open, onOpenChange, initialPrice }: OrderLinesDialogProps) {
  const t = useT();
  const { createOrderLine, removeOrderLine, removeAllOrderLines } = useOrderLines();
  const [lines, setLines] = useState<Line[]>([]);
  const [price, setPrice] = useState("");
  const [side, setSide] = useState<"long" | "short">("long");

  // Prefill the price when opened from a right-click on the chart.
  useEffect(() => {
    if (open && initialPrice != null) setPrice(String(initialPrice));
  }, [open, initialPrice]);

  const add = () => {
    const p = parseFloat(price);
    if (!Number.isFinite(p)) return;
    const id = createOrderLine({
      price: p,
      draggable: true,
      color: side === "long" ? "#26a69a" : "#ef5350",
      text: `${side === "long" ? t("common.long") : t("common.short")} @ ${formatPrice(p)}`,
      line: { width: 2, style: "solid" },
      onPriceChange: (np) =>
        setLines((ls) => ls.map((l) => (l.id === id ? { ...l, price: np } : l))),
    });
    if (id) {
      setLines((ls) => [...ls, { id, price: p, side }]);
      setPrice("");
    }
  };

  const remove = (id: string) => {
    removeOrderLine(id);
    setLines((ls) => ls.filter((l) => l.id !== id));
  };

  const clear = () => {
    removeAllOrderLines();
    setLines([]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t("ol.title")}</DialogTitle>
          <DialogDescription>
            {t("ol.desc")}
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-end gap-2">
          <div className="flex gap-1">
            {(["long", "short"] as const).map((s) => (
              <Button
                key={s}
                variant={side === s ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setSide(s)}
                className={cn(side === s && (s === "long" ? "text-bull" : "text-bear"))}
              >
                {s === "long" ? t("common.long") : t("common.short")}
              </Button>
            ))}
          </div>
          <Input
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder={t("ol.pricePh")}
            className="h-8"
            onKeyDown={(e) => e.key === "Enter" && add()}
          />
          <Button size="icon-sm" onClick={add}>
            <Plus className="size-4" />
          </Button>
        </div>

        <ScrollArea className="max-h-64 rounded-md border border-border">
          {lines.length === 0 ? (
            <div className="px-3 py-8 text-center text-sm text-muted-foreground">
              {t("ol.empty")}
            </div>
          ) : (
            <ul className="p-1">
              {lines.map((l) => (
                <li
                  key={l.id}
                  className="flex items-center justify-between rounded-md px-3 py-1.5 hover:bg-accent/50"
                >
                  <span
                    className={cn(
                      "font-mono text-sm tabular-nums",
                      l.side === "long" ? "text-bull" : "text-bear",
                    )}
                  >
                    {l.side === "long" ? t("common.long") : t("common.short")} @ {formatPrice(l.price)}
                  </span>
                  <Button variant="ghost" size="icon-sm" onClick={() => remove(l.id)}>
                    <Trash2 className="size-3.5" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </ScrollArea>

        {lines.length > 0 && (
          <div className="flex justify-end">
            <Button variant="outline" size="sm" onClick={clear}>
              {t("common.removeAll")}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
