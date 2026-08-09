"use client";

import { Badge } from "@/components/ui/badge";
import { CountUp } from "@/components/motion/count-up";
import type { MetricResult } from "@/lib/finance/types";
import { formatCurrency, formatMultiple, formatPercent, formatPerShare } from "@/lib/format";

// A serializable key rather than the formatter function itself - functions
// can't cross the Server -> Client Component boundary, and this component
// needs to be a client component for the CountUp animation.
export type MetricFormatType = "currency" | "multiple" | "percent" | "perShare" | "shares";

const FORMATTERS: Record<MetricFormatType, (value: number) => string> = {
  currency: formatCurrency,
  multiple: formatMultiple,
  percent: formatPercent,
  perShare: formatPerShare,
  shares: (v) => `${v.toLocaleString(undefined, { maximumFractionDigits: 0 })}M`,
};

export function MetricValue({
  result,
  formatType,
  size = "lg",
  colorBySign = false,
}: {
  result: MetricResult;
  formatType: MetricFormatType;
  size?: "sm" | "lg";
  colorBySign?: boolean;
}) {
  const format = FORMATTERS[formatType];
  const sizeClass = size === "lg" ? "text-2xl" : "text-lg";

  if (result.value === null) {
    return (
      <Badge variant="outline" className="text-muted-foreground" title={result.note}>
        N/A
      </Badge>
    );
  }

  if (!result.meaningful) {
    return (
      <span className="inline-flex items-center gap-2">
        <Badge variant="warning" title={result.note}>
          N/M
        </Badge>
        <span className="font-mono text-xs text-muted-foreground">{format(result.value)}</span>
      </span>
    );
  }

  const signClass = colorBySign
    ? result.value > 0
      ? "text-emerald-600 dark:text-emerald-400"
      : result.value < 0
        ? "text-red-600 dark:text-red-400"
        : ""
    : "";

  return (
    <span className={`font-mono ${sizeClass} font-semibold tabular-nums ${signClass}`}>
      <CountUp value={result.value} format={format} />
    </span>
  );
}
