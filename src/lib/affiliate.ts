/**
 * Shared affiliate URL utilities.
 * Centralises all retailer-specific link decoration logic.
 *
 * All affiliate IDs are read from environment variables (set in central .env).
 * At build time, Next.js inlines process.env.NEXT_PUBLIC_* values.
 */

// All affiliate identifiers below are PUBLIC — they appear verbatim in the
// outbound links we render — so they are baked as defaults (env-overridable for
// rotation). Baking them means CI builds correct links with no secret wiring,
// and a missing env can never silently leak revenue (the previous `fidohikes-20`
// default sent every Amazon commission to a different site).
const AMAZON_TAG =
  process.env.NEXT_PUBLIC_AMAZON_AFFILIATE_TAG || "offgridempire-20";

// Awin publisher (affiliate) id — constant across all Awin merchants.
const AWIN_PUBLISHER_ID =
  process.env.NEXT_PUBLIC_AWIN_PUBLISHER_ID || "2825050";

// Awin advertiser ids (awinmid) for the US programs, keyed by kits.json
// retailerSlug. Jackery's US advertiser id is still pending → passthrough until set.
const AWIN_ADVERTISERS: Record<string, string> = {
  "ecoflow-us": process.env.NEXT_PUBLIC_AWIN_ECOFLOW_ADVERTISER_ID || "59181",
  bluetti: process.env.NEXT_PUBLIC_AWIN_BLUETTI_ADVERTISER_ID || "59271",
  jackery: process.env.NEXT_PUBLIC_AWIN_JACKERY_ADVERTISER_ID || "",
};

// Renogy via Impact (impact.com / *.sjv.io) — deep-link with ?u=<encoded dest>.
const RENOGY_IMPACT_BASE =
  process.env.NEXT_PUBLIC_RENOGY_IMPACT_LINK ||
  "https://renogy.sjv.io/c/7112674/1182656/14864";

// Shop Solar Kits (306 kits — biggest surface). Prefer Awin if approved as an
// Awin merchant; else a direct ?ref= code; else passthrough. Both pending.
const SHOPSOLAR_AWIN_ADVERTISER =
  process.env.NEXT_PUBLIC_AWIN_SHOPSOLAR_ADVERTISER_ID || "";
const SHOPSOLAR_REF = process.env.NEXT_PUBLIC_SHOPSOLAR_REF || "";

function awinRedirect(advertiserId: string, sourceUrl: string): string {
  return `https://www.awin1.com/cread.php?awinmid=${advertiserId}&awinaffid=${AWIN_PUBLISHER_ID}&ued=${encodeURIComponent(
    sourceUrl
  )}`;
}

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

  switch (retailerSlug) {
    case "amazon": {
      if (!AMAZON_TAG) return sourceUrl; // never ship a broken tag=
      const sep = sourceUrl.includes("?") ? "&" : "?";
      return `${sourceUrl}${sep}tag=${AMAZON_TAG}`;
    }

    // Renogy via Impact deep-link.
    case "renogy":
    case "renogy-direct": {
      return `${RENOGY_IMPACT_BASE}?u=${encodeURIComponent(sourceUrl)}`;
    }

    // Awin US brand stores.
    case "ecoflow-us":
    case "ecoflow":
    case "bluetti":
    case "jackery": {
      const advertiserId =
        AWIN_ADVERTISERS[retailerSlug] ??
        (retailerSlug === "ecoflow" ? AWIN_ADVERTISERS["ecoflow-us"] : "");
      if (advertiserId && AWIN_PUBLISHER_ID) return awinRedirect(advertiserId, sourceUrl);
      return sourceUrl; // advertiser id not yet configured
    }

    case "shop-solar-kits": {
      if (SHOPSOLAR_AWIN_ADVERTISER && AWIN_PUBLISHER_ID) {
        return awinRedirect(SHOPSOLAR_AWIN_ADVERTISER, sourceUrl);
      }
      if (SHOPSOLAR_REF) {
        const sep = sourceUrl.includes("?") ? "&" : "?";
        return `${sourceUrl}${sep}ref=${SHOPSOLAR_REF}`;
      }
      return sourceUrl; // program not yet configured
    }

    default:
      return sourceUrl; // passthrough for unconfigured retailers
  }
}

/**
 * True when a retailer slug currently has affiliate decoration configured.
 * Used by the build-time coverage audit to surface untagged (leaking) links.
 */
export function isRetailerMonetized(retailerSlug: string): boolean {
  switch (retailerSlug) {
    case "amazon":
      return Boolean(AMAZON_TAG);
    case "renogy":
    case "renogy-direct":
      return Boolean(RENOGY_IMPACT_BASE);
    case "ecoflow-us":
    case "ecoflow":
      return Boolean(AWIN_ADVERTISERS["ecoflow-us"] && AWIN_PUBLISHER_ID);
    case "bluetti":
      return Boolean(AWIN_ADVERTISERS["bluetti"] && AWIN_PUBLISHER_ID);
    case "jackery":
      return Boolean(AWIN_ADVERTISERS["jackery"] && AWIN_PUBLISHER_ID);
    case "shop-solar-kits":
      return Boolean(
        (SHOPSOLAR_AWIN_ADVERTISER && AWIN_PUBLISHER_ID) || SHOPSOLAR_REF
      );
    default:
      return false;
  }
}
