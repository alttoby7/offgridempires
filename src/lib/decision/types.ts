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

export interface GuideSection {
  heading: string;
  /** Light markdown: paragraphs, **bold**, [text](/internal-path), "- " bullets. */
  body: string;
}

export interface DecisionGuideMeta {
  slug: string;
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

  // ── freshness + gate ──
  publishedAt: string;
  /** Auto-refreshable by automation (the only field automation may touch here). */
  updatedAt: string;
  /** INDEX GOVERNOR — DEFAULT false. A human flip is a 🔴 gated action. */
  indexable: boolean;
}
