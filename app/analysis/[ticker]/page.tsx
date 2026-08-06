import { notFound } from "next/navigation";
import Link from "next/link";
import { getDemoCompany, listDemoTickers, listDemoCompanySummaries } from "@/lib/data/demo";
import { suggestPeers } from "@/lib/finance/peers";
import { computeCompanyMetrics } from "@/lib/finance/compute";
import { quartilesFromMetrics } from "@/lib/finance/statistics";
import { impliedValuation } from "@/lib/finance/valuation";
import { PeerPicker } from "@/components/comps/peer-picker";
import { CompsTable, type CompsRow } from "@/components/comps/comps-table";
import { QuartileTable, ValuationRangeCard } from "@/components/comps/valuation-summary";
import type { DemoCompany } from "@/lib/finance/types";

export function generateStaticParams() {
  return listDemoTickers().map((ticker) => ({ ticker }));
}

function allCompanies(): DemoCompany[] {
  return listDemoTickers()
    .map((t) => getDemoCompany(t))
    .filter((c): c is DemoCompany => c !== null);
}

function toRow(company: DemoCompany, isSubject: boolean): CompsRow {
  const m = computeCompanyMetrics(company);
  return {
    ticker: company.profile.ticker,
    name: company.profile.name,
    isSubject,
    marketCap: m.marketCap,
    enterpriseValue: m.enterpriseValue,
    evRevenue: m.evRevenue,
    evEbitda: m.evEbitda,
    evEbit: m.evEbit,
    pe: m.pe,
    pb: m.pb,
    revenue: { value: company.financials[0].incomeStatement.revenue, meaningful: true },
    ebitdaMargin: m.margins.ebitdaMargin,
    netMargin: m.margins.netMargin,
    revenueGrowth: m.revenueGrowth,
  };
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

  const currentPeerTickers = peersParam
    ? peersParam.split(",").map((t) => t.trim().toUpperCase()).filter(Boolean)
    : suggestedTickers;

  const peerCompanies = currentPeerTickers
    .map((t) => getDemoCompany(t))
    .filter((c): c is DemoCompany => c !== null && c.profile.ticker !== company.profile.ticker);

  const subjectRow = toRow(company, true);
  const peerRows = peerCompanies.map((c) => toRow(c, false));
  const rows = [subjectRow, ...peerRows];

  const peerQuartiles = {
    evRevenue: quartilesFromMetrics(peerRows.map((r) => r.evRevenue)),
    evEbitda: quartilesFromMetrics(peerRows.map((r) => r.evEbitda)),
    evEbit: quartilesFromMetrics(peerRows.map((r) => r.evEbit)),
    pe: quartilesFromMetrics(peerRows.map((r) => r.pe)),
    pb: quartilesFromMetrics(peerRows.map((r) => r.pb)),
  };

  const subjectMetrics = computeCompanyMetrics(company);
  const subjectCurrent = company.financials[0];
  const bs = subjectCurrent.balanceSheet;
  const subjectTotalDebt = subjectMetrics.totalDebt;
  const subjectEbitda = subjectMetrics.ebitda.value;
  const subjectShares = company.market.sharesOutstanding;

  const q1Valuation = impliedValuation(
    peerQuartiles.evEbitda?.q1 ?? null,
    subjectEbitda,
    subjectTotalDebt,
    bs.preferredStock ?? 0,
    bs.noncontrollingInterest ?? 0,
    bs.cashAndEquivalents,
    subjectShares
  );
  const medianValuation = impliedValuation(
    peerQuartiles.evEbitda?.median ?? null,
    subjectEbitda,
    subjectTotalDebt,
    bs.preferredStock ?? 0,
    bs.noncontrollingInterest ?? 0,
    bs.cashAndEquivalents,
    subjectShares
  );
  const q3Valuation = impliedValuation(
    peerQuartiles.evEbitda?.q3 ?? null,
    subjectEbitda,
    subjectTotalDebt,
    bs.preferredStock ?? 0,
    bs.noncontrollingInterest ?? 0,
    bs.cashAndEquivalents,
    subjectShares
  );

  const summaries = listDemoCompanySummaries();
  const suggestedOptions = suggested.map((p) => ({ ticker: p.ticker, name: p.name, rationale: p.rationale }));
  const otherOptions = summaries
    .filter((s) => s.ticker !== company.profile.ticker && !suggestedTickers.includes(s.ticker))
    .map((s) => ({ ticker: s.ticker, name: s.name }));

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-12">
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
        currentPeers={currentPeerTickers}
        suggestedPeerTickers={suggestedTickers}
        suggested={suggestedOptions}
        others={otherOptions}
      />

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
          Comps table
        </h2>
        <CompsTable rows={rows} />
        <a
          href={`/api/analysis/${company.profile.ticker}/csv?peers=${currentPeerTickers.join(",")}`}
          download
          className="w-fit text-xs text-muted-foreground underline underline-offset-4"
        >
          Download comps table (.csv)
        </a>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
          Peer quartile statistics
        </h2>
        <QuartileTable
          rows={[
            { label: "EV / Revenue", stats: peerQuartiles.evRevenue, subjectValue: subjectRow.evRevenue },
            { label: "EV / EBITDA", stats: peerQuartiles.evEbitda, subjectValue: subjectRow.evEbitda },
            { label: "EV / EBIT", stats: peerQuartiles.evEbit, subjectValue: subjectRow.evEbit },
            { label: "P / E", stats: peerQuartiles.pe, subjectValue: subjectRow.pe },
            { label: "P / B", stats: peerQuartiles.pb, subjectValue: subjectRow.pb },
          ]}
        />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
          Implied valuation range
        </h2>
        <ValuationRangeCard
          q1Price={q1Valuation.impliedSharePrice}
          medianPrice={medianValuation.impliedSharePrice}
          q3Price={q3Valuation.impliedSharePrice}
          currentPrice={company.market.sharePrice}
        />
      </section>

      <p className="text-xs text-muted-foreground">
        The peer group above is encoded in the URL — copy the link to share or reload this exact
        comparison. No account needed.
      </p>
    </div>
  );
}
