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
  title: "About OffGridEmpire",
  description:
    "OffGridEmpire is the solar kit comparison engine. We break down kits, expose hidden costs, and show real build prices. No opinions. Just data.",
  alternates: { canonical: "/about" },
  openGraph: {
    title: "About | OffGridEmpire",
    description:
      "The solar kit comparison engine. Break down kits, expose hidden costs, show real build prices.",
    url: "/about",
  },
};

export default function AboutPage() {
  return (
    <ProseContainer>
      <BreadcrumbJsonLd
        items={[
          { name: "Home", url: "/" },
          { name: "About", url: "/about" },
        ]}
      />

      <Breadcrumb
        items={[{ href: "/", label: "Home" }, { label: "About" }]}
      />

      <PageTitle
        title="About OffGridEmpire"
        subtitle="The solar kit comparison engine. No opinions. Just data."
      />

      <ContentCard>
        <SectionHeading id="the-problem">The Problem</SectionHeading>
        <Paragraph>
          Solar kit pricing is broken. A kit advertised at $289 might not include a battery
          or inverter — components that could add another $750 to the actual cost. Retailers
          promote the sticker price. You discover the real cost after checkout.
        </Paragraph>
        <Paragraph>
          The information exists, scattered across product listings, spec sheets, and forum
          posts. But no tool normalizes it, calculates the true total, or lets you compare
          across brands and retailers in one place.
        </Paragraph>

        <SectionHeading id="what-we-do">What This Tool Does</SectionHeading>
        <div className="space-y-3 mb-4">
          {[
            {
              label: "Decomposes",
              desc: "Every kit is broken into 7 standard component roles — panels, controller, battery, inverter, wiring, mounting, monitoring.",
            },
            {
              label: "Checks completeness",
              desc: "Missing a battery? Missing an inverter? The tool flags every gap and estimates the cost to fill it.",
            },
            {
              label: "Calculates real build cost",
              desc: "Advertised price + required missing parts = what you'll actually spend to power something.",
            },
            {
              label: "Tracks prices",
              desc: "Prices are pulled from retailer APIs every 6-12 hours. Every number shows when it was last checked.",
            },
            {
              label: "Compares",
              desc: "Side-by-side comparison with normalized specs, color-coded differences, and auto-computed verdicts.",
            },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded bg-[var(--bg-primary)] border border-[var(--border)] px-4 py-3"
            >
              <span className="font-mono text-xs font-semibold text-[var(--accent)]">
                {item.label}
              </span>
              <p className="text-sm text-[var(--text-secondary)] mt-1">{item.desc}</p>
            </div>
          ))}
        </div>

        <SectionHeading id="what-we-dont">What This Tool Does NOT Do</SectionHeading>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
          {[
            "Subjective reviews or opinions",
            "\"Editor's pick\" or sponsored rankings",
            "System design or installation advice",
            "Product sales or order fulfillment",
          ].map((item) => (
            <div key={item} className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
              <span className="text-[var(--danger)] font-mono text-xs">&#10005;</span>
              {item}
            </div>
          ))}
        </div>
        <Paragraph>
          OffGridEmpire is a comparison engine. The data speaks. You decide.
        </Paragraph>

        <SectionHeading id="revenue">How We Make Money</SectionHeading>
        <Paragraph>
          Affiliate commissions. When you click a product link and buy from a retailer, we earn
          a small percentage. You pay the same price. The commission funds the tool — it does not
          influence the data. Full details in our{" "}
          <Link href="/affiliate-disclosure" className="text-[var(--accent)] hover:underline">
            affiliate disclosure
          </Link>
          .
        </Paragraph>

        <SectionHeading id="the-data">The Data</SectionHeading>
        <Paragraph>
          All pricing data comes from legitimate retailer APIs and affiliate data feeds — Amazon
          Product Advertising API, ShareASale, Impact, and direct manufacturer partnerships. We
          do not scrape websites. Prices are updated every 6-12 hours. Full details in our{" "}
          <Link href="/methodology" className="text-[var(--accent)] hover:underline">
            methodology
          </Link>
          .
        </Paragraph>
      </ContentCard>

      <div className="mt-8 text-center">
        <Link
          href="/kits"
          className="inline-flex items-center gap-2 rounded border border-[var(--accent)]/30 bg-[var(--accent)]/5 px-6 py-3 text-sm font-medium text-[var(--accent)] hover:bg-[var(--accent)]/10 transition-colors"
        >
          &larr; Browse kits with real build costs
        </Link>
      </div>
    </ProseContainer>
  );
}
