# PRODUCT_BRIEF.md

**Working name:** CompLab
**Owner:** Krishiv Sharma
**Version:** 0.1 — Week 1
**Status:** Draft, to be revised after first user interviews (Week 3)

---

## 1. The problem

Building a comparable-companies ("comps") analysis is one of the most common tasks in finance
education and junior banking work. Done manually, it takes 2–6 hours:

| Step | Manual effort | Where it goes wrong |
|---|---|---|
| Find peers | 30–60 min | Ad hoc; hard to justify choices |
| Pull financials | 60–120 min | Copy-paste errors from filings |
| Normalise periods | 30 min | Mixing FY and LTM figures |
| Calculate multiples | 30 min | Spreadsheet formula errors |
| Build charts | 30–60 min | Formatting time, not analysis time |
| Write commentary | 30–60 min | Blank-page problem |

Professional tools that automate this (Bloomberg, Capital IQ, FactSet) cost thousands of dollars
per seat per year and are not available to students, school and university finance clubs, or very
small research teams.

The result: the people who most need to *learn* the workflow spend their time on mechanical data
entry rather than on judgement — which peers are actually comparable, and why does this company
trade where it does.

## 2. Who this is for

**Primary (launch users):**
1. Finance and economics students building comps for coursework, clubs, or interview prep
2. University investment-banking / investment-club members preparing pitches
3. Students preparing for finance interviews and case competitions

**Secondary (later):**
4. Search-fund interns and independent acquisition entrepreneurs
5. Small investment or research teams
6. Boutique advisory firms — only once reliability is proven

Students are the launch segment because they are reachable, tolerant of an early product, generate
useful feedback, and carry far lower legal and reputational risk than selling to financial
institutions.

## 3. What we are building

**Stage 1 — Comparable Companies Platform.**
A web application where a user searches a US-listed public company and receives: a company profile,
normalised financial data, a transparently-scored suggested peer group they can edit, a comps table
with quartile statistics, an implied valuation range, and a small set of clear charts. Every figure
carries a source, reporting period, currency, and retrieval date.

**Stage 2 — Pitchbook Generator.**
A "Generate Pitchbook" action that turns the Stage 1 analysis into an 8–12 slide editable PowerPoint
deck, using the same data and calculations.

## 4. Value proposition

> Turn a ticker into a defensible, sourced comparable-companies analysis in under five minutes —
> and into a presentation-ready deck in one more click.

Three things make it different from a spreadsheet template or a generic AI chatbot:

1. **Deterministic maths.** Every multiple is computed in tested TypeScript, never by a language
   model. The AI writes commentary about numbers; it never produces numbers.
2. **Transparent peer selection.** The scoring rubric is visible and editable, so a user can defend
   the peer set in an interview or a classroom.
3. **Provenance on everything.** Source, period, currency, retrieval date on every figure. Missing
   data shows `N/A`; non-meaningful multiples show `N/M`. Nothing is invented.

## 5. What this is explicitly not

- Not a Bloomberg / Capital IQ / FactSet replacement
- Not a real-time trading terminal
- Not a source of investment advice or price targets
- Not a private-company valuation tool
- Not a substitute for professional judgement

All outputs carry an educational-and-research-use disclaimer.

## 6. Success criteria for the 8-week build

**Technical:** deployed and publicly reachable; core calculations covered by tests against
hand-verified examples; works for at least 15 companies across 3 industries; degrades safely when a
data source fails; exports a valid .pptx.

**User:** at least 10 beta testers complete an analysis unaided; testers can explain why a peer was
included; at least 3 testers return for a second session.

**Educational:** the owner can explain, without notes, the finance formulas, the architecture, the
data limitations, and which parts were built with AI assistance.

## 7. Open questions (to validate, not assume)

- Do students actually want the *deck*, or is the comps table the real value?
- Is manual peer editing used, or do users accept the default set?
- Does SEC EDGAR data quality hold up across enough companies to be credible?
- Would anyone pay, and for which unit — per export, per month, or per club?

---

*This document is for research and educational purposes and does not constitute investment advice.*
