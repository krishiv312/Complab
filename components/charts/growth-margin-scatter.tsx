"use client";

import {
  CartesianGrid,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";
import type { CompsRow } from "@/components/comps/comps-table";
import { formatPercent } from "@/lib/format";

const PRIMARY = "#2B63E9"; // matches --primary in globals.css, sampled from the logo
const MUTED = "#9CA3AF";

interface ScatterPoint {
  ticker: string;
  growth: number;
  margin: number;
  isSubject: boolean;
}

export function GrowthMarginScatter({ rows }: { rows: CompsRow[] }) {
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

  const subject = data.filter((d) => d.isSubject);
  const peers = data.filter((d) => !d.isSubject);

  return (
    <div className="flex flex-col gap-2">
      <div className="h-64 w-full rounded-xl border border-border p-4 shadow-sm">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 8, right: 16, left: 8, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis
              type="number"
              dataKey="growth"
              name="Revenue growth"
              tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
              axisLine={{ stroke: "var(--border)" }}
              tickLine={false}
              tickFormatter={(v: number) => formatPercent(v)}
              label={{ value: "Revenue growth", position: "insideBottom", offset: -4, fontSize: 11, fill: "var(--muted-foreground)" }}
            />
            <YAxis
              type="number"
              dataKey="margin"
              name="EBITDA margin"
              tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v: number) => formatPercent(v)}
              label={{ value: "EBITDA margin", angle: -90, position: "insideLeft", fontSize: 11, fill: "var(--muted-foreground)" }}
            />
            <ZAxis range={[80, 80]} />
            <Tooltip
              cursor={{ strokeDasharray: "3 3" }}
              formatter={(value, name) => [formatPercent(Number(value)), name]}
              labelFormatter={() => ""}
              content={({ active, payload }) => {
                if (!active || !payload || payload.length === 0) return null;
                const point = payload[0].payload as ScatterPoint;
                return (
                  <div
                    className="rounded-lg border px-2 py-1.5 text-xs"
                    style={{ backgroundColor: "var(--popover)", borderColor: "var(--border)" }}
                  >
                    <p className="font-medium">{point.ticker}</p>
                    <p className="text-muted-foreground">Growth: {formatPercent(point.growth)}</p>
                    <p className="text-muted-foreground">Margin: {formatPercent(point.margin)}</p>
                  </div>
                );
              }}
            />
            <Scatter data={peers} fill={MUTED} />
            <Scatter data={subject} fill={PRIMARY} />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
      {excludedCount > 0 && (
        <p className="text-xs text-muted-foreground">
          {excludedCount} compan{excludedCount === 1 ? "y" : "ies"} excluded — revenue growth or
          EBITDA margin is N/A for {excludedCount === 1 ? "it" : "them"}.
        </p>
      )}
    </div>
  );
}
