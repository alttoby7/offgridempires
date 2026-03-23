import type { Metadata } from "next";
import { Hero } from "@/components/hero";
import { KitCard } from "@/components/kit-card";
import { WebSiteJsonLd, BreadcrumbJsonLd } from "@/components/json-ld";
import { getKits } from "@/lib/get-kits";
import Link from "next/link";

export const metadata: Metadata = {
  title: "OffGridEmpire — Compare Every Off-Grid Solar Kit",
  description:
    "Stop comparing sticker prices. Compare true total costs. The solar kit comparison engine with real build costs, component breakdowns, and price tracking.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "OffGridEmpire — Compare Every Off-Grid Solar Kit",
    description:
      "Stop comparing sticker prices. Compare true total costs. The solar kit comparison engine with real build costs and component breakdowns.",
    url: "/",
  },
};

const useCases = [
  {
    id: "rv",
    label: "RV & Van Life",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="3" width="15" height="13" rx="2" /><path d="M16 8h4l3 5v3h-7V8z" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" />
      </svg>
    ),
    href: "/kits",
  },
  {
    id: "cabin",
    label: "Weekend Cabin",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
    href: "/kits",
  },
  {
    id: "homestead",
    label: "Homestead",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" />
      </svg>
    ),
    href: "/kits",
  },
  {
    id: "emergency",
    label: "Emergency",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
      </svg>
    ),
    href: "/kits",
  },
  {
    id: "shed",
    label: "Shed & Workshop",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z" />
      </svg>
    ),
    href: "/kits",
  },
  {
    id: "boat",
    label: "Boat & Marine",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 20c2-1 4-2 6-2s4 1 6 2 4 2 6 2" /><path d="M4 18l-1-5h18l-1 5" /><path d="M12 2v11" /><path d="M8 7l4-5 4 5" />
      </svg>
    ),
    href: "/kits",
  },
];

const featuredKits = getKits().slice(0, 4);

const steps = [
  {
    step: "01",
    title: "Browse & Filter",
    description:
      "Browse kits by budget, battery chemistry, wattage, and brand. Sort and filter to exactly what you need.",
  },
  {
    step: "02",
    title: "See What's Inside",
    description:
      "Every kit broken into normalized components. See what's included, what's missing, and the true total cost.",
  },
  {
    step: "03",
    title: "Compare & Buy",
    description:
      "Side-by-side comparison with cost per Wh, price history, and direct links to the best current price.",
  },
];

export default function HomePage() {
  return (
    <>
      <WebSiteJsonLd />
      <BreadcrumbJsonLd items={[{ name: "Home", url: "/" }]} />
      <Hero />

      {/* Decision Frames — quick paths */}
      <section className="border-b border-[var(--border)]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
          <h2 className="text-sm font-medium uppercase tracking-wide text-[var(--text-muted)] mb-4">
            Jump to What Matters
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { href: "/kits?sort=cost_per_wh", label: "Best True Value", desc: "Lowest real cost per usable Wh", icon: "◈" },
              { href: "/kits?complete=1", label: "Most Complete", desc: "Nothing missing — plug and play", icon: "◉" },
              { href: "/kits?sort=true_cost_asc", label: "Cheapest to Build", desc: "Lowest real build cost first", icon: "◆" },
              { href: "/kits?sort=completeness", label: "Most Complete First", desc: "Sorted by completeness score", icon: "▼" },
            ].map((frame) => (
              <Link
                key={frame.href}
                href={frame.href}
                className="group flex items-start gap-3 rounded border border-[var(--border)] bg-[var(--bg-surface)] p-4 hover:border-[var(--border-accent)] hover:bg-[var(--bg-elevated)] transition-all"
              >
                <span className="text-xl text-[var(--accent)] mt-0.5">{frame.icon}</span>
                <div>
                  <p className="text-sm font-semibold text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors">
                    {frame.label}
                  </p>
                  <p className="text-xs text-[var(--text-muted)] mt-0.5">{frame.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Use Case Tiles */}
      <section className="border-b border-[var(--border)]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-sm font-medium uppercase tracking-wide text-[var(--text-muted)]">
              Browse by Use Case
            </h2>
            <Link
              href="/kits"
              className="text-xs text-[var(--accent)] hover:text-[var(--accent-hover)] transition-colors"
            >
              View all kits &rarr;
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {useCases.map((uc) => (
              <Link
                key={uc.id}
                href={uc.href}
                className="group flex flex-col items-center gap-2.5 rounded border border-[var(--border)] bg-[var(--bg-surface)] p-4 hover:border-[var(--border-accent)] hover:bg-[var(--bg-elevated)] transition-all duration-200"
              >
                <div className="text-[var(--text-muted)] group-hover:text-[var(--accent)] transition-colors">
                  {uc.icon}
                </div>
                <span className="text-sm font-medium text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors text-center">
                  {uc.label}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Kits */}
      <section className="border-b border-[var(--border)]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-[var(--text-primary)]">
                Featured Kits
              </h2>
              <p className="text-sm text-[var(--text-muted)] mt-1">
                Popular kits with recent price changes
              </p>
            </div>
            <Link
              href="/kits"
              className="hidden sm:inline-flex items-center gap-1.5 text-sm text-[var(--accent)] hover:text-[var(--accent-hover)] transition-colors"
            >
              All kits
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {featuredKits.map((kit) => (
              <KitCard key={kit.slug} kit={kit} />
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="border-b border-[var(--border)]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
          <h2 className="text-sm font-medium uppercase tracking-wide text-[var(--text-muted)] mb-8 text-center">
            How It Works
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {steps.map((s) => (
              <div
                key={s.step}
                className="relative rounded border border-[var(--border)] bg-[var(--bg-surface)] p-6"
              >
                <span className="font-mono text-3xl font-bold text-[var(--accent)]/20">
                  {s.step}
                </span>
                <h3 className="text-lg font-semibold text-[var(--text-primary)] mt-2">
                  {s.title}
                </h3>
                <p className="text-sm text-[var(--text-secondary)] mt-2 leading-relaxed">
                  {s.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust / Transparency */}
      <section className="bg-[var(--bg-secondary)]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-xl font-bold text-[var(--text-primary)] mb-3">
              No hidden agendas. Just data.
            </h2>
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-8">
              We earn affiliate commissions when you buy through our links — same
              price for you. Every recommendation is data-driven. No sponsored
              rankings, no pay-to-play. Period.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { icon: "◈", label: "Normalized specs", detail: "Apples-to-apples" },
                { icon: "◉", label: "True total cost", detail: "Including what's missing" },
                { icon: "◆", label: "Live pricing", detail: "Updated every 6 hours" },
                { icon: "◇", label: "Price history", detail: "Know if it's a deal" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded border border-[var(--border)] bg-[var(--bg-surface)] p-4"
                >
                  <span className="text-xl text-[var(--accent)]">{item.icon}</span>
                  <p className="text-sm font-medium text-[var(--text-primary)] mt-2">
                    {item.label}
                  </p>
                  <p className="text-xs text-[var(--text-muted)] mt-0.5">
                    {item.detail}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
