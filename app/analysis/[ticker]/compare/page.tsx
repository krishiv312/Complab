import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getDemoCompany, listDemoTickers, listAllDemoCompanies } from "@/lib/data/demo";
import { suggestPeers } from "@/lib/finance/peers";
import { ComparisonPicker } from "@/components/comps/comparison-picker";

export function generateStaticParams() {
  return listDemoTickers().map((ticker) => ({ ticker }));
}

export default async function ComparePage({
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

  const candidates = listAllDemoCompanies();
  const suggested = suggestPeers(company, candidates);
  const suggestedTickers = suggested.map((p) => p.ticker);
  const currentPeerTickers = peersParam
    ? peersParam.split(",").map((t) => t.trim().toUpperCase()).filter(Boolean)
    : suggestedTickers;

  const suggestedSet = new Set(suggestedTickers);
  const options = candidates
    .filter((c) => c.profile.ticker !== company.profile.ticker)
    .map((c) => ({
      ticker: c.profile.ticker,
      name: c.profile.name,
      suggested: suggestedSet.has(c.profile.ticker),
    }))
    .sort((a, b) => {
      if (a.suggested !== b.suggested) return a.suggested ? -1 : 1;
      return a.ticker.localeCompare(b.ticker);
    });

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-12">
      <Link
        href={`/analysis/${company.profile.ticker}`}
        className="flex w-fit items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft size={14} />
        Back to {company.profile.ticker}
      </Link>

      <div className="flex flex-col gap-2 rounded-xl border border-border bg-card p-5 shadow-sm ring-1 ring-foreground/[0.04]">
        <h1 className="font-heading text-xl font-semibold tracking-tight">Build a comparison</h1>
        <p className="text-sm text-muted-foreground">
          Select the companies to compare against{" "}
          <strong className="text-foreground">{company.profile.ticker}</strong>. Only the
          selected companies will appear in the workspace.
        </p>
      </div>

      <ComparisonPicker
        subject={{ ticker: company.profile.ticker, name: company.profile.name }}
        options={options}
        initialSelected={currentPeerTickers}
      />
    </div>
  );
}
