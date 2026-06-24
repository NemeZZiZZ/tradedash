import { useReplay } from "react-klinecharts-ui";
import type { ReplaySpeed } from "react-klinecharts-ui";
import { Play, Pause, SkipBack, SkipForward, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useT } from "@/i18n";

const SPEEDS: ReplaySpeed[] = [1, 2, 5, 10];

/** Bottom playback bar, visible only while a replay session is active. */
export function ReplayControls() {
  const t = useT();
  const {
    isReplaying,
    isPaused,
    speed,
    barIndex,
    totalBars,
    stopReplay,
    togglePause,
    stepForward,
    stepBackward,
    seekTo,
    setSpeed,
  } = useReplay();

  if (!isReplaying) return null;

  return (
    <div className="flex h-10 shrink-0 items-center gap-2 border-t border-border bg-card px-3">
      <Button variant="ghost" size="icon-sm" onClick={stepBackward} aria-label={t("rp.back")}>
        <SkipBack className="size-4" />
      </Button>
      <Button variant="secondary" size="icon-sm" onClick={togglePause} aria-label={t("rp.playPause")}>
        {isPaused ? <Play className="size-4" /> : <Pause className="size-4" />}
      </Button>
      <Button variant="ghost" size="icon-sm" onClick={stepForward} aria-label={t("rp.forward")}>
        <SkipForward className="size-4" />
      </Button>

      <input
        type="range"
        min={0}
        max={Math.max(0, totalBars - 1)}
        value={barIndex}
        onChange={(e) => seekTo(Number(e.target.value))}
        className="h-1 flex-1 cursor-pointer accent-primary"
      />

      <span className="w-24 shrink-0 text-end font-mono text-xs tabular-nums text-muted-foreground">
        {barIndex + 1} / {totalBars}
      </span>

      <div className="flex items-center gap-0.5">
        {SPEEDS.map((s) => (
          <Button
            key={s}
            variant="ghost"
            size="sm"
            onClick={() => setSpeed(s)}
            className={cn("px-2", speed === s && "text-primary")}
          >
            {s}×
          </Button>
        ))}
      </div>

      <Button variant="ghost" size="icon-sm" onClick={stopReplay} aria-label={t("rp.stop")}>
        <Square className="size-4" />
      </Button>
    </div>
  );
}
