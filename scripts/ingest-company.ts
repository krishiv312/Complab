/**
 * Ingests one or more tickers via the live SEC EDGAR + Finnhub pipeline and
 * writes them to data/companies/<TICKER>.json. Never touches data/demo/ - those
 * four files are the permanent, hand-verified ground truth.
 *
 * Usage: npx tsx scripts/ingest-company.ts NVDA AMD INTC ...
 */
import { writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { ingestCompany } from "../lib/data/ingest";
import { checkCompleteness, formatCompletenessReport, type CompletenessReport } from "../lib/data/completeness";

const OUT_DIR = join(process.cwd(), "data", "companies");

async function main() {
  const tickers = process.argv.slice(2);
  if (tickers.length === 0) {
    console.error("Usage: npx tsx scripts/ingest-company.ts TICKER [TICKER...]");
    process.exit(1);
  }

  if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });

  const results: { ticker: string; ok: boolean; detail: string }[] = [];
  const reports: CompletenessReport[] = [];

  for (const ticker of tickers) {
    process.stdout.write(`${ticker}... `);
    try {
      const result = await ingestCompany(ticker);
      if (result.ok) {
        writeFileSync(
          join(OUT_DIR, `${ticker}.json`),
          JSON.stringify(result.company, null, 2) + "\n",
          "utf8"
        );
        const warnStr = result.warnings.length ? ` (${result.warnings.length} warning(s))` : "";
        console.log(`OK${warnStr}`);
        results.push({ ticker, ok: true, detail: result.warnings.join("; ") });
        reports.push(checkCompleteness(result.company));
      } else {
        console.log(`SKIPPED: ${result.reason}`);
        results.push({ ticker, ok: false, detail: result.reason });
      }
    } catch (e) {
      console.log(`ERROR: ${(e as Error).message}`);
      results.push({ ticker, ok: false, detail: (e as Error).message });
    }
  }

  console.log("\n--- Summary ---");
  const ok = results.filter((r) => r.ok);
  const skipped = results.filter((r) => !r.ok);
  console.log(`${ok.length}/${results.length} ingested: ${ok.map((r) => r.ticker).join(", ") || "none"}`);
  if (skipped.length) {
    console.log(`${skipped.length} skipped:`);
    for (const s of skipped) console.log(`  ${s.ticker}: ${s.detail}`);
  }

  console.log("\n--- Data completeness ---");
  const withBlockingGaps = reports.filter((r) => r.currentYearBlockedMultiples.length > 0);
  for (const report of reports) {
    console.log(formatCompletenessReport(report));
  }
  if (withBlockingGaps.length > 0) {
    console.log(
      `\n${withBlockingGaps.length}/${reports.length} newly-ingested compan${withBlockingGaps.length === 1 ? "y has" : "ies have"} at least one multiple that will show N/A. ` +
        `See the gaps above - each names the exact missing field and which multiple it blocks, ` +
        `so a fix (a new tag fallback in lib/data/normalize.ts) can be targeted precisely instead of guessed at.`
    );
  }
}

main();
