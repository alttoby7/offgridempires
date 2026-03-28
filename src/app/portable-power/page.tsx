import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { getKitsByType } from "@/lib/get-kits";
import { KitListJsonLd, BreadcrumbJsonLd } from "@/components/json-ld";
import { KitBrowser } from "@/components/kit-browser";

export const metadata: Metadata = {
  title: "Portable Power Stations",
  description:
    "Compare portable power stations from EcoFlow, Bluetti, Jackery, Anker, and more. See true costs, battery capacity, and bundled solar panels.",
  alternates: { canonical: "/portable-power" },
  openGraph: {
    title: "Portable Power Stations | OffGridEmpire",
    description:
      "Compare portable power stations with real costs, specs, and solar panel bundles across top brands.",
    url: "/portable-power",
  },
};

export default function PortablePowerPage() {
  const kits = getKitsByType("portable");

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <KitListJsonLd kits={kits} />
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
          All-in-one battery stations with built-in inverters. Plug in and go
          &mdash; no wiring, no installation. Perfect for camping, emergencies,
          and van life.
        </p>
        <div className="mt-4 flex flex-wrap gap-4 text-sm">
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
