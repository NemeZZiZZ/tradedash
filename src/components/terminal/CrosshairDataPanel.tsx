import { useCrosshair } from "react-klinecharts-ui";
import { cn, formatCompact } from "@/lib/utils";

function Field({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <span className="flex items-center gap-1">
      <span className="text-muted-foreground/70">{label}</span>
      <span className={cn("tabular-nums", tone)}>{value}</span>
    </span>
  );
}

/** OHLCV readout for the bar under the crosshair. */
export function CrosshairDataPanel() {
  const { barData } = useCrosshair();
  if (!barData) return null;

  const up = barData.close >= barData.open;
  const tone = up ? "text-bull" : "text-bear";

  return (
    <div className="flex items-center gap-2.5 tabular-nums">
      <Field label="O" value={barData.open.toString()} tone={tone} />
      <Field label="H" value={barData.high.toString()} tone={tone} />
      <Field label="L" value={barData.low.toString()} tone={tone} />
      <Field label="C" value={barData.close.toString()} tone={tone} />
      <Field label="V" value={formatCompact(barData.volume)} tone={tone} />
      <span className={cn("tabular-nums", tone)}>
        {barData.change >= 0 ? "+" : ""}
        {barData.change.toFixed(2)} ({barData.changePercent >= 0 ? "+" : ""}
        {barData.changePercent.toFixed(2)}%)
      </span>
    </div>
  );
}
