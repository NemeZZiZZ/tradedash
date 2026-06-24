import { useMemo, useState } from "react";
import { useIndicators } from "react-klinecharts-ui";
import { useT } from "@/i18n";
import { Search, Check, Settings2, Eye, EyeOff, X, ChevronUp, ChevronDown, Minimize2, Maximize2, Rows2 } from "lucide-react";
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface IndicatorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function ParamsPopover({
  name,
  paneId,
  params,
  onApply,
}: {
  name: string;
  paneId: string;
  params: { label: string; defaultValue: number }[];
  onApply: (paneId: string, values: number[]) => void;
}) {
  const t = useT();
  const [values, setValues] = useState<number[]>(params.map((p) => p.defaultValue));
  if (params.length === 0) {
    return (
      <span className="px-1 text-xs text-muted-foreground">{t("ind.noParams")}</span>
    );
  }
  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button variant="ghost" size="icon-sm" aria-label={t("ind.paramsAria", { name })}>
            <Settings2 className="size-3.5" />
          </Button>
        }
      />
      <PopoverContent side="left" align="start" className="w-56">
        <div className="mb-2 text-sm font-medium">{t("ind.paramsOf", { name })}</div>
        <div className="space-y-2">
          {params.map((p, i) => (
            <label key={p.label} className="flex items-center justify-between gap-2 text-sm">
              <span className="text-muted-foreground">{p.label}</span>
              <Input
                type="number"
                value={values[i]}
                onChange={(e) => {
                  const next = [...values];
                  next[i] = Number(e.target.value);
                  setValues(next);
                }}
                className="h-7 w-20"
              />
            </label>
          ))}
        </div>
        <Button
          size="sm"
          className="mt-3 w-full"
          onClick={() => onApply(paneId, values)}
        >
          {t("ind.apply")}
        </Button>
      </PopoverContent>
    </Popover>
  );
}

export function IndicatorDialog({ open, onOpenChange }: IndicatorDialogProps) {
  const t = useT();
  const ind = useIndicators();
  const [query, setQuery] = useState("");
  const q = query.trim().toUpperCase();

  // Visibility is reactive in the library (v0.5.0): read the source of truth
  // and flip it, no local mirror needed.
  const toggleVisible = (name: string, isMain: boolean) => {
    ind.setIndicatorVisible(name, isMain, !ind.isIndicatorVisible(name, isMain));
  };

  const filteredMain = useMemo(
    () => ind.mainIndicators.filter((i) => i.name.toUpperCase().includes(q)),
    [ind.mainIndicators, q],
  );
  const filteredSub = useMemo(
    () => ind.subIndicators.filter((i) => i.name.toUpperCase().includes(q)),
    [ind.subIndicators, q],
  );

  const activeMain = ind.activeMainIndicators;
  const activeSub = ind.activeSubIndicators; // name -> paneId

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t("ind.title")}</DialogTitle>
          <DialogDescription>
            {t("ind.desc")}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="available">
          <TabsList className="w-full">
            <TabsTrigger value="available">{t("ind.tabCatalog")}</TabsTrigger>
            <TabsTrigger value="active">
              {t("ind.tabActive")} ({activeMain.length + Object.keys(activeSub).length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="available">
            <div className="mb-3 flex items-center gap-2 rounded-md border border-input px-3">
              <Search className="size-4 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("ind.searchPh")}
                className="h-9 border-0 px-0 shadow-none focus-visible:ring-0"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { title: t("ind.onChart"), list: filteredMain, toggle: ind.toggleMainIndicator },
                { title: t("ind.inPanes"), list: filteredSub, toggle: ind.toggleSubIndicator },
              ].map((col) => (
                <section key={col.title} className="min-w-0">
                  <h3 className="mb-1 px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {col.title}
                  </h3>
                  <ScrollArea className="h-72 rounded-md border border-border">
                    <div className="p-1">
                      {col.list.map((i) => (
                        <button
                          key={i.name}
                          onClick={() => col.toggle(i.name)}
                          className={cn(
                            "flex w-full items-center justify-between gap-2 rounded-md px-3 py-2 text-start text-sm transition-colors hover:bg-accent",
                            i.isActive && "text-primary",
                          )}
                        >
                          <span className="font-medium">{i.name}</span>
                          {i.isActive && <Check className="size-4" />}
                        </button>
                      ))}
                    </div>
                  </ScrollArea>
                </section>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="active">
            <ScrollArea className="h-96 rounded-md border border-border">
              <div className="p-1">
                {activeMain.length === 0 && Object.keys(activeSub).length === 0 && (
                  <div className="px-3 py-10 text-center text-sm text-muted-foreground">
                    {t("ind.noActive")}
                  </div>
                )}

                {activeMain.map((name) => (
                  <div
                    key={`m-${name}`}
                    className="flex items-center justify-between gap-1 rounded-md px-3 py-1.5 hover:bg-accent/50"
                  >
                    <span className="text-sm font-medium">{name}</span>
                    <div className="flex items-center gap-0.5">
                      <ParamsPopover
                        name={name}
                        paneId="candle_pane"
                        params={ind.getIndicatorParams(name)}
                        onApply={(paneId, values) =>
                          ind.updateIndicatorParams(name, paneId, values)
                        }
                      />
                      {(() => {
                        const onOwnAxis = !!ind.getIndicatorAxis(name, true);
                        return (
                          <Tooltip content={t("ind.ownAxis")}>
                            <Button
                              variant={onOwnAxis ? "secondary" : "ghost"}
                              size="icon-sm"
                              onClick={() =>
                                ind.bindIndicatorToNewAxis(
                                  name,
                                  true,
                                  onOwnAxis ? undefined : { id: `axis_${name}`, position: "right" },
                                )
                              }
                            >
                              <Rows2 className="size-3.5" />
                            </Button>
                          </Tooltip>
                        );
                      })()}
                      {(() => {
                        const visible = ind.isIndicatorVisible(name, true);
                        return (
                          <Tooltip content={visible ? t("ind.hide") : t("ind.show")}>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => toggleVisible(name, true)}
                            >
                              {visible ? <Eye className="size-3.5" /> : <EyeOff className="size-3.5" />}
                            </Button>
                          </Tooltip>
                        );
                      })()}
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => ind.removeMainIndicator(name)}
                      >
                        <X className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}

                {Object.entries(activeSub).map(([name, paneId]) => {
                  const collapsed = ind.isSubIndicatorCollapsed(name);
                  return (
                    <div
                      key={`s-${name}`}
                      className="flex items-center justify-between gap-1 rounded-md px-3 py-1.5 hover:bg-accent/50"
                    >
                      <span className="text-sm font-medium">
                        {name} <span className="text-xs text-muted-foreground">{t("ind.pane")}</span>
                      </span>
                      <div className="flex items-center gap-0.5">
                        <ParamsPopover
                          name={name}
                          paneId={paneId}
                          params={ind.getIndicatorParams(name)}
                          onApply={(pid, values) =>
                            ind.updateIndicatorParams(name, pid, values)
                          }
                        />
                        <Tooltip content={t("ind.up")}>
                          <Button variant="ghost" size="icon-sm" onClick={() => ind.reorderSubIndicator(name, "up")}>
                            <ChevronUp className="size-3.5" />
                          </Button>
                        </Tooltip>
                        <Tooltip content={t("ind.down")}>
                          <Button variant="ghost" size="icon-sm" onClick={() => ind.reorderSubIndicator(name, "down")}>
                            <ChevronDown className="size-3.5" />
                          </Button>
                        </Tooltip>
                        <Tooltip content={collapsed ? t("ind.expand") : t("ind.collapse")}>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() =>
                              collapsed ? ind.expandSubIndicator(name) : ind.collapseSubIndicator(name)
                            }
                          >
                            {collapsed ? <Maximize2 className="size-3.5" /> : <Minimize2 className="size-3.5" />}
                          </Button>
                        </Tooltip>
                        <Button variant="ghost" size="icon-sm" onClick={() => ind.removeSubIndicator(name)}>
                          <X className="size-3.5" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
