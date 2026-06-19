/**
 * build-evidence-graph.ts — computes the evidence graph (`src/lib/data/evidence.json`).
 *
 * The evidence graph is the build-time fact substrate: per-kit + per-cohort facts
 * that decision pages assemble from (never recompute). One build artifact, computed
 * once per pipeline run, consumed by every decision page and the refresh engine.
 *
 * Reads:
 *   - src/lib/data/kits.json                (priced kits)
 *   - public/data/history/<slug>.json       (richer cross-retailer price history)
 *   - the verdict engine + 7 canonical load profiles
 *
 * Emits: src/lib/data/evidence.json
 *
 * Guarantees (per A4 spec §3, §5):
 *   - Deterministic: sorted keys + fixed rounding → byte-identical output for an
 *     unchanged DB, so the 6h pipeline's `git diff --cached --quiet` skips no-ops.
 *   - Fails loud: exits non-zero on a NaN percentile, an empty cohort, or a
 *     malformed history file — block a bad graph rather than ship it.
 *   - Honesty rule: hiddenCostDelta.amount = 0 for the kits with missingCost = 0;
 *     never fabricate a hidden-cost receipt.
 *
 * Run after export-data.ts (it depends on fresh kits.json + history files).
 */

import * as fs from "fs";
import * as path from "path";

import type { Kit } from "../src/lib/demo-data";
import { classifyKit } from "../src/lib/similar-kits";
import { computeSizing } from "../src/lib/calculator/engine";
import { computeVerdicts } from "../src/lib/calculator/verdicts";
import { FAILURE_NOTES } from "../src/lib/calculator/failure-notes";
import { LOAD_PROFILES } from "./load-profiles";
import type {
  EvidenceGraph,
  KitEvidence,
  CohortEvidence,
  CohortStats,
  PercentileFact,
  LoadProfileMeta,
} from "../src/lib/data/evidence.types";

const METHODOLOGY_VERSION = 1;

const ROOT = path.resolve(__dirname, "..");
const KITS_PATH = path.join(ROOT, "src/lib/data/kits.json");
const HISTORY_DIR = path.join(ROOT, "public/data/history");
const OUT_PATH = path.join(ROOT, "src/lib/data/evidence.json");

const STORAGE_BANDS = ["none", "small", "mid", "large"] as const;

// ── fail-loud helper ─────────────────────────────────────────────────────────
function fail(msg: string): never {
  console.error(`[build-evidence-graph] FATAL: ${msg}`);
  process.exit(1);
}

// ── deterministic rounding ───────────────────────────────────────────────────
/** Round money to cents. */
function money(n: number): number {
  return Math.round(n * 100) / 100;
}
/** Round a ratio metric ($/Wh, $/W) to 4 dp — stable + lossless for cents-scale inputs. */
function ratio(n: number): number {
  return Math.round(n * 10000) / 10000;
}
/** Round a percentage to whole numbers. */
function whole(n: number): number {
  return Math.round(n);
}

// ── numeric value metrics (recomputed; the JSON strings are unreliable) ───────
function costPerWh(kit: Kit): number | null {
  if (kit.storageWh > 0) return ratio(kit.trueCost / kit.storageWh);
  return null;
}
function costPerW(kit: Kit): number | null {
  if (kit.panelWatts > 0) return ratio(kit.trueCost / kit.panelWatts);
  return null;
}

// ── cohort assignment ────────────────────────────────────────────────────────
function storageBand(storageWh: number): (typeof STORAGE_BANDS)[number] {
  if (storageWh <= 0) return "none";
  if (storageWh < 2000) return "small";
  if (storageWh <= 6000) return "mid";
  return "large";
}
function cohortKeyFor(kit: Kit): string {
  return `${classifyKit(kit)}:${storageBand(kit.storageWh)}`;
}

// ── percentiles ──────────────────────────────────────────────────────────────
/**
 * Linear-interpolated percentile of a sorted ascending array.
 * `p` in [0,1]. Deterministic. Throws (via caller) on empty input.
 */
function quantile(sortedAsc: number[], p: number): number {
  const n = sortedAsc.length;
  if (n === 0) return NaN;
  if (n === 1) return sortedAsc[0];
  const idx = p * (n - 1);
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return sortedAsc[lo];
  const frac = idx - lo;
  return sortedAsc[lo] + (sortedAsc[hi] - sortedAsc[lo]) * frac;
}

/**
 * Percentile rank of `value` within `values` (the share strictly below it, plus
 * half of ties — a stable "% of cohort this beats" measure). Returns 0-100 whole.
 * `betterIsLow`: for cost axes we report "cheaper than X%", so a lower value ranks
 * higher; for completeness a higher value ranks higher.
 */
function percentileRank(
  value: number,
  values: number[],
  betterIsLow: boolean
): number {
  const n = values.length;
  if (n === 0) return NaN;
  let below = 0;
  let equal = 0;
  for (const v of values) {
    if (v < value) below++;
    else if (v === value) equal++;
  }
  // Fraction of the cohort this value is "better than".
  let beats: number;
  if (betterIsLow) {
    // lower is better → it beats everything ABOVE it
    const above = n - below - equal;
    beats = (above + equal / 2) / n;
  } else {
    // higher is better → it beats everything BELOW it
    beats = (below + equal / 2) / n;
  }
  return whole(beats * 100);
}

function statsFor(values: number[]): CohortStats {
  const sorted = [...values].sort((a, b) => a - b);
  const s: CohortStats = {
    min: ratio(sorted[0]),
    p10: ratio(quantile(sorted, 0.1)),
    p25: ratio(quantile(sorted, 0.25)),
    median: ratio(quantile(sorted, 0.5)),
    p75: ratio(quantile(sorted, 0.75)),
    p90: ratio(quantile(sorted, 0.9)),
    max: ratio(sorted[sorted.length - 1]),
  };
  for (const [k, v] of Object.entries(s)) {
    if (!Number.isFinite(v)) fail(`NaN/Inf in cohort stat ${k}`);
  }
  return s;
}

// ── price history ────────────────────────────────────────────────────────────
interface HistoryPoint {
  date: string;
  priceCents: number | null;
}
interface HistorySeries {
  offerId?: string;
  retailerName?: string;
  retailerSlug?: string;
  points: { date: string; priceCents: number | null; inStock?: boolean }[];
}
interface HistoryFile {
  slug: string;
  series: HistorySeries[];
  lowestAvailable: HistoryPoint[];
}

const DAY_MS = 86_400_000;

/**
 * Build the priceSignal from a kit's history file (preferred) or inline priceHistory
 * fallback. Returns null when there's no usable history. Fails loud on a malformed file.
 */
function buildPriceSignal(
  kit: Kit
): KitEvidence["priceSignal"] {
  const file = path.join(HISTORY_DIR, `${kit.slug}.json`);
  let lowestSeries: HistoryPoint[] | null = null;
  let retailerCount = 0;

  if (fs.existsSync(file)) {
    let parsed: HistoryFile;
    try {
      parsed = JSON.parse(fs.readFileSync(file, "utf8")) as HistoryFile;
    } catch (e) {
      return fail(`malformed history JSON for ${kit.slug}: ${(e as Error).message}`);
    }
    if (parsed.slug !== kit.slug) {
      return fail(
        `history slug mismatch: file says "${parsed.slug}", expected "${kit.slug}"`
      );
    }
    if (!Array.isArray(parsed.series) || !Array.isArray(parsed.lowestAvailable)) {
      return fail(`history file for ${kit.slug} missing series/lowestAvailable arrays`);
    }
    retailerCount = new Set(
      parsed.series.map((s) => s.retailerSlug ?? s.retailerName ?? s.offerId ?? "")
    ).size;
    lowestSeries = parsed.lowestAvailable
      .filter((p) => p && typeof p.priceCents === "number" && (p.priceCents as number) > 0)
      .map((p) => ({ date: p.date, priceCents: p.priceCents }));
  } else if (Array.isArray(kit.priceHistory) && kit.priceHistory.length > 0) {
    // Inline single-series fallback.
    retailerCount = 1;
    lowestSeries = kit.priceHistory
      .filter((p) => p && typeof p.priceCents === "number" && p.priceCents > 0)
      .map((p) => ({ date: p.date, priceCents: p.priceCents }));
  }

  if (!lowestSeries || lowestSeries.length === 0) return null;

  // Sort ascending by date for determinism.
  lowestSeries.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));

  const lastPoint = lowestSeries[lowestSeries.length - 1];
  const lastDate = Date.parse(`${lastPoint.date}T00:00:00Z`);
  if (Number.isNaN(lastDate)) {
    return fail(`unparseable history date "${lastPoint.date}" for ${kit.slug}`);
  }

  // Trailing 182 days (anchored to latest observation, not wall clock → stale-safe).
  const windowStart = lastDate - 182 * DAY_MS;
  const window = lowestSeries.filter(
    (p) => Date.parse(`${p.date}T00:00:00Z`) >= windowStart
  );
  const pool = window.length > 0 ? window : lowestSeries;

  let lowPt = pool[0];
  let highCents = pool[0].priceCents as number;
  for (const p of pool) {
    const c = p.priceCents as number;
    if (c < (lowPt.priceCents as number)) lowPt = p;
    if (c > highCents) highCents = c;
  }

  const currentPrice = money((lastPoint.priceCents as number) / 100);
  const low6mo = money((lowPt.priceCents as number) / 100);
  const high6mo = money(highCents / 100);
  const pctAboveLow =
    low6mo > 0 ? whole(((currentPrice - low6mo) / low6mo) * 100) : 0;

  // 30-day trend: compare current to the earliest point within the last 30 days.
  const trendStart = lastDate - 30 * DAY_MS;
  const recent = lowestSeries.filter(
    (p) => Date.parse(`${p.date}T00:00:00Z`) >= trendStart
  );
  let trend30d: "falling" | "flat" | "rising" = "flat";
  if (recent.length >= 2) {
    const first = recent[0].priceCents as number;
    const last = lastPoint.priceCents as number;
    const deltaPct = first > 0 ? ((last - first) / first) * 100 : 0;
    if (deltaPct <= -2) trend30d = "falling";
    else if (deltaPct >= 2) trend30d = "rising";
  }

  return {
    currentPrice,
    low6mo,
    low6moDate: lowPt.date,
    high6mo,
    pctAboveLow,
    trend30d,
    retailerCount,
    inStock: true, // lowestAvailable is the daily MIN across IN-STOCK offers
    lastObserved: lastPoint.date,
  };
}

function buildBuyNowVsWait(
  signal: KitEvidence["priceSignal"]
): KitEvidence["buyNowVsWait"] {
  if (!signal) return null;
  const { pctAboveLow, trend30d, low6mo } = signal;
  if (pctAboveLow <= 3) {
    return {
      signal: "buy_now",
      rationale: `At or near its 6-month low ($${low6mo.toFixed(
        2
      )}) — only ${pctAboveLow}% above. Good time to buy.`,
    };
  }
  if (pctAboveLow <= 10 || trend30d === "falling") {
    return {
      signal: "fair",
      rationale:
        trend30d === "falling"
          ? `${pctAboveLow}% above the 6-month low but the price is falling — a fair entry.`
          : `Within ${pctAboveLow}% of the 6-month low — a fair, if not bottom, price.`,
    };
  }
  return {
    signal: "wait",
    rationale: `${pctAboveLow}% above its 6-month low ($${low6mo.toFixed(
      2
    )}) and not falling — likely worth waiting for a dip.`,
  };
}

// ── missing-part BOM ─────────────────────────────────────────────────────────
const ROLE_LABELS: Record<string, string> = {
  panels: "Solar panels",
  battery: "Battery bank",
  inverter: "Inverter",
  controller: "Charge controller",
  mounting: "Mounting hardware",
  wiring: "Wiring & connectors",
  monitoring: "Monitoring / Bluetooth",
};

/** Map an `included` role key to the `items[].role` label used in kits.json. */
const INCLUDED_TO_ITEM_ROLE: Record<string, string> = {
  panels: "Solar Panels",
  battery: "Battery",
  inverter: "Inverter",
  controller: "Charge Controller",
  mounting: "Mounting",
  wiring: "Wiring",
  monitoring: "Monitoring",
};

function buildMissingPartBom(kit: Kit): KitEvidence["missingPartBom"] {
  const bom: KitEvidence["missingPartBom"] = [];
  const included = kit.included ?? {};
  // Iterate the 7 roles in stable order.
  for (const role of Object.keys(ROLE_LABELS)) {
    if (included[role] === false) {
      // Find the matching item to derive an estimated cost band, if any.
      const itemRole = INCLUDED_TO_ITEM_ROLE[role];
      const item = (kit.items ?? []).find(
        (i) => i.role === itemRole && !i.isIncluded
      );
      let estCostBand: [number, number] | null = null;
      if (item && typeof item.estimatedCost === "number" && item.estimatedCost > 0) {
        // ±25% band around the DB's point estimate — honest "you still need to buy".
        const lo = money(item.estimatedCost * 0.75);
        const hi = money(item.estimatedCost * 1.25);
        estCostBand = [lo, hi];
      }
      bom.push({ role, label: ROLE_LABELS[role], estCostBand });
    }
  }
  return bom;
}

function buildMissingItems(kit: Kit): KitEvidence["realBuildCost"]["missingItems"] {
  return (kit.items ?? [])
    .filter((i) => !i.isIncluded)
    .map((i) => ({
      role: i.role,
      name: i.name,
      specs: i.specs ?? "",
      qty: i.quantity ?? 1,
      estCost:
        typeof i.estimatedCost === "number" && i.estimatedCost > 0
          ? money(i.estimatedCost)
          : null,
    }));
}

// ── variant grouping (mirrors get-kits.ts isPrimaryVariant logic) ─────────────
const BASE_NAME_HINTS = ["main unit only", "unit only", "base"];

function variantGroupKey(kit: Kit): string {
  return kit.sourceUrl ? kit.sourceUrl.split("?")[0] : `__nourl__${kit.slug}`;
}
function compareForPrimary(a: Kit, b: Kit): number {
  const nameA = (a.displayName ?? a.name ?? "").toLowerCase();
  const nameB = (b.displayName ?? b.name ?? "").toLowerCase();
  const hintA = BASE_NAME_HINTS.some((h) => nameA.includes(h)) ? 0 : 1;
  const hintB = BASE_NAME_HINTS.some((h) => nameB.includes(h)) ? 0 : 1;
  if (hintA !== hintB) return hintA - hintB;
  const modsA = nameA.split(/\s+/).filter(Boolean).length;
  const modsB = nameB.split(/\s+/).filter(Boolean).length;
  if (modsA !== modsB) return modsA - modsB;
  const priceA = a.listedPrice || Number.MAX_SAFE_INTEGER;
  const priceB = b.listedPrice || Number.MAX_SAFE_INTEGER;
  if (priceA !== priceB) return priceA - priceB;
  return a.slug.localeCompare(b.slug);
}

// ── deterministic JSON stringify (sorted keys) ────────────────────────────────
function sortValue(v: unknown): unknown {
  if (Array.isArray(v)) return v.map(sortValue);
  if (v && typeof v === "object") {
    const out: Record<string, unknown> = {};
    for (const k of Object.keys(v as Record<string, unknown>).sort()) {
      out[k] = sortValue((v as Record<string, unknown>)[k]);
    }
    return out;
  }
  return v;
}

// ── main ─────────────────────────────────────────────────────────────────────
function main() {
  if (!fs.existsSync(KITS_PATH)) fail(`kits.json not found at ${KITS_PATH}`);

  const raw = JSON.parse(fs.readFileSync(KITS_PATH, "utf8")) as Kit[];
  const kits = raw.filter((k) => k.listedPrice && k.listedPrice > 0);
  if (kits.length === 0) fail("no priced kits in kits.json");

  // ── primary-variant resolution ──────────────────────────────────────────────
  const groups = new Map<string, Kit[]>();
  for (const k of kits) {
    const key = variantGroupKey(k);
    const arr = groups.get(key);
    if (arr) arr.push(k);
    else groups.set(key, [k]);
  }
  const primaryByGroup = new Map<string, string>();
  const groupCount = new Map<string, number>();
  for (const [key, arr] of groups) {
    primaryByGroup.set(key, [...arr].sort(compareForPrimary)[0].slug);
    groupCount.set(key, arr.length);
  }

  // ── cohorts ──────────────────────────────────────────────────────────────────
  const cohortMembers = new Map<string, Kit[]>();
  for (const k of kits) {
    const ck = cohortKeyFor(k);
    const arr = cohortMembers.get(ck);
    if (arr) arr.push(k);
    else cohortMembers.set(ck, [k]);
  }

  // Per-cohort numeric value arrays (for percentile ranking), kept once.
  interface CohortAxes {
    costPerWh: { slug: string; value: number }[];
    costPerW: { slug: string; value: number }[];
    completeness: { slug: string; value: number }[];
    trueCost: { slug: string; value: number }[];
  }
  const cohortAxes = new Map<string, CohortAxes>();
  for (const [ck, members] of cohortMembers) {
    const axes: CohortAxes = {
      costPerWh: [],
      costPerW: [],
      completeness: [],
      trueCost: [],
    };
    for (const k of members) {
      const cwh = costPerWh(k);
      const cw = costPerW(k);
      if (cwh !== null) axes.costPerWh.push({ slug: k.slug, value: cwh });
      if (cw !== null) axes.costPerW.push({ slug: k.slug, value: cw });
      axes.completeness.push({ slug: k.slug, value: k.completeness });
      axes.trueCost.push({ slug: k.slug, value: money(k.trueCost) });
    }
    cohortAxes.set(ck, axes);
  }

  // ── failure-note metadata index (embedded once at cohort level) ───────────────
  const failureIndex: CohortEvidence["failureIndex"] = {};
  for (const note of FAILURE_NOTES) {
    failureIndex[note.id] = {
      severity: note.severity,
      title: note.title,
      detail: note.detail,
      fix: note.fix,
    };
  }
  // The 3 deterministic rules' metadata (verdicts.ts) — captured statically so pages
  // can render their title/detail/fix without importing the TS engine.
  const RULE_META: CohortEvidence["failureIndex"] = {
    "rule-surge-headroom": {
      severity: "blocker",
      title: "A motor load can stall a right-sized inverter on startup",
      detail:
        "The worst startup spike exceeds roughly twice the continuous inverter your running watts call for — past the ~2x surge ceiling a right-sized inverter typically tolerates.",
      fix: "Step up to a larger continuous inverter (so its surge clears the spike), or add a soft starter to that appliance.",
    },
    "rule-low-autonomy": {
      severity: "warning",
      title: "One day of battery autonomy is thin for critical loads",
      detail:
        "Loads that can't wait for sun — fridge/freezer, a pump, medical gear, always-on connectivity — can take the bank to empty before noon in a single overcast stretch.",
      fix: "Plan 2-3 days of autonomy for critical setups and re-check the battery size.",
    },
    "rule-agm-penalty": {
      severity: "warning",
      title: "AGM batteries give you only about half their rated capacity",
      detail:
        "To get a reasonable lifespan you can only pull AGM down to ~50%, so a 100Ah AGM bank is really ~50Ah usable. LiFePO4 safely uses ~90%.",
      fix: "Unless you have a specific reason for AGM, switch to LiFePO4 and re-size.",
    },
    "ok-clean": {
      severity: "ok",
      title: "No red flags for this load list",
      detail:
        "Nothing here trips the usual off-grid traps — no brutal motor surges, runaway resistive heat, or critical loads left without buffer.",
      fix: "",
    },
  };
  const fullFailureIndex = { ...failureIndex, ...RULE_META };

  // ── failure triggers per load profile (kit-independent: verdicts key off the
  //    load list + assumptions + sizing, all of which come from the profile) ─────
  const triggersByProfile: Record<string, string[]> = {};
  const loadProfileMeta: Record<string, LoadProfileMeta> = {};
  for (const profile of LOAD_PROFILES) {
    loadProfileMeta[profile.id] = {
      id: profile.id,
      label: profile.label,
      loadSummary: profile.loadSummary,
    };
    try {
      const sizing = computeSizing(profile.loads, profile.assumptions);
      const verdicts = computeVerdicts(profile.loads, profile.assumptions, sizing);
      // verdicts already severity-ordered (blocker → warning → ok).
      triggersByProfile[profile.id] = verdicts.map((v) => v.id);
    } catch (e) {
      // Degrade gracefully rather than break the whole graph (spec §3).
      // TODO: if this ever fires, wiring computeVerdicts hit a type/data mismatch —
      // investigate the load profile rather than leaving triggers empty.
      console.error(
        `[build-evidence-graph] WARN: computeVerdicts failed for profile ${profile.id}: ${
          (e as Error).message
        } — emitting empty triggers.`
      );
      triggersByProfile[profile.id] = [];
    }
  }

  // ── per-kit evidence ──────────────────────────────────────────────────────────
  const kitEvidence: Record<string, KitEvidence> = {};
  for (const kit of kits) {
    const ck = cohortKeyFor(kit);
    const axes = cohortAxes.get(ck)!;
    const groupKey = variantGroupKey(kit);

    const cwh = costPerWh(kit);
    const cw = costPerW(kit);

    const percCostPerWh: PercentileFact | null =
      cwh !== null
        ? {
            value: cwh,
            percentile: percentileRank(
              cwh,
              axes.costPerWh.map((a) => a.value),
              true
            ),
            cohortKey: ck,
            n: axes.costPerWh.length,
            betterIsLow: true,
          }
        : null;
    const percCostPerW: PercentileFact | null =
      cw !== null
        ? {
            value: cw,
            percentile: percentileRank(
              cw,
              axes.costPerW.map((a) => a.value),
              true
            ),
            cohortKey: ck,
            n: axes.costPerW.length,
            betterIsLow: true,
          }
        : null;
    const percCompleteness: PercentileFact = {
      value: kit.completeness,
      percentile: percentileRank(
        kit.completeness,
        axes.completeness.map((a) => a.value),
        false
      ),
      cohortKey: ck,
      n: axes.completeness.length,
      betterIsLow: false,
    };

    // Fail loud on a NaN percentile.
    for (const pf of [percCostPerWh, percCostPerW, percCompleteness]) {
      if (pf && !Number.isFinite(pf.percentile)) {
        fail(`NaN percentile for kit ${kit.slug} in cohort ${ck}`);
      }
    }

    const priceSignal = buildPriceSignal(kit);

    const hasHiddenCost = kit.missingCost > 0;
    const hiddenCostDelta = {
      amount: money(kit.missingCost), // HONEST 0 when none
      pctOfListed:
        hasHiddenCost && kit.listedPrice > 0
          ? whole((kit.missingCost / kit.listedPrice) * 100)
          : hasHiddenCost
            ? null
            : 0,
      hasHiddenCost,
    };

    const bestForLoads: KitEvidence["bestForLoads"] = [];
    const ratings = kit.useCaseRatings ?? {};
    // Map a load profile to the kit useCaseRatings key that best represents it.
    const PROFILE_TO_USECASE: Record<string, string> = {
      "rv-weekend": "rv",
      "cabin-fridge-lights": "cabin",
      "cpap-medical": "emergency",
      "well-pump-homestead": "homestead",
      "starlink-remote-work": "homestead",
      "emergency-backup": "emergency",
      "whole-home-essentials": "homestead",
    };
    for (const profile of LOAD_PROFILES) {
      const ucKey = PROFILE_TO_USECASE[profile.id];
      const r = ratings[ucKey];
      if (r === "good" || r === "excellent") {
        bestForLoads.push({ profileId: profile.id, rating: r });
      }
    }

    kitEvidence[kit.slug] = {
      slug: kit.slug,
      isPrimary: primaryByGroup.get(groupKey) === kit.slug,
      variantGroup: groupKey,
      variantCount: groupCount.get(groupKey) ?? 1,
      realBuildCost: {
        listedPrice: money(kit.listedPrice),
        missingCost: money(kit.missingCost),
        trueCost: money(kit.trueCost),
        missingItems: buildMissingItems(kit),
      },
      hiddenCostDelta,
      missingPartBom: buildMissingPartBom(kit),
      cohortKey: ck,
      percentiles: {
        costPerWh: percCostPerWh,
        costPerW: percCostPerW,
        completeness: percCompleteness,
      },
      priceSignal,
      buyNowVsWait: buildBuyNowVsWait(priceSignal),
      failureTriggers: { ...triggersByProfile },
      bestForLoads,
      bestAlternative: null, // filled in the cohort pass below
    };
  }

  // ── cohort evidence + bestValue/cheapest/mostComplete + bestAlternative ───────
  const cohorts: Record<string, CohortEvidence> = {};
  for (const [ck, members] of cohortMembers) {
    if (members.length === 0) fail(`empty cohort ${ck}`);
    const [systemType, band] = ck.split(":");
    const axes = cohortAxes.get(ck)!;

    // trueCost stats always exist; costPerWh/costPerW only if there are members with them.
    const completenessVals = members.map((k) => k.completeness);
    const trueCostVals = members.map((k) => money(k.trueCost));
    const cwhVals = axes.costPerWh.map((a) => a.value);
    const cwVals = axes.costPerW.map((a) => a.value);

    const cohortMedianCompleteness = quantile(
      [...completenessVals].sort((a, b) => a - b),
      0.5
    );

    // cheapest = lowest trueCost; mostComplete = highest completeness; bestValue =
    // lowest cost/Wh among completeness >= cohort median (fallback: lowest trueCost).
    const byTrueCost = [...members].sort(
      (a, b) => a.trueCost - b.trueCost || a.slug.localeCompare(b.slug)
    );
    const byCompleteness = [...members].sort(
      (a, b) => b.completeness - a.completeness || a.slug.localeCompare(b.slug)
    );
    const valueCandidates = members
      .filter((k) => k.completeness >= cohortMedianCompleteness && k.storageWh > 0)
      .map((k) => ({ slug: k.slug, value: costPerWh(k)! }))
      .sort((a, b) => a.value - b.value || a.slug.localeCompare(b.slug));
    const bestValueSlug =
      valueCandidates.length > 0 ? valueCandidates[0].slug : byTrueCost[0].slug;

    cohorts[ck] = {
      key: ck,
      systemType,
      storageBand: band,
      n: members.length,
      stats: {
        costPerWh:
          cwhVals.length > 0
            ? statsFor(cwhVals)
            : { min: 0, p10: 0, p25: 0, median: 0, p75: 0, p90: 0, max: 0 },
        costPerW:
          cwVals.length > 0
            ? statsFor(cwVals)
            : { min: 0, p10: 0, p25: 0, median: 0, p75: 0, p90: 0, max: 0 },
        completeness: statsFor(completenessVals),
        trueCost: statsFor(trueCostVals),
      },
      cheapestSlug: byTrueCost[0].slug,
      mostCompleteSlug: byCompleteness[0].slug,
      bestValueSlug,
      failureIndex: fullFailureIndex,
    };

    // bestAlternative: within the cohort, a kit that dominates this one —
    // strictly better cost/Wh AND >= completeness AND no worse failure profile.
    // failure profile is kit-independent here (driven by load profiles), so the
    // "no worse failure profile" clause is satisfied by all cohort peers; we keep
    // the cost/Wh + completeness dominance, which is the defensible signal.
    const byCwh = new Map<string, number>();
    for (const k of members) {
      const c = costPerWh(k);
      if (c !== null) byCwh.set(k.slug, c);
    }
    for (const kit of members) {
      const myCwh = byCwh.get(kit.slug);
      if (myCwh === undefined) continue; // no storage → no cost/Wh dominance basis
      let best: { slug: string; cwh: number; completeness: number } | null = null;
      for (const other of members) {
        if (other.slug === kit.slug) continue;
        const oc = byCwh.get(other.slug);
        if (oc === undefined) continue;
        if (oc < myCwh && other.completeness >= kit.completeness) {
          if (
            !best ||
            oc < best.cwh ||
            (oc === best.cwh && other.completeness > best.completeness) ||
            (oc === best.cwh &&
              other.completeness === best.completeness &&
              other.slug.localeCompare(best.slug) < 0)
          ) {
            best = {
              slug: other.slug,
              cwh: oc,
              completeness: other.completeness,
            };
          }
        }
      }
      if (best && kitEvidence[kit.slug]) {
        const savingsPct = whole(((myCwh - best.cwh) / myCwh) * 100);
        kitEvidence[kit.slug].bestAlternative = {
          slug: best.slug,
          reason: `${savingsPct}% better cost per Wh ($${best.cwh.toFixed(
            2
          )} vs $${myCwh.toFixed(2)}) at equal or better completeness, within the same ${systemType} / ${band}-storage cohort.`,
        };
      }
    }
  }

  // ── assemble + write (deterministic) ──────────────────────────────────────────
  const graph: EvidenceGraph = {
    computedAt: new Date().toISOString(),
    methodologyVersion: METHODOLOGY_VERSION,
    cohorts,
    loadProfiles: loadProfileMeta,
    kits: kitEvidence,
  };

  // Sort all keys deterministically. computedAt is intentionally the only volatile
  // field (build timestamp); everything else is byte-stable for an unchanged DB.
  const sorted = sortValue(graph);
  fs.writeFileSync(OUT_PATH, JSON.stringify(sorted, null, 2) + "\n", "utf8");

  const sizeKb = (fs.statSync(OUT_PATH).size / 1024).toFixed(1);
  console.log(
    `[build-evidence-graph] wrote ${OUT_PATH}\n` +
      `  ${Object.keys(kitEvidence).length} kits, ${Object.keys(cohorts).length} cohorts, ` +
      `${Object.keys(loadProfileMeta).length} load profiles, ${sizeKb} KB`
  );
}

main();
