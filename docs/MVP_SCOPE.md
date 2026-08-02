# MVP_SCOPE.md

**Scope owner:** Krishiv Sharma
**Frozen on:** Week 1
**Rule:** anything not on the IN list is a roadmap item, not a Week 1–8 item.

---

## Coverage boundaries

| Dimension | MVP decision | Rationale |
|---|---|---|
| Geography | US-listed companies only | SEC EDGAR gives free, official, structured data. No other market has an equivalent. |
| Company type | Non-financial operating companies | Banks and insurers need different valuation logic (P/TBV, no EV). Excluded by design. |
| Also excluded | REITs, biotech pre-revenue, SPACs, holding companies | Distorted or meaningless multiples on standard metrics. |
| Currency | USD reporting only | Avoids FX normalisation entirely in v1. |
| Period basis | Latest FY, plus LTM where all four quarters are available | LTM is preferred; FY is clearly labelled when LTM is unavailable. |
| Company count | ~40 verified companies across 4 industries | Depth over breadth. A working analysis for 40 names beats a broken one for 5,000. |

**Starting industries:** Footwear & Apparel · Semiconductors · Enterprise Software · Packaged Food
& Beverage. Each has clean peer sets and unambiguous business models — good for testing and good
for demonstrating the product.

---

## IN SCOPE (the 15 MVP features)

| # | Feature | Definition of done |
|---|---|---|
| 1 | Company search | Search by ticker or name, autocomplete, returns company page |
| 2 | Company overview | Profile, sector, industry, description, HQ, exchange, currency |
| 3 | Core financial data | Revenue, EBITDA, EBIT, Net income, EPS, Cash, Total debt, Book equity, Shares |
| 4 | Valuation multiples | EV/Revenue, EV/EBITDA, EV/EBIT, P/E, P/B — with N/M handling |
| 5 | Suggested peers | Transparent weighted score, 5–10 peers, per-peer rationale text |
| 6 | Editable peer group | Add, remove, reset to suggestion |
| 7 | Comps table | Sortable, column show/hide, CSV export |
| 8 | Quartile statistics | Min, Q1, Median, Q3, Max + subject company row |
| 9 | Valuation range | Implied EV → equity → share price, from peer multiples |
| 10 | Charts | 4 charts only: EV/EBITDA bar, EV/Rev bar, growth-vs-margin scatter, football field |
| 11 | Provenance | Source, period, currency, retrieval date visible on every figure block |
| 12 | Saved analysis | Sign in, save a named analysis, reload it |
| 13 | AI commentary | Grounded, fact/interpretation labelled, editable, disclaimed |
| 14 | Pitchbook export | One template, 8–12 slides, .pptx download |
| 15 | Public beta | Deployed, reachable, feedback form, privacy notice |

---

## OUT OF SCOPE (explicitly deferred)

Do not build these before Week 8, regardless of how easy they look:

- DCF engine, WACC calculator, terminal value modelling
- Precedent transactions database
- Private-company data or valuation
- Multiple pitchbook templates or a template editor
- Any non-US exchange (SGX, IDX, NSE, LSE)
- Banks, insurers, REITs
- Real-time or intraday pricing
- Collaborative editing, comments, sharing links
- Mobile app
- Machine-learning peer selection
- Payment processing and subscriptions
- Custom chart designer
- Team workspaces or role permissions
- Automatic buy/sell/hold output — **never**, at any stage

---

## Stage gate: do not pass without these

**Gate 1 — end of Week 4.** The comps platform must work end-to-end on its own, for at least 10
companies, with all calculation tests passing. If calculations are unreliable, Week 5 is spent
fixing them, not adding AI. The pitchbook generator does not begin until this gate is cleared.

**Gate 2 — end of Week 6.** A generated .pptx must open cleanly in PowerPoint, Keynote, and Google
Slides with charts and tables intact, for three different companies.

---

## Cut list

If the schedule slips, cut in this order — the top items go first:

1. AI commentary (feature 13) → ship with a static methodology note instead
2. Saved analysis (feature 12) → ship stateless, URL-encoded peer selections
3. Charts 3 and 4 (scatter, football field)
4. EV/EBIT and P/B multiples
5. Pitchbook slides 8–9 (industry overview, investment considerations)

**Never cut:** provenance labelling (11), N/M handling (4), or the disclaimer. Those are what make
the product honest rather than impressive-looking.
