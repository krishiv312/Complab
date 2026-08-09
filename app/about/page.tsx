import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About — Company Labs",
  description: "What Company Labs is and why it exists.",
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

export default function AboutPage() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-10 px-6 py-12">
      <header className="flex flex-col gap-2">
        <h1 className="font-heading text-3xl font-semibold tracking-tight">About Company Labs</h1>
        <p className="text-sm text-muted-foreground">
          A comparable-company valuation tool, built to make equity comps legible rather than
          impressive-looking.
        </p>
      </header>

      <Section title="Why this exists">
        <p>
          Most comps tools either hide the arithmetic behind a polished dashboard or hand-wave the
          data source. Company Labs does neither: every multiple traces back to a labelled figure
          from an actual SEC filing, every peer suggestion is scored transparently instead of
          scored by a black box, and every missing or misleading number is shown as such — N/A or
          N/M — instead of blank or guessed.
        </p>
      </Section>

      <Section title="Who it's for">
        <p>
          Students and early-career analysts learning how equity comps actually work: how
          enterprise value is built up from market cap, why EBITDA isn&apos;t a line item in any
          filing, and where the numbers on a comps table physically come from in a 10-K.
        </p>
      </Section>

      <Section title="How it's built">
        <p>
          A small, hand-verified set of companies anchors the whole dataset — each figure checked
          by a person reading the actual filing. The rest is ingested automatically from SEC
          EDGAR&apos;s own XBRL data and validated against that hand-verified ground truth before
          being trusted, not assumed correct. See{" "}
          <a href="/methodology" className="underline underline-offset-4 hover:text-foreground">
            Methodology
          </a>{" "}
          for the full detail.
        </p>
      </Section>
    </div>
  );
}
