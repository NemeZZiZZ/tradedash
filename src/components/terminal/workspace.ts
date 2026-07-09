import type { ChartCell } from "react-klinecharts-ui";
import { loadPersisted } from "@/hooks/use-persistent-state";
import { usePersistentState } from "@/hooks/use-persistent-state";
import { defaultSymbol } from "@/datafeed";

/** Available grid layouts (beyond the always-present primary cell). */
export type GridLayoutId = "single" | "cols2" | "rows2" | "grid4";

export interface GridLayoutDef {
  id: GridLayoutId;
  /** Total cell count INCLUDING the primary cell. */
  cells: number;
  cols: string;
  rows: string;
}

export const LAYOUTS: GridLayoutDef[] = [
  { id: "single", cells: 1, cols: "1fr", rows: "1fr" },
  { id: "cols2", cells: 2, cols: "1fr 1fr", rows: "1fr" },
  { id: "rows2", cells: 2, cols: "1fr", rows: "1fr 1fr" },
  { id: "grid4", cells: 4, cols: "1fr 1fr", rows: "1fr 1fr" },
];

export function layoutById(id: GridLayoutId): GridLayoutDef {
  return LAYOUTS.find((l) => l.id === id) ?? LAYOUTS[0];
}

let cellSeq = 0;
/** A stable, unique cell id for non-primary grid cells. */
export function nextCellId(): string {
  cellSeq += 1;
  return `cell_${Date.now().toString(36)}_${cellSeq}`;
}

/**
 * Persisted workspace config: the chosen layout + the seed symbol/period for
 * non-primary cells. The PRIMARY cell is always driven by the main provider's
 * symbol/period (the one the global chrome controls), so it isn't stored here.
 */
export interface WorkspaceConfig {
  layoutId: GridLayoutId;
  /** Seed for non-primary cells; each gets its own provider. */
  extraCells: ChartCell[];
}

export function useWorkspaceConfig(): readonly [
  WorkspaceConfig,
  (next: WorkspaceConfig | ((prev: WorkspaceConfig) => WorkspaceConfig)) => void,
] {
  const [config, setConfig] = usePersistentState<WorkspaceConfig>("ws.config", {
    layoutId: "single",
    extraCells: [],
  });
  return [config, setConfig] as const;
}

/** Default seed for a new non-primary cell (mirrors the primary's last symbol). */
export function seedCell(): ChartCell {
  const symbol = loadPersisted("symbol", defaultSymbol);
  return {
    id: nextCellId(),
    symbol,
    period: { span: 1, type: "minute", label: "1m" },
  };
}
