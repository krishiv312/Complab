import { notFound } from "next/navigation";
import { getDemoCompany, listDemoTickers } from "@/lib/data/demo";
import { computeCompanyMetrics, directResult } from "@/lib/finance/compute";
import { MetricCard } from "@/components/company/metric-card";
import { formatCurrency, formatMultiple, formatPercent } from "@/lib/format";

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
          <h1 className="text-3xl font-semibold">{company.profile.name}</h1>
          <span className="text-lg text-muted-foreground">{company.profile.ticker}</span>
        </div>
        <p className="text-sm text-muted-foreground">
          {company.profile.exchange} · {company.profile.sector} · {company.profile.industry}
        </p>
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
    </div>
  );
}
