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

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <div className="max-w-3xl">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 rounded-sm border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-1.5 mb-6">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--accent)] opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--accent)]" />
            </span>
            <span className="font-mono text-xs text-[var(--text-secondary)]">
              Tracking 120+ kits across 15 brands
            </span>
          </div>

          {/* Headline */}
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-[1.1]">
            Compare every off-grid solar kit.{" "}
            <span className="text-[var(--accent)]">
              See what&apos;s really inside.
            </span>
          </h1>

          {/* Subheadline */}
          <p className="mt-5 text-base sm:text-lg text-[var(--text-secondary)] leading-relaxed max-w-2xl">
            The only tool that breaks down solar kits into normalized components,
            calculates true total cost including what&apos;s missing, and tracks
            prices across retailers. Stop comparing apples to oranges.
          </p>

          {/* Search bar */}
          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1 max-w-lg">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
              <input
                type="text"
                placeholder='Search kits, brands, or components...'
                className="w-full rounded border border-[var(--border)] bg-[var(--bg-surface)] py-3 pl-10 pr-4 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]/50 transition-colors"
              />
            </div>
            <button className="inline-flex items-center justify-center gap-2 rounded bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-[var(--bg-primary)] hover:bg-[var(--accent-hover)] transition-colors">
              Search
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Quick stats */}
          <div className="mt-8 flex flex-wrap gap-6">
            {[
              { value: "120+", label: "Kits Tracked" },
              { value: "15", label: "Brands" },
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
      </div>
    </section>
  );
}
