/**
 * Database query functions for kit data.
 * These produce the same shape as demo-data.ts Kit interface,
 * making it easy to swap between demo data and real DB data.
 */

import { db } from "./index";
import { eq, sql, desc, asc } from "drizzle-orm";
import * as s from "./schema";
import type { Kit, KitItem, PriceHistoryPoint } from "../demo-data";

// Role code → human-friendly label mapping
const ROLE_LABELS: Record<string, string> = {
  panel_array: "Solar Panels",
  battery_bank: "Battery",
  inverter: "Inverter",
  charge_controller: "Charge Controller",
  mounting_hardware: "Mounting",
  wiring_kit: "Wiring",
  monitoring: "Monitoring",
  fuse_or_breaker: "Fuse/Breaker",
  combiner_box: "Combiner Box",
  grounding: "Grounding",
  transfer_switch: "Transfer Switch",
  generator_input: "Generator Input",
  other: "Other",
};

// Role code → included key mapping (matches Kit.included shape)
const ROLE_TO_INCLUDED_KEY: Record<string, string> = {
  panel_array: "panels",
  charge_controller: "controller",
  battery_bank: "battery",
  inverter: "inverter",
  wiring_kit: "wiring",
  mounting_hardware: "mounting",
  monitoring: "monitoring",
};

/**
 * Compute use case suitability ratings from kit specs.
 * Based on use case power requirements defined in seed.ts.
 */
function computeUseCaseRatings(kit: {
  storageWh: number;
  panelWatts: number;
  inverterWatts: number;
  completeness: number;
  chemistry: string;
}): Record<string, "excellent" | "good" | "fair" | "poor"> {
  const { storageWh, panelWatts, inverterWatts, completeness, chemistry } = kit;

  // Use case requirements: { dailyLoadWh, peakW, autonomyHours }
  const useCases: Record<string, { daily: number; peak: number; autonomy: number }> = {
    rv:        { daily: 1500, peak: 1000, autonomy: 24 },
    cabin:     { daily: 3000, peak: 2000, autonomy: 48 },
    shed:      { daily: 500,  peak: 500,  autonomy: 12 },
    emergency: { daily: 2000, peak: 3000, autonomy: 72 },
    homestead: { daily: 8000, peak: 5000, autonomy: 72 },
    boat:      { daily: 1000, peak: 800,  autonomy: 24 },
  };

  const ratings: Record<string, "excellent" | "good" | "fair" | "poor"> = {};

  for (const [uc, req] of Object.entries(useCases)) {
    let score = 0;

    // Storage coverage (0-3 points)
    const storageNeeded = req.daily * (req.autonomy / 24);
    if (storageWh <= 0) {
      score += 0; // no battery = can't store anything
    } else if (storageWh >= storageNeeded) {
      score += 3;
    } else if (storageWh >= storageNeeded * 0.5) {
      score += 2;
    } else if (storageWh >= storageNeeded * 0.25) {
      score += 1;
    }

    // Panel production coverage (0-2 points) — assume ~5 peak sun hours
    const dailyProduction = panelWatts * 5;
    if (panelWatts <= 0) {
      score += 0;
    } else if (dailyProduction >= req.daily) {
      score += 2;
    } else if (dailyProduction >= req.daily * 0.5) {
      score += 1;
    }

    // Inverter coverage (0-2 points)
    if (inverterWatts <= 0) {
      score += 0;
    } else if (inverterWatts >= req.peak) {
      score += 2;
    } else if (inverterWatts >= req.peak * 0.5) {
      score += 1;
    }

    // Completeness bonus (0-1 point)
    if (completeness >= 80) score += 1;

    // Chemistry penalty for AGM in demanding use cases
    if (chemistry === "AGM" && (uc === "homestead" || uc === "emergency")) {
      score = Math.max(0, score - 1);
    }

    // Map score to rating (max 8)
    if (score >= 7) ratings[uc] = "excellent";
    else if (score >= 5) ratings[uc] = "good";
    else if (score >= 3) ratings[uc] = "fair";
    else ratings[uc] = "poor";
  }

  return ratings;
}

/**
 * Fetch all active kits with current prices and coverage data.
 * Returns Kit[] matching the demo-data interface shape.
 */
export async function getKitsForListing(useCaseSlug = "rv-weekend"): Promise<Kit[]> {
  // Get the use case ID
  const [useCase] = await db
    .select({ id: s.useCases.id })
    .from(s.useCases)
    .where(eq(s.useCases.slug, useCaseSlug))
    .limit(1);

  if (!useCase) return [];

  // Main query: kits + brand + cheapest current price + total cost
  const rows = await db.execute(sql`
    WITH cheapest_offer AS (
      SELECT DISTINCT ON (kcp.kit_id)
        kcp.kit_id,
        kcp.offer_id,
        kcp.total_known_cents,
        kcp.price_cents,
        kcp.observed_at,
        r.name AS retailer_name,
        r.slug AS retailer_slug,
        ko.source_url
      FROM kit_current_prices kcp
      JOIN retailers r ON r.id = kcp.retailer_id
      JOIN kit_offers ko ON ko.id = kcp.offer_id
      WHERE kcp.in_stock IS TRUE
      ORDER BY kcp.kit_id, kcp.total_known_cents ASC NULLS LAST, kcp.observed_at DESC
    )
    SELECT
      k.id,
      k.slug,
      k.title,
      k.nominal_system_voltage_v,
      k.panel_array_w,
      k.battery_total_wh,
      k.battery_usable_wh,
      k.inverter_continuous_w,
      k.inverter_surge_w,
      k.chemistry,
      k.image_url,
      k.includes_panels,
      k.includes_batteries,
      k.includes_inverter,
      k.includes_controller,
      b.name AS brand_name,
      co.total_known_cents AS list_price_cents,
      co.price_cents,
      co.observed_at AS price_observed_at,
      co.retailer_name,
      co.retailer_slug,
      co.source_url,
      ktc.missing_components_cents,
      COALESCE(co.total_known_cents, ktc.base_offer_price_cents, 0) + COALESCE(ktc.missing_components_cents, 0) AS total_before_tax_cents,
      ktc.completeness_score
    FROM kits k
    LEFT JOIN brands b ON b.id = k.brand_id
    LEFT JOIN cheapest_offer co ON co.kit_id = k.id
    LEFT JOIN kit_total_cost_current ktc
      ON ktc.kit_id = k.id AND ktc.use_case_id = ${useCase.id}
    WHERE k.is_active = TRUE
    ORDER BY co.total_known_cents ASC NULLS LAST, k.panel_array_w DESC
  `);

  // For each kit, fetch coverage data to build included/items
  const kits: Kit[] = [];

  for (const row of rows.rows) {
    const kitId = row.id as string;
    const listedPrice = Math.round(Number(row.list_price_cents ?? 0) / 100);
    const missingCost = Math.round(Number(row.missing_components_cents ?? 0) / 100);
    const trueCost = Math.round(Number(row.total_before_tax_cents ?? 0) / 100);
    const storageWh = Number(row.battery_usable_wh ?? 0);
    const panelWatts = Number(row.panel_array_w ?? 0);

    // Fetch coverage rows with recommended product info + live prices
    const coverageResult = await db.execute(sql`
      SELECT
        krc.status,
        cr.code AS role_code,
        krc.included_quantity,
        krc.missing_quantity,
        COALESCE(pcp.total_known_cents, krc.recommended_cost_cents) AS recommended_cost_cents,
        krc.notes,
        p.title AS rec_product_title,
        b.name AS rec_brand_name,
        po.asin AS rec_asin
      FROM kit_role_coverage krc
      INNER JOIN component_roles cr ON cr.id = krc.component_role_id
      LEFT JOIN products p ON p.id = krc.recommended_product_id
      LEFT JOIN brands b ON b.id = p.brand_id
      LEFT JOIN product_offers po ON po.id = krc.recommended_offer_id
      LEFT JOIN product_current_prices pcp ON pcp.offer_id = krc.recommended_offer_id
      WHERE krc.kit_id = ${kitId} AND krc.use_case_id = ${useCase.id}
    `);
    const coverage = coverageResult.rows.map((r) => ({
      status: r.status as string,
      roleCode: r.role_code as string,
      includedQuantity: r.included_quantity as number | null,
      missingQuantity: r.missing_quantity as number | null,
      recommendedCostCents: r.recommended_cost_cents as number | null,
      notes: r.notes as string | null,
      recProductTitle: r.rec_product_title as string | null,
      recBrandName: r.rec_brand_name as string | null,
      recAsin: r.rec_asin as string | null,
    }));

    // Fetch kit items (included components with detail)
    const items = await db
      .select({
        roleCode: s.componentRoles.code,
        quantity: s.kitItems.quantity,
        unitLabel: s.kitItems.unitLabel,
        notes: s.kitItems.notes,
        sortOrder: s.kitItems.sortOrder,
      })
      .from(s.kitItems)
      .innerJoin(s.componentRoles, eq(s.componentRoles.id, s.kitItems.componentRoleId))
      .where(eq(s.kitItems.kitId, kitId))
      .orderBy(asc(s.kitItems.sortOrder));

    // Build included map
    const included: Record<string, boolean> = {};
    for (const cov of coverage) {
      const key = ROLE_TO_INCLUDED_KEY[cov.roleCode];
      if (key) {
        included[key] = cov.status === "included";
      }
    }

    // Build items list (included + missing)
    const kitItems: KitItem[] = [];

    // Add included items from kit_items
    for (const item of items) {
      kitItems.push({
        role: ROLE_LABELS[item.roleCode] ?? item.roleCode,
        isIncluded: true,
        name: item.unitLabel ?? "Included",
        specs: item.notes ?? "",
        quantity: Number(item.quantity),
      });
    }

    // Add missing items from coverage (with recommended product if available)
    for (const cov of coverage) {
      if (cov.status === "missing") {
        kitItems.push({
          role: ROLE_LABELS[cov.roleCode] ?? cov.roleCode,
          isIncluded: false,
          name: cov.recProductTitle ?? "Not included",
          specs: cov.notes ?? "",
          quantity: Number(cov.missingQuantity ?? 1),
          estimatedCost: cov.recommendedCostCents
            ? Math.round(cov.recommendedCostCents / 100)
            : undefined,
          recommendedAsin: cov.recAsin ?? undefined,
          recommendedBrand: cov.recBrandName ?? undefined,
        });
      }
    }

    // Recompute missing cost from live prices (overrides stale DB value)
    const liveMissingCost = kitItems
      .filter((i) => !i.isIncluded && i.estimatedCost)
      .reduce((sum, i) => sum + (i.estimatedCost ?? 0), 0);
    const finalMissingCost = liveMissingCost > 0 ? liveMissingCost : missingCost;
    const finalTrueCost = listedPrice + finalMissingCost;

    // Cost per Wh and cost per W
    const costPerWh =
      storageWh > 0 ? `$${(finalTrueCost / storageWh).toFixed(2)}` : "N/A";
    const costPerW =
      panelWatts > 0 ? `$${(finalTrueCost / panelWatts).toFixed(2)}` : "N/A";

    // Fetch all retailer offers for this kit
    const allOffersResult = await db.execute(sql`
      SELECT kcp.total_known_cents, kcp.in_stock, kcp.observed_at,
             r.name AS retailer_name, r.slug AS retailer_slug,
             ko.source_url
      FROM kit_current_prices kcp
      JOIN retailers r ON r.id = kcp.retailer_id
      JOIN kit_offers ko ON ko.id = kcp.offer_id
      WHERE kcp.kit_id = ${kitId} AND kcp.in_stock IS TRUE
      ORDER BY kcp.total_known_cents ASC
    `);
    const offers = allOffersResult.rows.map((o) => ({
      retailer: o.retailer_name as string,
      retailerSlug: o.retailer_slug as string,
      price: Math.round(Number(o.total_known_cents ?? 0) / 100),
      sourceUrl: o.source_url as string | undefined,
      inStock: o.in_stock as boolean,
      observedAt: o.observed_at
        ? new Date(o.observed_at as string).toISOString()
        : new Date().toISOString(),
    }));

    kits.push({
      id: kitId,
      slug: row.slug as string,
      name: row.title as string,
      displayName: row.title as string,
      imageUrl: (row.image_url as string) ?? undefined,
      brand: (row.brand_name as string) ?? "Unknown",
      listedPrice,
      missingCost: finalMissingCost,
      trueCost: finalTrueCost,
      panelWatts,
      storageWh,
      inverterWatts: Number(row.inverter_continuous_w ?? 0),
      voltage: Number(row.nominal_system_voltage_v ?? 12),
      chemistry: (row.chemistry as string) ?? "Unknown",
      costPerWh,
      costPerW,
      useCases: Object.entries(
        computeUseCaseRatings({ storageWh, panelWatts, inverterWatts: Number(row.inverter_continuous_w ?? 0), completeness: Number(row.completeness_score ?? 0), chemistry: (row.chemistry as string) ?? "Unknown" })
      ).filter(([, r]) => r === "excellent" || r === "good").map(([uc]) => uc),
      useCaseRatings: computeUseCaseRatings({ storageWh, panelWatts, inverterWatts: Number(row.inverter_continuous_w ?? 0), completeness: Number(row.completeness_score ?? 0), chemistry: (row.chemistry as string) ?? "Unknown" }),
      included,
      priceObservedAt: row.price_observed_at
        ? new Date(row.price_observed_at as string).toISOString()
        : new Date().toISOString(),
      retailer: (row.retailer_name as string) ?? "Unknown",
      retailerSlug: (row.retailer_slug as string) ?? undefined,
      sourceUrl: row.source_url as string | undefined,
      completeness: Number(row.completeness_score ?? 0),
      items: kitItems,
      offers: offers.length > 1 ? offers : undefined,
    });
  }

  return kits;
}

/**
 * Fetch per-retailer price history series for a kit.
 * Returns one series per offer, each with daily price points.
 * Used for multi-series chart rendering and public/data/history/ files.
 */
export async function getPriceHistoryBySeries(kitId: string): Promise<import("../demo-data").KitPriceHistory | null> {
  const rows = await db.execute(sql`
    SELECT
      ko.id AS offer_id,
      r.name AS retailer_name,
      r.slug AS retailer_slug,
      DATE(kpe.observed_at AT TIME ZONE 'UTC') AS obs_date,
      MIN(kpe.price_cents) AS price_cents,
      BOOL_OR(kpe.in_stock) AS in_stock
    FROM kit_price_events kpe
    JOIN kit_offers ko ON ko.id = kpe.offer_id
    JOIN retailers r ON r.id = ko.retailer_id
    WHERE ko.kit_id = ${kitId}
      AND kpe.price_cents IS NOT NULL
    GROUP BY ko.id, r.name, r.slug, DATE(kpe.observed_at AT TIME ZONE 'UTC')
    ORDER BY ko.id, obs_date ASC
  `);

  if (rows.rows.length === 0) return null;

  // Group rows into per-offer series
  const seriesMap = new Map<string, import("../demo-data").PriceHistorySeries>();
  for (const r of rows.rows) {
    const offerId = r.offer_id as string;
    if (!seriesMap.has(offerId)) {
      seriesMap.set(offerId, {
        offerId,
        retailerName: r.retailer_name as string,
        retailerSlug: r.retailer_slug as string,
        points: [],
      });
    }
    seriesMap.get(offerId)!.points.push({
      date: r.obs_date as string,
      priceCents: r.price_cents != null ? Number(r.price_cents) : null,
      inStock: Boolean(r.in_stock),
    });
  }

  const series = Array.from(seriesMap.values());

  // Compute lowestAvailable: daily MIN across in-stock offers
  const dateMap = new Map<string, number>();
  for (const s of series) {
    for (const pt of s.points) {
      if (pt.inStock && pt.priceCents != null) {
        const existing = dateMap.get(pt.date);
        if (existing == null || pt.priceCents < existing) {
          dateMap.set(pt.date, pt.priceCents);
        }
      }
    }
  }
  const lowestAvailable = Array.from(dateMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, priceCents]) => ({ date, priceCents }));

  return { slug: kitId, series, lowestAvailable };
}

/**
 * Fetch price history from kit_price_events for a given kit.
 * Returns daily price points sorted chronologically.
 */
async function getPriceHistory(kitId: string): Promise<PriceHistoryPoint[]> {
  const rows = await db.execute(sql`
    SELECT
      DATE(kpe.observed_at AT TIME ZONE 'UTC') AS obs_date,
      MIN(kpe.price_cents) AS price_cents
    FROM kit_price_events kpe
    JOIN kit_offers ko ON ko.id = kpe.offer_id
    WHERE ko.kit_id = ${kitId}
      AND kpe.price_cents IS NOT NULL
    GROUP BY DATE(kpe.observed_at AT TIME ZONE 'UTC')
    ORDER BY obs_date ASC
  `);

  return rows.rows.map((r) => ({
    date: (r.obs_date as string),
    priceCents: Number(r.price_cents),
  }));
}

/**
 * Generate synthetic price history when real data is sparse.
 * Deterministic based on kit price (seeded by price value).
 */
function generateSyntheticHistory(
  currentPriceCents: number,
  days: number,
): PriceHistoryPoint[] {
  const points: PriceHistoryPoint[] = [];
  const now = Date.now();

  // Simple seeded PRNG based on price for determinism
  let seed = currentPriceCents;
  const rand = () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };

  let price = currentPriceCents;
  const prices: number[] = [price];

  for (let d = 1; d < days; d++) {
    const noise = (rand() - 0.5) * 2 * 0.015 * price;
    const reversion = (currentPriceCents - price) * 0.01;
    price = price - noise + reversion;
    // Occasional sale
    if (d % 45 < 2) price *= 0.96;
    prices.push(Math.round(price));
  }

  prices.reverse();

  for (let i = 0; i < prices.length; i++) {
    const date = new Date(now - (days - 1 - i) * 24 * 60 * 60 * 1000);
    points.push({
      date: date.toISOString().split("T")[0],
      priceCents: prices[i],
    });
  }

  return points;
}

/**
 * Fetch all active kits with price history included.
 */
export async function getKitsForListingWithHistory(useCaseSlug = "rv-weekend"): Promise<Kit[]> {
  const kits = await getKitsForListing(useCaseSlug);

  for (const kit of kits) {
    const real = await getPriceHistory(kit.id);
    if (real.length >= 7) {
      kit.priceHistory = real;
    } else {
      // Generate synthetic history until real data accumulates
      kit.priceHistory = generateSyntheticHistory(kit.listedPrice * 100, 180);
    }
  }

  return kits;
}

/**
 * Fetch a single kit by slug with full decomposition data.
 */
export async function getKitBySlug(slug: string, useCaseSlug = "rv-weekend"): Promise<Kit | null> {
  const kits = await getKitsForListing(useCaseSlug);
  return kits.find((k) => k.slug === slug) ?? null;
}
