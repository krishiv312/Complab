import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Methodology — Company Labs",
  description: "How the figures on Company Labs are computed, and where the data comes from.",
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="font-heading text-lg font-semibold tracking-tight">{title}</h2>
      <div className="flex flex-col gap-2 text-sm leading-relaxed text-muted-foreground">
        {children}
      </div>
    </section>
  );
}

export default function MethodologyPage() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-10 px-6 py-12">
      <header className="flex flex-col gap-2">
        <h1 className="font-heading text-3xl font-semibold tracking-tight">Methodology</h1>
        <p className="text-sm text-muted-foreground">
          No AI-generated commentary here — this page is a fixed explanation of how the numbers
          are computed and where they come from. Every figure on the site traces back to one of
          these two sources.
        </p>
      </header>

      <Section title="Where the data comes from">
        <p>
          Four companies (Crocs, Deckers, Skechers, Nike) are hand-transcribed and verified
          directly against their SEC 10-K filings — every figure was checked by a person reading
          the actual filing, cross-checked with a hand calculation of market cap and enterprise
          value before being trusted.
        </p>
        <p>
          The remaining companies are ingested automatically from SEC EDGAR&apos;s XBRL{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-xs">companyfacts</code> API — the
          same structured data the filings themselves are built from, not a third-party
          reseller&apos;s normalization of it. Market prices come from Finnhub. Full detail on the
          ingestion pipeline, its tag-matching logic, and its known limitations lives in{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-xs">docs/FINANCE_METHODOLOGY.md</code>{" "}
          in the project&apos;s repository.
        </p>
      </Section>

      <Section title="EBITDA is not a GAAP concept">
        <p>
          There is no &quot;EBITDA&quot; line in any SEC filing. Every EBITDA figure here is{" "}
          <strong className="text-foreground">computed</strong> as operating income plus
          depreciation &amp; amortization, and labelled &quot;EBITDA (computed)&quot; wherever it
          appears. This is a different number from a company&apos;s own &quot;Adjusted
          EBITDA,&quot; which typically excludes additional items at management&apos;s discretion.
        </p>
      </Section>

      <Section title="N/A and N/M mean different things">
        <p>
          <strong className="text-foreground">N/A</strong> means the underlying figure is
          genuinely unavailable — it&apos;s missing from the data, not derivable, and shown as
          such rather than guessed.
        </p>
        <p>
          <strong className="text-foreground">N/M</strong> (not meaningful) means a real number
          was computed, but showing it as a plain multiple would be actively misleading — most
          commonly, a negative EV/EBITDA or P/E multiple when EBITDA or earnings are negative. The
          number still exists and is shown alongside the badge; it&apos;s just not meaningful to
          read as a valuation multiple.
        </p>
        <p>
          Margins and revenue growth are never marked N/M for negative values — a shrinking
          business or a negative margin is a real, informative fact, not a broken ratio.
        </p>
      </Section>

      <Section title="Peer suggestion">
        <p>
          Suggested peers are scored transparently: industry match is a hard requirement, not
          just a bonus — a similarly-sized company in an unrelated industry is not suggested no
          matter how close its revenue is. Within a qualifying industry, sub-industry match and
          revenue-size similarity rank the candidates. You can always add or remove companies from
          the peer group manually.
        </p>
      </Section>

      <Section title="What this is not">
        <p>
          This is a demo/beta product covering a small set of companies. It does not produce a
          buy, sell, or hold recommendation, at any stage, by design. Nothing on this site is
          investment advice.
        </p>
      </Section>
    </div>
  );
}
