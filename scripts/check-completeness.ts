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
import { listDemoTickers, getDemoCompany, isHandVerified } from "../lib/data/demo";
import { checkCompleteness, formatCompletenessReport } from "../lib/data/completeness";

function main() {
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
