import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { getKits } from "@/lib/get-kits";
import { BreadcrumbJsonLd } from "@/components/json-ld";
import { CategoryBrowser } from "@/components/category-browser";

const categoryMeta: Record<string, { title: string; description: string }> = {
  batteries: {
    title: "Best LiFePO4 Batteries",
    description: "Compare which solar kits include batteries vs. which ones need them — with estimated costs for missing components.",
  },
  panels: {
    title: "Best Solar Panels",
    description: "Compare solar panel specs across kits — wattage, cell type, and whether panels are included or need purchasing separately.",
  },
  "charge-controllers": {
    title: "Best Charge Controllers",
    description: "See which kits include MPPT or PWM charge controllers and which require you to buy one separately.",
  },
  inverters: {
    title: "Best Inverters",
    description: "Compare inverter specs across solar kits — pure sine vs. modified sine, wattage, and included vs. missing.",
  },
  "power-stations": {
    title: "Best Portable Power Stations",
    description: "Compare all-in-one portable power stations with built-in batteries, inverters, and charge controllers.",
  },
  generators: {
    title: "Best Generators",
    description: "Compare generator options for off-grid solar backup power.",
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
  const allKits = getKits();

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <BreadcrumbJsonLd
        items={[
          { name: "Home", url: "/" },
          { name: "Components", url: "/products" },
          { name: title, url: `/categories/${category}` },
        ]}
      />

      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-[var(--text-muted)] mb-6">
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

      <Suspense fallback={<div className="h-96 animate-pulse rounded bg-[var(--bg-surface)]" />}>
        <CategoryBrowser allKits={allKits} category={category} categoryTitle={title} />
      </Suspense>

      {/* Cross-links */}
      <div className="mt-12 pt-6 border-t border-[var(--border)]">
        <p className="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)] mb-3">
          Other Components
        </p>
        <div className="flex flex-wrap gap-2">
          {Object.entries(categoryMeta)
            .filter(([key]) => key !== category)
            .map(([key, val]) => (
              <Link
                key={key}
                href={`/categories/${key}`}
                className="rounded border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-1.5 text-xs text-[var(--text-secondary)] hover:border-[var(--border-accent)] hover:text-[var(--accent)] transition-colors"
              >
                {val.title}
              </Link>
            ))}
        </div>
      </div>
    </div>
  );
}
