import Link from "next/link";

export function Hero() {
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
                Tracking 14 kits across 10 brands
              </span>
            </div>

            {/* Headline — lead with the truth-telling */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-[1.1]">
              That $289 solar kit{" "}
              <span className="text-[var(--danger)] line-through decoration-2">costs $1,039</span>{" "}
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
                { value: "14", label: "Kits Tracked" },
                { value: "10", label: "Brands" },
                { value: "6hr", label: "Price Updates" },
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

          {/* Right: Mini Gap Receipt Demo */}
          <div className="hidden lg:block">
            <div className="rounded border border-[var(--border)] bg-[var(--bg-surface)] overflow-hidden shadow-2xl shadow-black/20 rotate-1 hover:rotate-0 transition-transform duration-500">
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
                <div className="flex justify-between">
                  <span className="text-[var(--text-muted)] text-sm">Eco-Worthy 200W Starter Kit</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-secondary)]">Advertised price</span>
                  <span className="text-[var(--text-primary)] font-semibold">$289</span>
                </div>

                <div className="border-t border-dashed border-[var(--border)]" />

                <div className="text-xs uppercase tracking-wide font-medium text-[var(--danger)]">
                  Not included:
                </div>
                <div className="flex justify-between pl-2 text-xs">
                  <span className="text-[var(--text-muted)]">+ Battery (12V 100Ah+)</span>
                  <span className="text-[var(--danger)]">~$300</span>
                </div>
                <div className="flex justify-between pl-2 text-xs">
                  <span className="text-[var(--text-muted)]">+ Inverter (1000W+ pure sine)</span>
                  <span className="text-[var(--danger)]">~$200</span>
                </div>
                <div className="flex justify-between pl-2 text-xs">
                  <span className="text-[var(--text-muted)]">+ Monitoring module</span>
                  <span className="text-[var(--danger)]">~$25</span>
                </div>

                <div className="border-t border-dashed border-[var(--border)]" />

                <div className="flex justify-between">
                  <span className="text-[var(--danger)] font-semibold">Hidden cost</span>
                  <span className="text-[var(--danger)] font-bold">+$525</span>
                </div>

                <div className="border-t-2 border-[var(--border)]" />

                <div className="flex justify-between">
                  <span className="text-[var(--text-primary)] font-bold">Real build cost</span>
                  <span className="text-[var(--accent)] font-bold text-lg">$814</span>
                </div>

                <div className="rounded bg-[var(--danger)]/10 border border-[var(--danger)]/20 px-3 py-2 text-center text-xs text-[var(--danger)]">
                  <strong>65% more</strong> than the sticker price
                </div>
              </div>

              <div className="bg-[var(--bg-primary)] border-t border-[var(--border)] px-5 py-2 text-center">
                <span className="text-xs text-[var(--text-muted)]">
                  offgridempire.com
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
