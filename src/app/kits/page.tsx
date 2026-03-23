import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { getKits } from "@/lib/get-kits";
import { KitListJsonLd, BreadcrumbJsonLd } from "@/components/json-ld";
import { KitBrowser } from "@/components/kit-browser";

export const metadata: Metadata = {
  title: "Browse Solar Kits",
  description:
    "Compare off-grid solar kits with normalized specs, true total cost, and live pricing across brands.",
  alternates: { canonical: "/kits" },
  openGraph: {
    title: "Browse Solar Kits | OffGridEmpire",
    description:
      "Compare off-grid solar kits with normalized specs, true total cost, and live pricing across brands.",
    url: "/kits",
  },
};

export default function KitsPage() {
  const allKits = getKits();

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <KitListJsonLd kits={allKits} />
      <BreadcrumbJsonLd items={[{ name: "Home", url: "/" }, { name: "Kits", url: "/kits" }]} />

      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-[var(--text-muted)] mb-6">
        <Link href="/" className="hover:text-[var(--accent)] transition-colors">
          Home
        </Link>
        <span>/</span>
        <span className="text-[var(--text-secondary)]">Kits</span>
      </nav>

      {/* Interactive browser (client component) */}
      <Suspense fallback={<div className="h-96 animate-pulse rounded bg-[var(--bg-surface)]" />}>
        <KitBrowser allKits={allKits} />
      </Suspense>

      {/* Methodology link */}
      <div className="mt-12 text-center space-y-2">
        <p className="text-xs text-[var(--text-muted)]">
          True total cost includes estimated prices for missing components based on average market prices.
        </p>
        <Link
          href="/methodology"
          className="inline-flex items-center gap-1 text-xs text-[var(--accent)] hover:text-[var(--accent-hover)] transition-colors"
        >
          How we calculate true total cost
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" />
          </svg>
        </Link>
      </div>
    </div>
  );
}
