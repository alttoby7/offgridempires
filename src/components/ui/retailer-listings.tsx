"use client";

import type { KitOffer } from "@/lib/demo-data";

// Retailer display metadata
const RETAILER_META: Record<string, { label: string; abbrev: string }> = {
  amazon: { label: "Amazon", abbrev: "AMZ" },
  "shop-solar-kits": { label: "Shop Solar Kits", abbrev: "SSK" },
  "renogy-direct": { label: "Renogy Direct", abbrev: "RNG" },
};

function getRetailerMeta(slug: string, name: string) {
  return (
    RETAILER_META[slug] ?? {
      label: name,
      abbrev: name.slice(0, 3).toUpperCase(),
    }
  );
}

interface RetailerListingsProps {
  offers: KitOffer[];
  kitName: string;
}

export function RetailerListings({ offers, kitName }: RetailerListingsProps) {
  // Sort: in-stock cheapest first, then out-of-stock by price
  const sorted = [...offers].sort((a, b) => {
    if (a.inStock !== b.inStock) return a.inStock ? -1 : 1;
    return a.price - b.price;
  });

  const bestOffer = sorted.find((o) => o.inStock);

  return (
    <section className="rounded border border-[var(--border)] bg-[var(--bg-surface)] overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--border)] bg-[var(--bg-secondary)]">
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-[var(--accent)] shrink-0"
        >
          <circle cx="9" cy="21" r="1" />
          <circle cx="20" cy="21" r="1" />
          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
        </svg>
        <span className="text-xs font-semibold uppercase tracking-widest text-[var(--text-muted)]">
          Where to Buy
        </span>
        <span className="ml-auto font-mono text-[10px] text-[var(--text-muted)]">
          {sorted.filter((o) => o.inStock).length} in stock
        </span>
      </div>

      {/* Desktop table */}
      <div className="hidden sm:block">
        {/* Column headers */}
        <div className="grid grid-cols-12 gap-2 px-4 py-2 text-[10px] font-medium uppercase tracking-widest text-[var(--text-muted)] border-b border-[var(--border)]/50">
          <div className="col-span-5">Retailer</div>
          <div className="col-span-3 text-right">Price</div>
          <div className="col-span-2 text-center">Stock</div>
          <div className="col-span-2 text-right" />
        </div>

        {sorted.map((offer, i) => {
          const isBest = offer === bestOffer;
          const meta = getRetailerMeta(offer.retailerSlug, offer.retailer);
          return (
            <div
              key={i}
              className={`
                grid grid-cols-12 gap-2 px-4 py-3 items-center border-b border-[var(--border)]/40 last:border-b-0
                transition-colors duration-150
                ${isBest
                  ? "border-l-2 border-l-[var(--accent)] bg-[var(--accent)]/[0.04] hover:bg-[var(--accent)]/[0.07]"
                  : offer.inStock
                  ? "hover:bg-[var(--bg-elevated)]"
                  : "opacity-50"
                }
              `}
              style={isBest ? { boxShadow: "inset 3px 0 0 var(--accent)" } : undefined}
            >
              {/* Retailer */}
              <div className="col-span-5 flex items-center gap-2">
                <span className="text-sm font-medium text-[var(--text-primary)]">
                  {meta.label}
                </span>
                {isBest && (
                  <span className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide rounded-sm bg-[var(--accent)]/15 text-[var(--accent)]">
                    Best price
                  </span>
                )}
              </div>

              {/* Price */}
              <div className="col-span-3 text-right">
                <span
                  className={`font-mono text-sm font-semibold ${
                    !offer.inStock
                      ? "line-through text-[var(--text-muted)]"
                      : isBest
                      ? "text-[var(--accent)]"
                      : "text-[var(--text-primary)]"
                  }`}
                >
                  ${offer.price.toLocaleString()}
                </span>
              </div>

              {/* Stock */}
              <div className="col-span-2 flex justify-center">
                {offer.inStock ? (
                  <span className="flex items-center gap-1 text-[10px] font-medium text-[var(--success)]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--success)] inline-block" />
                    In stock
                  </span>
                ) : (
                  <span className="text-[10px] font-medium text-[var(--text-muted)]">
                    Out of stock
                  </span>
                )}
              </div>

              {/* CTA */}
              <div className="col-span-2 text-right">
                {offer.inStock && offer.sourceUrl ? (
                  <a
                    href={offer.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer sponsored"
                    className={`
                      inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold
                      border rounded-sm transition-all duration-150
                      ${isBest
                        ? "border-[var(--accent)] text-[var(--accent)] hover:bg-[var(--accent)] hover:text-[var(--bg-primary)]"
                        : "border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--border-accent)] hover:text-[var(--text-primary)]"
                      }
                    `}
                  >
                    View deal
                    <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" />
                    </svg>
                  </a>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>

      {/* Mobile card layout */}
      <div className="sm:hidden divide-y divide-[var(--border)]/40">
        {sorted.map((offer, i) => {
          const isBest = offer === bestOffer;
          const meta = getRetailerMeta(offer.retailerSlug, offer.retailer);
          return (
            <div
              key={i}
              className={`
                p-3 transition-colors
                ${isBest
                  ? "bg-[var(--accent)]/[0.04]"
                  : !offer.inStock
                  ? "opacity-50"
                  : ""
                }
              `}
              style={isBest ? { boxShadow: "inset 3px 0 0 var(--accent)" } : undefined}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-[var(--text-primary)]">
                      {meta.label}
                    </span>
                    {isBest && (
                      <span className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide rounded-sm bg-[var(--accent)]/15 text-[var(--accent)]">
                        Best
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    {offer.inStock ? (
                      <span className="flex items-center gap-1 text-[10px] text-[var(--success)]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[var(--success)] inline-block" />
                        In stock
                      </span>
                    ) : (
                      <span className="text-[10px] text-[var(--text-muted)]">Out of stock</span>
                    )}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div
                    className={`font-mono text-base font-semibold ${
                      !offer.inStock
                        ? "line-through text-[var(--text-muted)]"
                        : isBest
                        ? "text-[var(--accent)]"
                        : "text-[var(--text-primary)]"
                    }`}
                  >
                    ${offer.price.toLocaleString()}
                  </div>
                  {offer.inStock && offer.sourceUrl && (
                    <a
                      href={offer.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer sponsored"
                      className={`
                        mt-1 inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold
                        border rounded-sm transition-all duration-150
                        ${isBest
                          ? "border-[var(--accent)] text-[var(--accent)]"
                          : "border-[var(--border)] text-[var(--text-secondary)]"
                        }
                      `}
                    >
                      View deal
                      <svg width="7" height="7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" />
                      </svg>
                    </a>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer disclaimer */}
      <div className="px-4 py-2 border-t border-[var(--border)]/50 bg-[var(--bg-secondary)]">
        <p className="text-[10px] text-[var(--text-muted)]">
          Affiliate links — checking price won&apos;t cost you anything
        </p>
      </div>
    </section>
  );
}
