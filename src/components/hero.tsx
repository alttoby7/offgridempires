import Link from "next/link";
import type { Kit } from "@/lib/demo-data";

interface HeroProps {
  trapKit: Kit;
  kitCount: number;
  brandCount: number;
}

export function Hero({ trapKit, kitCount, brandCount }: HeroProps) {
  const pctMore = trapKit.listedPrice > 0
    ? Math.round(((trapKit.trueCost - trapKit.listedPrice) / trapKit.listedPrice) * 100)
    : 0;

  return (
    <section className="relative overflow-hidden border-b border-[var(--border)]">
      {/* Background grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(var(--text-muted) 1px, transparent 1px), linear-gradient(90deg, var(--text-muted) 1px, transparent 1px)`,
          backgroundSize: "40px 40px",
        }}
      />

      {/* Amber glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[var(--accent)] opacity-[0.04] blur-[120px] rounded-full" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 sm:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left: Message */}
          <div>
            {/* Badge */}
            <div className="inline-flex items-center gap-2 rounded-sm border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-1.5 mb-6">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--accent)] opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--accent)]" />
              </span>
              <span className="text-sm text-[var(--text-secondary)]">
                Tracking {kitCount} kits across {brandCount} brands
              </span>
            </div>

            {/* Headline — live data from worst-trap kit */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-[1.1]">
              That ${trapKit.listedPrice.toLocaleString()} solar kit{" "}
              <span className="text-[var(--danger)] line-through decoration-2">
                costs ${trapKit.trueCost.toLocaleString()}
              </span>{" "}
              <span className="text-[var(--accent)]">to actually use.</span>
            </h1>

            {/* Subheadline */}
            <p className="mt-5 text-base sm:text-lg text-[var(--text-secondary)] leading-relaxed max-w-xl">
              We break down every off-grid solar kit into components, expose
              what&apos;s missing, and calculate the real cost to build a working
              system. Stop comparing sticker prices.
            </p>

            {/* Decision-first CTAs */}
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Link
                href="/kits?sort=cost_per_wh"
                className="inline-flex items-center justify-center gap-2 rounded bg-[var(--accent)] px-6 py-3 text-sm font-bold text-[var(--bg-primary)] hover:bg-[var(--accent-hover)] transition-colors"
              >
                Find the best true value
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
              </Link>
              <Link
                href="/kits?complete=1"
                className="inline-flex items-center justify-center gap-2 rounded border border-[var(--border)] bg-[var(--bg-surface)] px-6 py-3 text-sm font-medium text-[var(--text-secondary)] hover:border-[var(--border-accent)] hover:text-[var(--accent)] transition-colors"
              >
                Only show complete kits
              </Link>
            </div>

            {/* Quick stats */}
            <div className="mt-8 flex flex-wrap gap-6">
              {[
                { value: String(kitCount), label: "Kits Tracked" },
                { value: String(brandCount), label: "Brands" },
                { value: "6hr", label: "Price Tracking" },
                { value: "$0", label: "Always Free" },
              ].map((stat) => (
                <div key={stat.label} className="flex items-baseline gap-1.5">
                  <span className="font-mono text-lg font-bold text-[var(--accent)]">
                    {stat.value}
                  </span>
                  <span className="text-xs text-[var(--text-muted)]">{stat.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Compact Receipt Preview */}
          <div>
            <Link
              href={`/kits/${trapKit.slug}`}
              className="group block rounded border border-[var(--border)] bg-[var(--bg-surface)] overflow-hidden shadow-2xl shadow-black/20 lg:rotate-1 lg:hover:rotate-0 transition-transform duration-500"
            >
              {/* Receipt header */}
              <div className="bg-[var(--danger)]/10 border-b border-[var(--danger)]/20 px-5 py-2.5 flex items-center gap-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--danger)]">
                  <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
                <span className="text-xs font-bold text-[var(--danger)] uppercase tracking-wide">
                  Completion Gap Receipt
                </span>
              </div>

              <div className="p-5 font-mono text-sm space-y-3">
                <div className="text-[var(--text-muted)] text-sm truncate">
                  {trapKit.name}
                </div>

                <div className="flex justify-between">
                  <span className="text-[var(--text-secondary)]">Advertised price</span>
                  <span className="text-[var(--text-primary)] font-semibold">
                    ${trapKit.listedPrice.toLocaleString()}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-[var(--danger)]">Hidden cost</span>
                  <span className="text-[var(--danger)] font-bold">
                    +${trapKit.missingCost.toLocaleString()}
                  </span>
                </div>

                <div className="border-t-2 border-[var(--border)]" />

                <div className="flex justify-between items-baseline">
                  <span className="text-[var(--text-primary)] font-bold">Real build cost</span>
                  <span className="text-[var(--accent)] font-bold text-lg">
                    ${trapKit.trueCost.toLocaleString()}
                  </span>
                </div>

                {pctMore > 0 && (
                  <div className="rounded bg-[var(--danger)]/10 border border-[var(--danger)]/20 px-3 py-2 text-center text-xs text-[var(--danger)]">
                    <strong>{pctMore}% more</strong> than the sticker price
                  </div>
                )}
              </div>

              <div className="bg-[var(--bg-primary)] border-t border-[var(--border)] px-5 py-2 flex items-center justify-between">
                <span className="text-xs text-[var(--text-muted)]">
                  offgridempire.com
                </span>
                <span className="text-xs text-[var(--accent)] group-hover:underline">
                  See full breakdown &rarr;
                </span>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
