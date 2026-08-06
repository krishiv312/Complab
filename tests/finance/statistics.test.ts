import { describe, expect, it } from "vitest";
import { quartiles, quartilesFromMetrics } from "../../lib/finance/statistics";

describe("quartiles", () => {
  it("returns null for an empty array", () => {
    expect(quartiles([])).toBeNull();
  });

  it("computes min/median/max for a single value", () => {
    const result = quartiles([42]);
    expect(result).toEqual({ min: 42, q1: 42, median: 42, q3: 42, max: 42, count: 1 });
  });

  it("matches a hand-computed odd-length set (Excel QUARTILE.INC convention)", () => {
    // 1,2,3,4,5,6,7,8,9 -> Q1=3, median=5, Q3=7 (linear interpolation)
    const result = quartiles([9, 1, 5, 3, 7, 2, 8, 4, 6]);
    expect(result).toEqual({ min: 1, q1: 3, median: 5, q3: 7, max: 9, count: 9 });
  });

  it("interpolates for an even-length set", () => {
    // 1,2,3,4 -> median = 2.5, Q1 = 1.75, Q3 = 3.25 (linear interpolation)
    const result = quartiles([4, 1, 3, 2]);
    expect(result!.median).toBeCloseTo(2.5, 5);
    expect(result!.q1).toBeCloseTo(1.75, 5);
    expect(result!.q3).toBeCloseTo(3.25, 5);
    expect(result!.count).toBe(4);
  });

  it("does not mutate the input array", () => {
    const input = [3, 1, 2];
    quartiles(input);
    expect(input).toEqual([3, 1, 2]);
  });
});

describe("quartilesFromMetrics", () => {
  it("excludes null (N/A) and not-meaningful (N/M) results from the stats", () => {
    const result = quartilesFromMetrics([
      { value: 10, meaningful: true },
      { value: 20, meaningful: true },
      { value: null, meaningful: false }, // N/A - excluded
      { value: -5, meaningful: false }, // N/M - excluded even though it has a value
      { value: 30, meaningful: true },
    ]);
    expect(result).toEqual({ min: 10, q1: 15, median: 20, q3: 25, max: 30, count: 3 });
  });

  it("returns null when every result is N/A or N/M", () => {
    const result = quartilesFromMetrics([
      { value: null, meaningful: false },
      { value: -1, meaningful: false },
    ]);
    expect(result).toBeNull();
  });
});
