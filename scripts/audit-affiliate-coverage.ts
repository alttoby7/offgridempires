#!/usr/bin/env tsx
/**
 * Build-time affiliate coverage audit (REPORT-ONLY — never fails the build).
 *
 * Every outbound retailer link that isn't decorated with an affiliate tag is a
 * click we can never earn on. This prints, per retailer, how many primary kits +
 * offers currently route to a MONETIZED vs an untagged (leaking) destination, so
 * the leak is visible on every build and shrinks as programs get wired.
 *
 * Run before build (wired into `npm run build`):
 *   npx tsx scripts/audit-affiliate-coverage.ts
 */

import { getKits } from "../src/lib/get-kits";
import { isRetailerMonetized } from "../src/lib/affiliate";

const kits = getKits();

type Row = { primary: number; offers: number; monetized: boolean };
const byRetailer: Record<string, Row> = {};

function bump(slug: string, kind: "primary" | "offers") {
  const key = slug || "(none)";
  byRetailer[key] ??= { primary: 0, offers: 0, monetized: isRetailerMonetized(key) };
  byRetailer[key][kind] += 1;
}

for (const kit of kits) {
  bump((kit as { retailerSlug?: string }).retailerSlug ?? "(none)", "primary");
  for (const offer of ((kit as { offers?: { retailerSlug?: string }[] }).offers ?? [])) {
    bump(offer.retailerSlug ?? "(none)", "offers");
  }
}

const rows = Object.entries(byRetailer).sort((a, b) => b[1].primary - a[1].primary);

let leakingPrimary = 0;
let leakingOffers = 0;

console.log("\n[affiliate-coverage] retailer link monetization audit");
console.log("  retailer            primary  offers   status");
for (const [slug, r] of rows) {
  const tag = slug === "(none)" ? "n/a (no source)" : r.monetized ? "MONETIZED" : "!! LEAKING";
  if (slug !== "(none)" && !r.monetized) {
    leakingPrimary += r.primary;
    leakingOffers += r.offers;
  }
  console.log(
    `  ${slug.padEnd(18)}  ${String(r.primary).padStart(6)}  ${String(r.offers).padStart(6)}   ${tag}`
  );
}
console.log(
  `[affiliate-coverage] LEAKING: ${leakingPrimary} primary kit link(s) + ${leakingOffers} offer link(s) route to an untagged retailer.\n`
);
