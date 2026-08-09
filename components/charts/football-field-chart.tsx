"use client";

import { motion } from "framer-motion";
import { CountUp } from "@/components/motion/count-up";
import { ChartCard } from "@/components/charts/chart-card";
import { niceDomainTicks } from "@/components/charts/chart-utils";
import { formatPerShare } from "@/lib/format";

export interface FootballFieldRow {
  label: string;
  q1: number | null;
  median: number | null;
  q3: number | null;
}

const BAR_DURATION = 0.6;
const ROW_STAGGER = 0.12;
const LABEL_OFFSET = 108; // w-24 (96px) + gap-3 (12px), so the NOW line/axis align with the tracks below

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
  const axisTicks = niceDomainTicks(domainMin, domainMax, 5).filter((t) => t >= domainMin && t <= domainMax);

  return (
    <ChartCard
      title="Implied valuation across methods"
      description="Q1-Q3 implied share price range, football field"
    >
      <div className="relative flex flex-col gap-6 pt-2">
        {withRange.map((r, i) => {
          const leftPct = toPct(r.low);
          const rightPct = toPct(r.high);
          const widthPct = Math.max(rightPct - leftPct, 0.5);
          const medianPct = r.median !== null ? toPct(r.median) : (leftPct + rightPct) / 2;
          // Below this width, separate edge labels collide (especially on narrow
          // viewports) - show one combined label centered on the bar instead.
          const tooNarrowForEdgeLabels = widthPct < 14;
          return (
            <div key={r.label} className="grid grid-cols-[6rem_1fr] items-center gap-3">
              <span className="text-xs text-muted-foreground">{r.label}</span>
              <div className="relative pt-4 pb-4">
                {tooNarrowForEdgeLabels ? (
                  <motion.span
                    className="absolute top-0 -translate-x-1/2 font-mono text-[10px] whitespace-nowrap text-muted-foreground"
                    style={{ left: `${(leftPct + rightPct) / 2}%` }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * ROW_STAGGER + BAR_DURATION * 0.8 }}
                  >
                    {formatPerShare(r.low)} – {formatPerShare(r.high)}
                  </motion.span>
                ) : (
                  <>
                    <motion.span
                      className="absolute top-0 -translate-x-1/2 font-mono text-[10px] text-muted-foreground"
                      style={{ left: `${leftPct}%` }}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * ROW_STAGGER + BAR_DURATION * 0.8 }}
                    >
                      {formatPerShare(r.low)}
                    </motion.span>
                    <motion.span
                      className="absolute top-0 -translate-x-1/2 font-mono text-[10px] text-muted-foreground"
                      style={{ left: `${rightPct}%` }}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * ROW_STAGGER + BAR_DURATION * 0.8 }}
                    >
                      {formatPerShare(r.high)}
                    </motion.span>
                  </>
                )}

                <div className="relative h-5 rounded-full bg-muted">
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
                    />
                  )}
                </div>

                {r.median !== null && (
                  <motion.span
                    className="absolute bottom-0 -translate-x-1/2 font-mono text-[10px] font-medium text-primary"
                    style={{ left: `${medianPct}%` }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * ROW_STAGGER + BAR_DURATION * 0.8 }}
                  >
                    {formatPerShare(r.median)}
                  </motion.span>
                )}
              </div>
            </div>
          );
        })}

        {/* Shared current-price marker, spanning all rows, aligned to the track column via LABEL_OFFSET */}
        <div className="pointer-events-none absolute inset-y-0" style={{ left: LABEL_OFFSET, right: 0 }}>
          <motion.div
            className="absolute inset-y-0 border-l border-dashed border-foreground/50"
            style={{ left: `${currentPct}%`, transformOrigin: "top" }}
            initial={{ scaleY: 0, opacity: 0 }}
            animate={{ scaleY: 1, opacity: 1 }}
            transition={{ duration: 0.3, delay: lineDelay, ease: "easeOut" }}
          >
            <span className="absolute -top-2 -translate-x-1/2 rounded-full bg-foreground px-2 py-0.5 text-[10px] font-medium whitespace-nowrap text-background">
              NOW
            </span>
          </motion.div>
        </div>
      </div>

      <div className="relative h-4 text-[10px] text-muted-foreground" style={{ marginLeft: LABEL_OFFSET }}>
        {axisTicks.map((t) => (
          <span key={t} className="absolute -translate-x-1/2 font-mono" style={{ left: `${toPct(t)}%` }}>
            {formatPerShare(t)}
          </span>
        ))}
      </div>

      <p className="text-xs text-muted-foreground">
        Bar spans Q1–Q3 implied share price for each multiple; the tick marks the median. The
        dashed line at <CountUp value={currentPrice} format={formatPerShare} className="font-mono" /> is
        the current market price.
      </p>
    </ChartCard>
  );
}
