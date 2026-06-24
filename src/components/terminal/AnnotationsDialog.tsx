import { useState } from "react";
import { useAnnotations, useCrosshair } from "react-klinecharts-ui";
import { useT } from "@/i18n";
import { Plus, Trash2 } from "lucide-react";
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
import { formatPrice } from "@/lib/utils";

interface AnnotationsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AnnotationsDialog({ open, onOpenChange }: AnnotationsDialogProps) {
  const t = useT();
  const { annotations, addAnnotation, removeAnnotation, clearAnnotations } = useAnnotations();
  const { barData } = useCrosshair();
  const [text, setText] = useState("");
  const [price, setPrice] = useState("");

  const add = () => {
    const txt = text.trim();
    const p = parseFloat(price) || barData?.close;
    if (!txt || !Number.isFinite(p as number)) return;
    addAnnotation(txt, p as number, barData?.timestamp ?? Date.now());
    setText("");
    setPrice("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t("an.title")}</DialogTitle>
          <DialogDescription>
            {t("an.desc")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={t("an.textPh")}
            className="h-8"
          />
          <div className="flex gap-2">
            <Input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder={barData ? t("an.priceCursor", { price: barData.close }) : t("al.pricePh")}
              className="h-8"
              onKeyDown={(e) => e.key === "Enter" && add()}
            />
            <Button size="icon-sm" onClick={add}>
              <Plus className="size-4" />
            </Button>
          </div>
        </div>

        <ScrollArea className="max-h-64 rounded-md border border-border">
          {annotations.length === 0 ? (
            <div className="px-3 py-8 text-center text-sm text-muted-foreground">
              {t("an.empty")}
            </div>
          ) : (
            <ul className="p-1">
              {annotations.map((a) => (
                <li
                  key={a.id}
                  className="flex items-center justify-between gap-2 rounded-md px-3 py-1.5 hover:bg-accent/50"
                >
                  <span className="min-w-0 truncate text-sm">
                    {a.text}{" "}
                    <span className="font-mono text-xs text-muted-foreground">
                      @ {formatPrice(a.price)}
                    </span>
                  </span>
                  <Button variant="ghost" size="icon-sm" onClick={() => removeAnnotation(a.id)}>
                    <Trash2 className="size-3.5" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </ScrollArea>

        {annotations.length > 0 && (
          <div className="flex justify-end">
            <Button variant="outline" size="sm" onClick={clearAnnotations}>
              {t("common.clear")}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
