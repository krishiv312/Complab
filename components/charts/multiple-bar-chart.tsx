"use client";

import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { CompsRow } from "@/components/comps/comps-table";

const PRIMARY = "#2B63E9"; // matches --primary in globals.css, sampled from the logo
const MUTED = "#9CA3AF";

export function MultipleBarChart({
  rows,
  metricKey,
  label,
}: {
  rows: CompsRow[];
  metricKey: keyof CompsRow;
  label: string;
}) {
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

  return (
    <div className="flex flex-col gap-2">
      <div className="h-64 w-full rounded-xl border border-border p-4 shadow-sm">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
            <XAxis
              dataKey="ticker"
              tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
              axisLine={{ stroke: "var(--border)" }}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v: number) => `${v.toFixed(1)}x`}
            />
            <Tooltip
              formatter={(value) => [`${Number(value).toFixed(2)}x`, label]}
              contentStyle={{
                backgroundColor: "var(--popover)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                fontSize: 12,
              }}
            />
            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
              {data.map((d) => (
                <Cell key={d.ticker} fill={d.isSubject ? PRIMARY : MUTED} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      {excludedCount > 0 && (
        <p className="text-xs text-muted-foreground">
          {excludedCount} compan{excludedCount === 1 ? "y" : "ies"} excluded — {label} is N/A or N/M
          for {excludedCount === 1 ? "it" : "them"}.
        </p>
      )}
    </div>
  );
}
