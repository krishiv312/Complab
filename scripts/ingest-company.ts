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

const OUT_DIR = join(process.cwd(), "data", "companies");

async function main() {
  const tickers = process.argv.slice(2);
  if (tickers.length === 0) {
    console.error("Usage: npx tsx scripts/ingest-company.ts TICKER [TICKER...]");
    process.exit(1);
  }

  if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });

  const results: { ticker: string; ok: boolean; detail: string }[] = [];

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
}

main();
