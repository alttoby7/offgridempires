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
  title: "How Real Build Cost Is Calculated: Formula + Worked Examples",
  description:
    "The exact formula OffGridEmpire uses to calculate real build cost for 419 solar kits: advertised price + required missing parts, with three worked examples.",
  alternates: { canonical: "/how-real-build-cost-is-calculated" },
  openGraph: {
    title: "How Real Build Cost Is Calculated",
    description:
      "Formula, component rules, and worked examples for the real build cost metric.",
    url: "/how-real-build-cost-is-calculated",
  },
};

const examples = [
  {
    title: "Example 1 — Panel-only 'starter kit'",
    listed: 289,
    gaps: [
      { item: "100Ah LiFePO4 battery (12V)", est: 299 },
      { item: "1,000W pure sine inverter (12V)", est: 179 },
      { item: "Battery cables + fuse block", est: 45 },
    ],
    summary:
      "A $289 'starter kit' without storage or inversion cannot power a single AC appliance on its own.",
  },
  {
    title: "Example 2 — Kit with panel + controller, no battery",
    listed: 549,
    gaps: [
      { item: "200Ah LiFePO4 battery (12V)", est: 549 },
      { item: "2,000W pure sine inverter", est: 239 },
    ],
    summary:
      "Missing battery + inverter nearly doubles the sticker price before the system produces a single watt of AC power.",
  },
  {
    title: "Example 3 — 'Complete' kit with included battery and inverter",
    listed: 1899,
    gaps: [{ item: "No required components missing", est: 0 }],
    summary:
      "A fully complete kit matches advertised price — the metric rewards transparent bundling.",
  },
];

export default function HowRealBuildCostPage() {
  const kitCount = getKits().length;
  const updated = getKitsUpdated();

  return (
    <ProseContainer>
      <BreadcrumbJsonLd
        items={[
          { name: "Home", url: "/" },
          {
            name: "How Real Build Cost Is Calculated",
            url: "/how-real-build-cost-is-calculated",
          },
        ]}
      />

      <Breadcrumb
        items={[
          { href: "/", label: "Home" },
          { label: "How Real Build Cost Is Calculated" },
        ]}
      />

      <PageTitle title="How Real Build Cost Is Calculated" />

      <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-4 max-w-prose">
        Real build cost is the advertised price of a solar kit plus any required
        parts the kit leaves out. It answers one question: how much will you
        actually spend to turn this box into a working off-grid system? Below
        is the exact formula, the included-component rules, and three worked
        examples drawn from kits in the dataset.
      </p>

      <DataFooter kitCount={kitCount} updated={updated} />

      <ContentCard>
        <SectionHeading id="formula">The Formula</SectionHeading>
        <div className="rounded bg-[var(--bg-primary)] border border-[var(--border)] p-4 mb-4 font-mono text-sm">
          <div className="text-[var(--text-primary)] font-semibold">
            Real Build Cost =
          </div>
          <div className="mt-2 ml-4 space-y-1">
            <div className="text-[var(--accent)]">Advertised kit price</div>
            <div className="text-[var(--danger)]">+ Required missing parts (estimated)</div>
            <div className="text-[var(--text-muted)]">+ Known shipping &amp; freight</div>
            <div className="text-[var(--success)]">&minus; Retailer-advertised discounts</div>
          </div>
        </div>
        <Paragraph>
          Only <strong className="text-[var(--text-primary)]">required</strong>{" "}
          components count toward real build cost. Optional upgrades — Bluetooth
          monitoring, wall-mount brackets, third-party adapters — are surfaced
          separately and do not inflate the total.
        </Paragraph>

        <SectionHeading id="included-roles">Included-Component Rules</SectionHeading>
        <Paragraph>
          Every kit is scored against seven component roles. A role is marked
          &quot;included&quot; only if the kit ships a working instance of that
          role — not a coupon, not a compatibility claim, not a cross-sell.
        </Paragraph>
        <ul className="list-disc list-inside text-sm text-[var(--text-secondary)] space-y-1 mb-4 ml-2">
          <li><strong className="text-[var(--text-primary)]">Solar panels</strong> — rigid or folding, with the wattage the kit advertises.</li>
          <li><strong className="text-[var(--text-primary)]">Charge controller</strong> — MPPT or PWM, sized to the panel array.</li>
          <li><strong className="text-[var(--text-primary)]">Battery bank</strong> — usable Wh at the listed chemistry and voltage.</li>
          <li><strong className="text-[var(--text-primary)]">Inverter</strong> — pure sine for AC appliances, modified sine only when the kit specifies.</li>
          <li><strong className="text-[var(--text-primary)]">Wiring &amp; cables</strong> — battery cables, PV cables, fuses, breakers.</li>
          <li><strong className="text-[var(--text-primary)]">Mounting hardware</strong> — Z-brackets, tilt mounts, rooftop rails, or ground stands.</li>
          <li><strong className="text-[var(--text-primary)]">Monitoring</strong> — LCD display, shunt, Bluetooth gauge, or integrated app.</li>
        </ul>

        <SectionHeading id="estimation">Missing-Part Estimation</SectionHeading>
        <Paragraph>
          Estimates are anchored to the mid-market price of a compatible
          component — matching voltage, chemistry, and capacity — from major
          retailers. We deliberately avoid the cheapest listing on each
          marketplace; cheap components that underperform would understate real
          cost and mislead buyers.
        </Paragraph>

        <SectionHeading id="worked-examples">Three Worked Examples</SectionHeading>
        <div className="space-y-4">
          {examples.map((ex) => {
            const missingTotal = ex.gaps.reduce((a, g) => a + g.est, 0);
            const total = ex.listed + missingTotal;
            return (
              <div
                key={ex.title}
                className="rounded border border-[var(--border)] bg-[var(--bg-primary)] p-4"
              >
                <div className="text-sm font-semibold text-[var(--text-primary)] mb-2">
                  {ex.title}
                </div>
                <div className="font-mono text-xs text-[var(--text-secondary)] space-y-1">
                  <div className="flex justify-between">
                    <span>Advertised price</span>
                    <span className="text-[var(--text-primary)]">
                      ${ex.listed.toLocaleString()}
                    </span>
                  </div>
                  {ex.gaps.map((g) => (
                    <div key={g.item} className="flex justify-between">
                      <span className="text-[var(--text-muted)]">+ {g.item}</span>
                      <span className="text-[var(--danger)]">
                        +${g.est.toLocaleString()}
                      </span>
                    </div>
                  ))}
                  <div className="border-t border-[var(--border)] mt-1 pt-1 flex justify-between">
                    <span className="text-[var(--text-primary)] font-semibold">
                      Real build cost
                    </span>
                    <span className="text-[var(--accent)] font-bold">
                      ${total.toLocaleString()}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed mt-3">
                  {ex.summary}
                </p>
              </div>
            );
          })}
        </div>

        <SectionHeading id="what-this-is-not">What Real Build Cost Is Not</SectionHeading>
        <ul className="list-disc list-inside text-sm text-[var(--text-secondary)] space-y-1 mb-4 ml-2">
          <li>Not a quote — your specific hardware choices will vary.</li>
          <li>Not a total installed cost — excludes permits, labor, and sales tax.</li>
          <li>Not a bias against minimal kits — a panel-only kit is fine if you already own the rest.</li>
        </ul>

        <Paragraph>
          The point of real build cost is comparability. Every kit on this site
          is scored by the same formula, against the same seven roles, using
          the same component price reference. Two kits advertised at $500 can
          have a $900 difference in what it takes to power anything with them.
          The metric surfaces that difference.
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
          href="/data-sources"
          className="inline-flex items-center gap-2 rounded border border-[var(--border)] bg-[var(--bg-surface)] px-5 py-2.5 text-sm font-medium text-[var(--text-secondary)] hover:border-[var(--border-accent)] hover:text-[var(--accent)] transition-colors"
        >
          Data sources
        </Link>
        <Link
          href="/kits"
          className="inline-flex items-center gap-2 rounded bg-[var(--accent)] px-5 py-2.5 text-sm font-bold text-[var(--bg-primary)] hover:bg-[var(--accent-hover)] transition-colors"
        >
          Browse all kits &rarr;
        </Link>
      </div>
    </ProseContainer>
  );
}
