import type { DemoCompany } from "../finance/types";
import { computeCompanyMetrics } from "../finance/compute";

/**
 * Fields that actually feed a displayed multiple, mapped to which multiple(s)
 * go N/A if the field is null. Everything NOT in this map is captured for
 * completeness / future use but doesn't block anything on the site today
 * (e.g. grossProfit, interest income/expense, operatingLeaseLiabilities,
 * netIncomeConsolidated, shortTermInvestments, the NCI split fields) - those
 * are reported separately, at lower severity, so a completeness report isn't
 * dominated by gaps nobody can currently see.
 */
const HIGH_IMPACT_FIELDS: { path: string; blocks: string }[] = [
  { path: "incomeStatement.revenue", blocks: "EV/Revenue, margins, revenue growth" },
  { path: "incomeStatement.operatingIncome", blocks: "EBITDA, EV/EBITDA, EV/EBIT, EBITDA margin" },
  { path: "incomeStatement.depreciationAmortization", blocks: "EBITDA, EV/EBITDA" },
  { path: "incomeStatement.netIncome", blocks: "P/E, net margin" },
  { path: "incomeStatement.epsDiluted", blocks: "P/E" },
  { path: "balanceSheet.cashAndEquivalents", blocks: "enterprise value (EV/Revenue, EV/EBITDA, EV/EBIT)" },
  { path: "balanceSheet.shortTermDebt", blocks: "enterprise value, via total debt" },
  { path: "balanceSheet.longTermDebt", blocks: "enterprise value, via total debt" },
  { path: "balanceSheet.totalShareholdersEquity", blocks: "P/B" },
];

export interface CompletenessIssue {
  field: string;
  fiscalYear: number;
  severity: "blocks a displayed multiple" | "captured but not currently used on the site";
  detail: string;
}

export interface CompletenessReport {
  ticker: string;
  currentYearBlockedMultiples: string[];
  issues: CompletenessIssue[];
}

/**
 * Field-level completeness check for one company, run right after ingestion.
 * This is the automated system that surfaces "N/A because a real gap in tag
 * matching" the moment a company is added, instead of it silently shipping
 * and being noticed later on the site. It never invents a number - it only
 * ever reports what's missing and, where knowable, what that blocks.
 */
export function checkCompleteness(company: DemoCompany): CompletenessReport {
  const issues: CompletenessIssue[] = [];

  company.financials.forEach((period, periodIndex) => {
    const isCurrent = periodIndex === 0;
    const fy = period.period.fiscalYear;
    for (const section of ["incomeStatement", "balanceSheet"] as const) {
      const values = period[section] as unknown as Record<string, unknown>;
      for (const [field, value] of Object.entries(values)) {
        if (value !== null) continue;
        const path = `${section}.${field}`;
        const highImpact = HIGH_IMPACT_FIELDS.find((f) => f.path === path);
        // Only the current year drives what's shown on the comps table today;
        // a null in the prior year only affects revenue growth's own inputs.
        if (highImpact && isCurrent) {
          issues.push({
            field: path,
            fiscalYear: fy,
            severity: "blocks a displayed multiple",
            detail: `blocks: ${highImpact.blocks}`,
          });
        } else if (!highImpact) {
          issues.push({
            field: path,
            fiscalYear: fy,
            severity: "captured but not currently used on the site",
            detail: "no visible impact today, but worth fixing for completeness / future features",
          });
        }
      }
    }
  });

  const m = computeCompanyMetrics(company);
  const currentYearBlockedMultiples = [
    m.evRevenue.value === null ? "EV/Revenue" : null,
    m.evEbitda.value === null ? "EV/EBITDA" : null,
    m.evEbit.value === null ? "EV/EBIT" : null,
    m.pe.value === null ? "P/E" : null,
    m.pb.value === null ? "P/B" : null,
  ].filter((x): x is string => x !== null);

  return { ticker: company.profile.ticker, currentYearBlockedMultiples, issues };
}

/** Plain-text report, for CLI output after ingestion or a standalone audit. */
export function formatCompletenessReport(report: CompletenessReport): string {
  const lines: string[] = [];
  const blocking = report.issues.filter((i) => i.severity === "blocks a displayed multiple");
  const informational = report.issues.filter((i) => i.severity !== "blocks a displayed multiple");

  if (blocking.length === 0) {
    lines.push(`  ${report.ticker}: no gaps blocking a displayed multiple.`);
  } else {
    lines.push(`  ${report.ticker}: ${blocking.length} gap(s) blocking a displayed multiple:`);
    for (const issue of blocking) {
      lines.push(`    - ${issue.field} (FY${issue.fiscalYear}) — ${issue.detail}`);
    }
    lines.push(`    Currently N/A on the comps table: ${report.currentYearBlockedMultiples.join(", ")}`);
  }
  if (informational.length > 0) {
    lines.push(`  ${informational.length} other field(s) missing, no visible impact today:`);
    for (const issue of informational) {
      lines.push(`    - ${issue.field} (FY${issue.fiscalYear})`);
    }
  }
  return lines.join("\n");
}
