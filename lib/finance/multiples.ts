import { MetricResult } from "./types";

export function safeDivide(
  numerator: number | null,
  denominator: number | null
): MetricResult {
  if (numerator === null || denominator === null) {
    return { value: null, meaningful: false, note: "missing input" };
  }
  if (denominator === 0) {
    return { value: null, meaningful: false, note: "zero denominator" };
  }
  return { value: numerator / denominator, meaningful: true };
}

export function calculateMarketCap(
  sharePrice: number | null,
  sharesOutstanding: number | null
): MetricResult {
  if (sharePrice === null || sharesOutstanding === null) {
    return {
      value: null,
      meaningful: false,
      note: "missing share price or shares outstanding",
    };
  }
  return { value: sharePrice * sharesOutstanding, meaningful: true };
}

export function calculateEnterpriseValue(
  marketCap: number | null,
  totalDebt: number | null,
  preferredStock: number | null,
  noncontrollingInterest: number | null,
  cashAndEquivalents: number | null
): MetricResult {
  if (
    marketCap === null ||
    totalDebt === null ||
    preferredStock === null ||
    noncontrollingInterest === null ||
    cashAndEquivalents === null
  ) {
    return { value: null, meaningful: false, note: "missing input" };
  }
  const value =
    marketCap + totalDebt + preferredStock + noncontrollingInterest - cashAndEquivalents;
  return { value, meaningful: true };
}

export function calculateEBITDA(
  operatingIncome: number | null,
  depreciationAmortization: number | null
): MetricResult {
  if (operatingIncome === null || depreciationAmortization === null) {
    return {
      value: null,
      meaningful: false,
      note: "missing operating income or D&A",
    };
  }
  return {
    value: operatingIncome + depreciationAmortization,
    meaningful: true,
    note: "computed as operating income + D&A; not a reported GAAP figure",
  };
}

export function calculateEVRevenue(
  enterpriseValue: number | null,
  revenue: number | null
): MetricResult {
  return safeDivide(enterpriseValue, revenue);
}

export function calculateEVEBITDA(
  enterpriseValue: number | null,
  ebitda: number | null
): MetricResult {
  const result = safeDivide(enterpriseValue, ebitda);
  if (result.value !== null && ebitda !== null && ebitda < 0) {
    return {
      value: result.value,
      meaningful: false,
      note: "N/M — negative EBITDA makes this multiple meaningless",
    };
  }
  return result;
}

export function calculateEVEBIT(
  enterpriseValue: number | null,
  ebit: number | null
): MetricResult {
  const result = safeDivide(enterpriseValue, ebit);
  if (result.value !== null && ebit !== null && ebit < 0) {
    return {
      value: result.value,
      meaningful: false,
      note: "N/M — negative EBIT makes this multiple meaningless",
    };
  }
  return result;
}

export function calculatePE(
  sharePrice: number | null,
  epsDiluted: number | null
): MetricResult {
  const result = safeDivide(sharePrice, epsDiluted);
  if (result.value !== null && epsDiluted !== null && epsDiluted < 0) {
    return {
      value: result.value,
      meaningful: false,
      note: "N/M — negative earnings makes P/E meaningless",
    };
  }
  return result;
}

export function calculatePB(
  marketCap: number | null,
  totalShareholdersEquity: number | null
): MetricResult {
  const result = safeDivide(marketCap, totalShareholdersEquity);
  if (
    result.value !== null &&
    totalShareholdersEquity !== null &&
    totalShareholdersEquity < 0
  ) {
    return {
      value: result.value,
      meaningful: false,
      note: "N/M — negative book equity makes P/B meaningless",
    };
  }
  return result;
}

export interface MarginResults {
  ebitdaMargin: MetricResult;
  ebitMargin: MetricResult;
  netMargin: MetricResult;
}

export function calculateMargins(
  revenue: number | null,
  ebitda: number | null,
  ebit: number | null,
  netIncome: number | null
): MarginResults {
  return {
    ebitdaMargin: safeDivide(ebitda, revenue),
    ebitMargin: safeDivide(ebit, revenue),
    netMargin: safeDivide(netIncome, revenue),
  };
}

export function calculateRevenueGrowth(
  currentRevenue: number | null,
  priorRevenue: number | null
): MetricResult {
  if (currentRevenue === null || priorRevenue === null) {
    return { value: null, meaningful: false, note: "missing input" };
  }
  return safeDivide(currentRevenue - priorRevenue, priorRevenue);
}
