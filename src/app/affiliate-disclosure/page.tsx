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

export const metadata: Metadata = {
  title: "Affiliate Disclosure",
  description:
    "How OffGridEmpire earns revenue through affiliate partnerships. Full transparency on our relationships with Amazon, Renogy, EcoFlow, Bluetti, and other solar brands.",
  alternates: { canonical: "/affiliate-disclosure" },
  openGraph: {
    title: "Affiliate Disclosure | OffGridEmpire",
    description:
      "How OffGridEmpire earns revenue through affiliate partnerships.",
    url: "/affiliate-disclosure",
  },
};

const affiliatePartners = [
  {
    name: "Amazon Associates",
    network: "Direct",
    note: "Fallback for all products. Also provides live pricing via Product Advertising API.",
  },
  {
    name: "Renogy",
    network: "ShareASale",
    note: "Top DIY solar brand. Kits, panels, batteries, controllers.",
  },
  {
    name: "EcoFlow",
    network: "Impact / Awin",
    note: "Portable power stations, modular power kits.",
  },
  {
    name: "Bluetti",
    network: "ShareASale / Impact",
    note: "Premium portable power and whole-home backup systems.",
  },
  {
    name: "Jackery",
    network: "Impact",
    note: "Portable power stations and solar generators.",
  },
  {
    name: "Goal Zero",
    network: "Partnerize",
    note: "Premium portable solar and power stations.",
  },
  {
    name: "Signature Solar",
    network: "Direct",
    note: "EG4 products, server rack batteries, inverters.",
  },
];

export default function AffiliateDisclosurePage() {
  return (
    <ProseContainer>
      <BreadcrumbJsonLd
        items={[
          { name: "Home", url: "/" },
          { name: "Affiliate Disclosure", url: "/affiliate-disclosure" },
        ]}
      />

      <Breadcrumb
        items={[
          { href: "/", label: "Home" },
          { label: "Affiliate Disclosure" },
        ]}
      />

      <PageTitle
        title="Affiliate Disclosure"
        subtitle="Last updated March 23, 2026"
      />

      {/* Lead callout */}
      <div className="rounded border border-[var(--accent)]/30 bg-[var(--accent)]/5 p-5 mb-8">
        <p className="text-sm text-[var(--text-primary)] leading-relaxed">
          We earn affiliate commissions when you purchase through links on this site.
          You pay the same price. Our data doesn&apos;t change either way.
        </p>
      </div>

      <ContentCard>
        <SectionHeading id="how-we-earn">How We Make Money</SectionHeading>
        <Paragraph>
          OffGridEmpire participates in affiliate programs with solar equipment retailers
          and manufacturers. When you click a product link on this site and make a purchase,
          we receive a small commission from the retailer. The price you pay is identical
          whether you use our link or go directly to the retailer.
        </Paragraph>
        <Paragraph>
          Affiliate commissions are our primary revenue source. We do not charge for access
          to the comparison tool, and we do not accept payment from manufacturers to alter
          kit scores, completeness ratings, or real build cost calculations.
        </Paragraph>

        <SectionHeading id="partners">Our Affiliate Partners</SectionHeading>
        <Paragraph>
          We currently participate in the following affiliate programs. This list may change
          as we add or remove partnerships.
        </Paragraph>
        <div className="space-y-2 mb-4">
          {affiliatePartners.map((partner) => (
            <div
              key={partner.name}
              className="rounded bg-[var(--bg-primary)] border border-[var(--border)] px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4"
            >
              <span className="font-mono text-xs font-semibold text-[var(--text-primary)] min-w-[140px]">
                {partner.name}
              </span>
              <span className="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">
                {partner.network}
              </span>
              <span className="text-xs text-[var(--text-secondary)] sm:ml-auto">
                {partner.note}
              </span>
            </div>
          ))}
        </div>

        <SectionHeading id="what-this-means">What This Means for You</SectionHeading>
        <Paragraph>
          Same price. Every data point on this site — real build cost, completeness score,
          component decomposition, price history — is calculated using our{" "}
          <Link href="/methodology" className="text-[var(--accent)] hover:underline">
            published methodology
          </Link>
          . The affiliate relationship funds the tool. It does not influence the data.
        </Paragraph>

        <SectionHeading id="what-does-not-change">What Affiliate Relationships Do NOT Affect</SectionHeading>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
          {[
            "Real build cost calculations",
            "Completeness scores",
            "Kit decomposition data",
            "Missing component estimates",
            "Price history tracking",
            "Comparison results",
            "Use case ratings",
            "Sort order or rankings",
          ].map((item) => (
            <div key={item} className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
              <span className="text-[var(--success)] font-mono text-xs">&#10003;</span>
              {item}
            </div>
          ))}
        </div>

        <SectionHeading id="ftc">FTC Compliance</SectionHeading>
        <Paragraph>
          In accordance with the Federal Trade Commission&apos;s 16 CFR Part 255, &quot;Guides
          Concerning the Use of Endorsements and Testimonials in Advertising,&quot; this site
          discloses that it receives compensation for affiliate referrals. This disclosure
          applies to all pages on offgridempire.com that contain affiliate links.
        </Paragraph>
        <Paragraph>
          Product links on this site may be affiliate links. If you click a link and make a
          purchase, OffGridEmpire may receive a commission at no additional cost to you.
        </Paragraph>
      </ContentCard>

      <div className="mt-8 text-center">
        <Link
          href="/methodology"
          className="inline-flex items-center gap-2 rounded border border-[var(--accent)]/30 bg-[var(--accent)]/5 px-6 py-3 text-sm font-medium text-[var(--accent)] hover:bg-[var(--accent)]/10 transition-colors"
        >
          Read our methodology &rarr;
        </Link>
      </div>
    </ProseContainer>
  );
}
