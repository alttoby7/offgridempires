import type { Metadata } from "next";
import Link from "next/link";
import { BreadcrumbJsonLd, DatasetJsonLd } from "@/components/json-ld";
import { robotsFor } from "@/lib/index-manifest";
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
import { getPricingReportStats } from "@/lib/data/pricing-report";

export const dynamic = "force-static";

const SITE_URL = "https://offgridempire.com";
const SLUG = "state-of-off-grid-solar-pricing-2026";
const TITLE =
  "The State of Off-Grid Solar Kit Pricing 2026";

export const metadata: Metadata = {
  title: `${TITLE}: What 355 Kits Reveal`,
  description:
    "An original-data report on off-grid solar kit pricing: hidden build costs, a 3.2× spread for the same stored energy, the sub-2,000W surge trap, and how far prices swing over six months. Computed from 355 live kits.",
  alternates: { canonical: `/reports/${SLUG}` },
  // INDEX GOVERNOR — defers to INDEXABLE_PATHS. Indexable as of 2026-06-22.
  ...robotsFor(`/reports/${SLUG}`),
  openGraph: {
    title: `${TITLE}: What 355 Kits Reveal`,
    description:
      "Hidden build costs, a 3.2× price spread for the same energy, the surge trap, and 6-month price volatility — computed from 355 live off-grid solar kits.",
    url: `/reports/${SLUG}`,
    type: "article",
  },
};

function Stat({
  value,
  label,
}: {
  value: string;
  label: string;
}) {
  return (
    <div className="rounded bg-[var(--bg-primary)] border border-[var(--border)] p-4 text-center">
      <div className="text-2xl font-bold text-[var(--accent)]">{value}</div>
      <div className="mt-1 text-xs text-[var(--text-secondary)] leading-snug">
        {label}
      </div>
    </div>
  );
}

export default function PricingReport2026() {
  const s = getPricingReportStats();
  const kitCount = getKits().length;

  const articleLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        headline: `${TITLE}: What 355 Kits Reveal`,
        description: metadata.description,
        datePublished: "2026-06-22",
        dateModified: s.updated,
        author: { "@type": "Organization", name: "OffGridEmpire", url: SITE_URL },
        publisher: { "@type": "Organization", name: "OffGridEmpire", url: SITE_URL },
        mainEntityOfPage: `${SITE_URL}/reports/${SLUG}`,
        isAccessibleForFree: true,
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
          { "@type": "ListItem", position: 2, name: "Reports", item: `${SITE_URL}/reports` },
          {
            "@type": "ListItem",
            position: 3,
            name: TITLE,
            item: `${SITE_URL}/reports/${SLUG}`,
          },
        ],
      },
    ],
  };

  return (
    <ProseContainer>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }}
      />
      <BreadcrumbJsonLd
        items={[
          { name: "Home", url: "/" },
          { name: "Reports", url: "/reports" },
          { name: TITLE, url: `/reports/${SLUG}` },
        ]}
      />
      <DatasetJsonLd
        kitCount={kitCount}
        pricedCount={s.pricedKits}
        updated={s.updated}
      />

      <Breadcrumb
        items={[
          { href: "/", label: "Home" },
          { href: "/reports", label: "Reports" },
          { label: "Solar Kit Pricing 2026" },
        ]}
      />

      <PageTitle
        title={TITLE}
        subtitle={`What ${s.pricedKits} actively priced off-grid solar kits, from ${s.brands} brands, reveal about what these systems really cost — and why the sticker price is the wrong number to shop on.`}
      />

      <DataFooter kitCount={s.pricedKits} updated={s.updated} />

      <ContentCard>
        <Paragraph>
          OffGridEmpire tracks every kit below as a set of components, not a
          single sticker price. We break each one into the parts it ships with,
          flag the parts it leaves out, and re-price the whole system every 6 to
          12 hours from live retailer feeds. That gives us a view of the market
          most buyers never see. Four findings stand out.
        </Paragraph>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-6">
          <Stat
            value={`${s.kitsHidingPartsPct}%`}
            label={`of kits hide required parts (avg $${s.avgHiddenCost} not in the price)`}
          />
          <Stat
            value={`${s.cpwDispersion}×`}
            label="price spread for the same stored energy"
          />
          <Stat
            value={`${s.subSurgePct}%`}
            label="of kits with an inverter can't start a fridge"
          />
          <Stat
            value={`${s.movedTenPctShare}%`}
            label="of kits moved 10%+ in price over 6 months"
          />
        </div>

        <SectionHeading id="hidden-cost">
          1. The sticker price hides real money
        </SectionHeading>
        <Paragraph>
          A solar kit&apos;s advertised price is not what you spend to power
          anything. Of the {s.pricedKits} priced kits we track,{" "}
          <strong className="text-[var(--text-primary)]">
            {s.kitsHidingParts} ({s.kitsHidingPartsPct}%)
          </strong>{" "}
          ship missing at least one required component — most often a battery,
          an inverter, or a charge controller. Among those kits, the missing
          parts add an average of{" "}
          <strong className="text-[var(--text-primary)]">
            ${s.avgHiddenCost.toLocaleString()}
          </strong>{" "}
          to the real build cost. The widest single gap in the dataset is{" "}
          <strong className="text-[var(--text-primary)]">
            ${s.maxHiddenCost.toLocaleString()}
          </strong>{" "}
          of parts not in the advertised price.
        </Paragraph>
        <Paragraph>
          Six percent sounds small, but it is concentrated in exactly the
          listings that look cheapest per watt — component bundles that quote a
          panel-and-controller price and stay silent on the battery. See{" "}
          <Link href="/how-real-build-cost-is-calculated">
            how real build cost is calculated
          </Link>{" "}
          for the full breakdown.
        </Paragraph>

        <SectionHeading id="price-spread">
          2. Buyers pay up to 3× more for the same stored energy
        </SectionHeading>
        <Paragraph>
          Cost per usable watt-hour is the one number that lets you compare a
          tiny power station to a whole-home battery wall on equal terms. Across
          the{" "}
          <strong className="text-[var(--text-primary)]">{s.batteryKits}</strong>{" "}
          battery-equipped kits with enough storage to compare honestly, the
          tenth-percentile kit costs{" "}
          <strong className="text-[var(--text-primary)]">${s.cpwP10.toFixed(2)}</strong>{" "}
          per watt-hour and the ninetieth-percentile kit costs{" "}
          <strong className="text-[var(--text-primary)]">${s.cpwP90.toFixed(2)}</strong>{" "}
          — a{" "}
          <strong className="text-[var(--text-primary)]">
            {s.cpwDispersion}×
          </strong>{" "}
          spread for energy that does the identical job. The median sits at
          ${s.cpwP50.toFixed(2)} per watt-hour. Shopping on cost-per-Wh instead
          of sticker price is the single biggest lever a buyer has.
        </Paragraph>

        <SectionHeading id="surge-trap">
          3. One in five kits with an inverter can&apos;t start a fridge
        </SectionHeading>
        <Paragraph>
          A refrigerator compressor&apos;s startup surge — its locked-rotor
          draw — is three to five times its running watts, a brief spike that
          trips an undersized inverter. Of the{" "}
          <strong className="text-[var(--text-primary)]">{s.inverterKits}</strong>{" "}
          kits we track that include an inverter,{" "}
          <strong className="text-[var(--text-primary)]">
            {s.subSurgeKits} ({s.subSurgePct}%)
          </strong>{" "}
          fall below the 2,000W pure-sine floor that reliably clears a common
          fridge surge. Many of them are marketed for exactly that job. We work
          the math out in full in{" "}
          <Link href="/guides/will-a-solar-generator-run-a-refrigerator">
            will a solar generator run a refrigerator
          </Link>
          .
        </Paragraph>

        <SectionHeading id="volatility">
          4. Solar kit prices are not stable — wait for the right week
        </SectionHeading>
        <Paragraph>
          We hold a six-month price history on every kit. Among the{" "}
          <strong className="text-[var(--text-primary)]">{s.trackedKits}</strong>{" "}
          with enough observations to judge, the typical kit&apos;s price swung{" "}
          <strong className="text-[var(--text-primary)]">{s.medianSwingPct}%</strong>{" "}
          between its six-month low and high. More than half —{" "}
          <strong className="text-[var(--text-primary)]">
            {s.movedTenPctKits} kits ({s.movedTenPctShare}%)
          </strong>{" "}
          — moved at least 10%, and the most volatile tenth swung{" "}
          {s.p90SwingPct}% or more. Buying the week a kit sits at its low,
          rather than the week it spikes, can be worth hundreds of dollars on a
          single system.
        </Paragraph>

        <SectionHeading id="methodology">How we computed this</SectionHeading>
        <Paragraph>
          Every figure above is computed at publish time from the{" "}
          {s.pricedKits} actively priced kits in our database, refreshed from
          live retailer and affiliate feeds. Two honesty notes. First, the
          cost-per-watt-hour spread uses a tenth-to-ninetieth-percentile band on
          kits with at least 500Wh of storage; a raw minimum-to-maximum ratio is
          dominated by data outliers and trickle-chargers, so we do not report
          it. Second, we deliberately do not headline our 7-role
          &quot;completeness&quot; score in this report, because it understates
          integrated power stations that legitimately do not need separate
          mounting or wiring. Full method:{" "}
          <Link href="/methodology">our methodology</Link> and{" "}
          <Link href="/data-sources">data sources</Link>.
        </Paragraph>

        <SectionHeading id="data">Get the data</SectionHeading>
        <Paragraph>
          The full dataset behind this report is free to download and reuse
          under CC BY 4.0:
        </Paragraph>
        <ul className="list-disc list-inside text-sm text-[var(--text-secondary)] space-y-1 mb-4">
          <li>
            <a href="/data/offgridempire-solar-kit-dataset.csv">
              Solar kit dataset (CSV)
            </a>
          </li>
          <li>
            <a href="/data/offgridempire-solar-kit-dataset.json">
              Solar kit dataset (JSON)
            </a>
          </li>
        </ul>

        <SectionHeading id="cite">Cite this report</SectionHeading>
        <div className="rounded bg-[var(--bg-primary)] border border-[var(--border)] p-4 text-sm text-[var(--text-secondary)]">
          OffGridEmpire. &quot;{TITLE}.&quot; {s.updated}.{" "}
          {SITE_URL}/reports/{SLUG}
        </div>
      </ContentCard>

      <div className="mt-8 text-center">
        <Link
          href="/kits"
          className="inline-flex items-center gap-2 rounded border border-[var(--accent)]/30 bg-[var(--accent)]/5 px-6 py-3 text-sm font-medium text-[var(--accent)] hover:bg-[var(--accent)]/10 transition-colors"
        >
          Browse all {s.pricedKits} kits with real build costs &rarr;
        </Link>
      </div>
    </ProseContainer>
  );
}
