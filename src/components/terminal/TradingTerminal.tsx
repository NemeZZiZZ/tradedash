import { useEffect } from "react";
import {
  KlinechartsUIProvider,
  useKlinechartsUI,
  useKlinechartsUITheme,
  useKlinechartsUILoading,
  useFullscreen,
  DEFAULT_PERIODS,
} from "react-klinecharts-ui";
import type { PartialSymbolInfo, TerminalPeriod } from "react-klinecharts-ui";
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
import { RightDock } from "./RightDock";
import { StatusBar } from "./StatusBar";
import { KeyboardShortcuts } from "./KeyboardShortcuts";
import { ReplayControls } from "./ReplayControls";
import { TerminalActionsProvider } from "./actions";

function TerminalLayout() {
  const t = useT();
  const { lang } = useI18n();
  const { containerRef } = useFullscreen();
  const { dispatch } = useKlinechartsUI();
  const { theme } = useKlinechartsUITheme();
  const { isLoading } = useKlinechartsUILoading();
  const [showDrawing, setShowDrawing] = usePersistentState("panel.drawing", true);

  useSyncTheme(theme);

  // Keep the chart's locale in sync with the app language.
  useEffect(() => {
    dispatch({ type: "SET_LOCALE", locale: chartLocale(lang) });
  }, [lang, dispatch]);

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
          <Toolbar />
        </header>

        <div className="flex flex-1 overflow-hidden">
          {showDrawing && <DrawingSidebar />}

          <div className="relative z-0 min-w-0 flex-1">
            <ChartView className="absolute inset-0" />
            {isLoading && (
              <span className="pointer-events-none absolute left-1/2 top-1/2 size-8 -translate-x-1/2 -translate-y-1/2 animate-spin rounded-full border-4 border-muted border-t-primary" />
            )}
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

  return (
    <div className={cn(className)}>
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
    </div>
  );
}
