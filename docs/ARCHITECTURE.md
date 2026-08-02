# ARCHITECTURE.md

**Version:** 0.1 — Week 1

---

## 1. The three options considered

| | **A. Single Next.js app** | **B. Next.js + separate Python API** | **C. Next.js + Python + job queue** |
|---|---|---|---|
| Languages | TypeScript only | TypeScript + Python | TypeScript + Python |
| Services to deploy | 1 (Vercel) | 2 (Vercel + Railway/Render) | 3+ (add Redis/worker) |
| Debugging surface | One stack trace | Two, plus network between them | Three, plus async failures |
| PowerPoint generation | PptxGenJS (Node) | python-pptx | python-pptx in worker |
| Time to first deploy | ~1 day | ~4 days | ~1 week |
| Fits a beginner | Yes | Marginal | No |
| Handles MVP load | Yes | Yes | Yes (overkill) |

**Chosen: Option A.**

Option B is only justified if you need pandas/numpy for something TypeScript genuinely cannot do.
Comps maths is arithmetic, median, and quartiles — roughly 200 lines of TypeScript. PptxGenJS
generates .pptx in Node. There is no technical reason to add a second language, and a second
language doubles the number of things that can break while you are still learning the first.

**Revisit this decision if** you later add a DCF with Monte Carlo simulation, or backtesting across
thousands of tickers. Neither is in scope.

---

## 2. The stack

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js 15 (App Router) | Frontend + backend in one project; Vercel deploys it in one click |
| Language | TypeScript (strict mode) | Catches unit/type errors in financial code before runtime |
| Styling | Tailwind CSS | No separate CSS files to manage |
| Components | shadcn/ui | Copied into your repo, so you can read and edit every component |
| Charts | Recharts | React-native API, good defaults, exportable to PNG for the deck |
| Tables | TanStack Table | Sorting and column visibility without writing it yourself |
| Validation | Zod | Validates external API responses before they touch your calculations |
| Tests | Vitest | Fast, zero-config with TypeScript |
| Deck export | PptxGenJS | Pure Node, generates real editable .pptx |
| Database | Supabase (Postgres) | Free tier, hosted, includes auth. **Added in Week 3, not Week 1.** |
| Auth | Supabase Auth (email magic link) | No password handling of your own |
| AI | Anthropic Messages API behind a provider interface | Swappable; see §5 |
| Hosting | Vercel | Free hobby tier, git-push deploys |

---

## 3. Data flow

```
User types "NKE"
        │
        ▼
┌───────────────────────────────────────────────┐
│  /app/company/[ticker]/page.tsx  (server)     │
└───────────────┬───────────────────────────────┘
                │
                ▼
      ┌──────────────────────┐
      │  lib/data/resolver   │  ── ticker → CIK → cached? ──┐
      └──────────┬───────────┘                              │
                 │ cache miss                               │ cache hit
                 ▼                                          │
   ┌─────────────────────────────────┐                      │
   │ SEC EDGAR companyfacts (XBRL)   │  fundamentals        │
   │ Finnhub quote + profile         │  price, shares       │
   │ demo/*.json                     │  fallback / demo mode│
   └──────────────┬──────────────────┘                      │
                  ▼                                         │
      ┌──────────────────────────┐                          │
      │ lib/data/normalize.ts    │  raw tags → canonical    │
      │ + Zod schema validation  │  fields, or null         │
      └──────────┬───────────────┘                          │
                 ▼                                          │
      ┌──────────────────────────┐  ◄───────────────────────┘
      │ lib/finance/*.ts         │  DETERMINISTIC ONLY
      │  multiples · stats ·     │  no AI, no network
      │  valuation · peers       │  100% test coverage
      └──────────┬───────────────┘
                 ▼
      ┌──────────────────────────┐
      │ React UI: profile ·      │
      │ comps table · charts     │
      └──────────┬───────────────┘
                 │  (numbers already final)
                 ▼
      ┌──────────────────────────┐      ┌────────────────────┐
      │ /api/commentary          │─────▶│ Anthropic API      │
      │ sends computed figures   │      │ writes prose only  │
      └──────────────────────────┘      └────────────────────┘
                 │
                 ▼
      ┌──────────────────────────┐
      │ /api/pitchbook → .pptx   │
      └──────────────────────────┘
```

**The single most important rule in this diagram:** the arrow to the Anthropic API happens *after*
all numbers are final. The model receives computed figures and writes sentences about them. It never
sits upstream of a number that a user will see.

---

## 4. Directory layout

```
complab/
├── app/
│   ├── page.tsx                     # landing
│   ├── search/page.tsx
│   ├── company/[ticker]/page.tsx    # profile + financials
│   ├── analysis/[ticker]/page.tsx   # comps table, charts, valuation
│   └── api/
│       ├── search/route.ts
│       ├── commentary/route.ts
│       └── pitchbook/route.ts
├── lib/
│   ├── finance/                     # ← pure functions, no I/O, fully tested
│   │   ├── multiples.ts
│   │   ├── statistics.ts
│   │   ├── valuation.ts
│   │   ├── peers.ts
│   │   └── types.ts
│   ├── data/
│   │   ├── edgar.ts                 # SEC client
│   │   ├── market.ts                # price/shares client
│   │   ├── normalize.ts             # XBRL tags → canonical fields
│   │   ├── schema.ts                # Zod
│   │   └── cache.ts
│   ├── ai/
│   │   ├── provider.ts              # interface
│   │   ├── anthropic.ts             # implementation
│   │   └── prompts.ts
│   └── pptx/
│       ├── generate.ts
│       └── theme.ts
├── components/
│   ├── ui/                          # shadcn
│   ├── company/
│   ├── comps/
│   └── charts/
├── data/demo/                       # verified seed JSON
├── tests/finance/                   # Vitest
├── docs/                            # these markdown files
└── supabase/migrations/             # from Week 3
```

**Why `lib/finance` is separated from everything else:** it has no imports from React, no network
calls, and no environment variables. That means it can be tested in milliseconds, it can be read and
verified by a person who does not know Next.js, and its correctness does not depend on any external
service being up. This is the part of the codebase you must be able to explain line by line.

---

## 5. The AI provider abstraction

```ts
// lib/ai/provider.ts
export interface AIProvider {
  generateCommentary(input: CommentaryInput): Promise<CommentaryOutput>;
}
```

Every AI call in the app goes through this interface. `lib/ai/anthropic.ts` implements it. If the
Anthropic API is down, or you switch providers, or you want a deterministic stub for tests, you
replace one file. Nothing else in the app knows which model produced the text.

The commentary route is designed to fail open: if the AI call errors, the page still renders every
number, chart, and table, with a small notice that commentary is unavailable. The analysis is never
blocked on the model.

---

## 6. Environment variables

```
SEC_USER_AGENT="CompLab/0.1 (krishiv@example.com)"   # required by SEC
FINNHUB_API_KEY=                                     # market data
ANTHROPIC_API_KEY=                                   # server-side only, never NEXT_PUBLIC_
NEXT_PUBLIC_SUPABASE_URL=                            # from Week 3
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=                           # server-side only
```

Rules: `.env.local` is in `.gitignore` from commit one. Only variables prefixed `NEXT_PUBLIC_` reach
the browser — anything else there would be publicly readable. `.env.example` is committed with empty
values so the setup is reproducible.
