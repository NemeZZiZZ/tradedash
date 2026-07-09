import {
  usePeriods,
  useKlinechartsUI,
  useKlinechartsUITheme,
  useKlinechartsUISettings,
  useFullscreen,
  useSymbolSearch,
  useUndoRedo,
  useDataExport,
  useReplay,
  useMeasure,
} from "react-klinecharts-ui";
import {
  Sun,
  Moon,
  Maximize,
  Minimize,
  Camera,
  Settings,
  BarChart3,
  Globe,
  Search,
  BookOpen,
  ChevronDown,
  Undo2,
  Redo2,
  Clock,
  Check,
  CandlestickChart,
  TrendingUp,
  Bell,
  GitCompareArrows,
  Ruler,
  Play,
  Code2,
  Save,
  Download,
  StickyNote,
  Command as CommandIcon,
  MoreHorizontal,
  CircleDollarSign,
  LayoutGrid,
  Square,
  Columns2,
  Rows2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Tooltip } from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useT } from "@/i18n";
import { usePersistentState } from "@/hooks/use-persistent-state";
import { useTerminalActions } from "./actions";
import { LAYOUTS, type GridLayoutId } from "./workspace";
import type { RoutedSymbolInfo } from "@/datafeed";

export function Toolbar({
  layoutId,
  onLayoutChange,
}: {
  layoutId: GridLayoutId;
  onLayoutChange: (id: GridLayoutId) => void;
}) {
  const t = useT();
  const { state } = useKlinechartsUI();
  const [depthOn, setDepthOn] = usePersistentState("chart.depth", false);
  const depthSupported =
    (state.datafeed as unknown as { supportsDepth?: (s: unknown) => boolean })?.supportsDepth?.(state.symbol ?? {}) ?? false;
  const { periods, activePeriod, setPeriod } = usePeriods();
  const { theme, toggleTheme } = useKlinechartsUITheme();
  const { candleType, candleTypes, setCandleType } = useKlinechartsUISettings();
  const { isFullscreen, toggle: toggleFullscreen } = useFullscreen();
  const { activeSymbol } = useSymbolSearch();
  const { canUndo, canRedo, undo, redo } = useUndoRedo();
  const { startReplay } = useReplay();
  const { startMeasure } = useMeasure();
  const { exportAll } = useDataExport();
  const { open, screenshot, tradeMode, toggleTrade } = useTerminalActions();

  const source =
    (state.symbol as RoutedSymbolInfo | null)?.source ??
    (activeSymbol as RoutedSymbolInfo | undefined)?.source;

  const isActivePeriod = (p: (typeof periods)[number]) =>
    activePeriod.span === p.span && activePeriod.type === p.type;

  return (
    <>
      {/* Layout selector (1 / 2 cols / 2 rows / 2×2). */}
      <DropdownMenu>
        <Tooltip content={t("ws.layout")}>
          <DropdownMenuTrigger
            render={
              <Button variant="ghost" size="icon-sm">
                <LayoutGrid className="size-4" />
              </Button>
            }
          />
        </Tooltip>
        <DropdownMenuContent align="start">
          <DropdownMenuLabel>{t("ws.layout")}</DropdownMenuLabel>
          {LAYOUTS.map((l) => {
            const Icon = l.id === "single" ? Square : l.id === "cols2" ? Columns2 : l.id === "rows2" ? Rows2 : LayoutGrid;
            return (
              <DropdownMenuItem key={l.id} onClick={() => onLayoutChange(l.id)}>
                {layoutId === l.id ? <Check className="size-3.5" /> : <Icon className="size-3.5" />}
                {t(`ws.${l.id}`)}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>

      <Separator orientation="vertical" className="mx-1 h-5" />

      <Button
        variant="ghost"
        size="sm"
        onClick={() => open("symbol")}
        className="gap-1.5 font-semibold"
      >
        <Search className="size-3.5 text-muted-foreground" />
        <span>{String(activeSymbol?.ticker ?? state.symbol?.ticker ?? t("toolbar.symbol"))}</span>
        {source && (
          <Badge variant="secondary" className="font-normal">
            {source}
          </Badge>
        )}
        <ChevronDown className="size-3 text-muted-foreground" />
      </Button>

      <Separator orientation="vertical" className="mx-1 h-5" />

      {/* Periods */}
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button variant="ghost" size="sm" className="gap-1 xl:hidden">
              <Clock className="size-3.5 text-muted-foreground" />
              <span>{activePeriod.label}</span>
              <ChevronDown className="size-3 text-muted-foreground" />
            </Button>
          }
        />
        <DropdownMenuContent align="start">
          {periods.map((period) => (
            <DropdownMenuItem key={period.label} onClick={() => setPeriod(period)}>
              {isActivePeriod(period) && <Check className="size-3.5" />}
              {period.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      <div className="hidden items-center gap-0.5 xl:flex">
        {periods.map((period) => (
          <Button
            key={period.label}
            variant={isActivePeriod(period) ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setPeriod(period)}
          >
            {period.label}
          </Button>
        ))}
      </div>

      <Separator orientation="vertical" className="mx-1 h-5" />

      {/* Chart type */}
      <DropdownMenu>
        <Tooltip content={t("toolbar.chartType")}>
          <DropdownMenuTrigger
            render={
              <Button variant="ghost" size="sm" className="gap-1">
                <CandlestickChart className="size-4" />
                <ChevronDown className="size-3 text-muted-foreground" />
              </Button>
            }
          />
        </Tooltip>
        <DropdownMenuContent align="start">
          <DropdownMenuLabel>{t("toolbar.chartType")}</DropdownMenuLabel>
          {candleTypes.map((c) => (
            <DropdownMenuItem key={c.key} onClick={() => setCandleType(c.key)}>
              {candleType === c.key ? (
                <Check className="size-3.5" />
              ) : (
                <span className="size-3.5" />
              )}
              <span>{t(`candle.${c.key}`)}</span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <Tooltip content={t("toolbar.indicators")}>
        <Button variant="ghost" size="sm" onClick={() => open("indicators")}>
          <BarChart3 className="size-4" />
          <span className="hidden lg:inline">{t("toolbar.indicators")}</span>
        </Button>
      </Tooltip>

      {/* Depth-of-market overlay toggle */}
      <Tooltip content={depthSupported ? t("ws.depth") : t("ws.depthUnsupported")}>
        <Button
          variant={depthOn && depthSupported ? "secondary" : "ghost"}
          size="icon-sm"
          disabled={!depthSupported}
          onClick={() => setDepthOn((v) => !v)}
        >
          <BookOpen className="size-4" />
        </Button>
      </Tooltip>

      {/* Tools overflow menu */}
      <DropdownMenu>
        <Tooltip content={t("toolbar.tools")}>
          <DropdownMenuTrigger
            render={
              <Button variant="ghost" size="sm" className="gap-1">
                <MoreHorizontal className="size-4" />
                <span className="hidden lg:inline">{t("toolbar.tools")}</span>
              </Button>
            }
          />
        </Tooltip>
        <DropdownMenuContent align="start" className="min-w-52">
          <DropdownMenuItem onClick={() => open("orderLines")}>
            <TrendingUp className="size-4" /> {t("tools.orderLines")}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => open("alerts")}>
            <Bell className="size-4" /> {t("tools.alerts")}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => open("compare")}>
            <GitCompareArrows className="size-4" /> {t("tools.compare")}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => open("annotations")}>
            <StickyNote className="size-4" /> {t("tools.annotations")}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={startMeasure}>
            <Ruler className="size-4" /> {t("tools.measure")}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={startReplay}>
            <Play className="size-4" /> {t("tools.replay")}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => open("script")}>
            <Code2 className="size-4" /> {t("tools.script")}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => open("layouts")}>
            <Save className="size-4" /> {t("tools.layouts")}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => open("timezone")}>
            <Globe className="size-4" /> {t("tools.timezone")}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => exportAll("csv")}>
            <Download className="size-4" /> {t("tools.exportCsv")}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => exportAll("json")}>
            <Download className="size-4" /> {t("tools.exportJson")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Tooltip content={t("toolbar.settings")}>
        <Button variant="ghost" size="icon-sm" onClick={() => open("settings")}>
          <Settings className="size-4" />
        </Button>
      </Tooltip>

      <div className="flex-1" />

      <Tooltip content={t("toolbar.commandPalette")}>
        <Button variant="ghost" size="icon-sm" className="max-md:hidden" onClick={() => open("command")}>
          <CommandIcon className="size-4" />
        </Button>
      </Tooltip>

      <Tooltip content={t("toolbar.undo")}>
        <Button variant="ghost" size="icon-sm" className="max-lg:hidden" onClick={undo} disabled={!canUndo}>
          <Undo2 className="size-4" />
        </Button>
      </Tooltip>
      <Tooltip content={t("toolbar.redo")}>
        <Button variant="ghost" size="icon-sm" className="max-lg:hidden" onClick={redo} disabled={!canRedo}>
          <Redo2 className="size-4" />
        </Button>
      </Tooltip>

      <Separator orientation="vertical" className="mx-1 h-5 max-lg:hidden" />

      <Tooltip content={t("toolbar.screenshot")}>
        <Button variant="ghost" size="icon-sm" onClick={screenshot}>
          <Camera className="size-4" />
        </Button>
      </Tooltip>
      <Tooltip content={t("toolbar.theme")}>
        <Button variant="ghost" size="icon-sm" onClick={toggleTheme}>
          {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
        </Button>
      </Tooltip>
      <Tooltip content={t("toolbar.fullscreen")}>
        <Button variant="ghost" size="icon-sm" onClick={toggleFullscreen}>
          {isFullscreen ? <Minimize className="size-4" /> : <Maximize className="size-4" />}
        </Button>
      </Tooltip>

      <Separator orientation="vertical" className="mx-1 h-5 max-xl:hidden" />

      <Tooltip content={t("toolbar.tradeMode")}>
        <Button
          variant={tradeMode ? "default" : "secondary"}
          size="sm"
          onClick={toggleTrade}
          className="ml-1 gap-1.5"
        >
          <CircleDollarSign className="size-4" />
          <span className="max-md:hidden">{t("toolbar.trade")}</span>
        </Button>
      </Tooltip>
    </>
  );
}
