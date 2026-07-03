"use client";

import { trackAffiliateClick } from "@/lib/analytics";
import { recordAffiliateClick } from "@/lib/affiliate-tracking";

interface AffiliateLinkProps {
  href: string;
  kitSlug: string;
  retailer: string;
  /** Omit when there is no meaningful price (e.g. an add-on BOM part) — the
   * trackers then skip price_cents rather than record a misleading 0. */
  price?: number;
  /** where the click happened — kit_page | retailer_table | bom_missing_part | bom_addon | article_embed | best_for | compare | sticky_bar */
  surface?: string;
  cohort?: string;
  contentSlug?: string;
  className?: string;
  "aria-label"?: string;
  children: React.ReactNode;
}

/**
 * The single outbound-affiliate-link primitive. Every monetized link should use
 * this so it consistently: (1) opens in a new tab, (2) carries
 * rel="nofollow noopener noreferrer sponsored", (3) fires the GA4 affiliate_click
 * key event, and (4) writes a durable row to Supabase affiliate_clicks. Both
 * trackers are fire-and-forget and never block the navigation.
 */
export function AffiliateLink({
  href,
  kitSlug,
  retailer,
  price,
  surface,
  cohort,
  contentSlug,
  className,
  "aria-label": ariaLabel,
  children,
}: AffiliateLinkProps) {
  const onClick = () => {
    trackAffiliateClick(kitSlug, retailer, price, { surface, cohort, contentSlug });
    recordAffiliateClick({ kitSlug, retailer, price, surface, cohort, contentSlug });
  };
  return (
    <a
      href={href}
      target="_blank"
      rel="nofollow noopener noreferrer sponsored"
      className={className}
      aria-label={ariaLabel}
      onClick={onClick}
    >
      {children}
    </a>
  );
}
