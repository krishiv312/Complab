# WEEK1_PLAN.md

**Goal for the week:** an app running locally and deployed publicly, showing a Nike company page
built from hand-verified data, with every valuation multiple computed by tested code.

No live API. No AI. No database. Those come later, and they come later on purpose.

---

## Day 1 (today) — Environment and first commit
**Time: 2–3 hours**

- [ ] Install Node.js 22 LTS, Git, VS Code
- [ ] Create a GitHub account and a private repo `complab`
- [ ] Install Claude Code and authenticate with your Pro subscription
- [ ] Scaffold the Next.js app, confirm it runs at `localhost:3000`
- [ ] Commit and push
- [ ] Add the `docs/` folder with the Week 1 documents

**Done when:** you can edit text on the homepage, save, and see it change in the browser.

---

## Day 2 — Verified seed data
**Time: 2–3 hours. Mostly finance, not code.**

- [ ] Open Nike's latest 10-K on EDGAR
- [ ] Hand-record into a spreadsheet: revenue, operating income, D&A, net income, diluted EPS, cash,
      short- and long-term debt, total equity, diluted shares — for the last two fiscal years
- [ ] Record share price and date from any public quote
- [ ] Repeat for 3 peers: SKX, DECK, CROX
- [ ] Convert to `data/demo/*.json`, one file per company, with a `source` and `retrieved_at` field

**Done when:** four JSON files exist and you could point at any number and name the page of the 10-K
it came from.

This day feels slow and is the most important day of the week. Every test you write for the next
seven weeks checks against these numbers.

---

## Day 3 — The calculation library
**Time: 3–4 hours**

- [ ] `lib/finance/types.ts` — the canonical financial shape
- [ ] `lib/finance/multiples.ts` — market cap, EV, EV/Rev, EV/EBITDA, EV/EBIT, P/E, P/B, margins, growth
- [ ] Every function returns `{ value: number | null, meaningful: boolean, note?: string }`
- [ ] Handle: negative EBITDA, negative earnings, zero denominator, null inputs

**Done when:** the functions exist and are typed. Not when they are proven — that's tomorrow.

---

## Day 4 — Tests
**Time: 2–3 hours**

- [ ] Install Vitest
- [ ] Compute Nike's EV and EV/EBITDA by hand, in a calculator, and write it down
- [ ] Write tests asserting the code produces your hand-computed values
- [ ] Write edge-case tests: negative EBITDA → `N/M`, missing revenue → `null`, zero denominator → `null`
- [ ] `npm test` green

**Done when:** tests pass and you have found at least one bug. If you found none, your tests are too
gentle — add a company with negative net income.

---

## Day 5 — The company page
**Time: 3–4 hours**

- [ ] Install Tailwind and shadcn/ui
- [ ] `/app/company/[ticker]/page.tsx` reading from `data/demo/`
- [ ] Header: name, ticker, exchange, sector, industry
- [ ] Financial summary cards: revenue, EBITDA, margins, net income
- [ ] Valuation cards: market cap, EV, EV/Rev, EV/EBITDA, P/E
- [ ] Every card block shows: source · period · currency · retrieved date
- [ ] `N/A` and `N/M` render distinctly and visibly

**Done when:** `localhost:3000/company/NKE` shows a page you would not be embarrassed to screenshot.

---

## Day 6 — Search and landing
**Time: 2–3 hours**

- [ ] Landing page: what it does, who it's for, disclaimer, link to the demo company
- [ ] Search box with autocomplete over the seed companies
- [ ] Unknown ticker → a helpful message listing what is available, not a crash

**Done when:** you can type "nike" and land on the company page.

---

## Day 7 — Deploy and write up
**Time: 2 hours**

- [ ] Push to GitHub, import to Vercel, deploy
- [ ] Confirm the live URL works on your phone
- [ ] Write `BUILD_LOG.md` entry 1: what you built, what broke, what you learned
- [ ] Write `README.md`: what it is, how to run it, disclaimer
- [ ] Send the link to one friend and watch them use it without helping

**Done when:** a public URL exists that a stranger can open.

---

## Checkpoint questions

Before starting Week 2, answer these out loud without looking anything up. They are the actual
learning objective of the week, and they are also interview questions.

1. What is enterprise value, and why do you subtract cash?
2. Why is EV/EBITDA usually more comparable across companies than P/E?
3. Where do the numbers on your Nike page physically come from?
4. What happens in your code when a company has negative EBITDA, and why?
5. Which files would you open first to change how EV is calculated?

If you cannot answer any one of these, spend an extra day on it. The schedule can absorb a day. It
cannot absorb you not understanding your own product in Week 8.
