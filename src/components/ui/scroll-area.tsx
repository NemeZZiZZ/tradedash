import * as React from "react";
import { ScrollArea as BaseScrollArea } from "@base-ui-components/react/scroll-area";
import { cn } from "@/lib/utils";

function ScrollArea({
  className,
  children,
  viewportClassName,
  ...props
}: React.ComponentProps<typeof BaseScrollArea.Root> & {
  viewportClassName?: string;
}) {
  return (
    <BaseScrollArea.Root
      className={cn("relative overflow-hidden", className)}
      {...props}
    >
      <BaseScrollArea.Viewport
        className={cn(
          "h-full w-full overscroll-contain outline-none",
          viewportClassName,
        )}
      >
        {children}
      </BaseScrollArea.Viewport>
      <BaseScrollArea.Scrollbar
        orientation="vertical"
        className="m-0.5 flex w-1.5 justify-center rounded opacity-0 transition-opacity delay-300 data-[hovering]:opacity-100 data-[hovering]:delay-0 data-[scrolling]:opacity-100 data-[scrolling]:delay-0"
      >
        <BaseScrollArea.Thumb className="w-full rounded bg-muted-foreground/40" />
      </BaseScrollArea.Scrollbar>
      <BaseScrollArea.Scrollbar
        orientation="horizontal"
        className="m-0.5 flex h-1.5 flex-col justify-center rounded opacity-0 transition-opacity delay-300 data-[hovering]:opacity-100 data-[hovering]:delay-0 data-[scrolling]:opacity-100 data-[scrolling]:delay-0"
      >
        <BaseScrollArea.Thumb className="h-full rounded bg-muted-foreground/40" />
      </BaseScrollArea.Scrollbar>
    </BaseScrollArea.Root>
  );
}

export { ScrollArea };
