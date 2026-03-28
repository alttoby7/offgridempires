import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { getKitsByType } from "@/lib/get-kits";
import { KitListJsonLd, BreadcrumbJsonLd } from "@/components/json-ld";
import { KitBrowser } from "@/components/kit-browser";

export const metadata: Metadata = {
  title: "DIY Solar Kits",
  description:
    "Compare DIY solar panel kits from Renogy, Eco-Worthy, WindyNation, and more. See what's included, what's missing, and the real cost to build a working system.",
  alternates: { canonical: "/solar-kits" },
  openGraph: {
    title: "DIY Solar Kits | OffGridEmpire",
    description:
      "Compare DIY solar kits with component breakdowns, missing part costs, and true build prices.",
    url: "/solar-kits",
  },
};

export default function SolarKitsPage() {
  // Include both DIY kits and panels-only kits — these are the "build it yourself" audience
  const diyKits = getKitsByType("diy-kit");
  const panelKits = getKitsByType("panels-only");
  const kits = [...diyKits, ...panelKits];

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <KitListJsonLd kits={kits} />
      <BreadcrumbJsonLd
        items={[
          { name: "Home", url: "/" },
          { name: "DIY Solar Kits", url: "/solar-kits" },
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
        <span className="text-[var(--text-secondary)]">DIY Solar Kits</span>
      </nav>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-3">
          DIY Solar Kits
        </h1>
        <p className="text-[var(--text-secondary)] max-w-2xl">
          Panel and component kits you wire yourself &mdash; for RVs, cabins,
          sheds, and small off-grid builds. We show you exactly what&apos;s
          included, what&apos;s missing, and the real cost to get a working
          system.
        </p>
        <div className="mt-4 flex flex-wrap gap-4 text-sm">
          <span className="font-mono text-[var(--accent)] font-semibold">
            {kits.length}
          </span>
          <span className="text-[var(--text-muted)]">kits tracked</span>
          <span className="text-[var(--text-muted)]">&middot;</span>
          <Link
            href="/calculator"
            className="text-[var(--accent)] hover:underline"
          >
            Not sure what size? Size my system first &rarr;
          </Link>
        </div>

        {/* Budget shortcuts */}
        <div className="mt-4 flex flex-wrap gap-2">
          {[
            { href: "/solar-kits/under-500", label: "Under $500" },
            { href: "/solar-kits/under-1000", label: "Under $1,000" },
            { href: "/solar-kits/under-2000", label: "Under $2,000" },
          ].map((b) => (
            <Link
              key={b.href}
              href={b.href}
              className="inline-flex items-center rounded border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors"
            >
              {b.label}
            </Link>
          ))}
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
          Need something different?
        </p>
        <div className="flex justify-center gap-4">
          <Link
            href="/portable-power"
            className="text-sm text-[var(--accent)] hover:underline"
          >
            Portable Power Stations &rarr;
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
