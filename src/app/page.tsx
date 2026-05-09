import type { Metadata } from "next";
import Link from "next/link";
import { Receipt } from "@/components/receipt";
import {
  WebSiteJsonLd,
  BreadcrumbJsonLd,
  OrganizationJsonLd,
} from "@/components/json-ld";
import { getKits, getKitCounts } from "@/lib/get-kits";
import { getKitsUpdated } from "@/lib/data-meta";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Compare Off-Grid Solar Kits by Real Build Cost",
  description:
    "The independent audit layer for off-grid solar. We track every kit, normalize specs, and price in the parts they leave out — so the sticker doesn't surprise you.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Compare Off-Grid Solar Kits by Real Build Cost",
    description:
      "The independent audit layer for off-grid solar. Real build cost on every kit, refreshed every 6 hours.",
    url: "/",
  },
};

const useCaseTiles = [
  {
    href: "/best-for/rv",
    label: "RV & van life",
    blurb: "Weight, mounting, mobility",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 17V8a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v9" />
        <path d="M17 11h3l2 4v2h-5" />
        <circle cx="7" cy="18" r="2" />
        <circle cx="17" cy="18" r="2" />
      </svg>
    ),
  },
  {
    href: "/best-for/cabin",
    label: "Weekend cabin",
    blurb: "Quiet, off-meter, low maintenance",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 12l9-8 9 8" />
        <path d="M5 10v10h14V10" />
        <path d="M10 20v-6h4v6" />
      </svg>
    ),
  },
  {
    href: "/best-for/homestead",
    label: "Homestead",
    blurb: "Daily loads, year-round autonomy",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="8" r="3" />
        <path d="M3 21l3-7 6 5 6-5 3 7" />
      </svg>
    ),
  },
  {
    href: "/best-for/emergency",
    label: "Emergency",
    blurb: "Outages, evacuation, medical",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M13 2L3 14h7l-1 8 10-12h-7l1-8z" />
      </svg>
    ),
  },
  {
    href: "/best-for/shed",
    label: "Shed / workshop",
    blurb: "Lights, tools, occasional use",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <rect x="4" y="8" width="16" height="12" />
        <path d="M4 8l8-5 8 5" />
        <path d="M9 13h6v7H9z" />
      </svg>
    ),
  },
  {
    href: "/best-for/boat",
    label: "Boat / marine",
    blurb: "Sealed, salt-resistant, 12V",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 18l2-9h14l2 9" />
        <path d="M3 18s2 2 9 2 9-2 9-2" />
        <path d="M12 4v5" />
      </svg>
    ),
  },
];

const guideLinks = [
  { href: "/best-rv-solar-kit", label: "Best RV solar kit" },
  { href: "/1000-watt-solar-kit", label: "1000W solar kits" },
  { href: "/2000-watt-solar-kit", label: "2000W solar kits" },
  { href: "/best-solar-generator-under-500", label: "Solar generator under $500" },
];

export default function HomePage() {
  const kits = getKits();
  const counts = getKitCounts();
  const total =
    (counts.portable ?? 0) +
    (counts["diy-kit"] ?? 0) +
    (counts["whole-home"] ?? 0) +
    (counts["panels-only"] ?? 0);
  const brandCount = new Set(kits.map((k) => k.brand)).size;
  const updated = getKitsUpdated();

  // Trap kit — worst gap as a fraction of advertised price
  const trapKit = kits
    .filter((k) => k.missingCost > 0 && k.listedPrice > 0)
    .sort(
      (a, b) =>
        b.missingCost / b.listedPrice - a.missingCost / a.listedPrice
    )[0];

  // Receipt of the week — second-worst, used in editorial section below
  const receiptKits = kits
    .filter((k) => k.missingCost > 0 && k.listedPrice > 0)
    .sort(
      (a, b) =>
        b.missingCost / b.listedPrice - a.missingCost / a.listedPrice
    );
  const featured = receiptKits[1] ?? receiptKits[0];

  const trapPctMore =
    trapKit && trapKit.listedPrice > 0
      ? Math.round(((trapKit.trueCost - trapKit.listedPrice) / trapKit.listedPrice) * 100)
      : 0;

  return (
    <>
      <WebSiteJsonLd />
      <BreadcrumbJsonLd items={[{ name: "Home", url: "/" }]} />
      <OrganizationJsonLd />

      {/* ─── HERO ──────────────────────────────────────────────────────────── */}
      <section className="border-b border-[var(--rule)]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14 sm:py-20 lg:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
            {/* Left: editorial */}
            <div className="lg:col-span-6">
              <div className="inline-flex items-center gap-2 mb-6 text-xs">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-[var(--accent)] opacity-60 animate-ping" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[var(--accent)]" />
                </span>
                <span className="eyebrow !text-[var(--ink-soft)]">
                  Tracking {total.toLocaleString()} kits across {brandCount} brands
                </span>
              </div>

              <h1 className="font-display text-[2.5rem] sm:text-5xl lg:text-[3.75rem] leading-[1.02] tracking-tight text-[var(--ink)]">
                The independent audit layer for{" "}
                <em className="font-display italic text-[var(--accent)]">off-grid solar.</em>
              </h1>

              <p className="mt-6 text-lg text-[var(--ink-soft)] leading-relaxed max-w-xl">
                We show the <strong className="text-[var(--ink)]">real build cost</strong> of every solar kit —
                the advertised price plus any required parts the kit leaves out.
                Refreshed every six hours.
              </p>

              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <Link
                  href="/kits"
                  className="inline-flex items-center justify-center gap-2 rounded-sm bg-[var(--ink)] px-6 py-3.5 text-sm font-bold text-[var(--paper)] hover:bg-[var(--accent)] transition-colors"
                >
                  Browse the kits we audit
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </Link>
                <Link
                  href="/calculator"
                  className="inline-flex items-center justify-center gap-2 rounded-sm border border-[var(--ink)] bg-transparent px-6 py-3.5 text-sm font-semibold text-[var(--ink)] hover:bg-[var(--ink)] hover:text-[var(--paper)] transition-colors"
                >
                  Size your system
                </Link>
              </div>

              <p className="mt-6 text-sm text-[var(--ink-soft)]">
                <Link href="/this-week/" className="text-[var(--accent)] hover:underline font-medium">
                  See this week&apos;s biggest price drops →
                </Link>
              </p>

              {/* Quick stats */}
              <dl className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-y-5 gap-x-4">
                {[
                  { value: total.toLocaleString(), label: "Kits tracked" },
                  { value: String(brandCount), label: "Brands" },
                  { value: "6h", label: "Price refresh" },
                  { value: "$0", label: "Always free" },
                ].map((stat) => (
                  <div key={stat.label}>
                    <dt className="eyebrow !text-[var(--ink-muted)]">{stat.label}</dt>
                    <dd className="font-display tabular text-2xl text-[var(--ink)] mt-0.5">
                      {stat.value}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>

            {/* Right: receipt as the hero artifact */}
            <div className="lg:col-span-6">
              {trapKit && (
                <Receipt
                  kit={trapKit}
                  variant="hero"
                  href={`/kits/${trapKit.slug}`}
                  caption={`Today's worst sticker trap — ${trapPctMore}% above advertised`}
                />
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ─── RECEIPT OF THE WEEK — editorial frame ─────────────────────────── */}
      {featured && (
        <section className="border-b border-[var(--rule)] bg-[var(--bg-secondary)]">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14 lg:py-20">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
              <div className="lg:col-span-5">
                <p className="eyebrow !text-[var(--accent-hover)] mb-3">Receipt of the week</p>
                <h2 className="font-display text-3xl sm:text-4xl text-[var(--ink)] leading-tight tracking-tight">
                  This kit ships at{" "}
                  <span className="tabular">${featured.listedPrice.toLocaleString()}</span>.
                  It costs{" "}
                  <span className="tabular text-[var(--accent)]">
                    ${featured.trueCost.toLocaleString()}
                  </span>{" "}
                  to actually use.
                </h2>
                <p className="mt-4 text-base text-[var(--ink-soft)] leading-relaxed max-w-md">
                  The {featured.brand} {featured.displayName ?? featured.name} arrives missing{" "}
                  {featured.items.filter((i) => !i.isIncluded && (i.estimatedCost ?? 0) > 0).length}{" "}
                  required parts. Without them, the system doesn&apos;t make power.
                  We priced what&apos;s missing — and stamped it on a receipt.
                </p>
                <Link
                  href={`/kits/${featured.slug}`}
                  className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[var(--accent)] hover:underline"
                >
                  Read the full audit
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>

              <div className="lg:col-span-7">
                <Receipt
                  kit={featured}
                  variant="report"
                  href={`/kits/${featured.slug}`}
                />
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ─── BROWSE BY INTENT ───────────────────────────────────────────────── */}
      <section className="border-b border-[var(--rule)]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14 lg:py-20">
          <div className="flex items-baseline justify-between gap-3 mb-8">
            <div>
              <p className="eyebrow !text-[var(--accent-hover)] mb-1.5">Find your build</p>
              <h2 className="font-display text-3xl sm:text-4xl text-[var(--ink)] leading-tight">
                Browse by what you&apos;re powering
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
            {useCaseTiles.map((tile) => (
              <Link
                key={tile.href}
                href={tile.href}
                className="group relative rounded-sm border border-[var(--rule)] bg-[var(--bg-surface)] p-5 sm:p-6 hover:border-[var(--ink)] transition-colors"
              >
                <div className="flex items-start gap-4">
                  <span className="flex h-10 w-10 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-sm border border-[var(--rule)] bg-[var(--bg-secondary)] text-[var(--accent)] group-hover:bg-[var(--accent-soft)] group-hover:text-[var(--accent-hover)] transition-colors">
                    {tile.icon}
                  </span>
                  <div>
                    <h3 className="font-display text-lg text-[var(--ink)] leading-tight group-hover:text-[var(--accent)] transition-colors">
                      {tile.label}
                    </h3>
                    <p className="mt-1 text-xs text-[var(--ink-muted)]">{tile.blurb}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Guides strip */}
          <div className="mt-10 pt-8 border-t border-[var(--rule)]">
            <p className="eyebrow mb-4">Or start with a curated guide</p>
            <div className="flex flex-wrap gap-x-6 gap-y-2">
              {guideLinks.map((g) => (
                <Link
                  key={g.href}
                  href={g.href}
                  className="text-sm font-medium text-[var(--ink)] hover:text-[var(--accent)] transition-colors underline-offset-4 hover:underline"
                >
                  {g.label} →
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── TRUST STRIP ────────────────────────────────────────────────────── */}
      <section className="bg-[var(--paper)]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-5">
              <p className="eyebrow !text-[var(--accent-hover)] mb-3">How we work</p>
              <h2 className="font-display text-3xl text-[var(--ink)] leading-tight">
                Independent. Cohort-normalized. Updated every six hours.
              </h2>
              <p className="mt-4 text-base text-[var(--ink-soft)] leading-relaxed max-w-md">
                We don&apos;t have an editor&apos;s pick. We don&apos;t take fees from manufacturers.
                Every kit is broken into the same seven roles, scored by the same formula,
                and re-priced from live retailer feeds.
              </p>
            </div>

            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                {
                  label: "No editor's pick",
                  body: "Rankings are formulas, not opinions. Same math for every kit.",
                  href: "/editorial-policy",
                  cta: "Editorial policy",
                },
                {
                  label: "Real build cost",
                  body: "We add back the parts kits leave out, and price them at retail.",
                  href: "/how-real-build-cost-is-calculated",
                  cta: "How it's calculated",
                },
                {
                  label: "Live data",
                  body: `Catalog updated ${updated}. Prices refreshed every six hours.`,
                  href: "/data-sources",
                  cta: "Data sources",
                },
              ].map((card) => (
                <div
                  key={card.label}
                  className="rounded-sm border border-[var(--rule)] bg-[var(--bg-surface)] p-5"
                >
                  <p className="eyebrow !text-[var(--accent-hover)] mb-2">{card.label}</p>
                  <p className="text-sm text-[var(--ink-soft)] leading-relaxed">{card.body}</p>
                  <Link
                    href={card.href}
                    className="mt-3 inline-flex items-center text-xs font-semibold text-[var(--accent)] hover:underline"
                  >
                    {card.cta} →
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
