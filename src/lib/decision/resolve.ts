/**
 * Resolved decision-guide assembly — the one entry point page render,
 * generateMetadata, JSON-LD, and the build-time validator all share.
 *
 * It (1) resolves the podium STRICTLY (a missing or duplicate kit slug throws,
 * instead of the old silent-drop), and (2) resolves every token in the guide's
 * prose against live kits.json/evidence.json data. The returned `meta` carries
 * fully-resolved strings; `rawMeta` is the untouched source (for the lint).
 */

import type { Kit } from "@/lib/demo-data";
import type { DecisionGuideMeta, PodiumPick } from "./types";
import { getDecisionGuide } from "@/content/decision-guide-registry";
import { getKitBySlug } from "@/lib/get-kits";
import { resolveTokens, type GuideTokenContext } from "./resolve-tokens";

export interface ResolvedPick extends PodiumPick {
  kit: Kit;
}

/** Resolve the podium to kits in order — throws on a missing/duplicate slug. */
export function resolvePicksStrict(meta: DecisionGuideMeta): ResolvedPick[] {
  const seen = new Set<string>();
  return meta.picks.map((p, i) => {
    if (seen.has(p.kitSlug)) {
      throw new Error(`[decision-guide ${meta.slug}] duplicate podium kit "${p.kitSlug}"`);
    }
    seen.add(p.kitSlug);
    const kit = getKitBySlug(p.kitSlug);
    if (!kit) {
      throw new Error(
        `[decision-guide ${meta.slug}] pick #${i + 1} kit "${p.kitSlug}" not found or has no price`
      );
    }
    return { ...p, kit };
  });
}

export interface ResolvedDecisionGuide {
  /** Token-resolved, ready to render. */
  meta: DecisionGuideMeta;
  /** Untouched source (still contains tokens) — used by the lint. */
  rawMeta: DecisionGuideMeta;
  /** Podium kits + their resolved label/rationale, in order. */
  picks: ResolvedPick[];
}

export function getResolvedDecisionGuide(slug: string): ResolvedDecisionGuide | null {
  const rawMeta = getDecisionGuide(slug);
  if (!rawMeta) return null;

  const picks = resolvePicksStrict(rawMeta);
  const ctx: GuideTokenContext = {
    slug: rawMeta.slug,
    picks: picks.map((p) => p.kit),
    cohortHeadlineCount: rawMeta.cohortHeadlineCount,
    cohortShortlistCount: rawMeta.cohortShortlistCount,
    cohortLabel: rawMeta.cohortLabel,
  };
  const R = (s: string) => resolveTokens(s, ctx);

  const resolvedPickMeta = rawMeta.picks.map((p) => ({
    ...p,
    label: R(p.label),
    rationale: R(p.rationale),
  }));

  const meta: DecisionGuideMeta = {
    ...rawMeta,
    metaTitle: R(rawMeta.metaTitle),
    metaDescription: R(rawMeta.metaDescription),
    answer: R(rawMeta.answer),
    receiptNote: rawMeta.receiptNote ? R(rawMeta.receiptNote) : rawMeta.receiptNote,
    cohortLabel: R(rawMeta.cohortLabel),
    picks: resolvedPickMeta,
    sections: rawMeta.sections.map((s) => ({ heading: R(s.heading), body: R(s.body) })),
    whyWon: rawMeta.whyWon.map(R),
    whyFailed: rawMeta.whyFailed.map(R),
    faqs: rawMeta.faqs.map((f) => ({ question: R(f.question), answer: R(f.answer) })),
  };

  const resolvedPicks: ResolvedPick[] = picks.map((p, i) => ({
    ...p,
    label: resolvedPickMeta[i].label,
    rationale: resolvedPickMeta[i].rationale,
  }));

  return { meta, rawMeta, picks: resolvedPicks };
}
