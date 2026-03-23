import Link from "next/link";
import type { Kit } from "@/lib/demo-data";
import { PriceTimestamp } from "@/components/ui/price-timestamp";

interface KitCardProps {
  kit: Kit;
  /** Compact mode for homepage featured cards */
  compact?: boolean;
}

export function KitCard({ kit, compact = false }: KitCardProps) {
  const hasMissing = kit.missingCost > 0;
  const includedCount = Object.values(kit.included).filter(Boolean).length;
  const totalRoles = Object.keys(kit.included).length;

  return (
    <Link
      href={`/kits/${kit.slug}`}
      className="group relative flex flex-col border border-[var(--border)] rounded bg-[var(--bg-surface)] hover:border-[var(--border-accent)] transition-all duration-200 overflow-hidden"
    >
      {/* Completeness indicator bar */}
      <div className="h-1 flex">
        <div className="bg-[var(--accent)]" style={{ width: `${kit.completeness}%` }} />
        <div className="bg-[var(--danger)]/30" style={{ width: `${100 - kit.completeness}%` }} />
      </div>

      <div className="p-5 flex-1 flex flex-col gap-4">
        {/* Header: brand + name */}
        <div className="pr-12">
          <p className="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">
            {kit.brand}
          </p>
          <h3 className="text-base font-semibold text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors line-clamp-2 mt-1">
            {kit.name}
          </h3>
        </div>

        {/* The ONE dominant metric: real build cost */}
        <div className="flex items-baseline gap-3">
          {hasMissing && (
            <span className="font-mono text-sm text-[var(--text-muted)] line-through decoration-1">
              ${kit.listedPrice.toLocaleString()}
            </span>
          )}
          <span className="font-mono text-xl font-bold text-[var(--accent)]">
            ${kit.trueCost.toLocaleString()}
          </span>
          <span className="text-xs text-[var(--text-muted)]">real build cost</span>
        </div>

        {/* Two supporting facts */}
        <div className="flex items-center gap-4 text-sm">
          <span className="font-mono text-[var(--text-secondary)]">
            {kit.panelWatts}W solar
          </span>
          <span className="font-mono text-[var(--text-secondary)]">
            {kit.storageWh > 0 ? `${(kit.storageWh / 1000).toFixed(1)}kWh` : "No storage"}
          </span>
          {kit.costPerW !== "N/A" && (
            <span className="font-mono text-[var(--accent)]">
              {kit.costPerW}/W
            </span>
          )}
          {kit.costPerWh !== "N/A" && (
            <span className="font-mono text-[var(--accent)]">
              {kit.costPerWh}/Wh
            </span>
          )}
        </div>

        {/* Completeness summary (not full badge grid) */}
        <div className="flex items-center gap-2">
          <span className={`font-mono text-sm font-semibold ${
            kit.completeness === 100 ? "text-[var(--success)]" : hasMissing ? "text-[var(--warning)]" : "text-[var(--text-secondary)]"
          }`}>
            {includedCount}/{totalRoles}
          </span>
          <span className="text-xs text-[var(--text-muted)]">
            {kit.completeness === 100
              ? "Complete — ready to use"
              : `${totalRoles - includedCount} missing component${totalRoles - includedCount > 1 ? "s" : ""}`}
          </span>
          {hasMissing && (
            <span className="font-mono text-xs text-[var(--danger)]">
              +${kit.missingCost.toLocaleString()} to finish
            </span>
          )}
        </div>

        {/* Quiet metadata row */}
        <div className="mt-auto pt-3 border-t border-[var(--border)] flex items-center justify-between">
          <PriceTimestamp observedAt={kit.priceObservedAt} />
          {kit.priceChange !== undefined && kit.priceChange !== 0 && (
            <span
              className={`font-mono text-xs font-semibold ${
                kit.priceChange < 0 ? "text-[var(--success)]" : "text-[var(--danger)]"
              }`}
            >
              {kit.priceChange < 0 ? "▼" : "▲"} ${Math.abs(kit.priceChange)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
