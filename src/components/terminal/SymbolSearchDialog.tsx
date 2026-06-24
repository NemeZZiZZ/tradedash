import { useEffect, useState } from "react";
import { useSymbolSearch } from "react-klinecharts-ui";
import { useT } from "@/i18n";
import { Search, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { datafeed } from "@/datafeed";
import { cn } from "@/lib/utils";

interface SymbolSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SymbolSearchDialog({ open, onOpenChange }: SymbolSearchDialogProps) {
  const t = useT();
  const { query, results, isSearching, activeSymbol, setQuery, selectSymbol } =
    useSymbolSearch(250);
  const [scope, setScope] = useState<string | null>(() =>
    datafeed.getSearchScope(),
  );
  const sources = datafeed.list();

  // Prime the popular list whenever the dialog opens.
  useEffect(() => {
    if (open) setQuery(query);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const applyScope = (id: string | null) => {
    setScope(id);
    datafeed.setSearchScope(id);
    setQuery(query); // re-run the search through the registry with the new scope
  };

  const chip = (active: boolean) =>
    cn(
      "rounded-full border px-2.5 py-0.5 text-xs transition-colors",
      active
        ? "border-primary/40 bg-primary/15 text-primary"
        : "border-border text-muted-foreground hover:bg-accent",
    );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl p-0" showClose={false}>
        <DialogHeader className="border-b border-border px-4 py-3">
          <DialogTitle className="sr-only">{t("sy.title")}</DialogTitle>
          <div className="flex items-center gap-2">
            <Search className="size-4 shrink-0 text-muted-foreground" />
            <Input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("sy.searchPh")}
              className="h-8 border-0 px-0 shadow-none focus-visible:ring-0"
            />
            {isSearching && (
              <Loader2 className="size-4 animate-spin text-muted-foreground" />
            )}
          </div>
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <button
              type="button"
              onClick={() => applyScope(null)}
              className={chip(scope === null)}
            >
              {t("sy.all")}
            </button>
            {sources.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => applyScope(s.id)}
                className={chip(scope === s.id)}
              >
                {s.label}
              </button>
            ))}
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[55vh]" viewportClassName="px-2 pb-2">
          {results.length === 0 ? (
            <div className="px-3 py-10 text-center text-sm text-muted-foreground">
              {isSearching ? t("sy.searching") : t("sy.empty")}
            </div>
          ) : (
            <ul className="py-1">
              {results.map((sym) => {
                const isActive = sym.ticker === activeSymbol?.ticker;
                return (
                  <li key={`${sym.source ?? ""}:${sym.ticker}`}>
                    <button
                      onClick={() => {
                        selectSymbol(sym);
                        onOpenChange(false);
                      }}
                      className={cn(
                        "flex w-full items-center justify-between gap-3 rounded-md px-3 py-2 text-start transition-colors hover:bg-accent",
                        isActive && "bg-primary/10",
                      )}
                    >
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium">
                          {sym.ticker}
                        </div>
                        {typeof sym.name === "string" && (
                          <div className="truncate text-xs text-muted-foreground">
                            {sym.name}
                          </div>
                        )}
                      </div>
                      <Badge variant="outline" className="shrink-0">
                        {String(sym.exchange ?? sym.source ?? "")}
                      </Badge>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
