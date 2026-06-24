import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format a price with adaptive precision based on magnitude. */
export function formatPrice(value: number | null | undefined, precision?: number): string {
  if (value == null || Number.isNaN(value)) return "—";
  const p =
    precision ??
    (value >= 1000 ? 2 : value >= 1 ? 2 : value >= 0.01 ? 4 : 6);
  return value.toLocaleString("en-US", {
    minimumFractionDigits: p,
    maximumFractionDigits: p,
  });
}

/** Format a signed percentage with two decimals. */
export function formatPercent(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "—";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}

/** Compact volume formatting (1.2K, 3.4M, 5.6B). */
export function formatCompact(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "—";
  return Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 2,
  }).format(value);
}
