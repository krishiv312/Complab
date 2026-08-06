import { getCached } from "./cache";
import { FinnhubCandleSchema, FinnhubQuoteSchema } from "./schema";
import type { MarketSnapshot, SourceRef } from "../finance/types";

function apiKey(): string {
  const key = process.env.FINNHUB_API_KEY;
  if (!key) {
    throw new Error("FINNHUB_API_KEY is not set.");
  }
  return key;
}

async function finnhubFetch(path: string): Promise<unknown> {
  const url = `https://finnhub.io/api/v1${path}${path.includes("?") ? "&" : "?"}token=${apiKey()}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Finnhub request failed: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

export async function getQuote(ticker: string): Promise<{ price: number } | null> {
  const raw = await finnhubFetch(`/quote?symbol=${encodeURIComponent(ticker)}`);
  const parsed = FinnhubQuoteSchema.safeParse(raw);
  if (!parsed.success || parsed.data.c === 0) return null;
  return { price: parsed.data.c };
}

/**
 * Historical close closest to dateISO. Finnhub's free tier only covers roughly a
 * 1-year lookback - returns null (not a substitute date) when the target falls
 * outside what the API can actually return, or when no trading data exists in
 * the window. Never silently substitutes a different date's price - that's the
 * exact bug class BUILD_LOG.md caught by hand twice (DECK, NKE).
 */
export async function getHistoricalClose(
  ticker: string,
  dateISO: string
): Promise<{ price: number; asOf: string } | null> {
  const target = new Date(dateISO);
  const from = Math.floor(target.getTime() / 1000) - 3 * 86400;
  const to = Math.floor(target.getTime() / 1000) + 7 * 86400;

  const cacheKey = `finnhub_candle_${ticker}_${dateISO}`;
  const raw = await getCached(cacheKey, Infinity, () =>
    finnhubFetch(`/stock/candle?symbol=${encodeURIComponent(ticker)}&resolution=D&from=${from}&to=${to}`)
  );

  const parsed = FinnhubCandleSchema.safeParse(raw);
  if (!parsed.success || parsed.data.s !== "ok" || !parsed.data.c || !parsed.data.t) {
    return null;
  }

  const { c: closes, t: timestamps } = parsed.data;
  let bestIdx = -1;
  let bestDiff = Infinity;
  for (let i = 0; i < timestamps.length; i++) {
    const diff = Math.abs(timestamps[i] * 1000 - target.getTime());
    if (diff < bestDiff) {
      bestDiff = diff;
      bestIdx = i;
    }
  }
  if (bestIdx === -1 || bestDiff > 4 * 86400 * 1000) return null;

  return {
    price: closes[bestIdx],
    asOf: new Date(timestamps[bestIdx] * 1000).toISOString().slice(0, 10),
  };
}

export async function buildMarketSnapshot(
  ticker: string,
  sharesOutstanding: number,
  sharesOutstandingAsOf: string,
  sharesSource: SourceRef,
  retrievedAt: string
): Promise<MarketSnapshot | { needsManualPrice: true; reason: string }> {
  // Historical close, date-matched to the cover-page share count - the precise
  // path, same discipline the hand-verified companies used. Finnhub's free tier
  // does not include this endpoint at all (403, not a date-range limit), so this
  // will currently always fall through - kept in place in case that changes.
  let close: { price: number; asOf: string } | null = null;
  try {
    close = await getHistoricalClose(ticker, sharesOutstandingAsOf);
  } catch {
    close = null;
  }

  if (close) {
    return {
      sharePrice: close.price,
      priceCurrency: "USD",
      priceAsOf: close.asOf,
      priceSource: {
        kind: "MARKET_QUOTE",
        documentUrl: null,
        filingDate: null,
        retrievedAt,
        note: `Historical close via Finnhub, matched to the cover-page share count date (${sharesOutstandingAsOf}).`,
      },
      sharesOutstanding,
      sharesOutstandingAsOf,
      sharesSource,
    };
  }

  // Fallback: a live quote, paired with an OLDER share count. Not a silent
  // mismatch - priceAsOf and sharesOutstandingAsOf are both real, both shown,
  // and genuinely different dates. Market cap is a reasonable approximation
  // here, not a precise point-in-time figure the way the hand-verified
  // companies (with date-matched historical closes) are.
  const quote = await getQuote(ticker);
  if (!quote) {
    return {
      needsManualPrice: true,
      reason: `No Finnhub price available for ${ticker} at all (neither historical nor live quote). Needs manual price entry.`,
    };
  }

  const priceAsOf = retrievedAt;
  return {
    sharePrice: quote.price,
    priceCurrency: "USD",
    priceAsOf,
    priceSource: {
      kind: "MARKET_QUOTE",
      documentUrl: null,
      filingDate: null,
      retrievedAt,
      note: `Live quote via Finnhub (free tier has no historical-close endpoint) - priceAsOf (${priceAsOf}) does NOT match sharesOutstandingAsOf (${sharesOutstandingAsOf}). Market cap is an approximation, not a date-matched figure like the hand-verified companies.`,
    },
    sharesOutstanding,
    sharesOutstandingAsOf,
    sharesSource,
  };
}
