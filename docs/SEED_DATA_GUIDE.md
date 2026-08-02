# SEED_DATA_GUIDE.md

How to transcribe a 10-K into a demo JSON file. Follow this once per company.
Order: **CROX → DECK → SKX → NKE**.

Budget 45 minutes for the first company, 20 for each after.

---

## Step 1 — Find the filing

1. Go to `https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany`
2. Enter the ticker, set **Filing Type** to `10-K`, search
3. Open the most recent 10-K → **Filing Detail** page
4. Note the **CIK** (top of the page) and the **filing date**
5. Copy the URL of the filing detail page — this goes in `documentUrl`
6. Open the primary document (usually `*-10k_*.htm` or similar)

Inside the document, use Ctrl+F for these headings:

| You need | Search for |
|---|---|
| Income statement | "CONSOLIDATED STATEMENTS OF OPERATIONS" or "OF INCOME" |
| Balance sheet | "CONSOLIDATED BALANCE SHEETS" |
| Cash flow statement | "CONSOLIDATED STATEMENTS OF CASH FLOWS" |
| Share count | "shares of common stock outstanding" (cover page) |

**Check the units line first.** Every statement says "in thousands" or "in millions"
near the heading. Write it down before you copy a single figure. Getting this
wrong by 1000x is the most common seed-data error, and it produces a market cap
that looks almost plausible.

---

## Step 2 — Income statement

Take **two fiscal years** — you need the prior year for growth calculations.

| Field | Where |
|---|---|
| `revenue` | Top line. May be "Revenues", "Net sales", or "Total revenues" |
| `costOfRevenue` | "Cost of sales" / "Cost of revenues" |
| `grossProfit` | Usually a stated subtotal |
| `operatingIncome` | "Operating income" or "Income from operations" — **see note below** |
| `interestExpenseNet` | "Interest expense, net" |
| `pretaxIncome` | "Income before income taxes" |
| `netIncome` | Bottom line attributable to the company |
| `epsBasic` / `epsDiluted` | Bottom of the statement |
| `weightedAvgSharesBasic/Diluted` | Bottom of the statement or the EPS note |

### If there is no operating income line

Some companies (Nike among them) run straight from gross profit through expense
lines to "Income before income taxes" without a labelled operating income
subtotal. In that case:

```
operatingIncome (EBIT) = pretaxIncome + interestExpenseNet
```

Set `operatingIncomeIsDerived: true` and write what you did in `derivationNote`.
Add back other non-operating items if they're material and clearly separated.

This is not a workaround to hide — it's exactly the judgment call that makes two
data vendors disagree, and you should be able to explain it.

---

## Step 3 — Depreciation and amortisation

**This is on the cash flow statement, not the income statement.** Operating
activities section, near the top, usually the first add-back to net income.

You need it because:

```
EBITDA (computed) = operatingIncome + depreciationAmortization
```

There is no EBITDA line in any 10-K and no EBITDA tag in XBRL. Every EBITDA you
have ever seen was computed by someone. Now it's computed by you.

---

## Step 4 — Balance sheet

| Field | Where |
|---|---|
| `cashAndEquivalents` | Current assets, first line |
| `shortTermInvestments` | Current assets, next line if present |
| `shortTermDebt` | Current liabilities: "Notes payable" + "Current portion of long-term debt" — sum them |
| `longTermDebt` | Non-current liabilities |
| `operatingLeaseLiabilitiesCurrent` | Current liabilities |
| `operatingLeaseLiabilitiesNoncurrent` | Non-current liabilities |
| `preferredStock` | Equity section — usually 0 |
| `noncontrollingInterest` | Equity section or just above it |
| `totalShareholdersEquity` | Equity section total |

**Record operating leases separately from debt.** Do not merge them. Whether
they count as debt is a policy choice your code will make explicitly and your
reconciliation layer will flag. Merging them now destroys that option.

---

## Step 5 — Market data

**Share price:** any public quote. Record the exact date. A price without a date
cannot be used, because market cap is a point-in-time figure.

**Shares outstanding:** the 10-K **cover page**, not the income statement. The
cover states something like "As of June 30, 2026, there were 60,142,338 shares
of common stock outstanding."

The distinction that matters:

| Figure | Source | Used for |
|---|---|---|
| Current shares outstanding | 10-K cover page | **Market capitalisation** |
| Weighted average diluted shares | Income statement | **EPS**, and therefore P/E via EPS |

They are different numbers measuring different things. Using the weighted
average for market cap is a common error that produces a market cap that is
wrong by however much the share count moved during the year — buybacks make this
material.

**If the company has multiple share classes** (Nike: Class A and Class B), the
cover page lists each separately. Sum them, and record the breakdown in
`sharesOutstandingNote`.

---

## Step 6 — Sanity check before you commit

Compute by hand, on a calculator:

```
market cap = sharePrice × sharesOutstanding
```

Compare against Google Finance or Yahoo for the same date. **If you are off by
more than 2%, stop and find out why.** In order of likelihood:

1. Missed a share class
2. Units error — thousands vs millions
3. Used weighted average shares instead of cover-page shares
4. Price date doesn't match the share count date

Then:

```
EV = market cap + total debt + preferred + minority interest − cash
```

Sanity-check the sign and magnitude. EV below market cap means net cash — true
for some software companies, suspicious for a footwear company with bonds
outstanding.

---

## Template

Copy to `data/demo/CROX.json` and fill in. `null` where genuinely unavailable.

```json
{
  "profile": {
    "cik": "0000000000",
    "ticker": "CROX",
    "name": "",
    "exchange": "NASDAQ",
    "sector": "Consumer Discretionary",
    "industry": "Textiles, Apparel & Luxury Goods",
    "subIndustry": "Footwear",
    "sicCode": null,
    "description": "",
    "headquarters": "",
    "fiscalYearEndMonth": 12,
    "isFinancial": false
  },
  "financials": [
    {
      "period": {
        "periodType": "FY",
        "fiscalYear": 0,
        "periodStart": null,
        "periodEnd": "",
        "currency": "USD"
      },
      "incomeStatement": {
        "revenue": null,
        "costOfRevenue": null,
        "grossProfit": null,
        "operatingIncome": null,
        "operatingIncomeIsDerived": false,
        "derivationNote": "",
        "depreciationAmortization": null,
        "interestExpenseNet": null,
        "pretaxIncome": null,
        "netIncome": null,
        "epsBasic": null,
        "epsDiluted": null,
        "weightedAvgSharesBasic": null,
        "weightedAvgSharesDiluted": null
      },
      "balanceSheet": {
        "cashAndEquivalents": null,
        "shortTermInvestments": null,
        "totalCurrentAssets": null,
        "totalAssets": null,
        "shortTermDebt": null,
        "longTermDebt": null,
        "operatingLeaseLiabilitiesCurrent": null,
        "operatingLeaseLiabilitiesNoncurrent": null,
        "preferredStock": null,
        "noncontrollingInterest": null,
        "totalShareholdersEquity": null
      },
      "source": {
        "kind": "SEC_EDGAR_10K",
        "documentUrl": "",
        "filingDate": "",
        "retrievedAt": "",
        "note": "Figures in millions USD as presented in the filing."
      }
    }
  ],
  "market": {
    "sharePrice": 0,
    "priceCurrency": "USD",
    "priceAsOf": "",
    "sharesOutstanding": 0,
    "sharesOutstandingAsOf": "",
    "sharesOutstandingNote": "",
    "source": {
      "kind": "MARKET_QUOTE",
      "documentUrl": null,
      "filingDate": null,
      "retrievedAt": "",
      "note": "Share count from 10-K cover page; price from public quote."
    }
  }
}
```

The `financials` array takes **two** entries — current fiscal year first, prior
year second.

---

## When you're done

You should be able to point at any number in any of the four files and name the
statement and the filing it came from. If you can't, that number isn't finished.
