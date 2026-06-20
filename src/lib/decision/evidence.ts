/**
 * Evidence-graph accessor for decision guides.
 *
 * The graph (`src/lib/data/evidence.json`, produced by
 * scripts/build-evidence-graph.ts) is the build-time fact substrate: decision
 * pages READ price signals / percentiles / buy-now-vs-wait verdicts from here
 * rather than recomputing them, so the numbers are identical across the guide,
 * the kit page, and /this-week. Pure reads — no behavior, no request-time compute.
 */

import evidenceData from "@/lib/data/evidence.json";
import type { EvidenceGraph, KitEvidence } from "@/lib/data/evidence.types";

const graph = evidenceData as unknown as EvidenceGraph;

export function getEvidenceGraph(): EvidenceGraph {
  return graph;
}

export function getKitEvidence(slug: string): KitEvidence | undefined {
  return graph.kits[slug];
}

/** A deterministic, human-readable buy/wait line for a kit, or null if no history. */
export function getBuyTiming(slug: string): {
  signal: "buy_now" | "fair" | "wait";
  rationale: string;
  currentPrice: number;
  low6mo: number;
  high6mo: number;
  pctAboveLow: number;
  lastObserved: string;
} | null {
  const k = graph.kits[slug];
  if (!k || !k.priceSignal || !k.buyNowVsWait) return null;
  return {
    signal: k.buyNowVsWait.signal,
    rationale: k.buyNowVsWait.rationale,
    currentPrice: k.priceSignal.currentPrice,
    low6mo: k.priceSignal.low6mo,
    high6mo: k.priceSignal.high6mo,
    pctAboveLow: k.priceSignal.pctAboveLow,
    lastObserved: k.priceSignal.lastObserved,
  };
}

export const BUY_SIGNAL_STYLE: Record<
  "buy_now" | "fair" | "wait",
  { label: string; color: string }
> = {
  buy_now: { label: "Buy now", color: "var(--success)" },
  fair: { label: "Fair price", color: "var(--accent)" },
  wait: { label: "Wait", color: "var(--warning)" },
};
