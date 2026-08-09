import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getDemoCompany, listDemoTickers, listAllDemoCompanies } from "@/lib/data/demo";
import { suggestPeers } from "@/lib/finance/peers";
import { computeCompanyMetrics } from "@/lib/finance/compute";
import { quartilesFromMetrics } from "@/lib/finance/statistics";
import { impliedValuation, impliedSharePriceDirect } from "@/lib/finance/valuation";
import { safeDivide } from "@/lib/finance/multiples";
import { ComparedStrip } from "@/components/comps/compared-strip";
import { CompsTable, type CompsRow } from "@/components/comps/comps-table";
import { QuartileTable, ValuationRangeCard } from "@/components/comps/valuation-summary";
import { MultipleBarChart } from "@/components/charts/multiple-bar-chart";
import { GrowthMarginScatter } from "@/components/charts/growth-margin-scatter";
import { FootballFieldChart, type FootballFieldRow } from "@/components/charts/football-field-chart";
import { MetricValue } from "@/components/company/metric-value";
import type { DemoCompany } from "@/lib/finance/types";

export function generateStaticParams() {
  return listDemoTickers().map((ticker) => ({ ticker }));
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

  const candidates = listAllDemoCompanies();
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

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-12">
      <Link
        href="/"
        className="flex w-fit items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft size={14} />
        Search
      </Link>

      <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5 shadow-sm ring-1 ring-foreground/[0.04] sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex size-14 shrink-0 items-center justify-center rounded-lg border border-primary/30 bg-accent font-mono text-sm font-semibold text-primary">
            {company.profile.ticker}
          </div>
          <div className="flex flex-col gap-0.5">
            <h1 className="font-heading text-2xl font-semibold tracking-tight">{company.profile.name}</h1>
            <p className="text-sm text-muted-foreground">
              {company.profile.ticker} · {company.profile.exchange} · {company.profile.sector} ·{" "}
              {company.profile.industry}
            </p>
            <Link
              href={`/company/${company.profile.ticker}`}
              className="w-fit text-xs text-muted-foreground underline underline-offset-4"
            >
              View company page
            </Link>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex flex-col items-start sm:items-end">
            <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Current price
            </span>
            <span className="font-mono text-lg font-semibold tabular-nums">
              ${company.market.sharePrice.toFixed(2)}
            </span>
          </div>
          <div className="flex flex-col items-start sm:items-end">
            <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Market cap
            </span>
            <MetricValue result={subjectMetrics.marketCap} formatType="currency" size="sm" />
          </div>
          <div className="flex flex-col items-start sm:items-end">
            <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Rev growth
            </span>
            <MetricValue result={subjectRow.revenueGrowth} formatType="percent" size="sm" colorBySign />
          </div>
        </div>
      </div>

      <ComparedStrip
        subjectTicker={company.profile.ticker}
        peers={peerRows.map((r) => ({ ticker: r.ticker }))}
        editHref={`/analysis/${company.profile.ticker}/compare?peers=${currentPeerTickers.join(",")}`}
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
