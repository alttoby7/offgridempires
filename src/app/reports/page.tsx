import type { Metadata } from "next";
import Link from "next/link";
import { BreadcrumbJsonLd } from "@/components/json-ld";
import { robotsFor } from "@/lib/index-manifest";
import {
  Breadcrumb,
  PageTitle,
  ProseContainer,
  ContentCard,
} from "@/components/ui/prose";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Data Reports",
  description:
    "Original-data reports on the off-grid solar market, computed from OffGridEmpire's live kit corpus — pricing, hidden costs, and buying signals.",
  alternates: { canonical: "/reports" },
  // INDEX GOVERNOR — defers to INDEXABLE_PATHS. Indexable as of 2026-06-22.
  ...robotsFor("/reports"),
  openGraph: {
    title: "Data Reports — OffGridEmpire",
    description:
      "Original-data reports on the off-grid solar market, computed from a live kit corpus.",
    url: "/reports",
  },
};

const reports = [
  {
    slug: "state-of-off-grid-solar-pricing-2026",
    title: "The State of Off-Grid Solar Kit Pricing 2026",
    blurb:
      "Hidden build costs, a 3.2× price spread for the same stored energy, the sub-2,000W surge trap, and how far prices swing over six months — computed from 355 live kits.",
    date: "2026-06-22",
  },
];

export default function ReportsIndex() {
  return (
    <ProseContainer>
      <BreadcrumbJsonLd
        items={[
          { name: "Home", url: "/" },
          { name: "Reports", url: "/reports" },
        ]}
      />
      <Breadcrumb items={[{ href: "/", label: "Home" }, { label: "Reports" }]} />

      <PageTitle
        title="Data Reports"
        subtitle="Original-data reports on the off-grid solar market, computed from our live kit corpus. Free to cite and reuse under CC BY 4.0."
      />

      <div className="space-y-4">
        {reports.map((r) => (
          <ContentCard key={r.slug}>
            <Link
              href={`/reports/${r.slug}`}
              className="text-lg font-semibold text-[var(--accent)] hover:underline"
            >
              {r.title}
            </Link>
            <p className="mt-2 text-sm text-[var(--text-secondary)] leading-relaxed">
              {r.blurb}
            </p>
            <p className="mt-2 text-xs text-[var(--text-muted)]">{r.date}</p>
          </ContentCard>
        ))}
      </div>
    </ProseContainer>
  );
}
