import type { Metadata } from "next";
import Link from "next/link";
import { BreadcrumbJsonLd, FaqJsonLd } from "@/components/json-ld";

export const metadata: Metadata = {
  title: "How We Calculate Real Build Cost",
  description:
    "Our methodology for calculating true total cost of off-grid solar kits. Learn how we break down components, identify missing parts, and estimate real build costs.",
  alternates: { canonical: "/methodology" },
  openGraph: {
    title: "How We Calculate Real Build Cost | OffGridEmpire",
    description:
      "Our methodology for calculating true total cost of off-grid solar kits.",
    url: "/methodology",
  },
};

const faqs = [
  {
    question: "What is 'real build cost'?",
    answer:
      "Real build cost is the total you would actually spend to have a complete, functional off-grid solar system. It includes the kit's advertised price plus the estimated cost of any required components that aren't included in the kit.",
  },
  {
    question: "How do you determine which components are missing?",
    answer:
      "We decompose every kit into 7 standard component roles: solar panels, charge controller, battery bank, inverter, wiring, mounting hardware, and monitoring. If a kit doesn't include one of the required roles, we flag it as missing and estimate the cost to add it.",
  },
  {
    question: "Where do the missing component prices come from?",
    answer:
      "Missing component cost estimates are based on the average market price for a compatible component of that type. For example, if a kit is missing a 12V 100Ah LiFePO4 battery, we estimate based on current prices for popular batteries in that spec range from major retailers.",
  },
  {
    question: "How often are prices updated?",
    answer:
      "We pull prices from retailer APIs and affiliate data feeds every 6-12 hours. Every price on the site shows a 'last updated' timestamp so you can see exactly how fresh the data is. If a price is more than 24 hours old, we display a stale data warning.",
  },
  {
    question: "What does 'completeness' mean?",
    answer:
      "Completeness is the percentage of required component roles that are included in the kit. A 100% complete kit includes everything you need to set up a functional system. A 57% complete kit is missing several critical components and will require significant additional purchases.",
  },
  {
    question: "Do you account for taxes and shipping?",
    answer:
      "We include known shipping costs and freight surcharges when reported by the retailer. We do not estimate sales tax because it varies by state and jurisdiction. Real build cost is always shown before tax.",
  },
];

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="font-mono text-sm uppercase tracking-wider text-[var(--accent)] mt-10 mb-4">
      {children}
    </h2>
  );
}

function Paragraph({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-4">
      {children}
    </p>
  );
}

export default function MethodologyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-8">
      <BreadcrumbJsonLd
        items={[
          { name: "Home", url: "/" },
          { name: "Methodology", url: "/methodology" },
        ]}
      />
      <FaqJsonLd questions={faqs} />

      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-[var(--text-muted)] mb-6">
        <Link href="/" className="hover:text-[var(--accent)] transition-colors">
          Home
        </Link>
        <span>/</span>
        <span className="text-[var(--text-secondary)]">Methodology</span>
      </nav>

      <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
        How We Calculate Real Build Cost
      </h1>
      <p className="text-sm text-[var(--text-muted)] mb-8">
        Transparency is the point. Here&apos;s exactly how we arrive at every number on this site.
      </p>

      <div className="border border-[var(--border)] rounded bg-[var(--bg-surface)] p-6">
        <SectionHeading>The Problem</SectionHeading>
        <Paragraph>
          Solar kit prices are misleading. A kit advertised at $289 might not include a battery
          or inverter — components that could cost another $750. The advertised price tells you
          what the manufacturer is selling, not what you&apos;ll actually spend to power anything.
        </Paragraph>
        <Paragraph>
          We built OffGridEmpire to fix this. Every kit on this site is broken down into its
          component parts, checked for completeness, and priced for what it actually costs to
          build a working system.
        </Paragraph>

        <SectionHeading>Kit Decomposition</SectionHeading>
        <Paragraph>
          Every solar kit is decomposed into <strong className="text-[var(--text-primary)]">7 standard component roles</strong>:
        </Paragraph>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
          {[
            "Solar Panels",
            "Charge Controller",
            "Battery Bank",
            "Inverter",
            "Wiring & Cables",
            "Mounting Hardware",
            "Monitoring",
          ].map((role) => (
            <div
              key={role}
              className="rounded bg-[var(--bg-primary)] border border-[var(--border)] px-3 py-2 text-center"
            >
              <span className="font-mono text-[10px] text-[var(--text-secondary)]">
                {role}
              </span>
            </div>
          ))}
        </div>
        <Paragraph>
          For each role, we record whether it&apos;s included in the kit, partially covered,
          or completely missing. This produces the completeness score — a simple percentage
          of how many required roles are covered.
        </Paragraph>

        <SectionHeading>Real Build Cost Formula</SectionHeading>
        <div className="rounded bg-[var(--bg-primary)] border border-[var(--border)] p-4 mb-4 font-mono text-sm">
          <div className="flex items-center gap-2 text-[var(--text-secondary)]">
            <span className="text-[var(--text-primary)] font-semibold">Real Build Cost</span>
            <span>=</span>
          </div>
          <div className="mt-2 ml-4 space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[var(--accent)]">Advertised kit price</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[var(--danger)]">+ Required missing parts</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[var(--text-muted)]">+ Known shipping & freight</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[var(--success)]">− Coupons & discounts</span>
            </div>
          </div>
        </div>
        <Paragraph>
          Only <strong className="text-[var(--text-primary)]">required</strong> missing
          components count toward real build cost. Optional upgrades (like Bluetooth monitoring
          for a kit that already has an LCD display) are shown separately and do not inflate
          the total.
        </Paragraph>

        <SectionHeading>Missing Component Pricing</SectionHeading>
        <Paragraph>
          When a kit is missing a required component, we estimate the cost to add it based on:
        </Paragraph>
        <ol className="list-decimal list-inside text-sm text-[var(--text-secondary)] space-y-2 mb-4 ml-2">
          <li>
            <strong className="text-[var(--text-primary)]">Compatibility</strong> — the
            replacement must match the kit&apos;s voltage, chemistry, and capacity requirements
          </li>
          <li>
            <strong className="text-[var(--text-primary)]">Market pricing</strong> — we use
            current prices from major retailers for popular products in the required spec range
          </li>
          <li>
            <strong className="text-[var(--text-primary)]">Conservative estimates</strong> — we
            estimate mid-range, not the cheapest possible option, to avoid understating the real cost
          </li>
        </ol>

        <SectionHeading>Price Data Sources</SectionHeading>
        <Paragraph>
          All pricing data comes from legitimate sources:
        </Paragraph>
        <ul className="list-disc list-inside text-sm text-[var(--text-secondary)] space-y-2 mb-4 ml-2">
          <li>Amazon Product Advertising API (affiliate program)</li>
          <li>Manufacturer affiliate data feeds (ShareASale, Impact)</li>
          <li>Direct manufacturer partnerships</li>
        </ul>
        <Paragraph>
          We do not scrape retailer websites. All data is obtained through official API access
          or affiliate program data feeds.
        </Paragraph>

        <SectionHeading>Update Frequency</SectionHeading>
        <Paragraph>
          Prices are pulled every 6-12 hours depending on the source. Every price on the site
          displays a <strong className="text-[var(--text-primary)]">last updated</strong> timestamp.
          If a price hasn&apos;t been updated in more than 24 hours, the site shows a stale data
          warning. Always verify the current price at the retailer before purchasing.
        </Paragraph>

        <SectionHeading>Cost Per Watt-Hour</SectionHeading>
        <Paragraph>
          For kits that include battery storage, we calculate cost per usable watt-hour
          as the universal comparison metric:
        </Paragraph>
        <div className="rounded bg-[var(--bg-primary)] border border-[var(--border)] p-4 mb-4 font-mono text-sm text-[var(--text-secondary)]">
          <span className="text-[var(--text-primary)] font-semibold">$/Wh</span>
          {" = "}
          <span className="text-[var(--accent)]">Real Build Cost</span>
          {" ÷ "}
          <span className="text-[var(--accent)]">Usable Battery Wh</span>
        </div>
        <Paragraph>
          &quot;Usable&quot; accounts for depth of discharge. A 100Ah AGM battery at 50% DoD
          provides ~600Wh usable, while a 100Ah LiFePO4 at 100% DoD provides ~1,280Wh usable.
          We use manufacturer-recommended DoD for each chemistry.
        </Paragraph>

        <SectionHeading>Use Case Ratings</SectionHeading>
        <Paragraph>
          Each kit is rated for suitability across common off-grid use cases (RV, cabin, shed,
          emergency, homestead, marine). Ratings consider panel output, storage capacity,
          inverter size, portability, and expandability relative to typical power needs for
          each scenario.
        </Paragraph>

        <SectionHeading>Limitations & Disclaimers</SectionHeading>
        <div className="rounded bg-[var(--danger)]/5 border border-[var(--danger)]/20 p-4 mb-4">
          <ul className="list-disc list-inside text-sm text-[var(--text-secondary)] space-y-2">
            <li>
              Prices are approximate and may differ from what you see at the retailer.
              Always verify before purchasing.
            </li>
            <li>
              Missing component cost estimates are averages. Your actual cost may be higher
              or lower depending on the specific product you choose.
            </li>
            <li>
              Real build cost does not include sales tax, installation labor, or permits.
            </li>
            <li>
              Use case ratings are general guidance, not engineering specifications.
              Consult a qualified installer for system design.
            </li>
            <li>
              OffGridEmpire earns affiliate commissions on qualifying purchases.
              This does not affect our methodology or rankings.
            </li>
          </ul>
        </div>

        {/* FAQ section */}
        <SectionHeading>Frequently Asked Questions</SectionHeading>
        <div className="space-y-4">
          {faqs.map((faq) => (
            <div key={faq.question}>
              <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-1">
                {faq.question}
              </h3>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                {faq.answer}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA back to kits */}
      <div className="mt-8 text-center">
        <Link
          href="/kits"
          className="inline-flex items-center gap-2 rounded border border-[var(--accent)]/30 bg-[var(--accent)]/5 px-6 py-3 text-sm font-medium text-[var(--accent)] hover:bg-[var(--accent)]/10 transition-colors"
        >
          &larr; Browse kits with real build costs
        </Link>
      </div>
    </div>
  );
}
