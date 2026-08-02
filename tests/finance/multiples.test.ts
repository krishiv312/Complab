import { describe, expect, it } from "vitest";
import {
  calculateEBITDA,
  calculateEnterpriseValue,
  calculateEVEBIT,
  calculateEVEBITDA,
  calculateEVRevenue,
  calculateMarketCap,
  calculateMargins,
  calculatePB,
  calculatePE,
  calculateRevenueGrowth,
  safeDivide,
} from "../../lib/finance/multiples";
import crox from "../../data/demo/CROX.json";
import deck from "../../data/demo/DECK.json";
import skx from "../../data/demo/SKX.json";
import nke from "../../data/demo/NKE.json";

const [fy2025, fy2024] = crox.financials;

describe("safeDivide", () => {
  it("divides two normal numbers", () => {
    expect(safeDivide(10, 2)).toEqual({ value: 5, meaningful: true });
  });

  it("is N/A-shaped for a null numerator", () => {
    const result = safeDivide(null, 2);
    expect(result.value).toBeNull();
    expect(result.meaningful).toBe(false);
  });

  it("is N/A-shaped for a null denominator", () => {
    const result = safeDivide(10, null);
    expect(result.value).toBeNull();
    expect(result.meaningful).toBe(false);
  });

  it("is N/A-shaped for a zero denominator", () => {
    const result = safeDivide(10, 0);
    expect(result.value).toBeNull();
    expect(result.meaningful).toBe(false);
    expect(result.note).toMatch(/zero/i);
  });

  it("computes a negative result without judging the sign", () => {
    expect(safeDivide(-10, 2)).toEqual({ value: -5, meaningful: true });
  });

  it("treats negative zero as a zero denominator", () => {
    // -0 === 0 in JS, but it's worth pinning down explicitly: financial
    // data derived from subtraction (e.g. debt - debt) can produce -0.
    const result = safeDivide(10, -0);
    expect(result.value).toBeNull();
    expect(result.meaningful).toBe(false);
  });
});

describe("calculateMarketCap", () => {
  it("matches the Block B hand calculation for CROX (2026-02-05)", () => {
    const result = calculateMarketCap(
      crox.market.sharePrice,
      crox.market.sharesOutstanding
    );
    expect(result.meaningful).toBe(true);
    expect(result.value).toBeCloseTo(4244.24, 1); // $4,244.2M
  });

  it("is N/A when share price is missing", () => {
    const result = calculateMarketCap(null, 50);
    expect(result.value).toBeNull();
    expect(result.meaningful).toBe(false);
  });

  it("is N/A when shares outstanding is missing", () => {
    const result = calculateMarketCap(84.49, null);
    expect(result.value).toBeNull();
    expect(result.meaningful).toBe(false);
  });
});

describe("calculateEnterpriseValue", () => {
  const marketCap = calculateMarketCap(
    crox.market.sharePrice,
    crox.market.sharesOutstanding
  ).value as number;

  it("matches the Block B hand calculation for CROX FY2025", () => {
    const totalDebt =
      fy2025.balanceSheet.shortTermDebt + fy2025.balanceSheet.longTermDebt;
    const result = calculateEnterpriseValue(
      marketCap,
      totalDebt,
      fy2025.balanceSheet.preferredStock,
      fy2025.balanceSheet.noncontrollingInterest,
      fy2025.balanceSheet.cashAndEquivalents
    );
    expect(result.meaningful).toBe(true);
    expect(result.value).toBeCloseTo(5344.77, 1); // $5,344.8M
  });

  it("is N/A when any input is missing", () => {
    const result = calculateEnterpriseValue(marketCap, null, 0, 0, 130.354);
    expect(result.value).toBeNull();
    expect(result.meaningful).toBe(false);
  });

  it("drops below market cap when cash exceeds debt (net cash position)", () => {
    const result = calculateEnterpriseValue(1000, 0, 0, 0, 500);
    expect(result.value).toBe(500);
    expect(result.value).toBeLessThan(1000);
  });
});

describe("calculateEBITDA", () => {
  it("matches the Block B hand calculation for CROX FY2025", () => {
    const result = calculateEBITDA(
      fy2025.incomeStatement.operatingIncome,
      fy2025.incomeStatement.depreciationAmortization
    );
    expect(result.meaningful).toBe(true);
    expect(result.value).toBeCloseTo(228.8, 1); // $228.8M
    expect(result.note).toMatch(/computed/i);
  });

  it("also matches FY2024, as a second real fixture", () => {
    const result = calculateEBITDA(
      fy2024.incomeStatement.operatingIncome,
      fy2024.incomeStatement.depreciationAmortization
    );
    expect(result.value).toBeCloseTo(1091.75, 1); // 1021.911 + 69.840
  });

  it("is N/A when D&A is missing", () => {
    const result = calculateEBITDA(
      fy2025.incomeStatement.operatingIncome,
      null
    );
    expect(result.value).toBeNull();
    expect(result.meaningful).toBe(false);
  });

  it("stays meaningful when the underlying operating income is negative", () => {
    // A negative EBITDA is a real fact about the company, not an error.
    // Whether it's displayable as a ratio (N/M) is decided by whatever
    // divides by it later (Block F), not by this function.
    const result = calculateEBITDA(-500, 50);
    expect(result.value).toBe(-450);
    expect(result.meaningful).toBe(true);
  });
});

describe("calculateEVRevenue", () => {
  it("matches DECK FY2026", () => {
    const result = calculateEVRevenue(12103.06, deck.financials[0].incomeStatement.revenue);
    expect(result.meaningful).toBe(true);
    expect(result.value).toBeCloseTo(2.21, 2);
  });

  it("is N/A when revenue is missing", () => {
    const result = calculateEVRevenue(12103.06, null);
    expect(result.value).toBeNull();
    expect(result.meaningful).toBe(false);
  });
});

describe("calculateEVEBITDA", () => {
  it("matches SKX FY2024", () => {
    const result = calculateEVEBITDA(9734.3, 1115.756);
    expect(result.meaningful).toBe(true);
    expect(result.value).toBeCloseTo(8.72, 2);
  });

  it("is N/M — not a negative multiple — when EBITDA is negative", () => {
    const result = calculateEVEBITDA(5000, -200);
    expect(result.value).toBeCloseTo(-25, 5);
    expect(result.meaningful).toBe(false);
    expect(result.note).toMatch(/N\/M/);
  });

  it("is N/A for a zero EBITDA (undefined, not just unhelpful)", () => {
    const result = calculateEVEBITDA(5000, 0);
    expect(result.value).toBeNull();
    expect(result.meaningful).toBe(false);
  });
});

describe("calculateEVEBIT", () => {
  it("matches NKE FY2026, using the derived EBIT", () => {
    const result = calculateEVEBIT(64006.56, nke.financials[0].incomeStatement.operatingIncome);
    expect(result.meaningful).toBe(true);
    expect(result.value).toBeCloseTo(16.63, 2);
  });

  it("is N/M when EBIT is negative", () => {
    const result = calculateEVEBIT(5000, -100);
    expect(result.value).toBeCloseTo(-50, 5);
    expect(result.meaningful).toBe(false);
  });
});

describe("calculatePE", () => {
  it("matches DECK FY2026 (positive earnings)", () => {
    const result = calculatePE(deck.market.sharePrice, deck.financials[0].incomeStatement.epsDiluted);
    expect(result.meaningful).toBe(true);
    expect(result.value).toBeCloseTo(14.37, 2);
  });

  it("is N/M for CROX FY2025 — a real negative-earnings company, not a synthetic one", () => {
    const result = calculatePE(crox.market.sharePrice, fy2025.incomeStatement.epsDiluted);
    expect(result.value).toBeCloseTo(-56.33, 2);
    expect(result.meaningful).toBe(false);
    expect(result.note).toMatch(/N\/M/);
  });

  it("is N/A for a zero EPS", () => {
    const result = calculatePE(100, 0);
    expect(result.value).toBeNull();
    expect(result.meaningful).toBe(false);
  });
});

describe("calculatePB", () => {
  it("matches SKX FY2024", () => {
    const marketCap = skx.market.sharePrice * skx.market.sharesOutstanding;
    const result = calculatePB(marketCap, skx.financials[0].balanceSheet.totalShareholdersEquity);
    expect(result.meaningful).toBe(true);
    expect(result.value).toBeCloseTo(2.08, 2);
  });

  it("is N/M when book equity is negative", () => {
    const result = calculatePB(5000, -300);
    expect(result.value).toBeCloseTo(-16.667, 2);
    expect(result.meaningful).toBe(false);
  });
});

describe("calculateMargins", () => {
  it("computes all three margins for CROX FY2025, staying meaningful even though net margin is negative", () => {
    const result = calculateMargins(
      fy2025.incomeStatement.revenue,
      228.797,
      fy2025.incomeStatement.operatingIncome,
      fy2025.incomeStatement.netIncome
    );
    expect(result.netMargin.value).toBeCloseTo(-0.0201, 3);
    // Unlike P/E, a negative margin is a real fact, not a broken ratio —
    // it must stay meaningful, not flip to N/M.
    expect(result.netMargin.meaningful).toBe(true);
    expect(result.ebitdaMargin.meaningful).toBe(true);
    expect(result.ebitMargin.meaningful).toBe(true);
  });

  it("is N/A across the board when revenue is missing", () => {
    const result = calculateMargins(null, 100, 50, 20);
    expect(result.ebitdaMargin.value).toBeNull();
    expect(result.ebitMargin.value).toBeNull();
    expect(result.netMargin.value).toBeNull();
  });
});

describe("calculateRevenueGrowth", () => {
  it("matches DECK FY2026 vs FY2025", () => {
    const result = calculateRevenueGrowth(
      deck.financials[0].incomeStatement.revenue,
      deck.financials[1].incomeStatement.revenue
    );
    expect(result.meaningful).toBe(true);
    expect(result.value).toBeCloseTo(0.0976, 3);
  });

  it("is N/A when prior-year revenue is missing", () => {
    const result = calculateRevenueGrowth(100, null);
    expect(result.value).toBeNull();
    expect(result.meaningful).toBe(false);
  });

  it("stays meaningful for a revenue decline — a real fact, not a broken ratio", () => {
    const result = calculateRevenueGrowth(
      fy2025.incomeStatement.revenue,
      fy2024.incomeStatement.revenue
    );
    expect(result.value).toBeLessThan(0);
    expect(result.meaningful).toBe(true);
  });
});
