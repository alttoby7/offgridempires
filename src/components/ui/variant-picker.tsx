import Link from "next/link";
import type { Kit } from "@/lib/demo-data";

interface VariantPickerProps {
  currentKit: Kit;
  variants: Kit[];
}

export function VariantPicker({ currentKit, variants }: VariantPickerProps) {
  if (variants.length === 0) return null;

  const allConfigs = [currentKit, ...variants].sort(
    (a, b) => a.listedPrice - b.listedPrice
  );

  return (
    <section>
      <div className="flex items-center gap-3 mb-3">
        <span className="font-mono text-[10px] font-semibold uppercase tracking-widest text-[var(--accent)]">
          Other Configurations
        </span>
        <div className="flex-1 h-px bg-[var(--border)]" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {allConfigs.map((kit) => {
          const isCurrent = kit.slug === currentKit.slug;
          const hasPanels = kit.included?.panels === true;
          const delta = kit.listedPrice - currentKit.listedPrice;

          const card = (
            <div
              className={`rounded border p-3 transition-colors ${
                isCurrent
                  ? "border-[var(--accent)]/40 bg-[var(--accent)]/5"
                  : "border-[var(--border)] bg-[var(--bg-surface)] hover:border-[var(--accent)]/30"
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <span
                  className={`text-xs font-medium leading-tight line-clamp-2 ${
                    isCurrent
                      ? "text-[var(--accent)]"
                      : "text-[var(--text-primary)]"
                  }`}
                >
                  {kit.displayName ?? kit.name}
                </span>
                {isCurrent && (
                  <span className="shrink-0 text-[10px] font-mono uppercase tracking-wider text-[var(--accent)] bg-[var(--accent)]/10 border border-[var(--accent)]/20 rounded-sm px-1.5 py-0.5">
                    Viewing
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 mb-2">
                <span className="font-mono text-sm font-semibold text-[var(--text-primary)]">
                  ${kit.listedPrice.toLocaleString()}
                </span>
                {delta !== 0 && !isCurrent && (
                  <span
                    className={`font-mono text-[10px] ${
                      delta > 0
                        ? "text-[var(--text-muted)]"
                        : "text-[var(--success)]"
                    }`}
                  >
                    {delta > 0 ? "+" : ""}${delta.toLocaleString()}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1 rounded-sm px-1.5 py-0.5 text-[10px] font-medium ${
                    hasPanels
                      ? "bg-[var(--success)]/10 text-[var(--success)] border border-[var(--success)]/20"
                      : "bg-[var(--danger)]/8 text-[var(--danger)]/70 border border-[var(--danger)]/15"
                  }`}
                >
                  {hasPanels ? (
                    <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
                  ) : (
                    <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
                  )}
                  {hasPanels ? "Panels" : "No Panels"}
                </span>
                {kit.panelWatts > 0 && (
                  <span className="font-mono text-[10px] text-[var(--text-muted)]">
                    {kit.panelWatts}W
                  </span>
                )}
                <span className="font-mono text-[10px] text-[var(--text-muted)]">
                  {kit.completeness}%
                </span>
              </div>
            </div>
          );

          if (isCurrent) {
            return <div key={kit.slug}>{card}</div>;
          }

          return (
            <Link key={kit.slug} href={`/kits/${kit.slug}`} className="block">
              {card}
            </Link>
          );
        })}
      </div>
    </section>
  );
}
