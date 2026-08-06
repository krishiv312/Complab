import type { MetricResult } from "./types";

export interface QuartileStats {
  min: number;
  q1: number;
  median: number;
  q3: number;
  max: number;
  count: number;
}

/** Linear interpolation percentile (Excel's QUARTILE.INC / numpy's default "linear" method). */
function percentile(sorted: number[], p: number): number {
  const idx = (sorted.length - 1) * p;
  const lower = Math.floor(idx);
  const upper = Math.ceil(idx);
  if (lower === upper) return sorted[lower];
  const weight = idx - lower;
  return sorted[lower] * (1 - weight) + sorted[upper] * weight;
}

export function quartiles(values: number[]): QuartileStats | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  return {
    min: sorted[0],
    q1: percentile(sorted, 0.25),
    median: percentile(sorted, 0.5),
    q3: percentile(sorted, 0.75),
    max: sorted[sorted.length - 1],
    count: sorted.length,
  };
}

/**
 * Quartiles over a set of MetricResults, e.g. a peer group's EV/EBITDA values.
 * Only value!=null && meaningful results contribute - an N/A or N/M peer
 * shouldn't pull a quartile toward a number that was never meant to be read as
 * one (a negative "N/M" EV/EBITDA averaged into a peer set would be nonsense).
 */
export function quartilesFromMetrics(results: MetricResult[]): QuartileStats | null {
  const values = results
    .filter((r): r is MetricResult & { value: number } => r.value !== null && r.meaningful)
    .map((r) => r.value);
  return quartiles(values);
}
