import type { Metadata } from "next";
import Link from "next/link";
import { decisionGuides } from "@/content/decision-guide-registry";
import { robotsFor } from "@/lib/index-manifest";
import { BreadcrumbJsonLd } from "@/components/json-ld";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Off-Grid Buying Decision Guides",
  description:
    "Decision-grade guides that answer expensive off-grid purchase questions with real build cost, surge math, and 6-month price history — not single-brand hype.",
  alternates: { canonical: "/guides" },
  ...robotsFor("/guides"),
};

export default function GuidesIndexPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
      <BreadcrumbJsonLd
        items={[
          { name: "Home", url: "/" },
          { name: "Guides", url: "/guides" },
        ]}
      />
      <nav className="flex items-center gap-2 text-sm text-[var(--text-muted)] mb-6">
        <Link href="/" className="hover:text-[var(--accent)] transition-colors">Home</Link>
        <span>/</span>
        <span className="text-[var(--text-secondary)]">Guides</span>
      </nav>

      <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)] mb-3 leading-tight">
        Off-Grid Buying Decision Guides
      </h1>
      <p className="text-sm text-[var(--text-secondary)] leading-relaxed max-w-2xl mb-8">
        Each guide answers one expensive purchase question with real data — surge math, real build
        cost, normalized kit cohorts, and 6-month price history — instead of a single-brand
        recommendation. We don&apos;t hand-wave the part that breaks systems.
      </p>

      <div className="space-y-3">
        {decisionGuides.map((g) => (
          <Link
            key={g.slug}
            href={`/guides/${g.slug}`}
            className="block rounded border border-[var(--border)] bg-[var(--bg-surface)] p-5 hover:border-[var(--accent)]/40 transition-colors group"
          >
            <p className="text-base font-semibold text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors">
              {g.h1}
            </p>
            <p className="text-sm text-[var(--text-muted)] mt-1">{g.intent}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
