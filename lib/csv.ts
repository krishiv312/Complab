import type { DemoCompany, MetricResult } from "./finance/types";
import { computeCompanyMetrics } from "./finance/compute";

function escapeCell(value: string | number | null): string {
  if (value === null) return "";
  const s = String(value);
  if (/[",\n]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function row(cells: (string | number | null)[]): string {
  return cells.map(escapeCell).join(",");
}

function metricCell(result: MetricResult): string {
  if (result.value === null) return "N/A";
  if (!result.meaningful) return `N/M (${result.value})`;
  return String(result.value);
}

export function buildCompanyCsv(company: DemoCompany): string {
  const [current, prior] = company.financials;
  const metrics = computeCompanyMetrics(company);
  const lines: string[] = [];

  lines.push(row(["Company", company.profile.name]));
  lines.push(row(["Ticker", company.profile.ticker]));
  lines.push(row(["Exchange", company.profile.exchange]));
  lines.push(row(["Sector", company.profile.sector]));
  lines.push(row(["Industry", company.profile.industry]));
  lines.push("");

  const fyCurrent = `FY${current.period.fiscalYear}`;
  const fyPrior = prior ? `FY${prior.period.fiscalYear}` : "";

  lines.push(row(["Income Statement (millions USD)", fyCurrent, fyPrior]));
  const isRows: [string, number | null, number | null][] = [
    ["Revenue", current.incomeStatement.revenue, prior?.incomeStatement.revenue ?? null],
    ["Cost of revenue", current.incomeStatement.costOfRevenue, prior?.incomeStatement.costOfRevenue ?? null],
    ["Gross profit", current.incomeStatement.grossProfit, prior?.incomeStatement.grossProfit ?? null],
    ["Operating income (EBIT)", current.incomeStatement.operatingIncome, prior?.incomeStatement.operatingIncome ?? null],
    ["Depreciation & amortization", current.incomeStatement.depreciationAmortization, prior?.incomeStatement.depreciationAmortization ?? null],
    ["Pretax income", current.incomeStatement.pretaxIncome, prior?.incomeStatement.pretaxIncome ?? null],
    ["Net income", current.incomeStatement.netIncome, prior?.incomeStatement.netIncome ?? null],
    ["EPS diluted", current.incomeStatement.epsDiluted, prior?.incomeStatement.epsDiluted ?? null],
  ];
  for (const [label, cur, pri] of isRows) {
    lines.push(row([label, cur, pri]));
  }
  lines.push("");

  lines.push(row(["Balance Sheet (millions USD)", fyCurrent, fyPrior]));
  const bsRows: [string, number | null, number | null][] = [
    ["Cash and equivalents", current.balanceSheet.cashAndEquivalents, prior?.balanceSheet.cashAndEquivalents ?? null],
    ["Short-term debt", current.balanceSheet.shortTermDebt, prior?.balanceSheet.shortTermDebt ?? null],
    ["Long-term debt", current.balanceSheet.longTermDebt, prior?.balanceSheet.longTermDebt ?? null],
    ["Total shareholders' equity", current.balanceSheet.totalShareholdersEquity, prior?.balanceSheet.totalShareholdersEquity ?? null],
  ];
  for (const [label, cur, pri] of bsRows) {
    lines.push(row([label, cur, pri]));
  }
  lines.push("");

  lines.push(row(["Valuation (as of " + company.market.priceAsOf + ")", ""]));
  lines.push(row(["Share price", company.market.sharePrice]));
  lines.push(row(["Shares outstanding (millions)", company.market.sharesOutstanding]));
  lines.push(row(["Market cap ($M)", metricCell(metrics.marketCap)]));
  lines.push(row(["Enterprise value ($M)", metricCell(metrics.enterpriseValue)]));
  lines.push(row(["EBITDA ($M, computed)", metricCell(metrics.ebitda)]));
  lines.push(row(["EV / Revenue", metricCell(metrics.evRevenue)]));
  lines.push(row(["EV / EBITDA", metricCell(metrics.evEbitda)]));
  lines.push(row(["EV / EBIT", metricCell(metrics.evEbit)]));
  lines.push(row(["P / E", metricCell(metrics.pe)]));
  lines.push(row(["P / B", metricCell(metrics.pb)]));
  lines.push(row(["EBITDA margin", metricCell(metrics.margins.ebitdaMargin)]));
  lines.push(row(["Net margin", metricCell(metrics.margins.netMargin)]));
  lines.push(row(["Revenue growth", metricCell(metrics.revenueGrowth)]));
  lines.push("");

  lines.push(row(["Source", current.source.documentUrl ?? ""]));
  lines.push(row(["Filing date", current.source.filingDate ?? ""]));
  lines.push(row(["Retrieved", current.source.retrievedAt]));
  lines.push(row(["Disclaimer", "Not investment advice. Demo data, hand-verified against SEC filings."]));

  return lines.join("\r\n") + "\r\n";
}
