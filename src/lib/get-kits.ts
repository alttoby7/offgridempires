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

export function getKits(): Kit[] {
  return loadKits();
}

export function getKitBySlug(slug: string): Kit | undefined {
  return loadKits().find((k) => k.slug === slug);
}

export function getKitSlugs(): string[] {
  return loadKits().map((k) => k.slug);
}
