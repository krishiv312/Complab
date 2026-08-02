# DATA_SOURCE_REVIEW.md

**Version:** 0.1 — Week 1
**Reviewed:** July 2026. Provider terms and pricing change; re-verify before Week 7 launch.

---

## 1. Why this is the highest-stakes decision

Two constraints matter more than price:

1. **Display and redistribution rights.** Many data APIs permit you to *consume* data but not to
   *display* it in a product other people use. That distinction is invisible in the documentation
   quickstart and fatal at launch.
2. **Statement coverage.** Most cheap APIs give prices generously and financial statements grudgingly.
   Comps analysis needs statements.

---

## 2. Comparison

| Provider | Cost | Statements | Prices | Display rights | Verdict |
|---|---|---|---|---|---|
| **SEC EDGAR (data.sec.gov)** | Free | Full XBRL, 2009→ | None | Public domain, no restriction | **Primary — fundamentals** |
| **Finnhub** | Free tier | Limited on free | Yes, delayed | Free tier is non-commercial | **Primary — prices (beta)** |
| **Financial Modeling Prep** | Free 250 req/day; Starter ~$15–22/mo | Good, normalised | Yes | **Display requires a separate licensing agreement with FMP** | Rejected for v1 |
| **Alpha Vantage** | Free 25 req/day; paid $50+/mo | Yes | Yes | Restricted on free | Rejected — 25/day is unusable |
| **Twelve Data** | Free 800 req/day | Thin | Yes | Restricted on free | Backup for prices |
| **Polygon / Massive** | No free tier; from ~$99/mo | Yes | Excellent | Paid tiers permit display | Too expensive for v1 |
| **yfinance / Yahoo scraping** | Free | Yes | Yes | **Violates Yahoo's terms for a public product** | **Rejected — do not use** |

### Notes on the rejections

**Financial Modeling Prep.** Technically the most convenient option — one API for profile,
statements, prices, and a screener, at student-affordable pricing. But FMP's terms state that
displaying or redistributing FMP-sourced data requires a specific Data Display and Licensing
Agreement. Building a public product on the standard subscription would put you outside their terms.
If you later want FMP, email them and ask about display licensing for an educational product *before*
integrating.

**yfinance.** Widely used in tutorials and widely misunderstood. It reads an undocumented internal
Yahoo endpoint. Fine for a private Jupyter notebook; not defensible in a deployed product with users.
Using it would also undercut the credibility of the whole project, which is built on the claim that
your data is properly sourced. Do not use it.

---

## 3. The recommended architecture

**Fundamentals → SEC EDGAR `companyfacts`.** Free, no API key, no registration. Requires a
descriptive `User-Agent` header identifying you and a contact email; requests without one are
rejected. Rate limit is 10 requests/second per IP, with no daily cap. Responses for a large company
can be 5–20 MB, so cache aggressively — a company's facts change only when it files.

```
https://data.sec.gov/api/xbrl/companyfacts/CIK0000320193.json
```

Ticker→CIK mapping comes from `https://www.sec.gov/files/company_tickers.json` (download once,
commit a trimmed copy).

**Why this over a convenience API:** it is the primary regulatory source, it is US government work
with no display restriction, it costs nothing at any scale, and it makes an honest and unusual claim
— your figures come from the filings themselves, not from a reseller's normalisation of them.

**Market data → Finnhub free tier** (60 calls/min) for share price, shares outstanding, company
profile, and logo, during the beta.

**Fallback → demo mode.** Hand-verified JSON for the seed companies, checked against the actual
10-K. Every API path falls back to this. Development is never blocked by a rate limit or an outage.

---

## 4. The real cost of EDGAR: normalisation

EDGAR gives you truth, not convenience. Three problems you will hit, and the mitigations:

**Problem 1 — companies use different XBRL tags for the same concept.**
Revenue may appear as `Revenues`, `RevenueFromContractWithCustomerExcludingAssessedTax`,
`SalesRevenueNet`, or others.

*Mitigation:* a tag-priority resolver. For each canonical field, try an ordered list of acceptable
tags and take the first that resolves. Record which tag was used, and surface it in the UI. This is
not a workaround to hide — it is a genuinely interesting piece of engineering and a good thing to
be able to explain.

**Problem 2 — EBITDA is not a GAAP concept and is not tagged.**
There is no `EBITDA` in XBRL.

*Mitigation:* compute it as `OperatingIncomeLoss + DepreciationDepletionAndAmortization`, label it
**"EBITDA (computed)"** everywhere in the UI, and document the definition in
`FINANCE_METHODOLOGY.md`. Be explicit that this differs from company-reported "Adjusted EBITDA",
which excludes items at management's discretion. Showing that you know the difference is worth more
than silently matching a data vendor's number.

**Problem 3 — LTM requires assembling four quarters.**
EDGAR gives you periods, not a pre-built trailing twelve months.

*Mitigation:* LTM = latest FY − corresponding year-to-date prior period + current year-to-date. If
any component is missing, do not guess: fall back to FY and label the period as `FY2025` rather than
`LTM`. Never silently blend periods.

---

## 5. Licensing and compliance obligations

| Obligation | How it is met |
|---|---|
| SEC User-Agent requirement | Set via `SEC_USER_AGENT` env var, sent on every request |
| SEC 10 req/sec limit | 150ms delay between sequential calls; no parallel fan-out |
| Finnhub free tier is non-commercial | Acceptable during free beta. **Must be resolved before charging anyone.** |
| Logos | Only via a source that licenses them, or omit. Do not hotlink from company sites. |
| Attribution | "Source: SEC EDGAR (XBRL), retrieved [date]" on every figure block and every deck slide |
| Not investment advice | Disclaimer in footer, on every export, and in the AI system prompt |

**Flag for Week 7:** the moment you charge a single user, the Finnhub free tier and any other
non-commercial terms stop being acceptable. Budget for either a paid market-data tier or an FMP
display licence at that point. This is a monetisation blocker, and it is better to know now.

---

## 6. Seed company list (Week 1)

Verified manually against each company's most recent 10-K before being committed.

| Industry | Tickers |
|---|---|
| Footwear & Apparel | NKE, ADDYY, UAA, SKX, DECK, CROX, VFC, LULU |
| Semiconductors | NVDA, AMD, INTC, TXN, AVGO, QCOM, MU, ADI |
| Enterprise Software | CRM, NOW, WDAY, ADBE, ORCL, SNOW, DDOG, TEAM |
| Packaged Food & Bev | KO, PEP, MDLZ, GIS, K, HSY, KHC, CAG |

Start with 8 (Nike's set). Add the rest as normalisation proves out.
