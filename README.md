# Company Labs

Comparable-company valuation multiples — enterprise value, EV/EBITDA, EV/EBIT,
P/E, P/B — computed by tested code, with peer suggestion, quartile statistics,
and an implied valuation range, live at
[complab-nine.vercel.app](https://complab-nine.vercel.app).

Built as a learning project for understanding how equity comps actually work,
including where the numbers physically come from and what happens at the edges
(negative EBITDA, missing data, dual share classes, foreign filers, companies
that stop filing).

## What this is not

- Not investment advice, and never will produce a buy/sell/hold output.
- Not AI-generated. Four companies (CROX, DECK, SKX, NKE) were transcribed by
  hand from their actual 10-K filings — see `docs/SEED_DATA_GUIDE.md` and
  `data/demo/`. The rest are ingested automatically from SEC EDGAR's own XBRL
  `companyfacts` API — the same structured data the filings are built from, not
  a third-party reseller's normalization of it — and validated against the
  hand-verified set (`scripts/validate-pipeline.ts`) rather than trusted on
  faith. `data/demo/` is never overwritten by the pipeline.

## Running it locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Search by ticker or
company name (e.g. "nike") to land on a company page, or go straight to
`/analysis/NKE` for the full comps workspace: peer suggestion, an editable
peer group, a sortable comps table, quartile statistics, an implied valuation
range, and EV/EBITDA and EV/Revenue bar charts. The peer selection is encoded
in the URL (`?peers=DECK,CROX,SKX`), so any comparison is a shareable link —
there's no account and nothing is stored server-side.

To ingest more companies from live SEC EDGAR data, you'll need a
`SEC_USER_AGENT` and `FINNHUB_API_KEY` in `.env.local` (see `.env.example`),
then:

```bash
npx tsx scripts/ingest-company.ts TICKER...
```

This writes to `data/companies/`, prints a data-completeness report (which
field is missing and which multiple it blocks, if any), and warns if a
company isn't yet registered in `lib/data/demo.ts` — that registration is a
deliberate, explicit step (see that file's own comment), not automatic, so
the script checks for it rather than silently shipping an invisible company.

## Other useful commands

```bash
npm test                              # Vitest — the finance calculation library's test suite
npm run lint                          # ESLint
npm run build                         # production build
npx tsx scripts/print-multiples.ts    # prints every computed multiple for the hand-verified companies
npx tsx scripts/validate-pipeline.ts  # diffs live-ingested CROX/DECK/SKX/NKE against the hand-verified ground truth
npm run check-completeness            # audits every company for gaps that block a displayed multiple, with the exact field and cause named
```

## How it's organized

- `lib/finance/` — pure calculation functions: market cap, EV, multiples,
  margins, peer suggestion scoring, quartile statistics, implied valuation.
  No I/O, no network calls, fully tested. This is the part of the codebase
  every number on the site traces back to.
- `lib/data/` — the SEC EDGAR / Finnhub ingestion pipeline (`edgar.ts`,
  `normalize.ts`, `market.ts`, `ingest.ts`), Zod schema validation
  (`schema.ts`), and the merged company registry (`demo.ts`).
- `data/demo/` — the hand-verified seed data (CROX, DECK, SKX, NKE), one JSON
  file per company, each figure tagged with its source, filing date, and
  retrieval date. Permanent ground truth, never touched by the pipeline.
- `data/companies/` — the 20 auto-ingested companies across Footwear &
  Apparel, Semiconductors, Enterprise Software, and Packaged Food &
  Beverage, same shape as the hand-verified set, validated against EDGAR.
- `app/company/[ticker]/` — the single-company profile page.
- `app/analysis/[ticker]/` — the comps analysis workspace (peer group, table,
  charts, valuation range).
- `app/methodology/`, `app/privacy/`, `app/feedback/` — static pages: how the
  numbers are computed, what data is (and isn't) collected, and how to report
  a problem.
- `docs/` — the planning and process documents this project was built
  against, including `ARCHITECTURE.md`, `MVP_SCOPE.md`, `FINANCE_METHODOLOGY.md`,
  and the day-by-day build plans.

## Disclaimer

This is a demo/beta product covering a small set of companies. Every figure is
labelled with its source, period, currency, and retrieval date, and `N/A` vs
`N/M` are shown as distinct, deliberate states rather than blank cells.
Nothing in this project is investment advice.
