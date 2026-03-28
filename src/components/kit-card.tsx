import Link from "next/link";
import type { Kit } from "@/lib/demo-data";
import type { FitBucket } from "@/lib/calculator/types";

interface KitCardProps {
  kit: Kit;
  /** Compact mode for homepage featured cards */
  compact?: boolean;
  /** Match score from calculator (0-300 scale, avg of 3 coverage %) */
  matchScore?: number;
  /** Fit bucket from calculator */
  matchBucket?: FitBucket;
}

const BUCKET_COLORS: Record<FitBucket, string> = {
  meets: "var(--success)",
  near: "var(--accent)",
  lighter: "var(--warning)",
  "solar-only": "var(--text-muted)",
  undersized: "var(--danger)",
};

export function KitCard({ kit, compact = false, matchScore, matchBucket }: KitCardProps) {
  const hasMissing = kit.missingCost > 0;
  const includedCount = Object.values(kit.included).filter(Boolean).length;
  const totalRoles = Object.keys(kit.included).length;

  return (
    <Link
      href={`/kits/${kit.slug}`}
      className="group relative flex flex-col border border-[var(--border)] rounded bg-[var(--bg-surface)] hover:border-[var(--border-accent)] hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/20 transition-all duration-200 overflow-hidden"
    >
      {/* Completeness indicator bar */}
      <div className="h-1 flex">
        <div className="bg-[var(--accent)]" style={{ width: `${kit.completeness}%` }} />
        <div className="bg-[var(--danger)]/30" style={{ width: `${100 - kit.completeness}%` }} />
      </div>

      <div className="p-4 flex-1 flex flex-col gap-3">
        {/* Match badge */}
        {matchScore !== undefined && matchBucket && (
          <span
            className="self-start font-mono text-[10px] font-semibold px-1.5 py-0.5 rounded"
            style={{
              color: BUCKET_COLORS[matchBucket],
              backgroundColor: `color-mix(in srgb, ${BUCKET_COLORS[matchBucket]} 12%, transparent)`,
            }}
          >
            {Math.round(matchScore)}% match
          </span>
        )}

        {/* Tier 1: Brand + Name + Price (instant scan) */}
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wider text-[var(--text-muted)]">
            {kit.brand}
          </p>
          <h3 className="text-sm font-semibold text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors line-clamp-2 mt-0.5 leading-snug">
            {(kit.displayName ?? kit.name)}
          </h3>
        </div>

        <div className="flex items-baseline gap-2">
          {hasMissing && (
            <span className="font-mono text-xs text-[var(--text-muted)] line-through decoration-1">
              ${kit.listedPrice.toLocaleString()}
            </span>
          )}
          <span className="font-mono text-lg font-bold text-[var(--accent)] group-hover:text-[var(--accent-hover)] transition-colors">
            ${kit.trueCost.toLocaleString()}
          </span>
          {kit.priceChange !== undefined && kit.priceChange !== 0 && (
            <span
              className={`font-mono text-[10px] font-semibold ${
                kit.priceChange < 0 ? "text-[var(--success)]" : "text-[var(--danger)]"
              }`}
            >
              {kit.priceChange < 0 ? "▼" : "▲"}${Math.abs(kit.priceChange)}
            </span>
          )}
        </div>

        {/* Tier 2: Key specs (deliberate read) */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-mono text-[var(--text-secondary)]">
          <span>{kit.panelWatts}W</span>
          <span className="text-[var(--border)]">/</span>
          <span>{kit.storageWh > 0 ? `${(kit.storageWh / 1000).toFixed(1)}kWh` : "—"}</span>
          {kit.costPerW !== "N/A" && (
            <>
              <span className="text-[var(--border)]">/</span>
              <span className="text-[var(--accent)]/80">{kit.costPerW}/W</span>
            </>
          )}
        </div>

        {/* Tier 3: Completeness + metadata */}
        <div className="mt-auto pt-2 border-t border-[var(--border)] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={`font-mono text-xs font-semibold ${
              kit.completeness === 100 ? "text-[var(--success)]" : hasMissing ? "text-[var(--warning)]" : "text-[var(--text-secondary)]"
            }`}>
              {kit.completeness === 100 ? "Complete" : `${includedCount}/${totalRoles}`}
            </span>
            {hasMissing && (
              <span className="font-mono text-[10px] text-[var(--danger)]/70">
                +${kit.missingCost.toLocaleString()}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            {kit.offers && kit.offers.length > 1 && (() => {
              const retailerCount = new Set(kit.offers.map(o => o.retailer)).size;
              return retailerCount > 1 ? (
                <span className="font-mono text-[10px] px-1.5 py-0.5 rounded border border-[var(--accent)]/30 text-[var(--accent)]">
                  {retailerCount} retailers
                </span>
              ) : null;
            })()}
          </div>
        </div>
      </div>
    </Link>
  );
}
