import { useEffect } from "react";
import {
  KlinechartsUIProvider,
  useKlinechartsUI,
  useKlinechartsUITheme,
  useKlinechartsUILoading,
  useFullscreen,
  WorkspaceProvider,
  DEFAULT_PERIODS,
} from "react-klinecharts-ui";
import type { PartialSymbolInfo, TerminalPeriod, ChartCell, SyncChannel } from "react-klinecharts-ui";
import { PanelLeft } from "lucide-react";
import { datafeed, defaultSymbol } from "@/datafeed";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tooltip } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useI18n, useT, chartLocale } from "@/i18n";
import { useSyncTheme } from "@/hooks/use-sync-theme";
import {
  loadPersisted,
  savePersisted,
  usePersistentState,
} from "@/hooks/use-persistent-state";
import { orderLineOverlay } from "@/lib/order-line-overlay";
import { Toolbar } from "./Toolbar";
import { DrawingSidebar } from "./DrawingSidebar";
import { ChartView } from "./ChartView";
import { ChartSyncBridge } from "./ChartSyncBridge";
import { SecondaryCell } from "./SecondaryCell";
import { RightDock } from "./RightDock";
import { StatusBar } from "./StatusBar";
import { KeyboardShortcuts } from "./KeyboardShortcuts";
import { ReplayControls } from "./ReplayControls";
import { TerminalActionsProvider } from "./actions";
import { useWorkspaceConfig, layoutById, seedCell, type GridLayoutId } from "./workspace";

function TerminalLayout() {
  const t = useT();
  const { lang } = useI18n();
  const { containerRef } = useFullscreen();
  const { dispatch } = useKlinechartsUI();
  const { theme } = useKlinechartsUITheme();
  const { isLoading } = useKlinechartsUILoading();
  const [showDrawing, setShowDrawing] = usePersistentState("panel.drawing", true);
  const [config, setConfig] = useWorkspaceConfig();
  const layout = layoutById(config.layoutId);

  useSyncTheme(theme);

  // Keep the chart's locale in sync with the app language.
  useEffect(() => {
    dispatch({ type: "SET_LOCALE", locale: chartLocale(lang) });
  }, [lang, dispatch]);

  // Grow/shrink the secondary cells to match the chosen layout (primary is
  // always cell 0, rendered by the main provider; secondaries are extras).
  useEffect(() => {
    const needed = Math.max(0, layout.cells - 1);
    if (config.extraCells.length === needed) return;
    setConfig((c) => {
      const cur = c.extraCells;
      if (cur.length > needed) return { ...c, extraCells: cur.slice(0, needed) };
      const addition: ChartCell[] = [];
      for (let i = cur.length; i < needed; i++) addition.push(seedCell());
      return { ...c, extraCells: [...cur, ...addition] };
    });
  }, [layout.cells, config.extraCells.length, setConfig]);

  const setLayout = (id: GridLayoutId) => setConfig((c) => ({ ...c, layoutId: id }));
  void setLayout;

  return (
    <div
      ref={containerRef as React.RefObject<HTMLDivElement>}
      className="flex h-svh flex-col bg-background text-foreground"
    >
      <TerminalActionsProvider>
        <header className="flex h-10 shrink-0 items-center gap-0.5 border-b border-border px-1">
          <Tooltip content={t("toolbar.drawingTools")}>
            <Button
              variant={showDrawing ? "secondary" : "ghost"}
              size="icon-sm"
              onClick={() => setShowDrawing((v) => !v)}
            >
              <PanelLeft className="size-4" />
            </Button>
          </Tooltip>
          <Separator orientation="vertical" className="mx-1 h-5" />
          <Toolbar layoutId={config.layoutId} onLayoutChange={setLayout} />
        </header>

        <div className="flex flex-1 overflow-hidden">
          {showDrawing && <DrawingSidebar />}

          <div className="relative z-0 min-w-0 flex-1">
            <div
              className="grid h-full min-h-0"
              style={{ gridTemplateColumns: layout.cols, gridTemplateRows: layout.rows }}
            >
              {/* Primary cell — uses the main KlinechartsUIProvider above. */}
              <div className="relative min-h-0 overflow-hidden [&:not(:last-child)]:border-r [&:not(:nth-last-child(-n+2))]:border-b border-border/40">
                <ChartSyncBridge cellId="primary" />
                <ChartView className="absolute inset-0" />
                {isLoading && (
                  <span className="pointer-events-none absolute left-1/2 top-1/2 size-8 -translate-x-1/2 -translate-y-1/2 animate-spin rounded-full border-4 border-muted border-t-primary" />
                )}
              </div>
              {/* Secondary cells — each its own provider, synced via workspace. */}
              {config.extraCells.map((cell) => (
                <SecondaryCell
                  key={cell.id}
                  cell={cell}
                  onRemove={() =>
                    setConfig((c) => ({
                      layoutId: c.layoutId,
                      extraCells: c.extraCells.filter((x) => x.id !== cell.id),
                    }))
                  }
                />
              ))}
            </div>
          </div>

          <RightDock />
        </div>

        <ReplayControls />
        <StatusBar />
        <KeyboardShortcuts />
      </TerminalActionsProvider>
    </div>
  );
}

/** Resolve the persisted period label back to a full TerminalPeriod. */
function initialPeriod(): TerminalPeriod {
  const label = loadPersisted<string | null>("period", null);
  return DEFAULT_PERIODS.find((p) => p.label === label) ?? DEFAULT_PERIODS[0];
}

export function TradingTerminal({ className }: { className?: string }) {
  const { lang } = useI18n();
  const initialSymbol = loadPersisted<PartialSymbolInfo>("symbol", defaultSymbol);
  const initialTheme = loadPersisted<string>("theme", "dark");
  // Default sync config: all channels on (fully-linked workspace).
  const sync: Record<SyncChannel, boolean> = {
    crosshair: true,
    scroll: true,
    zoom: true,
    symbol: true,
    period: true,
  };

  return (
    <div className={cn(className)}>
      <WorkspaceProvider
        defaultCells={[{ id: "primary", symbol: initialSymbol, period: initialPeriod() }]}
        sync={sync}
      >
        <KlinechartsUIProvider
          datafeed={datafeed}
          defaultSymbol={initialSymbol}
          defaultPeriod={initialPeriod()}
          defaultTheme={initialTheme}
          defaultLocale={chartLocale(lang)}
          defaultMainIndicators={["MA"]}
          defaultSubIndicators={["VOL"]}
          storage={{}}
          overlays={[orderLineOverlay]}
          onSymbolChange={(s) => savePersisted("symbol", s)}
          onPeriodChange={(p) => savePersisted("period", p.label)}
          onThemeChange={(t) => savePersisted("theme", t)}
        >
          <TooltipProvider delay={0}>
            <TerminalLayout />
          </TooltipProvider>
        </KlinechartsUIProvider>
      </WorkspaceProvider>
    </div>
  );
}
