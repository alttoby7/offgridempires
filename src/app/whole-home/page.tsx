import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { getKitsByType } from "@/lib/get-kits";
import { KitListJsonLd, BreadcrumbJsonLd } from "@/components/json-ld";
import { KitBrowser } from "@/components/kit-browser";

export const metadata: Metadata = {
  title: "Whole-Home & Off-Grid Systems",
  description:
    "Compare complete 5kW–60kW+ off-grid solar systems. See real build costs, component breakdowns, and what you need for professional installation.",
  alternates: { canonical: "/whole-home" },
  openGraph: {
    title: "Whole-Home Solar Systems | OffGridEmpire",
    description:
      "Complete off-grid solar systems for homesteads and whole-home backup. Compare real build costs across Shop Solar, EG4, and more.",
    url: "/whole-home",
  },
};

export default function WholeHomePage() {
  const kits = getKitsByType("whole-home");

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <KitListJsonLd kits={kits} />
      <BreadcrumbJsonLd
        items={[
          { name: "Home", url: "/" },
          { name: "Whole-Home Systems", url: "/whole-home" },
        ]}
      />

      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-[var(--text-muted)] mb-6">
        <Link
          href="/"
          className="hover:text-[var(--accent)] transition-colors"
        >
          Home
        </Link>
        <span>/</span>
        <span className="text-[var(--text-secondary)]">
          Whole-Home Systems
        </span>
      </nav>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-3">
          Whole-Home &amp; Off-Grid Systems
        </h1>
        <p className="text-[var(--text-secondary)] max-w-2xl">
          Complete 5kW&ndash;60kW+ solar systems with panels, batteries,
          inverters, and mounting hardware. Buy the equipment yourself and skip
          contractor markup &mdash; then hand the system to your electrician for
          installation.
        </p>
        <div className="mt-4 flex flex-wrap gap-4 text-sm">
          <span className="font-mono text-[var(--accent)] font-semibold">
            {kits.length}
          </span>
          <span className="text-[var(--text-muted)]">systems tracked</span>
          <span className="text-[var(--text-muted)]">&middot;</span>
          <Link
            href="/calculator"
            className="text-[var(--accent)] hover:underline"
          >
            Calculate your power needs &rarr;
          </Link>
        </div>
      </div>

      <Suspense
        fallback={
          <div className="h-96 animate-pulse rounded bg-[var(--bg-surface)]" />
        }
      >
        <KitBrowser allKits={kits} />
      </Suspense>

      <div className="mt-12 text-center space-y-3">
        <p className="text-sm text-[var(--text-muted)]">
          Need something smaller or more portable?
        </p>
        <div className="flex justify-center gap-4">
          <Link
            href="/portable-power"
            className="text-sm text-[var(--accent)] hover:underline"
          >
            Portable Power Stations &rarr;
          </Link>
          <Link
            href="/solar-kits"
            className="text-sm text-[var(--accent)] hover:underline"
          >
            DIY Solar Kits &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}
