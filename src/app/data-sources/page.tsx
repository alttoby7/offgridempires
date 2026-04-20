import type { Metadata } from "next";
import Link from "next/link";
import { BreadcrumbJsonLd } from "@/components/json-ld";
import {
  SectionHeading,
  Paragraph,
  Breadcrumb,
  PageTitle,
  ProseContainer,
  ContentCard,
} from "@/components/ui/prose";
import { DataFooter } from "@/components/ui/data-footer";
import { getKits } from "@/lib/get-kits";
import { getKitsUpdated } from "@/lib/data-meta";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Data Sources: How We Track Solar Kit Prices",
  description:
    "The retailers, APIs, and data feeds OffGridEmpire pulls from to track real build cost across hundreds of off-grid solar kits, plus known limitations.",
  alternates: { canonical: "/data-sources" },
  openGraph: {
    title: "Data Sources: How We Track Solar Kit Prices",
    description:
      "Retailers, APIs, price cadence, and known limitations behind the dataset.",
    url: "/data-sources",
  },
};

const retailers = [
  { name: "Amazon", feed: "Product Advertising API v5", cadence: "6h" },
  { name: "Shop Solar Kits", feed: "ShareASale data feed", cadence: "12h" },
  { name: "Signature Solar", feed: "Impact data feed", cadence: "12h" },
  { name: "EcoFlow", feed: "Impact data feed", cadence: "12h" },
  { name: "Anker SOLIX", feed: "Impact data feed", cadence: "12h" },
  { name: "BioLongevity Labs partners", feed: "TUNE affiliate API", cadence: "12h" },
];

export default function DataSourcesPage() {
  const kitCount = getKits().length;
  const brandCount = new Set(getKits().map((k) => k.brand)).size;
  const updated = getKitsUpdated();

  return (
    <ProseContainer>
      <BreadcrumbJsonLd
        items={[
          { name: "Home", url: "/" },
          { name: "Data Sources", url: "/data-sources" },
        ]}
      />

      <Breadcrumb
        items={[{ href: "/", label: "Home" }, { label: "Data Sources" }]}
      />

      <PageTitle title="Data Sources" />

      <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-4 max-w-prose">
        Every price, spec, and component listing on OffGridEmpire comes from an
        authorized retailer API or affiliate data feed. We do not scrape
        consumer-facing websites. This page documents where each number in
        the dataset originates, how often it refreshes, and the known limits
        of that approach.
      </p>

      <DataFooter kitCount={kitCount} updated={updated} />

      <ContentCard>
        <SectionHeading id="coverage">Current Coverage</SectionHeading>
        <Paragraph>
          The dataset currently tracks{" "}
          <strong className="text-[var(--text-primary)]">
            {kitCount.toLocaleString()} active solar kits
          </strong>{" "}
          across{" "}
          <strong className="text-[var(--text-primary)]">
            {brandCount} brands
          </strong>
          . A kit enters the dataset only if it has a current listing with a
          valid price, a resolvable product URL, and enough spec information
          to decompose into component roles.
        </Paragraph>

        <SectionHeading id="retailers">Retailers &amp; Feeds</SectionHeading>
        <div className="overflow-hidden rounded border border-[var(--border)] mb-4">
          <table className="w-full text-sm">
            <thead className="bg-[var(--bg-primary)] border-b border-[var(--border)]">
              <tr>
                <th className="text-left px-3 py-2 text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                  Retailer
                </th>
                <th className="text-left px-3 py-2 text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                  Source
                </th>
                <th className="text-left px-3 py-2 text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                  Refresh
                </th>
              </tr>
            </thead>
            <tbody>
              {retailers.map((r, i) => (
                <tr
                  key={r.name}
                  className={
                    i % 2 === 0
                      ? "bg-[var(--bg-surface)]"
                      : "bg-[var(--bg-primary)]"
                  }
                >
                  <td className="px-3 py-2 text-[var(--text-primary)] font-medium">
                    {r.name}
                  </td>
                  <td className="px-3 py-2 text-[var(--text-secondary)]">
                    {r.feed}
                  </td>
                  <td className="px-3 py-2 font-mono text-xs text-[var(--accent)]">
                    {r.cadence}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <SectionHeading id="normalization">Normalization</SectionHeading>
        <Paragraph>
          Raw titles, specs, and component lists differ across retailers. Each
          kit goes through a normalization pass:
        </Paragraph>
        <ul className="list-disc list-inside text-sm text-[var(--text-secondary)] space-y-1 mb-4 ml-2">
          <li>Brand casing and retailer noise stripped from product names.</li>
          <li>Panel wattage, battery Wh, inverter W, and system voltage parsed into typed fields.</li>
          <li>Chemistry and depth-of-discharge mapped from the raw description.</li>
          <li>Variant bundles (&quot;kit + 2 panels&quot;) split into discrete SKUs so comparisons stay apples-to-apples.</li>
        </ul>

        <SectionHeading id="price-history">Price History</SectionHeading>
        <Paragraph>
          Every observed price is written to a time-series table. Kit pages
          render the last 90 days as a chart, with 30-day and all-time averages
          computed on read. Historical data begins in 2021 for long-tracked
          SKUs and at the first observation date for newer kits.
        </Paragraph>

        <SectionHeading id="limitations">Known Limitations</SectionHeading>
        <ul className="list-disc list-inside text-sm text-[var(--text-secondary)] space-y-1 mb-4 ml-2">
          <li>Retailer APIs occasionally return stale prices; every price on the site carries a timestamp and a stale-price warning after 24 hours.</li>
          <li>Shipping is included only when the retailer reports it in the feed. State sales tax is always excluded.</li>
          <li>Missing-component estimates are market averages, not quotes — your actual spend depends on the specific product you buy.</li>
          <li>Kits without a clean product URL or a parseable spec sheet are excluded entirely rather than guessed at.</li>
        </ul>
        <Paragraph>
          If a number on the site looks wrong, it is a bug, not a judgment
          call. Flag it via{" "}
          <Link
            href="/contact"
            className="text-[var(--accent)] hover:underline"
          >
            contact
          </Link>{" "}
          and it will be investigated against the source feed.
        </Paragraph>
      </ContentCard>

      <div className="mt-8 flex flex-wrap gap-3 justify-center">
        <Link
          href="/methodology"
          className="inline-flex items-center gap-2 rounded border border-[var(--border)] bg-[var(--bg-surface)] px-5 py-2.5 text-sm font-medium text-[var(--text-secondary)] hover:border-[var(--border-accent)] hover:text-[var(--accent)] transition-colors"
        >
          Full methodology
        </Link>
        <Link
          href="/editorial-policy"
          className="inline-flex items-center gap-2 rounded border border-[var(--border)] bg-[var(--bg-surface)] px-5 py-2.5 text-sm font-medium text-[var(--text-secondary)] hover:border-[var(--border-accent)] hover:text-[var(--accent)] transition-colors"
        >
          Editorial policy
        </Link>
      </div>
    </ProseContainer>
  );
}
