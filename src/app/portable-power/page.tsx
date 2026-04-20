import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { getKitsByType } from "@/lib/get-kits";
import { BreadcrumbJsonLd } from "@/components/json-ld";
import { KitBrowser } from "@/components/kit-browser";
import { DataFooter } from "@/components/ui/data-footer";
import { getKitsUpdated } from "@/lib/data-meta";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Portable Power Stations Compared by Real Build Cost",
  description:
    "Compare portable power stations from EcoFlow, Bluetti, Jackery, Anker, and more. See true costs, battery capacity, and bundled solar panels.",
  alternates: { canonical: "/portable-power" },
  openGraph: {
    title: "Portable Power Stations Compared by Real Build Cost",
    description:
      "Compare portable power stations with real costs, specs, and solar panel bundles across top brands.",
    url: "/portable-power",
  },
};

export default function PortablePowerPage() {
  const kits = getKitsByType("portable");

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <BreadcrumbJsonLd
        items={[
          { name: "Home", url: "/" },
          { name: "Portable Power", url: "/portable-power" },
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
        <span className="text-[var(--text-secondary)]">Portable Power</span>
      </nav>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-3">
          Portable Power Stations
        </h1>
        <p className="text-[var(--text-secondary)] max-w-2xl">
          OffGridEmpire tracks {kits.length} portable power stations across
          EcoFlow, Bluetti, Jackery, Anker, and more. Every station is compared
          by real build cost: the advertised price plus any required solar
          panels or accessories the bundle leaves out. Prices refresh every
          six hours.
        </p>
        <div className="mt-4">
          <DataFooter kitCount={kits.length} updated={getKitsUpdated()} />
        </div>
        <div className="mt-2 flex flex-wrap gap-4 text-sm">
          <span className="font-mono text-[var(--accent)] font-semibold">
            {kits.length}
          </span>
          <span className="text-[var(--text-muted)]">stations tracked</span>
          <span className="text-[var(--text-muted)]">&middot;</span>
          <Link
            href="/calculator"
            className="text-[var(--accent)] hover:underline"
          >
            Not sure what size you need? Size my system &rarr;
          </Link>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            href="/best-solar-generator-under-500"
            className="inline-flex items-center rounded border border-[var(--accent)]/40 bg-[var(--accent)]/5 px-3 py-1.5 text-xs font-medium text-[var(--accent)] hover:bg-[var(--accent)]/10 transition-colors"
          >
            Best Under $500 ranked →
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
          Looking for a permanent installation instead?
        </p>
        <div className="flex justify-center gap-4">
          <Link
            href="/solar-kits"
            className="text-sm text-[var(--accent)] hover:underline"
          >
            DIY Solar Kits &rarr;
          </Link>
          <Link
            href="/whole-home"
            className="text-sm text-[var(--accent)] hover:underline"
          >
            Whole-Home Systems &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}
