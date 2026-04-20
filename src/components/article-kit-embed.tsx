import Link from "next/link";
import { getKitBySlug } from "@/lib/get-kits";
import { buildAffiliateUrl } from "@/lib/affiliate";

/**
 * Compact kit summary card for embedding in /learn articles.
 * Reads live data from kits.json by slug.
 */
export function ArticleKitEmbed({ slug }: { slug: string }) {
  const kit = getKitBySlug(slug);

  if (!kit) {
    return (
      <div className="my-6 rounded border border-[var(--border)] bg-[var(--bg-surface)] p-4 text-sm text-[var(--text-muted)]">
        Kit data unavailable: {slug}
      </div>
    );
  }

  // Find lowest-price in-stock offer for affiliate CTA
  const bestOffer = kit.offers
    ?.filter((o) => o.inStock && o.sourceUrl)
    .sort((a, b) => a.price - b.price)[0];
  const affiliateUrl = bestOffer
    ? buildAffiliateUrl(bestOffer.sourceUrl, bestOffer.retailerSlug)
    : null;

  const completenessColor =
    kit.completeness >= 100
      ? "text-[var(--success)]"
      : kit.completeness >= 70
        ? "text-[var(--accent)]"
        : "text-[var(--danger)]";

  return (
    <div className="my-6 rounded border border-[var(--border)] bg-[var(--bg-surface)] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)] bg-[var(--bg-elevated)]">
        <div>
          <span className="text-xs font-mono uppercase tracking-wider text-[var(--text-muted)]">
            {kit.brand}
          </span>
          <h4 className="text-sm font-semibold text-[var(--text-primary)]">
            {kit.displayName || kit.name}
          </h4>
        </div>
        <div className="flex items-center gap-3">
          {affiliateUrl && (
            <a
              href={affiliateUrl}
              target="_blank"
              rel="noopener noreferrer sponsored"
              className="text-xs border border-[var(--accent)]/30 text-[var(--accent)] px-3 py-1.5 rounded hover:bg-[var(--accent)]/10 transition-colors whitespace-nowrap"
            >
              View on {bestOffer!.retailer} &rarr;
            </a>
          )}
          <Link
            href={`/kits/${kit.slug}`}
            className="text-xs text-[var(--accent)] hover:underline whitespace-nowrap"
          >
            Full breakdown &rarr;
          </Link>
        </div>
      </div>

      {/* Specs grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-[var(--border)]">
        <SpecCell
          label="Advertised"
          value={`$${kit.listedPrice.toLocaleString()}`}
        />
        <SpecCell
          label="Real Build Cost"
          value={`$${kit.trueCost.toLocaleString()}`}
          highlight
        />
        <SpecCell
          label="Completeness"
          value={`${kit.completeness}%`}
          className={completenessColor}
        />
        <SpecCell label="Cost/Wh" value={kit.costPerWh} />
      </div>

      {/* Key specs row */}
      <div className="flex items-center gap-4 px-4 py-2.5 text-xs text-[var(--text-muted)]">
        {kit.panelWatts > 0 && (
          <span>
            <span className="font-mono text-[var(--text-secondary)]">
              {kit.panelWatts}W
            </span>{" "}
            panels
          </span>
        )}
        {kit.storageWh > 0 && (
          <span>
            <span className="font-mono text-[var(--text-secondary)]">
              {kit.storageWh}Wh
            </span>{" "}
            storage
          </span>
        )}
        {kit.inverterWatts > 0 && (
          <span>
            <span className="font-mono text-[var(--text-secondary)]">
              {kit.inverterWatts}W
            </span>{" "}
            inverter
          </span>
        )}
        <span className="font-mono text-[var(--text-secondary)]">
          {kit.chemistry}
        </span>
      </div>
    </div>
  );
}

function SpecCell({
  label,
  value,
  highlight,
  className,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  className?: string;
}) {
  return (
    <div className="bg-[var(--bg-surface)] px-3 py-2.5">
      <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)] mb-0.5">
        {label}
      </div>
      <div
        className={`font-mono text-sm font-semibold ${
          className
            ? className
            : highlight
              ? "text-[var(--accent)]"
              : "text-[var(--text-primary)]"
        }`}
      >
        {value}
      </div>
    </div>
  );
}
