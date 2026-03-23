import type { Metadata } from "next";
import Link from "next/link";
import { demoKits } from "@/lib/demo-data";
import { CompletenessBadges } from "@/components/ui/completeness-badges";
import { PriceTimestamp } from "@/components/ui/price-timestamp";
import { TrueCostBar } from "@/components/ui/true-cost-bar";
import { SpecBlock } from "@/components/ui/spec-block";
import { GapReceipt } from "@/components/ui/gap-receipt";

export function generateStaticParams() {
  return demoKits.map((kit) => ({ slug: kit.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const kit = demoKits.find((k) => k.slug === slug);
  return {
    title: kit ? `${kit.name} — Real Build Cost Breakdown` : "Kit Not Found",
    description: kit
      ? `Full component breakdown and true total cost for the ${kit.name}. See what's included, what's missing, and the real price.`
      : undefined,
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

export default async function KitDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const kit = demoKits.find((k) => k.slug === slug);

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

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-[var(--text-muted)] mb-6">
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
              <span className="font-mono text-xs uppercase tracking-wider text-[var(--text-muted)]">
                {kit.brand}
              </span>
              <span className="font-mono text-[10px] text-[var(--text-muted)] border border-[var(--border)] rounded-sm px-1.5 py-0.5">
                via {kit.retailer}
              </span>
              <PriceTimestamp observedAt={kit.priceObservedAt} />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)] leading-tight">
              {kit.name}
            </h1>
          </div>

          {/* Specs row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <SpecBlock label="Solar" value={`${kit.panelWatts}W`} />
            <SpecBlock label="Storage" value={kit.storageWh > 0 ? `${(kit.storageWh / 1000).toFixed(1)}kWh` : "None"} />
            <SpecBlock label="Inverter" value={kit.inverterWatts > 0 ? `${kit.inverterWatts}W` : "None"} />
            <SpecBlock label="Cost/Wh" value={kit.costPerWh} highlight />
          </div>

          {/* Completeness */}
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="font-mono text-xs uppercase tracking-wider text-[var(--text-muted)]">
                Kit Completeness
              </span>
              <span className={`font-mono text-xs font-semibold ${
                kit.completeness === 100 ? "text-[var(--success)]" : "text-[var(--warning)]"
              }`}>
                {kit.completeness}%
              </span>
            </div>
            <CompletenessBadges included={kit.included} size="md" />
          </div>

          {/* Use case ratings */}
          <div>
            <span className="font-mono text-xs uppercase tracking-wider text-[var(--text-muted)] block mb-2">
              Use Case Suitability
            </span>
            <div className="flex flex-wrap gap-2">
              {Object.entries(kit.useCaseRatings).map(([uc, rating]) => (
                <span
                  key={uc}
                  className={`inline-flex items-center gap-1.5 rounded border px-2.5 py-1 text-xs font-medium ${ratingColors[rating]}`}
                >
                  {useCaseLabels[uc] ?? uc}
                  <span className="font-mono text-[10px] opacity-70">{rating}</span>
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
                  <p className="font-mono text-[10px] text-[var(--text-muted)] uppercase">Advertised Price</p>
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

            {/* CTA */}
            <a
              href="#"
              className="flex items-center justify-center gap-2 w-full rounded bg-[var(--accent)] py-3 text-sm font-bold text-[var(--bg-primary)] hover:bg-[var(--accent-hover)] transition-colors"
            >
              View on {kit.retailer}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" />
              </svg>
            </a>

            <p className="text-[10px] text-[var(--text-muted)] text-center">
              Affiliate link — same price for you, supports this tool
            </p>

            {/* Price alert */}
            <div className="border-t border-[var(--border)] pt-4">
              <p className="font-mono text-[10px] text-[var(--text-muted)] uppercase mb-2">
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
      <section className="mb-10">
        <div className="flex items-center gap-3 mb-4">
          <h2 className="text-lg font-bold text-[var(--text-primary)]">
            Component Breakdown
          </h2>
          <span className="font-mono text-[10px] text-[var(--text-muted)] border border-[var(--border)] rounded-sm px-1.5 py-0.5">
            {includedItems.length} included / {missingItems.length} missing
          </span>
        </div>

        {/* Desktop table */}
        <div className="hidden lg:block rounded border border-[var(--border)] bg-[var(--bg-surface)] overflow-hidden">
          {/* Table header */}
          <div className="grid grid-cols-12 gap-2 px-4 py-2.5 bg-[var(--bg-secondary)] border-b border-[var(--border)] font-mono text-[10px] uppercase tracking-wider text-[var(--text-muted)]">
            <div className="col-span-1">Status</div>
            <div className="col-span-2">Role</div>
            <div className="col-span-3">Component</div>
            <div className="col-span-3">Specs</div>
            <div className="col-span-1 text-center">Qty</div>
            <div className="col-span-2 text-right">Est. Cost</div>
          </div>

          {kit.items.map((item, i) => (
            <div
              key={i}
              className={`grid grid-cols-12 gap-2 px-4 py-3 items-center border-b border-[var(--border)] last:border-b-0 ${
                !item.isIncluded ? "bg-[var(--danger)]/[0.03]" : ""
              }`}
            >
              <div className="col-span-1">
                {item.isIncluded ? (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--success)]/15">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--success)]"><path d="M20 6L9 17l-5-5" /></svg>
                  </span>
                ) : (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--danger)]/15">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--danger)]"><path d="M18 6L6 18M6 6l12 12" /></svg>
                  </span>
                )}
              </div>
              <div className="col-span-2"><span className="font-mono text-xs font-medium text-[var(--text-secondary)]">{item.role}</span></div>
              <div className="col-span-3"><span className={`text-sm ${item.isIncluded ? "text-[var(--text-primary)]" : "text-[var(--danger)]/70 italic"}`}>{item.name}</span></div>
              <div className="col-span-3">
                <span className="text-xs text-[var(--text-muted)]">{item.specs}</span>
                {item.notes && <span className="block text-[10px] text-[var(--warning)] mt-0.5">&#9888; {item.notes}</span>}
              </div>
              <div className="col-span-1 text-center"><span className="font-mono text-xs text-[var(--text-secondary)]">{item.quantity > 0 ? `${item.quantity}×` : "—"}</span></div>
              <div className="col-span-2 text-right">
                {item.isIncluded ? (
                  <span className="font-mono text-xs text-[var(--success)]/70">Included</span>
                ) : item.estimatedCost && item.estimatedCost > 0 ? (
                  <span className="font-mono text-xs font-semibold text-[var(--danger)]">~${item.estimatedCost.toLocaleString()}</span>
                ) : (
                  <span className="font-mono text-xs text-[var(--text-muted)]">—</span>
                )}
              </div>
            </div>
          ))}

          {kit.missingCost > 0 && (
            <div className="grid grid-cols-12 gap-2 px-4 py-3 bg-[var(--bg-secondary)] border-t-2 border-[var(--danger)]/20">
              <div className="col-span-10"><span className="font-mono text-xs font-bold text-[var(--danger)]">Total estimated cost to complete this kit</span></div>
              <div className="col-span-2 text-right"><span className="font-mono text-sm font-bold text-[var(--danger)]">~${kit.missingCost.toLocaleString()}</span></div>
            </div>
          )}
        </div>

        {/* Mobile card layout */}
        <div className="lg:hidden space-y-2">
          {kit.items.map((item, i) => (
            <div
              key={i}
              className={`rounded border p-3 ${
                item.isIncluded
                  ? "border-[var(--border)] bg-[var(--bg-surface)]"
                  : "border-[var(--danger)]/20 bg-[var(--danger)]/[0.03]"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  {item.isIncluded ? (
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--success)]/15">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--success)]"><path d="M20 6L9 17l-5-5" /></svg>
                    </span>
                  ) : (
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--danger)]/15">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--danger)]"><path d="M18 6L6 18M6 6l12 12" /></svg>
                    </span>
                  )}
                  <div>
                    <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--text-muted)]">{item.role}</span>
                    <p className={`text-sm font-medium ${item.isIncluded ? "text-[var(--text-primary)]" : "text-[var(--danger)]/70 italic"}`}>
                      {item.name}
                    </p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  {item.isIncluded ? (
                    <span className="font-mono text-xs text-[var(--success)]/70">Included</span>
                  ) : item.estimatedCost && item.estimatedCost > 0 ? (
                    <span className="font-mono text-xs font-semibold text-[var(--danger)]">~${item.estimatedCost.toLocaleString()}</span>
                  ) : (
                    <span className="font-mono text-xs text-[var(--text-muted)]">—</span>
                  )}
                  {item.quantity > 0 && (
                    <p className="font-mono text-[10px] text-[var(--text-muted)]">{item.quantity}×</p>
                  )}
                </div>
              </div>
              <p className="text-xs text-[var(--text-muted)] mt-1 ml-7">{item.specs}</p>
              {item.notes && <p className="text-[10px] text-[var(--warning)] mt-1 ml-7">&#9888; {item.notes}</p>}
            </div>
          ))}

          {kit.missingCost > 0 && (
            <div className="rounded bg-[var(--bg-secondary)] border border-[var(--danger)]/20 p-3 flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-[var(--danger)]">Total to complete</span>
              <span className="font-mono text-sm font-bold text-[var(--danger)]">~${kit.missingCost.toLocaleString()}</span>
            </div>
          )}
        </div>
      </section>

      {/* Price History placeholder */}
      <section className="mb-10">
        <h2 className="text-lg font-bold text-[var(--text-primary)] mb-4">
          Price History
        </h2>
        <div className="rounded border border-[var(--border)] bg-[var(--bg-surface)] p-6">
          {/* Chart placeholder */}
          <div className="relative h-48 flex items-end gap-1">
            {Array.from({ length: 30 }).map((_, i) => {
              const height = 30 + Math.sin(i * 0.5) * 20 + Math.random() * 30;
              return (
                <div
                  key={i}
                  className="flex-1 bg-[var(--accent)]/20 hover:bg-[var(--accent)]/40 rounded-t-sm transition-colors"
                  style={{ height: `${height}%` }}
                />
              );
            })}
            {/* Current price line */}
            <div className="absolute inset-x-0 bottom-[60%] border-t border-dashed border-[var(--accent)]/30" />
          </div>
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-[var(--border)]">
            <div className="flex gap-4 font-mono text-[10px] text-[var(--text-muted)]">
              <span>All-time low: <span className="text-[var(--success)]">${(kit.listedPrice - 150).toLocaleString()}</span></span>
              <span>Average: <span className="text-[var(--text-secondary)]">${(kit.listedPrice + 50).toLocaleString()}</span></span>
              <span>Current: <span className="text-[var(--accent)]">${kit.listedPrice.toLocaleString()}</span></span>
            </div>
            <div className="flex gap-2">
              {["30d", "90d", "6mo", "1yr"].map((range) => (
                <button
                  key={range}
                  className="rounded border border-[var(--border)] bg-[var(--bg-primary)] px-2 py-0.5 font-mono text-[10px] text-[var(--text-muted)] hover:border-[var(--border-accent)] hover:text-[var(--accent)] transition-colors"
                >
                  {range}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Similar kits */}
      <section>
        <h2 className="text-lg font-bold text-[var(--text-primary)] mb-4">
          Compare With Similar Kits
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {demoKits
            .filter((k) => k.slug !== kit.slug)
            .slice(0, 3)
            .map((k) => (
              <Link
                key={k.slug}
                href={`/kits/${k.slug}`}
                className="group rounded border border-[var(--border)] bg-[var(--bg-surface)] p-4 hover:border-[var(--border-accent)] transition-colors"
              >
                <p className="font-mono text-[10px] text-[var(--text-muted)]">{k.brand}</p>
                <p className="text-sm font-semibold text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors line-clamp-1 mt-0.5">
                  {k.name}
                </p>
                <div className="flex items-center gap-3 mt-2">
                  <span className="font-mono text-xs text-[var(--accent)]">${k.trueCost.toLocaleString()}</span>
                  <span className="font-mono text-[10px] text-[var(--text-muted)]">{k.panelWatts}W / {k.storageWh > 0 ? `${(k.storageWh / 1000).toFixed(1)}kWh` : "No storage"}</span>
                </div>
              </Link>
            ))}
        </div>
      </section>
    </div>
  );
}
