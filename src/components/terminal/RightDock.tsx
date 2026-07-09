import { Fragment, useRef } from "react";
import { List, BookOpen, Info, Layers, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip } from "@/components/ui/tooltip";
import { ResizeHandle } from "@/components/ui/resize-handle";
import { usePersistentState } from "@/hooks/use-persistent-state";
import { cn } from "@/lib/utils";
import { useI18n, isRtl } from "@/i18n";
import { WatchlistPanel } from "./WatchlistPanel";
import { OrderBookPanel } from "./OrderBookPanel";
import { SymbolInfoPanel } from "./SymbolInfoPanel";
import { ObjectTreePanel } from "./ObjectTreePanel";

const MIN_WIDTH = 220;
const MAX_WIDTH = 600;
const MIN_SECTION = 110;

const clamp = (v: number, min: number, max: number) =>
  Math.min(Math.max(v, min), Math.max(min, max));

interface SectionDef {
  id: string;
  label: string;
  icon: LucideIcon;
  render: () => React.ReactNode;
}

const SECTIONS: SectionDef[] = [
  {
    id: "watchlist",
    label: "dock.watchlist",
    icon: List,
    render: () => <WatchlistPanel />,
  },
  {
    id: "info",
    label: "dock.info",
    icon: Info,
    render: () => <SymbolInfoPanel />,
  },
  {
    id: "orderbook",
    label: "dock.orderbook",
    icon: BookOpen,
    render: () => <OrderBookPanel />,
  },
  {
    id: "tree",
    label: "ot.title",
    icon: Layers,
    render: () => <ObjectTreePanel />,
  },
];

/**
 * Right-hand dock: a far-right activity bar toggles sections (watchlist /
 * symbol info / order book) that stack vertically in one panel. The panel
 * width and the split between consecutive sections are drag-resizable and
 * persisted.
 */
export function RightDock() {
  const { t, lang } = useI18n();
  const rtl = isRtl(lang);
  const [open, setOpen] = usePersistentState<Record<string, boolean>>(
    "dock.open",
    {
      watchlist: true,
      info: false,
      orderbook: false,
      tree: false,
    },
  );
  const [width, setWidth] = usePersistentState("dock.width", 300);
  const [heights, setHeights] = usePersistentState<Record<string, number>>(
    "dock.heights",
    {},
  );
  const colRef = useRef<HTMLDivElement>(null);

  const openList = SECTIONS.filter((s) => open[s.id]);
  const panelOpen = openList.length > 0;

  const setHeight = (id: string, fn: (h: number) => number) =>
    setHeights((hs) => ({ ...hs, [id]: fn(hs[id] ?? 260) }));

  return (
    <div className="flex h-full">
      {panelOpen && (
        <>
          <ResizeHandle
            axis="x"
            onDelta={(d) =>
              setWidth((w) => clamp(w + (rtl ? d : -d), MIN_WIDTH, MAX_WIDTH))
            }
          />
          <div
            ref={colRef}
            style={{ width }}
            className="flex h-full flex-col overflow-hidden bg-card"
          >
            {openList.map((s, i) => {
              const isLast = i === openList.length - 1;
              return (
                <Fragment key={s.id}>
                  <div
                    style={
                      isLast ? undefined : { height: heights[s.id] ?? 260 }
                    }
                    className={cn(
                      "min-h-0 overflow-hidden",
                      isLast ? "flex-1" : "shrink-0",
                      i > 0 && "border-t border-border",
                    )}
                  >
                    {s.render()}
                  </div>
                  {!isLast && (
                    <ResizeHandle
                      axis="y"
                      onDelta={(d) =>
                        setHeight(s.id, (h) => {
                          const max =
                            (colRef.current?.clientHeight ?? 700) - MIN_SECTION;
                          return clamp(h + d, MIN_SECTION, max);
                        })
                      }
                    />
                  )}
                </Fragment>
              );
            })}
          </div>
        </>
      )}

      <div className="flex w-10 shrink-0 flex-col items-center gap-0.5 border-s border-border bg-card py-1">
        {SECTIONS.map((s) => (
          <Tooltip key={s.id} content={t(s.label)} side={rtl ? "right" : "left"}>
            <Button
              variant={open[s.id] ? "secondary" : "ghost"}
              size="icon-sm"
              onClick={() => setOpen((o) => ({ ...o, [s.id]: !o[s.id] }))}
            >
              <s.icon className="size-4" />
            </Button>
          </Tooltip>
        ))}
      </div>
    </div>
  );
}
