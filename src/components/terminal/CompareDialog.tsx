import { useState } from "react";
import { useCompare } from "react-klinecharts-ui";
import { useT } from "@/i18n";
import { Plus, Trash2, Eye, EyeOff } from "lucide-react";
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

interface CompareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PALETTE = ["#2962ff", "#ff9800", "#26a69a", "#ef5350", "#ab47bc", "#42a5f5"];

export function CompareDialog({ open, onOpenChange }: CompareDialogProps) {
  const t = useT();
  const { symbols, addSymbol, removeSymbol, toggleSymbol, clearAll } = useCompare();
  const [ticker, setTicker] = useState("");
  const [busy, setBusy] = useState(false);

  const add = async () => {
    const t = ticker.trim().toUpperCase();
    if (!t) return;
    setBusy(true);
    try {
      await addSymbol(t, PALETTE[symbols.length % PALETTE.length]);
      setTicker("");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t("cmp.title")}</DialogTitle>
          <DialogDescription>
            {t("cmp.desc")}
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-2">
          <Input
            value={ticker}
            onChange={(e) => setTicker(e.target.value)}
            placeholder={t("cmp.tickerPh")}
            className="h-8"
            onKeyDown={(e) => e.key === "Enter" && add()}
          />
          <Button size="icon-sm" onClick={add} disabled={busy}>
            <Plus className="size-4" />
          </Button>
        </div>

        <ScrollArea className="max-h-64 rounded-md border border-border">
          {symbols.length === 0 ? (
            <div className="px-3 py-8 text-center text-sm text-muted-foreground">
              {t("cmp.empty")}
            </div>
          ) : (
            <ul className="p-1">
              {symbols.map((s) => (
                <li
                  key={s.ticker}
                  className="flex items-center justify-between gap-2 rounded-md px-3 py-1.5 hover:bg-accent/50"
                >
                  <span className="flex items-center gap-2 text-sm">
                    <span
                      className="size-3 rounded-full"
                      style={{ backgroundColor: s.color }}
                    />
                    {s.ticker}
                  </span>
                  <div className="flex items-center gap-0.5">
                    <Button variant="ghost" size="icon-sm" onClick={() => toggleSymbol(s.ticker)}>
                      {s.visible ? <Eye className="size-3.5" /> : <EyeOff className="size-3.5" />}
                    </Button>
                    <Button variant="ghost" size="icon-sm" onClick={() => removeSymbol(s.ticker)}>
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </ScrollArea>

        {symbols.length > 0 && (
          <div className="flex justify-end">
            <Button variant="outline" size="sm" onClick={clearAll}>
              {t("common.clear")}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
