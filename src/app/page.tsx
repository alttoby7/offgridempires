import type { Metadata } from "next";
import { Hero } from "@/components/hero";
import { KitCard } from "@/components/kit-card";
import { WebSiteJsonLd, BreadcrumbJsonLd } from "@/components/json-ld";
import { getKits } from "@/lib/get-kits";
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

// Use case chips for Browse by Use Case row
const useCaseChips = [
  { id: "rv", label: "RV & Van Life", href: "/kits" },
  { id: "cabin", label: "Cabin", href: "/kits" },
  { id: "homestead", label: "Homestead", href: "/kits" },
  { id: "emergency", label: "Emergency", href: "/kits" },
  { id: "shed", label: "Shed", href: "/kits" },
  { id: "boat", label: "Boat", href: "/kits" },
];

export default function HomePage() {
  const kits = getKits();

  // --- Trap Kit: worst completion gap (highest missingCost/listedPrice ratio) ---
  const trapKit = kits
    .filter((k) => k.missingCost > 0 && k.listedPrice > 0)
    .sort((a, b) => b.missingCost / b.listedPrice - a.missingCost / a.listedPrice)[0];

  // --- Smart Path picks (data-driven) ---
  const cheapest = [...kits].sort((a, b) => a.listedPrice - b.listedPrice)[0];

  const cheapestComplete = [...kits]
    .filter((k) => k.completeness >= 90)
    .sort((a, b) => a.trueCost - b.trueCost)[0];

  const mostStorage = [...kits].sort((a, b) => b.storageWh - a.storageWh)[0];

  const bestValue = [...kits]
    .filter((k) => k.costPerWh !== "N/A")
    .sort(
      (a, b) =>
        parseFloat(a.costPerWh.replace("$", "")) -
        parseFloat(b.costPerWh.replace("$", ""))
    )[0];

  const smartPaths = [
    cheapest && {
      label: "Cheapest Setup",
      command: "$ sort --price asc",
      kit: cheapest,
      stat: `$${cheapest.listedPrice.toLocaleString()}`,
      detail: cheapest.missingCost > 0
        ? `+$${cheapest.missingCost.toLocaleString()} missing`
        : "Nothing missing",
    },
    cheapestComplete && {
      label: "Cheapest Complete",
      command: "$ filter --complete | sort --cost asc",
      kit: cheapestComplete,
      stat: `$${cheapestComplete.trueCost.toLocaleString()}`,
      detail: `${cheapestComplete.completeness}% complete`,
    },
    mostStorage && {
      label: "Most Storage",
      command: "$ sort --storage desc",
      kit: mostStorage,
      stat: `${mostStorage.storageWh.toLocaleString()} Wh`,
      detail: `$${mostStorage.trueCost.toLocaleString()} total`,
    },
    bestValue && {
      label: "Best Value",
      command: "$ sort --cost-per-wh asc",
      kit: bestValue,
      stat: `${bestValue.costPerWh}/Wh`,
      detail: `${bestValue.storageWh.toLocaleString()} Wh storage`,
    },
  ].filter(Boolean) as {
    label: string;
    command: string;
    kit: (typeof kits)[0];
    stat: string;
    detail: string;
  }[];

  // --- Featured Kits: 4 intentionally curated, deduplicated ---
  const pathSlugs = new Set(smartPaths.map((p) => p.kit.slug));
  const bestComplete = [...kits]
    .filter((k) => k.completeness >= 80)
    .sort((a, b) => b.completeness - a.completeness || a.trueCost - b.trueCost)[0];
  const bigStorage = [...kits].sort((a, b) => b.storageWh - a.storageWh)[0];
  const budgetPick = [...kits].sort((a, b) => a.listedPrice - b.listedPrice)[0];

  const featuredCandidates = [trapKit, bestComplete, bigStorage, budgetPick].filter(Boolean);
  const featured: (typeof kits)[0][] = [];
  const usedSlugs = new Set<string>();

  for (const kit of featuredCandidates) {
    if (!usedSlugs.has(kit.slug) && featured.length < 4) {
      featured.push(kit);
      usedSlugs.add(kit.slug);
    }
  }
  // Fill remaining slots if deduplication removed some
  if (featured.length < 4) {
    for (const kit of kits) {
      if (!usedSlugs.has(kit.slug) && featured.length < 4) {
        featured.push(kit);
        usedSlugs.add(kit.slug);
      }
    }
  }

  return (
    <>
      <WebSiteJsonLd />
      <BreadcrumbJsonLd items={[{ name: "Home", url: "/" }]} />

      {/* Section 1: Hero — Live Reality Check */}
      {trapKit && <Hero trapKit={trapKit} />}

      {/* Section 2: Smart Paths */}
      <section className="border-b border-[var(--border)]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
          <h2 className="text-sm font-medium uppercase tracking-wide text-[var(--text-muted)] mb-4">
            Find Your Kit
          </h2>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {smartPaths.map((path) => (
              <Link
                key={path.label}
                href={`/kits/${path.kit.slug}`}
                className="group rounded border border-[var(--border)] bg-[var(--bg-surface)] p-4 hover:border-[var(--border-accent)] hover:bg-[var(--bg-elevated)] transition-all"
              >
                <p className="font-mono text-[10px] text-[var(--text-muted)] mb-2 truncate">
                  {path.command}
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
                <p className="text-xs text-[var(--text-muted)] mt-2 truncate">
                  {path.kit.brand} {path.kit.name.length > 30 ? path.kit.name.slice(0, 30) + "…" : path.kit.name}
                </p>
              </Link>
            ))}
          </div>

          {/* Use case chips */}
          <div className="mt-6 flex flex-wrap items-center gap-2">
            <span className="text-xs text-[var(--text-muted)] mr-1">Browse by use case:</span>
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

      {/* Section 3: Featured Kits */}
      <section className="border-b border-[var(--border)]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-[var(--text-primary)]">
                Featured Kits
              </h2>
              <p className="text-sm text-[var(--text-muted)] mt-1">
                Curated picks across price, completeness, and storage
              </p>
            </div>
            <Link
              href="/kits"
              className="hidden sm:inline-flex items-center gap-1.5 text-sm text-[var(--accent)] hover:text-[var(--accent-hover)] transition-colors"
            >
              All kits
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {featured.map((kit) => (
              <KitCard key={kit.slug} kit={kit} />
            ))}
          </div>
        </div>
      </section>

      {/* Section 4: Trust / Transparency */}
      <section className="bg-[var(--bg-secondary)]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
          <div className="max-w-2xl mx-auto text-center">
            <p className="text-xs font-mono uppercase tracking-widest text-[var(--text-muted)] mb-2">
              Built like PCPartPicker, not a listicle
            </p>
            <h2 className="text-xl font-bold text-[var(--text-primary)] mb-3">
              No hidden agendas. Just data.
            </h2>
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-8">
              We earn affiliate commissions when you buy through our links — same
              price for you. Every recommendation is data-driven. No sponsored
              rankings, no pay-to-play. Period.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { icon: "◈", label: "Normalized specs", detail: "Apples-to-apples" },
                { icon: "◉", label: "True total cost", detail: "Including what's missing" },
                { icon: "◆", label: "Live pricing", detail: "Updated every 6 hours" },
                { icon: "◇", label: "Price history", detail: "Know if it's a deal" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded border border-[var(--border)] bg-[var(--bg-surface)] p-4"
                >
                  <span className="text-xl text-[var(--accent)]">{item.icon}</span>
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
                Browse all 14 kits
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
