import { notFound } from "next/navigation";
import Link from "next/link";
import { getDemoCompany, listDemoTickers, listDemoCompanySummaries } from "@/lib/data/demo";
import { suggestPeers } from "@/lib/finance/peers";
import { computeCompanyMetrics } from "@/lib/finance/compute";
import { quartilesFromMetrics } from "@/lib/finance/statistics";
import { impliedValuation, impliedSharePriceDirect } from "@/lib/finance/valuation";
import { safeDivide } from "@/lib/finance/multiples";
import { PeerPicker } from "@/components/comps/peer-picker";
import { CompsTable, type CompsRow } from "@/components/comps/comps-table";
import { QuartileTable, ValuationRangeCard } from "@/components/comps/valuation-summary";
import { MultipleBarChart } from "@/components/charts/multiple-bar-chart";
import { GrowthMarginScatter } from "@/components/charts/growth-margin-scatter";
import { FootballFieldChart, type FootballFieldRow } from "@/components/charts/football-field-chart";
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

  function evImplied(peerMultiple: number | null, subjectMetric: number | null) {
    return impliedValuation(
      peerMultiple,
      subjectMetric,
      subjectTotalDebt,
      bs.preferredStock ?? 0,
      bs.noncontrollingInterest ?? 0,
      bs.cashAndEquivalents,
      subjectShares
    ).impliedSharePrice.value;
  }

  const bookValuePerShare = safeDivide(bs.totalShareholdersEquity, subjectShares).value;

  function directImplied(peerMultiple: number | null, subjectPerShareMetric: number | null) {
    const result = impliedSharePriceDirect(peerMultiple, subjectPerShareMetric);
    return result.meaningful ? result.value : null;
  }

  const footballFieldRows: FootballFieldRow[] = [
    {
      label: "EV / Revenue",
      q1: evImplied(peerQuartiles.evRevenue?.q1 ?? null, subjectCurrent.incomeStatement.revenue),
      median: evImplied(peerQuartiles.evRevenue?.median ?? null, subjectCurrent.incomeStatement.revenue),
      q3: evImplied(peerQuartiles.evRevenue?.q3 ?? null, subjectCurrent.incomeStatement.revenue),
    },
    {
      label: "EV / EBITDA",
      q1: q1Valuation.impliedSharePrice.value,
      median: medianValuation.impliedSharePrice.value,
      q3: q3Valuation.impliedSharePrice.value,
    },
    {
      label: "EV / EBIT",
      q1: evImplied(peerQuartiles.evEbit?.q1 ?? null, subjectCurrent.incomeStatement.operatingIncome),
      median: evImplied(peerQuartiles.evEbit?.median ?? null, subjectCurrent.incomeStatement.operatingIncome),
      q3: evImplied(peerQuartiles.evEbit?.q3 ?? null, subjectCurrent.incomeStatement.operatingIncome),
    },
    {
      label: "P / E",
      q1: directImplied(peerQuartiles.pe?.q1 ?? null, subjectCurrent.incomeStatement.epsDiluted),
      median: directImplied(peerQuartiles.pe?.median ?? null, subjectCurrent.incomeStatement.epsDiluted),
      q3: directImplied(peerQuartiles.pe?.q3 ?? null, subjectCurrent.incomeStatement.epsDiluted),
    },
    {
      label: "P / B",
      q1: directImplied(peerQuartiles.pb?.q1 ?? null, bookValuePerShare),
      median: directImplied(peerQuartiles.pb?.median ?? null, bookValuePerShare),
      q3: directImplied(peerQuartiles.pb?.q3 ?? null, bookValuePerShare),
    },
  ];

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
          Charts
        </h2>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <MultipleBarChart rows={rows} metricKey="evEbitda" label="EV/EBITDA" />
          <MultipleBarChart rows={rows} metricKey="evRevenue" label="EV/Revenue" />
          <div className="lg:col-span-2">
            <GrowthMarginScatter rows={rows} />
          </div>
        </div>
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

      <FootballFieldChart rows={footballFieldRows} currentPrice={company.market.sharePrice} />

      <p className="text-xs text-muted-foreground">
        The peer group above is encoded in the URL — copy the link to share or reload this exact
        comparison. No account needed.
      </p>
    </div>
  );
}
