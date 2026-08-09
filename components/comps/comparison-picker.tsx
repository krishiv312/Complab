"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, Search } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Option {
  ticker: string;
  name: string;
  suggested: boolean;
}

export function ComparisonPicker({
  subject,
  options,
  initialSelected,
}: {
  subject: { ticker: string; name: string };
  options: Option[];
  initialSelected: string[];
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Set<string>>(
    new Set(initialSelected.filter((t) => t !== subject.ticker))
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter(
      (o) => o.ticker.toLowerCase().includes(q) || o.name.toLowerCase().includes(q)
    );
  }, [options, query]);

  function toggle(ticker: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(ticker)) next.delete(ticker);
      else next.add(ticker);
      return next;
    });
  }

  function choose() {
    const peers = Array.from(selected);
    const qs = peers.length > 0 ? `?peers=${peers.join(",")}` : "";
    router.push(`/analysis/${subject.ticker}${qs}`);
  }

  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm ring-1 ring-foreground/[0.04]">
      <div className="relative border-b border-border p-3">
        <Search size={15} className="pointer-events-none absolute top-1/2 left-6 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search ticker or company name…"
          className="w-full rounded-lg border border-border bg-background py-2 pr-3 pl-9 text-sm outline-none transition-shadow focus:border-primary/40 focus:ring-4 focus:ring-ring"
        />
      </div>

      <div className="max-h-[55vh] overflow-y-auto">
        <div className="flex w-full items-center gap-3 border-b border-border bg-accent/50 px-4 py-3">
          <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Check size={12} />
          </span>
          <span className="font-mono text-sm font-semibold">{subject.ticker}</span>
          <span className="text-sm text-muted-foreground">{subject.name}</span>
          <span className="ml-auto rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
            BASE
          </span>
        </div>

        {filtered.length === 0 && (
          <p className="px-4 py-6 text-center text-sm text-muted-foreground">
            No match for “{query}”.
          </p>
        )}

        {filtered.map((o) => {
          const checked = selected.has(o.ticker);
          return (
            <button
              key={o.ticker}
              type="button"
              onClick={() => toggle(o.ticker)}
              className={`flex w-full items-center gap-3 border-b border-border px-4 py-3 text-left transition-colors last:border-0 hover:bg-accent/40 ${
                checked ? "bg-accent/40" : ""
              }`}
            >
              <span
                className={`flex size-5 shrink-0 items-center justify-center rounded-full border transition-colors ${
                  checked ? "border-primary bg-primary text-primary-foreground" : "border-border"
                }`}
              >
                {checked && <Check size={12} />}
              </span>
              <span className="font-mono text-sm font-semibold">{o.ticker}</span>
              <span className="text-sm text-muted-foreground">{o.name}</span>
              {o.suggested && (
                <span className="ml-auto text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
                  Suggested
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="flex items-center justify-between border-t border-border p-3">
        <span className="text-sm text-muted-foreground">{selected.size} selected</span>
        <button type="button" onClick={choose} className={cn(buttonVariants({ variant: "default" }), "gap-1.5")}>
          Choose
          <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
}
