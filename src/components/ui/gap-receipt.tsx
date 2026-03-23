import type { Kit } from "@/lib/demo-data";

interface GapReceiptProps {
  kit: Kit;
}

const MAX_VISIBLE_ITEMS = 3;

export function GapReceipt({ kit }: GapReceiptProps) {
  const hasMissing = kit.missingCost > 0;
  const requiredMissing = kit.items.filter(
    (item) => !item.isIncluded && item.estimatedCost && item.estimatedCost > 0
  );
  const multiplier =
    kit.listedPrice > 0
      ? (kit.trueCost / kit.listedPrice).toFixed(1)
      : null;
  const priceDate = new Date(kit.priceObservedAt);

  if (!hasMissing) {
    return (
      <div className="rounded border border-[var(--success)]/30 bg-[var(--success)]/5 p-5">
        <div className="flex items-center gap-2 mb-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--success)]/20">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--success)]">
              <path d="M20 6L9 17l-5-5" />
            </svg>
          </span>
          <span className="font-mono text-sm font-bold text-[var(--success)]">
            Complete Kit — Advertised Price Is the Real Price
          </span>
        </div>
        <p className="text-xs text-[var(--text-secondary)] ml-8">
          All required components for a working system are included.
          No additional purchases needed.
        </p>
        <div className="mt-3 ml-8 flex items-center gap-3">
          <span className="font-mono text-[10px] text-[var(--text-muted)]">
            Verified {priceDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
          </span>
          <a href="#" className="inline-flex items-center gap-1 text-[10px] text-[var(--accent)] hover:text-[var(--accent-hover)]">
            Methodology
            <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" /></svg>
          </a>
        </div>
      </div>
    );
  }

  const visibleItems = requiredMissing.slice(0, MAX_VISIBLE_ITEMS);
  const hiddenCount = requiredMissing.length - MAX_VISIBLE_ITEMS;

  return (
    <div className="rounded border border-[var(--border)] bg-[var(--bg-surface)] overflow-hidden">
      {/* Header */}
      <div className="bg-[var(--danger)]/10 border-b border-[var(--danger)]/20 px-5 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--danger)]">
            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          <span className="font-mono text-xs font-bold text-[var(--danger)] uppercase tracking-wider">
            Completion Gap Receipt
          </span>
        </div>
        <button className="inline-flex items-center gap-1 rounded border border-[var(--border)] bg-[var(--bg-primary)] px-2 py-1 text-[10px] font-mono text-[var(--text-muted)] hover:text-[var(--accent)] hover:border-[var(--border-accent)] transition-colors">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13" />
          </svg>
          Share
        </button>
      </div>

      {/* Receipt body */}
      <div className="p-5 space-y-3 font-mono text-sm">
        {/* Advertised price */}
        <div className="flex items-center justify-between">
          <span className="text-[var(--text-secondary)]">Advertised price</span>
          <span className="text-[var(--text-primary)] font-semibold">
            ${kit.listedPrice.toLocaleString()}
          </span>
        </div>

        <div className="border-t border-dashed border-[var(--border)]" />

        {/* Required missing items */}
        <div className="space-y-2">
          <span className="text-[10px] uppercase tracking-wider text-[var(--danger)]">
            Required missing parts
          </span>
          {visibleItems.map((item, i) => (
            <div key={i} className="flex items-center justify-between pl-3">
              <span className="text-xs text-[var(--text-secondary)]">
                + {item.role}
              </span>
              <span className="text-xs text-[var(--danger)] font-medium">
                ~${item.estimatedCost?.toLocaleString()}
              </span>
            </div>
          ))}
          {hiddenCount > 0 && (
            <div className="pl-3">
              <span className="text-xs text-[var(--text-muted)]">
                + {hiddenCount} more required item{hiddenCount > 1 ? "s" : ""}
              </span>
            </div>
          )}
        </div>

        <div className="border-t border-dashed border-[var(--border)]" />

        {/* Hidden cost subtotal */}
        <div className="flex items-center justify-between">
          <span className="text-[var(--danger)] font-semibold">Hidden cost to finish</span>
          <span className="text-[var(--danger)] font-bold text-base">
            +${kit.missingCost.toLocaleString()}
          </span>
        </div>

        <div className="border-t-2 border-[var(--border)]" />

        {/* Real build cost — THE hero line */}
        <div className="flex items-center justify-between py-1">
          <span className="text-[var(--text-primary)] font-bold text-base">
            Real build cost
          </span>
          <span className="text-[var(--accent)] font-bold text-2xl">
            ${kit.trueCost.toLocaleString()}
          </span>
        </div>

        {/* Gap callout — using absolute dollar amount, not percentage */}
        <div className="rounded bg-[var(--danger)]/10 border border-[var(--danger)]/20 px-3 py-2 text-center">
          <span className="text-xs text-[var(--danger)] font-semibold">
            +${kit.missingCost.toLocaleString()} hidden cost
          </span>
          {multiplier && (
            <span className="text-xs text-[var(--danger)]">
              {" "}&middot; {multiplier}x the advertised price
            </span>
          )}
        </div>

        {/* Scope note */}
        <p className="text-[10px] text-[var(--text-muted)] leading-relaxed">
          Real build cost = advertised kit + required missing parts only.
          Optional accessories and tools are not included in this total.
        </p>
      </div>

      {/* Footer — defensible when screenshotted */}
      <div className="bg-[var(--bg-primary)] border-t border-[var(--border)] px-5 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-[var(--text-muted)]">
            offgridempire.com
          </span>
          <span className="text-[10px] text-[var(--text-muted)]">
            Price checked {priceDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
          </span>
        </div>
        <a
          href="#"
          className="inline-flex items-center gap-1 text-[10px] text-[var(--accent)] hover:text-[var(--accent-hover)]"
        >
          Methodology
          <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" />
          </svg>
        </a>
      </div>
    </div>
  );
}
