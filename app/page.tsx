import Link from "next/link";
import Image from "next/image";
import { listDemoCompanySummaries } from "@/lib/data/demo";
import { SearchBox } from "@/components/search/search-box";

export default function Home() {
  const companies = listDemoCompanySummaries();

  return (
    <div className="relative flex flex-1 flex-col items-center justify-between overflow-hidden px-6 py-16">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[560px] bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,var(--primary)_0%,transparent_70%)] opacity-[0.08]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 right-[8%] -z-10 size-72 rounded-full bg-primary/10 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute top-40 left-[6%] -z-10 size-56 rounded-full bg-primary/10 blur-3xl"
      />

      <div className="flex w-full max-w-2xl flex-1 flex-col items-center justify-center gap-8 text-center">
        <div className="flex flex-col items-center gap-3">
          <Image
            src="/logo-lockup.png"
            alt="Company Labs"
            width={169}
            height={138}
            priority
            unoptimized
            className="h-32 w-auto"
          />
          <p className="text-lg text-muted-foreground">
            Comparable-company valuation multiples, computed from hand-verified SEC filings —
            not AI-generated numbers, not vibes.
          </p>
          <p className="text-sm text-muted-foreground">
            Built for students and early-career analysts learning how equity comps actually work:
            enterprise value, EV/EBITDA, P/E, and where those numbers physically come from in a
            10-K.
          </p>
        </div>

        <SearchBox companies={companies} />

        <div className="flex flex-wrap items-center justify-center gap-2 text-sm text-muted-foreground">
          <span>Or jump straight to</span>
          {companies.map((c) => (
            <Link
              key={c.ticker}
              href={`/company/${c.ticker}`}
              className="rounded-full border border-border px-3 py-1 transition-colors hover:border-primary/30 hover:bg-accent hover:text-accent-foreground"
            >
              {c.ticker}
            </Link>
          ))}
        </div>

        <p className="max-w-md text-xs text-muted-foreground">
          <strong>Disclaimer:</strong> This is a demo product covering a small, hand-verified set
          of companies. Figures are sourced from public SEC filings and market quotes, labelled
          with their source and retrieval date on every card. Nothing here is investment advice.
        </p>
      </div>

      <Image
        src="/logo-icon.png"
        alt=""
        width={422}
        height={214}
        unoptimized
        className="mt-16 h-10 w-auto opacity-70"
      />
    </div>
  );
}
