/**
 * Shared affiliate URL utilities.
 * Centralises all retailer-specific link decoration logic.
 */

const AMAZON_AFFILIATE_TAG = "fidohikes-20";
// TODO: Replace with real Awin IDs after Shop Solar approval
const AWIN_ADVERTISER_ID = "";
const AWIN_PUBLISHER_ID = "";

/**
 * Infer retailer slug from retailer name or source URL.
 * Falls back to URL hostname if name is unrecognised.
 */
export function deriveRetailerSlug(retailer?: string, sourceUrl?: string): string {
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
 */
export function buildAffiliateUrl(
  sourceUrl: string | undefined,
  retailerSlug = "amazon"
): string | null {
  if (!sourceUrl) return null;
  if (retailerSlug === "amazon") {
    const sep = sourceUrl.includes("?") ? "&" : "?";
    return `${sourceUrl}${sep}tag=${AMAZON_AFFILIATE_TAG}`;
  }
  if (
    retailerSlug === "shop-solar-kits" &&
    AWIN_ADVERTISER_ID &&
    AWIN_PUBLISHER_ID
  ) {
    const encoded = encodeURIComponent(sourceUrl);
    return `https://www.awin1.com/cread.php?awinmid=${AWIN_ADVERTISER_ID}&awinaffid=${AWIN_PUBLISHER_ID}&ued=${encoded}`;
  }
  // Passthrough for all other retailers
  return sourceUrl;
}
