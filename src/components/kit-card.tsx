import Link from "next/link";

interface KitCardProps {
  name: string;
  brand: string;
  slug: string;
  listedPrice: number;
  trueCost: number;
  watts: number;
  storage: string;
  useCase: string;
  includesBattery: boolean;
  includesInverter: boolean;
  costPerWh: string;
  priceChange?: number;
}

export function KitCard({
  name,
  brand,
  slug,
  listedPrice,
  trueCost,
  watts,
  storage,
  useCase,
  includesBattery,
  includesInverter,
  costPerWh,
  priceChange,
}: KitCardProps) {
  return (
    <Link
      href={`/kits/${slug}`}
      className="group relative flex flex-col border border-[var(--border)] rounded bg-[var(--bg-surface)] hover:border-[var(--border-accent)] transition-all duration-200 overflow-hidden"
    >
      {/* Top accent bar */}
      <div className="h-0.5 bg-gradient-to-r from-[var(--accent)] via-[var(--accent)]/50 to-transparent" />

      <div className="p-4 flex-1 flex flex-col gap-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-wider text-[var(--text-muted)]">
              {brand}
            </p>
            <h3 className="text-sm font-semibold text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors line-clamp-2 mt-0.5">
              {name}
            </h3>
          </div>
          <span className="shrink-0 inline-flex items-center rounded-sm bg-[var(--bg-elevated)] px-2 py-0.5 font-mono text-[10px] text-[var(--text-muted)]">
            {useCase}
          </span>
        </div>

        {/* Specs grid */}
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded bg-[var(--bg-primary)] px-2 py-1.5">
            <p className="font-mono text-[10px] text-[var(--text-muted)] uppercase">Watts</p>
            <p className="font-mono text-sm font-semibold text-[var(--text-primary)]">{watts}W</p>
          </div>
          <div className="rounded bg-[var(--bg-primary)] px-2 py-1.5">
            <p className="font-mono text-[10px] text-[var(--text-muted)] uppercase">Storage</p>
            <p className="font-mono text-sm font-semibold text-[var(--text-primary)]">{storage}</p>
          </div>
          <div className="rounded bg-[var(--bg-primary)] px-2 py-1.5">
            <p className="font-mono text-[10px] text-[var(--text-muted)] uppercase">$/Wh</p>
            <p className="font-mono text-sm font-semibold text-[var(--accent)]">{costPerWh}</p>
          </div>
        </div>

        {/* Included badges */}
        <div className="flex flex-wrap gap-1.5">
          <span
            className={`inline-flex items-center gap-1 rounded-sm px-2 py-0.5 text-[11px] font-medium ${
              includesBattery
                ? "bg-[var(--success)]/10 text-[var(--success)]"
                : "bg-[var(--danger)]/10 text-[var(--danger)]"
            }`}
          >
            {includesBattery ? (
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
            ) : (
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
            )}
            Battery
          </span>
          <span
            className={`inline-flex items-center gap-1 rounded-sm px-2 py-0.5 text-[11px] font-medium ${
              includesInverter
                ? "bg-[var(--success)]/10 text-[var(--success)]"
                : "bg-[var(--danger)]/10 text-[var(--danger)]"
            }`}
          >
            {includesInverter ? (
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
            ) : (
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
            )}
            Inverter
          </span>
        </div>

        {/* Price */}
        <div className="mt-auto pt-3 border-t border-[var(--border)] flex items-end justify-between">
          <div>
            <p className="font-mono text-[10px] text-[var(--text-muted)] uppercase">Listed</p>
            <p className="font-mono text-lg font-bold text-[var(--text-primary)]">
              ${listedPrice.toLocaleString()}
            </p>
          </div>
          <div className="text-right">
            <p className="font-mono text-[10px] text-[var(--text-muted)] uppercase">True Cost</p>
            <p className="font-mono text-lg font-bold text-[var(--accent)]">
              ${trueCost.toLocaleString()}
            </p>
          </div>
          {priceChange !== undefined && priceChange !== 0 && (
            <span
              className={`absolute top-3 right-3 font-mono text-[11px] font-semibold ${
                priceChange < 0 ? "text-[var(--success)]" : "text-[var(--danger)]"
              }`}
            >
              {priceChange < 0 ? "▼" : "▲"} ${Math.abs(priceChange)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
