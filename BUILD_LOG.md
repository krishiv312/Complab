# BUILD_LOG.md

## Entry 1 — Week 1: environment, seed data, calculation library, first UI

**Scope covered:** Day 1 through Day 6 of `docs/WEEK1_PLAN.md`.

### What I built

- Next.js 16 / TypeScript / Tailwind v4 scaffold, deployed nowhere yet.
- Four hand-transcribed companies in `data/demo/` (CROX, DECK, SKX, NKE), each with
  two fiscal years, sourced directly from SEC EDGAR 10-Ks and dated market quotes,
  with full provenance (`source`, `retrievedAt`, `documentUrl`) on every figure block.
- `lib/finance/types.ts` — the canonical financial shape, extended twice during
  transcription as real filings exposed gaps in the original schema (see below).
- `lib/finance/multiples.ts` — market cap, EV, EBITDA, and the full set of ratios
  (EV/Revenue, EV/EBITDA, EV/EBIT, P/E, P/B, margins, revenue growth), every function
  returning `{ value, meaningful, note? }` rather than a bare number.
- 33 Vitest tests, most of them against real transcribed data rather than synthetic
  fixtures.
- `/app/company/[ticker]/page.tsx` — profile header, financial summary, valuation
  cards, each showing source/period/currency/retrieved-date, with `N/A` and `N/M`
  rendered as visually distinct badges.
- Landing page with a working ticker/name autocomplete search, and a
  `not-found.tsx` for unknown tickers that lists what's actually available instead
  of a bare 404.

### What broke

- **The schema wasn't right on the first company.** CROX alone forced three
  additions to `types.ts`: splitting `interestExpenseNet` into gross income/expense
  with a derived flag, adding `totalCurrentAssets`/`totalAssets`, and splitting
  `MarketSnapshot.source` into separate `priceSource`/`sharesSource` — because price
  and share count routinely come from different places and a single source field
  hid that.
- **Two separate date-mismatch bugs**, same root cause, caught by the STOP RULE
  hand-check both times: DECK's `$100.09` turned out to be the fiscal-year-end
  close, not the cover-page share-count date; NKE's `$46.23` had the same problem.
  Neither error would have been obvious from the number alone — both were
  plausible-looking prices. The lesson held: a price without a date-match check is
  not a fact yet.
- **Skechers had no current 10-K** — it went private mid-2025, so the seed data is
  a 2024 filing, deliberately older than the other three. Real products hit stale
  or missing filings; the schema didn't need to change, just the plan for that one
  company.
- **Nike's EBIT wasn't actually a new problem** — the guide's own derivation formula
  (`pretaxIncome + interestExpenseNet`) reproduced NIKE's disclosed non-GAAP EBIT
  reconciliation exactly, which was a good sanity check but also a reminder not to
  invent new fields (`ebit`, `ebitSourceType`) when the existing schema already
  covers the case.
- **Two real UI bugs found by actually looking at screenshots**, not by reading the
  code: negative currency values rendered as `$-81.2M` instead of `-$81.2M`, and the
  P/E card's footer showed a fiscal-year label next to a "Market quote" source
  label — internally inconsistent provenance, which is exactly the kind of thing
  this product exists to prevent.
- A hydration warning showed up during interactive browser testing
  (`caret-color: transparent` on the search input). Traced it to the headless
  Chromium automation environment itself — confirmed by grepping the source for
  `caret-color` (not present) and diffing the actual SSR HTML (no `style`
  attribute) — not a real defect a user would hit.

### What I learned

- The seed-data day was correctly billed as the slowest and most important. Every
  schema decision after CROX existed because a real filing didn't fit the original
  shape — the shape can't be designed up front from first principles, only
  discovered by transcribing real numbers.
- "N/A" and "N/M" are not the same failure mode, and conflating them loses
  information: `N/A` means data is missing, `N/M` means a number was computed but
  is misleading to show as-is (negative EBITDA driving a nonsensical multiple).
  Margins and revenue growth deliberately do **not** get N/M treatment for negative
  values — a negative margin is a real fact, not a broken ratio.
- Hand-verification (the Block B "stop rule") caught two genuine data errors before
  they reached code. Neither would have been caught by a type checker or a test —
  they were plausible numbers, just for the wrong date.

### Not done yet

- Deploy to Vercel, phone check, and an outside pair of eyes trying the product
  unsupervised — the rest of Day 7.
- Nothing from Block F onward is committed to git yet.
