"use client";

import { motion } from "framer-motion";
import type { QuartileStats } from "@/lib/finance/statistics";
import type { MetricResult } from "@/lib/finance/types";
import { formatMultiple, formatPerShare } from "@/lib/format";
import { staggerContainer, staggerItem } from "@/components/motion/stagger";
import { CountUp } from "@/components/motion/count-up";

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
        <motion.tbody initial="hidden" animate="visible" variants={staggerContainer(0.05)}>
          {withData.map((r) => (
            <motion.tr key={r.label} variants={staggerItem} className="border-b border-border last:border-0 font-mono tabular-nums">
              <td className="px-3 py-2 font-sans text-muted-foreground">{r.label}</td>
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
            </motion.tr>
          ))}
        </motion.tbody>
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
          <span className="font-mono text-lg font-semibold tabular-nums">
            {q1Price.value !== null ? <CountUp value={q1Price.value} format={formatPerShare} /> : "N/A"}
          </span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-xs text-muted-foreground">Median implied</span>
          <span className="font-mono text-lg font-semibold tabular-nums">
            {medianPrice.value !== null ? <CountUp value={medianPrice.value} format={formatPerShare} /> : "N/A"}
          </span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-xs text-muted-foreground">Q3 implied</span>
          <span className="font-mono text-lg font-semibold tabular-nums">
            {q3Price.value !== null ? <CountUp value={q3Price.value} format={formatPerShare} /> : "N/A"}
          </span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-xs text-muted-foreground">Current price</span>
          <span className="font-mono text-lg font-semibold tabular-nums text-primary">
            <CountUp value={currentPrice} format={formatPerShare} />
          </span>
        </div>
      </div>
    </div>
  );
}
