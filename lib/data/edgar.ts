import { getCached } from "./cache";

const SEC_MIN_DELAY_MS = 150;
let lastRequestAt = 0;

function userAgent(): string {
  const ua = process.env.SEC_USER_AGENT;
  if (!ua) {
    throw new Error(
      "SEC_USER_AGENT is not set. SEC rejects requests without a descriptive User-Agent."
    );
  }
  return ua;
}

/** All EDGAR calls go through this - single place enforcing the User-Agent and rate limit. */
async function fetchSec(url: string): Promise<unknown> {
  const wait = SEC_MIN_DELAY_MS - (Date.now() - lastRequestAt);
  if (wait > 0) {
    await new Promise((resolve) => setTimeout(resolve, wait));
  }
  lastRequestAt = Date.now();

  const res = await fetch(url, {
    headers: { "User-Agent": userAgent(), Accept: "application/json" },
  });
  if (!res.ok) {
    throw new Error(`SEC request failed: ${res.status} ${res.statusText} (${url})`);
  }
  return res.json();
}

interface TickerEntry {
  cik_str: number;
  ticker: string;
  title: string;
}

let tickerMapPromise: Promise<Map<string, string>> | null = null;

async function loadTickerMap(): Promise<Map<string, string>> {
  const raw = await getCached(
    "sec_company_tickers",
    24 * 60 * 60 * 1000,
    () => fetchSec("https://www.sec.gov/files/company_tickers.json") as Promise<
      Record<string, TickerEntry>
    >
  );
  const map = new Map<string, string>();
  for (const entry of Object.values(raw)) {
    map.set(entry.ticker.toUpperCase(), String(entry.cik_str).padStart(10, "0"));
  }
  return map;
}

/**
 * Ticker -> zero-padded 10-digit CIK. Returns null for tickers not in SEC's currently
 * registered list - a delisted or gone-private company (e.g. SKX post-2025) will
 * legitimately return null here. That is expected behavior, not a bug to chase.
 */
export async function resolveCik(ticker: string): Promise<string | null> {
  if (!tickerMapPromise) {
    tickerMapPromise = loadTickerMap();
  }
  const map = await tickerMapPromise;
  return map.get(ticker.toUpperCase()) ?? null;
}

export interface EdgarSubmissions {
  cik: string;
  name: string;
  sic: string | null;
  sicDescription: string | null;
  fiscalYearEnd: string | null;
  exchanges: string[];
  tickers: string[];
  addresses?: { business?: { city?: string; stateOrCountry?: string } };
  filings: {
    recent: {
      accessionNumber: string[];
      filingDate: string[];
      form: string[];
      primaryDocument: string[];
    };
  };
}

export async function getSubmissions(cik: string): Promise<EdgarSubmissions> {
  return getCached(`sec_submissions_${cik}`, 24 * 60 * 60 * 1000, () =>
    fetchSec(`https://data.sec.gov/submissions/CIK${cik}.json`)
  ) as Promise<EdgarSubmissions>;
}

export interface XbrlFactEntry {
  start?: string;
  end: string;
  val: number;
  accn: string;
  fy: number;
  fp: string;
  form: string;
  filed: string;
}

export interface EdgarCompanyFacts {
  cik: number;
  entityName: string;
  facts: {
    dei?: Record<string, { units: Record<string, XbrlFactEntry[]> }>;
    "us-gaap"?: Record<string, { units: Record<string, XbrlFactEntry[]> }>;
  };
}

export async function getCompanyFacts(cik: string): Promise<EdgarCompanyFacts> {
  return getCached(`sec_companyfacts_${cik}`, 24 * 60 * 60 * 1000, () =>
    fetchSec(`https://data.sec.gov/api/xbrl/companyfacts/CIK${cik}.json`)
  ) as Promise<EdgarCompanyFacts>;
}

export interface AnnualFiling {
  accessionNumber: string;
  accessionNumberDashed: string;
  filingDate: string;
  primaryDocument: string;
}

export type FilingLookupResult =
  | { ok: true; filing: AnnualFiling }
  | { ok: false; reason: "no-10k" | "foreign-filer" };

const FOREIGN_FILER_FORMS = new Set(["20-F", "40-F", "6-K"]);

/**
 * Finds the most recent 10-K. Detects foreign filers (20-F/40-F) BEFORE any tag
 * matching is attempted - those use the ifrs-full taxonomy, not us-gaap, so the
 * whole tag-fallback list would silently fail to match rather than clearly reject.
 */
export function findLatestAnnualFiling(submissions: EdgarSubmissions): FilingLookupResult {
  const { accessionNumber, filingDate, form, primaryDocument } = submissions.filings.recent;

  for (let i = 0; i < form.length; i++) {
    if (form[i] === "10-K") {
      return {
        ok: true,
        filing: {
          accessionNumber: accessionNumber[i].replace(/-/g, ""),
          accessionNumberDashed: accessionNumber[i],
          filingDate: filingDate[i],
          primaryDocument: primaryDocument[i],
        },
      };
    }
  }

  const recentlyForeign = form.some((f) => FOREIGN_FILER_FORMS.has(f));
  return { ok: false, reason: recentlyForeign ? "foreign-filer" : "no-10k" };
}

export function buildFilingUrl(cik: string, filing: AnnualFiling): string {
  const cikNoLeadingZeros = String(Number(cik));
  return `https://www.sec.gov/Archives/edgar/data/${cikNoLeadingZeros}/${filing.accessionNumber}/${filing.primaryDocument}`;
}

export function buildFilingIndexUrl(cik: string, filing: AnnualFiling): string {
  const cikNoLeadingZeros = String(Number(cik));
  return `https://www.sec.gov/Archives/edgar/data/${cikNoLeadingZeros}/${filing.accessionNumberDashed}-index.htm`;
}
