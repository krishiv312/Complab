import { Badge } from "@/components/ui/badge";
import type { MetricResult } from "@/lib/finance/types";

export function MetricValue({
  result,
  format,
}: {
  result: MetricResult;
  format: (value: number) => string;
}) {
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
        <Badge
          className="border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400"
          title={result.note}
        >
          N/M
        </Badge>
        <span className="text-xs text-muted-foreground">{format(result.value)}</span>
      </span>
    );
  }

  return <span className="text-2xl font-semibold tabular-nums">{format(result.value)}</span>;
}
