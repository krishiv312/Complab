import { z } from "zod";
import type { DemoCompany } from "../finance/types";

const SourceRefSchema = z.object({
  kind: z.enum(["SEC_EDGAR_10K", "SEC_EDGAR_10Q", "MARKET_QUOTE", "MANUAL"]),
  documentUrl: z.string().nullable(),
  filingDate: z.string().nullable(),
  retrievedAt: z.string(),
  note: z.string().optional(),
});

const CompanyProfileSchema = z.object({
  cik: z.string(),
  ticker: z.string(),
  name: z.string(),
  exchange: z.string(),
  sector: z.string(),
  industry: z.string(),
  subIndustry: z.string(),
  sicCode: z.string().nullable(),
  description: z.string(),
  headquarters: z.string(),
  fiscalYearEndMonth: z.number().int().min(1).max(12),
  isFinancial: z.boolean(),
});

const IncomeStatementSchema = z.object({
  revenue: z.number().nullable(),
  costOfRevenue: z.number().nullable(),
  grossProfit: z.number().nullable(),
  operatingIncome: z.number().nullable(),
  operatingIncomeIsDerived: z.boolean(),
  derivationNote: z.string().optional(),
  depreciationAmortization: z.number().nullable(),
  interestIncome: z.number().nullable(),
  interestExpenseGross: z.number().nullable(),
  interestExpenseNet: z.number().nullable(),
  interestExpenseNetIsDerived: z.boolean(),
  pretaxIncome: z.number().nullable(),
  netIncome: z.number().nullable(),
  netIncomeConsolidated: z.number().nullable().optional(),
  epsBasic: z.number().nullable(),
  epsDiluted: z.number().nullable(),
  weightedAvgSharesBasic: z.number().nullable(),
  weightedAvgSharesDiluted: z.number().nullable(),
});

const BalanceSheetSchema = z.object({
  cashAndEquivalents: z.number().nullable(),
  shortTermInvestments: z.number().nullable(),
  totalCurrentAssets: z.number().nullable(),
  totalAssets: z.number().nullable(),
  shortTermDebt: z.number().nullable(),
  longTermDebt: z.number().nullable(),
  operatingLeaseLiabilitiesCurrent: z.number().nullable(),
  operatingLeaseLiabilitiesNoncurrent: z.number().nullable(),
  preferredStock: z.number().nullable(),
  noncontrollingInterest: z.number().nullable(),
  noncontrollingInterestNonredeemable: z.number().nullable().optional(),
  noncontrollingInterestRedeemable: z.number().nullable().optional(),
  totalShareholdersEquity: z.number().nullable(),
});

const PeriodMetaSchema = z.object({
  periodType: z.enum(["FY", "LTM", "Q"]),
  fiscalYear: z.number(),
  periodStart: z.string().nullable(),
  periodEnd: z.string(),
  currency: z.literal("USD"),
});

const PeriodFinancialsSchema = z.object({
  period: PeriodMetaSchema,
  incomeStatement: IncomeStatementSchema,
  balanceSheet: BalanceSheetSchema,
  source: SourceRefSchema,
});

const MarketSnapshotSchema = z.object({
  sharePrice: z.number(),
  priceCurrency: z.literal("USD"),
  priceAsOf: z.string(),
  priceSource: SourceRefSchema,
  sharesOutstanding: z.number(),
  sharesOutstandingAsOf: z.string(),
  sharesOutstandingNote: z.string().optional(),
  sharesSource: SourceRefSchema,
});

export const DemoCompanySchema = z.object({
  profile: CompanyProfileSchema,
  financials: z.array(PeriodFinancialsSchema).min(1),
  market: MarketSnapshotSchema,
});

/** Throws with a field-path-annotated message on failure - the last, unconditional step of ingestCompany(). */
export function parseDemoCompany(data: unknown, context: { ticker: string }): DemoCompany {
  const result = DemoCompanySchema.safeParse(data);
  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `${i.path.join(".")}: ${i.message}`)
      .join("; ");
    throw new Error(`[${context.ticker}] normalized data failed schema validation: ${issues}`);
  }
  return result.data as DemoCompany;
}

// Raw wire shapes - loose validation, just enough to catch a changed API contract early.
export const TickerLookupSchema = z.record(
  z.string(),
  z.object({ cik_str: z.number(), ticker: z.string(), title: z.string() })
);

export const FinnhubQuoteSchema = z.object({
  c: z.number(), // current price
  t: z.number(), // timestamp
});

export const FinnhubCandleSchema = z.object({
  s: z.string(), // status: "ok" | "no_data"
  c: z.array(z.number()).optional(),
  t: z.array(z.number()).optional(),
});
