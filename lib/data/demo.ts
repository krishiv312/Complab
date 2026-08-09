import type { DemoCompany } from "../finance/types";

// The four permanently hand-verified companies - data/demo/*.json is never
// touched by the ingestion pipeline (see docs/DECISIONS.md D-004).
import crox from "../../data/demo/CROX.json";
import deck from "../../data/demo/DECK.json";
import skx from "../../data/demo/SKX.json";
import nke from "../../data/demo/NKE.json";

// Auto-ingested via lib/data/ingest.ts (scripts/ingest-company.ts). Each import
// added by hand as new companies are ingested - same pattern as the hand-verified
// set above.
import vfc from "../../data/companies/VFC.json";
import lulu from "../../data/companies/LULU.json";
import nvda from "../../data/companies/NVDA.json";
import amd from "../../data/companies/AMD.json";
import intc from "../../data/companies/INTC.json";
import txn from "../../data/companies/TXN.json";
import avgo from "../../data/companies/AVGO.json";
import qcom from "../../data/companies/QCOM.json";
import mu from "../../data/companies/MU.json";
import adi from "../../data/companies/ADI.json";
import crm from "../../data/companies/CRM.json";
import adbe from "../../data/companies/ADBE.json";
import now from "../../data/companies/NOW.json";
import intu from "../../data/companies/INTU.json";
import orcl from "../../data/companies/ORCL.json";
import ko from "../../data/companies/KO.json";
import pep from "../../data/companies/PEP.json";
import gis from "../../data/companies/GIS.json";
import mdlz from "../../data/companies/MDLZ.json";
import khc from "../../data/companies/KHC.json";

const HAND_VERIFIED: Record<string, DemoCompany> = {
  CROX: crox as unknown as DemoCompany,
  DECK: deck as unknown as DemoCompany,
  SKX: skx as unknown as DemoCompany,
  NKE: nke as unknown as DemoCompany,
};

const AUTO_INGESTED: Record<string, DemoCompany> = {
  VFC: vfc as unknown as DemoCompany,
  LULU: lulu as unknown as DemoCompany,
  NVDA: nvda as unknown as DemoCompany,
  AMD: amd as unknown as DemoCompany,
  INTC: intc as unknown as DemoCompany,
  TXN: txn as unknown as DemoCompany,
  AVGO: avgo as unknown as DemoCompany,
  QCOM: qcom as unknown as DemoCompany,
  MU: mu as unknown as DemoCompany,
  ADI: adi as unknown as DemoCompany,
  CRM: crm as unknown as DemoCompany,
  ADBE: adbe as unknown as DemoCompany,
  NOW: now as unknown as DemoCompany,
  INTU: intu as unknown as DemoCompany,
  ORCL: orcl as unknown as DemoCompany,
  KO: ko as unknown as DemoCompany,
  PEP: pep as unknown as DemoCompany,
  GIS: gis as unknown as DemoCompany,
  MDLZ: mdlz as unknown as DemoCompany,
  KHC: khc as unknown as DemoCompany,
};

const ALL_COMPANIES: Record<string, DemoCompany> = { ...HAND_VERIFIED, ...AUTO_INGESTED };

export function getDemoCompany(ticker: string): DemoCompany | null {
  return ALL_COMPANIES[ticker.toUpperCase()] ?? null;
}

export function listDemoTickers(): string[] {
  return Object.keys(ALL_COMPANIES);
}

/** Full company records for every ticker - for peer scoring and comparison pickers. */
export function listAllDemoCompanies(): DemoCompany[] {
  return Object.values(ALL_COMPANIES);
}

/** Whether this ticker is one of the four permanently hand-verified companies. */
export function isHandVerified(ticker: string): boolean {
  return ticker.toUpperCase() in HAND_VERIFIED;
}

export interface DemoCompanySummary {
  ticker: string;
  name: string;
}

export function listDemoCompanySummaries(): DemoCompanySummary[] {
  return Object.values(ALL_COMPANIES).map((company) => ({
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
