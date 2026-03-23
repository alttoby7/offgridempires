import type { Metadata } from "next";
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
  title: "Terms of Service",
  description:
    "OffGridEmpire terms of service. Use of this comparison tool and its data.",
  alternates: { canonical: "/terms" },
  openGraph: {
    title: "Terms of Service | OffGridEmpire",
    description: "Terms of service for using OffGridEmpire.",
    url: "/terms",
  },
};

export default function TermsPage() {
  return (
    <ProseContainer>
      <BreadcrumbJsonLd
        items={[
          { name: "Home", url: "/" },
          { name: "Terms of Service", url: "/terms" },
        ]}
      />

      <Breadcrumb
        items={[{ href: "/", label: "Home" }, { label: "Terms of Service" }]}
      />

      <PageTitle
        title="Terms of Service"
        subtitle="Effective March 23, 2026"
      />

      <ContentCard>
        <SectionHeading id="the-tool">The Tool</SectionHeading>
        <Paragraph>
          OffGridEmpire is a comparison tool. It is not a retailer. We do not sell products,
          process orders, or fulfill shipments. All purchases happen at third-party retailer
          websites. Your transaction is between you and the retailer.
        </Paragraph>

        <SectionHeading id="accuracy">Data Accuracy</SectionHeading>
        <Paragraph>
          Prices displayed on OffGridEmpire are pulled from retailer APIs and affiliate data
          feeds. They are approximate and may not reflect the exact price at the time of your
          purchase. Always verify the current price at the retailer before buying.
        </Paragraph>
        <Paragraph>
          Missing component cost estimates are based on market averages for compatible products.
          Your actual cost to complete a kit may be higher or lower depending on the specific
          components you choose.
        </Paragraph>
        <Paragraph>
          Completeness scores, real build cost calculations, and use case ratings are generated
          using our published{" "}
          <a href="/methodology" className="text-[var(--accent)] hover:underline">
            methodology
          </a>
          . While we aim for accuracy, these figures are estimates and should not be treated as
          guaranteed costs.
        </Paragraph>

        <SectionHeading id="affiliate-links">Affiliate Links</SectionHeading>
        <Paragraph>
          Product links on this site may be affiliate links. When you click an affiliate link
          and make a purchase, OffGridEmpire may earn a commission at no additional cost to you.
          See our{" "}
          <a href="/affiliate-disclosure" className="text-[var(--accent)] hover:underline">
            affiliate disclosure
          </a>{" "}
          for details. Clicking an affiliate link takes you to a third-party website with its
          own terms of service and privacy policy.
        </Paragraph>

        <SectionHeading id="price-alerts">Price Alerts</SectionHeading>
        <Paragraph>
          Price alert notifications are provided on a best-effort basis. We do not guarantee
          delivery, timeliness, or accuracy of alert emails. Price alerts are informational
          only and do not constitute financial advice, investment recommendations, or purchase
          guarantees.
        </Paragraph>

        <SectionHeading id="ip">Intellectual Property</SectionHeading>
        <Paragraph>
          The OffGridEmpire name, logo, site design, comparison tool, and original content
          are the property of OffGridEmpire. Kit names, brand names, product images, and
          trademarks belong to their respective owners and are used for identification and
          comparison purposes only.
        </Paragraph>

        <SectionHeading id="liability">Limitation of Liability</SectionHeading>
        <Paragraph>
          OffGridEmpire is provided &quot;as is&quot; without warranty of any kind, express or
          implied. We do not warrant the accuracy, completeness, or reliability of any data
          displayed on this site. In no event shall OffGridEmpire be liable for any direct,
          indirect, incidental, special, or consequential damages arising from your use of
          the site or reliance on its data.
        </Paragraph>
        <Paragraph>
          You are responsible for verifying all product specifications, prices, and compatibility
          before making a purchase. OffGridEmpire is not responsible for products purchased
          through affiliate links.
        </Paragraph>

        <SectionHeading id="changes">Changes to These Terms</SectionHeading>
        <Paragraph>
          We may update these terms at any time. The effective date at the top of this page
          reflects the most recent revision. Continued use of the site after changes constitutes
          acceptance of the updated terms.
        </Paragraph>

        <SectionHeading id="contact">Contact</SectionHeading>
        <Paragraph>
          Questions about these terms? Email{" "}
          <a href="mailto:info@offgridempire.com" className="text-[var(--accent)] hover:underline">
            info@offgridempire.com
          </a>
          .
        </Paragraph>
      </ContentCard>
    </ProseContainer>
  );
}
