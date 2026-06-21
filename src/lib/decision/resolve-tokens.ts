/**
 * Decision-guide token resolver — the single source of truth for numbers.
 *
 * Guide prose (answer, rationales, sections, FAQs…) must never hard-code a
 * number that also lives in the data, or the two drift (the price cron updates
 * kits.json/evidence.json every 6h but never the prose). Instead, prose carries
 * TOKENS that resolve, at build time, to the live value:
 *
 *   {p1.listedPrice}            → "$899"     (Nth podium pick, 1-based, kits.json)
 *   {p5.costPerWh}              → "$0.25/Wh"
 *   {p3.pctAboveLow}           → "11%"      (evidence.json)
 *   {kit:eco-worthy-200w-complete.missingCost} → "$0"  (any kit by slug)
 *   {guide.cohortHeadlineCount} → "160"
 *
 * Numbers that are genuinely editorial constants (cohort bounds, generic
 * thresholds) are wrapped so the lint can tell them apart from stale data:
 *
 *   [[const:$1,500]]            → "$1,500"
 *
 * Resolution FAILS LOUD: an unknown token, a missing pick/kit, or a required
 * field that is 0/missing throws at build time. A delisted kit that loses its
 * price becomes a build error instead of a silently-dropped podium row.
 */

import type { Kit } from "@/lib/demo-data";
import { getKitBySlug } from "@/lib/get-kits";
import { getBuyTiming } from "@/lib/decision/evidence";

export interface GuideTokenContext {
  /** Guide slug, for error messages. */
  slug: string;
  /** Podium kits in order — p1 = picks[0]. */
  picks: Kit[];
  cohortHeadlineCount: number;
  cohortShortlistCount: number;
  cohortLabel: string;
}

function fail(ctx: { slug: string }, msg: string): never {
  throw new Error(`[decision-guide ${ctx.slug}] ${msg}`);
}

function money(n: number): string {
  return Number.isInteger(n)
    ? `$${n.toLocaleString("en-US")}`
    : `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/** Fields whose source is kits.json. */
const KIT_FIELDS = new Set([
  "listedPrice",
  "trueCost",
  "missingCost",
  "costPerWh",
  "costPerW",
  "storageWh",
  "storageKwh",
  "inverterWatts",
  "chemistry",
]);

/** Fields whose source is evidence.json (buy-timing). */
const EVIDENCE_FIELDS = new Set([
  "currentPrice",
  "low6mo",
  "high6mo",
  "pctAboveLow",
  "buySignalCode",
  "buySignalLabel",
]);

const BUY_SIGNAL_LABEL: Record<string, string> = {
  buy_now: "buy now",
  fair: "fair price",
  wait: "wait",
};

function badCost(s: string | undefined): boolean {
  return !s || s === "$0.00" || s === "$0" || s === "$0.0";
}

/** Resolve one `kit.field` reference to a formatted string, or throw. */
function resolveKitField(
  ctx: GuideTokenContext,
  kit: Kit,
  field: string,
  ref: string
): string {
  if (KIT_FIELDS.has(field)) {
    switch (field) {
      case "listedPrice":
        if (!(kit.listedPrice > 0)) fail(ctx, `${ref}: "${kit.slug}" has no listedPrice (delisted / 0)`);
        return money(kit.listedPrice);
      case "trueCost":
        if (!(kit.trueCost > 0)) fail(ctx, `${ref}: "${kit.slug}" has no trueCost`);
        return money(kit.trueCost);
      case "missingCost":
        return money(kit.missingCost); // 0 is legitimate (integrated kits)
      case "costPerWh":
        if (badCost(kit.costPerWh)) fail(ctx, `${ref}: "${kit.slug}" has no costPerWh`);
        return `${kit.costPerWh}/Wh`;
      case "costPerW":
        if (badCost(kit.costPerW)) fail(ctx, `${ref}: "${kit.slug}" has no costPerW`);
        return `${kit.costPerW}/W`;
      case "storageWh":
        if (!(kit.storageWh > 0)) fail(ctx, `${ref}: "${kit.slug}" has no storageWh`);
        return `${kit.storageWh.toLocaleString("en-US")}Wh`;
      case "storageKwh":
        if (!(kit.storageWh > 0)) fail(ctx, `${ref}: "${kit.slug}" has no storageWh`);
        return `${(kit.storageWh / 1000).toFixed(2)}kWh`;
      case "inverterWatts":
        if (!(kit.inverterWatts > 0)) fail(ctx, `${ref}: "${kit.slug}" has no inverterWatts (0 / clamped)`);
        return `${kit.inverterWatts.toLocaleString("en-US")}W`;
      case "chemistry":
        if (!kit.chemistry) fail(ctx, `${ref}: "${kit.slug}" has no chemistry`);
        return kit.chemistry;
    }
  }
  if (EVIDENCE_FIELDS.has(field)) {
    const bt = getBuyTiming(kit.slug);
    if (!bt) fail(ctx, `${ref}: no evidence/buy-timing for "${kit.slug}"`);
    switch (field) {
      case "currentPrice":
        return money(bt!.currentPrice);
      case "low6mo":
        return money(bt!.low6mo);
      case "high6mo":
        return money(bt!.high6mo);
      case "pctAboveLow":
        return `${Math.round(bt!.pctAboveLow)}%`;
      case "buySignalCode":
        return bt!.signal;
      case "buySignalLabel":
        return BUY_SIGNAL_LABEL[bt!.signal] ?? bt!.signal;
    }
  }
  return fail(ctx, `${ref}: unknown field "${field}"`);
}

/**
 * Resolve all `{…}` tokens and `[[const:…]]` escapes in a string. Throws on any
 * unrecognized/unresolvable token (fail-loud — a typo or stale ref breaks the
 * build rather than shipping a wrong number).
 */
export function resolveTokens(text: string, ctx: GuideTokenContext): string {
  if (!text) return text;

  const withTokens = text.replace(/\{([^{}]+)\}/g, (_m, body: string) => {
    const ref = `{${body}}`;

    if (body.startsWith("guide.")) {
      const f = body.slice("guide.".length);
      if (f === "cohortHeadlineCount") return ctx.cohortHeadlineCount.toLocaleString("en-US");
      if (f === "cohortShortlistCount") return String(ctx.cohortShortlistCount);
      if (f === "cohortLabel") return ctx.cohortLabel;
      return fail(ctx, `${ref}: unknown guide field`);
    }

    if (body.startsWith("kit:")) {
      const dot = body.indexOf(".");
      if (dot < 0) return fail(ctx, `${ref}: malformed kit token (expected kit:slug.field)`);
      const kitSlug = body.slice("kit:".length, dot);
      const field = body.slice(dot + 1);
      const kit = getKitBySlug(kitSlug);
      if (!kit) return fail(ctx, `${ref}: unknown kit "${kitSlug}" (or no price)`);
      return resolveKitField(ctx, kit, field, ref);
    }

    const pm = body.match(/^p(\d+)\.(.+)$/);
    if (pm) {
      const idx = parseInt(pm[1], 10) - 1;
      const kit = ctx.picks[idx];
      if (!kit) return fail(ctx, `${ref}: pick #${pm[1]} but only ${ctx.picks.length} picks`);
      return resolveKitField(ctx, kit, pm[2], ref);
    }

    return fail(ctx, `${ref}: unrecognized token`);
  });

  return withTokens.replace(/\[\[const:([^\]]*)\]\]/g, (_m, t: string) => t);
}
