/**
 * Kit data loader.
 * Reads from exported DB data (src/lib/data/kits.json) when available,
 * falls back to demo-data.ts for development.
 *
 * Run `npx tsx scripts/export-data.ts` to refresh from DB.
 */

import type { Kit } from "./demo-data";

let _kits: Kit[] | null = null;

function loadKits(): Kit[] {
  if (_kits) return _kits;

  try {
    // Try DB-exported data first
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const data = require("./data/kits.json");
    _kits = data as Kit[];
  } catch {
    // Fall back to demo data
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { demoKits } = require("./demo-data");
    _kits = demoKits;
  }

  return _kits!;
}

function kitsWithPrices(kits: Kit[]): Kit[] {
  return kits.filter((k) => k.listedPrice && k.listedPrice > 0);
}

export function getKits(): Kit[] {
  return kitsWithPrices(loadKits());
}

export function getKitBySlug(slug: string): Kit | undefined {
  return kitsWithPrices(loadKits()).find((k) => k.slug === slug);
}

export function getKitSlugs(): string[] {
  return kitsWithPrices(loadKits()).map((k) => k.slug);
}
