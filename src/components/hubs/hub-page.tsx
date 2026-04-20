import Link from "next/link";
import type { Kit } from "@/lib/demo-data";
import { BreadcrumbJsonLd } from "@/components/json-ld";
import { DataFooter } from "@/components/ui/data-footer";
import { getKitsUpdated } from "@/lib/data-meta";

function parseCurrency(v: string): number {
  const n = parseFloat(v.replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function formatPriceCents(cents: number): string {
  return `$${Math.round(cents / 100).toLocaleString()}`;
}

function priceVsAvg(kit: Kit): { label: string; tone: "good" | "neutral" | "bad" } {
  const history = kit.priceHistory ?? [];
  if (history.length < 5) return { label: "—", tone: "neutral" };
  const prices = history.map((p) => p.priceCents).filter((c) => c > 0);
  if (prices.length === 0) return { label: "—", tone: "neutral" };
  const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
  const nowCents = kit.listedPrice * 100;
  const pct = Math.round(((nowCents - avg) / avg) * 100);
  if (pct <= -5) return { label: `${Math.abs(pct)}% below avg`, tone: "good" };
  if (pct >= 5) return { label: `${pct}% above avg`, tone: "bad" };
  return { label: "≈ avg", tone: "neutral" };
}

function bestForLabel(kit: Kit): string {
  const excellent = Object.entries(kit.useCaseRatings)
    .filter(([, r]) => r === "excellent")
    .map(([k]) => k);
  if (excellent.length === 0) return "General";
  return excellent.slice(0, 2).map((u) => u.charAt(0).toUpperCase() + u.slice(1)).join(", ");
}

function avoidIfLabel(kit: Kit): string {
  const missing = kit.items.filter((i) => !i.isIncluded).map((i) => i.role);
  if (missing.includes("battery") && missing.includes("inverter")) return "Turn-key buyer";
  if (missing.includes("battery")) return "No DIY sourcing";
  if (kit.voltage >= 48) return "12V rigs";
  if (kit.panelWatts > 0 && kit.panelWatts < 400) return "Daily whole-home loads";
  const poor = Object.entries(kit.useCaseRatings)
    .filter(([, r]) => r === "poor")
    .map(([k]) => k);
  if (poor.length > 0) return poor[0].charAt(0).toUpperCase() + poor[0].slice(1);
  return "—";
}

export interface HubConfig {
  slug: string; // e.g. "best-rv-solar-kit"
  title: string; // meta title (no | OffGridEmpire suffix)
  h1: string;
  metaDesc: string;
  summary: string; // 40–70 words, snippet-safe, goes directly under H1
  breadcrumbName: string;
  queryTopic: string; // e.g. "RV solar kit" — used in copy
  selectKits: (allKits: Kit[]) => Kit[]; // returns FULL pool to rank (will be sorted and sliced)
  topN?: number; // default 7
  budgetTiers: { budget: number; label: string; note: string }[]; // 3 items
  calculatorPresetUrl?: string; // optional prefilled calculator link
  relatedCategoryHref?: string;
  relatedBrandHref?: string;
  relatedArticleHref?: string;
  priceTierIntro: string; // 1–2 sentences describing the price tiering
  overviewBullets: string[]; // 3–5 short bullet-facts about the hub topic
}

function rankByValue(kits: Kit[]): Kit[] {
  // Composite score: normalize cost-per-watt-hour (or cost-per-watt for no-battery),
  // blend with completeness, penalize stale pricing.
  const scored = kits.map((k) => {
    const cpwh = parseCurrency(k.costPerWh);
    const cpw = parseCurrency(k.costPerW);
    const unitCost = cpwh > 0 ? cpwh : cpw > 0 ? cpw : 999;
    const completenessBonus = (k.completeness ?? 0) / 100;
    const score = unitCost / (0.6 + 0.4 * completenessBonus);
    return { k, score };
  });
  scored.sort((a, b) => a.score - b.score);
  return scored.map((s) => s.k);
}

export function HubPage({
  config,
  allKits,
}: {
  config: HubConfig;
  allKits: Kit[];
}) {
  const topN = config.topN ?? 7;
  const pool = config.selectKits(allKits);
  const ranked = rankByValue(pool).slice(0, topN);

  // Callouts
  const mostOverpriced = [...pool]
    .filter((k) => k.listedPrice > 0)
    .sort((a, b) => b.missingCost / b.listedPrice - a.missingCost / a.listedPrice)[0];

  const bestTrueValue = ranked[0];

  const gapTraps = [...pool]
    .filter((k) => k.missingCost > 0 && k.listedPrice > 0)
    .sort((a, b) => b.missingCost / b.listedPrice - a.missingCost / a.listedPrice)
    .slice(0, 3);

  const budgetPicks = config.budgetTiers.map((tier) => {
    const inBudget = pool.filter((k) => k.trueCost <= tier.budget);
    const pick = rankByValue(inBudget)[0];
    return { ...tier, kit: pick };
  });

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <BreadcrumbJsonLd
        items={[
          { name: "Home", url: "/" },
          { name: config.breadcrumbName, url: `/${config.slug}` },
        ]}
      />

      <nav className="flex items-center gap-2 text-sm text-[var(--text-muted)] mb-6">
        <Link href="/" className="hover:text-[var(--accent)] transition-colors">
          Home
        </Link>
        <span>/</span>
        <span className="text-[var(--text-secondary)]">{config.breadcrumbName}</span>
      </nav>

      {/* H1 + summary */}
      <header className="mb-6 max-w-3xl">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text-primary)] mb-3">
          {config.h1}
        </h1>
        <p className="text-[var(--text-secondary)] leading-relaxed">{config.summary}</p>
        <div className="mt-4">
          <DataFooter kitCount={pool.length} updated={getKitsUpdated()} />
        </div>
      </header>

      {/* Overview bullets */}
      <section className="mb-8 max-w-3xl">
        <ul className="space-y-2 text-sm text-[var(--text-secondary)] leading-relaxed">
          {config.overviewBullets.map((b, i) => (
            <li key={i} className="flex gap-2">
              <span className="text-[var(--accent)] shrink-0">▸</span>
              <span>{b}</span>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-xs text-[var(--text-muted)]">
          Every kit below is scored with the same formula. See{" "}
          <Link
            href="/how-real-build-cost-is-calculated"
            className="text-[var(--accent)] hover:underline"
          >
            how real build cost is calculated
          </Link>{" "}
          or the full{" "}
          <Link href="/methodology" className="text-[var(--accent)] hover:underline">
            methodology
          </Link>
          .
        </p>
      </section>

      {/* Ranked table */}
      <section className="mb-12">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--text-muted)] mb-3">
          Top {ranked.length} ranked by value
        </h2>
        <div className="overflow-x-auto rounded border border-[var(--border)]">
          <table className="w-full text-sm">
            <thead className="bg-[var(--bg-surface)]">
              <tr className="text-left text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">
                <th className="py-3 px-4">#</th>
                <th className="py-3 px-4">Kit</th>
                <th className="py-3 px-4 text-right">Advertised</th>
                <th className="py-3 px-4 text-right">Real Build Cost</th>
                <th className="py-3 px-4 text-right">Hidden</th>
                <th className="py-3 px-4 text-right">Complete</th>
                <th className="py-3 px-4 text-right">vs 90d Avg</th>
                <th className="py-3 px-4">Best For</th>
                <th className="py-3 px-4">Avoid If</th>
              </tr>
            </thead>
            <tbody>
              {ranked.map((k, i) => {
                const vs = priceVsAvg(k);
                return (
                  <tr
                    key={k.slug}
                    className="border-t border-[var(--border)] hover:bg-[var(--bg-surface)]/50 transition-colors"
                  >
                    <td className="py-3 px-4 font-mono text-xs text-[var(--text-muted)]">
                      {i + 1}
                    </td>
                    <td className="py-3 px-4">
                      <Link
                        href={`/kits/${k.slug}`}
                        className="text-[var(--accent)] hover:underline font-medium"
                      >
                        {k.brand} {k.displayName ?? k.name}
                      </Link>
                      <div className="font-mono text-[10px] text-[var(--text-muted)] mt-0.5">
                        {k.panelWatts}W
                        {k.storageWh > 0 ? ` · ${(k.storageWh / 1000).toFixed(1)}kWh` : ""}
                        {k.inverterWatts > 0 ? ` · ${k.inverterWatts.toLocaleString()}W inv` : ""}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-xs text-[var(--text-secondary)]">
                      ${k.listedPrice.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-sm font-semibold text-[var(--text-primary)]">
                      ${k.trueCost.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-xs">
                      {k.missingCost > 0 ? (
                        <span className="text-[var(--danger)]">
                          +${k.missingCost.toLocaleString()}
                        </span>
                      ) : (
                        <span className="text-[var(--success)]">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-xs text-[var(--text-secondary)]">
                      {k.completeness}%
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-xs">
                      <span
                        className={
                          vs.tone === "good"
                            ? "text-[var(--success)]"
                            : vs.tone === "bad"
                              ? "text-[var(--danger)]"
                              : "text-[var(--text-muted)]"
                        }
                      >
                        {vs.label}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-xs text-[var(--text-secondary)]">
                      {bestForLabel(k)}
                    </td>
                    <td className="py-3 px-4 text-xs text-[var(--text-muted)]">
                      {avoidIfLabel(k)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Best True Value + Most Overpriced */}
      {(bestTrueValue || mostOverpriced) && (
        <section className="mb-12 grid grid-cols-1 md:grid-cols-2 gap-4">
          {bestTrueValue && (
            <Link
              href={`/kits/${bestTrueValue.slug}`}
              className="rounded border border-[var(--success)]/40 bg-[var(--success)]/5 p-5 hover:border-[var(--success)] transition-colors group"
            >
              <p className="font-mono text-[10px] font-semibold uppercase tracking-widest text-[var(--success)] mb-2">
                Best True Value
              </p>
              <p className="text-lg font-semibold text-[var(--text-primary)] group-hover:underline">
                {bestTrueValue.brand} {bestTrueValue.displayName ?? bestTrueValue.name}
              </p>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">
                ${bestTrueValue.trueCost.toLocaleString()} real build cost · {bestTrueValue.costPerW}/W
                {parseCurrency(bestTrueValue.costPerWh) > 0 ? ` · ${bestTrueValue.costPerWh}/Wh` : ""}
              </p>
              <p className="mt-1 text-xs text-[var(--text-muted)]">
                Lowest cohort unit cost with {bestTrueValue.completeness}% completeness.
              </p>
            </Link>
          )}
          {mostOverpriced && mostOverpriced.slug !== bestTrueValue?.slug && mostOverpriced.missingCost > 0 && (
            <Link
              href={`/kits/${mostOverpriced.slug}`}
              className="rounded border border-[var(--danger)]/40 bg-[var(--danger)]/5 p-5 hover:border-[var(--danger)] transition-colors group"
            >
              <p className="font-mono text-[10px] font-semibold uppercase tracking-widest text-[var(--danger)] mb-2">
                Most Overpriced (Sticker Trap)
              </p>
              <p className="text-lg font-semibold text-[var(--text-primary)] group-hover:underline">
                {mostOverpriced.brand} {mostOverpriced.displayName ?? mostOverpriced.name}
              </p>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">
                Advertised ${mostOverpriced.listedPrice.toLocaleString()} →
                real ${mostOverpriced.trueCost.toLocaleString()} (+${mostOverpriced.missingCost.toLocaleString()} hidden).
              </p>
              <p className="mt-1 text-xs text-[var(--text-muted)]">
                {mostOverpriced.completeness}% complete — missing parts dominate the real price.
              </p>
            </Link>
          )}
        </section>
      )}

      {/* Gap Receipt callout */}
      {gapTraps.length > 0 && (
        <section className="mb-12">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--text-muted)] mb-3">
            Sticker-price traps in this cohort
          </h2>
          <p className="text-sm text-[var(--text-secondary)] mb-4 max-w-3xl">
            These kits look cheap until you price in the parts they leave out. Each ships
            without key components and the real build cost climbs sharply once those are added.
          </p>
          <div className="space-y-2">
            {gapTraps.map((k) => {
              const pct = Math.round((k.missingCost / k.listedPrice) * 100);
              return (
                <Link
                  key={k.slug}
                  href={`/kits/${k.slug}`}
                  className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 rounded border border-[var(--border)] bg-[var(--bg-surface)] p-3 hover:border-[var(--accent)] transition-colors group"
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors">
                      {k.brand} {k.displayName ?? k.name}
                    </p>
                    <p className="text-xs text-[var(--text-muted)] mt-0.5">
                      Missing: {k.items.filter((i) => !i.isIncluded).map((i) => i.role).join(", ") || "—"}
                    </p>
                  </div>
                  <div className="font-mono text-xs text-[var(--text-secondary)]">
                    ${k.listedPrice.toLocaleString()} →{" "}
                    <span className="text-[var(--danger)] font-semibold">
                      ${k.trueCost.toLocaleString()}
                    </span>{" "}
                    <span className="text-[var(--text-muted)]">(+{pct}%)</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* Budget picks */}
      <section className="mb-12">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--text-muted)] mb-3">
          What we&apos;d buy at {config.budgetTiers.map((t) => `$${t.budget.toLocaleString()}`).join(" / ")}
        </h2>
        <p className="text-sm text-[var(--text-secondary)] mb-4 max-w-3xl">{config.priceTierIntro}</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {budgetPicks.map((p) => (
            <div
              key={p.budget}
              className="rounded border border-[var(--border)] bg-[var(--bg-surface)] p-4"
            >
              <p className="font-mono text-[10px] font-semibold uppercase tracking-widest text-[var(--accent)] mb-2">
                Under ${p.budget.toLocaleString()} · {p.label}
              </p>
              {p.kit ? (
                <>
                  <Link
                    href={`/kits/${p.kit.slug}`}
                    className="text-sm font-semibold text-[var(--text-primary)] hover:text-[var(--accent)] hover:underline"
                  >
                    {p.kit.brand} {p.kit.displayName ?? p.kit.name}
                  </Link>
                  <p className="mt-2 font-mono text-xs text-[var(--text-secondary)]">
                    ${p.kit.trueCost.toLocaleString()} real build cost · {p.kit.completeness}% complete
                  </p>
                  <p className="mt-2 text-xs text-[var(--text-muted)]">{p.note}</p>
                </>
              ) : (
                <p className="text-xs text-[var(--text-muted)]">
                  No kit in this cohort fits under ${p.budget.toLocaleString()} real build cost.
                </p>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Related links */}
      <section className="mb-12">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--text-muted)] mb-3">
          Related
        </h2>
        <div className="flex flex-wrap gap-x-5 gap-y-2">
          <Link
            href={config.calculatorPresetUrl ?? "/calculator"}
            className="text-sm font-medium text-[var(--accent)] hover:underline"
          >
            Size your {config.queryTopic.toLowerCase()} →
          </Link>
          {config.relatedCategoryHref && (
            <Link
              href={config.relatedCategoryHref}
              className="text-sm font-medium text-[var(--accent)] hover:underline"
            >
              Browse all in category →
            </Link>
          )}
          {config.relatedBrandHref && (
            <Link
              href={config.relatedBrandHref}
              className="text-sm font-medium text-[var(--accent)] hover:underline"
            >
              Brand page →
            </Link>
          )}
          {config.relatedArticleHref && (
            <Link
              href={config.relatedArticleHref}
              className="text-sm font-medium text-[var(--accent)] hover:underline"
            >
              Background article →
            </Link>
          )}
          <Link
            href="/methodology"
            className="text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:underline"
          >
            Methodology →
          </Link>
        </div>
      </section>
    </div>
  );
}
