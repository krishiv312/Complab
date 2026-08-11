"use client";

import { useMemo, useState } from "react";
import {
  createColumnHelper,
  createSortedRowModel,
  rowSortingFeature,
  tableFeatures,
  useTable,
  type SortingState,
} from "@tanstack/react-table";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import type { MetricResult } from "@/lib/finance/types";
import { formatCurrency, formatMultiple, formatPercent } from "@/lib/format";
import { staggerContainer, staggerItem } from "@/components/motion/stagger";

export interface CompsRow {
  ticker: string;
  name: string;
  isSubject: boolean;
  marketCap: MetricResult;
  enterpriseValue: MetricResult;
  evRevenue: MetricResult;
  evEbitda: MetricResult;
  evEbit: MetricResult;
  pe: MetricResult;
  pb: MetricResult;
  revenue: MetricResult;
  ebitdaMargin: MetricResult;
  netMargin: MetricResult;
  revenueGrowth: MetricResult;
}

function metricCell(result: MetricResult, format: (v: number) => string) {
  if (result.value === null) {
    return <span className="text-muted-foreground">N/A</span>;
  }
  if (!result.meaningful) {
    return (
      <Badge variant="warning" className="px-1.5 py-0 text-[10px]">
        N/M
      </Badge>
    );
  }
  return <span className="font-mono tabular-nums">{format(result.value)}</span>;
}

const features = tableFeatures({
  rowSortingFeature,
  sortedRowModel: createSortedRowModel(),
});

const helper = createColumnHelper<typeof features, CompsRow>();

const METRIC_COLUMNS: { key: keyof CompsRow; label: string; format: (v: number) => string }[] = [
  { key: "marketCap", label: "Market Cap", format: formatCurrency },
  { key: "enterpriseValue", label: "EV", format: formatCurrency },
  { key: "revenue", label: "Revenue", format: formatCurrency },
  { key: "evRevenue", label: "EV/Rev", format: formatMultiple },
  { key: "evEbitda", label: "EV/EBITDA", format: formatMultiple },
  { key: "evEbit", label: "EV/EBIT", format: formatMultiple },
  { key: "pe", label: "P/E", format: formatMultiple },
  { key: "pb", label: "P/B", format: formatMultiple },
  { key: "ebitdaMargin", label: "EBITDA Margin", format: formatPercent },
  { key: "netMargin", label: "Net Margin", format: formatPercent },
  { key: "revenueGrowth", label: "Rev Growth", format: formatPercent },
];

export function CompsTable({ rows }: { rows: CompsRow[] }) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [hiddenColumns, setHiddenColumns] = useState<Set<string>>(new Set());

  const columns = useMemo(
    () =>
      helper.columns([
        helper.accessor((row) => row.ticker, {
          id: "ticker",
          header: "Company",
          cell: ({ row }) => (
            <div className="flex flex-col">
              <span className={row.original.isSubject ? "font-semibold" : ""}>
                {row.original.ticker}
              </span>
              <span className="text-xs text-muted-foreground">{row.original.name}</span>
            </div>
          ),
        }),
        ...METRIC_COLUMNS.filter((c) => !hiddenColumns.has(c.key)).map((c) =>
          helper.accessor(
            (row) => {
              const r = row[c.key] as MetricResult;
              return r.value !== null && r.meaningful ? r.value : undefined;
            },
            {
              id: c.key,
              header: c.label,
              cell: ({ row }) => metricCell(row.original[c.key] as MetricResult, c.format),
              sortUndefined: "last",
            }
          )
        ),
      ]),
    [hiddenColumns]
  );

  const table = useTable({
    features,
    columns,
    data: rows,
    state: { sorting },
    onSortingChange: setSorting,
  });

  function toggleColumn(key: string) {
    setHiddenColumns((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-1.5">
        {METRIC_COLUMNS.map((c) => (
          <motion.button
            key={c.key}
            type="button"
            onClick={() => toggleColumn(c.key)}
            whileTap={{ scale: 0.94 }}
            className={`rounded-full border px-2.5 py-0.5 text-[11px] transition-colors ${
              hiddenColumns.has(c.key)
                ? "border-border text-muted-foreground"
                : "border-primary/30 bg-accent text-accent-foreground"
            }`}
          >
            {c.label}
          </motion.button>
        ))}
      </div>

      <div className="overflow-x-auto rounded-xl border border-border shadow-sm">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="border-b border-border bg-muted/50">
                {headerGroup.headers.map((header) => {
                  const sortDir = header.column.getIsSorted();
                  return (
                    <th
                      key={header.id}
                      className="cursor-pointer select-none whitespace-nowrap px-3 py-2 text-left text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      {header.isPlaceholder ? null : <table.FlexRender header={header} />}
                      <motion.span
                        className="inline-block"
                        animate={{ rotate: sortDir === "desc" ? 180 : 0, opacity: sortDir ? 1 : 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        {sortDir ? " ↑" : ""}
                      </motion.span>
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <motion.tbody initial="hidden" animate="visible" variants={staggerContainer(0.04)}>
            {table.getRowModel().rows.map((row) => (
              <motion.tr
                key={row.id}
                layout
                variants={staggerItem}
                whileHover={{ backgroundColor: row.original.isSubject ? "var(--accent)" : "var(--muted)" }}
                transition={{ layout: { type: "spring", stiffness: 350, damping: 32 }, backgroundColor: { duration: 0.15 } }}
                className={`border-b border-border last:border-0 ${
                  row.original.isSubject ? "bg-accent/40" : ""
                }`}
              >
                {row.getAllCells().map((cell) => (
                  <td key={cell.id} className="whitespace-nowrap px-3 py-2">
                    <table.FlexRender cell={cell} />
                  </td>
                ))}
              </motion.tr>
            ))}
          </motion.tbody>
        </table>
      </div>
    </div>
  );
}
