import type { MetricResult } from "./types";
import { safeDivide } from "./multiples";

export interface ImpliedValuation {
  impliedEnterpriseValue: MetricResult;
  impliedEquityValue: MetricResult;
  impliedSharePrice: MetricResult;
}

/**
 * Applies a peer multiple (e.g. peer-group median EV/EBITDA) to the subject
 * company's own metric (e.g. its own EBITDA) to back into an implied valuation.
 * This is calculateEnterpriseValue() run in reverse: EV -> equity value ->
 * per-share price, using the subject's own balance sheet to bridge EV to equity.
 * Pure and testable, same pattern as the rest of lib/finance.
 */
export function impliedValuation(
  peerMultiple: number | null,
  subjectMetric: number | null,
  totalDebt: number | null,
  preferredStock: number | null,
  noncontrollingInterest: number | null,
  cashAndEquivalents: number | null,
  sharesOutstanding: number | null
): ImpliedValuation {
  if (peerMultiple === null || subjectMetric === null) {
    const missing: MetricResult = { value: null, meaningful: false, note: "missing input" };
    return { impliedEnterpriseValue: missing, impliedEquityValue: missing, impliedSharePrice: missing };
  }

  const impliedEV = peerMultiple * subjectMetric;
  const impliedEnterpriseValue: MetricResult = { value: impliedEV, meaningful: true };

  if (
    totalDebt === null ||
    preferredStock === null ||
    noncontrollingInterest === null ||
    cashAndEquivalents === null
  ) {
    const missing: MetricResult = { value: null, meaningful: false, note: "missing balance sheet input" };
    return { impliedEnterpriseValue, impliedEquityValue: missing, impliedSharePrice: missing };
  }

  const impliedEquity = impliedEV - totalDebt - preferredStock - noncontrollingInterest + cashAndEquivalents;
  const impliedEquityValue: MetricResult = {
    value: impliedEquity,
    meaningful: true,
    note: impliedEquity < 0 ? "negative implied equity value - the peer multiple, applied here, implies debt exceeds what this business is worth" : undefined,
  };

  const impliedSharePrice = safeDivide(impliedEquity, sharesOutstanding);

  return { impliedEnterpriseValue, impliedEquityValue, impliedSharePrice };
}

/**
 * For per-share multiples (P/E, P/B) the peer multiple applies directly to the
 * subject's own per-share metric (EPS, book value per share) — there's no
 * enterprise-value bridge to walk, unlike impliedValuation() above.
 */
export function impliedSharePriceDirect(
  peerMultiple: number | null,
  subjectPerShareMetric: number | null
): MetricResult {
  if (peerMultiple === null || subjectPerShareMetric === null) {
    return { value: null, meaningful: false, note: "missing input" };
  }
  const value = peerMultiple * subjectPerShareMetric;
  if (subjectPerShareMetric < 0) {
    // Mirrors calculatePE()/calculatePB()'s own N/M rule: a peer multiple applied
    // to the subject's own negative EPS or book value produces a number, but not
    // a meaningful implied price - same reason the subject's own P/E or P/B shows
    // N/M in the comps table.
    return { value, meaningful: false, note: "N/M — negative subject metric makes this implied price meaningless" };
  }
  return { value, meaningful: true };
}
