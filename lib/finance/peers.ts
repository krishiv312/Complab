import type { DemoCompany } from "./types";

export interface PeerSuggestion {
  ticker: string;
  name: string;
  score: number;
  rationale: string;
}

const WEIGHT_SUBINDUSTRY = 0.4;
const WEIGHT_SIZE = 0.6;
// A sector-only match (broader tier, used only when the industry-only pool is
// thin) is capped below the weakest industry-match score, so it never outranks
// a genuine same-industry peer regardless of how close its revenue is.
const SECTOR_ONLY_SCORE_CAP = 0.5;

function revenueOf(company: DemoCompany): number | null {
  return company.financials[0]?.incomeStatement.revenue ?? null;
}

/**
 * 1.0 when revenue is identical, decaying with log-distance so that a peer 2x
 * or 3x the subject's size still scores reasonably (comps sets routinely span
 * a few multiples of revenue), while a 50x-larger or smaller company scores
 * near zero. Log scale, not linear, because company size is itself
 * log-distributed - a linear scale would make every large-cap peer set look
 * equally "close" once revenue differences hit the billions.
 */
function sizeSimilarity(subjectRevenue: number, candidateRevenue: number): number {
  if (subjectRevenue <= 0 || candidateRevenue <= 0) return 0;
  const logDiff = Math.abs(Math.log(subjectRevenue) - Math.log(candidateRevenue));
  return Math.max(0, 1 - logDiff / Math.log(50));
}

function sizeRationale(subjectRevenue: number, candidateRevenue: number): string {
  const ratio = candidateRevenue / subjectRevenue;
  return `revenue ${ratio >= 1 ? ratio.toFixed(1) + "x larger" : (1 / ratio).toFixed(1) + "x smaller"}`;
}

/**
 * Transparent, weighted peer scoring - but industry match is a GATE, not just a
 * scoring bonus. Comps analysis only means something between businesses in the
 * same industry; a company with similar revenue in a totally unrelated industry
 * (say, a semiconductor maker sized like Nike) is not a comp no matter how close
 * the revenue is, and suggesting one would actively undermine the tool. Within
 * the qualifying industry (or, if that pool is thin, sector) tier, sub-industry
 * match and revenue-size similarity rank the candidates. Pure and testable, same
 * pattern as lib/finance/multiples.ts - no I/O, no network.
 */
export function suggestPeers(
  subject: DemoCompany,
  candidates: DemoCompany[],
  limit = 8,
  minIndustryPoolSize = 3
): PeerSuggestion[] {
  const subjectRevenue = revenueOf(subject);
  const pool = candidates
    .filter((c) => c.profile.ticker !== subject.profile.ticker)
    .filter((c) => !c.profile.isFinancial);

  const sameIndustry = subject.profile.industry !== "";
  const industryPool = sameIndustry
    ? pool.filter((c) => c.profile.industry === subject.profile.industry)
    : [];

  // Only widen to sector-only matches when the industry pool is too thin to be
  // a useful comps set on its own - never as a default, since "same sector,
  // different industry" is a materially weaker peer relationship.
  const needsSectorFallback = industryPool.length < minIndustryPoolSize && subject.profile.sector !== "";
  const sectorPool = needsSectorFallback
    ? pool.filter(
        (c) => c.profile.sector === subject.profile.sector && !industryPool.includes(c)
      )
    : [];

  function score(c: DemoCompany, tierCap: number | null): PeerSuggestion {
    const reasons: string[] = [];
    let s = 0;

    const sameSubIndustry =
      subject.profile.subIndustry !== "" && c.profile.subIndustry === subject.profile.subIndustry;
    if (sameSubIndustry) {
      s += WEIGHT_SUBINDUSTRY;
      reasons.push(`same sub-industry (${c.profile.subIndustry})`);
    } else if (tierCap === null) {
      reasons.push(`same industry (${c.profile.industry})`);
    } else {
      reasons.push(`same sector (${c.profile.sector}), different industry`);
    }

    const candidateRevenue = revenueOf(c);
    if (subjectRevenue !== null && candidateRevenue !== null) {
      s += sizeSimilarity(subjectRevenue, candidateRevenue) * WEIGHT_SIZE;
      reasons.push(sizeRationale(subjectRevenue, candidateRevenue));
    }

    if (tierCap !== null) s = Math.min(s, tierCap);

    return { ticker: c.profile.ticker, name: c.profile.name, score: s, rationale: reasons.join("; ") };
  }

  const industryScored = industryPool.map((c) => score(c, null));
  const sectorScored = sectorPool.map((c) => score(c, SECTOR_ONLY_SCORE_CAP));

  return [...industryScored, ...sectorScored]
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
