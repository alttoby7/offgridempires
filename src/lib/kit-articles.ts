import type { Kit } from "./demo-data";
import { articles } from "@/content/article-registry";
import type { ArticleEntry } from "@/content/types";

/*
 * Pick up to N articles topically relevant to a given kit.
 * Light-touch matcher — uses systemType, chemistry, panelWatts, useCases.
 */

const SLUG = (s: string) => articles.find((a) => a.slug === s);

interface ArticleMatch {
  article: ArticleEntry;
  reason: string;
  weight: number;
}

export function getRelatedArticles(kit: Kit, max = 3): ArticleMatch[] {
  const out: ArticleMatch[] = [];

  // System type → hero category article
  if (kit.systemType === "portable") {
    const a = SLUG("portable-power-stations");
    if (a) out.push({ article: a, reason: "Compare to 173 portable power stations by real cost", weight: 100 });
  } else if (kit.systemType === "diy-kit") {
    const a = SLUG("solar-panel-kits-and-bundles");
    if (a) out.push({ article: a, reason: "How DIY kits stack up", weight: 100 });
    const inst = SLUG("solar-installation-diy");
    if (inst) out.push({ article: inst, reason: "Step-by-step DIY install guide", weight: 80 });
  } else if (kit.systemType === "whole-home") {
    const a = SLUG("home-generators-and-backup-power");
    if (a) out.push({ article: a, reason: "Whole-home backup categories", weight: 90 });
  }

  // Battery chemistry → battery articles
  if (kit.chemistry === "LiFePO4" || kit.chemistry === "Li-ion") {
    const a = SLUG("lithium-and-lifepo4-batteries");
    if (a) out.push({ article: a, reason: "What LFP / Li-ion really gives you", weight: 75 });
  }
  if (kit.chemistry === "AGM" || kit.chemistry === "Lead-Acid") {
    const a = SLUG("battery-types-and-deep-cycle");
    if (a) out.push({ article: a, reason: "Lead-acid vs lithium for off-grid", weight: 75 });
  }

  // Use cases
  if (kit.useCaseRatings?.rv === "excellent" || kit.useCaseRatings?.rv === "good") {
    const a = SLUG("rv-and-camper-solar");
    if (a) out.push({ article: a, reason: "RV-specific kit guidance", weight: 85 });
  }
  if (kit.useCaseRatings?.shed === "excellent" || kit.useCaseRatings?.shed === "good") {
    const a = SLUG("solar-for-sheds-and-small-structures");
    if (a) out.push({ article: a, reason: "Shed solar without the markup", weight: 70 });
  }

  // Inverter-related
  if (kit.inverterWatts > 0 && kit.inverterWatts < 1500) {
    const a = SLUG("inverters-and-power-conversion");
    if (a) out.push({ article: a, reason: "Pure-sine vs modified-sine inverters", weight: 50 });
  }

  // Sizing math
  if (kit.panelWatts > 0 && kit.storageWh > 0) {
    const a = SLUG("watts-to-kilowatts");
    if (a) out.push({ article: a, reason: "Watts → kWh sizing math", weight: 40 });
  }

  // Dedupe + rank
  const seen = new Set<string>();
  const ranked: ArticleMatch[] = [];
  for (const m of out.sort((a, b) => b.weight - a.weight)) {
    if (seen.has(m.article.slug)) continue;
    seen.add(m.article.slug);
    ranked.push(m);
    if (ranked.length >= max) break;
  }
  return ranked;
}
