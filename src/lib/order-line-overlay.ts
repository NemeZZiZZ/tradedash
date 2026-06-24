import { orderLine } from "react-klinecharts-ui";
import type { OverlayTemplate } from "react-klinecharts";

/**
 * The library's `orderLine` overlay with an up/down resize cursor on hover.
 * klinecharts has no per-figure `cursor` style, so we set it via the overlay's
 * mouse enter/leave events. The name stays `"orderLine"`, so `useOrderLines`'
 * `createOrderLine` keeps targeting this template.
 */
export const orderLineOverlay: OverlayTemplate = {
  ...orderLine,
  onMouseEnter: () => {
    document.body.style.cursor = "ns-resize";
    return false;
  },
  onMouseLeave: () => {
    document.body.style.cursor = "";
    return false;
  },
};
