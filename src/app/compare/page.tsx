import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Compare Solar Kits",
  description:
    "Side-by-side comparison of off-grid solar kits with normalized specs and true total cost.",
};

export default function ComparePage() {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
      <nav className="flex items-center gap-2 text-xs text-[var(--text-muted)] mb-6">
        <Link href="/" className="hover:text-[var(--accent)] transition-colors">Home</Link>
        <span>/</span>
        <span className="text-[var(--text-secondary)]">Compare</span>
      </nav>

      <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
        Compare Kits Side-by-Side
      </h1>
      <p className="text-sm text-[var(--text-muted)] mb-8">
        Select 2-3 kits to compare specs, costs, and included components
      </p>

      {/* Placeholder comparison slots */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {[1, 2, 3].map((slot) => (
          <div
            key={slot}
            className="flex flex-col items-center justify-center rounded border border-dashed border-[var(--border)] bg-[var(--bg-surface)] p-8 min-h-[300px]"
          >
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-[var(--text-muted)] mb-3"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v8M8 12h8" />
            </svg>
            <p className="text-sm text-[var(--text-muted)]">
              Select kit {slot}
            </p>
          </div>
        ))}
      </div>

      {/* Placeholder comparison table */}
      <div className="rounded border border-[var(--border)] bg-[var(--bg-surface)] overflow-hidden">
        <div className="p-4 border-b border-[var(--border)]">
          <h2 className="font-mono text-xs uppercase tracking-wider text-[var(--text-muted)]">
            Comparison Table
          </h2>
        </div>
        <div className="p-8 text-center">
          <p className="text-sm text-[var(--text-muted)] font-mono">
            Add kits above to generate comparison
          </p>
        </div>
      </div>
    </div>
  );
}
