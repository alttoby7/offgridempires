/**
 * Decision-guide types — the `/guides/[slug]` money-page content system.
 *
 * Each guide BINDS the live verdict/sizing engine + the evidence graph to a
 * human-authored narrative and a gated shortlist. The page never invents a
 * number: specs/prices come from kits.json, percentiles/price-signals come from
 * evidence.json, verdicts come from the failure-note engine. The human writes
 * only the connective tissue (answer, podium rationale, why-won/why-failed,
 * methodology prose) — and flips `indexable`.
 *
 * GATE (see growth-system/inputs/decision-page-template.md §5): `indexable`
 * defaults false. `indexable`, `h1`, `metaTitle`, `metaDescription`, `intent`,
 * `answer`, every `picks[].label`/`rationale`, `whyWon`, `whyFailed`, and the
 * `sections` prose are 🔴 human-gated — never auto-edited. Automation may only
 * refresh `updatedAt` and the values rendered from kits.json/evidence.json.
 */

import type { SystemAssumptions } from "@/lib/calculator/types";

export type ReceiptMode = "missing-parts" | "autonomy";

export interface PodiumPick {
  /** kits.json + evidence.json key. The displayed order is THIS array's order. */
  kitSlug: string;
  /** Recommendation label, e.g. "Best value" — a GATED "best" claim. */
  label: string;
  /** One-paragraph human rationale (why it clears the bar). GATED. */
  rationale: string;
  /**
   * When true, this pick carries the page's SINGLE affiliate CTA. The button
   * label is generated from the ACTUAL resolved retailer (cheapest in-stock
   * offer) so it can never mislabel where the link goes.
   */
  cta?: boolean;
}

/**
 * A build-time SUPERLATIVE/COMPARATIVE assertion. The token resolver keeps the
 * NUMBERS in prose live; a GuideClaim keeps a COMPARISON in prose true. e.g. a
 * rationale that calls a pick "the lowest cost-per-Wh" is backed by
 * `{ pick: "p5", metric: "costPerWh", direction: "lowest" }`; if the price cron
 * later makes another pick cheaper, the build FAILS instead of the page quietly
 * lying. (This is Phase 2 — it catches what the naked-literal lint cannot: a
 * claim that is false not because a number is stale but because the RANK moved.)
 *
 * Scope is the podium by default. `among` narrows it to a subset of picks — use
 * it for claims qualified to e.g. "the complete picks" (exclude the main-unit-
 * only ones). Ties are allowed: the pick must BE a min/max, not strictly beat
 * every other. Cohort-wide superlatives ("lowest in all 65") are NOT enforceable
 * here — keep those qualified in prose and verify by hand before flipping.
 */
export interface GuideClaim {
  /** Pick id the claim is about: "p1".."pN" (1-based, p1 = picks[0]). */
  pick: string;
  /** Which numeric kit metric the superlative is over. */
  metric:
    | "costPerWh"
    | "costPerW"
    | "listedPrice"
    | "trueCost"
    | "missingCost"
    | "storageWh"
    | "inverterWatts"
    | "completeness";
  /** "lowest" → pick must be the minimum; "highest" → the maximum. */
  direction: "lowest" | "highest";
  /** Optional subset of pick ids to compare within (default: all picks). */
  among?: string[];
  /** Human note tying the claim to the prose it guards (for error messages). */
  note?: string;
}

export interface GuideSection {
  heading: string;
  /** Light markdown: paragraphs, **bold**, [text](/internal-path), "- " bullets. */
  body: string;
}

/**
 * One row of an add-on BOM — the parts to add to a near-fit kit to close a
 * specific gap (e.g. a soft-start kit to run a window AC). Used by Tier-3
 * add-on pages via `DecisionGuideMeta.addOnBom`. `estCost` is an editorial
 * price RANGE (a display string like "$80–$250"), not a live kit price, so it
 * is not token-resolved. `asin` (optional) renders a tracked Amazon affiliate
 * link.
 */
export interface AddOnItem {
  part: string;
  /** One line: why this part closes the gap. */
  why: string;
  /** Display price range, e.g. "$80–$250". */
  estCost: string;
  /** Optional Amazon ASIN → renders a tagged AffiliateLink to that product. */
  asin?: string;
  /**
   * Optional Amazon search query → renders a tagged affiliate search link.
   * Preferred over `asin` for multi-brand parts (soft-start kits, cable) where
   * a single product would be arbitrary. Ignored if `asin` is set.
   */
  search?: string;
}

/**
 * One "best for X" segment on a hub page (#14 best-off-grid-solar-generator).
 * The winner is the #1 pick of an existing spoke guide; the build asserts
 * `kitSlug === getDecisionGuide(sourceGuideSlug).picks[0].kitSlug` so the hub
 * can never silently disagree with the guide it routes to. Live price/specs are
 * rendered from kits.json at build; `thesis`/`failureMode` are editorial prose
 * (no money literals — the live numbers come from the kit columns).
 */
export interface HubSegment {
  /** e.g. "Best for a CPAP". */
  label: string;
  /** Winner kit slug — must equal the source guide's first pick. */
  kitSlug: string;
  /** Spoke guide slug this segment routes to (and is asserted against). */
  sourceGuideSlug: string;
  /** Who this segment is for, one line. */
  audience: string;
  /** Why this winner, one line (editorial). */
  thesis: string;
  /** The failure mode it avoids that a generic pick doesn't (editorial). */
  failureMode: string;
}

export interface DecisionGuideMeta {
  slug: string;
  /** "standard" (default) or "hub" — a router page rendered as a segment matrix. */
  pageKind?: "standard" | "hub";
  /** Hub-only: the "best for X" segments (each routes to a spoke guide). */
  segments?: HubSegment[];
  /** Query-intent H1 (GATED). */
  h1: string;
  metaTitle: string;
  metaDescription: string;
  /** One-line target search intent. */
  intent: string;
  /** Answer-first AEO block, first 100 words (GATED). */
  answer: string;

  // ── engine binding (drives the verdict + sizing blocks, live) ──
  loadIds: string[];
  assumptions: SystemAssumptions;

  // ── cohort framing ──
  /** Human-readable cohort filter, e.g. "inverter ≥ 2,000W and storage ≥ 2 kWh". */
  cohortLabel: string;
  /** Full surge-/spec-clearing pool size (headline stat). */
  cohortHeadlineCount: number;
  /** Clean, paneled shortlist subset the podium is drawn from. */
  cohortShortlistCount: number;

  // ── podium (the shortlist) ──
  picks: PodiumPick[];

  // ── receipt ──
  receiptMode: ReceiptMode;
  /** Effective continuous draw (W) used for the autonomy receipt (incl. inverter overhead). */
  effectiveLoadWatts?: number;
  /** Honest framing line for the receipt section. */
  receiptNote?: string;

  // ── narrative + trust ──
  sections: GuideSection[];
  whyWon: string[];
  whyFailed: string[];
  faqs: { question: string; answer: string }[];

  /**
   * Optional add-on BOM — the parts to add to a near-fit kit to close the
   * page's gap (Tier-3 add-on pages, e.g. what-to-add-to-run-a-window-AC).
   * When present, the guide renders a parts table after the podium.
   */
  addOnBom?: AddOnItem[];

  /**
   * Build-time superlative assertions guarding the comparative claims in the
   * prose above (e.g. "the lowest cost-per-Wh", "the most storage"). Optional,
   * but every clean podium-scoped superlative SHOULD have one. See GuideClaim.
   */
  claims?: GuideClaim[];

  // ── freshness + gate ──
  publishedAt: string;
  /** Auto-refreshable by automation (the only field automation may touch here). */
  updatedAt: string;
  /** INDEX GOVERNOR — DEFAULT false. A human flip is a 🔴 gated action. */
  indexable: boolean;
}
