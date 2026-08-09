import { MetricValue, type MetricFormatType } from "./metric-value";
import type { MetricResult } from "@/lib/finance/types";

export function MiniMetricCard({
  label,
  result,
  formatType,
  colorBySign,
}: {
  label: string;
  result: MetricResult;
  formatType: MetricFormatType;
  colorBySign?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5 rounded-xl border border-border bg-card p-4 shadow-sm ring-1 ring-foreground/[0.04]">
      <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
        {label}
      </span>
      <MetricValue result={result} formatType={formatType} size="sm" colorBySign={colorBySign} />
    </div>
  );
}
