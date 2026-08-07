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
import { getDemoCompany } from "../lib/data/demo";

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

  // lib/data/demo.ts registers companies via explicit, hand-added static
  // imports (deliberately, not a directory scan - see that file's own
  // comment) - a file can land in data/companies/ without ever being wired
  // up to actually appear on the site. That's a silent, easy-to-miss failure
  // mode distinct from a data-completeness gap, so it gets its own loud check
  // rather than being buried in the report above.
  const unregistered = ok.filter((r) => getDemoCompany(r.ticker) === null);
  if (unregistered.length > 0) {
    console.log(
      `\n⚠ ${unregistered.length} compan${unregistered.length === 1 ? "y was" : "ies were"} ingested to data/companies/ ` +
        `but ${unregistered.length === 1 ? "is" : "are"} NOT yet registered in lib/data/demo.ts, so ${unregistered.length === 1 ? "it won't" : "they won't"} appear on the site: ` +
        `${unregistered.map((r) => r.ticker).join(", ")}. Add an import + registry entry for each in lib/data/demo.ts.`
    );
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
