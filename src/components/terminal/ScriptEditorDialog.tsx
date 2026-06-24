import { useRef } from "react";
import { useScriptEditor } from "react-klinecharts-ui";
import { useT } from "@/i18n";
import { Play, Trash2, RotateCcw, Download, Upload } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface ScriptEditorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ScriptEditorDialog({ open, onOpenChange }: ScriptEditorDialogProps) {
  const t = useT();
  const s = useScriptEditor();
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{t("se.title")}</DialogTitle>
          <DialogDescription>{t("se.desc")}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap items-center gap-2">
          <Input
            value={s.scriptName}
            onChange={(e) => s.setScriptName(e.target.value)}
            placeholder={t("se.namePh")}
            className="h-8 w-40"
          />
          <Input
            value={s.params}
            onChange={(e) => s.setParams(e.target.value)}
            placeholder={t("se.paramsPh")}
            className="h-8 w-44"
          />
          <select
            value={s.placement}
            onChange={(e) => s.setPlacement(e.target.value as "main" | "sub")}
            className="h-8 rounded-md border border-input bg-transparent px-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
          >
            <option value="main" className="bg-popover">{t("se.onChart")}</option>
            <option value="sub" className="bg-popover">{t("se.inPane")}</option>
          </select>
        </div>

        <textarea
          value={s.code}
          onChange={(e) => s.setCode(e.target.value)}
          spellCheck={false}
          className="h-72 w-full resize-none rounded-md border border-border bg-muted/30 p-3 font-mono text-xs outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
        />

        {(s.error || s.status) && (
          <div
            className={
              s.error ? "text-xs text-destructive" : "text-xs text-muted-foreground"
            }
          >
            {s.error || s.status}
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex gap-1.5">
            <Button size="sm" onClick={s.runScript} disabled={s.isRunning} className="gap-1.5">
              <Play className="size-4" /> {t("se.run")}
            </Button>
            {s.hasActiveScript && (
              <Button variant="outline" size="sm" onClick={s.removeScript} className="gap-1.5">
                <Trash2 className="size-4" /> {t("se.remove")}
              </Button>
            )}
          </div>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon-sm" onClick={s.resetCode} aria-label={t("se.reset")}>
              <RotateCcw className="size-4" />
            </Button>
            <Button variant="ghost" size="icon-sm" onClick={s.exportScript} aria-label={t("se.export")}>
              <Download className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => fileRef.current?.click()}
              aria-label={t("se.import")}
            >
              <Upload className="size-4" />
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept=".js,.txt"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) s.importScript(f);
                e.target.value = "";
              }}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
