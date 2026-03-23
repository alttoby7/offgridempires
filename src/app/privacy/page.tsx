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
  title: "Privacy Policy",
  description:
    "OffGridEmpire privacy policy. What data we collect and how we use it.",
  alternates: { canonical: "/privacy" },
  openGraph: {
    title: "Privacy Policy | OffGridEmpire",
    description: "What data we collect and how we use it.",
    url: "/privacy",
  },
};

export default function PrivacyPage() {
  return (
    <ProseContainer>
      <BreadcrumbJsonLd
        items={[
          { name: "Home", url: "/" },
          { name: "Privacy Policy", url: "/privacy" },
        ]}
      />

      <Breadcrumb
        items={[{ href: "/", label: "Home" }, { label: "Privacy Policy" }]}
      />

      <PageTitle
        title="Privacy Policy"
        subtitle="Effective March 23, 2026"
      />

      <ContentCard>
        <SectionHeading id="what-we-collect">What We Collect</SectionHeading>
        <Paragraph>
          OffGridEmpire collects minimal data. We use Google Analytics (GA4) to understand
          how visitors use the site — page views, referral sources, device types, and general
          geographic region. This data is anonymized and aggregated. We do not collect names,
          addresses, or payment information.
        </Paragraph>
        <Paragraph>
          If you sign up for price alerts, we store your email address and the kits or products
          you choose to watch. Nothing else.
        </Paragraph>

        <SectionHeading id="price-alerts">Price Alert Emails</SectionHeading>
        <Paragraph>
          When you subscribe to a price alert, we store your email address and alert preferences.
          We use this data solely to notify you when the price of a watched kit or product changes.
          Every alert email includes an unsubscribe link. When you unsubscribe, your email and
          alert preferences are deleted.
        </Paragraph>

        <SectionHeading id="cookies">Cookies & Tracking</SectionHeading>
        <Paragraph>
          We use cookies set by Google Analytics to distinguish unique visitors and sessions.
          These are first-party cookies. We do not set tracking cookies ourselves beyond what
          GA4 requires.
        </Paragraph>
        <Paragraph>
          When you click an affiliate link, the destination retailer (Amazon, Renogy, EcoFlow, etc.)
          may set their own cookies to track the referral. These third-party cookies are governed
          by the retailer&apos;s privacy policy, not ours.
        </Paragraph>

        <SectionHeading id="third-party">Third-Party Services</SectionHeading>
        <div className="space-y-2 mb-4">
          {[
            {
              service: "Google Analytics (GA4)",
              purpose: "Anonymous site usage analytics",
            },
            {
              service: "Amazon Associates",
              purpose: "Affiliate link tracking (sets cookies on click)",
            },
            {
              service: "ShareASale / Impact / Partnerize",
              purpose: "Affiliate network tracking (sets cookies on click)",
            },
            {
              service: "Cloudflare",
              purpose: "DNS, CDN, and DDoS protection",
            },
          ].map((item) => (
            <div
              key={item.service}
              className="rounded bg-[var(--bg-primary)] border border-[var(--border)] px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4"
            >
              <span className="font-mono text-xs font-semibold text-[var(--text-primary)] min-w-[200px]">
                {item.service}
              </span>
              <span className="text-xs text-[var(--text-secondary)]">
                {item.purpose}
              </span>
            </div>
          ))}
        </div>

        <SectionHeading id="affiliate-data">Affiliate Link Data</SectionHeading>
        <Paragraph>
          When you click an affiliate link, the retailer tracks the referral to attribute
          any resulting purchase to OffGridEmpire. We receive commission data from the affiliate
          network (product purchased, commission amount). We do not receive any personal data
          about you from the retailer or affiliate network.
        </Paragraph>

        <SectionHeading id="retention">Data Retention</SectionHeading>
        <Paragraph>
          Price alert email addresses are retained until you unsubscribe. Analytics data
          retention is governed by Google&apos;s standard GA4 retention policies (14 months
          by default). We do not maintain our own database of visitor information.
        </Paragraph>

        <SectionHeading id="your-rights">Your Rights</SectionHeading>
        <Paragraph>
          You can request deletion of any data we hold about you by emailing{" "}
          <a href="mailto:info@offgridempire.com" className="text-[var(--accent)] hover:underline">
            info@offgridempire.com
          </a>
          . If you have a price alert subscription, you can also unsubscribe directly from any
          alert email.
        </Paragraph>

        <SectionHeading id="changes">Changes to This Policy</SectionHeading>
        <Paragraph>
          We may update this privacy policy as our services change. The effective date at the
          top of this page reflects the most recent revision. Continued use of the site after
          changes constitutes acceptance of the updated policy.
        </Paragraph>

        <SectionHeading id="contact">Contact</SectionHeading>
        <Paragraph>
          Questions about this privacy policy? Email{" "}
          <a href="mailto:info@offgridempire.com" className="text-[var(--accent)] hover:underline">
            info@offgridempire.com
          </a>
          .
        </Paragraph>
      </ContentCard>
    </ProseContainer>
  );
}
