"use client";

import { Badge } from "@/components/ui/badge";
import { CountUp } from "@/components/motion/count-up";
import type { MetricResult } from "@/lib/finance/types";
import { formatCurrency, formatMultiple, formatPercent } from "@/lib/format";

// A serializable key rather than the formatter function itself - functions
// can't cross the Server -> Client Component boundary, and this component
// needs to be a client component for the CountUp animation.
export type MetricFormatType = "currency" | "multiple" | "percent";

const FORMATTERS: Record<MetricFormatType, (value: number) => string> = {
  currency: formatCurrency,
  multiple: formatMultiple,
  percent: formatPercent,
};

export function MetricValue({
  result,
  formatType,
}: {
  result: MetricResult;
  formatType: MetricFormatType;
}) {
  const format = FORMATTERS[formatType];

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

  return (
    <span className="font-mono text-2xl font-semibold tabular-nums">
      <CountUp value={result.value} format={format} />
    </span>
  );
}
