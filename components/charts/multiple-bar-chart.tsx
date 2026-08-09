"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { CompsRow } from "@/components/comps/comps-table";
import { ChartCard } from "@/components/charts/chart-card";
import { niceAxisTicks } from "@/components/charts/chart-utils";

const W = 560;
const H = 260;
const PAD = { top: 14, right: 12, bottom: 28, left: 42 };
const PLOT_W = W - PAD.left - PAD.right;
const PLOT_H = H - PAD.top - PAD.bottom;

export function MultipleBarChart({
  rows,
  metricKey,
  label,
}: {
  rows: CompsRow[];
  metricKey: keyof CompsRow;
  label: string;
}) {
  const [hovered, setHovered] = useState<number | null>(null);

  const data = rows
    .map((r) => {
      const result = r[metricKey] as { value: number | null; meaningful: boolean };
      return {
        ticker: r.ticker,
        value: result.value !== null && result.meaningful ? result.value : null,
        isSubject: r.isSubject,
      };
    })
    .filter((d): d is { ticker: string; value: number; isSubject: boolean } => d.value !== null);

  const excludedCount = rows.length - data.length;

  if (data.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No companies in the current peer group have a meaningful {label} value to chart.
      </p>
    );
  }

  const maxValue = Math.max(...data.map((d) => d.value));
  const ticks = niceAxisTicks(maxValue);
  const ceiling = ticks[ticks.length - 1];
  const yFor = (v: number) => PAD.top + PLOT_H * (1 - v / ceiling);

  const bandWidth = PLOT_W / data.length;
  const barWidth = Math.min(48, bandWidth * 0.5);

  const chart = (
    <div className="h-64 w-full">
      <svg viewBox={`0 0 ${W} ${H}`} className="h-full w-full overflow-visible" role="img" aria-label={`${label} bar chart`}>
        {ticks.map((t) => (
          <g key={t}>
            <line
              x1={PAD.left}
              x2={W - PAD.right}
              y1={yFor(t)}
              y2={yFor(t)}
              stroke="var(--border)"
              strokeDasharray="3 3"
            />
            <text x={PAD.left - 8} y={yFor(t)} textAnchor="end" dominantBaseline="middle" className="fill-muted-foreground text-[10px]">
              {t.toFixed(1)}x
            </text>
          </g>
        ))}

        {data.map((d, i) => {
          const cx = PAD.left + bandWidth * i + bandWidth / 2;
          const barHeight = PLOT_H * (d.value / ceiling);
          const y = PAD.top + PLOT_H - barHeight;
          return (
            <g key={d.ticker} onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)}>
              <rect
                x={cx - barWidth / 2}
                y={PAD.top}
                width={barWidth}
                height={PLOT_H}
                fill="transparent"
              />
              <motion.rect
                x={cx - barWidth / 2}
                y={y}
                width={barWidth}
                height={barHeight}
                rx={5}
                fill={d.isSubject ? "var(--primary)" : "var(--chart-2)"}
                style={{ transformBox: "fill-box", transformOrigin: "bottom" }}
                initial={{ scaleY: 0 }}
                animate={{ scaleY: hovered === i ? 1.03 : 1 }}
                transition={{
                  scaleY: { type: "spring", stiffness: 260, damping: 18, delay: hovered === i ? 0 : i * 0.09 },
                }}
              />
              <text x={cx} y={H - 8} textAnchor="middle" className="fill-muted-foreground text-[10px]">
                {d.ticker}
              </text>
              <AnimatePresence>
                {hovered === i && (
                  <motion.g
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 4 }}
                    transition={{ duration: 0.15 }}
                  >
                    <rect
                      x={cx - 26}
                      y={y - 24}
                      width={52}
                      height={18}
                      rx={5}
                      fill="var(--popover)"
                      stroke="var(--border)"
                    />
                    <text x={cx} y={y - 13} textAnchor="middle" dominantBaseline="middle" className="fill-foreground text-[10px] font-medium">
                      {d.value.toFixed(2)}x
                    </text>
                  </motion.g>
                )}
              </AnimatePresence>
            </g>
          );
        })}
      </svg>
    </div>
  );

  return (
    <ChartCard title={label} description={`Peer comparison on ${label}`}>
      {chart}
      {excludedCount > 0 && (
        <p className="text-xs text-muted-foreground">
          {excludedCount} compan{excludedCount === 1 ? "y" : "ies"} excluded — {label} is N/A or N/M
          for {excludedCount === 1 ? "it" : "them"}.
        </p>
      )}
    </ChartCard>
  );
}
