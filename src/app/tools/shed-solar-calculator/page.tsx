import type { Metadata } from "next";
import Link from "next/link";
import { BreadcrumbJsonLd } from "@/components/json-ld";
import { ShedCalculator } from "@/components/calculator/shed-calculator";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Shed Solar Calculator: Size Your Shed Off-Grid System",
  description:
    "Size a solar system for your shed in 60 seconds. Enter your loads — lights, tools, electronics — and get panel, battery, and inverter specs based on real DIY shed builds.",
  alternates: { canonical: "/tools/shed-solar-calculator" },
  openGraph: {
    title: "Shed Solar Calculator: Size Your Shed Off-Grid System",
    description:
      "Pick your shed type, select your loads, and get panel/battery/inverter specs instantly. Based on real DIY shed solar build data.",
    url: "/tools/shed-solar-calculator",
  },
};

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "How many solar panels does a shed need?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "A basic storage shed with 2 LED lights and a phone charger needs 30–60W. A workshop with power tools needs 400–800W. Use the calculator above to get an exact figure based on your actual loads.",
      },
    },
    {
      "@type": "Question",
      name: "What size battery do I need for a shed solar system?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Battery size depends on daily watt-hours and how many cloudy days you want coverage for. A she-shed with a laptop and lights typically needs 150–300Wh. A cabin with a mini fridge needs 600–1,000Wh. The calculator factors in 1.25 days of autonomy with LiFePO4 at 80% DoD.",
      },
    },
    {
      "@type": "Question",
      name: "Do I need an inverter for a shed solar system?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Only if you're running AC appliances (power tools, fans, laptop chargers). A simple lighting-only shed can run entirely on 12V DC with no inverter. Add an inverter once you have AC loads like a circular saw or laptop.",
      },
    },
  ],
};

export default function ShedSolarCalculatorPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
      <BreadcrumbJsonLd
        items={[
          { name: "Home", url: "/" },
          { name: "Tools", url: "/tools" },
          { name: "Shed Solar Calculator", url: "/tools/shed-solar-calculator" },
        ]}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-[var(--text-muted)] mb-6">
        <Link href="/" className="hover:text-[var(--accent)] transition-colors">
          Home
        </Link>
        <span>/</span>
        <Link href="/tools" className="hover:text-[var(--accent)] transition-colors">
          Tools
        </Link>
        <span>/</span>
        <span className="text-[var(--text-secondary)]">Shed Solar Calculator</span>
      </nav>

      {/* Hero */}
      <div className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-[var(--text-primary)] mb-3">
          Shed Solar Calculator
        </h1>
        <p className="text-[var(--text-secondary)] text-base max-w-2xl">
          Pick your shed type, select your loads, and get panel, battery, and inverter specs in
          seconds. Results update live — no submit button needed.
        </p>
      </div>

      {/* Calculator */}
      <ShedCalculator />

      {/* Below-fold SEO content */}
      <section className="mt-16 pt-8 border-t border-[var(--border)]">
        <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-6">
          How This Calculator Works
        </h2>

        <div className="space-y-6 text-sm text-[var(--text-secondary)] leading-relaxed max-w-2xl">
          <div>
            <h3 className="text-base font-semibold text-[var(--text-primary)] mb-2">
              Load estimation
            </h3>
            <p>
              Each appliance has a rated wattage and a daily usage slider. Daily watt-hours (Wh)
              = watts × hours. The calculator sums all enabled loads to get total daily Wh.
            </p>
          </div>

          <div>
            <h3 className="text-base font-semibold text-[var(--text-primary)] mb-2">
              Panel sizing formula
            </h3>
            <p>
              <span className="font-mono text-[var(--text-primary)]">
                Panel DC watts = (Daily Wh ÷ Peak Sun Hours) × 1.15
              </span>
              <br />
              The 1.15× factor covers MPPT efficiency losses (~6%) and miscellaneous wiring
              losses (~5%). Peak sun hours default to 4h (average U.S.) — adjust with the
              sun tier selector.
            </p>
          </div>

          <div>
            <h3 className="text-base font-semibold text-[var(--text-primary)] mb-2">
              Battery sizing formula
            </h3>
            <p>
              <span className="font-mono text-[var(--text-primary)]">
                Battery Wh = Daily Wh × 1.25 ÷ 0.80
              </span>
              <br />
              1.25 days of autonomy (one cloudy day buffer). LiFePO4 at 80% depth of discharge.
              Results are in usable Wh — divide by battery voltage to get Ah.
            </p>
          </div>

          <div>
            <h3 className="text-base font-semibold text-[var(--text-primary)] mb-2">
              Inverter sizing
            </h3>
            <p>
              Inverter minimum = sum of AC surge watts across all enabled loads. This is the
              peak draw the inverter must handle at startup. For tools with motors (saws,
              compressors), surge can be 2–3× rated watts.
            </p>
          </div>

          <div>
            <h3 className="text-base font-semibold text-[var(--text-primary)] mb-2">
              System tiers
            </h3>
            <p>
              <strong>Tier 1 Lighting</strong> (&lt;250W): LEDs, phone chargers, small
              electronics. 12V DC systems work well here.
              <br />
              <strong>Tier 2 Tools</strong> (250–600W): Drills, laptops, fans. 12V or 24V
              depending on inverter size.
              <br />
              <strong>Tier 3 Workshop</strong> (&gt;600W): Power saws, compressors, angle
              grinders. 24V systems strongly preferred above 400W panels.
            </p>
          </div>
        </div>

        <div className="mt-8 p-4 rounded bg-[var(--bg-surface)] border border-[var(--border)]">
          <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-2">
            Related resources
          </h3>
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
            <Link
              href="/learn/solar-for-sheds-and-small-structures"
              className="text-[var(--accent)] hover:underline"
            >
              Solar for Sheds: Full DIY Guide →
            </Link>
            <Link
              href="/best-for/shed"
              className="text-[var(--accent)] hover:underline"
            >
              Shed solar kits by tier →
            </Link>
            <Link
              href="/calculator"
              className="text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:underline"
            >
              Full system calculator →
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="mt-12">
        <h2 className="text-xl font-bold text-[var(--text-primary)] mb-6">FAQ</h2>
        <div className="space-y-6 max-w-2xl">
          {[
            {
              q: "How many solar panels does a shed need?",
              a: "A basic storage shed with 2 LED lights and a phone charger needs 30–60W. A workshop with power tools needs 400–800W. The calculator above sizes panels to your exact load.",
            },
            {
              q: "What size battery do I need for a shed solar system?",
              a: "A she-shed with laptop and lights typically needs 150–300Wh usable. A cabin with a mini fridge needs 600–1,000Wh. The calculator uses 1.25 days autonomy with LiFePO4 at 80% DoD — the standard for DIY shed builds.",
            },
            {
              q: "Do I need an inverter for a shed solar system?",
              a: "Only if you're running AC appliances — power tools, fans, laptop brick chargers. A lighting-only shed can run 12V DC with no inverter at all. Add one when you have AC loads.",
            },
            {
              q: "Should I use 12V or 24V for my shed?",
              a: "12V works for loads under ~1,500W. Above that, wire losses get expensive and 24V is more efficient. The calculator flags when your load suggests upgrading to 24V.",
            },
          ].map(({ q, a }) => (
            <div key={q}>
              <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-1">{q}</h3>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{a}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
