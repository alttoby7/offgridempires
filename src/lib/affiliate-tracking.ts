/**
 * Affiliate click recording — fire-and-forget to Supabase (offgrid project).
 * Durable, queryable ledger of which kit / surface / content drives outbound
 * clicks. Mirrors the calculator's INSERT-only anon pattern; never blocks the
 * navigation and swallows all errors.
 */

import { supabase } from "@/lib/supabase";
import { getSessionId, getAttribution } from "@/lib/calculator/calc-recording";

export interface AffiliateClickMeta {
  kitSlug: string;
  retailer: string;
  /** Omit for links with no meaningful price (e.g. add-on BOM parts). */
  price?: number;
  /** kit_page | retailer_table | bom_missing_part | article_embed | best_for | compare | sticky_bar */
  surface?: string;
  /** systemType|completenessBand|priceBucket (optional) */
  cohort?: string;
  /** article/use-case slug that drove the click (optional) */
  contentSlug?: string;
}

export function recordAffiliateClick(meta: AffiliateClickMeta): void {
  if (!supabase) return;
  try {
    const attr = getAttribution();
    void supabase
      .from("affiliate_clicks")
      .insert({
        session_id: getSessionId(),
        kit_slug: meta.kitSlug,
        retailer: meta.retailer,
        price_cents: typeof meta.price === "number" ? Math.round(meta.price * 100) : null,
        surface: meta.surface ?? null,
        content_slug: meta.contentSlug ?? null,
        cohort: meta.cohort ?? null,
        referrer: attr.referrer,
        utm: {
          source: attr.utm_source,
          medium: attr.utm_medium,
          campaign: attr.utm_campaign,
        },
      })
      .then(
        () => {},
        () => {}
      );
  } catch {
    // never block navigation
  }
}
