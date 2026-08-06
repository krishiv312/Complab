import type { QuartileStats } from "@/lib/finance/statistics";
import type { MetricResult } from "@/lib/finance/types";
import { formatMultiple, formatPerShare } from "@/lib/format";

export interface MultipleQuartiles {
  label: string;
  stats: QuartileStats | null;
  subjectValue: MetricResult;
}

export function QuartileTable({ rows }: { rows: MultipleQuartiles[] }) {
  const withData = rows.filter((r) => r.stats !== null);
  if (withData.length === 0) {
    return <p className="text-sm text-muted-foreground">Not enough peer data for quartile statistics.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border shadow-sm">
      <table className="w-full min-w-[560px] text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/50">
            <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">Multiple</th>
            <th className="px-3 py-2 text-right text-xs font-medium text-muted-foreground">Min</th>
            <th className="px-3 py-2 text-right text-xs font-medium text-muted-foreground">Q1</th>
            <th className="px-3 py-2 text-right text-xs font-medium text-muted-foreground">Median</th>
            <th className="px-3 py-2 text-right text-xs font-medium text-muted-foreground">Q3</th>
            <th className="px-3 py-2 text-right text-xs font-medium text-muted-foreground">Max</th>
            <th className="px-3 py-2 text-right text-xs font-medium text-foreground">Subject</th>
          </tr>
        </thead>
        <tbody>
          {withData.map((r) => (
            <tr key={r.label} className="border-b border-border last:border-0">
              <td className="px-3 py-2 text-muted-foreground">{r.label}</td>
              <td className="px-3 py-2 text-right">{formatMultiple(r.stats!.min)}</td>
              <td className="px-3 py-2 text-right">{formatMultiple(r.stats!.q1)}</td>
              <td className="px-3 py-2 text-right">{formatMultiple(r.stats!.median)}</td>
              <td className="px-3 py-2 text-right">{formatMultiple(r.stats!.q3)}</td>
              <td className="px-3 py-2 text-right">{formatMultiple(r.stats!.max)}</td>
              <td className="px-3 py-2 text-right font-medium">
                {r.subjectValue.value !== null && r.subjectValue.meaningful
                  ? formatMultiple(r.subjectValue.value)
                  : "N/A"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ValuationRangeCard({
  q1Price,
  medianPrice,
  q3Price,
  currentPrice,
}: {
  q1Price: MetricResult;
  medianPrice: MetricResult;
  q3Price: MetricResult;
  currentPrice: number;
}) {
  const values = [q1Price, medianPrice, q3Price];
  if (values.every((v) => v.value === null)) {
    return (
      <p className="text-sm text-muted-foreground">
        Not enough peer EV/EBITDA data to compute an implied valuation range.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border p-4 shadow-sm">
      <p className="text-xs text-muted-foreground">
        Implied share price, applying the peer group&apos;s EV/EBITDA quartiles to the subject
        company&apos;s own EBITDA.
      </p>
      <div className="grid grid-cols-4 gap-3 text-center">
        <div className="flex flex-col gap-0.5">
          <span className="text-xs text-muted-foreground">Q1 implied</span>
          <span className="font-heading text-lg font-semibold">
            {q1Price.value !== null ? formatPerShare(q1Price.value) : "N/A"}
          </span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-xs text-muted-foreground">Median implied</span>
          <span className="font-heading text-lg font-semibold">
            {medianPrice.value !== null ? formatPerShare(medianPrice.value) : "N/A"}
          </span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-xs text-muted-foreground">Q3 implied</span>
          <span className="font-heading text-lg font-semibold">
            {q3Price.value !== null ? formatPerShare(q3Price.value) : "N/A"}
          </span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-xs text-muted-foreground">Current price</span>
          <span className="font-heading text-lg font-semibold text-primary">
            {formatPerShare(currentPrice)}
          </span>
        </div>
      </div>
    </div>
  );
}
