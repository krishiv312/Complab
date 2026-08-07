import { formatPerShare } from "@/lib/format";

export interface FootballFieldRow {
  label: string;
  q1: number | null;
  median: number | null;
  q3: number | null;
}

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

  return (
    <div className="flex flex-col gap-2">
      <div className="rounded-xl border border-border p-4 shadow-sm">
        <div className="relative flex flex-col gap-4">
          {withRange.map((r) => {
            const leftPct = toPct(r.low);
            const rightPct = toPct(r.high);
            const medianPct = r.median !== null ? toPct(r.median) : null;
            return (
              <div key={r.label} className="flex items-center gap-3">
                <span className="w-24 shrink-0 text-xs text-muted-foreground">{r.label}</span>
                <div className="relative h-5 flex-1 rounded-full bg-muted">
                  <div
                    className="absolute top-0 h-5 rounded-full bg-primary/25"
                    style={{ left: `${leftPct}%`, width: `${Math.max(rightPct - leftPct, 0.5)}%` }}
                  />
                  {medianPct !== null && (
                    <div
                      className="absolute top-0 h-5 w-0.5 bg-primary"
                      style={{ left: `${medianPct}%` }}
                      title={`Median: ${formatPerShare(r.median as number)}`}
                    />
                  )}
                  <div
                    className="absolute top-0 h-5 w-px bg-foreground/70"
                    style={{ left: `${currentPct}%` }}
                  />
                </div>
                <span className="w-32 shrink-0 text-right text-xs text-muted-foreground">
                  {formatPerShare(r.low)} – {formatPerShare(r.high)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        Bar spans Q1–Q3 implied share price for each multiple; the tick marks the median. The
        vertical line at {formatPerShare(currentPrice)} is the current market price.
      </p>
    </div>
  );
}
