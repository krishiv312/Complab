/**
 * lib/finance/types.ts
 *
 * The canonical shape of financial data in CompLab.
 *
 * UNIT CONVENTION — read this before entering any data.
 *   All currency amounts .......... MILLIONS  (e.g. 3,962.5 means $3.96bn)
 *   All share counts .............. MILLIONS  (e.g. 60.1 means 60,100,000 shares)
 *   EPS ........................... ACTUAL dollars per share (e.g. 3.35)
 *   Share price ................... ACTUAL dollars (e.g. 108.42)
 *
 * This matches how 10-Ks present figures, which minimises transcription error.
 * The loader converts to base units in exactly one place, and that conversion
 * is tested. Never hand-multiply.
 *
 * NULL CONVENTION
 *   null  = the figure is genuinely not available or not reported
 *   0     = the figure is reported and is zero
 * These are different facts. Conflating them is how fabricated data enters a
 * system. If you cannot find a number in the filing, write null.
 */

export type Currency = "USD";

export type SourceKind =
  | "SEC_EDGAR_10K"
  | "SEC_EDGAR_10Q"
  | "MARKET_QUOTE"
  | "MANUAL";

export interface SourceRef {
  kind: SourceKind;
  /** Direct link to the filing on sec.gov */
  documentUrl: string | null;
  /** ISO date the document was filed */
  filingDate: string | null;
  /** ISO timestamp you recorded this */
  retrievedAt: string;
  /** Anything a reader would need to interpret the figures */
  note?: string;
}

export interface PeriodMeta {
  periodType: "FY" | "LTM" | "Q";
  fiscalYear: number;
  /** ISO date, null if not stated */
  periodStart: string | null;
  /** ISO date — required */
  periodEnd: string;
  currency: Currency;
}

export interface IncomeStatement {
  revenue: number | null;
  costOfRevenue: number | null;
  grossProfit: number | null;

  /**
   * EBIT. Some companies report a clean "Operating income" line; some do not.
   * If you had to derive it as (pretax income + net interest expense), set
   * operatingIncomeIsDerived to true and explain in derivationNote.
   */
  operatingIncome: number | null;
  operatingIncomeIsDerived: boolean;
  derivationNote?: string;

  /** From the CASH FLOW statement, not the income statement */
  depreciationAmortization: number | null;

  interestExpenseNet: number | null;
  pretaxIncome: number | null;
  netIncome: number | null;

  epsBasic: number | null;
  epsDiluted: number | null;

  /** Weighted average — used for EPS. NOT used for market cap. */
  weightedAvgSharesBasic: number | null;
  weightedAvgSharesDiluted: number | null;
}

export interface BalanceSheet {
  cashAndEquivalents: number | null;
  /** Recorded separately — whether to net it against debt is a policy choice */
  shortTermInvestments: number | null;

  totalCurrentAssets: number | null;
  totalAssets: number | null;

  /** Notes payable + current portion of long-term debt */
  shortTermDebt: number | null;
  longTermDebt: number | null;

  /**
   * Recorded separately from debt on purpose. Whether operating leases count
   * as debt is the single biggest source of disagreement between data vendors.
   * See DATA_QUALITY_STRATEGY.md.
   */
  operatingLeaseLiabilitiesCurrent: number | null;
  operatingLeaseLiabilitiesNoncurrent: number | null;

  preferredStock: number | null;
  noncontrollingInterest: number | null;
  totalShareholdersEquity: number | null;
}

export interface MarketSnapshot {
  sharePrice: number;
  priceCurrency: Currency;
  /** ISO date of the price. Required — a price without a date is useless. */
  priceAsOf: string;

  /**
   * CURRENT shares outstanding, from the 10-K cover page.
   * This is NOT the weighted average diluted count from the income statement.
   * Market cap uses this. EPS uses the weighted average. They differ, sometimes
   * materially, and mixing them up is a classic comps error.
   */
  sharesOutstanding: number;
  sharesOutstandingAsOf: string;
  /** e.g. "Class A 305.9 + Class B 1,181.3" */
  sharesOutstandingNote?: string;

  source: SourceRef;
}

export interface CompanyProfile {
  /** 10-digit zero-padded, the canonical key */
  cik: string;
  ticker: string;
  name: string;
  exchange: string;
  sector: string;
  industry: string;
  subIndustry: string;
  sicCode: string | null;
  description: string;
  headquarters: string;
  /** 1–12. Matters for period alignment across peers. */
  fiscalYearEndMonth: number;
  /** Banks, insurers, REITs — excluded from standard EV-based comps */
  isFinancial: boolean;
}

export interface PeriodFinancials {
  period: PeriodMeta;
  incomeStatement: IncomeStatement;
  balanceSheet: BalanceSheet;
  source: SourceRef;
}

export interface DemoCompany {
  profile: CompanyProfile;
  /** Most recent period first. Two years minimum, for growth calculations. */
  financials: PeriodFinancials[];
  market: MarketSnapshot;
}

/**
 * Every calculated metric returns this shape rather than a bare number.
 *
 *   value = null                       → renders as "N/A" (data missing)
 *   value != null, meaningful = false  → renders as "N/M" (not meaningful)
 *   value != null, meaningful = true   → renders as the number
 */
export interface MetricResult {
  value: number | null;
  meaningful: boolean;
  note?: string;
}
