import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowLeftRight } from "lucide-react";
import { getDemoCompany, listDemoTickers } from "@/lib/data/demo";
import { computeCompanyMetrics, directResult } from "@/lib/finance/compute";
import { safeDivide } from "@/lib/finance/multiples";
import { MiniMetricCard } from "@/components/company/mini-metric-card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { StaggerList, StaggerItem } from "@/components/motion/stagger";

export function generateStaticParams() {
  return listDemoTickers().map((ticker) => ({ ticker }));
}

export default async function CompanyPage({
  params,
}: {
  params: Promise<{ ticker: string }>;
}) {
  const { ticker } = await params;
  const company = getDemoCompany(ticker);

  if (!company) {
    notFound();
  }

  const metrics = computeCompanyMetrics(company);
  const current = company.financials[0];
  const periodLabel = `FY${current.period.fiscalYear}`;
  const bookValuePerShare = safeDivide(
    current.balanceSheet.totalShareholdersEquity,
    company.market.sharesOutstanding
  );

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-12">
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
          </div>
        </div>
        <div className="flex items-center gap-4 sm:justify-end">
          <div className="flex flex-col items-start sm:items-end">
            <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Current price
            </span>
            <span className="font-mono text-2xl font-semibold tabular-nums">
              ${company.market.sharePrice.toFixed(2)}
            </span>
          </div>
          <Link
            href={`/analysis/${company.profile.ticker}`}
            className={cn(buttonVariants({ variant: "default" }), "h-9 gap-1.5 px-4")}
          >
            <ArrowLeftRight size={14} />
            Compare
          </Link>
        </div>
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
          Financials — {periodLabel}
        </h2>
        <StaggerList className="grid grid-cols-2 gap-3 sm:grid-cols-4" stagger={0.03}>
          <StaggerItem>
            <MiniMetricCard label="Price" result={directResult(company.market.sharePrice)} formatType="perShare" />
          </StaggerItem>
          <StaggerItem>
            <MiniMetricCard label="Market cap" result={metrics.marketCap} formatType="currency" />
          </StaggerItem>
          <StaggerItem>
            <MiniMetricCard label="Enterprise value" result={metrics.enterpriseValue} formatType="currency" />
          </StaggerItem>
          <StaggerItem>
            <MiniMetricCard label="Revenue (TTM)" result={directResult(current.incomeStatement.revenue)} formatType="currency" />
          </StaggerItem>
          <StaggerItem>
            <MiniMetricCard label="EBITDA" result={metrics.ebitda} formatType="currency" />
          </StaggerItem>
          <StaggerItem>
            <MiniMetricCard label="EBIT" result={directResult(current.incomeStatement.operatingIncome)} formatType="currency" />
          </StaggerItem>
          <StaggerItem>
            <MiniMetricCard label="Net income" result={directResult(current.incomeStatement.netIncome)} formatType="currency" />
          </StaggerItem>
          <StaggerItem>
            <MiniMetricCard label="EPS" result={directResult(current.incomeStatement.epsDiluted)} formatType="perShare" />
          </StaggerItem>
          <StaggerItem>
            <MiniMetricCard label="Book value / sh" result={bookValuePerShare} formatType="perShare" />
          </StaggerItem>
          <StaggerItem>
            <MiniMetricCard
              label="Shares outstanding"
              result={directResult(company.market.sharesOutstanding)}
              formatType="shares"
            />
          </StaggerItem>
          <StaggerItem>
            <MiniMetricCard label="Revenue growth" result={metrics.revenueGrowth} formatType="percent" colorBySign />
          </StaggerItem>
          <StaggerItem>
            <MiniMetricCard label="EBITDA margin" result={metrics.margins.ebitdaMargin} formatType="percent" />
          </StaggerItem>
        </StaggerList>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
          Valuation multiples
        </h2>
        <StaggerList className="grid grid-cols-2 gap-3 sm:grid-cols-5" stagger={0.03}>
          <StaggerItem>
            <MiniMetricCard label="EV/Revenue" result={metrics.evRevenue} formatType="multiple" />
          </StaggerItem>
          <StaggerItem>
            <MiniMetricCard label="EV/EBITDA" result={metrics.evEbitda} formatType="multiple" />
          </StaggerItem>
          <StaggerItem>
            <MiniMetricCard label="EV/EBIT" result={metrics.evEbit} formatType="multiple" />
          </StaggerItem>
          <StaggerItem>
            <MiniMetricCard label="P/E" result={metrics.pe} formatType="multiple" />
          </StaggerItem>
          <StaggerItem>
            <MiniMetricCard label="P/B" result={metrics.pb} formatType="multiple" />
          </StaggerItem>
        </StaggerList>
      </section>

      <div className="flex flex-col gap-1 border-t border-border pt-4 text-xs text-muted-foreground">
        <p>
          Source: {current.source.kind === "SEC_EDGAR_10K" ? "SEC 10-K" : current.source.kind} {periodLabel}
          {" · "}Retrieved {current.source.retrievedAt}
        </p>
        <p>
          <strong className="text-foreground">Not investment advice.</strong> Figures sourced from
          public SEC filings and market quotes. N/A denotes missing data; N/M denotes a misleading
          value (e.g. negative denominator).
        </p>
      </div>

      <section className="flex flex-col gap-3 border-t border-border pt-8">
        <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
          Download
        </h2>
        <div className="flex flex-wrap gap-3">
          <a
            href={`/api/company/${company.profile.ticker}/csv`}
            download
            className={cn(buttonVariants({ variant: "default" }), "h-9 px-4")}
          >
            Download spreadsheet (.csv)
          </a>
          <a
            href={`/api/company/${company.profile.ticker}/pdf`}
            download
            className={cn(buttonVariants({ variant: "outline" }), "h-9 px-4")}
          >
            Download PDF
          </a>
        </div>
        <p className="text-xs text-muted-foreground">
          The spreadsheet opens directly in Excel or Google Sheets; the PDF is a one-page summary
          for viewing or sharing.
        </p>
      </section>
    </div>
  );
}
