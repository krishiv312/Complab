import type { DemoCompany } from "../finance/types";
import crox from "../../data/demo/CROX.json";
import deck from "../../data/demo/DECK.json";
import skx from "../../data/demo/SKX.json";
import nke from "../../data/demo/NKE.json";

const DEMO_COMPANIES: Record<string, DemoCompany> = {
  CROX: crox as unknown as DemoCompany,
  DECK: deck as unknown as DemoCompany,
  SKX: skx as unknown as DemoCompany,
  NKE: nke as unknown as DemoCompany,
};

export function getDemoCompany(ticker: string): DemoCompany | null {
  return DEMO_COMPANIES[ticker.toUpperCase()] ?? null;
}

export function listDemoTickers(): string[] {
  return Object.keys(DEMO_COMPANIES);
}

export interface DemoCompanySummary {
  ticker: string;
  name: string;
}

export function listDemoCompanySummaries(): DemoCompanySummary[] {
  return Object.values(DEMO_COMPANIES).map((company) => ({
    ticker: company.profile.ticker,
    name: company.profile.name,
  }));
}

/** Matches by ticker prefix or a substring of the company name, case-insensitive. */
export function searchDemoCompanies(query: string): DemoCompanySummary[] {
  const q = query.trim().toLowerCase();
  const all = listDemoCompanySummaries();
  if (!q) return all;
  return all.filter(
    (c) => c.ticker.toLowerCase().includes(q) || c.name.toLowerCase().includes(q)
  );
}
