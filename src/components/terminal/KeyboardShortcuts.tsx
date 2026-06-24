import { useEffect } from "react";
import {
  usePeriods,
  useDrawingTools,
  useKlinechartsUITheme,
  useFullscreen,
  useReplay,
  useMeasure,
} from "react-klinecharts-ui";
import { useTerminalActions } from "./actions";

/** True when focus is in an editable field — keystrokes must pass through. */
function inEditable(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  if (!el) return false;
  const tag = el.tagName;
  return (
    tag === "INPUT" ||
    tag === "TEXTAREA" ||
    tag === "SELECT" ||
    el.isContentEditable
  );
}

/**
 * App-wide keyboard shortcuts. Single-key bindings are ignored while typing in
 * an input. Undo/redo (Ctrl+Z / Ctrl+Y) are handled inside `useUndoRedo`, and
 * the command palette (Ctrl/Cmd+K) inside the actions provider.
 */
export function KeyboardShortcuts() {
  const { periods, setPeriod } = usePeriods();
  const { activeTool, clearActiveTool } = useDrawingTools();
  const { toggleTheme } = useKlinechartsUITheme();
  const { toggle: toggleFullscreen } = useFullscreen();
  const { startReplay } = useReplay();
  const { startMeasure } = useMeasure();
  const { open } = useTerminalActions();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Escape always works (exit the active drawing tool).
      if (e.key === "Escape" && activeTool) {
        clearActiveTool();
        return;
      }
      // Don't hijack modifier combos or typing in fields.
      if (e.ctrlKey || e.metaKey || e.altKey || inEditable(e.target)) return;

      // Digits 1–9 / 0 → select timeframe by position.
      if (/^[0-9]$/.test(e.key)) {
        const idx = e.key === "0" ? 9 : Number(e.key) - 1;
        const period = periods[idx];
        if (period) {
          e.preventDefault();
          setPeriod(period);
        }
        return;
      }

      const map: Record<string, () => void> = {
        "/": () => open("symbol"),
        i: () => open("indicators"),
        o: () => open("orderLines"),
        a: () => open("alerts"),
        c: () => open("compare"),
        n: () => open("annotations"),
        l: () => open("layouts"),
        g: () => open("settings"),
        z: () => open("timezone"),
        e: () => open("script"),
        m: startMeasure,
        r: startReplay,
        t: toggleTheme,
        f: toggleFullscreen,
      };
      const fn = map[e.key.toLowerCase()];
      if (fn) {
        e.preventDefault();
        fn();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [
    periods,
    setPeriod,
    activeTool,
    clearActiveTool,
    toggleTheme,
    toggleFullscreen,
    startReplay,
    startMeasure,
    open,
  ]);

  return null;
}
