#!/usr/bin/env tsx
/**
 * Generate the consolidated public dataset (CSV + JSON) that backs the
 * schema.org/Dataset on /methodology and /data-sources.
 *
 * This is the AIO/GEO "citable source" artifact: a single, machine-readable
 * download of the priced kit corpus with the proprietary metrics (real build
 * cost, completeness, cost-per-Wh) that answer engines can attribute back to
 * offgridempire.com. Run before build:
 *   npx tsx scripts/generate-dataset.ts
 *
 * Output:
 *   public/data/offgridempire-solar-kit-dataset.json
 *   public/data/offgridempire-solar-kit-dataset.csv
 *
 * Source of truth is the cron-regenerated kits.json — this script only reshapes
 * it, so it is safe to re-run on every build.
 */

import * as fs from "fs";
import * as path from "path";

const SITE_URL = "https://offgridempire.com";
const OUT_DIR = path.join(__dirname, "../public/data");

interface RawKit {
  slug: string;
  name: string;
  displayName?: string;
  brand: string;
  listedPrice?: number;
  missingCost?: number;
  trueCost?: number;
  completeness?: number;
  costPerWh?: string;
  costPerW?: string;
  panelWatts?: number;
  storageWh?: number;
  inverterWatts?: number;
  voltage?: number;
  chemistry?: string;
  retailer?: string;
  priceObservedAt?: string;
  priceHistory?: { date: string; priceCents: number }[];
}

/** The citable, normalized record shape. Stable field order = stable CSV. */
interface DatasetRow {
  slug: string;
  brand: string;
  name: string;
  url: string;
  listed_price_usd: number | null;
  missing_parts_cost_usd: number | null;
  real_build_cost_usd: number | null;
  completeness_pct: number | null;
  cost_per_wh_usd: number | null;
  cost_per_w_usd: number | null;
  panel_watts: number | null;
  storage_wh: number | null;
  inverter_watts: number | null;
  voltage: number | null;
  chemistry: string;
  retailer: string;
  price_low_6mo_usd: number | null;
  price_high_6mo_usd: number | null;
  price_points_6mo: number;
  price_observed_at: string;
}

function parseMoney(raw?: string): number | null {
  if (!raw || raw === "N/A") return null;
  const n = parseFloat(raw.replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) ? n : null;
}

function buildRows(kits: RawKit[]): DatasetRow[] {
  return kits
    .filter((k) => typeof k.listedPrice === "number" && k.listedPrice > 0)
    .map((k) => {
      const hist = Array.isArray(k.priceHistory) ? k.priceHistory : [];
      const prices = hist
        .map((h) => h.priceCents / 100)
        .filter((p) => p > 0);
      return {
        slug: k.slug,
        brand: k.brand,
        name: k.displayName || k.name,
        url: `${SITE_URL}/kits/${k.slug}`,
        listed_price_usd: k.listedPrice ?? null,
        missing_parts_cost_usd: k.missingCost ?? null,
        real_build_cost_usd: k.trueCost ?? null,
        completeness_pct: typeof k.completeness === "number" ? k.completeness : null,
        cost_per_wh_usd: parseMoney(k.costPerWh),
        cost_per_w_usd: parseMoney(k.costPerW),
        panel_watts: k.panelWatts ?? null,
        storage_wh: k.storageWh ?? null,
        inverter_watts: k.inverterWatts ?? null,
        voltage: k.voltage ?? null,
        chemistry: k.chemistry || "Unknown",
        retailer: k.retailer || "",
        price_low_6mo_usd: prices.length ? Math.min(...prices) : null,
        price_high_6mo_usd: prices.length ? Math.max(...prices) : null,
        price_points_6mo: prices.length,
        price_observed_at: (k.priceObservedAt || "").split("T")[0] || "",
      };
    })
    .sort((a, b) => a.slug.localeCompare(b.slug));
}

/** RFC-4180 CSV cell escaping. */
function csvCell(v: string | number | null): string {
  if (v === null) return "";
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function toCsv(rows: DatasetRow[]): string {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]) as (keyof DatasetRow)[];
  const lines = [headers.join(",")];
  for (const row of rows) {
    lines.push(headers.map((h) => csvCell(row[h])).join(","));
  }
  return lines.join("\n") + "\n";
}

function main() {
  const kits: RawKit[] = JSON.parse(
    fs.readFileSync(path.join(__dirname, "../src/lib/data/kits.json"), "utf-8")
  );
  const rows = buildRows(kits);
  const updated = new Date().toISOString().split("T")[0];

  fs.mkdirSync(OUT_DIR, { recursive: true });

  const jsonPayload = {
    name: "OffGridEmpire Off-Grid Solar Kit Cost & Price Dataset",
    description:
      "Priced off-grid solar kits decomposed into 7 component roles, with real build cost, completeness, cost per usable watt-hour, and 6-month price range. Source: offgridempire.com.",
    source: SITE_URL,
    license: "https://creativecommons.org/licenses/by/4.0/",
    methodology: `${SITE_URL}/methodology`,
    updated,
    recordCount: rows.length,
    records: rows,
  };
  fs.writeFileSync(
    path.join(OUT_DIR, "offgridempire-solar-kit-dataset.json"),
    JSON.stringify(jsonPayload, null, 2)
  );
  fs.writeFileSync(
    path.join(OUT_DIR, "offgridempire-solar-kit-dataset.csv"),
    toCsv(rows)
  );

  console.log(
    `[generate-dataset] wrote ${rows.length} priced-kit records (CSV + JSON) to public/data/`
  );
}

main();
