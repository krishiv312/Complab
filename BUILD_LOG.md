# BUILD_LOG.md

## Entry 2 — Compressing the remaining MVP into a 1-2 week timeline

**Scope covered:** the rest of Gate 1 (`docs/MVP_SCOPE.md`) plus feature #15
(public beta), executed as a 5-phase plan
(peers/comps/charts/live data/polish) instead of the original 7-more-weeks
schedule. Four scope cuts made this possible, all confirmed up front rather
than discovered under pressure: a live SEC EDGAR pipeline instead of more
hand-transcription, stateless URL-encoded peer selection instead of
auth/saved analyses, a static methodology page instead of AI commentary, and
pitchbook (.pptx) export cut in favor of the PDF export already built.

### What I built

- **A live SEC EDGAR ingestion pipeline** (`lib/data/`) — CIK resolution,
  `companyfacts` XBRL tag matching by both accession number and period dates
  (a single 10-K contains every comparative year under one accession — get
  that match wrong and you silently blend two different periods), foreign-filer
  detection (20-F/40-F), multi-class-share detection, and a fail-safe (not
  best-effort) posture: absent tags return `null`, never a guessed `0`. Ten
  companies ingested (VFC, LULU, then the semiconductor set NVDA/AMD/INTC/TXN/
  AVGO/QCOM/MU/ADI, to prove peer suggestion isn't hardcoded to footwear),
  validated against the four hand-verified companies via
  `scripts/validate-pipeline.ts` — CROX/SKX/NKE match exactly; DECK has one
  accepted divergence (a D&A add-back methodology difference, documented, not
  silently ignored).
- **Peer suggestion** (`lib/finance/peers.ts`) — industry match is a hard gate,
  not just a scoring bonus, after an early version let semiconductor companies
  pad Nike's suggested peers. Sub-industry match and log-scale revenue
  similarity rank candidates within a qualifying industry.
- **The comps analysis workspace** (`app/analysis/[ticker]/`) — editable peer
  group encoded in the URL for shareable, account-free links; a sortable
  TanStack Table v9 comps table (a fundamentally different, functional-
  composition API from v8 — read from the package's own bundled docs rather
  than guessed); quartile statistics and an implied valuation range that
  flags negative implied equity explicitly instead of showing a nonsensical
  negative share price; EV/EBITDA and EV/Revenue bar charts.
- **Dark mode, methodology/privacy/feedback pages, and a visual redesign** —
  brand color, modern SaaS layout, CSV export at both the single-company and
  comps-table level.

### What broke

- **`calculateEnterpriseValue`'s null-cascade** — it correctly requires every
  component (debt, preferred, NCI, cash) to be non-null before computing EV,
  but hand-verified data always has an explicit `0` where auto-ingested data
  has `null` for "no matching tag found at all." Fixed with `?? 0` defaults at
  the single `compute.ts` call site, not by loosening the function itself.
- **Several real EDGAR tag-mapping bugs**, each caught by
  `validate-pipeline.ts` diffing against ground truth before it could reach a
  real company's numbers: wrong interest-expense tags for CROX, DECK's pretax
  income needing a domestic+foreign split fallback, NKE's net-interest tag
  being sign-inverted, and shares-outstanding needing to filter by accession
  number first (without it, a company with a mid-year share count revision
  picked up the wrong figure).
- **A logo transparency bug that took far longer than the number-correctness
  bugs above.** Two PNG assets rendered as solid opaque white boxes in dark
  mode. Ruled out, in order: the Next.js image optimizer's re-encoding,
  an embedded ICC color profile, PIL-specific PNG serialization (re-tested
  with `sips` as a completely different encoder), GPU vs. software
  compositing, and headless-shell vs. full Chromium — all had zero effect,
  and a synthetic control PNG rendered correctly in the identical harness the
  whole time. Cross-engine testing (Firefox and WebKit, not just Chromium)
  showed the identical white box, which ruled out a browser engine bug
  entirely — a real bug would never reproduce identically across three
  independent rendering engines. That pointed back to the files themselves.
  Tracing the assets to their source PDF showed the "transparent" PNGs had
  been derived from a background-removal pass on a plain white-background
  raster embed — re-deriving clean crops directly from that source and
  redoing the background removal fixed it immediately. The exact mechanism
  of the original corruption (PIL, `sips`, and three browsers' decoders all
  agreed the file's alpha channel was clean at `0`/`255`, yet every engine
  painted it opaque) was never fully identified; the fix didn't require
  knowing why, only a clean re-derivation from source.

### What I learned

- Fail-safe beats best-effort for anything ingesting real filings
  automatically: a clean "unsupported" or `null` is recoverable, a
  confidently-wrong number is not. Every hard case called out in the plan up
  front (foreign filers, financial companies, multi-class shares, stale
  filers, the historical-price lookback limit) showed up in practice exactly
  as anticipated, because it was designed against real, previously-hit bugs
  rather than guessed.
- When a rendering bug survives re-encoding through multiple independent
  tools, the next diagnostic step is to change the *rendering engine*, not
  try a fourth encoder — three unrelated engines agreeing is strong evidence
  the file's own history is the problem, not any one engine's decoder.
- The hand-verified/auto-ingested split (`data/demo/` vs `data/companies/`,
  never merged in either direction) paid for itself directly: it's what made
  `validate-pipeline.ts` possible, and that script is what caught every
  tag-mapping bug above before a real company's multiples were wrong.

### Not done yet

- Stretch charts (growth-vs-margin scatter, football field) — explicitly
  deferred per the plan's own priority order, not started.
- Vercel env vars for `SEC_USER_AGENT`/`FINNHUB_API_KEY` were planned but
  turned out unnecessary — the deployed app only reads pre-ingested static
  JSON; the pipeline runs locally via scripts, not at build or request time.

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
