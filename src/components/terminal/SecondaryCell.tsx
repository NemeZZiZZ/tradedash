import { KlinechartsUIProvider } from "react-klinecharts-ui";
import type { ChartCell } from "react-klinecharts-ui";
import { orderLineOverlay } from "@/lib/order-line-overlay";
import { datafeed } from "@/datafeed";
import { chartLocale } from "@/i18n";
import { useI18n } from "@/i18n";
import { loadPersisted } from "@/hooks/use-persistent-state";
import { ChartSyncBridge } from "./ChartSyncBridge";
import { SecondaryChartView } from "./SecondaryChartView";
import { SecondaryToolbar } from "./SecondaryToolbar";

/**
 * A non-primary grid cell. Has its own KlinechartsUIProvider (own indicators /
 * drawings), a ChartSyncBridge so the workspace mirrors its viewport, a compact
 * symbol/period toolbar, and a chart canvas. Drawings/indicators here are
 * independent of the primary cell.
 */
export function SecondaryCell({
  cell,
  onRemove,
}: {
  cell: ChartCell;
  onRemove: () => void;
}) {
  const { lang } = useI18n();
  const theme = loadPersisted<string>("theme", "dark");

  return (
    <div className="flex h-full min-h-0 flex-col border-l border-t border-border/40">
      <KlinechartsUIProvider
        key={cell.id}
        datafeed={datafeed}
        defaultSymbol={cell.symbol}
        defaultPeriod={cell.period}
        defaultTheme={theme}
        defaultLocale={chartLocale(lang)}
        defaultMainIndicators={["MA"]}
        defaultSubIndicators={["VOL"]}
        storage={{}}
        overlays={[orderLineOverlay]}
      >
        <ChartSyncBridge cellId={cell.id} />
        <SecondaryToolbar onRemove={onRemove} />
        <div className="relative min-h-0 flex-1">
          <SecondaryChartView />
        </div>
      </KlinechartsUIProvider>
    </div>
  );
}
