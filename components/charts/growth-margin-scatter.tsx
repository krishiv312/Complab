"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { CompsRow } from "@/components/comps/comps-table";
import { ChartCard } from "@/components/charts/chart-card";
import { niceDomainTicks } from "@/components/charts/chart-utils";
import { formatPercent } from "@/lib/format";

interface ScatterPoint {
  ticker: string;
  growth: number;
  margin: number;
  isSubject: boolean;
}

const W = 560;
const H = 260;
const PAD = { top: 14, right: 16, bottom: 28, left: 46 };
const PLOT_W = W - PAD.left - PAD.right;
const PLOT_H = H - PAD.top - PAD.bottom;

export function GrowthMarginScatter({ rows }: { rows: CompsRow[] }) {
  const [hovered, setHovered] = useState<number | null>(null);

  const data: ScatterPoint[] = rows
    .filter(
      (r) =>
        r.revenueGrowth.value !== null &&
        r.revenueGrowth.meaningful &&
        r.ebitdaMargin.value !== null &&
        r.ebitdaMargin.meaningful
    )
    .map((r) => ({
      ticker: r.ticker,
      growth: r.revenueGrowth.value as number,
      margin: r.ebitdaMargin.value as number,
      isSubject: r.isSubject,
    }));

  const excludedCount = rows.length - data.length;

  if (data.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No companies in the current peer group have both revenue growth and EBITDA margin
        available to plot.
      </p>
    );
  }

  const xTicks = niceDomainTicks(Math.min(...data.map((d) => d.growth)), Math.max(...data.map((d) => d.growth)));
  const yTicks = niceDomainTicks(Math.min(...data.map((d) => d.margin)), Math.max(...data.map((d) => d.margin)));
  const [xMin, xMax] = [xTicks[0], xTicks[xTicks.length - 1]];
  const [yMin, yMax] = [yTicks[0], yTicks[yTicks.length - 1]];

  const xFor = (v: number) => PAD.left + (PLOT_W * (v - xMin)) / (xMax - xMin);
  const yFor = (v: number) => PAD.top + PLOT_H * (1 - (v - yMin) / (yMax - yMin));

  return (
    <ChartCard title="Revenue growth vs. EBITDA margin" description="Peer positioning on growth and profitability">
      <div className="h-64 w-full">
        <svg viewBox={`0 0 ${W} ${H}`} className="h-full w-full overflow-visible" role="img" aria-label="Revenue growth vs EBITDA margin scatter plot">
          {yTicks.map((t) => (
            <g key={`y-${t}`}>
              <line x1={PAD.left} x2={W - PAD.right} y1={yFor(t)} y2={yFor(t)} stroke="var(--border)" strokeDasharray="3 3" />
              <text x={PAD.left - 8} y={yFor(t)} textAnchor="end" dominantBaseline="middle" className="fill-muted-foreground text-[10px]">
                {formatPercent(t)}
              </text>
            </g>
          ))}
          {xTicks.map((t) => (
            <g key={`x-${t}`}>
              <line
                x1={xFor(t)}
                x2={xFor(t)}
                y1={PAD.top}
                y2={PAD.top + PLOT_H}
                stroke={t === 0 ? "var(--muted-foreground)" : "var(--border)"}
                strokeDasharray={t === 0 ? undefined : "3 3"}
                strokeOpacity={t === 0 ? 0.5 : 1}
              />
              <text x={xFor(t)} y={H - 10} textAnchor="middle" className="fill-muted-foreground text-[10px]">
                {formatPercent(t)}
              </text>
            </g>
          ))}

          {data.map((d, i) => {
            const cx = xFor(d.growth);
            const cy = yFor(d.margin);
            const r = d.isSubject ? 6 : 4.5;
            return (
              <g key={d.ticker} onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)}>
                <motion.circle
                  cx={cx}
                  cy={cy}
                  r={r}
                  fill={d.isSubject ? "var(--primary)" : "var(--chart-2)"}
                  stroke={d.isSubject ? "var(--primary)" : "transparent"}
                  strokeOpacity={0.25}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: hovered === i ? 1.3 : 1, opacity: 1 }}
                  style={{ transformBox: "fill-box", transformOrigin: "center" }}
                  transition={{
                    scale: hovered === i
                      ? { type: "spring", stiffness: 300, damping: 15 }
                      : { type: "spring", stiffness: 260, damping: 16, delay: i * 0.06 },
                    opacity: { duration: 0.25, delay: i * 0.06 },
                  }}
                />
                {d.isSubject && (
                  <motion.circle
                    cx={cx}
                    cy={cy}
                    r={r + 5}
                    fill="none"
                    stroke="var(--primary)"
                    strokeWidth={1.5}
                    strokeOpacity={0.35}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    style={{ transformBox: "fill-box", transformOrigin: "center" }}
                    transition={{ type: "spring", stiffness: 200, damping: 16, delay: 0.15 }}
                  />
                )}
                <AnimatePresence>
                  {hovered === i && (
                    <motion.g
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 4 }}
                      transition={{ duration: 0.15 }}
                    >
                      <rect x={cx - 44} y={cy - 44} width={88} height={34} rx={6} fill="var(--popover)" stroke="var(--border)" />
                      <text x={cx} y={cy - 32} textAnchor="middle" className="fill-foreground text-[10px] font-medium">
                        {d.ticker}
                      </text>
                      <text x={cx} y={cy - 20} textAnchor="middle" className="fill-muted-foreground text-[9px]">
                        {formatPercent(d.growth)} · {formatPercent(d.margin)}
                      </text>
                    </motion.g>
                  )}
                </AnimatePresence>
              </g>
            );
          })}
        </svg>
      </div>
      {excludedCount > 0 && (
        <p className="text-xs text-muted-foreground">
          {excludedCount} compan{excludedCount === 1 ? "y" : "ies"} excluded — revenue growth or
          EBITDA margin is N/A for {excludedCount === 1 ? "it" : "them"}.
        </p>
      )}
    </ChartCard>
  );
}
