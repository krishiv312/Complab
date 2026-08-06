import Link from "next/link";
import { listDemoCompanySummaries } from "@/lib/data/demo";

export default function AnalysisNotFound() {
  const companies = listDemoCompanySummaries();

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-4 px-6 py-24 text-center">
      <h1 className="font-heading text-2xl font-semibold tracking-tight">
        That ticker isn&apos;t in the demo set
      </h1>
      <p className="text-sm text-muted-foreground">
        Company Labs currently covers a small, hand-verified and auto-ingested set of companies.
        Try one of these:
      </p>
      <ul className="flex flex-col gap-2">
        {companies.map((c) => (
          <li key={c.ticker}>
            <Link
              href={`/analysis/${c.ticker}`}
              className="rounded-lg border border-border px-4 py-2 text-sm hover:bg-accent hover:text-accent-foreground"
            >
              {c.name} ({c.ticker})
            </Link>
          </li>
        ))}
      </ul>
      <Link href="/" className="text-sm text-muted-foreground underline underline-offset-4">
        Back to search
      </Link>
    </div>
  );
}
