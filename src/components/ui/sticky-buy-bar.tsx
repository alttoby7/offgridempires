"use client";

import { useState, useEffect } from "react";
import { AffiliateLink } from "./affiliate-link";

interface StickyBuyBarProps {
  trueCost: number;
  retailer: string;
  affiliateUrl: string;
  kitSlug: string;
  listedPrice: number;
}

/**
 * Sticky bottom bar on mobile with price + affiliate CTA.
 * Appears when the user scrolls past the price card.
 */
export function StickyBuyBar({
  trueCost,
  retailer,
  affiliateUrl,
  kitSlug,
  listedPrice,
}: StickyBuyBarProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Show after scrolling 400px (past the price card on mobile)
      setVisible(window.scrollY > 400);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden border-t border-[var(--border)] bg-[var(--bg-primary)]/95 backdrop-blur-sm px-4 py-3 safe-bottom">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-wide text-[var(--text-muted)]">
            Real Build Cost
          </p>
          <p className="font-mono text-lg font-bold text-[var(--accent)]">
            ${trueCost.toLocaleString()}
          </p>
        </div>
        <AffiliateLink
          href={affiliateUrl}
          kitSlug={kitSlug}
          retailer={retailer}
          price={listedPrice}
          className="flex items-center gap-2 rounded bg-[var(--accent)] px-5 py-2.5 text-sm font-bold text-[var(--bg-primary)] hover:bg-[var(--accent-hover)] transition-colors whitespace-nowrap"
        >
          View on {retailer}
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" />
          </svg>
        </AffiliateLink>
      </div>
    </div>
  );
}
