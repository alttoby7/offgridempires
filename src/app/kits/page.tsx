import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Browse Solar Kits",
  description:
    "Compare off-grid solar kits with normalized specs, true total cost, and live pricing across brands.",
};

export default function KitsPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-[var(--text-muted)] mb-6">
        <Link href="/" className="hover:text-[var(--accent)] transition-colors">Home</Link>
        <span>/</span>
        <span className="text-[var(--text-secondary)]">Kits</span>
      </nav>

      <div className="flex items-end justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Solar Kits</h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            120+ kits compared with true total cost
          </p>
        </div>
      </div>

      {/* Placeholder filter bar */}
      <div className="flex flex-wrap gap-3 mb-8 p-4 rounded border border-[var(--border)] bg-[var(--bg-surface)]">
        {["Use Case", "Budget", "Battery", "Brand", "Sort"].map((filter) => (
          <button
            key={filter}
            className="inline-flex items-center gap-1.5 rounded border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] hover:border-[var(--border-accent)] transition-colors"
          >
            {filter}
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6"/></svg>
          </button>
        ))}
      </div>

      {/* Placeholder grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="rounded border border-[var(--border)] bg-[var(--bg-surface)] p-6 flex flex-col gap-3"
          >
            <div className="h-4 w-3/4 rounded bg-[var(--bg-elevated)] animate-pulse" />
            <div className="h-3 w-1/2 rounded bg-[var(--bg-elevated)] animate-pulse" />
            <div className="grid grid-cols-3 gap-2 mt-2">
              {[1, 2, 3].map((j) => (
                <div key={j} className="h-12 rounded bg-[var(--bg-primary)] animate-pulse" />
              ))}
            </div>
            <div className="h-8 mt-auto rounded bg-[var(--bg-elevated)] animate-pulse" />
          </div>
        ))}
      </div>

      <p className="text-center text-sm text-[var(--text-muted)] mt-12 font-mono">
        Kit data loading soon — data pipeline in progress
      </p>
    </div>
  );
}
