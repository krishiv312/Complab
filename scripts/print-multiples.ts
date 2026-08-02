import crox from "../data/demo/CROX.json";
import deck from "../data/demo/DECK.json";
import skx from "../data/demo/SKX.json";
import nke from "../data/demo/NKE.json";
import type { DemoCompany, MetricResult } from "../lib/finance/types";
import {
  calculateMarketCap,
  calculateEnterpriseValue,
  calculateEBITDA,
  calculateEVRevenue,
  calculateEVEBITDA,
  calculateEVEBIT,
  calculatePE,
  calculatePB,
  calculateMargins,
  calculateRevenueGrowth,
} from "../lib/finance/multiples";

const companies = [crox, deck, skx, nke] as unknown as DemoCompany[];

function fmt(result: MetricResult, suffix = ""): string {
  if (result.value === null) return "N/A";
  if (!result.meaningful) return `N/M (${result.value.toFixed(2)}${suffix})`;
  return `${result.value.toFixed(2)}${suffix}`;
}

function fmtPct(result: MetricResult): string {
  if (result.value === null) return "N/A";
  const pct = (result.value * 100).toFixed(1);
  return result.meaningful ? `${pct}%` : `N/M (${pct}%)`;
}

for (const company of companies) {
  const [current, prior] = company.financials;
  const { incomeStatement: is, balanceSheet: bs } = current;

  const marketCap = calculateMarketCap(
    company.market.sharePrice,
    company.market.sharesOutstanding
  );

  const totalDebt =
    bs.shortTermDebt !== null && bs.longTermDebt !== null
      ? bs.shortTermDebt + bs.longTermDebt
      : null;

  const ev = calculateEnterpriseValue(
    marketCap.value,
    totalDebt,
    bs.preferredStock,
    bs.noncontrollingInterest,
    bs.cashAndEquivalents
  );

  const ebitda = calculateEBITDA(is.operatingIncome, is.depreciationAmortization);

  const margins = calculateMargins(is.revenue, ebitda.value, is.operatingIncome, is.netIncome);

  const growth = calculateRevenueGrowth(is.revenue, prior.incomeStatement.revenue);

  console.log(`\n=== ${company.profile.ticker} — ${company.profile.name} (FY${current.period.fiscalYear}) ===`);
  console.log(`Market cap:     ${fmt(marketCap, "M")}`);
  console.log(`Total debt:     ${totalDebt !== null ? totalDebt.toFixed(2) + "M" : "N/A"}`);
  console.log(`EV:             ${fmt(ev, "M")}`);
  console.log(`EBITDA:         ${fmt(ebitda, "M")}`);
  console.log(`EV/Revenue:     ${fmt(calculateEVRevenue(ev.value, is.revenue), "x")}`);
  console.log(`EV/EBITDA:      ${fmt(calculateEVEBITDA(ev.value, ebitda.value), "x")}`);
  console.log(`EV/EBIT:        ${fmt(calculateEVEBIT(ev.value, is.operatingIncome), "x")}`);
  console.log(`P/E:            ${fmt(calculatePE(company.market.sharePrice, is.epsDiluted), "x")}`);
  console.log(`P/B:            ${fmt(calculatePB(marketCap.value, bs.totalShareholdersEquity), "x")}`);
  console.log(`EBITDA margin:  ${fmtPct(margins.ebitdaMargin)}`);
  console.log(`EBIT margin:    ${fmtPct(margins.ebitMargin)}`);
  console.log(`Net margin:     ${fmtPct(margins.netMargin)}`);
  console.log(`Revenue growth: ${fmtPct(growth)}`);
}
