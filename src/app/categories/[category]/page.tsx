import type { Metadata } from "next";
import Link from "next/link";

const categoryMeta: Record<string, { title: string; description: string }> = {
  batteries: {
    title: "Best LiFePO4 Batteries",
    description: "Compare LiFePO4 batteries by capacity, brand, and price with live pricing data.",
  },
  panels: {
    title: "Best Solar Panels",
    description: "Compare solar panels by wattage, cell type, and price across retailers.",
  },
  "charge-controllers": {
    title: "Best Charge Controllers",
    description: "Compare MPPT and PWM charge controllers by amperage and price.",
  },
  inverters: {
    title: "Best Inverters",
    description: "Compare pure sine and modified sine inverters by wattage and price.",
  },
  "power-stations": {
    title: "Best Portable Power Stations",
    description: "Compare portable power stations by capacity, output, and price.",
  },
  generators: {
    title: "Best Generators",
    description: "Compare solar and fuel generators for off-grid use.",
  },
};

export function generateStaticParams() {
  return Object.keys(categoryMeta).map((category) => ({ category }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}): Promise<Metadata> {
  const { category } = await params;
  const meta = categoryMeta[category];
  const title = meta?.title ?? "Category";
  const description = meta?.description ?? "Browse off-grid components.";
  return {
    title,
    description,
    alternates: { canonical: `/categories/${category}` },
    openGraph: {
      title: `${title} | OffGridEmpire`,
      description,
      url: `/categories/${category}`,
    },
  };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  const meta = categoryMeta[category];
  const title = meta?.title ?? category.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
      <nav className="flex items-center gap-2 text-xs text-[var(--text-muted)] mb-6">
        <Link href="/" className="hover:text-[var(--accent)] transition-colors">Home</Link>
        <span>/</span>
        <Link href="/products" className="hover:text-[var(--accent)] transition-colors">Components</Link>
        <span>/</span>
        <span className="text-[var(--text-secondary)]">{title}</span>
      </nav>

      <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
        {title}
      </h1>
      <p className="text-sm text-[var(--text-muted)] mb-8">
        {meta?.description ?? "Browse and compare products in this category."}
      </p>

      {/* Placeholder product grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="rounded border border-[var(--border)] bg-[var(--bg-surface)] p-5 flex flex-col gap-3"
          >
            <div className="h-4 w-2/3 rounded bg-[var(--bg-elevated)] animate-pulse" />
            <div className="h-3 w-1/3 rounded bg-[var(--bg-elevated)] animate-pulse" />
            <div className="h-20 rounded bg-[var(--bg-primary)] animate-pulse mt-2" />
            <div className="flex justify-between mt-auto pt-3 border-t border-[var(--border)]">
              <div className="h-5 w-16 rounded bg-[var(--bg-elevated)] animate-pulse" />
              <div className="h-5 w-20 rounded bg-[var(--bg-elevated)] animate-pulse" />
            </div>
          </div>
        ))}
      </div>

      <p className="text-center text-sm text-[var(--text-muted)] mt-12 font-mono">
        Product data loading soon — data pipeline in progress
      </p>
    </div>
  );
}
