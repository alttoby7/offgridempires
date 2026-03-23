import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { getKits } from "@/lib/get-kits";
import { BreadcrumbJsonLd } from "@/components/json-ld";
import { CalculatorFlow } from "@/components/calculator/calculator-flow";

export const metadata: Metadata = {
  title: "Solar Power Calculator — Size Your Off-Grid System",
  description:
    "Calculate exactly how much solar, battery storage, and inverter capacity you need. Enter your appliances, set your location, and get matched to real kits with pricing.",
  alternates: { canonical: "/calculator" },
  openGraph: {
    title: "Solar Power Calculator | OffGridEmpire",
    description:
      "Calculate exactly how much solar, battery, and inverter you need — then see which real kits match.",
    url: "/calculator",
  },
};

const howToJsonLd = {
  "@context": "https://schema.org",
  "@type": "HowTo",
  name: "How to Size Your Off-Grid Solar System",
  description:
    "Calculate exactly how much solar panel, battery storage, and inverter capacity you need for your off-grid setup.",
  step: [
    {
      "@type": "HowToStep",
      name: "List your appliances",
      text: "Add each device you plan to power — lights, fridge, laptop, CPAP, etc. — with wattage, quantity, and daily usage hours. Use our pre-loaded catalog or add custom appliances.",
    },
    {
      "@type": "HowToStep",
      name: "Set your location and system assumptions",
      text: "Enter your ZIP code for precise peak sun hours from NREL data, or select a sun region. Optionally adjust charge controller type (MPPT/PWM), battery chemistry (LiFePO4/AGM), and days of autonomy.",
    },
    {
      "@type": "HowToStep",
      name: "Review your power profile and kit matches",
      text: "See exactly how much solar, battery, and inverter capacity you need. We match your requirements against every tracked kit and honestly report coverage gaps.",
    },
  ],
};

export default function CalculatorPage() {
  const allKits = getKits();

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <BreadcrumbJsonLd
        items={[
          { name: "Home", url: "/" },
          { name: "Calculator", url: "/calculator" },
        ]}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(howToJsonLd) }}
      />

      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-[var(--text-muted)] mb-6">
        <Link href="/" className="hover:text-[var(--accent)] transition-colors">
          Home
        </Link>
        <span>/</span>
        <span className="text-[var(--text-secondary)]">Calculator</span>
      </nav>

      <Suspense
        fallback={
          <div className="h-96 animate-pulse rounded bg-[var(--bg-surface)]" />
        }
      >
        <CalculatorFlow allKits={allKits} />
      </Suspense>

      {/* Below-fold SEO content */}
      <section className="mt-16 pt-8 border-t border-[var(--border)]">
        <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-6">
          How to Size Your Off-Grid Solar System
        </h2>

        <div className="prose prose-invert max-w-3xl space-y-4 text-sm text-[var(--text-secondary)] leading-relaxed">
          <h3 className="text-lg font-semibold text-[var(--text-primary)] mt-6 mb-2">
            Step 1: Calculate Your Daily Energy Consumption
          </h3>
          <p>
            Start by listing every appliance you plan to run off-grid. For each device, multiply
            its <strong>wattage × quantity × hours per day × duty cycle</strong> to get daily
            watt-hours (Wh). A mini fridge rated at 60W that cycles its compressor 33% of the
            time uses about 475 Wh/day. A CPAP machine at 40W running 8 hours uses 320 Wh/day.
            Add up all your loads to get your total daily energy need.
          </p>

          <h3 className="text-lg font-semibold text-[var(--text-primary)] mt-6 mb-2">
            Step 2: Size Your Solar Panels
          </h3>
          <p>
            Divide your daily Wh by your location&apos;s <strong>peak sun hours</strong> and
            system efficiency (~85% for MPPT controllers with wiring losses). Phoenix gets
            6.5 peak sun hours; Seattle gets 3.5. A 2,000 Wh/day load in Phoenix needs about
            360W of panels. The same load in Seattle needs about 670W. Our calculator uses
            NREL data mapped to your ZIP code for precise estimates.
          </p>

          <h3 className="text-lg font-semibold text-[var(--text-primary)] mt-6 mb-2">
            Step 3: Size Your Battery Storage
          </h3>
          <p>
            Multiply your daily Wh by the number of <strong>days of autonomy</strong> you
            want (days without sun), then divide by your battery&apos;s usable depth of
            discharge. LiFePO4 batteries can safely use 90% of capacity; AGM batteries
            should stay above 50%. A 2,000 Wh/day system with 1 day of autonomy needs
            about 2,222 Wh of LiFePO4 storage or 4,000 Wh of AGM.
          </p>

          <h3 className="text-lg font-semibold text-[var(--text-primary)] mt-6 mb-2">
            Common Off-Grid Appliance Wattages
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  <th className="text-left py-2 text-[var(--text-muted)] font-medium">Appliance</th>
                  <th className="text-right py-2 text-[var(--text-muted)] font-medium">Watts</th>
                  <th className="text-right py-2 text-[var(--text-muted)] font-medium">Typical Hours</th>
                  <th className="text-right py-2 text-[var(--text-muted)] font-medium">~Daily Wh</th>
                </tr>
              </thead>
              <tbody className="text-[var(--text-secondary)]">
                {[
                  { name: "LED Light (×4)", w: 9, h: 5, wh: 180 },
                  { name: "Phone Charger", w: 10, h: 2, wh: 20 },
                  { name: "Laptop", w: 50, h: 4, wh: 200 },
                  { name: "Starlink", w: 75, h: 24, wh: 1800 },
                  { name: "Mini Fridge", w: 65, h: 24, wh: 546 },
                  { name: "CPAP Machine", w: 60, h: 8, wh: 480 },
                  { name: "Coffee Maker", w: 800, h: 0.25, wh: 200 },
                  { name: "Window AC", w: 500, h: 8, wh: 2000 },
                ].map((row) => (
                  <tr key={row.name} className="border-b border-[var(--border)]/50">
                    <td className="py-1.5">{row.name}</td>
                    <td className="text-right font-mono">{row.w}W</td>
                    <td className="text-right font-mono">{row.h}h</td>
                    <td className="text-right font-mono text-[var(--accent)]">{row.wh}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex flex-wrap gap-4 mt-8">
          <Link
            href="/kits"
            className="text-sm font-medium text-[var(--accent)] hover:underline"
          >
            Browse all tracked kits →
          </Link>
          <Link
            href="/methodology"
            className="text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:underline"
          >
            Our testing methodology →
          </Link>
        </div>
      </section>
    </div>
  );
}
