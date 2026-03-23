import type { Metadata } from "next";
import Link from "next/link";
import { getKits, getKitBySlug, getKitSlugs } from "@/lib/get-kits";
import { CompletenessBadges } from "@/components/ui/completeness-badges";
import { PriceTimestamp } from "@/components/ui/price-timestamp";
import { TrueCostBar } from "@/components/ui/true-cost-bar";
import { SpecBlock } from "@/components/ui/spec-block";
import { GapReceipt } from "@/components/ui/gap-receipt";
import { BomTable } from "@/components/ui/bom-table";
import { PriceHistorySection } from "@/components/ui/price-history-section";
import { KitProductJsonLd, BreadcrumbJsonLd } from "@/components/json-ld";
import { getSimilarKits } from "@/lib/similar-kits";

// Affiliate config per retailer
const AMAZON_AFFILIATE_TAG = "fidohikes-20";
// TODO: Replace with real Awin IDs after Shop Solar approval
const AWIN_ADVERTISER_ID = "";
const AWIN_PUBLISHER_ID = "";

export function generateStaticParams() {
  return getKitSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const kit = getKitBySlug(slug);
  const title = kit ? `${kit.name} — Real Build Cost Breakdown` : "Kit Not Found";
  const description = kit
    ? `Full component breakdown and true total cost for the ${kit.name}. See what's included, what's missing, and the real price.`
    : undefined;

  return {
    title,
    description,
    alternates: { canonical: `/kits/${slug}` },
    openGraph: {
      title: kit ? `${kit.name} | OffGridEmpire` : title,
      description,
      url: `/kits/${slug}`,
    },
  };
}

const ratingColors: Record<string, string> = {
  excellent: "text-[var(--success)] bg-[var(--success)]/10 border-[var(--success)]/20",
  good: "text-[var(--accent)] bg-[var(--accent)]/10 border-[var(--accent)]/20",
  fair: "text-[var(--text-secondary)] bg-[var(--bg-elevated)] border-[var(--border)]",
  poor: "text-[var(--danger)]/70 bg-[var(--danger)]/5 border-[var(--danger)]/15",
};

const useCaseLabels: Record<string, string> = {
  rv: "RV & Van",
  cabin: "Cabin",
  homestead: "Homestead",
  emergency: "Emergency",
  shed: "Shed",
  boat: "Boat",
};

function buildAffiliateUrl(sourceUrl: string | undefined, retailerSlug = "amazon"): string | null {
  if (!sourceUrl) return null;
  if (retailerSlug === "amazon") {
    const sep = sourceUrl.includes("?") ? "&" : "?";
    return `${sourceUrl}${sep}tag=${AMAZON_AFFILIATE_TAG}`;
  }
  if (retailerSlug === "shop-solar-kits" && AWIN_ADVERTISER_ID && AWIN_PUBLISHER_ID) {
    const encoded = encodeURIComponent(sourceUrl);
    return `https://www.awin1.com/cread.php?awinmid=${AWIN_ADVERTISER_ID}&awinaffid=${AWIN_PUBLISHER_ID}&ued=${encoded}`;
  }
  return sourceUrl;
}

export default async function KitDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const kit = getKitBySlug(slug);

  if (!kit) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 text-center">
        <h1 className="text-xl font-bold text-[var(--text-primary)]">Kit not found</h1>
        <Link href="/kits" className="text-sm text-[var(--accent)] mt-4 inline-block">
          &larr; Back to all kits
        </Link>
      </div>
    );
  }

  const missingItems = kit.items.filter((item) => !item.isIncluded);
  const includedItems = kit.items.filter((item) => item.isIncluded);
  const affiliateUrl = buildAffiliateUrl(kit.sourceUrl, "amazon");
  const hasMultipleRetailers = (kit.offers?.length ?? 0) > 1;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <KitProductJsonLd kit={kit} />
      <BreadcrumbJsonLd items={[
        { name: "Home", url: "/" },
        { name: "Kits", url: "/kits" },
        { name: kit.name, url: `/kits/${kit.slug}` },
      ]} />
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-[var(--text-muted)] mb-6">
        <Link href="/" className="hover:text-[var(--accent)] transition-colors">Home</Link>
        <span>/</span>
        <Link href="/kits" className="hover:text-[var(--accent)] transition-colors">Kits</Link>
        <span>/</span>
        <span className="text-[var(--text-secondary)] truncate max-w-[200px]">{kit.name}</span>
      </nav>

      {/* Header section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
        {/* Left: Kit info */}
        <div className="lg:col-span-2 space-y-5">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-sm font-medium uppercase tracking-wide text-[var(--text-muted)]">
                {kit.brand}
              </span>
              <span className="text-xs text-[var(--text-muted)] border border-[var(--border)] rounded-sm px-2 py-0.5">
                via {kit.retailer}
              </span>
              <PriceTimestamp observedAt={kit.priceObservedAt} />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)] leading-tight">
              {kit.name}
            </h1>
          </div>

          {/* Specs row */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            <SpecBlock label="Solar" value={`${kit.panelWatts}W`} />
            <SpecBlock label="Storage" value={kit.storageWh > 0 ? `${(kit.storageWh / 1000).toFixed(1)}kWh` : "None"} />
            <SpecBlock label="Inverter" value={kit.inverterWatts > 0 ? `${kit.inverterWatts}W` : "None"} />
            <SpecBlock label="Cost/W" value={kit.costPerW} highlight />
            <SpecBlock label="Cost/Wh" value={kit.costPerWh} highlight />
          </div>

          {/* Completeness */}
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-sm font-medium uppercase tracking-wide text-[var(--text-muted)]">
                Kit Completeness
              </span>
              <span className={`font-mono text-sm font-semibold ${
                kit.completeness === 100 ? "text-[var(--success)]" : "text-[var(--warning)]"
              }`}>
                {kit.completeness}%
              </span>
            </div>
            <CompletenessBadges included={kit.included} size="md" />
          </div>

          {/* Use case ratings */}
          <div>
            <span className="text-sm font-medium uppercase tracking-wide text-[var(--text-muted)] block mb-2">
              Use Case Suitability
            </span>
            <div className="flex flex-wrap gap-2">
              {Object.entries(kit.useCaseRatings).map(([uc, rating]) => (
                <span
                  key={uc}
                  className={`inline-flex items-center gap-1.5 rounded border px-2.5 py-1.5 text-sm font-medium ${ratingColors[rating]}`}
                >
                  {useCaseLabels[uc] ?? uc}
                  <span className="font-mono text-xs opacity-70">{rating}</span>
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Price card */}
        <div className="space-y-4">
          <div className="rounded border border-[var(--border)] bg-[var(--bg-surface)] p-5 space-y-4">
            {/* Price */}
            <div className="space-y-3">
              <div className="flex items-baseline justify-between">
                <div>
                  <p className="text-xs font-medium text-[var(--text-muted)] uppercase">Advertised Price</p>
                  <p className={`font-mono text-2xl font-bold ${kit.missingCost > 0 ? "text-[var(--text-secondary)] line-through decoration-1" : "text-[var(--text-primary)]"}`}>
                    ${kit.listedPrice.toLocaleString()}
                  </p>
                </div>
                {kit.priceChange !== undefined && kit.priceChange !== 0 && (
                  <span className={`font-mono text-sm font-semibold ${kit.priceChange < 0 ? "text-[var(--success)]" : "text-[var(--danger)]"}`}>
                    {kit.priceChange < 0 ? "▼" : "▲"} ${Math.abs(kit.priceChange)}
                  </span>
                )}
              </div>

              <TrueCostBar
                listedPrice={kit.listedPrice}
                missingCost={kit.missingCost}
                trueCost={kit.trueCost}
              />
            </div>

            {/* CTA — only render as link when affiliate URL exists */}
            {affiliateUrl ? (
              <a
                href={affiliateUrl}
                target="_blank"
                rel="noopener noreferrer sponsored"
                className="flex items-center justify-center gap-2 w-full rounded bg-[var(--accent)] py-3 text-sm font-bold text-[var(--bg-primary)] hover:bg-[var(--accent-hover)] transition-colors"
              >
                View on {kit.retailer}
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" />
                </svg>
              </a>
            ) : (
              <div className="flex items-center justify-center gap-2 w-full rounded bg-[var(--bg-elevated)] py-3 text-sm font-medium text-[var(--text-muted)] cursor-not-allowed">
                Retailer link unavailable
              </div>
            )}

            {affiliateUrl && (
              <p className="text-xs text-[var(--text-muted)] text-center">
                Affiliate link &mdash; same price for you
              </p>
            )}

            {/* Price alert */}
            <div className="border-t border-[var(--border)] pt-4">
              <p className="text-xs font-medium text-[var(--text-muted)] uppercase mb-2">
                Price Drop Alert
              </p>
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="your@email.com"
                  className="flex-1 rounded border border-[var(--border)] bg-[var(--bg-primary)] px-3 py-2 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent)] focus:outline-none"
                />
                <button className="rounded border border-[var(--accent)]/30 bg-[var(--accent)]/10 px-3 py-2 text-xs font-medium text-[var(--accent)] hover:bg-[var(--accent)]/20 transition-colors">
                  Alert Me
                </button>
              </div>
            </div>
          </div>

          {/* Multi-retailer price comparison */}
          {hasMultipleRetailers && kit.offers && (
            <div className="rounded border border-[var(--border)] bg-[var(--bg-surface)] p-4 space-y-3">
              <p className="text-xs font-medium text-[var(--text-muted)] uppercase">
                Available from {new Set(kit.offers.map((o) => o.retailer)).size} retailers
              </p>
              <div className="space-y-2">
                {/* Deduplicate: show cheapest offer per retailer */}
                {Array.from(
                  kit.offers.reduce((map, o) => {
                    if (!map.has(o.retailer) || o.price < map.get(o.retailer)!.price) {
                      map.set(o.retailer, o);
                    }
                    return map;
                  }, new Map<string, (typeof kit.offers)[0]>())
                  .values()
                ).map((offer, i) => {
                  const offerUrl = buildAffiliateUrl(offer.sourceUrl, offer.retailerSlug);
                  const isCheapest = i === 0;
                  return (
                    <div
                      key={`${offer.retailer}-${offer.price}`}
                      className={`flex items-center justify-between rounded border px-3 py-2 ${
                        isCheapest
                          ? "border-[var(--accent)]/30 bg-[var(--accent)]/5"
                          : "border-[var(--border)] bg-[var(--bg-primary)]"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-[var(--text-primary)]">
                          {offer.retailer}
                        </span>
                        {isCheapest && (
                          <span className="text-[10px] font-semibold uppercase tracking-wide text-[var(--accent)] bg-[var(--accent)]/10 px-1.5 py-0.5 rounded">
                            Best
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`font-mono text-sm font-bold ${
                          isCheapest ? "text-[var(--accent)]" : "text-[var(--text-secondary)]"
                        }`}>
                          ${offer.price.toLocaleString()}
                        </span>
                        {offerUrl ? (
                          <a
                            href={offerUrl}
                            target="_blank"
                            rel="noopener noreferrer sponsored"
                            className="text-xs font-medium text-[var(--accent)] hover:underline"
                          >
                            View
                          </a>
                        ) : (
                          <span className="text-xs text-[var(--text-muted)]">Link</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              <p className="text-[10px] text-[var(--text-muted)] text-center">
                Affiliate links — same price for you
              </p>
            </div>
          )}

          {/* Compare CTA */}
          <Link
            href={`/compare?kits=${kit.slug}`}
            className="flex items-center justify-center gap-2 w-full rounded border border-[var(--border)] bg-[var(--bg-surface)] py-2.5 text-xs font-medium text-[var(--text-secondary)] hover:border-[var(--border-accent)] hover:text-[var(--accent)] transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
            </svg>
            Compare with other kits
          </Link>
        </div>
      </div>

      {/* Gap Receipt — the viral feature */}
      <section className="mb-10">
        <GapReceipt kit={kit} />
      </section>

      {/* Component Decomposition Table */}
      {kit.items.length > 0 && (
        <section className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <h2 className="text-xl font-bold text-[var(--text-primary)]">
              Component Breakdown
            </h2>
            <span className="text-xs text-[var(--text-muted)] border border-[var(--border)] rounded-sm px-2 py-0.5">
              {includedItems.length} included / {missingItems.length} missing
            </span>
          </div>

          <BomTable items={kit.items} missingCost={kit.missingCost} />
        </section>
      )}

      {/* Price History */}
      <section className="mb-10">
        <PriceHistorySection kit={kit} />
      </section>

      {/* Calculator CTA */}
      <section className="mb-10">
        <Link
          href="/calculator"
          className="flex items-center gap-3 rounded border border-[var(--accent)]/30 bg-[var(--accent)]/5 p-4 hover:border-[var(--accent)]/50 hover:bg-[var(--accent)]/10 transition-colors group"
        >
          <span className="text-2xl">⚡</span>
          <div>
            <p className="text-sm font-semibold text-[var(--accent)] group-hover:underline">
              Does this kit fit your needs?
            </p>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              Enter your appliances and location to see if {kit.name} covers your power requirements.
            </p>
          </div>
          <svg className="ml-auto shrink-0 text-[var(--accent)]" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </Link>
      </section>

      {/* Similar kits */}
      <section>
        <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4">
          Compare With Similar Kits
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {getSimilarKits(kit, getKits(), 3).map((k) => (
              <Link
                key={k.slug}
                href={`/kits/${k.slug}`}
                className="group rounded border border-[var(--border)] bg-[var(--bg-surface)] p-4 hover:border-[var(--border-accent)] transition-colors"
              >
                <p className="text-xs font-medium text-[var(--text-muted)]">{k.brand}</p>
                <p className="text-sm font-semibold text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors line-clamp-1 mt-0.5">
                  {k.name}
                </p>
                <div className="flex items-center gap-3 mt-2">
                  <span className="font-mono text-xs text-[var(--accent)]">${k.trueCost.toLocaleString()}</span>
                  <span className="font-mono text-xs text-[var(--text-muted)]">{k.panelWatts}W / {k.storageWh > 0 ? `${(k.storageWh / 1000).toFixed(1)}kWh` : "No storage"}</span>
                </div>
              </Link>
            ))}
        </div>
      </section>
    </div>
  );
}
