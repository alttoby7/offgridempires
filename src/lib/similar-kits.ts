import type { Kit, SystemType } from "./demo-data";

type LegacySystemType = "panel-only" | "power-station" | "complete-system";
type Rating = "excellent" | "good" | "fair" | "poor";

const USE_CASES = ["rv", "cabin", "shed", "emergency", "homestead", "boat"] as const;
const RATING_VALUE: Record<Rating, number> = { excellent: 1, good: 0.7, fair: 0.35, poor: 0 };
const clamp01 = (n: number) => Math.max(0, Math.min(1, n));

/** Brands that make all-in-one portable power stations */
const PORTABLE_BRANDS = new Set([
  "Anker", "EcoFlow", "Bluetti", "Jackery", "Goal Zero",
  "Lion Energy", "BougeRV",
]);

/** Brands that sell component-level DIY kits (panels + controllers, sometimes batteries) */
const DIY_BRANDS = new Set([
  "Renogy", "Eco-Worthy", "WindyNation", "HQST", "Rich Solar",
  "BougeRV",
]);

/** Shop Solar tier brands — large complete systems for professional install */
const WHOLE_HOME_TIERS = new Set([
  "SELECT", "SUMMIT", "PRIME", "VECTOR", "EDGE", "ELITE", "CORE",
]);

/**
 * Enhanced 4-way classification for buyer persona routing.
 * Uses brand, component analysis, and size to determine system type.
 */
export function classifyKit(k: Kit): SystemType {
  // If already classified (from export), use that
  if (k.systemType) return k.systemType;

  const brand = k.brand;

  // Shop Solar tiers are always whole-home (except VECTOR which is grid-tied/panels-only)
  if (WHOLE_HOME_TIERS.has(brand)) {
    if (brand === "VECTOR" || (k.storageWh === 0 && k.inverterWatts === 0)) {
      return "panels-only";
    }
    return "whole-home";
  }

  // Hysolis and New Use Energy are complete system brands
  if (brand === "Hysolis" || brand === "New Use Energy") {
    return k.storageWh > 0 ? "whole-home" : "panels-only";
  }

  // DIY brands are always diy-kit (even panel+controller bundles without battery)
  if (DIY_BRANDS.has(brand)) {
    return "diy-kit";
  }

  // No storage and no inverter = panels-only (for non-DIY brands)
  if (k.storageWh === 0 && k.inverterWatts === 0) {
    return "panels-only";
  }

  // Portable brands with built-in battery
  if (PORTABLE_BRANDS.has(brand) && k.storageWh > 0) {
    return "portable";
  }

  // Fallback: small systems with storage are portable, large are whole-home
  if (k.panelWatts <= 800 && k.storageWh <= 10000) {
    return k.storageWh > 0 ? "portable" : "panels-only";
  }

  return "whole-home";
}

/** Legacy 3-way classification for similarity scoring */
function getSystemType(k: Kit): LegacySystemType {
  if (k.storageWh === 0) return "panel-only";
  if (k.panelWatts <= 600 && k.storageWh <= 8192 && k.inverterWatts <= 4000) return "power-station";
  return "complete-system";
}

function logSimilarity(a: number, b: number, maxRatio = 4): number {
  if (a === 0 && b === 0) return 1;
  if (a === 0 || b === 0) return 0;
  return clamp01(1 - Math.abs(Math.log(a) - Math.log(b)) / Math.log(maxRatio));
}

function voltageSimilarity(a: number, b: number): number {
  if (a === b) return 1;
  if (a === 0 || b === 0) return 0.5;
  return clamp01(1 - Math.abs(Math.log2(a / b)) / 2);
}

function capacitySimilarity(a: Kit, b: Kit): number {
  const p = logSimilarity(a.panelWatts, b.panelWatts, 5);
  const s = logSimilarity(a.storageWh, b.storageWh, 5);
  const i = logSimilarity(a.inverterWatts, b.inverterWatts, 5);

  switch (getSystemType(a)) {
    case "panel-only": return 0.9 * p + 0.1 * i;
    case "power-station": return 0.2 * p + 0.5 * s + 0.3 * i;
    case "complete-system": return 0.45 * p + 0.35 * s + 0.2 * i;
  }
}

function useCaseSimilarity(a: Kit, b: Kit): number {
  let min = 0, max = 0;
  for (const key of USE_CASES) {
    const av = RATING_VALUE[(a.useCaseRatings[key] as Rating) ?? "poor"];
    const bv = RATING_VALUE[(b.useCaseRatings[key] as Rating) ?? "poor"];
    min += Math.min(av, bv);
    max += Math.max(av, bv);
  }
  return max === 0 ? 0.5 : min / max;
}

function chemistrySimilarity(a: Kit, b: Kit): number {
  if (a.chemistry === b.chemistry) return 1;
  if (a.chemistry === "Unknown" || b.chemistry === "Unknown") return 0.5;
  if (a.chemistry === "None" || b.chemistry === "None") return 0;
  return 0.15;
}

function sizeIndex(k: Kit): number {
  const p = Math.log(Math.max(1, k.panelWatts));
  const s = Math.log(Math.max(1, k.storageWh));
  const i = Math.log(Math.max(1, k.inverterWatts));

  switch (getSystemType(k)) {
    case "panel-only": return p;
    case "power-station": return 0.2 * p + 0.5 * s + 0.3 * i;
    case "complete-system": return 0.45 * p + 0.35 * s + 0.2 * i;
  }
}

function inBand(current: Kit, candidate: Kit, ratio: number): boolean {
  return (
    Math.abs(sizeIndex(current) - sizeIndex(candidate)) <= Math.log(ratio) &&
    logSimilarity(current.trueCost, candidate.trueCost, ratio) > 0
  );
}

function scoreKit(current: Kit, candidate: Kit): number {
  if (current.slug === candidate.slug) return -Infinity;
  if (getSystemType(current) !== getSystemType(candidate)) return -Infinity;

  let score = 0;
  score += 35 * voltageSimilarity(current.voltage, candidate.voltage);
  score += 30 * capacitySimilarity(current, candidate);
  score += 20 * logSimilarity(current.trueCost, candidate.trueCost, 4);
  score += 10 * useCaseSimilarity(current, candidate);
  score += 3 * chemistrySimilarity(current, candidate);
  score += 2 * logSimilarity(Math.max(1, current.completeness), Math.max(1, candidate.completeness), 2);

  if (current.brand === candidate.brand) score -= 6;
  return score;
}

export function getSimilarKits(currentKit: Kit, allKits: Kit[], count = 3): Kit[] {
  const sameType = allKits.filter(
    (k) => k.slug !== currentKit.slug && getSystemType(k) === getSystemType(currentKit)
  );

  let pool = sameType.filter((k) => inBand(currentKit, k, 3));
  if (pool.length < count) pool = sameType.filter((k) => inBand(currentKit, k, 5));
  if (pool.length < count) pool = sameType;

  return pool.sort((a, b) => scoreKit(currentKit, b) - scoreKit(currentKit, a)).slice(0, count);
}
