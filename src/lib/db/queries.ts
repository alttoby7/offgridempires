/**
 * Database query functions for kit data.
 * These produce the same shape as demo-data.ts Kit interface,
 * making it easy to swap between demo data and real DB data.
 */

import { db } from "./index";
import { eq, sql, desc, asc } from "drizzle-orm";
import * as s from "./schema";
import type { Kit, KitItem } from "../demo-data";

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
        r.name AS retailer_name
      FROM kit_current_prices kcp
      JOIN retailers r ON r.id = kcp.retailer_id
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
      k.includes_panels,
      k.includes_batteries,
      k.includes_inverter,
      k.includes_controller,
      b.name AS brand_name,
      co.total_known_cents AS list_price_cents,
      co.price_cents,
      co.observed_at AS price_observed_at,
      co.retailer_name,
      ktc.base_offer_price_cents,
      ktc.missing_components_cents,
      ktc.total_before_tax_cents,
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

    // Fetch coverage rows
    const coverage = await db
      .select({
        status: s.kitRoleCoverage.status,
        roleCode: s.componentRoles.code,
        includedQuantity: s.kitRoleCoverage.includedQuantity,
        missingQuantity: s.kitRoleCoverage.missingQuantity,
        recommendedCostCents: s.kitRoleCoverage.recommendedCostCents,
        notes: s.kitRoleCoverage.notes,
      })
      .from(s.kitRoleCoverage)
      .innerJoin(s.componentRoles, eq(s.componentRoles.id, s.kitRoleCoverage.componentRoleId))
      .where(
        sql`${s.kitRoleCoverage.kitId} = ${kitId} AND ${s.kitRoleCoverage.useCaseId} = ${useCase.id}`
      );

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

    // Add missing items from coverage
    for (const cov of coverage) {
      if (cov.status === "missing") {
        kitItems.push({
          role: ROLE_LABELS[cov.roleCode] ?? cov.roleCode,
          isIncluded: false,
          name: "Not included",
          specs: cov.notes ?? "",
          quantity: Number(cov.missingQuantity ?? 1),
          estimatedCost: cov.recommendedCostCents
            ? Math.round(cov.recommendedCostCents / 100)
            : undefined,
        });
      }
    }

    // Cost per Wh
    const costPerWh =
      storageWh > 0 ? `$${(trueCost / storageWh).toFixed(2)}` : "N/A";

    kits.push({
      id: kitId,
      slug: row.slug as string,
      name: row.title as string,
      brand: (row.brand_name as string) ?? "Unknown",
      listedPrice,
      missingCost,
      trueCost,
      panelWatts,
      storageWh,
      inverterWatts: Number(row.inverter_continuous_w ?? 0),
      voltage: Number(row.nominal_system_voltage_v ?? 12),
      chemistry: (row.chemistry as string) ?? "Unknown",
      costPerWh,
      useCases: [], // TODO: populate from kit_role_coverage across use cases
      useCaseRatings: {}, // TODO: compute from coverage scores
      included,
      priceObservedAt: row.price_observed_at
        ? new Date(row.price_observed_at as string).toISOString()
        : new Date().toISOString(),
      retailer: (row.retailer_name as string) ?? "Unknown",
      completeness: Number(row.completeness_score ?? 0),
      items: kitItems,
    });
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
