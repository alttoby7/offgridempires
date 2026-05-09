import type { Metadata } from "next";
import Link from "next/link";
import { BreadcrumbJsonLd } from "@/components/json-ld";
import { BatterySizingCalculator } from "@/components/calculator/battery-sizing-calculator";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Battery Sizing Calculator: How Many Ah Do You Need?",
  description:
    "Size your off-grid battery bank in 60 seconds. Pick your loads, set autonomy days, and get the required Wh and Ah for LiFePO4 or lead-acid at 12V, 24V, or 48V.",
  alternates: { canonical: "/tools/battery-sizing-calculator" },
  openGraph: {
    title: "Battery Sizing Calculator: How Many Ah Do You Need?",
    description:
      "Pick your loads, choose autonomy days, get the required battery bank in Wh and Ah.",
    url: "/tools/battery-sizing-calculator",
  },
};

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "How many amp-hours do I need for my off-grid system?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Calculate daily watt-hours, divide by inverter efficiency (typically 0.9), multiply by days of autonomy, divide by usable depth-of-discharge (80% for LiFePO4, 50% for lead-acid), then divide by system voltage. The calculator above runs this math automatically.",
      },
    },
    {
      "@type": "Question",
      name: "Why is LiFePO4 better than lead-acid for off-grid?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "LiFePO4 supports 80% depth-of-discharge vs 50% for lead-acid, so the same nameplate Ah delivers about 60% more usable energy. LiFePO4 also handles 3,000+ cycles vs ~500 for lead-acid, so the lifecycle cost ends up lower despite the higher upfront price.",
      },
    },
    {
      "@type": "Question",
      name: "Should I size for 1, 2, or 3 days of autonomy?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "1 day works for sunny climates and full-time RV use where you can move. 2 days is the standard recommendation for most cabin and homestead setups. 3+ days is needed in cloudy regions or for emergency-backup scenarios where you cannot rely on daily solar production.",
      },
    },
    {
      "@type": "Question",
      name: "What system voltage should I choose?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "12V is fine up to about 1,500W of inverter capacity — typical for vans, small RVs, and weekend cabins. 24V suits 1,500–3,000W systems. 48V is the right choice for whole-home systems with 3,000W+ inverters because higher voltage means lower current and thinner (cheaper) wiring.",
      },
    },
  ],
};

export default function BatterySizingCalculatorPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
      <BreadcrumbJsonLd
        items={[
          { name: "Home", url: "/" },
          { name: "Tools", url: "/tools" },
          { name: "Battery Sizing Calculator", url: "/tools/battery-sizing-calculator" },
        ]}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      <nav className="flex items-center gap-2 text-sm text-[var(--ink-muted)] mb-6">
        <Link href="/" className="hover:text-[var(--accent)]">Home</Link>
        <span>/</span>
        <Link href="/tools" className="hover:text-[var(--accent)]">Tools</Link>
        <span>/</span>
        <span className="text-[var(--ink-soft)]">Battery Sizing Calculator</span>
      </nav>

      <header className="mb-10">
        <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl text-[var(--ink)] tracking-tight leading-[1.05]">
          How many amp-hours does your off-grid system need?
        </h1>
        <p className="mt-4 max-w-3xl text-base text-[var(--ink-soft)] leading-relaxed">
          Pick your loads, choose how many cloudy days you want covered, and pick a chemistry.
          The calculator runs the math we use to size battery banks for the kits we audit. The
          assumptions are visible — open &ldquo;Show the math&rdquo; under the result.
        </p>
      </header>

      <BatterySizingCalculator />

      <section className="mt-12 pt-8 border-t border-[var(--rule)]">
        <h2 className="font-display text-2xl text-[var(--ink)] mb-4">How this works</h2>
        <div className="space-y-3 text-sm text-[var(--ink-soft)] leading-relaxed">
          <p>
            <strong>Daily Wh</strong> is the sum of every selected appliance multiplied by hours
            of use per day and quantity. AC appliances (anything plugged into a 120V outlet) get
            scaled up by inverter losses — we use 90% efficiency, which is typical of modern
            pure-sine-wave inverters.
          </p>
          <p>
            <strong>Usable depth-of-discharge (DoD)</strong> matters because batteries shouldn&rsquo;t
            be drawn to zero. LiFePO4 tolerates 80% DoD without significantly shortening lifespan;
            lead-acid is conservatively rated at 50% DoD. So the same nameplate Ah delivers very
            different real-world capacity.
          </p>
          <p>
            <strong>Autonomy days</strong> is the buffer for cloudy weather. The math is:
            (daily AC-adjusted Wh × autonomy days) ÷ usable DoD = required nameplate Wh. Then
            divide by system voltage to get Ah.
          </p>
          <p>
            <strong>This is a sizing tool, not a sales tool.</strong> Match the number against
            our tracked kits to find a real product that hits the spec.
          </p>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          <Link
            href="/categories/batteries/"
            className="rounded-sm border border-[var(--rule)] px-3 py-2 text-sm text-[var(--ink)] hover:border-[var(--accent)]"
          >
            Browse tracked battery kits →
          </Link>
          <Link
            href="/this-week/"
            className="rounded-sm border border-[var(--rule)] px-3 py-2 text-sm text-[var(--ink)] hover:border-[var(--accent)]"
          >
            This week&apos;s price drops →
          </Link>
        </div>
      </section>
    </div>
  );
}
