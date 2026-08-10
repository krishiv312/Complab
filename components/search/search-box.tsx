"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Search } from "lucide-react";
import type { DemoCompanySummary } from "@/lib/data/demo";

export function SearchBox({ companies }: { companies: DemoCompanySummary[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return companies.filter(
      (c) => c.ticker.toLowerCase().includes(q) || c.name.toLowerCase().includes(q)
    );
  }, [companies, query]);

  function goTo(ticker: string) {
    setIsOpen(false);
    setQuery("");
    router.push(`/company/${ticker}`);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!isOpen || matches.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlighted((i) => (i + 1) % matches.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlighted((i) => (i - 1 + matches.length) % matches.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      goTo(matches[highlighted].ticker);
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  }

  return (
    <div className="relative w-full">
      <Search
        size={16}
        className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-muted-foreground"
      />
      <input
        ref={inputRef}
        type="text"
        value={query}
        placeholder="Search by ticker or company name (try “nike”)"
        className="w-full rounded-xl border border-border bg-background py-3.5 pr-14 pl-10 text-sm shadow-sm outline-none transition-shadow focus:border-primary/40 focus:ring-4 focus:ring-ring"
        onChange={(e) => {
          setQuery(e.target.value);
          setIsOpen(true);
          setHighlighted(0);
        }}
        onFocus={() => setIsOpen(true)}
        onBlur={() => setTimeout(() => setIsOpen(false), 100)}
        onKeyDown={handleKeyDown}
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={isOpen && matches.length > 0}
        aria-controls="search-results"
      />
      <button
        type="button"
        aria-label="Go to search result"
        disabled={matches.length === 0}
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => matches.length > 0 && goTo(matches[highlighted].ticker)}
        className="absolute top-1/2 right-2 flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-primary text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-40"
      >
        <ArrowRight size={16} />
      </button>
      {isOpen && query.trim() !== "" && (
        <ul id="search-results" role="listbox" className="absolute z-10 mt-1 w-full overflow-hidden rounded-lg border border-border bg-popover shadow-md">
          {matches.length === 0 ? (
            <li className="px-4 py-2.5 text-sm text-muted-foreground">
              No match for “{query}”. Available: {companies.map((c) => c.ticker).join(", ")}
            </li>
          ) : (
            matches.map((c, i) => (
              <li key={c.ticker} role="option" aria-selected={i === highlighted}>
                <button
                  type="button"
                  className={`flex w-full items-center justify-between px-4 py-2.5 text-left text-sm ${
                    i === highlighted ? "bg-accent text-accent-foreground" : ""
                  }`}
                  onMouseDown={() => goTo(c.ticker)}
                  onMouseEnter={() => setHighlighted(i)}
                >
                  <span>{c.name}</span>
                  <span className="text-muted-foreground">{c.ticker}</span>
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
