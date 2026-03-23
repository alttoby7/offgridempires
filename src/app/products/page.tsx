import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Components & Products",
  description:
    "Browse individual solar components — batteries, panels, charge controllers, inverters — with price tracking.",
};

const categories = [
  { slug: "batteries", label: "LiFePO4 Batteries", count: 42 },
  { slug: "panels", label: "Solar Panels", count: 38 },
  { slug: "charge-controllers", label: "Charge Controllers", count: 24 },
  { slug: "inverters", label: "Inverters", count: 28 },
  { slug: "power-stations", label: "Portable Power Stations", count: 18 },
  { slug: "generators", label: "Generators", count: 12 },
];

export default function ProductsPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
      <nav className="flex items-center gap-2 text-xs text-[var(--text-muted)] mb-6">
        <Link href="/" className="hover:text-[var(--accent)] transition-colors">Home</Link>
        <span>/</span>
        <span className="text-[var(--text-secondary)]">Components</span>
      </nav>

      <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
        Components & Products
      </h1>
      <p className="text-sm text-[var(--text-muted)] mb-8">
        Individual components with price history and cross-retailer comparison
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((cat) => (
          <Link
            key={cat.slug}
            href={`/categories/${cat.slug}`}
            className="group rounded border border-[var(--border)] bg-[var(--bg-surface)] p-6 hover:border-[var(--border-accent)] transition-all"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors">
                {cat.label}
              </h2>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--text-muted)] group-hover:text-[var(--accent)] transition-colors"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </div>
            <p className="font-mono text-xs text-[var(--text-muted)] mt-2">
              {cat.count} products tracked
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
