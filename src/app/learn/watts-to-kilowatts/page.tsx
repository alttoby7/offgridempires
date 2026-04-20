import type { Metadata } from "next";
import Link from "next/link";
import { getKits } from "@/lib/get-kits";
import { WattsToKilowattsTool } from "@/components/tools/watts-to-kilowatts-tool";
import { BreadcrumbJsonLd } from "@/components/json-ld";
import {
  Breadcrumb,
  PageTitle,
  ProseContainer,
  SectionHeading,
  Paragraph,
} from "@/components/ui/prose";

export const metadata: Metadata = {
  title: "Watts to Kilowatts Converter + Solar Load Calculator",
  description:
    "Convert between W, kW, Wh, kWh, and mAh instantly. Then calculate your daily solar load and get matched kit recommendations — no sign-up required.",
  alternates: { canonical: "/learn/watts-to-kilowatts" },
  openGraph: {
    title: "Watts to Kilowatts Converter + Solar Load Calculator",
    description:
      "Convert between W, kW, Wh, kWh, and mAh. Calculate your daily solar load and find matching kits.",
    url: "/learn/watts-to-kilowatts",
  },
};

export default function WattsToKilowattsPage() {
  const allKits = getKits();
  const filteredKits = allKits.filter(
    (k) =>
      k.panelWatts > 0 &&
      k.storageWh > 0 &&
      k.inverterWatts > 0 &&
      k.completeness >= 80
  );

  return (
    <ProseContainer>
      <BreadcrumbJsonLd
        items={[
          { name: "Home", url: "/" },
          { name: "Learn", url: "/learn" },
          { name: "Watts to Kilowatts", url: "/learn/watts-to-kilowatts" },
        ]}
      />

      <Breadcrumb
        items={[
          { href: "/", label: "Home" },
          { href: "/learn", label: "Learn" },
          { label: "Watts to Kilowatts" },
        ]}
      />

      <PageTitle
        title="Watts to Kilowatts Converter"
        subtitle="Convert between W, kW, Wh, kWh, and mAh. Then calculate your daily solar load and see matched kits."
      />

      {/* Interactive tool */}
      <WattsToKilowattsTool kits={filteredKits} />

      {/* Explainer content */}
      <article className="mt-12 space-y-0">
        <SectionHeading>What&apos;s the difference between W and kW?</SectionHeading>
        <Paragraph>
          Watts (W) and kilowatts (kW) both measure <strong className="text-[var(--text-primary)]">power</strong> — the rate at which energy is being used or produced at any instant. One kilowatt equals exactly 1,000 watts. A 100W solar panel running at full output is producing 0.1 kW.
        </Paragraph>
        <Paragraph>
          The kilowatt scale is more practical once you&apos;re sizing whole systems: a typical off-grid cabin might need 2–5 kW of solar capacity, while a single LED bulb runs at 0.01 kW (10W). Both numbers describe the same physical thing — just at different magnitudes.
        </Paragraph>

        <SectionHeading>Wh vs kWh — energy, not power</SectionHeading>
        <Paragraph>
          Watt-hours (Wh) and kilowatt-hours (kWh) measure <strong className="text-[var(--text-primary)]">energy</strong> — power accumulated over time. Your utility bill is in kWh. A 100Ah battery at 12V stores 1,200 Wh (1.2 kWh). Run a 100W load for 5 hours and you&apos;ve consumed 500 Wh (0.5 kWh).
        </Paragraph>
        <Paragraph>
          The formula is simple: Wh = W × hours. Convert to kilowatt-hours by dividing by 1,000. This is why the unit converter above asks for hours when you&apos;re converting between power (W/kW) and energy (Wh/kWh) — you need that time dimension.
        </Paragraph>

        <SectionHeading>What about mAh?</SectionHeading>
        <Paragraph>
          Milliamp-hours (mAh) appear on phone batteries, power banks, and small lithium cells. The catch: mAh tells you nothing without knowing the voltage. A 10,000 mAh power bank at 3.7V stores 37 Wh. That same 10,000 mAh at 12V would be 120 Wh — a completely different amount of energy. Always convert mAh to Wh using the actual cell voltage.
        </Paragraph>

        <SectionHeading>How the load calculator works</SectionHeading>
        <Paragraph>
          The Load Calculator tab adds up your daily energy consumption (watts × hours for each appliance), then sizes three components:
        </Paragraph>
        <ul className="space-y-2 mb-4 ml-4 text-sm text-[var(--text-secondary)]">
          <li>
            <strong className="text-[var(--text-primary)] font-mono">Solar panels</strong> — daily Wh × 1.25 safety factor ÷ (peak sun hours × 0.80 system efficiency). The 1.25 factor accounts for real-world panel degradation and wiring losses.
          </li>
          <li>
            <strong className="text-[var(--text-primary)] font-mono">Battery storage</strong> — daily Wh × autonomy days ÷ depth of discharge. LiFePO₄ batteries can safely use 90% of rated capacity; AGM is limited to 50% to protect cycle life.
          </li>
          <li>
            <strong className="text-[var(--text-primary)] font-mono">Inverter</strong> — peak appliance wattage × 2 to handle motor surge loads at startup. This is a conservative estimate; check your specific appliances for surge ratings.
          </li>
        </ul>

        <SectionHeading>Common conversions at a glance</SectionHeading>
        <div className="overflow-x-auto rounded border border-[var(--border)] mb-4">
          <table className="w-full text-xs font-mono">
            <thead>
              <tr className="bg-[var(--bg-elevated)] border-b border-[var(--border)]">
                <th className="px-4 py-2.5 text-left text-[var(--text-muted)] uppercase tracking-wide">From</th>
                <th className="px-4 py-2.5 text-left text-[var(--text-muted)] uppercase tracking-wide">To</th>
                <th className="px-4 py-2.5 text-left text-[var(--text-muted)] uppercase tracking-wide">Formula</th>
                <th className="px-4 py-2.5 text-left text-[var(--text-muted)] uppercase tracking-wide">Example</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {[
                { from: "W", to: "kW", formula: "÷ 1,000", example: "500W → 0.5 kW" },
                { from: "kW", to: "W", formula: "× 1,000", example: "2 kW → 2,000W" },
                { from: "Wh", to: "kWh", formula: "÷ 1,000", example: "1,500 Wh → 1.5 kWh" },
                { from: "W", to: "Wh", formula: "× hours", example: "100W × 5h → 500 Wh" },
                { from: "Wh", to: "mAh", formula: "× 1,000 ÷ V", example: "120 Wh at 12V → 10,000 mAh" },
                { from: "mAh", to: "Wh", formula: "× V ÷ 1,000", example: "10,000 mAh at 12V → 120 Wh" },
              ].map((row) => (
                <tr key={`${row.from}-${row.to}`}>
                  <td className="px-4 py-2 text-[var(--accent)]">{row.from}</td>
                  <td className="px-4 py-2 text-[var(--accent)]">{row.to}</td>
                  <td className="px-4 py-2 text-[var(--text-primary)]">{row.formula}</td>
                  <td className="px-4 py-2 text-[var(--text-muted)]">{row.example}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <SectionHeading>Related tools</SectionHeading>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            {
              href: "/calculator",
              label: "Solar Sizing Calculator",
              desc: "Full system sizing with kit matching across all appliance types",
            },
            {
              href: "/learn/watts-amps-volts",
              label: "Watts / Amps / Volts Calculator",
              desc: "Calculate the missing variable and get wire gauge recommendations",
            },
          ].map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded border border-[var(--border)] bg-[var(--bg-surface)] px-4 py-3 hover:border-[var(--accent)]/30 transition-colors block"
            >
              <div className="text-sm font-medium text-[var(--text-primary)]">
                {link.label}
              </div>
              <div className="text-xs text-[var(--text-muted)] mt-1">{link.desc}</div>
            </Link>
          ))}
        </div>
      </article>
    </ProseContainer>
  );
}
