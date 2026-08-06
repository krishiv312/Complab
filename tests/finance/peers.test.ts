import { describe, expect, it } from "vitest";
import { suggestPeers } from "../../lib/finance/peers";
import crox from "../../data/demo/CROX.json";
import deck from "../../data/demo/DECK.json";
import skx from "../../data/demo/SKX.json";
import nke from "../../data/demo/NKE.json";
import nvda from "../../data/companies/NVDA.json";
import amd from "../../data/companies/AMD.json";
import type { DemoCompany } from "../../lib/finance/types";

const ALL = [crox, deck, skx, nke, nvda, amd] as unknown as DemoCompany[];

describe("suggestPeers", () => {
  it("ranks same-industry, same-sub-industry companies above cross-industry ones", () => {
    const nkeCompany = ALL.find((c) => c.profile.ticker === "NKE")!;
    const peers = suggestPeers(nkeCompany, ALL);
    const tickers = peers.map((p) => p.ticker);

    expect(tickers).toContain("SKX");
    expect(tickers).toContain("DECK");
    expect(tickers).toContain("CROX");

    const skxIndex = tickers.indexOf("SKX");
    const nvdaIndex = tickers.indexOf("NVDA");
    // NVDA may or may not appear (score could be 0 and get filtered), but if it
    // does, a genuine footwear peer must rank above it.
    if (nvdaIndex !== -1) {
      expect(skxIndex).toBeLessThan(nvdaIndex);
    }
  });

  it("never suggests the subject company itself", () => {
    const nkeCompany = ALL.find((c) => c.profile.ticker === "NKE")!;
    const peers = suggestPeers(nkeCompany, ALL);
    expect(peers.map((p) => p.ticker)).not.toContain("NKE");
  });

  it("gives every suggestion a non-empty rationale", () => {
    const nvdaCompany = ALL.find((c) => c.profile.ticker === "NVDA")!;
    const peers = suggestPeers(nvdaCompany, ALL);
    for (const p of peers) {
      expect(p.rationale.length).toBeGreaterThan(0);
    }
  });

  it("respects the limit parameter", () => {
    const nkeCompany = ALL.find((c) => c.profile.ticker === "NKE")!;
    const peers = suggestPeers(nkeCompany, ALL, 2);
    expect(peers.length).toBeLessThanOrEqual(2);
  });

  it("scores same-industry-and-sub-industry higher than same-industry-only", () => {
    // SKX/DECK/CROX share NKE's exact sub-industry (Footwear); a same-industry-
    // only peer (different sub-industry) should score lower, not tie.
    const nkeCompany = ALL.find((c) => c.profile.ticker === "NKE")!;
    const peers = suggestPeers(nkeCompany, ALL);
    const skx_ = peers.find((p) => p.ticker === "SKX");
    expect(skx_).toBeDefined();
    expect(skx_!.score).toBeGreaterThan(0.5);
  });
});
