/**
 * Build-time statistics for the flagship data report
 * (/reports/state-of-off-grid-solar-pricing-2026).
 *
 * Every number the report cites is COMPUTED here from the live kit corpus at
 * build — never hand-typed — so the report can't drift from the data the price
 * cron updates. The numbers are deliberately curated for honesty: cost-per-Wh
 * uses a percentile band on real battery kits (raw min/max is outlier-garbage),
 * and we do NOT headline the 7-role completeness score (it unfairly penalizes
 * integrated power stations). See the report prose for the methodology note.
 */

import * as fs from "fs";
import * as path from "path";

interface RawKit {
  slug: string;
  name: string;
  displayName?: string;
  brand: string;
  listedPrice?: number;
  missingCost?: number;
  trueCost?: number;
  costPerWh?: string;
  storageWh?: number;
  inverterWatts?: number;
  priceHistory?: { date: string; priceCents: number }[];
}

export interface PricingReportStats {
  pricedKits: number;
  brands: number;
  // Hidden-cost gap
  kitsHidingParts: number;
  kitsHidingPartsPct: number;
  avgHiddenCost: number;
  maxHiddenCost: number;
  maxHiddenKit: string;
  // Cost-per-Wh dispersion (real battery kits only, percentile band)
  batteryKits: number;
  cpwP10: number;
  cpwP50: number;
  cpwP90: number;
  cpwDispersion: number;
  // Surge trap
  inverterKits: number;
  subSurgeKits: number;
  subSurgePct: number;
  // 6-month price volatility
  trackedKits: number;
  medianSwingPct: number;
  p90SwingPct: number;
  movedTenPctKits: number;
  movedTenPctShare: number;
  // freshness
  updated: string;
}

function parseCpw(raw?: string): number {
  if (!raw || raw === "N/A") return NaN;
  return parseFloat(raw.replace(/[^0-9.]/g, ""));
}

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  return sorted[Math.floor((sorted.length - 1) * p)];
}

let _cache: PricingReportStats | null = null;

export function getPricingReportStats(): PricingReportStats {
  if (_cache) return _cache;

  const p = path.join(process.cwd(), "src/lib/data/kits.json");
  const kits: RawKit[] = JSON.parse(fs.readFileSync(p, "utf-8")).filter(
    (k: RawKit) => typeof k.listedPrice === "number" && k.listedPrice! > 0
  );
  const updated = fs.statSync(p).mtime.toISOString().slice(0, 10);

  // ── Hidden-cost gap ──
  const hiding = kits.filter((k) => (k.missingCost ?? 0) > 0);
  const maxKit = hiding.reduce(
    (m, k) => ((k.missingCost ?? 0) > (m.missingCost ?? 0) ? k : m),
    hiding[0] ?? ({} as RawKit)
  );

  // ── Cost-per-Wh dispersion: real battery kits (≥500Wh) with a sane $/Wh ──
  const cpw = kits
    .map((k) => ({ wh: k.storageWh ?? 0, v: parseCpw(k.costPerWh) }))
    .filter((r) => r.wh >= 500 && r.v > 0 && r.v < 10)
    .map((r) => r.v)
    .sort((a, b) => a - b);
  const cpwP10 = percentile(cpw, 0.1);
  const cpwP90 = percentile(cpw, 0.9);

  // ── Surge trap ──
  const inverterKits = kits.filter((k) => (k.inverterWatts ?? 0) > 0);
  const subSurge = inverterKits.filter((k) => (k.inverterWatts ?? 0) < 2000);

  // ── 6-month price volatility (kits with ≥10 observed points) ──
  const swings = kits
    .map((k) => {
      const h = (k.priceHistory ?? [])
        .map((x) => x.priceCents / 100)
        .filter((v) => v > 0);
      if (h.length < 10) return NaN;
      const lo = Math.min(...h);
      const hi = Math.max(...h);
      return lo > 0 ? (hi - lo) / lo : NaN;
    })
    .filter((v) => Number.isFinite(v))
    .sort((a, b) => a - b);
  const movedTen = swings.filter((v) => v >= 0.1).length;

  _cache = {
    pricedKits: kits.length,
    brands: new Set(kits.map((k) => k.brand)).size,
    kitsHidingParts: hiding.length,
    kitsHidingPartsPct: Math.round((hiding.length / kits.length) * 100),
    avgHiddenCost: Math.round(
      hiding.reduce((s, k) => s + (k.missingCost ?? 0), 0) / hiding.length
    ),
    maxHiddenCost: Math.round(maxKit.missingCost ?? 0),
    maxHiddenKit: `${maxKit.brand} ${maxKit.displayName || maxKit.name}`,
    batteryKits: cpw.length,
    cpwP10,
    cpwP50: percentile(cpw, 0.5),
    cpwP90,
    cpwDispersion: cpwP10 > 0 ? Math.round((cpwP90 / cpwP10) * 10) / 10 : 0,
    inverterKits: inverterKits.length,
    subSurgeKits: subSurge.length,
    subSurgePct: Math.round((subSurge.length / inverterKits.length) * 100),
    trackedKits: swings.length,
    medianSwingPct: Math.round(percentile(swings, 0.5) * 100),
    p90SwingPct: Math.round(percentile(swings, 0.9) * 100),
    movedTenPctKits: movedTen,
    movedTenPctShare: Math.round((movedTen / swings.length) * 100),
    updated,
  };
  return _cache;
}
