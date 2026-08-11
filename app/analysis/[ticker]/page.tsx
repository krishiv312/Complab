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
import { ScrollProgress } from "@/components/motion/scroll-progress";
import { ReportHero } from "@/components/analysis/report-hero";
import { NarrativeSection } from "@/components/analysis/narrative-section";
import { SpotlightCard } from "@/components/motion/spotlight-card";
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

  const peerCount = peerRows.length;
  const peerCountLabel = `${peerCount} peer${peerCount === 1 ? "" : "s"}`;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col px-6 py-8">
      <ScrollProgress />

      <Link
        href="/"
        className="flex w-fit items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft size={14} />
        Search
      </Link>

      <ReportHero
        ticker={company.profile.ticker}
        name={company.profile.name}
        exchange={company.profile.exchange}
        sector={company.profile.sector}
        industry={company.profile.industry}
        price={company.market.sharePrice}
        marketCap={subjectMetrics.marketCap}
        revenueGrowth={subjectRow.revenueGrowth}
      />

      <div className="flex flex-col gap-16 border-t border-border pt-4">
        <NarrativeSection
          index="01"
          eyebrow="The comparable set"
          title="Benchmarked against its true peers"
          description={`We measure ${company.profile.name} against ${peerCountLabel} across ${company.profile.industry}. Every figure below is computed from the latest filed financials — no estimates, no analyst adjustments.`}
        >
          <div className="flex flex-col gap-4">
            <ComparedStrip
              subjectTicker={company.profile.ticker}
              peers={peerRows.map((r) => ({ ticker: r.ticker }))}
              editHref={`/analysis/${company.profile.ticker}/compare?peers=${currentPeerTickers.join(",")}`}
            />

            <SpotlightCard className="flex flex-col gap-3 p-4">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <h3 className="font-heading text-sm font-semibold">Comparable companies</h3>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                    {rows.length}
                  </span>
                </div>
                <a
                  href={`/api/analysis/${company.profile.ticker}/csv?peers=${currentPeerTickers.join(",")}`}
                  download
                  className="text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground"
                >
                  Download CSV
                </a>
              </div>
              <CompsTable rows={rows} />
            </SpotlightCard>
          </div>
        </NarrativeSection>

        <NarrativeSection
          index="02"
          eyebrow="Valuation multiples"
          title="How the market prices each name"
          description="Two lenses on enterprise value: EV/EBITDA strips out capital structure and taxes; EV/Revenue ignores profitability entirely. The subject is highlighted throughout."
        >
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <MultipleBarChart rows={rows} metricKey="evEbitda" label="EV/EBITDA" />
            <MultipleBarChart rows={rows} metricKey="evRevenue" label="EV/Revenue" />
          </div>
        </NarrativeSection>

        <NarrativeSection
          index="03"
          eyebrow="Growth vs profitability"
          title="Faster growth, richer multiple?"
          description="Faster growth should earn a richer multiple — but only when it converts to margin. Here, revenue growth (YoY) meets EBITDA margin for every name in the set."
        >
          <GrowthMarginScatter rows={rows} />
        </NarrativeSection>

        <NarrativeSection
          index="04"
          eyebrow="Where peers sit"
          title="The distribution, in quartiles"
          description={`Splitting the peer set into quartiles frames the distribution. ${company.profile.ticker}'s own multiples sit beside the range so you can see cheap, in-line, or rich at a glance.`}
        >
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <QuartileTable
              rows={[
                { label: "EV / Revenue", stats: peerQuartiles.evRevenue, subjectValue: subjectRow.evRevenue },
                { label: "EV / EBITDA", stats: peerQuartiles.evEbitda, subjectValue: subjectRow.evEbitda },
                { label: "EV / EBIT", stats: peerQuartiles.evEbit, subjectValue: subjectRow.evEbit },
                { label: "P / E", stats: peerQuartiles.pe, subjectValue: subjectRow.pe },
                { label: "P / B", stats: peerQuartiles.pb, subjectValue: subjectRow.pb },
              ]}
            />
            <ValuationRangeCard
              q1Price={q1Valuation.impliedSharePrice}
              medianPrice={medianValuation.impliedSharePrice}
              q3Price={q3Valuation.impliedSharePrice}
              currentPrice={company.market.sharePrice}
            />
          </div>
        </NarrativeSection>

        <NarrativeSection
          index="05"
          eyebrow="The verdict"
          title="What the field says about today's price"
          description={`Each method's peer quartiles imply a share-price range for ${company.profile.ticker}. The football field plots Q1–Q3 against today's market price — the median tick marks the peer-implied fair value.`}
        >
          <FootballFieldChart rows={footballFieldRows} currentPrice={company.market.sharePrice} />
        </NarrativeSection>
      </div>

      <p className="border-t border-border pt-6 text-xs text-muted-foreground">
        The peer group above is encoded in the URL — copy the link to share or reload this exact
        comparison. No account needed.
      </p>
    </div>
  );
}
