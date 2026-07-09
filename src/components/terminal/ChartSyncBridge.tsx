import { useChartSync } from "react-klinecharts-ui";

/**
 * Registers the surrounding provider's chart with the workspace and mirrors
 * viewport events (crosshair/scroll/zoom) to siblings. Must be rendered inside
 * a KlinechartsUIProvider AND a WorkspaceProvider. Renders nothing.
 */
export function ChartSyncBridge({ cellId }: { cellId: string }) {
  useChartSync({ cellId });
  return null;
}
