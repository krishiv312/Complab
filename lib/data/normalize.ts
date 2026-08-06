import type { EdgarCompanyFacts, EdgarSubmissions, XbrlFactEntry } from "./edgar";
import type { BalanceSheet, CompanyProfile, IncomeStatement } from "../finance/types";

/**
 * Ordered tag-priority lists per canonical field. Companies use different exact
 * us-gaap tags for equivalent concepts - try each in order, first match wins.
 * These are reconstructed from general XBRL taxonomy knowledge, not verified
 * against live responses one by one; scripts/validate-pipeline.ts is what actually
 * proves these are right, against the four hand-verified companies.
 */
export const TAG_LISTS = {
  revenue: [
    "Revenues",
    "RevenueFromContractWithCustomerExcludingAssessedTax",
    "RevenueFromContractWithCustomerIncludingAssessedTax",
    "SalesRevenueNet",
  ],
  costOfRevenue: ["CostOfRevenue", "CostOfGoodsAndServicesSold", "CostOfGoodsSold"],
  grossProfit: ["GrossProfit"],
  operatingIncome: ["OperatingIncomeLoss"],
  depreciationAmortization: [
    "DepreciationDepletionAndAmortization",
    "DepreciationAmortizationAndAccretionNet",
    "DepreciationAndAmortization",
  ],
  interestExpenseGross: ["InterestExpense", "InterestExpenseDebt", "InterestExpenseNonoperating"],
  interestIncome: [
    "InvestmentIncomeInterest",
    "InvestmentIncomeInterestAndDividend",
    "InterestIncomeOther",
  ],
  pretaxIncome: [
    "IncomeLossFromContinuingOperationsBeforeIncomeTaxesExtraordinaryItemsNoncontrollingInterest",
    "IncomeLossFromContinuingOperationsBeforeIncomeTaxesMinorityInterestAndIncomeLossFromEquityMethodInvestments",
  ],
  // Directly-reported NET interest, for filers that disclose one netted line
  // instead of separate income/expense (Nike-style). XBRL's sign convention for
  // this tag is the opposite of ours - positive here means net benefit, so it
  // must be negated when used.
  interestExpenseNetDirect: ["InterestIncomeExpenseNonoperatingNet"],
  netIncome: ["NetIncomeLoss"],
  netIncomeConsolidated: ["ProfitLoss"],
  epsBasic: ["EarningsPerShareBasic"],
  epsDiluted: ["EarningsPerShareDiluted"],
  weightedAvgSharesBasic: ["WeightedAverageNumberOfSharesOutstandingBasic"],
  weightedAvgSharesDiluted: ["WeightedAverageNumberOfDilutedSharesOutstanding"],
  cashAndEquivalents: ["CashAndCashEquivalentsAtCarryingValue"],
  shortTermInvestments: ["ShortTermInvestments"],
  totalCurrentAssets: ["AssetsCurrent"],
  totalAssets: ["Assets"],
  longTermDebt: ["LongTermDebtNoncurrent"],
  operatingLeaseLiabilitiesCurrent: ["OperatingLeaseLiabilityCurrent"],
  operatingLeaseLiabilitiesNoncurrent: ["OperatingLeaseLiabilityNoncurrent"],
  totalShareholdersEquity: ["StockholdersEquity"],
  preferredStock: ["PreferredStockValue", "PreferredStockValueOutstanding"],
  noncontrollingInterestNonredeemable: ["MinorityInterest"],
  noncontrollingInterestRedeemable: ["RedeemableNoncontrollingInterestEquityCarryingAmount"],
} as const;

// Multi-tag SUM fields - shortTermDebt is notes payable + current portion of long-term debt.
const SHORT_TERM_DEBT_TAGS = [["NotesPayableCurrent", "ShortTermBorrowings"], ["LongTermDebtCurrent"]];

// Some filers (Deckers) split pretax income into Domestic + Foreign with no
// consolidated tag at all - sum them when the direct tag list comes up empty.
const PRETAX_INCOME_SPLIT_TAGS = [
  ["IncomeLossFromContinuingOperationsBeforeIncomeTaxesDomestic"],
  ["IncomeLossFromContinuingOperationsBeforeIncomeTaxesForeign"],
];

function unitsFor(facts: EdgarCompanyFacts, tag: string, unit: string): XbrlFactEntry[] | null {
  return facts.facts["us-gaap"]?.[tag]?.units[unit] ?? null;
}

/**
 * A specific reporting period to match XBRL entries against. `start` present =
 * a duration fact (income statement); `start` absent = an instant fact (balance
 * sheet), matched on `end` alone.
 */
export interface PeriodMatch {
  end: string;
  start?: string;
}

/**
 * First tag in the list with an entry matching BOTH this filing's accession
 * number AND the specific period requested. A single 10-K's XBRL data contains
 * every comparative year under the same accession number - matching on accn
 * alone would pick whichever year happens to appear first in the array, not
 * necessarily the right one. This is why the period match matters as much as
 * the accession number does.
 */
export function pickTagValue(
  facts: EdgarCompanyFacts,
  tagList: readonly string[],
  accnDashed: string,
  period: PeriodMatch,
  unit = "USD"
): { value: number | null; tagUsed: string | null } {
  for (const tag of tagList) {
    const entries = unitsFor(facts, tag, unit);
    if (!entries) continue;
    const match = entries.find(
      (e) =>
        e.accn === accnDashed &&
        e.end === period.end &&
        (period.start === undefined || e.start === period.start)
    );
    if (match) return { value: match.val, tagUsed: tag };
  }
  return { value: null, tagUsed: null };
}

/** Sums whichever component tags are present; null only if NONE of them resolved. */
export function sumTagValues(
  facts: EdgarCompanyFacts,
  tagLists: readonly (readonly string[])[],
  accnDashed: string,
  period: PeriodMatch,
  unit = "USD"
): number | null {
  let sum = 0;
  let foundAny = false;
  for (const tagList of tagLists) {
    const { value } = pickTagValue(facts, tagList, accnDashed, period, unit);
    if (value !== null) {
      sum += value;
      foundAny = true;
    }
  }
  return foundAny ? sum : null;
}

export interface AnnualPeriod {
  fiscalYear: number;
  periodStart: string | null;
  periodEnd: string;
}

/**
 * Finds the current and prior fiscal year duration periods within this filing's
 * accession number, using operatingIncome (nearly universal) as the anchor tag.
 * Duration is sanity-checked to a ~350-380 day window to exclude quarterly or
 * transition-period entries that happen to share the same accession number.
 */
export function selectAnnualPeriods(
  facts: EdgarCompanyFacts,
  accnDashed: string
): { current: AnnualPeriod; prior: AnnualPeriod } | null {
  const entries = unitsFor(facts, "OperatingIncomeLoss", "USD") ?? unitsFor(facts, "NetIncomeLoss", "USD");
  if (!entries) return null;

  const candidates = entries
    .filter((e) => e.accn === accnDashed && e.start)
    .filter((e) => {
      const days = (new Date(e.end).getTime() - new Date(e.start!).getTime()) / 86_400_000;
      return days >= 350 && days <= 380;
    })
    .sort((a, b) => new Date(b.end).getTime() - new Date(a.end).getTime());

  if (candidates.length < 2) return null;

  const toPeriod = (e: XbrlFactEntry): AnnualPeriod => ({
    fiscalYear: e.fy,
    periodStart: e.start ?? null,
    periodEnd: e.end,
  });

  return { current: toPeriod(candidates[0]), prior: toPeriod(candidates[1]) };
}

/**
 * XBRL "val" fields are always in the base unit (actual dollars, actual share
 * count) regardless of how the filing's human-readable tables are presented -
 * never thousands or millions. Our schema convention is millions, so every
 * USD/shares figure needs /1e6; EPS (already actual dollars-per-share) does not.
 */
function toMillions(value: number | null): number | null {
  return value === null ? null : value / 1_000_000;
}

export function normalizeIncomeStatement(
  facts: EdgarCompanyFacts,
  accnDashed: string,
  period: AnnualPeriod
): { statement: IncomeStatement; warnings: string[] } {
  const warnings: string[] = [];
  const durationPeriod: PeriodMatch = { end: period.periodEnd, start: period.periodStart ?? undefined };

  const num = (field: keyof typeof TAG_LISTS) =>
    toMillions(pickTagValue(facts, TAG_LISTS[field], accnDashed, durationPeriod).value);
  const eps = (field: keyof typeof TAG_LISTS) =>
    pickTagValue(facts, TAG_LISTS[field], accnDashed, durationPeriod, "USD/shares").value;
  const shares = (field: keyof typeof TAG_LISTS) =>
    toMillions(pickTagValue(facts, TAG_LISTS[field], accnDashed, durationPeriod, "shares").value);

  const revenue = num("revenue");

  let pretaxIncome = num("pretaxIncome");
  if (pretaxIncome === null) {
    const split = toMillions(sumTagValues(facts, PRETAX_INCOME_SPLIT_TAGS, accnDashed, durationPeriod));
    if (split !== null) {
      pretaxIncome = split;
      warnings.push(
        `pretaxIncome for FY${period.fiscalYear} summed from Domestic + Foreign tags - no consolidated pretax tag in this filing`
      );
    }
  }

  let interestExpenseGross = num("interestExpenseGross");
  let interestIncome = num("interestIncome");
  let interestExpenseNet: number | null = null;
  let interestExpenseNetIsDerived = false;
  if (interestExpenseGross !== null && interestIncome !== null) {
    interestExpenseNet = interestExpenseGross - interestIncome;
    interestExpenseNetIsDerived = true;
  } else {
    // No separate gross/income pair - try a directly-reported net figure
    // (Nike-style). XBRL's sign convention there is inverted relative to ours.
    const directNet = pickTagValue(
      facts,
      TAG_LISTS.interestExpenseNetDirect,
      accnDashed,
      durationPeriod
    ).value;
    if (directNet !== null) {
      interestExpenseNet = toMillions(-directNet);
      interestExpenseNetIsDerived = false;
      // A stray partial gross/income value alongside a direct-net tag is
      // misleading (it's not the complete breakdown) - null both out rather
      // than show an incomplete pair next to the reliable net figure.
      interestExpenseGross = null;
      interestIncome = null;
    }
  }

  let operatingIncome = num("operatingIncome");
  let operatingIncomeIsDerived = false;
  let derivationNote: string | undefined;
  if (operatingIncome === null && pretaxIncome !== null && interestExpenseNet !== null) {
    operatingIncome = pretaxIncome + interestExpenseNet;
    operatingIncomeIsDerived = true;
    derivationNote =
      "Derived as pretaxIncome + interestExpenseNet (no OperatingIncomeLoss tag in this filing). " +
      "Auto-derived and NOT cross-checked against a company-disclosed non-GAAP EBIT reconciliation - " +
      "treat with lower confidence than a hand-verified derivation.";
    warnings.push(`operatingIncome derived for FY${period.fiscalYear}, unverified against company disclosure`);
  }

  return {
    statement: {
      revenue,
      costOfRevenue: num("costOfRevenue"),
      grossProfit: num("grossProfit"),
      operatingIncome,
      operatingIncomeIsDerived,
      derivationNote,
      depreciationAmortization: num("depreciationAmortization"),
      interestIncome,
      interestExpenseGross,
      interestExpenseNet,
      interestExpenseNetIsDerived,
      pretaxIncome,
      netIncome: num("netIncome"),
      netIncomeConsolidated: num("netIncomeConsolidated"),
      epsBasic: eps("epsBasic"),
      epsDiluted: eps("epsDiluted"),
      weightedAvgSharesBasic: shares("weightedAvgSharesBasic"),
      weightedAvgSharesDiluted: shares("weightedAvgSharesDiluted"),
    },
    warnings,
  };
}

export function normalizeBalanceSheet(
  facts: EdgarCompanyFacts,
  accnDashed: string,
  periodEnd: string
): { statement: BalanceSheet; warnings: string[] } {
  const warnings: string[] = [];
  const instant: PeriodMatch = { end: periodEnd };

  const num = (field: keyof typeof TAG_LISTS) =>
    toMillions(pickTagValue(facts, TAG_LISTS[field], accnDashed, instant).value);

  const shortTermDebt = toMillions(sumTagValues(facts, SHORT_TERM_DEBT_TAGS, accnDashed, instant));
  const nonredeemable = num("noncontrollingInterestNonredeemable");
  const redeemable = num("noncontrollingInterestRedeemable");
  const noncontrollingInterest =
    nonredeemable !== null || redeemable !== null ? (nonredeemable ?? 0) + (redeemable ?? 0) : null;

  return {
    statement: {
      cashAndEquivalents: num("cashAndEquivalents"),
      shortTermInvestments: num("shortTermInvestments"),
      totalCurrentAssets: num("totalCurrentAssets"),
      totalAssets: num("totalAssets"),
      shortTermDebt,
      longTermDebt: num("longTermDebt"),
      operatingLeaseLiabilitiesCurrent: num("operatingLeaseLiabilitiesCurrent"),
      operatingLeaseLiabilitiesNoncurrent: num("operatingLeaseLiabilitiesNoncurrent"),
      preferredStock: num("preferredStock"),
      noncontrollingInterest,
      noncontrollingInterestNonredeemable: nonredeemable,
      noncontrollingInterestRedeemable: redeemable,
      totalShareholdersEquity: num("totalShareholdersEquity"),
    },
    warnings,
  };
}

/**
 * SEC's submissions.name is the registered legal name in shouting caps (e.g.
 * "DECKERS OUTDOOR CORP"). Title-casing gets closer to how a company presents
 * its own name, though abbreviations like "CORP" won't expand to "Corporation" -
 * that's a cosmetic gap, not something worth a lookup table for.
 */
function titleCaseCompanyName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .replace(/\bLlc\b/g, "LLC")
    .replace(/\bInc\b/g, "Inc")
    .replace(/\bCo\b/g, "Co");
}

/**
 * SIC codes are a coarse, 1987-vintage government classification that doesn't
 * map cleanly onto modern comps groupings (Qualcomm is SIC 3663 "Radio & TV
 * Broadcasting Equipment," not 3674 "Semiconductors," despite being a
 * semiconductor company by any comps analyst's definition). Hand-verified
 * companies already carry hand-picked GICS-style sector/industry/subIndustry
 * labels; without a matching mapping here, auto-ingested companies would carry
 * raw SIC description text instead - a different taxonomy that would silently
 * fail to match for peer suggestion even between genuine peers. Covers the four
 * target industries from docs/DATA_SOURCE_REVIEW.md; falls back to the raw SIC
 * description for anything else rather than guessing a classification.
 */
const SIC_TO_GICS: { test: (sic: number) => boolean; sector: string; industry: string; subIndustry: string }[] = [
  {
    test: (s) => s === 3021 || s === 3140 || s === 3149,
    sector: "Consumer Discretionary",
    industry: "Textiles, Apparel & Luxury Goods",
    subIndustry: "Footwear",
  },
  {
    test: (s) => s >= 2200 && s <= 2399,
    sector: "Consumer Discretionary",
    industry: "Textiles, Apparel & Luxury Goods",
    subIndustry: "Apparel",
  },
  {
    test: (s) => s === 3674 || s === 3663 || s === 3559,
    sector: "Information Technology",
    industry: "Semiconductors & Semiconductor Equipment",
    subIndustry: "Semiconductors",
  },
  {
    test: (s) => s >= 7370 && s <= 7379,
    sector: "Information Technology",
    industry: "Software",
    subIndustry: "Systems Software",
  },
  {
    test: (s) => s >= 2000 && s <= 2099,
    sector: "Consumer Staples",
    industry: "Food, Beverage & Tobacco",
    subIndustry: "Packaged Foods & Meats",
  },
];

function classifyIndustry(
  sicCode: string | null,
  fallbackDescription: string
): { sector: string; industry: string; subIndustry: string } {
  const sic = sicCode ? Number(sicCode) : NaN;
  const match = SIC_TO_GICS.find((m) => m.test(sic));
  if (match) return { sector: match.sector, industry: match.industry, subIndustry: match.subIndustry };
  return { sector: "", industry: fallbackDescription, subIndustry: "" };
}

export function normalizeProfile(submissions: EdgarSubmissions, ticker: string): CompanyProfile {
  const sicCode = submissions.sic ?? null;
  const classification = classifyIndustry(sicCode, submissions.sicDescription ?? "");
  return {
    cik: submissions.cik.padStart(10, "0"),
    ticker,
    name: titleCaseCompanyName(submissions.name),
    exchange: submissions.exchanges[0] ?? "",
    sector: classification.sector,
    industry: classification.industry,
    subIndustry: classification.subIndustry,
    sicCode,
    description: "",
    headquarters: submissions.addresses?.business
      ? [submissions.addresses.business.city, submissions.addresses.business.stateOrCountry]
          .filter(Boolean)
          .join(", ")
      : "",
    fiscalYearEndMonth: submissions.fiscalYearEnd
      ? Number(submissions.fiscalYearEnd.slice(0, 2))
      : 12,
    isFinancial: isFinancialSic(sicCode),
  };
}

/** SEC Division H (Finance, Insurance, Real Estate) - also catches SPACs (6770). */
export function isFinancialSic(sicCode: string | null): boolean {
  if (!sicCode) return false;
  const code = Number(sicCode);
  return code >= 6000 && code <= 6799;
}

/**
 * Shares outstanding as of THIS 10-K's own cover-page date - filtered by
 * accession number first. companyfacts includes EntityCommonStockSharesOutstanding
 * entries from every filing the company has ever made (10-Ks AND 10-Qs); without
 * filtering by accn, the "most recent" entry overall is very likely a LATER
 * quarterly filing's cover-page count, not this 10-K's - which would silently
 * pair the wrong share count with this filing's financials.
 *
 * Multi-class share structures (Nike-style) can show >1 entry for the same date
 * without a clean per-class label - detect that case and route to manual review
 * rather than guessing which single entry (or combination) is correct.
 */
export function getSharesOutstanding(
  facts: EdgarCompanyFacts,
  accnDashed: string
): { value: number; asOf: string } | { needsManualReview: true; reason: string } | null {
  const allEntries = facts.facts.dei?.EntityCommonStockSharesOutstanding?.units.shares;
  if (!allEntries || allEntries.length === 0) return null;

  const entries = allEntries.filter((e) => e.accn === accnDashed);
  if (entries.length === 0) return null;

  const latest = [...entries].sort((a, b) => new Date(b.end).getTime() - new Date(a.end).getTime())[0];
  const sameDate = entries.filter((e) => e.end === latest.end);

  if (sameDate.length > 1) {
    return {
      needsManualReview: true,
      reason: `${sameDate.length} share-count entries for ${latest.end} - likely multi-class shares; needs manual sum + note, like NKE's hand-verified record.`,
    };
  }

  return { value: latest.val / 1_000_000, asOf: latest.end };
}
