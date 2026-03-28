/**
 * Shared affiliate URL utilities.
 * Centralises all retailer-specific link decoration logic.
 *
 * All affiliate IDs are read from environment variables (set in central .env).
 * At build time, Next.js inlines process.env.NEXT_PUBLIC_* values.
 */

const AMAZON_TAG =
  process.env.NEXT_PUBLIC_AMAZON_AFFILIATE_TAG || "fidohikes-20";
const AWIN_ADVERTISER_ID =
  process.env.NEXT_PUBLIC_AWIN_SHOPSOLAR_ADVERTISER_ID || "";
const AWIN_PUBLISHER_ID =
  process.env.NEXT_PUBLIC_AWIN_PUBLISHER_ID || "";
const SHOPSOLAR_REF =
  process.env.NEXT_PUBLIC_SHOPSOLAR_REF || "";

/**
 * Infer retailer slug from retailer name or source URL.
 * Falls back to URL hostname if name is unrecognised.
 */
export function deriveRetailerSlug(
  retailer?: string,
  sourceUrl?: string
): string {
  const byName: Record<string, string> = {
    amazon: "amazon",
    "shop solar kits": "shop-solar-kits",
    "renogy direct": "renogy-direct",
    renogy: "renogy-direct",
    ecoflow: "ecoflow",
    "ecoflow direct": "ecoflow",
    bluetti: "bluetti",
    jackery: "jackery",
    "goal zero": "goal-zero",
  };

  const slug = byName[retailer?.trim().toLowerCase() ?? ""];
  if (slug) return slug;

  // Fallback: infer from URL hostname
  if (sourceUrl?.includes("shopsolarkits.com")) return "shop-solar-kits";
  if (sourceUrl?.includes("amazon.com")) return "amazon";
  if (sourceUrl?.includes("renogy.com")) return "renogy-direct";
  if (sourceUrl?.includes("ecoflow.com")) return "ecoflow";
  if (sourceUrl?.includes("bluettipower.com")) return "bluetti";
  if (sourceUrl?.includes("jackery.com")) return "jackery";
  if (sourceUrl?.includes("goalzero.com")) return "goal-zero";

  return "unknown";
}

/**
 * Append affiliate tracking to a source URL based on retailer.
 * Returns null if sourceUrl is falsy.
 *
 * Priority for Shop Solar: Awin (if IDs set) > direct ref param > passthrough.
 */
export function buildAffiliateUrl(
  sourceUrl: string | undefined,
  retailerSlug = "amazon"
): string | null {
  if (!sourceUrl) return null;

  if (retailerSlug === "amazon") {
    const sep = sourceUrl.includes("?") ? "&" : "?";
    return `${sourceUrl}${sep}tag=${AMAZON_TAG}`;
  }

  if (retailerSlug === "shop-solar-kits") {
    // Prefer Awin redirect if both IDs are configured
    if (AWIN_ADVERTISER_ID && AWIN_PUBLISHER_ID) {
      const encoded = encodeURIComponent(sourceUrl);
      return `https://www.awin1.com/cread.php?awinmid=${AWIN_ADVERTISER_ID}&awinaffid=${AWIN_PUBLISHER_ID}&ued=${encoded}`;
    }
    // Fall back to direct ref parameter
    if (SHOPSOLAR_REF) {
      const sep = sourceUrl.includes("?") ? "&" : "?";
      return `${sourceUrl}${sep}ref=${SHOPSOLAR_REF}`;
    }
  }

  // Passthrough for all other retailers (or unconfigured Shop Solar)
  return sourceUrl;
}
