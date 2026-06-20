/**
 * INDEX GOVERNOR — the single source of truth for what Google may index.
 *
 * The domain was demoted ~2026-04-28 as a thin programmatic affiliate catalog
 * (197 indexable URLs, mostly thin kit/brand/facet pages). Recovery = a small,
 * high-proof indexable surface. This manifest is the enforcement point used by
 * BOTH `generate-sitemap.ts` (emit only indexable URLs) AND every page's
 * `generateMetadata` (emit robots:{index:false,follow:true} for anything not
 * indexable). Non-indexable pages stay rendered + crawlable (`follow`) for UX
 * and internal-link equity — they just leave the index and the sitemap.
 *
 * GATE RULE (see growth-system/inputs/automation-architecture.md §3): editing
 * this set is a 🔴 human-approval action. Automation may PROPOSE additions
 * (the weekly opportunity engine, ≤1 new URL/week) but never auto-adds one.
 *
 * Kit pages are governed separately by the quality gate in get-kits.ts
 * (`isIndexableKit`) so the indexed kit set tracks the data (complete systems
 * only) — currently ~37 of 107 primaries. See growth-system/inputs/kit-page-audit.md.
 */

import { isIndexableKit } from "./get-kits";
import { getIndexableDecisionGuideSlugs } from "@/content/decision-guide-registry";

/**
 * Hard ceiling: the CI build (`scripts/index-governor.ts`) fails if the
 * resolved indexable set exceeds this, so the index can never silently
 * balloon back to hundreds. Target operating band is 25–40; the headroom
 * above that absorbs kit-survivor drift across data refreshes.
 */
export const INDEX_CEILING = 75;

/**
 * Approved NON-KIT indexable paths (the lean recovery spine).
 * Everything not listed here (and not an `isIndexableKit` /kits/ slug) renders
 * noindex,follow and is excluded from the sitemap.
 *
 * Deliberately EXCLUDED at relaunch (was the thin-catalog surface): all
 * /brands/* (boilerplate; Anker etc. flip back only after curated copy via the
 * gate), /categories/* + /solar-kits/[budget] (faceted slices), /products,
 * /whole-home, /solar-kits, /best-for/{rv,homestead,boat} (rv deduped to
 * /best-rv-solar-kit; homestead/boat held until rebuilt), the 9 listicle-style
 * /learn catalog dupes, /this-week/archive/*, and boilerplate /contact,
 * /affiliate-disclosure, /privacy, /terms.
 */
export const INDEXABLE_PATHS: ReadonlySet<string> = new Set([
  // Core + genuine interactive tools (non-thin assets)
  "/",
  "/kits", // canonical catalog hub (most-impressed non-home page)
  "/calculator",
  "/tools/shed-solar-calculator",
  "/tools/battery-sizing-calculator",
  "/compare",
  "/this-week",
  "/portable-power",

  // Demand-matched ranked-table hubs (exact-query H1 + cohort table + verdict)
  "/best-rv-solar-kit",
  "/1000-watt-solar-kit",
  "/2000-watt-solar-kit",
  "/best-solar-generator-under-500",

  // Use-case decision pages on the verdict template (rv deduped to hub above)
  "/best-for/cabin",
  "/best-for/shed",
  "/best-for/emergency",

  // /learn: hub + the strongest, genuinely-useful evidence clusters only
  "/learn",
  "/learn/inverters-and-power-conversion",
  "/learn/solar-for-sheds-and-small-structures",
  "/learn/lithium-and-lifepo4-batteries",
  "/learn/rv-and-camper-solar",
  "/learn/battery-types-and-deep-cycle",

  // Trust / methodology = the moat's credibility layer (signals anti-thin)
  "/about",
  "/methodology",
  "/how-real-build-cost-is-calculated",
  "/data-sources",
  "/editorial-policy",
]);

/** Normalize a path: strip query/hash + trailing slash (except root). */
export function normalizePath(p: string): string {
  let path = p.split("?")[0].split("#")[0];
  if (path.length > 1 && path.endsWith("/")) path = path.slice(0, -1);
  return path || "/";
}

/**
 * The single indexability decision for ANY path. Kit pages defer to the
 * quality gate; everything else must be on the approved allowlist.
 */
export function isIndexablePath(p: string): boolean {
  const path = normalizePath(p);
  if (path.startsWith("/kits/")) {
    return isIndexableKit(path.slice("/kits/".length));
  }
  // Decision guides defer to the registry's per-guide `indexable` flag (default
  // false). Flipping one to indexable is a 🔴 human-approval action.
  if (path.startsWith("/guides/")) {
    return getIndexableDecisionGuideSlugs().includes(path.slice("/guides/".length));
  }
  return INDEXABLE_PATHS.has(path);
}

/**
 * Robots metadata helper for Next.js `generateMetadata`. Returns the noindex
 * block when a path is not indexable, or an empty object when it is — spread
 * into the returned metadata: `...robotsFor(\`/best-for/\${uc}\`)`.
 */
export function robotsFor(p: string): { robots?: { index: false; follow: true } } {
  return isIndexablePath(p) ? {} : { robots: { index: false, follow: true } };
}
