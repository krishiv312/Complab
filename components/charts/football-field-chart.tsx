"use client";

import { motion } from "framer-motion";
import { CountUp } from "@/components/motion/count-up";
import { ChartCard } from "@/components/charts/chart-card";
import { formatPerShare } from "@/lib/format";

export interface FootballFieldRow {
  label: string;
  q1: number | null;
  median: number | null;
  q3: number | null;
}

const BAR_DURATION = 0.6;
const ROW_STAGGER = 0.12;

export function FootballFieldChart({
  rows,
  currentPrice,
}: {
  rows: FootballFieldRow[];
  currentPrice: number;
}) {
  // Normalize to low/high rather than trusting q1 <= q3: a peer multiple applied
  // to a negative subject metric (e.g. negative EBIT) flips which end is larger.
  const withRange = rows
    .filter((r): r is FootballFieldRow & { q1: number; q3: number } => r.q1 !== null && r.q3 !== null)
    .map((r) => ({ ...r, low: Math.min(r.q1, r.q3), high: Math.max(r.q1, r.q3) }));

  if (withRange.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Not enough peer multiple data to plot an implied valuation range across methods.
      </p>
    );
  }

  const allValues = withRange.flatMap((r) => [r.low, r.high]).concat(currentPrice);
  const rawMin = Math.min(...allValues);
  const rawMax = Math.max(...allValues);
  const pad = (rawMax - rawMin) * 0.1 || rawMax * 0.1 || 1;
  const domainMin = Math.min(0, rawMin - pad);
  const domainMax = rawMax + pad;
  const span = domainMax - domainMin || 1;

  const toPct = (v: number) => ((v - domainMin) / span) * 100;
  const currentPct = toPct(currentPrice);
  const lineDelay = withRange.length * ROW_STAGGER + BAR_DURATION;

  return (
    <ChartCard
      title="Implied valuation across methods"
      description="Q1-Q3 implied share price range, football field"
    >
      <div className="flex flex-col gap-4">
        {withRange.map((r, i) => {
          const leftPct = toPct(r.low);
          const rightPct = toPct(r.high);
          const widthPct = Math.max(rightPct - leftPct, 0.5);
          const medianPct = r.median !== null ? toPct(r.median) : (leftPct + rightPct) / 2;
          return (
            <div key={r.label} className="flex items-center gap-3">
              <span className="w-24 shrink-0 text-xs text-muted-foreground">{r.label}</span>
              <div className="relative h-5 flex-1 rounded-full bg-muted">
                <motion.div
                  className="absolute top-0 h-5 rounded-full bg-primary/25"
                  initial={{ left: `${medianPct}%`, width: "0%" }}
                  animate={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                  transition={{ duration: BAR_DURATION, delay: i * ROW_STAGGER, ease: [0.16, 1, 0.3, 1] }}
                />
                {r.median !== null && (
                  <motion.div
                    className="absolute top-0 h-5 w-0.5 bg-primary"
                    style={{ left: `${toPct(r.median)}%` }}
                    initial={{ opacity: 0, scaleY: 0 }}
                    animate={{ opacity: 1, scaleY: 1 }}
                    transition={{ duration: 0.25, delay: i * ROW_STAGGER + BAR_DURATION * 0.7 }}
                    title={`Median: ${formatPerShare(r.median)}`}
                  />
                )}
                <motion.div
                  className="absolute top-0 h-5 w-px bg-foreground/70"
                  style={{ left: `${currentPct}%`, transformOrigin: "top" }}
                  initial={{ scaleY: 0 }}
                  animate={{ scaleY: 1 }}
                  transition={{ duration: 0.3, delay: lineDelay, ease: "easeOut" }}
                />
              </div>
              <span className="w-32 shrink-0 text-right font-mono text-xs text-muted-foreground">
                <CountUp value={r.low} format={formatPerShare} duration={BAR_DURATION} /> –{" "}
                <CountUp value={r.high} format={formatPerShare} duration={BAR_DURATION} />
              </span>
            </div>
          );
        })}
      </div>
      <p className="text-xs text-muted-foreground">
        Bar spans Q1–Q3 implied share price for each multiple; the tick marks the median. The
        vertical line at {formatPerShare(currentPrice)} is the current market price.
      </p>
    </ChartCard>
  );
}
