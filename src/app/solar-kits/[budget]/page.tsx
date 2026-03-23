import type { Metadata } from "next";
import Link from "next/link";
import { getKits } from "@/lib/get-kits";
import { KitCard } from "@/components/kit-card";
import { BreadcrumbJsonLd } from "@/components/json-ld";

const BUDGETS: Record<
  string,
  { maxCost: number; title: string; description: string; intro: string }
> = {
  "under-500": {
    maxCost: 500,
    title: "Best Solar Kits Under $500",
    description:
      "Compare off-grid solar kits under $500 real build cost. See what's actually included and the true price after buying missing components.",
    intro:
      "Under $500 gets you a basic starter kit — enough for a shed, small camping setup, or emergency phone charging. At this price, most kits are missing batteries and inverters. Check the completeness score to see what you still need to buy.",
  },
  "under-1000": {
    maxCost: 1000,
    title: "Best Solar Kits Under $1,000",
    description:
      "Compare off-grid solar kits under $1,000 true cost. Complete breakdowns showing what's included vs. what's missing.",
    intro:
      "The $500–$1,000 range opens up decent RV and van life options. You can find kits with panels, charge controllers, and sometimes batteries included. Focus on completeness — a $700 kit that needs $300 in extras isn't really under $1,000.",
  },
  "under-2000": {
    maxCost: 2000,
    title: "Best Solar Kits Under $2,000",
    description:
      "Compare off-grid solar kits under $2,000. Mid-range systems for cabins, RVs, and serious off-grid setups with real cost analysis.",
    intro:
      "Under $2,000 is the sweet spot for most off-grid setups. You can get complete systems with LiFePO4 batteries, MPPT controllers, and pure sine wave inverters. Power stations in this range offer all-in-one convenience with 1,000–2,000 Wh of storage.",
  },
  "under-3000": {
    maxCost: 3000,
    title: "Best Solar Kits Under $3,000",
    description:
      "Compare premium off-grid solar kits under $3,000. High-capacity systems for cabins, emergency backup, and serious off-grid living.",
    intro:
      "The $2,000–$3,000 range gets you serious capacity: 800W panels, 2,000+ Wh batteries, and 3,000W inverters. These are cabin-grade and emergency-ready systems. At this budget, completeness should be 80%+ — you shouldn't be buying many extras.",
  },
  "under-4000": {
    maxCost: 4000,
    title: "Best Solar Kits Under $4,000",
    description:
      "Compare the most powerful off-grid solar kits under $4,000. Maximum storage, highest completeness, and real cost transparency.",
    intro:
      "Under $4,000 covers everything in our database. These are the highest-capacity consumer kits available — large power stations, multi-panel arrays, and expandable battery systems. Compare them all by real build cost.",
  },
};

export function generateStaticParams() {
  return Object.keys(BUDGETS).map((budget) => ({ budget }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ budget: string }>;
}): Promise<Metadata> {
  const { budget } = await params;
  const b = BUDGETS[budget];
  if (!b) return { title: "Budget Not Found" };

  return {
    title: b.title,
    description: b.description,
    alternates: { canonical: `/solar-kits/${budget}` },
    openGraph: { title: `${b.title} | OffGridEmpire`, description: b.description, url: `/solar-kits/${budget}` },
  };
}

export default async function BudgetPage({
  params,
}: {
  params: Promise<{ budget: string }>;
}) {
  const { budget } = await params;
  const b = BUDGETS[budget];
  if (!b) return <div className="p-8 text-center text-[var(--text-muted)]">Budget range not found.</div>;

  const allKits = getKits();
  const kits = [...allKits]
    .filter((k) => k.trueCost <= b.maxCost)
    .sort((a, b) => b.completeness - a.completeness || a.trueCost - b.trueCost);

  const complete = kits.filter((k) => k.completeness >= 80);
  const partial = kits.filter((k) => k.completeness < 80);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <BreadcrumbJsonLd
        items={[
          { name: "Home", url: "/" },
          { name: "Solar Kits", url: "/kits" },
          { name: b.title, url: `/solar-kits/${budget}` },
        ]}
      />

      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-[var(--text-muted)] mb-6">
        <Link href="/" className="hover:text-[var(--accent)] transition-colors">Home</Link>
        <span>/</span>
        <Link href="/kits" className="hover:text-[var(--accent)] transition-colors">Kits</Link>
        <span>/</span>
        <span className="text-[var(--text-secondary)]">{b.title}</span>
      </nav>

      {/* Header */}
      <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)] mb-3">
        {b.title}
      </h1>
      <p className="text-sm text-[var(--text-secondary)] leading-relaxed max-w-3xl mb-6">
        {b.intro}
      </p>

      {/* Stats */}
      <div className="flex flex-wrap gap-3 mb-8">
        <div className="rounded border border-[var(--border)] bg-[var(--bg-surface)] px-4 py-2.5">
          <p className="font-mono text-lg font-bold text-[var(--accent)]">{kits.length}</p>
          <p className="text-xs text-[var(--text-muted)]">Kits in Budget</p>
        </div>
        <div className="rounded border border-[var(--border)] bg-[var(--bg-surface)] px-4 py-2.5">
          <p className="font-mono text-lg font-bold text-[var(--success)]">{complete.length}</p>
          <p className="text-xs text-[var(--text-muted)]">80%+ Complete</p>
        </div>
        {kits.length > 0 && (
          <div className="rounded border border-[var(--border)] bg-[var(--bg-surface)] px-4 py-2.5">
            <p className="font-mono text-lg font-bold text-[var(--accent)]">
              ${Math.min(...kits.map((k) => k.trueCost)).toLocaleString()}
            </p>
            <p className="text-xs text-[var(--text-muted)]">Cheapest Real Cost</p>
          </div>
        )}
      </div>

      {/* Kits */}
      {kits.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 rounded border border-dashed border-[var(--border)] bg-[var(--bg-surface)]">
          <p className="text-sm text-[var(--text-muted)] mb-2">
            No kits have a real build cost under ${b.maxCost.toLocaleString()}
          </p>
          <Link href="/kits" className="text-xs text-[var(--accent)] hover:text-[var(--accent-hover)]">
            Browse all kits &rarr;
          </Link>
        </div>
      ) : (
        <>
          {complete.length > 0 && (
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-3">
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-[var(--success)]" />
                <h2 className="text-lg font-bold text-[var(--text-primary)]">
                  Most Complete ({complete.length})
                </h2>
              </div>
              <p className="text-sm text-[var(--text-muted)] mb-4">
                80%+ of components included — minimal extra purchases needed.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {complete.map((kit) => (
                  <KitCard key={kit.slug} kit={kit} />
                ))}
              </div>
            </div>
          )}

          {partial.length > 0 && (
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-3">
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-[var(--text-muted)]" />
                <h2 className="text-lg font-bold text-[var(--text-primary)]">
                  Needs Extras ({partial.length})
                </h2>
              </div>
              <p className="text-sm text-[var(--text-muted)] mb-4">
                Budget-friendly sticker price, but factor in missing components.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {partial.map((kit) => (
                  <KitCard key={kit.slug} kit={kit} />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Cross-links */}
      <div className="mt-12 pt-6 border-t border-[var(--border)]">
        <p className="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)] mb-3">
          Other Budget Ranges
        </p>
        <div className="flex flex-wrap gap-2">
          {Object.entries(BUDGETS)
            .filter(([key]) => key !== budget)
            .map(([key, val]) => (
              <Link
                key={key}
                href={`/solar-kits/${key}`}
                className="rounded border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-1.5 text-xs text-[var(--text-secondary)] hover:border-[var(--border-accent)] hover:text-[var(--accent)] transition-colors"
              >
                {val.title.replace("Best Solar Kits ", "")}
              </Link>
            ))}
        </div>
      </div>
    </div>
  );
}
