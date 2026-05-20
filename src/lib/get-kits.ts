/**
 * Kit data loader.
 * Reads from exported DB data (src/lib/data/kits.json) when available,
 * falls back to demo-data.ts for development.
 *
 * Run `npx tsx scripts/export-data.ts` to refresh from DB.
 */

import type { Kit, SystemType } from "./demo-data";
import { classifyKit } from "./similar-kits";

let _kits: Kit[] | null = null;

// ── Brand casing normalization ──────────────────────────────────────────────

const BRAND_CASING: Record<string, string> = {
  "ECO-WORTHY": "Eco-Worthy",
  "BLUETTI": "Bluetti",
  "HQST": "HQST",
};

function normalizeBrand(brand: string): string {
  return BRAND_CASING[brand] ?? brand;
}

// ── Title cleaning ──────────────────────────────────────────────────────────

const SHOP_SOLAR_TIERS = new Set(["PRIME", "SELECT", "ELITE", "CORE", "EDGE", "SUMMIT", "VECTOR"]);

const NOISE_PHRASES = [
  /\bPortable Power Stations?\b/gi,
  /\bPortable Power Statio\b/gi,
  /\bComplete Solar Generator Kit\b/gi,
  /\bComplete Solar Kit\b/gi,
  /\bComplete Grid-Tied Solar Kit\b/gi,
  /\bComplete Grid-Tied Kit\b/gi,
  /\bSolar Power Station\b/gi,
  /\bSolar Portable Power Station\b/gi,
  /\bModular Power Station\b/gi,
  /\bModular RV Solar System\b/gi,
  /\b120V Solar Kits\b/gi,
  /\b120V\s*\/?\s*240V Split Phase Solar Kits\b/gi,
  /\bBundle Options Available\b/gi,
  /\bChoose Your [\w\s]+/gi,
  /\bChoose Custom [\w\s]+/gi,
  /\b\d+-Year Warranty\b/gi,
  /\bUL\s*\d*\s*Certified\b/gi,
  /\bOff-Grid Ready\b/gi,
  /\bBudget-Friendly\b/gi,
  /\bCode Compliant\b/gi,
  /\bYour Custom\b/gi,
];

/**
 * Clean a raw kit title into a concise, brand-free display name.
 * Brand is stripped since it's shown separately in UI.
 */
function cleanTitle(raw: string, brand: string): string {
  // Shop Solar house brands get special handling
  if (SHOP_SOLAR_TIERS.has(brand)) {
    return cleanShopSolarHouseTitle(raw, brand);
  }

  let title = raw;

  // 1. Strip brand prefix (case-insensitive)
  const brandVariants = [brand, brand.toUpperCase(), brand.toLowerCase()];
  for (const v of brandVariants) {
    if (title.startsWith(v)) {
      title = title.slice(v.length).trim().replace(/^[-–—,\s]+/, "");
      break;
    }
  }

  // 2. Handle pipe-delimited titles (Shop Solar Anker/Bluetti/EcoFlow/Hysolis)
  if (title.includes(" | ")) {
    title = cleanPipeTitle(title);
  }
  // Handle dash-delimited variant titles (e.g., "...Kit - Variant Name")
  else if (title.includes(" - ") && title.length > 80) {
    title = cleanDashTitle(title);
  }

  // 3. Strip noise phrases
  for (const re of NOISE_PHRASES) {
    title = title.replace(re, "");
  }

  // 4. Clean bracket contents — extract model names, remove redundant brackets
  title = title.replace(/\[([^\]]+)\]/g, (full, inner) => {
    // If it's a tier label like [EDGE PLUS] or [PRIME MAX], strip entirely
    const words = inner.trim().split(/\s+/);
    if (words.every((w: string) => /^[A-Z0-9]+$/.test(w))) {
      return inner.trim() + " ";
    }
    return full;
  });

  // 5. Normalize "N x 200W" patterns (but not model suffixes like "6000XP")
  title = title.replace(/\b1\s+x\s+/gi, "");
  title = title.replace(/\b(\d+)\s+x\s+/gi, "$1×");

  // 6. Simplify "with" phrases for Amazon titles
  title = title.replace(/\bwith\b/gi, "—").replace(/—\s*—/g, "—");

  // 7. Clean up redundant "Solar" before Panel/Kit
  title = title.replace(/\bSolar Panel Kit\b/g, "Panel Kit");
  title = title.replace(/\bSolar Kit\b/g, "Kit");
  title = title.replace(/\bSolar Cabin Kit\b/g, "Cabin Kit");
  title = title.replace(/\bSolar Starter Kit\b/g, "Starter Kit");
  title = title.replace(/\bSolar Panel\b/g, "Panel");
  title = title.replace(/\bSolar Panels\b/g, "Panels");
  title = title.replace(/\bMonocrystalline\b/gi, "Mono");

  // 8. Fix double-plus ("+ +") and orphaned punctuation
  title = title.replace(/\+\s*\+/g, "+");
  title = title.replace(/\|\s*\|/g, "|");

  // 9. Collapse whitespace and trim
  title = title.replace(/\s+/g, " ").trim();
  title = title.replace(/^[-–—|,+\s]+/, "").replace(/[-–—|,+\s]+$/, "");

  // 10. Truncate if still too long
  if (title.length > 80) {
    const cut = title.lastIndexOf(" ", 77);
    title = title.slice(0, cut > 40 ? cut : 77) + "…";
  }

  return title;
}

/**
 * Clean pipe-delimited titles (Anker, Bluetti, Hysolis, EcoFlow from Shop Solar).
 * Pattern: "Model Stuff | Marketing | Marketing | ... - Variant Config"
 */
function cleanPipeTitle(title: string): string {
  // Extract variant after last " - " (the bundle config)
  let variant = "";
  const dashIdx = title.lastIndexOf(" - ");
  if (dashIdx > 0) {
    variant = title.slice(dashIdx + 3).trim();
    title = title.slice(0, dashIdx).trim();
  }

  // Split on pipes, keep first segment (model + specs)
  const segments = title.split(/\s*\|\s*/);
  let core = segments[0].trim();

  // Extract Wh and W specs from other segments if not in core
  const whMatch = title.match(/([\d,]+)\s*Wh/);
  const wMatch = title.match(/([\d,]+)\s*W(?:\s|$|\))/);
  if (whMatch && !core.includes("Wh")) {
    core += ` ${whMatch[1]}Wh`;
  }
  if (wMatch && !core.includes(wMatch[0])) {
    // Only add W if not already captured by Wh
    const wVal = wMatch[1].replace(/,/g, "");
    if (!core.includes(`${wVal}W`)) {
      core += `/${wMatch[1]}W`;
    }
  }

  // Clean variant: extract panel info from brackets
  if (variant) {
    const panelMatch = variant.match(/\[(.+?)\]/);
    if (panelMatch) {
      let panelInfo = panelMatch[1]
        .replace(/\b1\s+x\s+/gi, "")
        .replace(/\b(\d+)\s*x\s*/gi, "$1×")
        .replace(/\bFolding\s*/gi, "Folding ")
        .replace(/\bRigid\s*/gi, "Rigid ")
        .replace(/\bSolar\s+/gi, "")
        .replace(/\bPanels?\b/gi, "Panel")
        .replace(/\s+/g, " ")
        .trim();
      // Pluralize if multiple panels
      if (/^\d+×/.test(panelInfo) && panelInfo.endsWith("Panel")) {
        panelInfo += "s";
      }
      core += ` + ${panelInfo}`;
    } else if (variant.toLowerCase().includes("main unit only")) {
      core += " (Unit Only)";
    } else if (variant.toLowerCase().includes("base")) {
      // Skip generic "Base" variant names
    }
  }

  return core;
}

/**
 * Clean dash-delimited long titles (some Shop Solar variants).
 */
function cleanDashTitle(title: string): string {
  const parts = title.split(/\s+-\s+/);
  // Usually first part is the meaningful one
  let core = parts[0];

  // Check if there's a useful variant at the end with brackets
  const last = parts[parts.length - 1];
  const panelMatch = last?.match(/\[(.+?)\]/);
  if (panelMatch) {
    const panelInfo = panelMatch[1]
      .replace(/\b1\s+x\s+/gi, "")
      .replace(/\b(\d+)\s*x\s*/gi, "$1×");
    core += ` + ${panelInfo}`;
  }

  return core;
}

/**
 * Clean Shop Solar house brand titles (PRIME/SELECT/ELITE/CORE/EDGE/SUMMIT/VECTOR).
 */
function cleanShopSolarHouseTitle(raw: string, brand: string): string {
  // Strip brand prefix
  let title = raw;
  if (title.startsWith(brand)) {
    title = title.slice(brand.length).trim();
  }

  // Extract tier level from [brackets] e.g., [PRIME PLUS], [SUMMIT MAX]
  // or from inline " - EDGE PLUS - " pattern
  let tierLevel = "";
  const bracketMatch = title.match(/\[([A-Z][A-Z\s]+)\]/);
  if (bracketMatch) {
    tierLevel = bracketMatch[1].replace(brand, "").trim();
  }
  if (!tierLevel) {
    // Look for "- BRAND LEVEL -" pattern (EDGE uses this)
    const inlineMatch = title.match(new RegExp(`-\\s*${brand}\\s+(\\w+)\\s*-`));
    if (inlineMatch) tierLevel = inlineMatch[1];
  }

  // Extract kW
  const kwMatch = title.match(/([\d.]+)\s*kW\b/);
  const kw = kwMatch ? kwMatch[1] : "";

  // Extract inverter model
  const parts = title.split(/\s+-\s+/);
  let inverter = "";
  for (const p of parts) {
    if (/inverter|microinverter/i.test(p)) {
      inverter = p
        .replace(/\s*Inverters?\s*/i, "")
        .replace(/\s*Microinverters?\s*/i, " Micro")
        .replace(/\bEnphase or APsystems\b/i, "Enphase/APsystems")
        .trim();
      break;
    }
  }

  // Extract specific battery kWh
  let batteryWh = "";
  const whMatches = title.match(/([\d.]+)\s*kWh/g);
  if (whMatches && whMatches.length > 1) {
    batteryWh = whMatches[whMatches.length - 1].trim();
  } else if (whMatches) {
    batteryWh = whMatches[0].trim();
  }

  // Normalize "3 x" to "3×"
  if (inverter) {
    inverter = inverter.replace(/\b(\d+)\s+x\s+/gi, "$1×");
  }

  // Extract racking type from variant (IronRidge, SkyRack HD, etc.)
  let racking = "";
  const rackMatch = title.match(/(?:IronRidge|SkyRack\s*HD)/i);
  if (rackMatch) racking = rackMatch[0];

  // Build clean title
  const tierStr = [tierLevel, kw ? `${kw}kW` : ""].filter(Boolean).join(" ");

  const detailParts: string[] = [];
  if (inverter) detailParts.push(inverter);
  if (batteryWh) detailParts.push(`${batteryWh} LiFePO4`);
  else if (title.toLowerCase().includes("no battery")) detailParts.push("No Battery");
  if (racking) detailParts.push(`+ ${racking}`);

  if (detailParts.length > 0) {
    return `${tierStr} — ${detailParts.join(", ")}`;
  }
  return tierStr || title.slice(0, 60);
}

// ── Variant panel extraction ───────────────────────────────────────────────

/**
 * Extract panel wattage from variant names like "[2 x 200W Folding Panel]"
 * or "+ 400W Anker PS400 Solar Panel". Returns null if no panel info found.
 */
function extractVariantPanelWatts(
  rawName: string
): { watts: number; count: number; description: string } | null {
  // Pattern 1: Bracket with count — [N x MW Folding/Rigid Panel]
  const bracketMulti = rawName.match(
    /\[(\d+)\s*[xX×]\s*(\d+)\s*W\s*(?:Folding|Rigid|Portable)?\s*(?:Solar\s*)?Panels?/i
  );
  if (bracketMulti) {
    const count = parseInt(bracketMulti[1], 10);
    const perPanel = parseInt(bracketMulti[2], 10);
    const type = /Folding/i.test(rawName)
      ? "Folding"
      : /Rigid/i.test(rawName)
        ? "Rigid"
        : "";
    const desc =
      count === 1
        ? `${perPanel}W ${type} Panel`.trim()
        : `${count}× ${perPanel}W ${type} Panels`.trim();
    return { watts: count * perPanel, count, description: desc };
  }

  // Pattern 2: Bracket single panel — [100W Folding Panel]
  const bracketSingle = rawName.match(
    /\[\s*(\d+)\s*W\s*(?:Folding|Rigid|Portable)\s*(?:Solar\s*)?Panels?/i
  );
  if (bracketSingle) {
    const perPanel = parseInt(bracketSingle[1], 10);
    const type = /Folding/i.test(rawName) ? "Folding" : "Rigid";
    return {
      watts: perPanel,
      count: 1,
      description: `${perPanel}W ${type} Panel`,
    };
  }

  // Pattern 3: Plus format — + 400W Anker PS400 Solar Panel
  const plusFormat = rawName.match(
    /\+\s*(\d+)\s*W\s+\w+[\w\s]*?(?:Solar\s+)?Panel/i
  );
  if (plusFormat) {
    const watts = parseInt(plusFormat[1], 10);
    return { watts, count: 1, description: `${watts}W Solar Panel` };
  }

  return null;
}

// ── Kit loading ─────────────────────────────────────────────────────────────

function loadKits(): Kit[] {
  if (_kits) return _kits;

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const data = require("./data/kits.json");
    _kits = (data as Kit[]).map((k) => {
      const brand = normalizeBrand(k.brand);
      const cleaned = cleanTitle(k.name, brand);
      const kit: Kit = {
        ...k,
        brand,
        name: cleaned,
        displayName: cleaned,
      };

      // Enrich variant kits that bundle panels but have panelWatts=0
      const variantPanel = extractVariantPanelWatts(k.name);
      if (variantPanel && kit.panelWatts === 0) {
        kit.panelWatts = variantPanel.watts;
        kit.included = { ...kit.included, panels: true };
        kit.items = kit.items.map((item) =>
          item.role === "Solar Panels" && !item.isIncluded
            ? {
                ...item,
                isIncluded: true,
                name: variantPanel.description,
                specs: `${variantPanel.watts}W total`,
                quantity: variantPanel.count,
              }
            : item
        );
        kit.costPerW = `$${(kit.trueCost / variantPanel.watts).toFixed(2)}`;
        const vals = Object.values(kit.included);
        kit.completeness = Math.round(
          (vals.filter(Boolean).length / vals.length) * 100
        );
      }

      kit.systemType = classifyKit(kit);
      return kit;
    });
  } catch {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { demoKits } = require("./demo-data");
    _kits = (demoKits as Kit[]).map((k) => ({
      ...k,
      displayName: k.displayName ?? k.name,
    }));
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

export function getKitsByType(type: SystemType): Kit[] {
  return getKits().filter((k) => k.systemType === type);
}

export function getKitVariants(slug: string): Kit[] {
  const kit = getKitBySlug(slug);
  if (!kit?.sourceUrl) return [];
  const base = kit.sourceUrl.split("?")[0];
  return getKits()
    .filter((k) => k.sourceUrl?.split("?")[0] === base && k.slug !== slug)
    .sort((a, b) => a.listedPrice - b.listedPrice);
}

// ── Variant consolidation (SEO) ─────────────────────────────────────────────
// Kit pages that share a product (same sourceUrl base) are near-duplicate
// configurations. We index ONE "primary" per group and noindex the rest to
// stop thin/duplicate-content demotion. The primary is the stable "base
// representative": prefer a base-config name hint, else the simplest config
// (fewest words), then lowest price, then slug for determinism. We deliberately
// do NOT pick by cheapest-first (prices thrash) or most-complete (biases to
// long-tail bundles).

const BASE_NAME_HINTS = ["main unit only", "unit only", "base"];

function variantGroupKey(kit: Kit): string {
  return kit.sourceUrl ? kit.sourceUrl.split("?")[0] : `__nourl__${kit.slug}`;
}

function compareForPrimary(a: Kit, b: Kit): number {
  const nameA = (a.displayName ?? a.name ?? "").toLowerCase();
  const nameB = (b.displayName ?? b.name ?? "").toLowerCase();
  const hintA = BASE_NAME_HINTS.some((h) => nameA.includes(h)) ? 0 : 1;
  const hintB = BASE_NAME_HINTS.some((h) => nameB.includes(h)) ? 0 : 1;
  if (hintA !== hintB) return hintA - hintB; // base-config hint wins
  const modsA = nameA.split(/\s+/).filter(Boolean).length;
  const modsB = nameB.split(/\s+/).filter(Boolean).length;
  if (modsA !== modsB) return modsA - modsB; // simplest config wins
  const priceA = a.listedPrice || Number.MAX_SAFE_INTEGER;
  const priceB = b.listedPrice || Number.MAX_SAFE_INTEGER;
  if (priceA !== priceB) return priceA - priceB; // lowest price tie-break
  return a.slug.localeCompare(b.slug); // deterministic final tie-break
}

let _primaryByGroup: Map<string, string> | null = null;

function primaryByGroup(): Map<string, string> {
  if (_primaryByGroup) return _primaryByGroup;
  const groups = new Map<string, Kit[]>();
  for (const k of getKits()) {
    const key = variantGroupKey(k);
    const arr = groups.get(key);
    if (arr) arr.push(k);
    else groups.set(key, [k]);
  }
  const map = new Map<string, string>();
  for (const [key, arr] of groups) {
    map.set(key, [...arr].sort(compareForPrimary)[0].slug);
  }
  _primaryByGroup = map;
  return map;
}

/** The primary (indexable) kit slug for the group `slug` belongs to. */
export function getPrimaryVariantSlug(slug: string): string | undefined {
  const kit = getKitBySlug(slug);
  if (!kit) return undefined;
  return primaryByGroup().get(variantGroupKey(kit));
}

/** True if this slug is the indexable primary for its variant group. */
export function isPrimaryVariant(slug: string): boolean {
  const kit = getKitBySlug(slug);
  if (!kit) return false;
  return primaryByGroup().get(variantGroupKey(kit)) === slug;
}

/** All indexable primary kit slugs (one per product group). */
export function getPrimaryKitSlugs(): string[] {
  return [...primaryByGroup().values()];
}

export function getKitCounts(): Record<SystemType, number> {
  const kits = getKits();
  return {
    portable: kits.filter((k) => k.systemType === "portable").length,
    "diy-kit": kits.filter((k) => k.systemType === "diy-kit").length,
    "whole-home": kits.filter((k) => k.systemType === "whole-home").length,
    "panels-only": kits.filter((k) => k.systemType === "panels-only").length,
  };
}
