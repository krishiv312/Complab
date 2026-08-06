import type { MetricResult } from "./finance/types";

/** Input is always in millions, per the lib/finance/types unit convention. */
export function formatCurrency(millions: number): string {
  const sign = millions < 0 ? "-" : "";
  const abs = Math.abs(millions);
  if (abs >= 1_000_000) {
    return `${sign}$${(abs / 1_000_000).toFixed(2)}T`;
  }
  if (abs >= 1000) {
    return `${sign}$${(abs / 1000).toFixed(2)}B`;
  }
  return `${sign}$${abs.toFixed(1)}M`;
}

export function formatMultiple(value: number): string {
  return `${value.toFixed(2)}x`;
}

export function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

export function formatPerShare(value: number): string {
  return `$${value.toFixed(2)}`;
}

/** Plain-text rendering of a MetricResult for CSV/PDF export (mirrors MetricValue's badge logic). */
export function metricText(result: MetricResult, format: (value: number) => string): string {
  if (result.value === null) return "N/A";
  if (!result.meaningful) return `N/M (${format(result.value)})`;
  return format(result.value);
}
