import * as React from "react";
import { Tooltip as BaseTooltip } from "@base-ui-components/react/tooltip";
import { cn } from "@/lib/utils";

const TooltipProvider = BaseTooltip.Provider;
const TooltipRoot = BaseTooltip.Root;
const TooltipTrigger = BaseTooltip.Trigger;

function TooltipContent({
  className,
  side = "top",
  sideOffset = 6,
  children,
  ...props
}: React.ComponentProps<typeof BaseTooltip.Popup> & {
  side?: "top" | "right" | "bottom" | "left";
  sideOffset?: number;
}) {
  return (
    <BaseTooltip.Portal>
      <BaseTooltip.Positioner side={side} sideOffset={sideOffset}>
        <BaseTooltip.Popup
          className={cn(
            "z-50 rounded-md bg-popover px-2 py-1 text-xs text-popover-foreground shadow-md border border-border",
            "origin-[var(--transform-origin)] transition-[transform,opacity] data-[starting-style]:scale-95 data-[starting-style]:opacity-0 data-[ending-style]:scale-95 data-[ending-style]:opacity-0",
            className,
          )}
          {...props}
        >
          {children}
        </BaseTooltip.Popup>
      </BaseTooltip.Positioner>
    </BaseTooltip.Portal>
  );
}

/** Convenience wrapper: pass `content` and children trigger. */
function Tooltip({
  content,
  side,
  children,
}: {
  content: React.ReactNode;
  side?: "top" | "right" | "bottom" | "left";
  children: React.ReactNode;
}) {
  return (
    <TooltipRoot>
      <TooltipTrigger render={children as React.ReactElement<Record<string, unknown>>} />
      <TooltipContent side={side}>{content}</TooltipContent>
    </TooltipRoot>
  );
}

export {
  Tooltip,
  TooltipProvider,
  TooltipRoot,
  TooltipTrigger,
  TooltipContent,
};
