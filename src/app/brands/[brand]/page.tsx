import type { Metadata } from "next";
import Link from "next/link";
import { getKits } from "@/lib/get-kits";
import { KitCard } from "@/components/kit-card";
import { BreadcrumbJsonLd } from "@/components/json-ld";

// Brand slug → display info
const BRANDS: Record<
  string,
  { name: string; description: string; founded?: string; hq?: string; known?: string }
> = {
  renogy: {
    name: "Renogy",
    description:
      "Renogy is one of the most popular off-grid solar brands, offering panel kits from 200W starter bundles to 800W cabin systems. Known for reliable MPPT controllers and comprehensive kit options.",
    founded: "2010",
    hq: "Ontario, CA",
    known: "MPPT charge controllers, complete panel kits, RV solar",
  },
  "eco-worthy": {
    name: "Eco-Worthy",
    description:
      "Eco-Worthy offers budget-friendly solar panel kits. Their starter kits are among the cheapest entry points into off-grid solar, though many require additional components like batteries and inverters.",
    founded: "2010",
    hq: "Shenzhen, China",
    known: "Budget starter kits, monocrystalline panels",
  },
  ecoflow: {
    name: "EcoFlow",
    description:
      "EcoFlow specializes in portable power stations and integrated solar systems. Their DELTA series combines battery, inverter, and charge controller in one unit — high completeness, premium price.",
    founded: "2017",
    hq: "Shenzhen, China",
    known: "Portable power stations, DELTA series, fast charging",
  },
  jackery: {
    name: "Jackery",
    description:
      "Jackery is a leading portable power station brand. Their Explorer series pairs with foldable solar panels for grab-and-go off-grid power — ideal for camping, RVs, and emergency backup.",
    founded: "2012",
    hq: "Fremont, CA",
    known: "Explorer power stations, foldable solar panels",
  },
  bluetti: {
    name: "Bluetti",
    description:
      "Bluetti builds LiFePO4 power stations and expandable home battery systems. Their AC series targets both portable and whole-home backup with modular battery expansion.",
    founded: "2019",
    hq: "Las Vegas, NV",
    known: "LiFePO4 power stations, expandable battery systems",
  },
  windynation: {
    name: "WindyNation",
    description:
      "WindyNation offers traditional off-grid solar kits with AGM batteries and PWM controllers. Their kits are priced competitively and include complete wiring — good for shed and basic cabin setups.",
    founded: "2010",
    hq: "Ventura, CA",
    known: "AGM battery kits, complete wiring included, budget off-grid",
  },
};

function brandSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

export function generateStaticParams() {
  const kits = getKits();
  const brands = [...new Set(kits.map((k) => brandSlug(k.brand)))];
  return brands.map((brand) => ({ brand }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ brand: string }>;
}): Promise<Metadata> {
  const { brand } = await params;
  const info = BRANDS[brand];
  const name = info?.name ?? brand.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  const title = `${name} Solar Kits — Prices, Specs & True Cost`;
  const description = `Compare all ${name} off-grid solar kits with real build costs, component breakdowns, and live Amazon prices. See what's included and what's missing.`;

  return {
    title,
    description,
    alternates: { canonical: `/brands/${brand}` },
    openGraph: { title: `${name} Solar Kits | OffGridEmpire`, description, url: `/brands/${brand}` },
  };
}

export default async function BrandPage({
  params,
}: {
  params: Promise<{ brand: string }>;
}) {
  const { brand } = await params;
  const allKits = getKits();
  const kits = allKits.filter((k) => brandSlug(k.brand) === brand);
  const info = BRANDS[brand];
  const name = info?.name ?? brand.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  // Stats
  const avgCompleteness = Math.round(kits.reduce((s, k) => s + k.completeness, 0) / kits.length);
  const priceRange =
    kits.length > 0
      ? `$${Math.min(...kits.map((k) => k.trueCost)).toLocaleString()} – $${Math.max(...kits.map((k) => k.trueCost)).toLocaleString()}`
      : "N/A";
  const allBrands = [...new Set(allKits.map((k) => k.brand))].sort();

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <BreadcrumbJsonLd
        items={[
          { name: "Home", url: "/" },
          { name: "Brands", url: "/brands" },
          { name, url: `/brands/${brand}` },
        ]}
      />

      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-[var(--text-muted)] mb-6">
        <Link href="/" className="hover:text-[var(--accent)] transition-colors">Home</Link>
        <span>/</span>
        <Link href="/kits" className="hover:text-[var(--accent)] transition-colors">Kits</Link>
        <span>/</span>
        <span className="text-[var(--text-secondary)]">{name}</span>
      </nav>

      {/* Header */}
      <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)] mb-2">
        {name} Solar Kits
      </h1>
      {info && (
        <p className="text-sm text-[var(--text-secondary)] leading-relaxed max-w-3xl mb-6">
          {info.description}
        </p>
      )}

      {/* Brand stats */}
      <div className="flex flex-wrap gap-3 mb-8">
        <div className="rounded border border-[var(--border)] bg-[var(--bg-surface)] px-4 py-2.5">
          <p className="font-mono text-lg font-bold text-[var(--accent)]">{kits.length}</p>
          <p className="text-xs text-[var(--text-muted)]">Kits Tracked</p>
        </div>
        <div className="rounded border border-[var(--border)] bg-[var(--bg-surface)] px-4 py-2.5">
          <p className="font-mono text-lg font-bold text-[var(--accent)]">{priceRange}</p>
          <p className="text-xs text-[var(--text-muted)]">Real Build Cost Range</p>
        </div>
        <div className="rounded border border-[var(--border)] bg-[var(--bg-surface)] px-4 py-2.5">
          <p className="font-mono text-lg font-bold text-[var(--accent)]">{avgCompleteness}%</p>
          <p className="text-xs text-[var(--text-muted)]">Avg Completeness</p>
        </div>
        {info?.founded && (
          <div className="rounded border border-[var(--border)] bg-[var(--bg-surface)] px-4 py-2.5">
            <p className="font-mono text-lg font-bold text-[var(--text-primary)]">{info.founded}</p>
            <p className="text-xs text-[var(--text-muted)]">Founded</p>
          </div>
        )}
        {info?.known && (
          <div className="rounded border border-[var(--border)] bg-[var(--bg-surface)] px-4 py-2.5">
            <p className="text-sm font-medium text-[var(--text-primary)]">{info.known}</p>
            <p className="text-xs text-[var(--text-muted)]">Known For</p>
          </div>
        )}
      </div>

      {/* Kit grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
        {kits
          .sort((a, b) => a.trueCost - b.trueCost)
          .map((kit) => (
            <KitCard key={kit.slug} kit={kit} />
          ))}
      </div>

      {/* Cross-links to other brands */}
      <div className="pt-6 border-t border-[var(--border)]">
        <p className="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)] mb-3">
          Compare Other Brands
        </p>
        <div className="flex flex-wrap gap-2">
          {allBrands
            .filter((b) => brandSlug(b) !== brand)
            .map((b) => (
              <Link
                key={b}
                href={`/brands/${brandSlug(b)}`}
                className="rounded border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-1.5 text-xs text-[var(--text-secondary)] hover:border-[var(--border-accent)] hover:text-[var(--accent)] transition-colors"
              >
                {b}
              </Link>
            ))}
        </div>
      </div>
    </div>
  );
}
