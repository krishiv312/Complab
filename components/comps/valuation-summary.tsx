"use client";

import { motion } from "framer-motion";
import type { QuartileStats } from "@/lib/finance/statistics";
import type { MetricResult } from "@/lib/finance/types";
import { formatMultiple, formatPerShare } from "@/lib/format";
import { staggerContainer, staggerItem } from "@/components/motion/stagger";
import { CountUp } from "@/components/motion/count-up";
import { SpotlightCard } from "@/components/motion/spotlight-card";

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
    <SpotlightCard className="flex flex-col gap-3 p-4">
      <div className="flex flex-col gap-0.5">
        <h3 className="font-heading text-sm font-semibold">Quartile statistics</h3>
        <p className="text-xs text-muted-foreground">Peer group distribution, subject vs. peers</p>
      </div>
      <div className="overflow-x-auto rounded-lg border border-border">
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
    </SpotlightCard>
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

  const pctVsCurrent =
    medianPrice.value !== null && currentPrice !== 0
      ? (medianPrice.value - currentPrice) / currentPrice
      : null;
  const isDown = pctVsCurrent !== null && pctVsCurrent < 0;

  // Small standalone range bar - same low/median/high-against-current pattern
  // as the football field chart, condensed to a single row for this one
  // EV/EBITDA-based range.
  const low = q1Price.value;
  const high = q3Price.value;
  const hasRange = low !== null && high !== null;
  const rangeLow = hasRange ? Math.min(low, high) : null;
  const rangeHigh = hasRange ? Math.max(low, high) : null;
  const allValues = hasRange ? [rangeLow!, rangeHigh!, currentPrice] : [currentPrice];
  const rawMin = Math.min(...allValues);
  const rawMax = Math.max(...allValues);
  const pad = (rawMax - rawMin) * 0.15 || rawMax * 0.1 || 1;
  const domainMin = Math.min(0, rawMin - pad);
  const domainMax = rawMax + pad;
  const span = domainMax - domainMin || 1;
  const toPct = (v: number) => ((v - domainMin) / span) * 100;

  return (
    <SpotlightCard className="flex flex-col gap-4 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <h3 className="font-heading text-sm font-semibold">Implied valuation range</h3>
          <p className="text-xs text-muted-foreground">
            Derived from peer EV/EBITDA quartiles × subject EBITDA
          </p>
        </div>
        {pctVsCurrent !== null && (
          <span
            className={`flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${
              isDown
                ? "bg-red-500/10 text-red-600 dark:text-red-400"
                : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
            }`}
          >
            {isDown ? "▼" : "▲"} {Math.abs(pctVsCurrent * 100).toFixed(0)}% vs. current
          </span>
        )}
      </div>

      <div className="grid grid-cols-4 gap-3 text-center">
        <div className="flex flex-col gap-0.5">
          <span className="text-xs text-muted-foreground uppercase">Current price</span>
          <span className="font-mono text-lg font-semibold tabular-nums">
            <CountUp value={currentPrice} format={formatPerShare} />
          </span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-xs text-muted-foreground uppercase">Low (Q1)</span>
          <span className="font-mono text-lg font-semibold tabular-nums">
            {q1Price.value !== null ? <CountUp value={q1Price.value} format={formatPerShare} /> : "N/A"}
          </span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-xs text-muted-foreground uppercase">Base (median)</span>
          <span className="font-mono text-lg font-semibold tabular-nums text-primary">
            {medianPrice.value !== null ? <CountUp value={medianPrice.value} format={formatPerShare} /> : "N/A"}
          </span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-xs text-muted-foreground uppercase">High (Q3)</span>
          <span className="font-mono text-lg font-semibold tabular-nums">
            {q3Price.value !== null ? <CountUp value={q3Price.value} format={formatPerShare} /> : "N/A"}
          </span>
        </div>
      </div>

      {hasRange && (
        <div className="relative pt-4 pb-4">
          <span
            className="absolute top-0 -translate-x-1/2 font-mono text-[10px] text-muted-foreground"
            style={{ left: `${toPct(rangeLow!)}%` }}
          >
            {formatPerShare(rangeLow!)}
          </span>
          <span
            className="absolute top-0 -translate-x-1/2 font-mono text-[10px] text-muted-foreground"
            style={{ left: `${toPct(rangeHigh!)}%` }}
          >
            {formatPerShare(rangeHigh!)}
          </span>
          <div className="relative h-4 rounded-full bg-muted">
            <div
              className="absolute top-0 h-4 rounded-full bg-primary/25"
              style={{
                left: `${toPct(rangeLow!)}%`,
                width: `${Math.max(toPct(rangeHigh!) - toPct(rangeLow!), 0.5)}%`,
              }}
            />
            {medianPrice.value !== null && (
              <div
                className="absolute top-0 h-4 w-0.5 bg-primary"
                style={{ left: `${toPct(medianPrice.value)}%` }}
              />
            )}
            <div
              className="absolute inset-y-0 border-l border-dashed border-foreground/50"
              style={{ left: `${toPct(currentPrice)}%` }}
            >
              <span className="absolute -top-2 -translate-x-1/2 rounded-full bg-foreground px-1.5 py-0.5 text-[9px] font-medium whitespace-nowrap text-background">
                NOW
              </span>
            </div>
          </div>
        </div>
      )}

      <p className="text-[11px] text-muted-foreground">
        Implied equity value = (peer multiple × subject EBITDA) − subject net debt, ÷ shares
        outstanding.
      </p>
    </SpotlightCard>
  );
}
