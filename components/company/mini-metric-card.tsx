import { MetricValue, type MetricFormatType } from "./metric-value";
import type { MetricResult } from "@/lib/finance/types";
import { SpotlightCard } from "@/components/motion/spotlight-card";

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
    <SpotlightCard className="flex flex-col gap-1.5 p-4">
      <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
        {label}
      </span>
      <MetricValue result={result} formatType={formatType} size="sm" colorBySign={colorBySign} />
    </SpotlightCard>
  );
}
