import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { getKits } from "@/lib/get-kits";
import { BreadcrumbJsonLd } from "@/components/json-ld";
import { CompareView } from "@/components/compare-view";

export const metadata: Metadata = {
  title: "Compare Solar Kits",
  description:
    "Side-by-side comparison of off-grid solar kits with normalized specs and true total cost.",
  alternates: { canonical: "/compare" },
  openGraph: {
    title: "Compare Solar Kits | OffGridEmpire",
    description:
      "Side-by-side comparison of off-grid solar kits with normalized specs and true total cost.",
    url: "/compare",
  },
};

export default function ComparePage() {
  const allKits = getKits();

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <BreadcrumbJsonLd items={[{ name: "Home", url: "/" }, { name: "Compare", url: "/compare" }]} />

      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-[var(--text-muted)] mb-6">
        <Link href="/" className="hover:text-[var(--accent)] transition-colors">Home</Link>
        <span>/</span>
        <span className="text-[var(--text-secondary)]">Compare</span>
      </nav>

      <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
        Side-by-Side Comparison
      </h1>
      <p className="text-sm text-[var(--text-muted)] mb-8">
        Normalized specs, real build cost, and component coverage
      </p>

      <Suspense fallback={<div className="h-96 animate-pulse rounded bg-[var(--bg-surface)]" />}>
        <CompareView allKits={allKits} />
      </Suspense>
    </div>
  );
}
