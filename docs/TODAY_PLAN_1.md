# TODAY_PLAN.md — Combined Day 2 + Day 3

**Goal:** four hand-verified companies in `data/demo/`, and a tested calculation
library that turns them into valuation multiples.

**Time:** ~5 hours. Take a real break after Block D.

**Sequence rule:** one company → build the library → then the other three.
Not all four companies, then the code. If the type shape turns out to be wrong,
you rewrite one JSON file instead of four.

---

## BLOCK 0 — Close the repo gaps · 15 min

- [ ] Save `SEED_DATA_GUIDE.md` into `docs/`
- [ ] Save `types.ts` into `lib/finance/types.ts` — **not** into `docs/`, it's code
- [ ] `mkdir -p lib/finance data/demo`
- [ ] Stop tracking macOS junk:
      ```bash
      echo ".DS_Store" >> .gitignore
      git rm --cached .DS_Store docs/.DS_Store
      ```
- [ ] Create `.env.example`:
      ```bash
      cat > .env.example <<'EOF'
      SEC_USER_AGENT="CompLab/0.1 (your@email.com)"
      FINNHUB_API_KEY=
      ANTHROPIC_API_KEY=
      EOF
      ```
- [ ] Confirm `.env*` appears in `.gitignore`
- [ ] `git add -A && git commit -m "Add finance types, seed guide, env template"`

**Done when:** `lib/finance/types.ts` exists and `git status` is clean.

---

## BLOCK A — Transcribe Crocs · 50 min

Follow `docs/SEED_DATA_GUIDE.md`. Output: `data/demo/CROX.json`, two fiscal years.

- [ ] Find the latest CROX 10-K on EDGAR, note CIK and filing date
- [ ] **Write down the units line** above each statement before copying anything
- [ ] Income statement, both years
- [ ] D&A from the **cash flow statement** — it is not on the income statement
- [ ] Balance sheet, both years, operating leases recorded separately from debt
- [ ] Share price with its date
- [ ] Shares outstanding from the **10-K cover page**, not the income statement

**Do not let any AI generate these numbers, including me.** I'd produce something
plausible and some of it would be subtly wrong. The entire credibility claim of
this product is that figures trace to filings. That has to be true starting here.

**Done when:** you can point at any number in the file and name the statement it
came from.

---

## BLOCK B — Prove it by hand · 30 min ⟵ CHECKPOINT

On a calculator, on paper:

- [ ] `market cap = share price × shares outstanding`
- [ ] Compare against Google Finance for the same date
- [ ] `EV = market cap + total debt + preferred + minority interest − cash`
- [ ] `EBITDA = operating income + D&A`
- [ ] Write all four numbers down — these become your test fixtures

> **STOP RULE.** If market cap is more than 2% off, fix it before writing any
> code. Causes, in order of likelihood: missed share class · units error
> (thousands vs millions) · used weighted-average shares instead of cover-page
> shares · price date doesn't match share count date.

- [ ] **Paste `CROX.json` into the chat before continuing.**

---

## BLOCK C — `lib/finance/multiples.ts`, part 1 · 60 min

Built together in chat, function by function, with the reasoning — not dumped.

- [ ] `safeDivide()` → returns `MetricResult`, handles null and zero denominators
- [ ] `calculateMarketCap()`
- [ ] `calculateEnterpriseValue()`
- [ ] `calculateEBITDA()` — operating income + D&A, labelled as computed

The design decision that lands here: what should EV/EBITDA return when EBITDA is
negative? Not a negative multiple — that number is meaningless and actively
misleading. This is the `N/M` logic, and it's a good interview answer.

---

## BLOCK D — Tests · 45 min ⟵ CHECKPOINT

- [ ] `npm install -D vitest`
- [ ] Add `"test": "vitest"` to `package.json` scripts
- [ ] `tests/finance/multiples.test.ts`
- [ ] Assert the code reproduces your Block B hand-computed numbers
- [ ] Edge cases: negative EBITDA → `N/M` · negative earnings → `N/M` ·
      null revenue → `N/A` · zero denominator → `N/A` · no debt · cash > debt
- [ ] `npm test` green

Expect to find a bug. If everything passes first time, the tests are too gentle
— add a company with negative net income.

- [ ] **Paste the test output into the chat.**

### ☕ Break here. Transcription errors cluster in the fourth hour.

---

## BLOCK E — The other three · 60 min

Much faster now. The shape is proven and you know where everything lives.

- [ ] `data/demo/DECK.json` — Deckers
- [ ] `data/demo/SKX.json` — Skechers
- [ ] `data/demo/NKE.json` — Nike, **last**

Nike is the awkward one, deliberately saved for when this is muscle memory:
dual share class (sum Class A and Class B from the cover page), May fiscal year
end, and no operating income subtotal — derive EBIT as pretax income + net
interest expense, set `operatingIncomeIsDerived: true`, and explain it in
`derivationNote`.

- [ ] Run the Block B sanity check on each one

---

## BLOCK F — Ratios, and run everything · 45 min

- [ ] `calculateEVRevenue()`, `calculateEVEBITDA()`, `calculateEVEBIT()`
- [ ] `calculatePE()`, `calculatePB()`
- [ ] `calculateMargins()` — EBITDA, EBIT, net
- [ ] `calculateRevenueGrowth()`
- [ ] Extend tests to cover all four companies
- [ ] Write a scratch script that prints every multiple for all four
- [ ] **Eyeball the output.** Numbers that look wrong usually are.

**Done when:** four companies produce a full set of multiples, all tests pass,
and nothing in the output surprises you.

---

## End-of-day check

Answer out loud, without looking:

1. Why do you subtract cash in enterprise value?
2. Why is EV/EBITDA more comparable across companies than P/E?
3. Which two share counts did you record, and what is each used for?
4. What does your code do when EBITDA is negative, and why not just show the
   negative number?

If any answer doesn't come, that's the thing to revisit tomorrow — not more
features.
