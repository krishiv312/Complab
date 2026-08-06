import { notFound } from "next/navigation";
import Link from "next/link";
import { getDemoCompany, listDemoTickers, listDemoCompanySummaries } from "@/lib/data/demo";
import { suggestPeers } from "@/lib/finance/peers";
import { PeerPicker } from "@/components/comps/peer-picker";
import type { DemoCompany } from "@/lib/finance/types";

export function generateStaticParams() {
  return listDemoTickers().map((ticker) => ({ ticker }));
}

function allCompanies(): DemoCompany[] {
  return listDemoTickers()
    .map((t) => getDemoCompany(t))
    .filter((c): c is DemoCompany => c !== null);
}

export default async function AnalysisPage({
  params,
  searchParams,
}: {
  params: Promise<{ ticker: string }>;
  searchParams: Promise<{ peers?: string }>;
}) {
  const { ticker } = await params;
  const { peers: peersParam } = await searchParams;

  const company = getDemoCompany(ticker);
  if (!company) {
    notFound();
  }

  const candidates = allCompanies();
  const suggested = suggestPeers(company, candidates);
  const suggestedTickers = suggested.map((p) => p.ticker);

  const currentPeers = peersParam
    ? peersParam.split(",").map((t) => t.trim().toUpperCase()).filter(Boolean)
    : suggestedTickers;

  const summaries = listDemoCompanySummaries();
  const suggestedOptions = suggested.map((p) => ({
    ticker: p.ticker,
    name: p.name,
    rationale: p.rationale,
  }));
  const otherOptions = summaries
    .filter((s) => s.ticker !== company.profile.ticker && !suggestedTickers.includes(s.ticker))
    .map((s) => ({ ticker: s.ticker, name: s.name }));

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-6 py-12">
      <header className="flex flex-col gap-1">
        <div className="flex items-baseline gap-3">
          <h1 className="font-heading text-3xl font-semibold tracking-tight">
            {company.profile.name}
          </h1>
          <span className="text-lg text-muted-foreground">{company.profile.ticker}</span>
        </div>
        <p className="text-sm text-muted-foreground">
          {company.profile.exchange} · {company.profile.sector} · {company.profile.industry}
        </p>
        <Link
          href={`/company/${company.profile.ticker}`}
          className="mt-1 text-xs text-muted-foreground underline underline-offset-4"
        >
          View company page
        </Link>
      </header>

      <PeerPicker
        subjectTicker={company.profile.ticker}
        currentPeers={currentPeers}
        suggestedPeerTickers={suggestedTickers}
        suggested={suggestedOptions}
        others={otherOptions}
      />

      <p className="text-xs text-muted-foreground">
        The peer group above is encoded in the URL — copy the link to share or reload this exact
        comparison. No account needed.
      </p>
    </div>
  );
}
