import type { SunTier } from "./types";
import { ZIP_PREFIX_SUN_HOURS } from "./sun-hours-data";

export const SUN_TIERS: Record<SunTier, { label: string; hours: number; example: string }> = {
  poor:    { label: "Low Sun",     hours: 3.5, example: "Seattle, Portland, Buffalo" },
  average: { label: "Average Sun", hours: 4.5, example: "Nashville, DC, Chicago" },
  good:    { label: "Good Sun",    hours: 5.5, example: "Denver, LA, Dallas" },
  desert:  { label: "Desert Sun",  hours: 6.5, example: "Phoenix, Vegas, Tucson" },
};

/**
 * Look up peak sun hours by ZIP code (3-digit prefix match).
 * Returns null if no match found.
 */
export function lookupSunHours(zip: string): number | null {
  const clean = zip.replace(/\D/g, "").slice(0, 3);
  if (clean.length < 3) return null;
  return ZIP_PREFIX_SUN_HOURS[clean] ?? null;
}

/**
 * Get the closest sun tier for a given hours value.
 */
export function getSunTier(hours: number): SunTier {
  if (hours <= 3.9) return "poor";
  if (hours <= 4.9) return "average";
  if (hours <= 5.9) return "good";
  return "desert";
}
