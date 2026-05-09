import type { Metadata } from "next";
import Link from "next/link";
import { getTopPriceDrops, formatDropCents } from "@/lib/price-drops";
import { NewsletterForm } from "@/components/ui/newsletter-form";
import { BreadcrumbJsonLd } from "@/components/json-ld";
import { getKitsUpdated } from "@/lib/data-meta";
import { getMatchingHub } from "@/lib/hubs";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "This Week's Biggest Off-Grid Solar Kit Price Drops",
  description:
    "Real, observed price drops on tracked off-grid solar kits — refreshed every 6 hours. Each row shows the previous observed price, current price, retailer, and what the kit is still missing.",
  alternates: { canonical: "/this-week" },
  openGraph: {
    title: "This Week's Biggest Off-Grid Solar Kit Price Drops",
    description: "Observed price drops on tracked off-grid solar kits, refreshed every 6 hours.",
    url: "/this-week",
  },
};

function formatPrice(cents: number): string {
  return `$${Math.round(cents / 100).toLocaleString("en-US")}`;
}

function gapInsight(kit: { missingCost: number; included: Record<string, boolean> }): string {
  const missingRoles: string[] = [];
  if (kit.included.panels === false) missingRoles.push("panels");
  if (kit.included.battery === false) missingRoles.push("battery");
  if (kit.included.inverter === false) missingRoles.push("inverter");
  if (kit.included.mounting === false) missingRoles.push("mounting");
  if (kit.included.controller === false) missingRoles.push("charge controller");

  if (missingRoles.length === 0) return "Complete kit — no hidden parts.";
  if (kit.missingCost > 0) {
    const list =
      missingRoles.length === 1
        ? missingRoles[0]
        : missingRoles.length === 2
          ? `${missingRoles[0]} and ${missingRoles[1]}`
          : `${missingRoles[0]}, ${missingRoles[1]}, and ${missingRoles.length - 2} more`;
    return `Still needs ${list} — ~$${kit.missingCost.toLocaleString("en-US")} extra.`;
  }
  return `${missingRoles.length} component role${missingRoles.length > 1 ? "s" : ""} not included.`;
}

export default function ThisWeekPage() {
  const drops = getTopPriceDrops({ limit: 15, minDropCents: 2000, windowDays: 14 });
  const updated = getKitsUpdated();

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-10">
      <BreadcrumbJsonLd
        items={[
          { name: "Home", url: "/" },
          { name: "This Week's Drops", url: "/this-week" },
        ]}
      />

      <nav className="text-xs text-[var(--ink-muted)] mb-6">
        <Link href="/" className="hover:text-[var(--accent)]">
          Home
        </Link>
        <span className="mx-2">/</span>
        <span>This Week&apos;s Drops</span>
      </nav>

      <header className="mb-10">
        <p className="eyebrow mb-3">Updated {updated}</p>
        <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl leading-tight tracking-tight text-[var(--ink)]">
          This week&apos;s biggest off-grid solar kit price drops
        </h1>
        <p className="mt-4 max-w-3xl text-base text-[var(--ink-soft)] leading-relaxed">
          Real, observed drops from our 6-hour pipeline. Each row shows what the price was, what
          it is now, the retailer where we observed it, and one line of what the kit is still
          missing. No estimates, no marketing language — just the numbers we recorded.
        </p>

        <div className="mt-6">
          <NewsletterForm source="this-week-hero" />
          <p className="mt-2 text-xs text-[var(--ink-muted)]">
            One email every Tuesday. Unsubscribe in one click.
          </p>
        </div>
      </header>

      {drops.length === 0 ? (
        <div className="border border-[var(--rule)] rounded-sm p-10 text-center">
          <p className="text-[var(--ink-soft)]">
            No qualifying drops in the last 14 days. Check back Tuesday.
          </p>
          <Link
            href="/kits/"
            className="mt-4 inline-block text-sm text-[var(--accent)] hover:underline"
          >
            Browse all tracked kits →
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {drops.map((drop, idx) => {
            const hub = getMatchingHub(drop.kit);
            const fullName = `${drop.kit.brand} ${drop.kit.displayName ?? drop.kit.name}`;
            return (
              <article
                key={drop.kit.slug}
                className="border border-[var(--rule)] rounded-sm bg-[var(--paper)] p-5 hover:border-[var(--ink-soft)] transition-colors"
              >
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-3 flex-wrap">
                      <span className="text-xs tabular text-[var(--ink-muted)]">
                        #{idx + 1}
                      </span>
                      <Link
                        href={`/kits/${drop.kit.slug}/`}
                        className="font-display text-lg sm:text-xl text-[var(--ink)] hover:text-[var(--accent)] leading-snug"
                      >
                        {fullName}
                      </Link>
                    </div>
                    <p className="mt-1 text-xs text-[var(--ink-muted)]">
                      Observed at <span className="text-[var(--ink-soft)]">{drop.kit.retailer}</span> ·
                      Last observed: {drop.observedDate} ({drop.daysAgo === 0 ? "today" : `${drop.daysAgo}d ago`})
                    </p>
                    <p className="mt-2 text-sm text-[var(--ink-soft)]">{gapInsight(drop.kit)}</p>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="font-display text-2xl text-[var(--ink)] tabular">
                      {formatPrice(drop.currentPriceCents)}
                    </div>
                    <div className="text-xs text-[var(--ink-muted)] tabular line-through">
                      was {formatPrice(drop.previousPriceCents)}
                    </div>
                    <div className="mt-1 inline-flex items-center gap-1 rounded-sm bg-[var(--accent)]/10 px-2 py-0.5 text-xs font-semibold text-[var(--accent)] tabular">
                      −{formatDropCents(drop.dropCents)} ({drop.dropPercent.toFixed(1)}%)
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-[var(--rule)] flex items-center justify-between gap-3 flex-wrap text-xs">
                  <Link
                    href={`/kits/${drop.kit.slug}/#price-alert`}
                    className="text-[var(--accent)] hover:underline"
                  >
                    Track this kit →
                  </Link>
                  {hub && (
                    <Link
                      href={`/${hub.slug}/`}
                      className="text-[var(--ink-muted)] hover:text-[var(--accent)]"
                    >
                      Compare other {hub.label.toLowerCase()} →
                    </Link>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      <footer className="mt-12 pt-8 border-t border-[var(--rule)]">
        <h2 className="font-display text-xl text-[var(--ink)] mb-3">How this list is built</h2>
        <ul className="text-sm text-[var(--ink-soft)] space-y-2 leading-relaxed">
          <li>
            We pull retailer prices for tracked kits every six hours and write each observed price
            change to a per-kit history file.
          </li>
          <li>
            For this list, we look for kits whose most recent observed price change was a drop of
            at least <strong>$20</strong>, observed within the last <strong>14 days</strong>.
          </li>
          <li>
            &quot;Last observed&quot; is the timestamp from our pipeline — not the retailer&apos;s
            last sale date. If the price went back up after our last check, we&apos;ll show that
            too on the next run.
          </li>
          <li>
            We do not publish forward-filled or interpolated prices. Each row is a real
            observation.
          </li>
        </ul>
        <p className="mt-6 text-xs text-[var(--ink-muted)]">
          Methodology and data sources: <Link href="/how-real-build-cost-is-calculated/" className="text-[var(--accent)] hover:underline">Real build cost</Link> · <Link href="/data-sources/" className="text-[var(--accent)] hover:underline">Sources</Link>
        </p>
      </footer>

      <section className="mt-10 border border-[var(--rule)] rounded-sm bg-[var(--bg-secondary)] p-6">
        <h2 className="font-display text-xl text-[var(--ink)] mb-2">Get the weekly index by email</h2>
        <p className="text-sm text-[var(--ink-soft)] mb-4 max-w-2xl">
          Every Tuesday, we send the same data — top observed price drops on tracked off-grid kits
          — straight to your inbox. One email, no marketing, unsubscribe in one click.
        </p>
        <NewsletterForm source="this-week-footer" />
      </section>
    </div>
  );
}
