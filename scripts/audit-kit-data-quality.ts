#!/usr/bin/env tsx
/**
 * Kit data quality audit — REVIEW ONLY.
 *
 * Flags kits with thin/incomplete data so we can decide what to fix.
 * Does NOT noindex or remove anything. The output is a JSON report only.
 *
 * Run: npx tsx scripts/audit-kit-data-quality.ts
 * Output: reports/kit-data-quality.json
 */

import * as fs from "fs";
import * as path from "path";

const KITS_PATH = path.join(__dirname, "../src/lib/data/kits.json");
const OUT_DIR = path.join(__dirname, "../reports");
const OUT_PATH = path.join(OUT_DIR, "kit-data-quality.json");

interface Kit {
  slug: string;
  brand: string;
  name: string;
  listedPrice?: number;
  missingCost?: number;
  inverterWatts?: number;
  included?: Record<string, boolean>;
  items?: { isIncluded?: boolean; name?: string }[];
  priceHistory?: { date: string; priceCents: number }[];
  offers?: { sourceUrl?: string; price?: number; inStock?: boolean }[];
  sourceUrl?: string;
}

/** Inverter sanity ceiling — mirrors MAX_PLAUSIBLE_INVERTER_W in get-kits.ts. */
const MAX_PLAUSIBLE_INVERTER_W = 100_000;

/**
 * Parse a HIGH-CONFIDENCE inverter wattage from a kit name — only an explicit
 * "...W inverter" / "N.NkW inverter" token, never a bare solar/system figure
 * (those routinely get misread as inverter power). Returns null when unsure,
 * so the audit only flags mismatches it's confident about.
 */
function inverterWattsFromName(name: string): number | null {
  let m = name.match(/(\d+(?:,\d{3})*)\s*[Ww](?!h)\s*(?:pure\s+sine\s+)?[Ii]nverter/);
  if (m) return parseInt(m[1].replace(/,/g, ""), 10);
  m = name.match(/(\d+(?:\.\d+)?)\s*kW(?!h)\s*[Ii]nverter/i);
  if (m) return Math.round(parseFloat(m[1]) * 1000);
  return null;
}

interface KitFlag {
  slug: string;
  brand: string;
  name: string;
  flags: string[];
  severity: "high" | "medium" | "low";
}

function audit(): KitFlag[] {
  const kits: Kit[] = JSON.parse(fs.readFileSync(KITS_PATH, "utf-8"));
  const result: KitFlag[] = [];

  for (const kit of kits) {
    const flags: string[] = [];

    if (!kit.listedPrice || kit.listedPrice <= 0) {
      flags.push("no-listed-price");
    }

    if (!kit.included || Object.keys(kit.included).length === 0) {
      flags.push("empty-included");
    }

    if (!kit.priceHistory || kit.priceHistory.length < 2) {
      flags.push("insufficient-price-history");
    }

    const hasWorkingOffer =
      (kit.offers && kit.offers.some((o) => o.sourceUrl && o.price && o.price > 0)) ||
      Boolean(kit.sourceUrl && kit.listedPrice && kit.listedPrice > 0);
    if (!hasWorkingOffer) {
      flags.push("no-working-offer");
    }

    if (!kit.items || kit.items.length === 0) {
      flags.push("empty-items");
    }

    // ── Inverter spec sanity (parser bugs: ~1000x inflation + comma truncation) ──
    const inv = kit.inverterWatts ?? 0;
    const nameInv = inverterWattsFromName(kit.name);
    if (inv > MAX_PLAUSIBLE_INVERTER_W) {
      flags.push("inverter-outlier-high");
    } else if (nameInv !== null && inv > 0 && inv > nameInv * 1.5) {
      // Stored materially exceeds the inverter wattage stated in the title.
      flags.push("inverter-inflated-vs-title");
    } else if (nameInv !== null && (inv === 0 || inv < nameInv * 0.6)) {
      // Title clearly states an inverter wattage the stored value undershoots —
      // the hallmark of the uncommaed-thousands truncation bug.
      flags.push("inverter-truncated-vs-title");
    }

    if (flags.length === 0) continue;

    const severity: "high" | "medium" | "low" =
      flags.includes("no-listed-price") ||
      flags.includes("no-working-offer") ||
      flags.includes("inverter-outlier-high")
        ? "high"
        : flags.includes("empty-included") ||
            flags.includes("empty-items") ||
            flags.includes("inverter-inflated-vs-title") ||
            flags.includes("inverter-truncated-vs-title")
          ? "medium"
          : "low";

    result.push({
      slug: kit.slug,
      brand: kit.brand,
      name: kit.name,
      flags,
      severity,
    });
  }

  return result;
}

function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const flags = audit();
  flags.sort((a, b) => {
    const order = { high: 0, medium: 1, low: 2 };
    return order[a.severity] - order[b.severity];
  });

  const summary = {
    generatedAt: new Date().toISOString(),
    totalKits: JSON.parse(fs.readFileSync(KITS_PATH, "utf-8")).length,
    flaggedKits: flags.length,
    byFlag: {} as Record<string, number>,
    bySeverity: { high: 0, medium: 0, low: 0 },
    kits: flags,
  };
  for (const k of flags) {
    summary.bySeverity[k.severity]++;
    for (const f of k.flags) {
      summary.byFlag[f] = (summary.byFlag[f] || 0) + 1;
    }
  }

  fs.writeFileSync(OUT_PATH, JSON.stringify(summary, null, 2));
  console.log(`Kit data quality audit: ${flags.length}/${summary.totalKits} flagged`);
  console.log(`  High: ${summary.bySeverity.high}, Medium: ${summary.bySeverity.medium}, Low: ${summary.bySeverity.low}`);
  console.log(`  By flag:`, summary.byFlag);
  console.log(`  Report: ${OUT_PATH}`);
  console.log(`  This report is REVIEW ONLY. No automated noindex applied.`);
}

main();
