import type { Kit } from "./demo-data";

export interface HubRef {
  slug: string;
  label: string;
  note: string;
}

export const HUB_REGISTRY: HubRef[] = [
  { slug: "best-rv-solar-kit", label: "Best RV Solar Kit", note: "RV + van life" },
  { slug: "1000-watt-solar-kit", label: "1000W Solar Kit", note: "Cabins, sheds, small builds" },
  { slug: "2000-watt-solar-kit", label: "2000W Solar Kit", note: "Cabins, full-time vans" },
  { slug: "best-solar-generator-under-500", label: "Under $500 Solar Generator", note: "Emergency + weekend" },
];

/**
 * Pick the most topically relevant hub for a given kit, or null if no good match.
 * Used from kit detail pages, category pages, and brand pages as a cross-link.
 */
export function getMatchingHub(kit: Kit): HubRef | null {
  // Sub-$500 portable
  if (kit.systemType === "portable" && kit.trueCost > 0 && kit.trueCost <= 500) {
    return HUB_REGISTRY.find((h) => h.slug === "best-solar-generator-under-500") ?? null;
  }

  // RV fit
  if (kit.useCaseRatings?.rv === "excellent" && kit.systemType !== "whole-home") {
    return HUB_REGISTRY.find((h) => h.slug === "best-rv-solar-kit") ?? null;
  }

  // 2000W band
  if (kit.panelWatts >= 1600 && kit.panelWatts <= 2400) {
    return HUB_REGISTRY.find((h) => h.slug === "2000-watt-solar-kit") ?? null;
  }

  // 1000W band
  if (kit.panelWatts >= 800 && kit.panelWatts <= 1250) {
    return HUB_REGISTRY.find((h) => h.slug === "1000-watt-solar-kit") ?? null;
  }

  // RV-good fallback (weaker)
  if (kit.useCaseRatings?.rv === "good" && kit.systemType !== "whole-home") {
    return HUB_REGISTRY.find((h) => h.slug === "best-rv-solar-kit") ?? null;
  }

  return null;
}
