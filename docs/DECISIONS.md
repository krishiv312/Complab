# DECISIONS.md

Append-only log. One entry per material decision. Never delete an entry — supersede it.

Format: **ID · Date · Decision · Alternatives · Reasoning · Revisit when**

---

### D-001 · 2026-07-27 · Single TypeScript codebase; no Python

**Decision:** Next.js 15 App Router, TypeScript throughout. No separate Python service.
**Alternatives:** Next.js + FastAPI; Next.js + Python worker queue.
**Reasoning:** Comps mathematics is arithmetic and order statistics — no numerical library is
needed. PptxGenJS generates PowerPoint in Node. A second language doubles the deployment surface and
debugging surface for a first-time builder, with no capability gained.
**Revisit when:** a DCF with simulation, or backtesting across thousands of tickers, enters scope.

---

### D-002 · 2026-07-27 · SEC EDGAR as the primary fundamentals source

**Decision:** SEC EDGAR `companyfacts` XBRL API for all financial-statement data.
**Alternatives:** Financial Modeling Prep; Alpha Vantage; yfinance.
**Reasoning:** Free at any scale, no key, official primary source, US government work with no
display restriction. FMP requires a separate Data Display and Licensing Agreement to show its data
in a product — a blocker for a public app on a standard subscription. Alpha Vantage's free tier of
25 requests/day is unusable. yfinance reads an undocumented Yahoo endpoint in breach of Yahoo's
terms and is not defensible in a deployed product.
**Cost accepted:** raw XBRL requires a normalisation layer — tag-priority resolution, computed
EBITDA, manual LTM assembly. This is real work, roughly Week 2, and it is also the most technically
interesting part of the build.
**Revisit when:** expanding beyond US listings, since EDGAR covers SEC filers only.

---

### D-003 · 2026-07-27 · Finnhub free tier for market data during beta

**Decision:** Finnhub free tier (60 calls/min) for share price, shares outstanding, profile, logo.
**Alternatives:** Twelve Data; Alpha Vantage; Polygon/Massive.
**Reasoning:** Most generous free tier for the fields needed. EDGAR provides no market data, so a
second source is unavoidable.
**Known limitation:** Finnhub's free tier is non-commercial. This is acceptable for a free beta and
becomes a blocker the moment anyone is charged.
**Revisit when:** before any monetisation — Week 7 at the latest.

---

### D-004 · 2026-07-27 · Demo mode as a first-class feature, not a stopgap

**Decision:** Hand-verified JSON for seed companies, checked against filings, committed to the repo.
Every live data path falls back to it.
**Reasoning:** Development must never be blocked by a rate limit or an outage, and a demo must never
fail during a presentation. It also gives the calculation tests a fixed, verified fixture set.
**Revisit when:** never — this stays permanently.

---

### D-005 · 2026-07-27 · No database until Week 3

**Decision:** Weeks 1–2 run on committed JSON and a filesystem cache. Supabase is added in Week 3
when saved peer groups first require persistence.
**Alternatives:** set up Supabase in Week 1.
**Reasoning:** A database adds migrations, auth, environment configuration, and RLS before there is
anything to store. Nothing in Weeks 1–2 needs persistence.
**Revisit when:** Week 3, as planned.

---

### D-006 · 2026-07-27 · AI never computes a number

**Decision:** All figures are produced by tested TypeScript in `lib/finance/`. The language model
receives already-computed figures and writes prose about them. It has no path to a displayed number.
**Alternatives:** letting the model extract figures from filings; letting it compute multiples.
**Reasoning:** This is the product's core credibility claim. It is also the honest answer to the
obvious interview question, "how do you know the AI isn't making the numbers up?" — it structurally
cannot.
**Revisit when:** never. This is a product principle, not an implementation choice.

---

### D-007 · 2026-07-27 · Non-financial US operating companies only in v1

**Decision:** Exclude banks, insurers, REITs, pre-revenue biotech, SPACs. USD reporters only.
**Reasoning:** Enterprise value is not meaningful for banks; they are valued on P/E and P/TBV.
Including them would produce numbers that are wrong rather than merely limited. Restricting to USD
removes FX normalisation from v1 entirely.
**Revisit when:** post-MVP, and only with a separate valuation path for financials.

---

### D-008 · 2026-07-27 · Working name "CompLab"

**Decision:** Provisional name CompLab. Not registered, no domain purchased.
**Reasoning:** Descriptive, does not overclaim institutional status, avoids naming decisions
consuming Week 1 time.
**Revisit when:** Week 8, before public launch.

---

<!-- Template for new entries:

### D-0NN · YYYY-MM-DD · <one-line decision>

**Decision:**
**Alternatives:**
**Reasoning:**
**Revisit when:**

-->
