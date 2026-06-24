import { useMemo, useState } from "react";
import { useSymbolSearch } from "react-klinecharts-ui";
import { useT } from "@/i18n";
import { Search, CornerDownLeft } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface Command {
  id: string;
  label: string;
  hint?: string;
  run: () => void;
}

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  commands: Command[];
}

export function CommandPalette({ open, onOpenChange, commands }: CommandPaletteProps) {
  const t = useT();
  const { results, setQuery, selectSymbol } = useSymbolSearch(200);
  const [local, setLocal] = useState("");

  const q = local.trim().toLowerCase();
  const filteredCommands = useMemo(
    () => commands.filter((c) => c.label.toLowerCase().includes(q)),
    [commands, q],
  );
  const symbolResults = q.length >= 1 ? results.slice(0, 6) : [];

  const onType = (v: string) => {
    setLocal(v);
    setQuery(v);
  };

  const close = () => {
    onOpenChange(false);
    setLocal("");
    setQuery("");
  };

  return (
    <Dialog open={open} onOpenChange={(o) => (o ? onOpenChange(o) : close())}>
      <DialogContent className="max-w-xl p-0" showClose={false}>
        <DialogHeader className="border-b border-border px-4 py-3">
          <DialogTitle className="sr-only">{t("cmd.title")}</DialogTitle>
          <div className="flex items-center gap-2">
            <Search className="size-4 shrink-0 text-muted-foreground" />
            <Input
              autoFocus
              value={local}
              onChange={(e) => onType(e.target.value)}
              placeholder={t("cmd.placeholder")}
              className="h-8 border-0 px-0 shadow-none focus-visible:ring-0"
            />
            <kbd className="rounded border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground">
              ESC
            </kbd>
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[55vh]" viewportClassName="p-2">
          {symbolResults.length > 0 && (
            <div className="mb-1">
              <div className="px-2 py-1 text-[10px] uppercase tracking-wide text-muted-foreground">
                {t("cmd.symbols")}
              </div>
              {symbolResults.map((sym) => (
                <button
                  key={`${sym.source ?? ""}:${sym.ticker}`}
                  onClick={() => {
                    selectSymbol(sym);
                    close();
                  }}
                  className="flex w-full items-center justify-between gap-2 rounded-md px-2 py-1.5 text-start text-sm hover:bg-accent"
                >
                  <span className="font-medium">{sym.ticker}</span>
                  <Badge variant="outline">{String(sym.exchange ?? sym.source ?? "")}</Badge>
                </button>
              ))}
            </div>
          )}

          <div className="px-2 py-1 text-[10px] uppercase tracking-wide text-muted-foreground">
            {t("cmd.commands")}
          </div>
          {filteredCommands.length === 0 ? (
            <div className="px-2 py-6 text-center text-sm text-muted-foreground">
              {t("cmd.empty")}
            </div>
          ) : (
            filteredCommands.map((c) => (
              <button
                key={c.id}
                onClick={() => {
                  c.run();
                  close();
                }}
                className={cn(
                  "group flex w-full items-center justify-between gap-2 rounded-md px-2 py-1.5 text-start text-sm hover:bg-accent",
                )}
              >
                <span>{c.label}</span>
                <span className="flex items-center gap-2 text-xs text-muted-foreground">
                  {c.hint}
                  <CornerDownLeft className="size-3 opacity-0 group-hover:opacity-100" />
                </span>
              </button>
            ))
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
