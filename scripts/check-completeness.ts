/**
 * Audits every company currently in the dataset (hand-verified and
 * auto-ingested alike) for gaps that block a displayed multiple, without
 * re-ingesting anything. Run this any time - after adding companies, after
 * a normalize.ts tag-list change, or just periodically - to see the current
 * state of the whole dataset at a glance.
 *
 * Usage: npx tsx scripts/check-completeness.ts [TICKER...]
 *   (no args = check every company in the dataset)
 */
import { readdirSync } from "node:fs";
import { join } from "node:path";
import { listDemoTickers, getDemoCompany, isHandVerified } from "../lib/data/demo";
import { checkCompleteness, formatCompletenessReport } from "../lib/data/completeness";

/**
 * data/companies/ files are only picked up once lib/data/demo.ts has an
 * explicit import + registry entry for them (see that file's own comment) -
 * a file can sit on disk, fully valid, and simply never appear on the site.
 * Checked here (not just right after ingestion) so it's caught even for
 * files that were added in an earlier session.
 */
function checkUnregisteredFiles(): string[] {
  const dir = join(process.cwd(), "data", "companies");
  const registered = new Set(listDemoTickers());
  return readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .map((f) => f.replace(/\.json$/, ""))
    .filter((ticker) => !registered.has(ticker));
}

function main() {
  const unregistered = checkUnregisteredFiles();
  if (unregistered.length > 0) {
    console.log(
      `⚠ ${unregistered.length} file(s) in data/companies/ are not registered in lib/data/demo.ts and won't appear on the site: ${unregistered.join(", ")}\n`
    );
  }

  const requested = process.argv.slice(2).map((t) => t.toUpperCase());
  const tickers = requested.length > 0 ? requested : listDemoTickers();

  console.log(`Checking ${tickers.length} company/companies...\n`);

  let totalBlocking = 0;
  for (const ticker of tickers) {
    const company = getDemoCompany(ticker);
    if (!company) {
      console.log(`  ${ticker}: not found in dataset`);
      continue;
    }
    const report = checkCompleteness(company);
    const tag = isHandVerified(ticker) ? "[hand-verified]" : "[auto-ingested]";
    console.log(`${tag} ${formatCompletenessReport(report)}`);
    if (report.currentYearBlockedMultiples.length > 0) totalBlocking++;
  }

  console.log(`\n--- Summary ---`);
  console.log(`${totalBlocking}/${tickers.length} companies have at least one multiple showing N/A due to a data gap.`);
}

main();
