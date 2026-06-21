import Link from "next/link";
import type { Kit } from "@/lib/demo-data";
import type { DecisionGuideMeta, PodiumPick } from "@/lib/decision/types";
import type { SizingResult } from "@/lib/calculator/types";
import { getKitBySlug } from "@/lib/get-kits";
import { buildAffiliateUrl } from "@/lib/affiliate";
import { getBuyTiming, BUY_SIGNAL_STYLE } from "@/lib/decision/evidence";
import { Receipt } from "@/components/receipt";
import { KitCard } from "@/components/kit-card";
import { BomTable } from "@/components/ui/bom-table";
import { AffiliateLink } from "@/components/ui/affiliate-link";
import { PriceHistorySection } from "@/components/ui/price-history-section";
import { Prose } from "./prose";

// ── helpers ──────────────────────────────────────────────────────────────────

function fmtWh(wh: number): string {
  return wh >= 1000 ? `${(wh / 1000).toFixed(1)} kWh` : `${wh} Wh`;
}

function bestBuy(kit: Kit): { url: string; retailer: string; price: number } | null {
  const inStock = (kit.offers ?? []).filter((o) => o.inStock && o.sourceUrl);
  const best = [...inStock].sort((a, b) => a.price - b.price)[0];
  if (best?.sourceUrl) {
    const url = buildAffiliateUrl(best.sourceUrl, best.retailerSlug);
    if (url) return { url, retailer: best.retailer, price: best.price };
  }
  if (kit.sourceUrl) {
    const url = buildAffiliateUrl(kit.sourceUrl, kit.retailerSlug ?? "amazon");
    if (url) return { url, retailer: kit.retailer, price: kit.listedPrice };
  }
  return null;
}

interface ResolvedPick extends PodiumPick {
  kit: Kit;
}

export function resolvePicks(picks: PodiumPick[]): ResolvedPick[] {
  return picks
    .map((p) => {
      const kit = getKitBySlug(p.kitSlug);
      return kit ? { ...p, kit } : null;
    })
    .filter((p): p is ResolvedPick => p !== null);
}

const ArrowOut = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" />
  </svg>
);

// ── 1. Header (H1 + answer-first block) ──────────────────────────────────────

export function GuideHeader({ h1, answer }: { h1: string; answer: string }) {
  return (
    <>
      <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)] mb-4 leading-tight">
        {h1}
      </h1>
      <div className="rounded border border-[var(--accent)]/30 bg-[var(--accent)]/[0.04] p-4 sm:p-5">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--accent)] mb-1.5">
          The short answer
        </p>
        <p className="text-sm sm:text-base text-[var(--text-primary)] leading-relaxed">{answer}</p>
      </div>
    </>
  );
}

// ── 2. Sizing cards (load profile) ───────────────────────────────────────────

export function SizingCards({ sizing }: { sizing: SizingResult }) {
  const cards = [
    { label: "Daily energy", value: fmtWh(sizing.totalDailyWh) },
    { label: "Solar needed", value: `${sizing.requiredPanelWatts.toLocaleString()}W` },
    { label: "Storage needed", value: fmtWh(sizing.requiredStorageWh) },
    { label: "Inverter needed", value: `${sizing.requiredInverterWatts.toLocaleString()}W` },
  ];
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {cards.map((c) => (
        <div key={c.label} className="rounded border border-[var(--border)] bg-[var(--bg-surface)] p-4">
          <div className="text-xs text-[var(--text-muted)] mb-1">{c.label}</div>
          <div className="font-mono text-xl font-bold text-[var(--accent)]">{c.value}</div>
        </div>
      ))}
    </div>
  );
}

// ── 3. Podium (the shortlist) ────────────────────────────────────────────────

export function Podium({ picks }: { picks: ResolvedPick[] }) {
  if (picks.length === 0) return null;
  const [first, ...rest] = picks;
  const buy = bestBuy(first.kit);

  return (
    <div className="space-y-5">
      {/* #1 — the anchor pick */}
      <div className="rounded border border-[var(--accent)]/30 bg-[var(--accent)]/[0.03] p-5">
        <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--accent)] mb-1">
              #1 · {first.label}
            </p>
            <Link
              href={`/kits/${first.kit.slug}`}
              className="text-lg font-semibold text-[var(--text-primary)] hover:text-[var(--accent)] transition-colors"
            >
              {first.kit.displayName ?? first.kit.name}
            </Link>
            <div className="text-xs text-[var(--text-muted)] mt-0.5">
              {first.kit.brand} · {first.kit.panelWatts}W solar · {fmtWh(first.kit.storageWh)}
              {first.kit.inverterWatts > 0
                ? ` · ${first.kit.inverterWatts.toLocaleString()}W inverter`
                : ""}{" "}
              · {first.kit.costPerWh}/Wh
            </div>
          </div>
          {first.cta && buy && (
            <AffiliateLink
              href={buy.url}
              kitSlug={first.kit.slug}
              retailer={buy.retailer}
              price={buy.price}
              className="inline-flex items-center gap-1.5 rounded-sm bg-[var(--accent)] px-4 py-2 text-xs font-semibold text-[var(--bg-primary)] hover:bg-[var(--accent-hover)] transition-colors"
            >
              Check live price at {buy.retailer}
              <ArrowOut />
            </AffiliateLink>
          )}
        </div>
        <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{first.rationale}</p>
      </div>

      {/* #2..n — rows */}
      {rest.length > 0 && (
        <div className="space-y-3">
          {rest.map((p, i) => (
            <div
              key={p.kit.slug}
              className="rounded border border-[var(--border)] bg-[var(--bg-surface)] p-4"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                  #{i + 2} · {p.label}
                </p>
                <span className="font-mono text-xs text-[var(--text-muted)]">
                  {p.kit.costPerWh}/Wh
                </span>
              </div>
              <Link
                href={`/kits/${p.kit.slug}`}
                className="text-base font-semibold text-[var(--text-primary)] hover:text-[var(--accent)] transition-colors"
              >
                {p.kit.displayName ?? p.kit.name}
              </Link>
              <div className="text-xs text-[var(--text-muted)] mt-0.5 mb-2">
                {p.kit.brand} · {p.kit.panelWatts}W solar · {fmtWh(p.kit.storageWh)}
                {p.kit.inverterWatts > 0
                  ? ` · ${p.kit.inverterWatts.toLocaleString()}W inverter`
                  : ""}
              </div>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{p.rationale}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── 4. Receipt section (autonomy OR missing-parts) ───────────────────────────

export function ReceiptSection({
  picks,
  mode,
  effectiveLoadWatts = 75,
  note,
}: {
  picks: ResolvedPick[];
  mode: DecisionGuideMeta["receiptMode"];
  effectiveLoadWatts?: number;
  note?: string;
}) {
  if (picks.length === 0) return null;

  if (mode === "autonomy") {
    return (
      <div className="space-y-4">
        {note && <Prose body={note} />}
        <div className="overflow-x-auto rounded border border-[var(--border)] bg-[var(--bg-surface)]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--bg-secondary)] text-xs uppercase tracking-wide text-[var(--text-muted)]">
                <th className="px-4 py-3 text-left font-medium">Kit</th>
                <th className="px-4 py-3 text-right font-medium">Listed</th>
                <th className="px-4 py-3 text-right font-medium">Storage</th>
                <th className="px-4 py-3 text-right font-medium">Fridge runtime, no sun</th>
                <th className="px-4 py-3 text-right font-medium">Days autonomy</th>
              </tr>
            </thead>
            <tbody>
              {picks.map((p) => {
                const hours = p.kit.storageWh / effectiveLoadWatts;
                const days = hours / 24;
                return (
                  <tr key={p.kit.slug} className="border-b border-[var(--border)] last:border-b-0">
                    <td className="px-4 py-3">
                      <Link
                        href={`/kits/${p.kit.slug}`}
                        className="font-medium text-[var(--text-primary)] hover:text-[var(--accent)] transition-colors"
                      >
                        {p.kit.displayName ?? p.kit.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-[var(--text-secondary)]">
                      ${p.kit.listedPrice.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-[var(--text-secondary)]">
                      {fmtWh(p.kit.storageWh)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-[var(--accent)]">
                      ~{Math.round(hours)} hrs
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-[var(--text-secondary)]">
                      ~{days.toFixed(1)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-[var(--text-muted)]">
          Runtime ≈ usable storage ÷ ~{effectiveLoadWatts}W effective fridge draw (running watts +
          inverter overhead, before summer derate). A real receipt for integrated stations is{" "}
          <em>hours of runtime</em>, not missing parts.
        </p>
      </div>
    );
  }

  // missing-parts mode — lead with the #1 pick's real-build-cost receipt + BOM
  const lead = picks[0];
  return (
    <div className="space-y-4">
      {note && <Prose body={note} />}
      <Receipt kit={lead.kit} variant="report" />
      <BomTable items={lead.kit.items} missingCost={lead.kit.missingCost} />
    </div>
  );
}

// ── 5. Buy now vs wait (price-history signal from the evidence graph) ─────────

export function BuyTimingTable({ picks }: { picks: ResolvedPick[] }) {
  const rows = picks
    .map((p) => ({ pick: p, timing: getBuyTiming(p.kit.slug) }))
    .filter((r): r is { pick: ResolvedPick; timing: NonNullable<ReturnType<typeof getBuyTiming>> } => r.timing !== null);

  if (rows.length === 0) return null;
  const chartKit = picks[0].kit;

  return (
    <div className="space-y-5">
      <div className="overflow-x-auto rounded border border-[var(--border)] bg-[var(--bg-surface)]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] bg-[var(--bg-secondary)] text-xs uppercase tracking-wide text-[var(--text-muted)]">
              <th className="px-4 py-3 text-left font-medium">Kit</th>
              <th className="px-4 py-3 text-right font-medium">Current</th>
              <th className="px-4 py-3 text-right font-medium">6-mo low</th>
              <th className="px-4 py-3 text-right font-medium">Above low</th>
              <th className="px-4 py-3 text-left font-medium">Signal</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ pick, timing }) => {
              const style = BUY_SIGNAL_STYLE[timing.signal];
              return (
                <tr key={pick.kit.slug} className="border-b border-[var(--border)] last:border-b-0">
                  <td className="px-4 py-3">
                    <Link
                      href={`/kits/${pick.kit.slug}`}
                      className="font-medium text-[var(--text-primary)] hover:text-[var(--accent)] transition-colors"
                    >
                      {pick.kit.displayName ?? pick.kit.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-[var(--text-secondary)]">
                    ${Math.round(timing.currentPrice).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-[var(--text-secondary)]">
                    ${Math.round(timing.low6mo).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-[var(--text-secondary)]">
                    {timing.pctAboveLow > 0 ? `+${timing.pctAboveLow}%` : "at low"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className="inline-block rounded-sm px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
                      style={{ backgroundColor: `${style.color}22`, color: style.color }}
                    >
                      {style.label}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)] mb-2">
          6-month price history — {chartKit.displayName ?? chartKit.name}
        </p>
        <PriceHistorySection kit={chartKit} />
      </div>
    </div>
  );
}

// ── 6. Why these won / why others failed ─────────────────────────────────────

export function WhyWonWhyFailed({ whyWon, whyFailed }: { whyWon: string[]; whyFailed: string[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="rounded border border-[var(--success)]/30 bg-[var(--success)]/[0.04] p-4">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--success)] mb-2">
          Why these won
        </p>
        <ul className="space-y-1.5">
          {whyWon.map((w, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-[var(--text-secondary)] leading-relaxed">
              <span className="text-[var(--success)] mt-0.5 shrink-0">✓</span>
              <span>{w}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="rounded border border-[var(--danger)]/30 bg-[var(--danger)]/[0.04] p-4">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--danger)] mb-2">
          Why others failed
        </p>
        <ul className="space-y-1.5">
          {whyFailed.map((w, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-[var(--text-secondary)] leading-relaxed">
              <span className="text-[var(--danger)] mt-0.5 shrink-0">✕</span>
              <span>{w}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// ── 7. Methodology + freshness + corrections ─────────────────────────────────

export function MethodologyFreshness({
  cohortLabel,
  headlineCount,
  shortlistCount,
  updatedAt,
}: {
  cohortLabel: string;
  headlineCount: number;
  shortlistCount: number;
  updatedAt: string;
}) {
  return (
    <div className="rounded border border-[var(--border)] bg-[var(--bg-surface)] p-5 text-sm text-[var(--text-secondary)] leading-relaxed space-y-2">
      <p>
        <span className="font-semibold text-[var(--text-primary)]">Cohort:</span> {cohortLabel} →{" "}
        <span className="font-mono">{headlineCount.toLocaleString()}</span> kits clear the bar;{" "}
        the podium is drawn from the{" "}
        <span className="font-mono">{shortlistCount.toLocaleString()}</span> clean, complete
        primaries left after dropping variants and incomplete listings. Prices auto-refresh from
        multiple retailers every 6 hours; this page last refreshed{" "}
        <span className="font-mono">{updatedAt.slice(0, 10)}</span>.
      </p>
      <p className="text-xs text-[var(--text-muted)]">
        See{" "}
        <Link href="/how-real-build-cost-is-calculated" className="text-[var(--accent)] hover:underline">
          how real build cost is calculated
        </Link>
        ,{" "}
        <Link href="/methodology" className="text-[var(--accent)] hover:underline">
          our methodology
        </Link>
        ,{" "}
        <Link href="/data-sources" className="text-[var(--accent)] hover:underline">
          data sources
        </Link>
        , and{" "}
        <Link href="/editorial-policy" className="text-[var(--accent)] hover:underline">
          editorial policy
        </Link>
        . Found an error?{" "}
        <Link href="/contact" className="text-[var(--accent)] hover:underline">
          Tell us
        </Link>{" "}
        — we correct fast.
      </p>
    </div>
  );
}
