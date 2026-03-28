import type { Metadata } from "next";
import { Hero } from "@/components/hero";
import { KitCard } from "@/components/kit-card";
import { WebSiteJsonLd, BreadcrumbJsonLd } from "@/components/json-ld";
import { getKits, getKitsByType, getKitCounts } from "@/lib/get-kits";
import Link from "next/link";

export const metadata: Metadata = {
  title: "OffGridEmpire — Compare Every Off-Grid Solar Kit",
  description:
    "Stop comparing sticker prices. Compare true total costs. The solar kit comparison engine with real build costs, component breakdowns, and price tracking.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "OffGridEmpire — Compare Every Off-Grid Solar Kit",
    description:
      "Stop comparing sticker prices. Compare true total costs. The solar kit comparison engine with real build costs and component breakdowns.",
    url: "/",
  },
};

const useCaseChips = [
  { id: "rv", label: "RV & Van Life", href: "/best-for/rv" },
  { id: "cabin", label: "Cabin", href: "/best-for/cabin" },
  { id: "homestead", label: "Homestead", href: "/best-for/homestead" },
  { id: "emergency", label: "Emergency", href: "/best-for/emergency" },
  { id: "shed", label: "Shed", href: "/best-for/shed" },
  { id: "boat", label: "Boat", href: "/best-for/boat" },
];

function getBestByValue(kits: ReturnType<typeof getKits>) {
  return [...kits]
    .filter((k) => k.costPerWh !== "N/A" && k.listedPrice > 0)
    .sort(
      (a, b) =>
        parseFloat(a.costPerWh.replace("$", "")) -
        parseFloat(b.costPerWh.replace("$", ""))
    )[0];
}

export default function HomePage() {
  const kits = getKits();
  const counts = getKitCounts();
  const brandCount = new Set(kits.map((k) => k.brand)).size;

  // Trap Kit: worst completion gap
  const trapKit = kits
    .filter((k) => k.missingCost > 0 && k.listedPrice > 0)
    .sort(
      (a, b) =>
        b.missingCost / b.listedPrice - a.missingCost / a.listedPrice
    )[0];

  // Smart Path picks
  const cheapest = [...kits].sort(
    (a, b) => a.listedPrice - b.listedPrice
  )[0];
  const cheapestComplete = [...kits]
    .filter((k) => k.completeness >= 90)
    .sort((a, b) => a.trueCost - b.trueCost)[0];
  const mostStorage = [...kits].sort(
    (a, b) => b.storageWh - a.storageWh
  )[0];
  const bestValue = getBestByValue(kits);
  const bestSolarValue = [...kits]
    .filter((k) => k.costPerW !== "N/A")
    .sort(
      (a, b) =>
        parseFloat(a.costPerW.replace("$", "")) -
        parseFloat(b.costPerW.replace("$", ""))
    )[0];

  const smartPaths = [
    cheapest && {
      label: "Cheapest Setup",
      eyebrow: "Lowest upfront price",
      kit: cheapest,
      stat: `$${cheapest.listedPrice.toLocaleString()}`,
      detail:
        cheapest.missingCost > 0
          ? `+$${cheapest.missingCost.toLocaleString()} missing`
          : "Nothing missing",
    },
    cheapestComplete && {
      label: "Cheapest Complete",
      eyebrow: "Lowest total cost, ready to use",
      kit: cheapestComplete,
      stat: `$${cheapestComplete.trueCost.toLocaleString()}`,
      detail: `${cheapestComplete.completeness}% complete`,
    },
    mostStorage && {
      label: "Most Storage",
      eyebrow: "Largest battery capacity",
      kit: mostStorage,
      stat: `${mostStorage.storageWh.toLocaleString()} Wh`,
      detail: `$${mostStorage.trueCost.toLocaleString()} total`,
    },
    bestSolarValue && {
      label: "Best Solar Value",
      eyebrow: "Most watts for your money",
      kit: bestSolarValue,
      stat: `${bestSolarValue.costPerW}/W`,
      detail: `${bestSolarValue.panelWatts}W solar`,
    },
    bestValue && {
      label: "Best Storage Value",
      eyebrow: "Best storage for your money",
      kit: bestValue,
      stat: `${bestValue.costPerWh}/Wh`,
      detail: `${bestValue.storageWh.toLocaleString()} Wh storage`,
    },
  ].filter(Boolean) as {
    label: string;
    eyebrow: string;
    kit: (typeof kits)[0];
    stat: string;
    detail: string;
  }[];

  // Featured kits by type — best value from each category
  const portableKits = getKitsByType("portable");
  const diyKits = getKitsByType("diy-kit");
  const wholeHomeKits = getKitsByType("whole-home");

  const topPortable = [...portableKits]
    .sort((a, b) => a.trueCost - b.trueCost)
    .slice(0, 4);
  const topDiy = [...diyKits, ...getKitsByType("panels-only")]
    .sort((a, b) => a.trueCost - b.trueCost)
    .slice(0, 4);
  const topWholeHome = [...wholeHomeKits]
    .sort((a, b) => a.trueCost - b.trueCost)
    .slice(0, 4);

  return (
    <>
      <WebSiteJsonLd />
      <BreadcrumbJsonLd items={[{ name: "Home", url: "/" }]} />

      {/* Section 1: Hero */}
      {trapKit && (
        <Hero
          trapKit={trapKit}
          kitCount={kits.length}
          brandCount={brandCount}
        />
      )}

      {/* Section 2: Persona Router — "What are you looking for?" */}
      <section className="border-b border-[var(--border)]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
          <h2 className="text-sm font-medium uppercase tracking-wide text-[var(--text-muted)] mb-4">
            What are you looking for?
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Portable Power */}
            <Link
              href="/portable-power"
              className="group relative rounded border border-[var(--border)] bg-[var(--bg-surface)] p-6 hover:border-[var(--accent)]/50 hover:bg-[var(--bg-elevated)] transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded bg-[var(--accent)]/10">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-[var(--accent)]"
                  >
                    <rect x="1" y="6" width="18" height="12" rx="2" ry="2" />
                    <line x1="23" y1="13" x2="23" y2="11" />
                  </svg>
                </div>
                <span className="font-mono text-xs text-[var(--text-muted)]">
                  {counts.portable}
                </span>
              </div>
              <h3 className="text-lg font-bold text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors">
                Portable Power
              </h3>
              <p className="text-sm text-[var(--text-secondary)] mt-1 leading-relaxed">
                All-in-one battery stations. No wiring, no installation. Plug in
                and go.
              </p>
              <p className="text-xs text-[var(--text-muted)] mt-3">
                EcoFlow, Bluetti, Jackery, Anker
              </p>
              <div className="mt-4 text-sm font-medium text-[var(--accent)] group-hover:underline">
                Browse stations &rarr;
              </div>
            </Link>

            {/* Build My System (→ Calculator) */}
            <Link
              href="/calculator"
              className="group relative rounded border-2 border-[var(--accent)]/30 bg-[var(--accent)]/5 p-6 hover:border-[var(--accent)]/60 hover:bg-[var(--accent)]/10 transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded bg-[var(--accent)]/20">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-[var(--accent)]"
                  >
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                  </svg>
                </div>
                <span className="font-mono text-xs text-[var(--text-muted)]">
                  {counts["diy-kit"] + counts["panels-only"]}
                </span>
              </div>
              <h3 className="text-lg font-bold text-[var(--accent)]">
                Build My System
              </h3>
              <p className="text-sm text-[var(--text-secondary)] mt-1 leading-relaxed">
                DIY solar for your RV, cabin, or shed. Start by sizing what you
                need.
              </p>
              <p className="text-xs text-[var(--text-muted)] mt-3">
                Renogy, Eco-Worthy, WindyNation
              </p>
              <div className="mt-4 text-sm font-bold text-[var(--accent)] group-hover:underline">
                Size my system &rarr;
              </div>
            </Link>

            {/* Whole-Home / Off-Grid */}
            <Link
              href="/whole-home"
              className="group relative rounded border border-[var(--border)] bg-[var(--bg-surface)] p-6 hover:border-[var(--accent)]/50 hover:bg-[var(--bg-elevated)] transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded bg-[var(--accent)]/10">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-[var(--accent)]"
                  >
                    <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                    <polyline points="9 22 9 12 15 12 15 22" />
                  </svg>
                </div>
                <span className="font-mono text-xs text-[var(--text-muted)]">
                  {counts["whole-home"]}
                </span>
              </div>
              <h3 className="text-lg font-bold text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors">
                Whole-Home / Off-Grid
              </h3>
              <p className="text-sm text-[var(--text-secondary)] mt-1 leading-relaxed">
                5kW+ complete systems. Buy the equipment yourself, skip
                contractor markup.
              </p>
              <p className="text-xs text-[var(--text-muted)] mt-3">
                Shop Solar, EG4, Sol-Ark
              </p>
              <div className="mt-4 text-sm font-medium text-[var(--accent)] group-hover:underline">
                Browse systems &rarr;
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Section 3: Smart Paths */}
      <section className="border-b border-[var(--border)]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
          <h2 className="text-sm font-medium uppercase tracking-wide text-[var(--text-muted)] mb-4">
            Quick Finds
          </h2>

          <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
            {smartPaths.map((path) => (
              <Link
                key={path.label}
                href={`/kits/${path.kit.slug}`}
                className="group rounded border border-[var(--border)] bg-[var(--bg-surface)] p-4 hover:border-[var(--border-accent)] hover:bg-[var(--bg-elevated)] transition-all"
              >
                <p className="text-xs text-[var(--text-muted)] mb-2 truncate">
                  {path.eyebrow}
                </p>
                <p className="text-sm font-semibold text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors">
                  {path.label}
                </p>
                <p className="font-mono text-lg font-bold text-[var(--accent)] mt-1">
                  {path.stat}
                </p>
                <p className="text-xs text-[var(--text-muted)] mt-1">
                  {path.detail}
                </p>
              </Link>
            ))}

            {/* Calculator CTA */}
            <Link
              href="/calculator"
              className="group rounded border border-[var(--accent)]/30 bg-[var(--accent)]/5 p-4 hover:border-[var(--accent)]/60 hover:bg-[var(--accent)]/10 transition-all"
            >
              <p className="text-xs text-[var(--accent)]/70 mb-2">
                Power Calculator
              </p>
              <p className="text-sm font-semibold text-[var(--accent)]">
                Size My System
              </p>
              <p className="font-mono text-lg font-bold text-[var(--accent)] mt-1">
                ⚡
              </p>
              <p className="text-xs text-[var(--text-muted)] mt-1">
                Calculate your solar needs
              </p>
            </Link>
          </div>

          {/* Use case chips */}
          <div className="mt-6 flex flex-wrap items-center gap-2">
            <span className="text-xs text-[var(--text-muted)] mr-1">
              Browse by use case:
            </span>
            {useCaseChips.map((uc) => (
              <Link
                key={uc.id}
                href={uc.href}
                className="rounded-sm border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-1 text-xs text-[var(--text-secondary)] hover:border-[var(--border-accent)] hover:text-[var(--accent)] transition-colors"
              >
                {uc.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Section 4: Featured by Type */}
      <section className="border-b border-[var(--border)]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 space-y-10">
          {/* Portable Stations */}
          {topPortable.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-[var(--text-primary)]">
                  Top Portable Stations
                </h2>
                <Link
                  href="/portable-power"
                  className="text-sm text-[var(--accent)] hover:underline"
                >
                  See all {portableKits.length} &rarr;
                </Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {topPortable.map((kit) => (
                  <KitCard key={kit.slug} kit={kit} />
                ))}
              </div>
            </div>
          )}

          {/* DIY Kits */}
          {topDiy.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-[var(--text-primary)]">
                  Top DIY Kits
                </h2>
                <Link
                  href="/solar-kits"
                  className="text-sm text-[var(--accent)] hover:underline"
                >
                  See all {diyKits.length + getKitsByType("panels-only").length}{" "}
                  &rarr;
                </Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {topDiy.map((kit) => (
                  <KitCard key={kit.slug} kit={kit} />
                ))}
              </div>
            </div>
          )}

          {/* Whole-Home Systems */}
          {topWholeHome.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-[var(--text-primary)]">
                  Top Complete Systems
                </h2>
                <Link
                  href="/whole-home"
                  className="text-sm text-[var(--accent)] hover:underline"
                >
                  See all {wholeHomeKits.length} &rarr;
                </Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {topWholeHome.map((kit) => (
                  <KitCard key={kit.slug} kit={kit} />
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Section 5: Trust / Transparency */}
      <section className="bg-[var(--bg-secondary)]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-xl font-bold text-[var(--text-primary)] mb-3">
              No hidden agendas. Just data.
            </h2>
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-8">
              We earn affiliate commissions when you buy through our links —
              same price for you. Every recommendation is data-driven. No
              sponsored rankings, no pay-to-play. Period.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                {
                  icon: "◈",
                  label: "Normalized specs",
                  detail: "Apples-to-apples",
                },
                {
                  icon: "◉",
                  label: "True total cost",
                  detail: "Including what's missing",
                },
                {
                  icon: "◆",
                  label: "Live pricing",
                  detail: "Tracked every 6 hours",
                },
                {
                  icon: "◇",
                  label: "Price history",
                  detail: "Know if it's a deal",
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded border border-[var(--border)] bg-[var(--bg-surface)] p-4"
                >
                  <span className="text-xl text-[var(--accent)]">
                    {item.icon}
                  </span>
                  <p className="text-sm font-medium text-[var(--text-primary)] mt-2">
                    {item.label}
                  </p>
                  <p className="text-xs text-[var(--text-muted)] mt-0.5">
                    {item.detail}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-8">
              <Link
                href="/kits"
                className="inline-flex items-center gap-2 rounded bg-[var(--accent)] px-6 py-3 text-sm font-bold text-[var(--bg-primary)] hover:bg-[var(--accent-hover)] transition-colors"
              >
                Browse all {kits.length} kits
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
