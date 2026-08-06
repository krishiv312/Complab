# FINANCE_METHODOLOGY.md

How figures on Company Labs are computed, and where automated data can differ from
the hand-verified `data/demo/*.json` companies. Written after building and
validating `lib/data/` against the four hand-verified companies
(`scripts/validate-pipeline.ts`) — every claim here is checked, not aspirational.

---

## EBITDA is not a GAAP concept

There is no `EBITDA` tag in XBRL. Every EBITDA figure on this site is **computed**
as `operatingIncome + depreciationAmortization`, labelled "EBITDA (computed)"
everywhere it appears. This differs from a company's own "Adjusted EBITDA" (which
excludes items at management's discretion) — the two are not the same number, and
this site never claims otherwise.

## N/A vs N/M

- **N/A** — the figure is genuinely unavailable. The underlying value is `null`.
- **N/M** — a real number was computed, but showing it as a ratio would be
  actively misleading (e.g. a negative EV/EBITDA multiple when EBITDA is
  negative). The number still exists; it's just not meaningful as a multiple.

Margins and revenue growth never get N/M treatment for negative values — a
negative margin or a revenue decline is a real fact, not a broken ratio.

## Period basis

LTM (trailing twelve months) requires assembling four quarters. If any component
is missing, this pipeline does not guess — it falls back to the latest full fiscal
year and labels the period `FY2025` (or whichever year), never silently blending
periods to approximate an LTM that isn't fully supported by the data.

---

## The automated SEC EDGAR pipeline (`lib/data/`)

Company data now comes from two sources: the four permanently hand-verified
companies in `data/demo/` (`CROX`, `DECK`, `SKX`, `NKE` — never touched by the
pipeline, the ground truth everything else is checked against), and everything
else via `lib/data/ingest.ts`, which pulls structured XBRL data directly from
SEC EDGAR's `companyfacts` API.

### Tag-priority resolution

Companies use different exact XBRL tags for the same accounting concept — e.g.
revenue might be `Revenues`, `RevenueFromContractWithCustomerExcludingAssessedTax`,
or `SalesRevenueNet`. `lib/data/normalize.ts`'s `TAG_LISTS` tries an ordered list
per canonical field and takes the first match. This list started from general
XBRL taxonomy knowledge and was corrected against live data during validation —
two real gaps found and fixed this way:

- Crocs tags interest expense as `InterestExpenseNonoperating`, not the more
  common `InterestExpense` — added to the fallback list.
- Crocs tags interest income as `InvestmentIncomeInterestAndDividend`, not
  `InvestmentIncomeInterest` — same fix.

### Matching the right period, not just the right filing

A single 10-K's XBRL data contains *every* comparative year under the same
accession number. Matching only on accession number risks picking whichever
year's value happens to appear first in the array. `pickTagValue()` matches on
**both** the accession number and the specific period's start/end dates.

### Fields with no single consolidated tag

Two real cases found during validation:

- **Deckers reports pretax income split into Domestic + Foreign components**,
  with no consolidated "pretax income" tag anywhere in the filing. The pipeline
  sums `IncomeLossFromContinuingOperationsBeforeIncomeTaxesDomestic` +
  `...Foreign` when the direct tag list resolves to nothing — verified to match
  Deckers' hand-verified pretax income exactly ($1,326.356M).
- **Short-term debt** is `NotesPayableCurrent` + `ShortTermBorrowings` +
  `LongTermDebtCurrent` summed — whichever components exist. `null` only if
  *none* of them resolved, not if some are simply absent.

### Directly-reported net interest (Nike-style)

Some filers (Nike) disclose only a single netted "interest income (expense)"
line rather than separate gross figures. `InterestIncomeExpenseNonoperatingNet`
covers this — but its sign convention is the **opposite** of this project's
(positive there means net benefit; this project's `interestExpenseNet` is
positive-for-cost), so the pipeline negates it. When this direct-net path is
used, `interestIncome`/`interestExpenseGross` are explicitly nulled rather than
left holding a stray partial value from an unrelated, incomplete tag — showing
a lone `interestIncome` figure next to a `null` `interestExpenseGross` would
imply a complete breakdown that doesn't exist.

### Known, accepted gaps versus hand-verified data

- **`null` where hand-verified data has a confirmed `0`.** A human reading the
  balance sheet directly can confidently conclude "no short-term debt line
  exists, so it's zero." Automated tag-absence is weaker evidence — the
  convention here (matching `types.ts`'s own rule) is: if a tag can't be found,
  write `null`, not `0`. This means some auto-ingested companies show `N/A`
  where CROX/DECK/SKX/NKE show a confirmed `$0`. This is by design, not a bug.
- **Company name casing.** SEC's registered legal name is in shouting caps
  (`"DECKERS OUTDOOR CORP"`). The pipeline title-cases it, which gets closer to
  a company's own styling in most cases but isn't universally correct — Nike's
  own branding is `"NIKE, Inc."`, all caps on the first word; title-casing
  produces `"Nike, Inc."` instead. No casing algorithm resolves this for every
  company; this is accepted as cosmetic, not corrected with a lookup table.
- **D&A composition is a judgment call the pipeline can't make.** Deckers'
  hand-verified record includes a separately-disclosed cloud-computing
  amortization line on top of the primary "depreciation, amortization and
  accretion" line — a deliberate choice made by hand during transcription. The
  pipeline uses only the primary combined tag. This is a real, expected,
  one-field divergence for Deckers specifically, not something worth chasing —
  see `scripts/validate-pipeline.ts` output.

### Fail-safe, not best-effort

- **Foreign filers** (20-F/40-F, e.g. ADR-listed companies like Adidas/`ADDYY`)
  are detected from the filing history *before* any tag matching is attempted
  and rejected outright — they use the `ifrs-full` taxonomy, not `us-gaap`, so
  attempting normalization would silently produce a mostly-`null` record
  instead of a clear rejection.
- **Financial companies** (banks, insurers, REITs, SPACs) are detected via SIC
  code (6000–6799) and flagged `isFinancial: true`, excluded from standard
  EV-based comps per the project's non-financials-only scope.
- **Multi-class share structures** (Nike-style Class A/B) can appear as multiple
  `EntityCommonStockSharesOutstanding` entries for the same date with no clean
  per-class label in the flattened API response. Rather than guessing which
  entry (or combination) is right, this is routed to manual review — the same
  treatment Nike's own hand-verified record already required.
- **Stale filers with no current 10-K** (Skechers, which went private in 2025)
  fail cleanly at the ticker-resolution step — expected, not an exception.
- **Market price date mismatches.** Finnhub's free tier only covers roughly a
  1-year historical lookback. If a filing's cover-page share-count date falls
  outside that window, the pipeline returns "needs manual price" rather than
  substituting a different date's price — silently mismatching a price date to
  a share-count date is the exact bug class this project's own `BUILD_LOG.md`
  caught by hand twice already (DECK and NKE), and the pipeline must not
  reintroduce it.

### Validating the pipeline

`scripts/validate-pipeline.ts` (live network calls, not part of `npm test`) runs
the actual normalization pipeline against CROX/DECK/SKX/NKE and diffs the result
field-by-field against the hand-verified JSON. Financial-statement fields are
expected to match exactly. As of the last run: CROX, SKX, and NKE pass cleanly;
DECK has exactly one expected divergence (the D&A judgment call above).
