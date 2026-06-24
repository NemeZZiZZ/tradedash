import * as React from "react";
import { cn } from "@/lib/utils";

interface ResizeHandleProps {
  /** Axis of pointer movement: "x" for a vertical bar (width), "y" for a horizontal bar (height). */
  axis: "x" | "y";
  /** Called with the pointer delta (px) since the last move event. */
  onDelta: (delta: number) => void;
  className?: string;
}

/**
 * A thin draggable splitter. Uses window-level pointer listeners so the drag
 * keeps tracking even when the cursor leaves the 1px hit area.
 */
export function ResizeHandle({ axis, onDelta, className }: ResizeHandleProps) {
  const last = React.useRef(0);

  const onPointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    last.current = axis === "x" ? e.clientX : e.clientY;

    const move = (ev: PointerEvent) => {
      const cur = axis === "x" ? ev.clientX : ev.clientY;
      onDelta(cur - last.current);
      last.current = cur;
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    document.body.style.cursor = axis === "x" ? "col-resize" : "row-resize";
    document.body.style.userSelect = "none";
  };

  return (
    <div
      onPointerDown={onPointerDown}
      className={cn(
        "group relative z-10 shrink-0",
        axis === "x" ? "w-1 cursor-col-resize" : "h-1 cursor-row-resize",
        className,
      )}
    >
      <div
        className={cn(
          "absolute bg-border transition-colors group-hover:bg-primary",
          axis === "x"
            ? "inset-y-0 start-0 w-px group-hover:w-0.5"
            : "inset-x-0 top-0 h-px group-hover:h-0.5",
        )}
      />
    </div>
  );
}
