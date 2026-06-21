/**
 * Build-time checker for GuideClaim superlative assertions.
 *
 * The token resolver guarantees the NUMBERS in prose are live; this guarantees
 * the COMPARISONS are true. For each claim it pulls the named metric off every
 * pick in scope and asserts the claimed pick is the min ("lowest") or max
 * ("highest"). A violation throws — so the validator/build fails loudly when the
 * price cron shifts a rank out from under a "cheapest"/"most"/"lowest" claim
 * (the failure mode the naked-literal lint is blind to).
 *
 * Ties are allowed: the pick must BE an extreme, not strictly beat every peer.
 */

import type { Kit } from "@/lib/demo-data";
import type { DecisionGuideMeta, GuideClaim } from "./types";
import type { ResolvedPick } from "./resolve";

/** Parse a kit metric to a comparable number. "$0.44" → 0.44; N/A → null. */
function metricValue(kit: Kit, metric: GuideClaim["metric"]): number | null {
  switch (metric) {
    case "listedPrice":
    case "trueCost":
    case "missingCost":
    case "storageWh":
    case "inverterWatts":
    case "completeness": {
      const v = (kit as unknown as Record<string, unknown>)[metric];
      return typeof v === "number" && Number.isFinite(v) ? v : null;
    }
    case "costPerWh":
    case "costPerW": {
      const raw = (kit as unknown as Record<string, string>)[metric];
      if (typeof raw !== "string") return null;
      const n = parseFloat(raw.replace(/[^0-9.]/g, ""));
      return Number.isFinite(n) ? n : null;
    }
    default:
      return null;
  }
}

/** "p3" → index 2. Throws if malformed or out of range. */
function pickIndex(slug: string, id: string, nPicks: number): number {
  const m = /^p(\d+)$/.exec(id);
  if (!m) throw new Error(`[decision-guide ${slug}] claim references bad pick id "${id}"`);
  const i = Number(m[1]) - 1;
  if (i < 0 || i >= nPicks) {
    throw new Error(`[decision-guide ${slug}] claim references pick "${id}" but there are ${nPicks} picks`);
  }
  return i;
}

/**
 * Validate every claim on a guide. Throws on the first violation (or on a claim
 * that can't be evaluated — an N/A metric on a pick in scope is itself a bug).
 */
export function checkClaims(meta: DecisionGuideMeta, picks: ResolvedPick[]): void {
  const claims = meta.claims;
  if (!claims?.length) return;

  for (const claim of claims) {
    const scopeIds = claim.among ?? picks.map((_, i) => `p${i + 1}`);
    const targetIdx = pickIndex(meta.slug, claim.pick, picks.length);
    if (!scopeIds.includes(claim.pick)) {
      throw new Error(
        `[decision-guide ${meta.slug}] claim pick "${claim.pick}" is not in its own \`among\` scope ${JSON.stringify(scopeIds)}`
      );
    }

    // Pull the metric for every pick in scope.
    const scope = scopeIds.map((id) => {
      const idx = pickIndex(meta.slug, id, picks.length);
      const kit = picks[idx].kit;
      const value = metricValue(kit, claim.metric);
      return { id, idx, slug: kit.slug, value };
    });

    const naQ = scope.find((s) => s.value === null);
    if (naQ) {
      throw new Error(
        `[decision-guide ${meta.slug}] claim {${claim.pick} ${claim.direction} ${claim.metric}} can't evaluate — "${naQ.slug}" (${naQ.id}) has no ${claim.metric}` +
          (claim.note ? ` [${claim.note}]` : "")
      );
    }

    const target = scope[scopeIds.indexOf(claim.pick)] ?? scope[scope.findIndex((s) => s.idx === targetIdx)];
    const targetVal = target.value as number;

    // For "lowest", no peer may be strictly LESS; for "highest", none strictly GREATER.
    const violator = scope.find((s) =>
      claim.direction === "lowest" ? (s.value as number) < targetVal : (s.value as number) > targetVal
    );
    if (violator) {
      const others = scope.map((s) => `${s.id}=${s.value}`).join(", ");
      throw new Error(
        `[decision-guide ${meta.slug}] FALSE CLAIM: "${claim.pick}" is NOT the ${claim.direction} ${claim.metric} ` +
          `within {${scopeIds.join(",")}} — ${violator.id} (${violator.slug}) is ${violator.value} vs ${claim.pick}=${targetVal}. ` +
          `[${others}]` +
          (claim.note ? ` — guards: ${claim.note}` : "")
      );
    }
  }
}
