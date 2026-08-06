import { notFound } from "next/navigation";
import Link from "next/link";
import { getDemoCompany, listDemoTickers } from "@/lib/data/demo";
import { computeCompanyMetrics, directResult } from "@/lib/finance/compute";
import { MetricCard } from "@/components/company/metric-card";
import { buttonVariants } from "@/components/ui/button";
import { formatCurrency, formatMultiple, formatPercent } from "@/lib/format";
import { cn } from "@/lib/utils";

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

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-6 py-12">
      <header className="flex flex-col gap-1">
        <div className="flex items-baseline gap-3">
          <h1 className="font-heading text-3xl font-semibold tracking-tight">{company.profile.name}</h1>
          <span className="text-lg text-muted-foreground">{company.profile.ticker}</span>
        </div>
        <p className="text-sm text-muted-foreground">
          {company.profile.exchange} · {company.profile.sector} · {company.profile.industry}
        </p>
        <Link
          href={`/analysis/${company.profile.ticker}`}
          className="mt-1 text-xs text-muted-foreground underline underline-offset-4"
        >
          Compare against peers
        </Link>
      </header>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
          Financial summary — {periodLabel}
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            label="Revenue"
            result={directResult(current.incomeStatement.revenue)}
            format={formatCurrency}
            period={periodLabel}
            currency={current.period.currency}
            source={current.source}
          />
          <MetricCard
            label="EBITDA"
            result={metrics.ebitda}
            format={formatCurrency}
            period={periodLabel}
            currency={current.period.currency}
            source={current.source}
          />
          <MetricCard
            label="Net income"
            result={directResult(current.incomeStatement.netIncome)}
            format={formatCurrency}
            period={periodLabel}
            currency={current.period.currency}
            source={current.source}
          />
          <MetricCard
            label="Net margin"
            result={metrics.margins.netMargin}
            format={formatPercent}
            period={periodLabel}
            currency={current.period.currency}
            source={current.source}
          />
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
          Valuation — as of {company.market.priceAsOf}
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            label="Market cap"
            result={metrics.marketCap}
            format={formatCurrency}
            period={company.market.priceAsOf}
            currency={company.market.priceCurrency}
            source={company.market.priceSource}
          />
          <MetricCard
            label="Enterprise value"
            result={metrics.enterpriseValue}
            format={formatCurrency}
            period={periodLabel}
            currency={current.period.currency}
            source={current.source}
          />
          <MetricCard
            label="EV / Revenue"
            result={metrics.evRevenue}
            format={formatMultiple}
            period={periodLabel}
            currency={current.period.currency}
            source={current.source}
          />
          <MetricCard
            label="EV / EBITDA"
            result={metrics.evEbitda}
            format={formatMultiple}
            period={periodLabel}
            currency={current.period.currency}
            source={current.source}
          />
          <MetricCard
            label="P / E"
            result={metrics.pe}
            format={formatMultiple}
            period={company.market.priceAsOf}
            currency={company.market.priceCurrency}
            source={company.market.priceSource}
          />
        </div>
      </section>

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
