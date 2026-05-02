import Link from "next/link";
import type { Kit } from "@/lib/demo-data";

/*
 * Receipt — the canonical Real Build Cost artifact.
 * The brand's recognizable mark. Three variants:
 *   - hero      : full ink (DATA surface), large numerals, homepage focal point
 *   - report    : paper surface, used inside long-form content / kit pages
 *   - inline    : compact stat strip
 */

type ReceiptVariant = "hero" | "report" | "inline";

interface ReceiptProps {
  kit: Kit;
  variant?: ReceiptVariant;
  href?: string;          // when set, the entire card becomes a link
  caption?: string;       // small editorial caption above the kit name
  className?: string;
}

function fmt(n: number): string {
  return `$${Math.round(n).toLocaleString()}`;
}

function multiplierStr(kit: Kit): string | null {
  if (kit.listedPrice <= 0 || kit.trueCost <= kit.listedPrice) return null;
  const m = kit.trueCost / kit.listedPrice;
  if (m < 1.05) return null;
  return `${m.toFixed(m >= 2 ? 1 : 1)}×`;
}

function topMissing(kit: Kit, max = 3): { role: string; estimatedCost?: number }[] {
  return kit.items
    .filter((i) => !i.isIncluded && (i.estimatedCost ?? 0) > 0)
    .sort((a, b) => (b.estimatedCost ?? 0) - (a.estimatedCost ?? 0))
    .slice(0, max)
    .map(({ role, estimatedCost }) => ({ role, estimatedCost }));
}

export function Receipt({ kit, variant = "report", href, caption, className }: ReceiptProps) {
  const missing = topMissing(kit, variant === "hero" ? 3 : 2);
  const hiddenCount = kit.items.filter((i) => !i.isIncluded && (i.estimatedCost ?? 0) > 0).length - missing.length;
  const m = multiplierStr(kit);

  const Wrapper = ({ children }: { children: React.ReactNode }) =>
    href ? (
      <Link href={href} className={`group block ${className ?? ""}`}>
        {children}
      </Link>
    ) : (
      <div className={className}>{children}</div>
    );

  // ── HERO variant — DATA surface, large, homepage focal artifact ─────────────
  if (variant === "hero") {
    return (
      <Wrapper>
        <div className="surface-data relative overflow-hidden rounded-sm shadow-[0_20px_60px_-20px_rgba(20,17,13,0.45)] ring-1 ring-[#2a241b]">
          {/* Top tape */}
          <div className="flex items-center justify-between border-b border-[#3a3225] px-6 py-3">
            <div className="flex items-center gap-2.5">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--signal-red)]" />
              <span className="eyebrow !text-[var(--paper-on-data-soft)]">
                Completion Gap Receipt
              </span>
            </div>
            <span className="font-mono text-[10px] uppercase tracking-widest text-[#857c6d]">
              File №&nbsp;{kit.slug.slice(0, 8).toUpperCase()}
            </span>
          </div>

          <div className="px-6 sm:px-8 py-7">
            {/* Editorial caption */}
            {caption && (
              <p className="font-display text-[13px] italic text-[#cfb98b] mb-3">
                {caption}
              </p>
            )}

            {/* Kit identity */}
            <div className="mb-6">
              <p className="font-mono text-[10px] uppercase tracking-widest text-[#857c6d]">
                {kit.brand}
              </p>
              <h2 className="font-display text-2xl sm:text-3xl text-[var(--paper-on-data)] leading-tight mt-1">
                {kit.displayName ?? kit.name}
              </h2>
            </div>

            {/* Advertised */}
            <div className="flex items-baseline justify-between border-b border-dashed border-[#3a3225] pb-3">
              <span className="font-mono text-xs uppercase tracking-wider text-[#857c6d]">
                Advertised
              </span>
              <span className="tabular text-lg text-[var(--paper-on-data-soft)] line-through decoration-[#857c6d]/60">
                {fmt(kit.listedPrice)}
              </span>
            </div>

            {/* Hidden parts */}
            <div className="py-4 space-y-1.5">
              <p className="font-mono text-[10px] uppercase tracking-widest text-[var(--signal-red)] mb-2">
                Hidden Required Parts
              </p>
              {missing.map((item, i) => (
                <div key={i} className="flex items-baseline justify-between text-sm pl-3">
                  <span className="text-[var(--paper-on-data-soft)]">+ {item.role}</span>
                  <span className="tabular text-[var(--signal-red)]/90">
                    ~{fmt(item.estimatedCost ?? 0)}
                  </span>
                </div>
              ))}
              {hiddenCount > 0 && (
                <div className="pl-3 text-xs text-[#857c6d]">
                  + {hiddenCount} more
                </div>
              )}
              {missing.length === 0 && (
                <div className="pl-3 text-sm text-[var(--paper-on-data-soft)]">No required parts missing.</div>
              )}
            </div>

            <div className="border-t-2 border-[#3a3225]" />

            {/* Real build cost — the hero line */}
            <div className="flex items-end justify-between pt-4">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-widest text-[#857c6d]">
                  Real Build Cost
                </p>
                <p className="font-display text-[44px] sm:text-[56px] leading-none text-[var(--accent)] mt-1">
                  {fmt(kit.trueCost)}
                </p>
              </div>
              {m && (
                <span className="tabular text-sm text-[var(--signal-red)] pb-2">
                  {m} advertised
                </span>
              )}
            </div>

            {kit.missingCost > 0 && (
              <div className="mt-4 inline-flex items-center gap-2 rounded-sm bg-[#2a1a14] border border-[var(--signal-red)]/30 px-3 py-1.5">
                <span className="tabular text-xs text-[var(--signal-red)]">
                  +{fmt(kit.missingCost)} hidden
                </span>
              </div>
            )}
          </div>

          {/* Bottom tape */}
          <div className="border-t border-[#3a3225] px-6 py-3 flex items-center justify-between text-[10px] font-mono uppercase tracking-widest text-[#857c6d]">
            <span>offgridempire.com</span>
            {href && (
              <span className="text-[var(--accent)] group-hover:underline">
                See breakdown →
              </span>
            )}
          </div>
        </div>
      </Wrapper>
    );
  }

  // ── REPORT variant — paper surface, used in flow content ────────────────────
  if (variant === "report") {
    return (
      <Wrapper>
        <div className="rounded-sm border border-[var(--rule)] bg-[var(--bg-surface)]">
          <div className="flex items-center justify-between border-b border-[var(--rule)] px-5 py-2.5">
            <div className="flex items-center gap-2">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--signal-red)]" />
              <span className="eyebrow">Completion Gap Receipt</span>
            </div>
            {m && <span className="tabular text-xs text-[var(--signal-red)]">{m} advertised</span>}
          </div>

          <div className="px-5 py-5 space-y-3">
            <div className="flex items-baseline justify-between">
              <span className="text-sm text-[var(--ink-soft)]">Advertised</span>
              <span className="tabular text-base text-[var(--ink-muted)] line-through decoration-1">
                {fmt(kit.listedPrice)}
              </span>
            </div>

            {missing.length > 0 && (
              <>
                <div className="border-t border-dashed border-[var(--rule)]" />
                <div className="space-y-1">
                  <p className="font-mono text-[10px] uppercase tracking-widest text-[var(--signal-red)] mb-1.5">
                    Hidden required parts
                  </p>
                  {missing.map((item, i) => (
                    <div key={i} className="flex items-baseline justify-between text-sm pl-2">
                      <span className="text-[var(--ink-soft)]">+ {item.role}</span>
                      <span className="tabular text-[var(--signal-red)]">
                        ~{fmt(item.estimatedCost ?? 0)}
                      </span>
                    </div>
                  ))}
                  {hiddenCount > 0 && (
                    <div className="pl-2 text-xs text-[var(--ink-muted)]">
                      + {hiddenCount} more
                    </div>
                  )}
                </div>
              </>
            )}

            <div className="border-t-2 border-[var(--ink)]/15" />

            <div className="flex items-end justify-between pt-1">
              <span className="font-display text-base text-[var(--ink)]">Real build cost</span>
              <span className="font-display text-3xl text-[var(--accent)]">
                {fmt(kit.trueCost)}
              </span>
            </div>
          </div>

          {href && (
            <div className="border-t border-[var(--rule)] px-5 py-2 text-right">
              <span className="text-xs text-[var(--accent)] group-hover:underline">
                See full breakdown →
              </span>
            </div>
          )}
        </div>
      </Wrapper>
    );
  }

  // ── INLINE variant — compact stat strip ─────────────────────────────────────
  return (
    <Wrapper>
      <div className="inline-flex items-center gap-3 rounded-sm border border-[var(--rule)] bg-[var(--bg-surface)] px-3 py-1.5 text-sm">
        <span className="tabular text-[var(--ink-muted)] line-through decoration-1">
          {fmt(kit.listedPrice)}
        </span>
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-[var(--ink-muted)]">
          <path d="M5 12h14M13 5l7 7-7 7" />
        </svg>
        <span className="tabular font-semibold text-[var(--accent)]">{fmt(kit.trueCost)}</span>
        {kit.missingCost > 0 && (
          <span className="tabular text-xs text-[var(--signal-red)]">
            +{fmt(kit.missingCost)}
          </span>
        )}
      </div>
    </Wrapper>
  );
}
