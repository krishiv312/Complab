import type { DemoCompany, MetricResult } from "./types";
import {
  calculateMarketCap,
  calculateEnterpriseValue,
  calculateEBITDA,
  calculateEVRevenue,
  calculateEVEBITDA,
  calculateEVEBIT,
  calculatePE,
  calculatePB,
  calculateMargins,
  calculateRevenueGrowth,
  type MarginResults,
} from "./multiples";

export interface CompanyMetrics {
  marketCap: MetricResult;
  totalDebt: number | null;
  enterpriseValue: MetricResult;
  ebitda: MetricResult;
  evRevenue: MetricResult;
  evEbitda: MetricResult;
  evEbit: MetricResult;
  pe: MetricResult;
  pb: MetricResult;
  margins: MarginResults;
  revenueGrowth: MetricResult;
}

/** A directly-reported figure, shown through the same N/A-aware rendering as computed metrics. */
export function directResult(value: number | null): MetricResult {
  return { value, meaningful: value !== null };
}

export function computeCompanyMetrics(company: DemoCompany): CompanyMetrics {
  const [current, prior] = company.financials;
  const { incomeStatement: is, balanceSheet: bs } = current;

  const marketCap = calculateMarketCap(
    company.market.sharePrice,
    company.market.sharesOutstanding
  );

  const totalDebt =
    bs.shortTermDebt !== null && bs.longTermDebt !== null
      ? bs.shortTermDebt + bs.longTermDebt
      : null;

  const enterpriseValue = calculateEnterpriseValue(
    marketCap.value,
    totalDebt,
    bs.preferredStock,
    bs.noncontrollingInterest,
    bs.cashAndEquivalents
  );

  const ebitda = calculateEBITDA(is.operatingIncome, is.depreciationAmortization);

  return {
    marketCap,
    totalDebt,
    enterpriseValue,
    ebitda,
    evRevenue: calculateEVRevenue(enterpriseValue.value, is.revenue),
    evEbitda: calculateEVEBITDA(enterpriseValue.value, ebitda.value),
    evEbit: calculateEVEBIT(enterpriseValue.value, is.operatingIncome),
    pe: calculatePE(company.market.sharePrice, is.epsDiluted),
    pb: calculatePB(marketCap.value, bs.totalShareholdersEquity),
    margins: calculateMargins(is.revenue, ebitda.value, is.operatingIncome, is.netIncome),
    revenueGrowth: prior
      ? calculateRevenueGrowth(is.revenue, prior.incomeStatement.revenue)
      : { value: null, meaningful: false, note: "no prior period available" },
  };
}
