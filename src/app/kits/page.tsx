import type { Metadata } from "next";
import Link from "next/link";
import { getKits } from "@/lib/get-kits";
import { KitListJsonLd, BreadcrumbJsonLd } from "@/components/json-ld";
import { CompletenessBadges } from "@/components/ui/completeness-badges";
import { PriceTimestamp } from "@/components/ui/price-timestamp";
import { TrueCostBar } from "@/components/ui/true-cost-bar";

export const metadata: Metadata = {
  title: "Browse Solar Kits",
  description:
    "Compare off-grid solar kits with normalized specs, true total cost, and live pricing across brands.",
  alternates: { canonical: "/kits" },
  openGraph: {
    title: "Browse Solar Kits | OffGridEmpire",
    description:
      "Compare off-grid solar kits with normalized specs, true total cost, and live pricing across brands.",
    url: "/kits",
  },
};

function FilterPill({ label, active = false }: { label: string; active?: boolean }) {
  return (
    <button
      className={`inline-flex items-center gap-1.5 rounded border px-3 py-1.5 text-xs font-medium transition-colors ${
        active
          ? "border-[var(--accent)]/50 bg-[var(--accent)]/10 text-[var(--accent)]"
          : "border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:border-[var(--border-accent)]"
      }`}
    >
      {label}
      <svg
        width="10"
        height="10"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M6 9l6 6 6-6" />
      </svg>
    </button>
  );
}

import type { Kit } from "@/lib/demo-data";

function KitListCard({ kit }: { kit: Kit }) {
  const hasMissing = kit.missingCost > 0;

  return (
    <div className="group relative flex flex-col border border-[var(--border)] rounded bg-[var(--bg-surface)] hover:border-[var(--border-accent)] transition-all duration-200 overflow-hidden">
      {/* Compare checkbox */}
      <label className="absolute top-3 right-3 z-10 flex items-center gap-1.5 cursor-pointer">
        <input
          type="checkbox"
          className="sr-only peer"
        />
        <span className="flex h-4 w-4 items-center justify-center rounded-sm border border-[var(--border)] bg-[var(--bg-primary)] peer-checked:border-[var(--accent)] peer-checked:bg-[var(--accent)]/20 transition-colors">
          <svg
            width="10"
            height="10"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-[var(--accent)] opacity-0 peer-checked:opacity-100"
          >
            <path d="M20 6L9 17l-5-5" />
          </svg>
        </span>
        <span className="font-mono text-[9px] uppercase tracking-wider text-[var(--text-muted)]">
          Compare
        </span>
      </label>

      {/* Completeness indicator bar */}
      <div className="h-1 flex">
        <div
          className="bg-[var(--accent)]"
          style={{ width: `${kit.completeness}%` }}
        />
        <div
          className="bg-[var(--danger)]/30"
          style={{ width: `${100 - kit.completeness}%` }}
        />
      </div>

      <Link href={`/kits/${kit.slug}`} className="p-4 flex-1 flex flex-col gap-3">
        {/* Header */}
        <div className="pr-20">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--text-muted)]">
              {kit.brand}
            </span>
            <span className="font-mono text-[10px] text-[var(--text-muted)]">
              via {kit.retailer}
            </span>
          </div>
          <h3 className="text-sm font-semibold text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors line-clamp-2">
            {kit.name}
          </h3>
        </div>

        {/* Specs grid */}
        <div className="grid grid-cols-4 gap-1.5">
          <div className="rounded bg-[var(--bg-primary)] px-2 py-1.5 text-center">
            <p className="font-mono text-[9px] text-[var(--text-muted)] uppercase">Panels</p>
            <p className="font-mono text-xs font-semibold text-[var(--text-primary)]">{kit.panelWatts}W</p>
          </div>
          <div className="rounded bg-[var(--bg-primary)] px-2 py-1.5 text-center">
            <p className="font-mono text-[9px] text-[var(--text-muted)] uppercase">Storage</p>
            <p className="font-mono text-xs font-semibold text-[var(--text-primary)]">
              {kit.storageWh > 0 ? `${(kit.storageWh / 1000).toFixed(1)}kWh` : "—"}
            </p>
          </div>
          <div className="rounded bg-[var(--bg-primary)] px-2 py-1.5 text-center">
            <p className="font-mono text-[9px] text-[var(--text-muted)] uppercase">Inverter</p>
            <p className="font-mono text-xs font-semibold text-[var(--text-primary)]">
              {kit.inverterWatts > 0 ? `${kit.inverterWatts}W` : "—"}
            </p>
          </div>
          <div className="rounded bg-[var(--bg-primary)] px-2 py-1.5 text-center">
            <p className="font-mono text-[9px] text-[var(--text-muted)] uppercase">$/Wh</p>
            <p className="font-mono text-xs font-semibold text-[var(--accent)]">{kit.costPerWh}</p>
          </div>
        </div>

        {/* Completeness badges */}
        <CompletenessBadges included={kit.included} size="sm" />

        {/* Cost bar */}
        <TrueCostBar
          listedPrice={kit.listedPrice}
          missingCost={kit.missingCost}
          trueCost={kit.trueCost}
          compact
        />

        {/* Price row */}
        <div className="mt-auto pt-3 border-t border-[var(--border)] flex items-end justify-between">
          <div>
            <p className="font-mono text-[10px] text-[var(--text-muted)] uppercase">
              {hasMissing ? "Advertised" : "Price"}
            </p>
            <p className={`font-mono text-lg font-bold ${hasMissing ? "text-[var(--text-secondary)] line-through decoration-1" : "text-[var(--text-primary)]"}`}>
              ${kit.listedPrice.toLocaleString()}
            </p>
          </div>

          {hasMissing && (
            <div className="text-center">
              <p className="font-mono text-[10px] text-[var(--danger)]/70 uppercase">+ Missing</p>
              <p className="font-mono text-sm font-semibold text-[var(--danger)]/70">
                ~${kit.missingCost.toLocaleString()}
              </p>
            </div>
          )}

          <div className="text-right">
            <p className="font-mono text-[10px] text-[var(--text-muted)] uppercase">Real Build Cost</p>
            <p className="font-mono text-lg font-bold text-[var(--accent)]">
              ${kit.trueCost.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Timestamp + price change */}
        <div className="flex items-center justify-between">
          <PriceTimestamp observedAt={kit.priceObservedAt} />
          {kit.priceChange !== undefined && kit.priceChange !== 0 && (
            <span
              className={`font-mono text-[11px] font-semibold ${
                kit.priceChange < 0 ? "text-[var(--success)]" : "text-[var(--danger)]"
              }`}
            >
              {kit.priceChange < 0 ? "▼" : "▲"} ${Math.abs(kit.priceChange)}
            </span>
          )}
        </div>
      </Link>
    </div>
  );
}

export default function KitsPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <KitListJsonLd kits={getKits()} />
      <BreadcrumbJsonLd items={[{ name: "Home", url: "/" }, { name: "Kits", url: "/kits" }]} />
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-[var(--text-muted)] mb-6">
        <Link href="/" className="hover:text-[var(--accent)] transition-colors">
          Home
        </Link>
        <span>/</span>
        <span className="text-[var(--text-secondary)]">Kits</span>
      </nav>

      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Solar Kits</h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            {getKits().length} kits compared with true total cost
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] text-[var(--text-muted)] uppercase">Sort:</span>
          <select className="rounded border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-1.5 text-xs text-[var(--text-secondary)] focus:border-[var(--accent)] focus:outline-none">
            <option>Real Build Cost: Low → High</option>
            <option>Real Build Cost: High → Low</option>
            <option>Cost per Wh</option>
            <option>Panel Watts</option>
            <option>Storage Capacity</option>
            <option>Completeness</option>
          </select>
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap gap-2 mb-6 p-3 rounded border border-[var(--border)] bg-[var(--bg-surface)]">
        <FilterPill label="All Use Cases" active />
        <FilterPill label="$0 — $5,000" />
        <FilterPill label="Any Chemistry" />
        <FilterPill label="Any Brand" />
        <FilterPill label="Any Voltage" />
        <div className="flex-1" />
        <label className="inline-flex items-center gap-1.5 text-xs text-[var(--text-muted)] cursor-pointer">
          <input type="checkbox" className="sr-only peer" />
          <span className="flex h-3.5 w-3.5 items-center justify-center rounded-sm border border-[var(--border)] bg-[var(--bg-primary)] peer-checked:border-[var(--accent)] peer-checked:bg-[var(--accent)]/20 transition-colors" />
          <span className="font-mono text-[10px] uppercase tracking-wider">Complete kits only</span>
        </label>
      </div>

      {/* Results count + compare bar */}
      <div className="flex items-center justify-between mb-4">
        <p className="font-mono text-[10px] text-[var(--text-muted)] uppercase tracking-wider">
          Showing {getKits().length} kits
        </p>
        <Link
          href="/compare"
          className="inline-flex items-center gap-1.5 rounded border border-[var(--accent)]/30 bg-[var(--accent)]/5 px-3 py-1.5 text-xs font-medium text-[var(--accent)] hover:bg-[var(--accent)]/10 transition-colors"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
          </svg>
          Compare Selected (0)
        </Link>
      </div>

      {/* Kit grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {getKits().map((kit) => (
          <KitListCard key={kit.id} kit={kit} />
        ))}
      </div>

      {/* Methodology link */}
      <div className="mt-12 text-center space-y-2">
        <p className="text-xs text-[var(--text-muted)]">
          True total cost includes estimated prices for missing components based on average market prices.
        </p>
        <Link
          href="/methodology"
          className="inline-flex items-center gap-1 text-xs text-[var(--accent)] hover:text-[var(--accent-hover)] transition-colors"
        >
          How we calculate true total cost
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" />
          </svg>
        </Link>
      </div>
    </div>
  );
}
