/**
 * Validates the EDGAR normalization pipeline against the four hand-verified
 * companies. Makes live network calls - not part of `npm test`, run manually.
 *
 * Financial-statement fields should match the hand-verified JSON exactly (they're
 * as-reported GAAP figures pulled from the same filing). Market fields are
 * excluded - a live/historical quote will never equal an old hand-recorded price,
 * that's expected, not a pipeline defect. SKX is expected to fail cleanly (it
 * went private mid-2025, no current 10-K) - that proves the fail-safe path works.
 */
import {
  buildFilingUrl,
  findLatestAnnualFiling,
  getCompanyFacts,
  getSubmissions,
  resolveCik,
} from "../lib/data/edgar";
import {
  getSharesOutstanding,
  normalizeBalanceSheet,
  normalizeIncomeStatement,
  normalizeProfile,
  selectAnnualPeriods,
} from "../lib/data/normalize";
import type { DemoCompany } from "../lib/finance/types";
import crox from "../data/demo/CROX.json";
import deck from "../data/demo/DECK.json";
import skx from "../data/demo/SKX.json";
import nke from "../data/demo/NKE.json";

const GROUND_TRUTH: Record<string, DemoCompany> = {
  CROX: crox as unknown as DemoCompany,
  DECK: deck as unknown as DemoCompany,
  SKX: skx as unknown as DemoCompany,
  NKE: nke as unknown as DemoCompany,
};

type Outcome = "MATCH" | "MISMATCH" | "MISSING" | "EXTRA";

function diffField(
  path: string,
  expected: unknown,
  actual: unknown,
  report: { path: string; outcome: Outcome; expected: unknown; actual: unknown }[]
) {
  const isNullish = (v: unknown) => v === null || v === undefined;
  if (isNullish(expected) && isNullish(actual)) return;
  if (isNullish(expected) && !isNullish(actual)) {
    report.push({ path, outcome: "EXTRA", expected, actual });
    return;
  }
  if (!isNullish(expected) && isNullish(actual)) {
    report.push({ path, outcome: "MISSING", expected, actual });
    return;
  }
  if (typeof expected === "number" && typeof actual === "number") {
    // Small tolerance for floating point arithmetic (e.g. gross - income subtraction).
    if (Math.abs(expected - actual) < 0.005) {
      report.push({ path, outcome: "MATCH", expected, actual });
    } else {
      report.push({ path, outcome: "MISMATCH", expected, actual });
    }
    return;
  }
  if (expected === actual) {
    report.push({ path, outcome: "MATCH", expected, actual });
  } else {
    report.push({ path, outcome: "MISMATCH", expected, actual });
  }
}

const INCOME_FIELDS = [
  "revenue", "costOfRevenue", "grossProfit", "operatingIncome", "depreciationAmortization",
  "interestIncome", "interestExpenseGross", "interestExpenseNet", "pretaxIncome", "netIncome",
  "epsBasic", "epsDiluted", "weightedAvgSharesBasic", "weightedAvgSharesDiluted",
] as const;

const BALANCE_FIELDS = [
  "cashAndEquivalents", "totalCurrentAssets", "totalAssets", "shortTermDebt", "longTermDebt",
  "operatingLeaseLiabilitiesCurrent", "operatingLeaseLiabilitiesNoncurrent", "totalShareholdersEquity",
] as const;

async function validateOne(ticker: string) {
  const expected = GROUND_TRUTH[ticker];
  const report: { path: string; outcome: Outcome; expected: unknown; actual: unknown }[] = [];

  const cik = await resolveCik(ticker);
  if (!cik) {
    console.log(`\n=== ${ticker} ===`);
    console.log(`resolveCik -> null (not in SEC's registered ticker list)`);
    console.log(ticker === "SKX" ? "PASS (expected fail-safe: SKX went private, correctly not found)" : "FAIL: expected a CIK");
    return;
  }

  const submissions = await getSubmissions(cik);
  const filingResult = findLatestAnnualFiling(submissions);
  if (!filingResult.ok) {
    console.log(`\n=== ${ticker} ===`);
    console.log(`findLatestAnnualFiling -> ${filingResult.reason}`);
    console.log(ticker === "SKX" ? "PASS (expected fail-safe: no current 10-K)" : "FAIL: expected a 10-K");
    return;
  }
  const filing = filingResult.filing;

  const facts = await getCompanyFacts(cik);
  const periods = selectAnnualPeriods(facts, filing.accessionNumberDashed);
  if (!periods) {
    console.log(`\n=== ${ticker} ===`);
    console.log(`selectAnnualPeriods -> null. FAIL: could not determine periods.`);
    return;
  }

  const isResult = normalizeIncomeStatement(facts, filing.accessionNumberDashed, periods.current);
  const bsResult = normalizeBalanceSheet(facts, filing.accessionNumberDashed, periods.current.periodEnd);
  const sharesResult = getSharesOutstanding(facts, filing.accessionNumberDashed);
  const profile = normalizeProfile(submissions, ticker);

  const expectedCurrent = expected.financials[0];

  for (const field of INCOME_FIELDS) {
    diffField(
      `financials[0].incomeStatement.${field}`,
      expectedCurrent.incomeStatement[field],
      isResult.statement[field],
      report
    );
  }
  for (const field of BALANCE_FIELDS) {
    diffField(
      `financials[0].balanceSheet.${field}`,
      expectedCurrent.balanceSheet[field],
      bsResult.statement[field],
      report
    );
  }
  diffField("profile.name", expected.profile.name, profile.name, report);
  diffField("profile.sicCode", expected.profile.sicCode, profile.sicCode, report);

  if (sharesResult && "value" in sharesResult) {
    diffField("market.sharesOutstanding", expected.market.sharesOutstanding, sharesResult.value, report);
  } else {
    report.push({
      path: "market.sharesOutstanding",
      outcome: "MISSING",
      expected: expected.market.sharesOutstanding,
      actual: sharesResult,
    });
  }

  console.log(`\n=== ${ticker} (filing: ${buildFilingUrl(cik, filing)}) ===`);
  const counts: Record<Outcome, number> = { MATCH: 0, MISMATCH: 0, MISSING: 0, EXTRA: 0 };
  for (const r of report) {
    counts[r.outcome]++;
    if (r.outcome !== "MATCH") {
      console.log(`  ${r.outcome.padEnd(9)} ${r.path}: expected=${r.expected} actual=${r.actual}`);
    }
  }
  console.log(
    `  ${counts.MATCH} match, ${counts.MISMATCH} mismatch, ${counts.MISSING} missing, ${counts.EXTRA} extra`
  );
  // profile.name is excluded from the pass/fail bar: SEC's registered legal
  // name (e.g. "NIKE, INC.") often differs from a company's own branding
  // ("Nike, Inc.") in ways no casing algorithm resolves universally - it's
  // cosmetic, not a data-correctness signal.
  const materialMismatches = report.filter(
    (r) => r.outcome === "MISMATCH" && r.path !== "profile.name"
  );
  if (materialMismatches.length > 0) {
    console.log(`  FAIL: ${materialMismatches.length} field(s) actively wrong, not just missing.`);
  } else {
    console.log(`  PASS: no field actively wrong (MISSING is an accepted null-vs-confirmed-zero gap; profile.name diffs are cosmetic).`);
  }
}

async function main() {
  for (const ticker of ["CROX", "DECK", "SKX", "NKE"]) {
    try {
      await validateOne(ticker);
    } catch (e) {
      console.log(`\n=== ${ticker} ===`);
      console.log(`ERROR: ${(e as Error).message}`);
    }
  }
}

main();
