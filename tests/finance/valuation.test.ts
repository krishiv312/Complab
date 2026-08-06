import { describe, expect, it } from "vitest";
import { impliedValuation } from "../../lib/finance/valuation";

describe("impliedValuation", () => {
  it("matches a hand-computed case: EV -> equity -> per-share", () => {
    // peer median EV/EBITDA = 10x, subject EBITDA = 200 -> implied EV = 2000
    // equity = 2000 - debt(300) - preferred(0) - NCI(0) + cash(100) = 1800
    // per-share = 1800 / 50 shares = 36
    const result = impliedValuation(10, 200, 300, 0, 0, 100, 50);
    expect(result.impliedEnterpriseValue.value).toBe(2000);
    expect(result.impliedEquityValue.value).toBe(1800);
    expect(result.impliedSharePrice.value).toBe(36);
    expect(result.impliedSharePrice.meaningful).toBe(true);
  });

  it("is N/A when the peer multiple itself is missing", () => {
    const result = impliedValuation(null, 200, 300, 0, 0, 100, 50);
    expect(result.impliedEnterpriseValue.value).toBeNull();
    expect(result.impliedEquityValue.value).toBeNull();
    expect(result.impliedSharePrice.value).toBeNull();
  });

  it("still computes implied EV when balance sheet data is missing, but not equity/share price", () => {
    const result = impliedValuation(10, 200, null, 0, 0, 100, 50);
    expect(result.impliedEnterpriseValue.value).toBe(2000);
    expect(result.impliedEquityValue.value).toBeNull();
    expect(result.impliedSharePrice.value).toBeNull();
  });

  it("flags a negative implied equity value rather than showing a misleading negative share price", () => {
    // Heavy debt load: implied EV(500) - debt(2000) + cash(0) = deeply negative equity.
    const result = impliedValuation(5, 100, 2000, 0, 0, 0, 50);
    expect(result.impliedEquityValue.value).toBeLessThan(0);
    expect(result.impliedEquityValue.note).toMatch(/negative implied equity/i);
  });

  it("is N/A for implied share price when shares outstanding is zero", () => {
    const result = impliedValuation(10, 200, 300, 0, 0, 100, 0);
    expect(result.impliedSharePrice.value).toBeNull();
    expect(result.impliedSharePrice.meaningful).toBe(false);
  });
});
