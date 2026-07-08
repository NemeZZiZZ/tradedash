import { useEffect, useMemo, useState } from "react";
import { useKlinechartsUI, TA } from "react-klinecharts-ui";
import { useT } from "@/i18n";
import type { TerminalPeriod } from "react-klinecharts-ui";
import type { KLineData, SymbolInfo } from "klinecharts";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useLivePrice } from "@/hooks/use-live-price";
import { cn, formatPrice, formatPercent, formatCompact } from "@/lib/utils";

const DAY: TerminalPeriod = { span: 1, type: "day", label: "1D" };

interface Perf {
  labelKey: string;
  value: number | null;
}

function pctChange(
  from: number | undefined,
  to: number | undefined,
): number | null {
  if (from == null || to == null || from === 0) return null;
  return (to / from - 1) * 100;
}

/** Performance % over standard horizons from a daily close series. */
function computePerformance(daily: KLineData[], liveLast?: number | null): Perf[] {
  if (daily.length === 0) return [];
  const last = liveLast ?? daily[daily.length - 1].close;
  const closeAgo = (days: number) => {
    const idx = daily.length - 1 - days;
    return idx >= 0 ? daily[idx].close : undefined;
  };
  const yearStart = new Date(new Date().getFullYear(), 0, 1).getTime();
  const ytdBar = daily.find((d) => d.timestamp >= yearStart);
  return [
    { labelKey: "si.w1", value: pctChange(closeAgo(7), last) },
    { labelKey: "si.m1", value: pctChange(closeAgo(30), last) },
    { labelKey: "si.m3", value: pctChange(closeAgo(90), last) },
    { labelKey: "si.m6", value: pctChange(closeAgo(180), last) },
    { labelKey: "si.ytd", value: pctChange(ytdBar?.close, last) },
    { labelKey: "si.y1", value: pctChange(closeAgo(365), last) },
  ];
}

interface Tech {
  score: number; // -1..1
  labelKey: string;
  buy: number;
  sell: number;
  neutral: number;
}

/** TradingView-style summary from MAs + RSI + MACD on the current series. */
function computeTechnicals(list: KLineData[]): Tech | null {
  const closes = list.map((d) => d.close);
  if (closes.length < 60) return null;
  const price = closes[closes.length - 1];
  let buy = 0;
  let sell = 0;
  let neutral = 0;
  const tally = (signal: number) =>
    signal > 0 ? buy++ : signal < 0 ? sell++ : neutral++;

  for (const p of [10, 20, 30, 50, 100, 200]) {
    const ma = TA.sma(closes, p);
    const v = ma[ma.length - 1];
    if (v != null) tally(price > v ? 1 : price < v ? -1 : 0);
    const ema = TA.ema(closes, p);
    const ev = ema[ema.length - 1];
    if (ev != null) tally(price > ev ? 1 : price < ev ? -1 : 0);
  }
  const rsi = TA.rsi(closes, 14);
  const r = rsi[rsi.length - 1];
  if (r != null) tally(r < 30 ? 1 : r > 70 ? -1 : 0);
  const macd = TA.macd(closes, 12, 26, 9);
  const dif = macd.dif[macd.dif.length - 1];
  const dea = macd.dea[macd.dea.length - 1];
  if (dif != null && dea != null) tally(dif > dea ? 1 : -1);

  const total = buy + sell + neutral || 1;
  const score = (buy - sell) / total;
  const labelKey =
    score > 0.5
      ? "si.strongBuy"
      : score > 0.15
        ? "si.buy"
        : score < -0.5
          ? "si.strongSell"
          : score < -0.15
            ? "si.sell"
            : "si.neutral";
  return { score, labelKey, buy, sell, neutral };
}

function Gauge({ tech, t }: { tech: Tech; t: (k: string, p?: Record<string, string | number>) => string }) {
  // Needle angle: -90° (sell) .. +90° (buy).
  const angle = tech.score * 90;
  const tone =
    tech.score > 0.15
      ? "var(--bull)"
      : tech.score < -0.15
        ? "var(--bear)"
        : "var(--muted-foreground)";
  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 100 56" className="w-40">
        <path
          d="M6 50 A44 44 0 0 1 24 15"
          fill="none"
          stroke="var(--bear)"
          strokeWidth="6"
          strokeLinecap="round"
        />
        <path
          d="M28 12 A44 44 0 0 1 50 6"
          fill="none"
          stroke="color-mix(in oklch, var(--bear) 50%, var(--muted))"
          strokeWidth="6"
          strokeLinecap="round"
        />
        <path
          d="M50 6 A44 44 0 0 1 72 12"
          fill="none"
          stroke="color-mix(in oklch, var(--bull) 50%, var(--muted))"
          strokeWidth="6"
          strokeLinecap="round"
        />
        <path
          d="M76 15 A44 44 0 0 1 94 50"
          fill="none"
          stroke="var(--bull)"
          strokeWidth="6"
          strokeLinecap="round"
        />
        <g
          transform={`rotate(${angle} 50 50)`}
          className="transition-transform duration-200"
        >
          <line
            x1="50"
            y1="50"
            x2="50"
            y2="16"
            stroke={tone}
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </g>
        <circle cx="50" cy="50" r="3.5" fill={tone} />
      </svg>
      <div className="text-sm font-semibold" style={{ color: tone }}>
        {t(tech.labelKey)}
      </div>
      <div className="mt-1 flex gap-3 text-xs text-muted-foreground">
        <span className="text-bear">{t("si.sellCount", { n: tech.sell })}</span>
        <span>{t("si.neutralCount", { n: tech.neutral })}</span>
        <span className="text-bull">{t("si.buyCount", { n: tech.buy })}</span>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  );
}

export function SymbolInfoPanel() {
  const t = useT();
  const { state, datafeed } = useKlinechartsUI();
  const symbol = state.symbol;
  const live = useLivePrice();
  const [daily, setDaily] = useState<KLineData[]>([]);
  const [error, setError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const ticker = symbol?.ticker;
  const prec = symbol?.pricePrecision;

  useEffect(() => {
    if (!symbol) return;
    let cancelled = false;
    setDaily([]);
    setError(false);
    datafeed
      .getHistoryKLineData(symbol as unknown as SymbolInfo, DAY, 0, Date.now())
      .then((d) => {
        if (cancelled) return;
        if (d.length === 0) setError(true);
        else setDaily(d);
      })
      .catch(() => !cancelled && setError(true));
    return () => {
      cancelled = true;
    };
  }, [ticker, datafeed, symbol, reloadKey]);

  const performance = useMemo(() => computePerformance(daily, live.last), [daily, live.last]);
  const technicals = useMemo(
    () => computeTechnicals(state.chart?.getDataList?.() ?? daily),
    [daily, state.chart, live.last],
  );

  const dayChangePct =
    daily.length >= 2
      ? pctChange(
          daily[daily.length - 2].close,
          live.last ?? daily[daily.length - 1].close,
        )
      : live.changePercent;
  const up = (dayChangePct ?? 0) >= 0;

  const avgVol30 = daily.length
    ? daily.slice(-30).reduce((s, d) => s + (d.volume ?? 0), 0) /
      Math.min(30, daily.length)
    : null;
  const lastBar = daily[daily.length - 1];

  return (
    <aside className="flex h-full w-full flex-col bg-card">
      <div className="flex h-9 shrink-0 items-center justify-between border-b border-border px-3">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {t("si.title")}
        </span>
        <span className="font-mono text-xs text-muted-foreground">
          {ticker}
        </span>
      </div>

      {error && (
        <div className="flex items-center justify-between gap-2 border-b border-border bg-bear/10 px-3 py-1.5 text-xs text-bear">
          <span>{t("common.error")}</span>
          <button
            onClick={() => setReloadKey((k) => k + 1)}
            className="rounded px-1.5 py-0.5 font-medium underline-offset-2 hover:underline"
          >
            {t("common.retry")}
          </button>
        </div>
      )}

      <ScrollArea className="min-h-0 flex-1" viewportClassName="px-3 py-2">
        <div className="mb-1 text-sm text-muted-foreground">
          {typeof symbol?.name === "string" ? symbol.name : ticker}
        </div>
        <div className="flex items-baseline gap-2">
          <span className="font-mono text-2xl font-semibold tabular-nums">
            {formatPrice(live.last ?? lastBar?.close, prec)}
          </span>
          <span
            className={cn(
              "text-sm tabular-nums",
              up ? "text-bull" : "text-bear",
            )}
          >
            {formatPercent(dayChangePct)}
          </span>
        </div>
        <div className="mt-0.5 text-xs text-muted-foreground">
          {String(
            symbol?.exchange ??
              (symbol as { source?: string } | null)?.source ??
              "",
          )}{" "}
          · {t("si.spot")}
        </div>

        <h3 className="mb-1 mt-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {t("si.keyData")}
        </h3>
        <Stat label={t("si.volBar")} value={formatCompact(lastBar?.volume)} />
        <Stat label={t("si.avgVol")} value={formatCompact(avgVol30)} />
        <Stat label={t("si.turnover")} value={formatCompact(lastBar?.turnover)} />

        <h3 className="mb-2 mt-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {t("si.dynamics")}
        </h3>
        <div className="grid grid-cols-3 gap-1.5">
          {performance.map((p) => {
            const pos = (p.value ?? 0) >= 0;
            return (
              <div
                key={p.labelKey}
                className={cn(
                  "rounded-md px-2 py-1.5 text-center",
                  p.value == null
                    ? "bg-muted/40"
                    : pos
                      ? "bg-bull/15"
                      : "bg-bear/15",
                )}
              >
                <div
                  className={cn(
                    "text-xs font-medium tabular-nums",
                    p.value == null
                      ? "text-muted-foreground"
                      : pos
                        ? "text-bull"
                        : "text-bear",
                  )}
                >
                  {p.value == null ? "—" : formatPercent(p.value)}
                </div>
                <div className="text-[10px] text-muted-foreground">
                  {t(p.labelKey)}
                </div>
              </div>
            );
          })}
        </div>

        <h3 className="mb-2 mt-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {t("si.techAnalysis")}
        </h3>
        {technicals ? (
          <Gauge tech={technicals} t={t} />
        ) : (
          <div className="py-4 text-center text-xs text-muted-foreground">
            {t("si.notEnough")}
          </div>
        )}
      </ScrollArea>
    </aside>
  );
}
