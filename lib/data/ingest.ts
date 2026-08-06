import {
  buildFilingUrl,
  findLatestAnnualFiling,
  getCompanyFacts,
  getSubmissions,
  resolveCik,
} from "./edgar";
import {
  getSharesOutstanding,
  normalizeBalanceSheet,
  normalizeIncomeStatement,
  normalizeProfile,
  selectAnnualPeriods,
} from "./normalize";
import { buildMarketSnapshot } from "./market";
import { parseDemoCompany } from "./schema";
import type { DemoCompany, PeriodFinancials, SourceRef } from "../finance/types";

export type IngestResult =
  | { ok: true; company: DemoCompany; warnings: string[] }
  | { ok: false; ticker: string; reason: string };

/**
 * Orchestrates edgar.ts + normalize.ts + market.ts + schema.ts into a single
 * DemoCompany-shaped result. Same code path for a route handler and a standalone
 * script - single source of truth for "how do the pieces fit together."
 */
export async function ingestCompany(ticker: string): Promise<IngestResult> {
  const fail = (reason: string): IngestResult => ({ ok: false, ticker, reason });

  const cik = await resolveCik(ticker);
  if (!cik) {
    return fail(
      `Ticker not found in SEC's registered company list - delisted, gone private, or never registered.`
    );
  }

  const submissions = await getSubmissions(cik);
  const filingResult = findLatestAnnualFiling(submissions);
  if (!filingResult.ok) {
    return fail(
      filingResult.reason === "foreign-filer"
        ? "Files 20-F/40-F (foreign private issuer) - unsupported, uses the ifrs-full taxonomy, not us-gaap."
        : "No 10-K found in recent filing history."
    );
  }
  const filing = filingResult.filing;

  const facts = await getCompanyFacts(cik);
  const periods = selectAnnualPeriods(facts, filing.accessionNumberDashed);
  if (!periods) {
    return fail("Could not determine two comparable annual reporting periods from XBRL data.");
  }

  const warnings: string[] = [];
  const profile = normalizeProfile(submissions, ticker);
  if (profile.isFinancial) {
    warnings.push(
      "SIC-classified as financial (banks/insurance/REITs) - EV-based multiples are not meaningful for this company; excluded from standard comps by the isFinancial flag."
    );
  }

  const retrievedAt = new Date().toISOString().slice(0, 10);
  const documentUrl = buildFilingUrl(cik, filing);
  const source: SourceRef = {
    kind: "SEC_EDGAR_10K",
    documentUrl,
    filingDate: filing.filingDate,
    retrievedAt,
    note: "Auto-ingested via SEC EDGAR XBRL (companyfacts), tag-fallback normalized. See docs/FINANCE_METHODOLOGY.md.",
  };

  const financials: PeriodFinancials[] = [];
  for (const period of [periods.current, periods.prior]) {
    const is = normalizeIncomeStatement(facts, filing.accessionNumberDashed, period);
    const bs = normalizeBalanceSheet(facts, filing.accessionNumberDashed, period.periodEnd);
    warnings.push(...is.warnings, ...bs.warnings);
    financials.push({
      period: {
        periodType: "FY",
        fiscalYear: period.fiscalYear,
        periodStart: period.periodStart,
        periodEnd: period.periodEnd,
        currency: "USD",
      },
      incomeStatement: is.statement,
      balanceSheet: bs.statement,
      source,
    });
  }

  const sharesResult = getSharesOutstanding(facts, filing.accessionNumberDashed);
  if (!sharesResult) {
    return fail("No shares-outstanding data (dei:EntityCommonStockSharesOutstanding) found.");
  }
  if ("needsManualReview" in sharesResult) {
    return fail(sharesResult.reason);
  }

  const sharesSource: SourceRef = {
    kind: "SEC_EDGAR_10K",
    documentUrl,
    filingDate: filing.filingDate,
    retrievedAt,
    note: "Shares outstanding from the 10-K cover page (dei:EntityCommonStockSharesOutstanding).",
  };

  const marketResult = await buildMarketSnapshot(
    ticker,
    sharesResult.value,
    sharesResult.asOf,
    sharesSource,
    retrievedAt
  );
  if ("needsManualPrice" in marketResult) {
    return fail(marketResult.reason);
  }

  const company: DemoCompany = { profile, financials, market: marketResult };

  try {
    const validated = parseDemoCompany(company, { ticker });
    return { ok: true, company: validated, warnings };
  } catch (e) {
    return fail((e as Error).message);
  }
}
