# DATABASE_SCHEMA.md

**Version:** 0.1 — Week 1 design, implemented Week 3
**Target:** Postgres via Supabase

---

## Design principles

1. **Raw and calculated are never mixed.** Provider values land in statement tables untouched.
   Derived figures live in `calculated_metrics` with the formula version that produced them.
2. **Every fact carries provenance.** Source, period, currency, retrieval timestamp.
3. **Calculations are reproducible.** Given a snapshot of the raw tables and a `formula_version`,
   you can regenerate every derived number and get the same answer.
4. **`null` means unknown.** Never `0`. A missing figure and a zero figure are different facts, and
   conflating them is how fabricated data enters a system.
5. **One row per company.** `companies.cik` is unique; ticker changes do not create duplicates.

---

## Tables

### Reference

```sql
create table data_sources (
  id            serial primary key,
  name          text not null unique,     -- 'SEC_EDGAR', 'FINNHUB', 'DEMO'
  base_url      text,
  license_note  text,
  created_at    timestamptz default now()
);

create table companies (
  id            uuid primary key default gen_random_uuid(),
  cik           text unique not null,      -- 10-digit zero-padded, canonical key
  ticker        text not null,
  name          text not null,
  exchange      text,
  sector        text,
  industry      text,
  sub_industry  text,
  sic_code      text,
  country       text default 'US',
  currency      char(3) default 'USD',
  is_financial  boolean default false,     -- excluded from standard comps
  is_active     boolean default true,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);
create index on companies (upper(ticker));
```

### Financial data

```sql
create table financial_periods (
  id             uuid primary key default gen_random_uuid(),
  company_id     uuid not null references companies(id) on delete cascade,
  period_type    text not null check (period_type in ('FY','Q','LTM')),
  fiscal_year    int  not null,
  fiscal_quarter int,
  period_start   date,
  period_end     date not null,
  currency       char(3) not null,
  source_id      int  references data_sources(id),
  retrieved_at   timestamptz not null default now(),
  unique (company_id, period_type, fiscal_year, fiscal_quarter)
);

create table income_statements (
  period_id            uuid primary key references financial_periods(id) on delete cascade,
  revenue              numeric,
  cost_of_revenue      numeric,
  gross_profit         numeric,
  operating_income     numeric,   -- EBIT
  depreciation_amort   numeric,   -- from cash flow statement
  ebitda_computed      numeric,   -- operating_income + depreciation_amort
  interest_expense     numeric,
  pretax_income        numeric,
  net_income           numeric,
  eps_basic            numeric,
  eps_diluted          numeric,
  xbrl_tags_used       jsonb      -- {"revenue":"RevenueFromContractWith...", ...}
);

create table balance_sheets (
  period_id            uuid primary key references financial_periods(id) on delete cascade,
  cash_and_equivalents numeric,
  short_term_invest    numeric,
  total_current_assets numeric,
  total_assets         numeric,
  short_term_debt      numeric,
  long_term_debt       numeric,
  total_debt           numeric,
  preferred_stock      numeric,
  minority_interest    numeric,
  total_equity         numeric,
  book_value_equity    numeric,
  xbrl_tags_used       jsonb
);

create table market_data (
  id                  uuid primary key default gen_random_uuid(),
  company_id          uuid not null references companies(id) on delete cascade,
  share_price         numeric not null,
  price_currency      char(3) not null default 'USD',
  shares_basic        numeric,
  shares_diluted      numeric,
  market_cap          numeric,
  as_of               timestamptz not null,
  source_id           int references data_sources(id),
  retrieved_at        timestamptz not null default now()
);
create index on market_data (company_id, as_of desc);
```

### Derived

```sql
create table calculated_metrics (
  id               uuid primary key default gen_random_uuid(),
  company_id       uuid not null references companies(id) on delete cascade,
  period_id        uuid references financial_periods(id),
  market_data_id   uuid references market_data(id),
  metric_key       text not null,     -- 'ev_ebitda', 'net_margin', ...
  value            numeric,           -- null when N/A
  is_meaningful    boolean default true,  -- false renders as N/M
  note             text,              -- 'negative EBITDA'
  formula_version  text not null,     -- 'v1.0.0'
  calculated_at    timestamptz default now(),
  unique (company_id, period_id, market_data_id, metric_key, formula_version)
);
```

### User work

```sql
-- users comes from Supabase auth.users; do not duplicate it

create table peer_groups (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references auth.users(id) on delete cascade,
  company_id   uuid not null references companies(id),
  name         text not null,
  is_system    boolean default false,  -- true = the algorithm's suggestion
  created_at   timestamptz default now()
);

create table peer_group_members (
  peer_group_id  uuid references peer_groups(id) on delete cascade,
  company_id     uuid references companies(id),
  score          numeric,       -- 0–100 from the scoring rubric
  rationale      text,
  added_manually boolean default false,
  primary key (peer_group_id, company_id)
);

create table saved_analyses (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid references auth.users(id) on delete cascade,
  company_id     uuid not null references companies(id),
  peer_group_id  uuid references peer_groups(id),
  name           text not null,
  snapshot       jsonb not null,   -- full computed state, so it reopens identically
  created_at     timestamptz default now(),
  updated_at     timestamptz default now()
);

create table generated_commentary (
  id                uuid primary key default gen_random_uuid(),
  saved_analysis_id uuid references saved_analyses(id) on delete cascade,
  section           text not null,      -- 'overview','valuation','risks'
  model             text not null,
  prompt_version    text not null,
  content           text not null,
  edited_content    text,               -- user's version, if edited
  input_digest      text,               -- hash of figures sent to the model
  created_at        timestamptz default now()
);

create table pitchbooks (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid references auth.users(id) on delete cascade,
  saved_analysis_id uuid references saved_analyses(id),
  title             text not null,
  subtitle          text,
  template_key      text default 'default',
  included_slides   jsonb,
  file_path         text,
  created_at        timestamptz default now()
);

create table feedback (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete set null,
  category    text,               -- 'bug','feature','confusion','other'
  message     text not null,
  page_url    text,
  created_at  timestamptz default now()
);
```

---

## Two design notes worth being able to explain

**Why `snapshot jsonb` on `saved_analyses`.** Share prices move. If a user saves an analysis on
Monday and reopens it on Friday, they should see Monday's analysis, not a silently different one.
The snapshot freezes the computed state. A "refresh with current data" button recomputes explicitly,
as a user action.

**Why `formula_version` on `calculated_metrics`.** If you fix a bug in the EV formula, previously
stored values were produced by the old formula. Versioning lets you identify what needs recomputing
instead of leaving inconsistent numbers in the table. This is how you avoid the situation where two
users see different valuations for the same company and neither of you can work out why.

---

## Row-level security (Week 3)

`peer_groups`, `saved_analyses`, `pitchbooks`, and `generated_commentary` are user-scoped: RLS
policy `user_id = auth.uid()` on select, insert, update, delete.
`companies`, `financial_periods`, `income_statements`, `balance_sheets`, `market_data`, and
`calculated_metrics` are public-read, service-role-write.
