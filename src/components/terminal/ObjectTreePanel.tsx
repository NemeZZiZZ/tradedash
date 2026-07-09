import { useEffect, useState } from "react";
import {
  useIndicators,
  useOrderLines,
  useAnnotations,
  useAlerts,
  useDrawingTools,
  useKlinechartsUI,
  drawingLabel,
} from "react-klinecharts-ui";
import { useT } from "@/i18n";
import { Eye, EyeOff, Lock, Unlock, Trash2, ChevronDown, ChevronRight, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn, formatPrice } from "@/lib/utils";

interface Row {
  id: string;
  label: string;
  visible?: boolean;
  locked?: boolean;
  onToggleVis?: () => void;
  onToggleLock?: () => void;
  onDel?: () => void;
}

/**
 * TradingView-style object list. Drawings are reactive via the 1.2.0
 * `useDrawingTools().overlays` (no manual polling); indicators/order-lines/
 * annotations/alerts come from their hooks. Order lines have no reactive list
 * in useOrderLines, so they're read from the chart overlays with a light poll.
 */
export function ObjectTreePanel() {
  const t = useT();
  const { mainIndicators, subIndicators, removeMainIndicator, removeSubIndicator, setIndicatorVisible, isIndicatorVisible } = useIndicators();
  const { annotations, removeAnnotation } = useAnnotations();
  const { alerts, removeAlert } = useAlerts();
  const { overlays, removeDrawing, setDrawingVisible, setDrawingLocked } = useDrawingTools();
  const orderRows = useOrderLineRows();

  const drawingRows: Row[] = overlays.map((o) => ({
    id: o.id,
    label: t(drawingLabel(o.name)),
    visible: o.visible,
    locked: o.locked,
    onToggleVis: () => setDrawingVisible(o.id, !o.visible),
    onToggleLock: () => setDrawingLocked(o.id, !o.locked),
    onDel: () => removeDrawing(o.id),
  }));
  const indicatorRows: Row[] = [
    ...mainIndicators
      .filter((i) => i.isActive)
      .map((i) => ({
        id: `main_${i.name}`,
        label: `${i.name} (${t("ot.main")})`,
        visible: isIndicatorVisible(i.name, true),
        onToggleVis: () => setIndicatorVisible(i.name, true, !isIndicatorVisible(i.name, true)),
        onDel: () => removeMainIndicator(i.name),
      })),
    ...subIndicators
      .filter((i) => i.isActive)
      .map((i) => ({
        id: `sub_${i.name}`,
        label: `${i.name} (${t("ot.sub")})`,
        visible: isIndicatorVisible(i.name, false),
        onToggleVis: () => setIndicatorVisible(i.name, false, !isIndicatorVisible(i.name, false)),
        onDel: () => removeSubIndicator(i.name),
      })),
  ];
  const noteRows: Row[] = annotations.map((a) => ({
    id: a.id,
    label: a.text.slice(0, 24) || t("ot.notes"),
    onDel: () => removeAnnotation(a.id),
  }));
  const alertRows: Row[] = alerts.map((a) => ({
    id: a.id,
    label: `${formatPrice(a.price)} ${a.message ?? ""}`.trim(),
    onDel: () => removeAlert(a.id),
  }));

  const groups: { key: string; label: string; rows: Row[] }[] = [
    { key: "drawings", label: t("ot.drawings"), rows: drawingRows },
    { key: "indicators", label: t("ot.indicators"), rows: indicatorRows },
    { key: "orderLines", label: t("ot.orderLines"), rows: orderRows },
    { key: "notes", label: t("ot.notes"), rows: noteRows },
    { key: "alerts", label: t("ot.alerts"), rows: alertRows },
  ];
  const nonEmpty = groups.filter((g) => g.rows.length > 0);

  return (
    <aside className="flex h-full w-full flex-col bg-card">
      <div className="flex h-9 shrink-0 items-center gap-1.5 border-b border-border px-3">
        <Layers className="size-3.5 text-muted-foreground" />
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t("ot.title")}</span>
      </div>
      <ScrollArea className="flex-1">
        {nonEmpty.length === 0 ? (
          <div className="px-3 py-8 text-center text-sm text-muted-foreground">{t("ot.empty")}</div>
        ) : (
          <div className="p-1">
            {nonEmpty.map((g) => (
              <Group key={g.key} label={g.label} rows={g.rows} t={t} />
            ))}
          </div>
        )}
      </ScrollArea>
    </aside>
  );
}

function Group({ label, rows, t }: { label: string; rows: Row[]; t: (k: string) => string }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="mb-1">
      <button
        className="flex w-full items-center gap-1 rounded px-2 py-1 text-xs font-medium hover:bg-accent/50"
        onClick={() => setOpen((o) => !o)}
      >
        {open ? <ChevronDown className="size-3" /> : <ChevronRight className="size-3" />}
        <span>{label}</span>
        <span className="ml-auto text-muted-foreground">{rows.length}</span>
      </button>
      {open &&
        rows.map((r) => (
          <div key={r.id} className="flex items-center gap-1 rounded px-2 py-1 pl-6 text-sm hover:bg-accent/50">
            <span className={cn("min-w-0 flex-1 truncate", r.visible === false && "text-muted-foreground line-through")}>
              {r.label}
            </span>
            {r.onToggleLock && (
              <Button variant="ghost" size="icon-sm" className="h-6 w-6" onClick={r.onToggleLock} title={t("ot.lock")}>
                {r.locked ? <Lock className="size-3.5" /> : <Unlock className="size-3.5" />}
              </Button>
            )}
            {r.onToggleVis && (
              <Button variant="ghost" size="icon-sm" className="h-6 w-6" onClick={r.onToggleVis} title={t("ot.toggleVis")}>
                {r.visible === false ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
              </Button>
            )}
            {r.onDel && (
              <Button variant="ghost" size="icon-sm" className="h-6 w-6" onClick={r.onDel} title={t("ot.delete")}>
                <Trash2 className="size-3.5" />
              </Button>
            )}
          </div>
        ))}
    </div>
  );
}

/** Order lines have no reactive list in useOrderLines; read them from the chart
 *  overlays (name "orderLine") with a light 700ms poll. Only the price/side is
 *  needed for the label. */
function useOrderLineRows(): Row[] {
  const { state } = useKlinechartsUI();
  const { removeOrderLine } = useOrderLines();
  const [lines, setLines] = useState<{ id: string; label: string }[]>([]);
  useEffect(() => {
    const chart = state.chart;
    if (!chart) return;
    const read = () => {
      const all = chart.getOverlays?.() ?? [];
      setLines(
        all
          .filter((o: { name?: string }) => o.name === "orderLine")
          .map((o: { id?: string; points?: { value?: number }[]; extendData?: unknown }) => {
            const side = (o.extendData as { side?: string } | undefined)?.side;
            return {
              id: o.id ?? "?",
              label: `${side === "short" ? "▾" : "▴"} ${formatPrice(o.points?.[0]?.value ?? 0)}`,
            };
          }),
      );
    };
    read();
    const id = setInterval(read, 700);
    return () => clearInterval(id);
  }, [state.chart]);
  return lines.map((l) => ({ ...l, onDel: () => removeOrderLine(l.id) }));
}
