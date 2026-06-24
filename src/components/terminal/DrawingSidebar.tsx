import { useDrawingTools } from "react-klinecharts-ui";
import { useT } from "@/i18n";
import {
  Slash,
  Route,
  Hexagon,
  Activity,
  Waves,
  Magnet,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  Trash2,
  Ruler,
  TrendingUp,
  Paintbrush,
  MousePointer2,
  Repeat,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Tooltip } from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  singleLine: Slash,
  moreLine: Route,
  polygon: Hexagon,
  fibonacci: Activity,
  wave: Waves,
  measure: Ruler,
  position: TrendingUp,
  annotation: Paintbrush,
};

const CATEGORY_KEYS: Record<string, string> = {
  singleLine: "draw.cat.singleLine",
  moreLine: "draw.cat.moreLine",
  polygon: "draw.cat.polygon",
  fibonacci: "draw.cat.fibonacci",
  wave: "draw.cat.wave",
  measure: "draw.cat.measure",
  position: "draw.cat.position",
  annotation: "draw.cat.annotation",
};

export function DrawingSidebar() {
  const t = useT();
  const {
    categories,
    activeTool,
    magnetMode,
    isLocked,
    isVisible,
    autoRetrigger,
    selectTool,
    clearActiveTool,
    setMagnetMode,
    toggleLock,
    toggleVisibility,
    removeAllDrawings,
    setAutoRetrigger,
  } = useDrawingTools();

  return (
    <div className="flex w-10 flex-col items-center gap-0.5 border-e border-border bg-card py-1 overflow-x-clip overflow-y-auto [&::-webkit-scrollbar-thumb]:rounded [&::-webkit-scrollbar-thumb]:bg-muted-foreground/30 [&::-webkit-scrollbar]:w-1">
      <Tooltip content={t("draw.cursor")} side="right">
        <Button
          variant={activeTool === null ? "secondary" : "ghost"}
          size="icon-sm"
          className="shrink-0"
          onClick={clearActiveTool}
        >
          <MousePointer2 className="size-4" />
        </Button>
      </Tooltip>

      <Separator className="my-1 w-5 shrink-0" />

      {categories.map((category) => {
        const Icon = CATEGORY_ICONS[category.key] ?? Slash;
        const label = CATEGORY_KEYS[category.key]
          ? t(CATEGORY_KEYS[category.key])
          : category.key;
        const hasActive = category.tools.some((t) => t.name === activeTool);

        if (category.tools.length === 1) {
          const tool = category.tools[0];
          return (
            <Tooltip key={category.key} content={label} side="right">
              <Button
                variant={hasActive ? "secondary" : "ghost"}
                size="icon-sm"
                className="shrink-0"
                onClick={() => selectTool(tool.name)}
              >
                <Icon className="size-4" />
              </Button>
            </Tooltip>
          );
        }

        return (
          <Popover key={category.key}>
            <PopoverTrigger
              render={
                <Button
                  variant={hasActive ? "secondary" : "ghost"}
                  size="icon-sm"
                  className="shrink-0"
                >
                  <Icon className="size-4" />
                </Button>
              }
            />
            <PopoverContent
              side="right"
              align="start"
              className="w-auto min-w-44 p-1"
            >
              <div className="mb-1 px-2 pt-1 text-xs font-medium text-muted-foreground">
                {label}
              </div>
              <ScrollArea className="max-h-[60vh]" viewportClassName="pe-1">
                {category.tools.map((tool) => (
                  <button
                    key={tool.name}
                    onClick={() => selectTool(tool.name)}
                    className={cn(
                      "flex w-full items-center rounded-sm px-2 py-1.5 text-sm capitalize transition-colors hover:bg-accent",
                      activeTool === tool.name && "bg-primary/10 text-primary",
                    )}
                  >
                    {tool.name.replace(/([A-Z])/g, " $1").trim()}
                  </button>
                ))}
              </ScrollArea>
            </PopoverContent>
          </Popover>
        );
      })}

      <Separator className="my-1 w-5 shrink-0" />

      <Tooltip
        content={t("draw.magnet", { mode: t(`magnet.${magnetMode}`) })}
        side="right"
      >
        <Button
          variant="ghost"
          size="icon-sm"
          className={cn(
            "shrink-0",
            magnetMode === "strong"
              ? "bg-primary/30"
              : magnetMode === "weak"
                ? "bg-primary/15"
                : "",
          )}
          onClick={() =>
            setMagnetMode(
              magnetMode === "normal"
                ? "weak"
                : magnetMode === "weak"
                  ? "strong"
                  : "normal",
            )
          }
        >
          <Magnet className="size-4" />
        </Button>
      </Tooltip>

      <Tooltip
        content={autoRetrigger ? t("draw.autoOn") : t("draw.autoOff")}
        side="right"
      >
        <Button
          variant={autoRetrigger ? "secondary" : "ghost"}
          size="icon-sm"
          className="shrink-0"
          onClick={() => setAutoRetrigger(!autoRetrigger)}
        >
          <Repeat className="size-4" />
        </Button>
      </Tooltip>

      <Tooltip
        content={isLocked ? t("draw.unlock") : t("draw.lock")}
        side="right"
      >
        <Button
          variant={isLocked ? "secondary" : "ghost"}
          size="icon-sm"
          className="shrink-0"
          onClick={toggleLock}
        >
          {isLocked ? (
            <Lock className="size-4" />
          ) : (
            <Unlock className="size-4" />
          )}
        </Button>
      </Tooltip>

      <Tooltip
        content={isVisible ? t("draw.hide") : t("draw.show")}
        side="right"
      >
        <Button
          variant="ghost"
          size="icon-sm"
          className="shrink-0"
          onClick={toggleVisibility}
        >
          {isVisible ? (
            <Eye className="size-4" />
          ) : (
            <EyeOff className="size-4" />
          )}
        </Button>
      </Tooltip>

      <Tooltip content={t("draw.removeAll")} side="right">
        <Button
          variant="ghost"
          size="icon-sm"
          className="shrink-0"
          onClick={removeAllDrawings}
        >
          <Trash2 className="size-4" />
        </Button>
      </Tooltip>
    </div>
  );
}
