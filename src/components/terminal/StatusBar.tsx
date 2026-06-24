import { useEffect, useState } from "react";
import { useKlinechartsUI, useDrawingTools, useMeasure } from "react-klinecharts-ui";
import { CrosshairDataPanel } from "./CrosshairDataPanel";
import { useT } from "@/i18n";
import { cn, formatPercent } from "@/lib/utils";

/** Live clock in the chart's selected timezone. */
function Clock({ timeZone }: { timeZone: string }) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  let text: string;
  try {
    text = new Intl.DateTimeFormat("ru-RU", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      timeZone,
    }).format(now);
  } catch {
    text = now.toLocaleTimeString("ru-RU");
  }
  return (
    <span className="font-mono tabular-nums" title={timeZone}>
      {text} <span className="text-muted-foreground/60">UTC</span>
    </span>
  );
}

/** Bottom status bar: symbol, period, crosshair OHLCV, active tool, hints, clock. */
export function StatusBar() {
  const t = useT();
  const { state } = useKlinechartsUI();
  const { activeTool, autoRetrigger } = useDrawingTools();
  const { isActive: measuring, result: measure } = useMeasure();

  return (
    <footer className="flex h-6 shrink-0 items-center gap-2 border-t border-border bg-card px-2 text-xs text-muted-foreground">
      <span className="font-medium text-foreground">{state.symbol?.ticker ?? "—"}</span>
      <span>{state.period?.label ?? ""}</span>
      <div className="mx-1 h-3 w-px bg-border" />
      <CrosshairDataPanel />
      <div className="flex-1" />

      {measure && (
        <span
          className={cn(
            "rounded px-1.5 py-0.5 tabular-nums",
            measure.pricePercent >= 0 ? "bg-bull/15 text-bull" : "bg-bear/15 text-bear",
          )}
        >
          {formatPercent(measure.pricePercent)} · {measure.bars} {t("sb.bars")} ·{" "}
          {measure.priceDiff.toFixed(2)}
        </span>
      )}
      {measuring && !measure && (
        <span className="text-primary">{t("sb.measureHint")}</span>
      )}
      {activeTool ? (
        <span className="rounded bg-primary/10 px-1.5 py-0.5 capitalize text-primary">
          {activeTool}
          {autoRetrigger && t("sb.auto")}
        </span>
      ) : (
        <span className="text-muted-foreground/60 max-md:hidden">{t("sb.escHint")}</span>
      )}

      <div className="mx-1 h-3 w-px bg-border" />
      <Clock timeZone={state.timezone} />
    </footer>
  );
}
