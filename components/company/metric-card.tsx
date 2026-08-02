import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { MetricValue } from "./metric-value";
import type { MetricResult, SourceRef } from "@/lib/finance/types";

const SOURCE_LABELS: Record<SourceRef["kind"], string> = {
  SEC_EDGAR_10K: "SEC 10-K",
  SEC_EDGAR_10Q: "SEC 10-Q",
  MARKET_QUOTE: "Market quote",
  MANUAL: "Manual entry",
};

export function MetricCard({
  label,
  result,
  format,
  period,
  currency,
  source,
}: {
  label: string;
  result: MetricResult;
  format: (value: number) => string;
  period: string;
  currency: string;
  source: SourceRef;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-normal text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <MetricValue result={result} format={format} />
      </CardContent>
      <CardFooter className="flex flex-col items-start gap-0.5 text-xs text-muted-foreground">
        <span>
          {SOURCE_LABELS[source.kind]} · {period} · {currency}
        </span>
        <span>Retrieved {source.retrievedAt}</span>
      </CardFooter>
    </Card>
  );
}
