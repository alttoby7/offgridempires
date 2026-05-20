import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getKits, getKitBySlug, getKitSlugs, getKitVariants, isPrimaryVariant } from "@/lib/get-kits";
import { CompletenessBadges } from "@/components/ui/completeness-badges";
import { PriceTimestamp } from "@/components/ui/price-timestamp";
import { SpecBlock } from "@/components/ui/spec-block";
import { GapReceipt } from "@/components/ui/gap-receipt";
import { BomTable } from "@/components/ui/bom-table";
import { PriceHistorySection } from "@/components/ui/price-history-section";
import { RetailerListings } from "@/components/ui/retailer-listings";
import { KitProductJsonLd, BreadcrumbJsonLd } from "@/components/json-ld";
import { getSimilarKits } from "@/lib/similar-kits";
import { buildAffiliateUrl, deriveRetailerSlug } from "@/lib/affiliate";
import { AffiliateLink } from "@/components/ui/affiliate-link";
import { VariantPicker } from "@/components/ui/variant-picker";
import { StickyBuyBar } from "@/components/ui/sticky-buy-bar";
import { PriceAlertForm } from "@/components/ui/price-alert-form";
import { DataFooter } from "@/components/ui/data-footer";
import { KitEvidence } from "@/components/evidence/kit-evidence";
import { KitArticleHandoffs } from "@/components/kit-article-handoffs";
import { FitChip, AvoidChip } from "@/components/fit-chip";
import { getKitsUpdated } from "@/lib/data-meta";
import { getMatchingHub } from "@/lib/hubs";

export const dynamic = "force-static";
export const dynamicParams = false;

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
  const fullName = kit ? `${kit.brand} ${kit.name}` : "";
  const title = kit
    ? `${fullName} Review: Real Build Cost, Missing Parts & Price History`
    : "Kit Not Found";
  const description = kit
    ? `Full component breakdown and true total cost for the ${fullName}. See what's included, what's missing, and the real price.`
    : undefined;

  // Non-primary variants are near-duplicate configs of the same product —
  // noindex,follow them so only one indexable page exists per product group.
  // Variant pages stay rendered + crawlable for the VariantPicker UX.
  const noindex = kit ? !isPrimaryVariant(slug) : false;

  return {
    title,
    description,
    alternates: { canonical: `/kits/${slug}` },
    ...(noindex ? { robots: { index: false, follow: true } } : {}),
    openGraph: {
      title: kit ? `${fullName} Review: Real Build Cost` : title,
      description,
      url: `/kits/${slug}`,
    },
  };
}

export default async function KitDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const kit = getKitBySlug(slug);

  if (!kit) {
    notFound();
  }

  const missingItems = kit.items.filter((item) => !item.isIncluded);
  const includedItems = kit.items.filter((item) => item.isIncluded);
  const variants = getKitVariants(slug);
  const hasVariantsWithPanels = variants.some((v) => v.included?.panels === true);
  const primarySlug = kit.retailerSlug ?? deriveRetailerSlug(kit.retailer, kit.sourceUrl);
  const affiliateUrl = buildAffiliateUrl(kit.sourceUrl, primarySlug);

  const allOffers =
    kit.offers && kit.offers.length > 0
      ? kit.offers.map((o) => ({
          ...o,
          sourceUrl: buildAffiliateUrl(o.sourceUrl, o.retailerSlug) ?? o.sourceUrl,
        }))
      : [
          {
            retailer: kit.retailer,
            retailerSlug: primarySlug,
            price: kit.listedPrice,
            sourceUrl: affiliateUrl ?? undefined,
            inStock: true,
            observedAt: kit.priceObservedAt,
          },
        ];

  // Plain-language status line for the headline
  const statusLine = (() => {
    if (missingItems.length === 0) return "Complete kit — advertised price is the real price.";
    const missingRoles = Array.from(new Set(missingItems.map((i) => i.role)));
    if (kit.missingCost > 0) {
      const list =
        missingRoles.length === 1
          ? missingRoles[0]
          : missingRoles.length === 2
            ? `${missingRoles[0]} and ${missingRoles[1]}`
            : `${missingRoles[0]}, ${missingRoles[1]}, and ${missingRoles.length - 2} more`;
      return `Ships missing ${list} — see receipt below.`;
    }
    return `${missingRoles.length} component role${missingRoles.length > 1 ? "s" : ""} not included.`;
  })();

  const hub = getMatchingHub(kit);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <KitProductJsonLd kit={kit} />
      <BreadcrumbJsonLd
        items={[
          { name: "Home", url: "/" },
          { name: "Kits", url: "/kits" },
          { name: `${kit.brand} ${kit.name}`, url: `/kits/${kit.slug}` },
        ]}
      />

      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-[var(--ink-muted)] mb-6">
        <Link href="/" className="hover:text-[var(--accent)] transition-colors">Home</Link>
        <span>/</span>
        <Link href="/kits" className="hover:text-[var(--accent)] transition-colors">Kits</Link>
        <span>/</span>
        <span className="text-[var(--ink-soft)] truncate max-w-[200px]">{kit.name}</span>
      </nav>

      {/* HERO — display H1 + price statement, single column */}
      <header className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <span className="eyebrow">{kit.brand}</span>
          <span className="text-xs text-[var(--ink-muted)]">via {kit.retailer}</span>
          <PriceTimestamp observedAt={kit.priceObservedAt} />
        </div>
        <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl text-[var(--ink)] leading-[1.05] tracking-tight max-w-3xl">
          {kit.displayName ?? kit.name}
        </h1>

        {/* Price statement — the focal moment */}
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6 items-end">
          <div className="lg:col-span-2">
            <p className="eyebrow mb-2">Real build cost</p>
            <div className="flex items-baseline gap-4 flex-wrap">
              <span className="font-display tabular text-5xl sm:text-6xl text-[var(--accent)]">
                ${kit.trueCost.toLocaleString()}
              </span>
              {kit.missingCost > 0 && (
                <span className="tabular text-xl text-[var(--ink-muted)] line-through decoration-[1px]">
                  ${kit.listedPrice.toLocaleString()}
                </span>
              )}
              {kit.missingCost > 0 && (
                <span className="tabular text-sm text-[var(--signal-red)] font-semibold">
                  +${kit.missingCost.toLocaleString()} hidden
                </span>
              )}
            </div>
            <p className="mt-3 text-base text-[var(--ink-soft)] max-w-xl leading-snug">
              {statusLine}
            </p>

            {/* Fit chips */}
            <div className="mt-5 flex flex-wrap gap-2">
              <FitChip useCaseRatings={kit.useCaseRatings} />
              <AvoidChip useCaseRatings={kit.useCaseRatings} />
            </div>
          </div>

          {/* Buy CTA */}
          <div className="space-y-2.5">
            {affiliateUrl ? (
              <AffiliateLink
                href={affiliateUrl}
                kitSlug={kit.slug}
                retailer={kit.retailer ?? "unknown"}
                price={kit.listedPrice}
                className="flex items-center justify-center gap-2 w-full rounded-sm bg-[var(--ink)] py-3.5 text-sm font-bold text-[var(--paper)] hover:bg-[var(--accent)] transition-colors"
              >
                View on {kit.retailer}
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" />
                </svg>
              </AffiliateLink>
            ) : (
              <div className="flex items-center justify-center gap-2 w-full rounded-sm bg-[var(--bg-elevated)] py-3.5 text-sm font-medium text-[var(--ink-muted)]">
                Retailer link unavailable
              </div>
            )}
            {affiliateUrl && (
              <p className="text-xs text-[var(--ink-muted)] text-center">
                Affiliate — your price is the same
              </p>
            )}
            <Link
              href={`/compare?kits=${kit.slug}`}
              className="flex items-center justify-center gap-2 w-full rounded-sm border border-[var(--rule)] bg-[var(--bg-surface)] py-2.5 text-xs font-medium text-[var(--ink-soft)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors"
            >
              Compare with similar kits
            </Link>
          </div>
        </div>

        <div className="mt-5">
          <DataFooter updated={getKitsUpdated()} />
        </div>
      </header>

      {/* Specs row */}
      <section className="mb-10 rounded-sm border border-[var(--rule)] bg-[var(--bg-surface)] p-5">
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <SpecBlock label="Solar" value={`${kit.panelWatts}W`} />
          <SpecBlock label="Storage" value={kit.storageWh > 0 ? `${(kit.storageWh / 1000).toFixed(1)}kWh` : "None"} />
          <SpecBlock label="Inverter" value={kit.inverterWatts > 0 ? `${kit.inverterWatts}W` : "None"} />
          <SpecBlock label="Cost / W" value={kit.costPerW} highlight />
          <SpecBlock label="Cost / Wh" value={kit.costPerWh} highlight />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
          <div className="rounded-sm bg-[var(--bg-secondary)] border border-[var(--rule)] p-3">
            <p className="eyebrow mb-1">System voltage</p>
            <p className="tabular text-sm font-semibold text-[var(--ink)]">
              {kit.voltage > 0 ? `${kit.voltage}V` : "N/A"}
            </p>
          </div>
          <div className="rounded-sm bg-[var(--bg-secondary)] border border-[var(--rule)] p-3">
            <p className="eyebrow mb-1">Battery chemistry</p>
            <p className="tabular text-sm font-semibold text-[var(--ink)]">
              {kit.chemistry !== "None" ? kit.chemistry : "N/A"}
            </p>
          </div>
        </div>
      </section>

      {/* Component completeness — visual */}
      <section className="mb-10">
        <div className="flex items-baseline gap-3 mb-3">
          <h2 className="font-display text-xl text-[var(--ink)]">What's included</h2>
          <span className="flex-1 border-b border-[var(--rule)]" />
          <span className="tabular text-sm font-semibold text-[var(--ink)]">
            {kit.completeness}% complete
          </span>
        </div>
        <CompletenessBadges included={kit.included} size="md" />
      </section>

      {/* Receipt — the canonical artifact */}
      <section className="mb-12">
        <GapReceipt kit={kit} hasVariantsWithPanels={hasVariantsWithPanels} />
      </section>

      {/* Variant picker */}
      {variants.length > 0 && (
        <section className="mb-12">
          <VariantPicker currentKit={kit} variants={variants} />
        </section>
      )}

      {/* Structured evidence — replaces templated prose */}
      <section className="mb-12">
        <div className="flex items-baseline gap-3 mb-4">
          <h2 className="font-display text-xl text-[var(--ink)]">Evidence</h2>
          <span className="flex-1 border-b border-[var(--rule)]" />
          <span className="eyebrow">Cohort-normalized</span>
        </div>
        <KitEvidence kit={kit} allKits={getKits()} />
      </section>

      {/* Component decomposition table */}
      {kit.items.length > 0 && (
        <section className="mb-12">
          <div className="flex items-baseline gap-3 mb-4">
            <h2 className="font-display text-xl text-[var(--ink)]">Component breakdown</h2>
            <span className="flex-1 border-b border-[var(--rule)]" />
            <span className="text-xs text-[var(--ink-muted)] tabular">
              {includedItems.length} included · {missingItems.length} missing
            </span>
          </div>
          <BomTable items={kit.items} missingCost={kit.missingCost} />
        </section>
      )}

      {/* Price history */}
      <section className="mb-12">
        <div className="flex items-baseline gap-3 mb-4">
          <h2 className="font-display text-xl text-[var(--ink)]">Price history</h2>
          <span className="flex-1 border-b border-[var(--rule)]" />
        </div>
        <PriceHistorySection kit={kit} />
      </section>

      {/* Retailers */}
      {allOffers.length > 1 && (
        <section className="mb-12">
          <div className="flex items-baseline gap-3 mb-4">
            <h2 className="font-display text-xl text-[var(--ink)]">Where to buy</h2>
            <span className="flex-1 border-b border-[var(--rule)]" />
          </div>
          <RetailerListings offers={allOffers} kitName={`${kit.brand} ${kit.name}`} />
        </section>
      )}

      {/* Article handoffs — fixes article ↔ kit cross-link gap */}
      <section className="mb-12">
        <KitArticleHandoffs kit={kit} max={3} />
      </section>

      {/* Matching hub */}
      {hub && (
        <section className="mb-12">
          <Link
            href={`/${hub.slug}`}
            className="flex items-center gap-3 rounded-sm border border-[var(--rule)] bg-[var(--bg-surface)] p-4 hover:border-[var(--accent)] transition-colors group"
          >
            <div>
              <p className="text-sm font-semibold text-[var(--ink)] group-hover:text-[var(--accent)] transition-colors">
                See how this kit ranks in the {hub.label} guide
              </p>
              <p className="text-xs text-[var(--ink-muted)] mt-0.5">{hub.note}</p>
            </div>
            <svg className="ml-auto shrink-0 text-[var(--ink-muted)] group-hover:text-[var(--accent)]" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
        </section>
      )}

      {/* Price alert + calculator */}
      <section className="mb-12 grid grid-cols-1 md:grid-cols-2 gap-4">
        <PriceAlertForm kitSlug={kit.slug} />
        <Link
          href="/calculator"
          className="flex items-center gap-3 rounded-sm border border-[var(--rule)] bg-[var(--bg-surface)] p-5 hover:border-[var(--accent)] transition-colors group"
        >
          <div>
            <p className="text-sm font-semibold text-[var(--ink)] group-hover:text-[var(--accent)] transition-colors">
              Does this kit cover your loads?
            </p>
            <p className="text-xs text-[var(--ink-muted)] mt-0.5">
              Enter your appliances to size against the {kit.displayName ?? kit.name}.
            </p>
          </div>
          <svg className="ml-auto shrink-0 text-[var(--ink-muted)] group-hover:text-[var(--accent)]" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </Link>
      </section>

      {/* Similar kits */}
      <section className="rounded-sm border border-[var(--rule)] bg-[var(--bg-surface)] p-6">
        <div className="flex items-baseline gap-3 mb-5">
          <h2 className="font-display text-xl text-[var(--ink)]">Similar kits</h2>
          <span className="flex-1 border-b border-[var(--rule)]" />
          <Link href={`/compare?kits=${kit.slug}`} className="text-xs text-[var(--accent)] hover:underline">
            Compare all
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {getSimilarKits(kit, getKits(), 3).map((k) => (
            <Link
              key={k.slug}
              href={`/kits/${k.slug}`}
              className="group rounded-sm border border-[var(--rule)] bg-[var(--paper)] p-4 hover:border-[var(--accent)] transition-colors"
            >
              <p className="eyebrow mb-1">{k.brand}</p>
              <p className="font-display text-base font-medium text-[var(--ink)] group-hover:text-[var(--accent)] transition-colors line-clamp-2 leading-snug">
                {k.displayName ?? k.name}
              </p>
              <div className="flex items-center gap-3 mt-2.5 text-xs">
                <span className="tabular font-semibold text-[var(--accent)]">
                  ${k.trueCost.toLocaleString()}
                </span>
                <span className="tabular text-[var(--ink-muted)]">
                  {k.panelWatts}W{k.storageWh > 0 ? ` · ${(k.storageWh / 1000).toFixed(1)}kWh` : ""}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Sticky mobile buy bar */}
      {affiliateUrl && (
        <StickyBuyBar
          trueCost={kit.trueCost}
          retailer={kit.retailer ?? "Retailer"}
          affiliateUrl={affiliateUrl}
          kitSlug={kit.slug}
          listedPrice={kit.listedPrice}
        />
      )}
    </div>
  );
}
