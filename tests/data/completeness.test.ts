import { describe, expect, it } from "vitest";
import { checkCompleteness } from "../../lib/data/completeness";
import crox from "../../data/demo/CROX.json";
import avgo from "../../data/companies/AVGO.json";
import type { DemoCompany } from "../../lib/finance/types";

describe("checkCompleteness", () => {
  it("reports no blocking gaps for a fully hand-verified company", () => {
    const report = checkCompleteness(crox as unknown as DemoCompany);
    expect(report.currentYearBlockedMultiples).toEqual([]);
    expect(report.issues.filter((i) => i.severity === "blocks a displayed multiple")).toEqual([]);
  });

  it("flags AVGO's known longTermDebt gap as blocking, with the correct multiple named", () => {
    // AVGO's current-year 10-K doesn't tag longTermDebt under any fallback tag
    // we try (confirmed against live EDGAR data) - this is a real, currently
    // unresolved gap, not a fabricated test case, so this also acts as a
    // regression check: if a future tag-list fix resolves it, this test should
    // be updated to match, not silently left describing a stale gap.
    const report = checkCompleteness(avgo as unknown as DemoCompany);
    const debtIssue = report.issues.find(
      (i) => i.field === "balanceSheet.longTermDebt" && i.severity === "blocks a displayed multiple"
    );
    expect(debtIssue).toBeDefined();
    expect(debtIssue!.detail).toMatch(/enterprise value/i);
    expect(report.currentYearBlockedMultiples).toContain("EV/EBITDA");
  });

  it("does not report a field as blocking unless it's in the high-impact list", () => {
    // shortTermInvestments is captured but not consumed by any calculation -
    // a null there should never appear as a blocking issue for any company.
    const report = checkCompleteness(avgo as unknown as DemoCompany);
    const falselyBlocking = report.issues.find(
      (i) => i.field === "balanceSheet.shortTermInvestments" && i.severity === "blocks a displayed multiple"
    );
    expect(falselyBlocking).toBeUndefined();
  });
});
