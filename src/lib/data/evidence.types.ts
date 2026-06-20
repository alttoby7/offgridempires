/**
 * Evidence-graph types — the shape of `evidence.json`.
 *
 * The evidence graph is the build-time fact substrate for the recovery system:
 * decision pages are *assembled* from these verified facts; they never compute a
 * number at request time and never invent a number that isn't in the graph.
 *
 * See A4 — Evidence-Graph Spec (§3) for the canonical definitions.
 * Produced by `scripts/build-evidence-graph.ts`. Pure data, no behavior.
 */

export interface EvidenceGraph {
  computedAt: string;
  methodologyVersion: number;
  /** key = `${systemType}:${storageBand}` */
  cohorts: Record<string, CohortEvidence>;
  loadProfiles: Record<string, LoadProfileMeta>;
  /** key = slug */
  kits: Record<string, KitEvidence>;
}

export interface KitEvidence {
  slug: string;
  isPrimary: boolean;
  variantGroup: string;
  variantCount: number;

  realBuildCost: {
    listedPrice: number;
    missingCost: number;
    trueCost: number;
    missingItems: {
      role: string;
      name: string;
      specs: string;
      qty: number;
      estCost: number | null;
    }[];
  };
  hiddenCostDelta: {
    amount: number;
    pctOfListed: number | null;
    hasHiddenCost: boolean;
  };
  missingPartBom: {
    role: string;
    label: string;
    estCostBand: [number, number] | null;
  }[];

  cohortKey: string;
  percentiles: {
    /** null when storageWh = 0 */
    costPerWh: PercentileFact | null;
    costPerW: PercentileFact | null;
    completeness: PercentileFact;
  };

  priceSignal: {
    currentPrice: number;
    low6mo: number;
    low6moDate: string;
    high6mo: number;
    pctAboveLow: number;
    trend30d: "falling" | "flat" | "rising";
    retailerCount: number;
    inStock: boolean;
    lastObserved: string;
  } | null; // null when no history

  buyNowVsWait: {
    signal: "buy_now" | "fair" | "wait";
    rationale: string;
  } | null;

  /** profileId -> [verdictId] (severity-ordered). `{}` if the verdict engine was stubbed. */
  failureTriggers: Record<string, string[]>;
  bestForLoads: { profileId: string; rating: "good" | "excellent" }[];
  bestAlternative: { slug: string; reason: string } | null;
}

export interface PercentileFact {
  value: number;
  /** 0-100 whole number */
  percentile: number;
  cohortKey: string;
  n: number;
  /** true for cost axes ("cheaper than X%"), false for completeness ("more complete than X%") */
  betterIsLow: boolean;
}

export interface CohortStats {
  min: number;
  p10: number;
  p25: number;
  median: number;
  p75: number;
  p90: number;
  max: number;
}

export interface CohortEvidence {
  key: string;
  systemType: string;
  storageBand: string;
  n: number;
  stats: Record<"costPerWh" | "costPerW" | "completeness" | "trueCost", CohortStats>;
  cheapestSlug: string;
  mostCompleteSlug: string;
  bestValueSlug: string;
  /** the 14 notes + 3 rules' metadata embedded once, so per-kit triggers store just ids */
  failureIndex: Record<
    string,
    { severity: string; title: string; detail: string; fix: string }
  >;
}

export interface LoadProfileMeta {
  id: string;
  label: string;
  loadSummary: string;
}
