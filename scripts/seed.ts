/**
 * Seed script for OffGridEmpire database.
 * Populates brands, retailers, component roles, use cases, products,
 * kits, kit items, offers, and initial price events from demo data.
 *
 * Run: npx tsx scripts/seed.ts
 */

import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { eq } from "drizzle-orm";
import * as dotenv from "dotenv";
import * as crypto from "crypto";
import * as schema from "../src/lib/db/schema";

dotenv.config({ path: "../../google-drive/0-AI/.env" });

const pool = new Pool({
  connectionString: process.env.OFFGRID_DATABASE_URL,
  ssl: false,
});

const db = drizzle(pool, { schema });

// ── Reference Data ─────────────────────────────────────────────────────────────

const BRANDS = [
  { name: "Renogy", slug: "renogy" },
  { name: "Eco-Worthy", slug: "eco-worthy" },
  { name: "EcoFlow", slug: "ecoflow" },
  { name: "Bluetti", slug: "bluetti" },
  { name: "WindyNation", slug: "windynation" },
  { name: "Goal Zero", slug: "goal-zero" },
  { name: "Jackery", slug: "jackery" },
  { name: "EG4", slug: "eg4" },
];

const RETAILERS = [
  { name: "Amazon", slug: "amazon", retailerType: "amazon" as const },
  { name: "Renogy Direct", slug: "renogy-direct", retailerType: "direct" as const },
  { name: "EcoFlow Direct", slug: "ecoflow-direct", retailerType: "direct" as const },
  { name: "Bluetti Direct", slug: "bluetti-direct", retailerType: "direct" as const },
  { name: "Signature Solar", slug: "signature-solar", retailerType: "direct" as const },
  { name: "Shop Solar Kits", slug: "shop-solar-kits", retailerType: "direct" as const },
];

const COMPONENT_ROLES: { code: (typeof schema.componentRoleCodeEnum.enumValues)[number]; label: string; description: string }[] = [
  { code: "panel_array", label: "Solar Panels", description: "Photovoltaic panels that generate electricity from sunlight" },
  { code: "battery_bank", label: "Battery", description: "Energy storage for use when panels aren't producing" },
  { code: "inverter", label: "Inverter", description: "Converts DC to AC power for household appliances" },
  { code: "charge_controller", label: "Charge Controller", description: "Regulates charging from panels to battery" },
  { code: "mounting_hardware", label: "Mounting", description: "Brackets and rails for panel installation" },
  { code: "wiring_kit", label: "Wiring", description: "Cables, connectors, and wiring harnesses" },
  { code: "fuse_or_breaker", label: "Fuse/Breaker", description: "Overcurrent protection" },
  { code: "combiner_box", label: "Combiner Box", description: "Combines multiple panel strings" },
  { code: "monitoring", label: "Monitoring", description: "Bluetooth, WiFi, or app-based system monitoring" },
  { code: "grounding", label: "Grounding", description: "Ground fault protection and grounding equipment" },
  { code: "transfer_switch", label: "Transfer Switch", description: "Switches between grid and solar/battery power" },
  { code: "generator_input", label: "Generator Input", description: "Input for backup generator charging" },
  { code: "other", label: "Other", description: "Miscellaneous components" },
];

const USE_CASES = [
  {
    slug: "rv-weekend",
    label: "RV & Van Life",
    description: "Weekend RV trips with moderate power needs — lights, phone charging, small fridge, laptop",
    defaultDailyLoadWh: "1500.00",
    defaultPeakW: "1000.00",
    nominalVoltageV: "12.00",
    autonomyHours: "24.00",
  },
  {
    slug: "cabin-backup",
    label: "Weekend Cabin",
    description: "Off-grid cabin with lights, fridge, water pump, occasional power tools",
    defaultDailyLoadWh: "3000.00",
    defaultPeakW: "2000.00",
    nominalVoltageV: "12.00",
    autonomyHours: "48.00",
  },
  {
    slug: "shed-light-duty",
    label: "Shed & Workshop",
    description: "Shed lighting, radio, phone charging, occasional tool charging",
    defaultDailyLoadWh: "500.00",
    defaultPeakW: "500.00",
    nominalVoltageV: "12.00",
    autonomyHours: "12.00",
  },
  {
    slug: "emergency",
    label: "Emergency Backup",
    description: "Emergency/disaster power — fridge, medical devices, communications, lighting",
    defaultDailyLoadWh: "2000.00",
    defaultPeakW: "3000.00",
    nominalVoltageV: "12.00",
    autonomyHours: "72.00",
  },
  {
    slug: "homestead",
    label: "Full-Time Homestead",
    description: "Full-time off-grid living — all household loads, water pump, washer, well pump",
    defaultDailyLoadWh: "8000.00",
    defaultPeakW: "5000.00",
    nominalVoltageV: "48.00",
    autonomyHours: "72.00",
  },
  {
    slug: "boat-marine",
    label: "Boat & Marine",
    description: "Marine use — navigation electronics, lights, small fridge, bilge pump",
    defaultDailyLoadWh: "1000.00",
    defaultPeakW: "800.00",
    nominalVoltageV: "12.00",
    autonomyHours: "24.00",
  },
];

// ── Kit seed data (maps to demo-data.ts) ───────────────────────────────────────

interface SeedKit {
  slug: string;
  title: string;
  brand: string;
  retailer: string;
  listedPriceCents: number;
  voltage: number;
  panelW: number;
  batteryTotalWh: number;
  batteryUsableWh: number;
  inverterW: number;
  inverterSurgeW: number;
  chemistry: string;
  includesPanels: boolean;
  includesBatteries: boolean;
  includesInverter: boolean;
  includesController: boolean;
  sourceUrl: string;
  items: {
    roleCode: string;
    isIncluded: boolean;
    name: string;
    specs: string;
    quantity: number;
    estimatedCostCents?: number;
    notes?: string;
  }[];
}

const SEED_KITS: SeedKit[] = [
  {
    slug: "renogy-400w-complete-lifepo4",
    title: "Renogy 400W 12V Complete Solar Kit with 200Ah LiFePO4",
    brand: "Renogy",
    retailer: "Amazon",
    listedPriceCents: 189900,
    voltage: 12,
    panelW: 400,
    batteryTotalWh: 2560,
    batteryUsableWh: 2560,
    inverterW: 2000,
    inverterSurgeW: 4000,
    chemistry: "LiFePO4",
    includesPanels: true,
    includesBatteries: true,
    includesInverter: true,
    includesController: true,
    sourceUrl: "https://amazon.com/dp/B0EXAMPLE1",
    items: [
      { roleCode: "panel_array", isIncluded: true, name: "Renogy 100W 12V Mono", specs: "4x 100W = 400W total", quantity: 4 },
      { roleCode: "charge_controller", isIncluded: true, name: "Renogy Rover 40A MPPT", specs: "40A, 12/24V auto", quantity: 1 },
      { roleCode: "battery_bank", isIncluded: true, name: "Renogy 200Ah 12V LiFePO4", specs: "2,560Wh, 4000 cycles", quantity: 1 },
      { roleCode: "inverter", isIncluded: true, name: "Renogy 2000W Pure Sine", specs: "2000W cont / 4000W peak", quantity: 1 },
      { roleCode: "wiring_kit", isIncluded: true, name: "MC4 cables + battery cables", specs: "20ft MC4, 6AWG battery", quantity: 1 },
      { roleCode: "mounting_hardware", isIncluded: true, name: "Z-bracket mounts", specs: "Roof mount, aluminum", quantity: 4 },
      { roleCode: "monitoring", isIncluded: true, name: "BT-2 Bluetooth Module", specs: "App monitoring", quantity: 1 },
    ],
  },
  {
    slug: "eco-worthy-200w-starter",
    title: "Eco-Worthy 200W 12V Solar Starter Kit",
    brand: "Eco-Worthy",
    retailer: "Amazon",
    listedPriceCents: 28900,
    voltage: 12,
    panelW: 200,
    batteryTotalWh: 0,
    batteryUsableWh: 0,
    inverterW: 0,
    inverterSurgeW: 0,
    chemistry: "None",
    includesPanels: true,
    includesBatteries: false,
    includesInverter: false,
    includesController: true,
    sourceUrl: "https://amazon.com/dp/B0EXAMPLE2",
    items: [
      { roleCode: "panel_array", isIncluded: true, name: "Eco-Worthy 100W Mono", specs: "2x 100W = 200W total", quantity: 2 },
      { roleCode: "charge_controller", isIncluded: true, name: "Eco-Worthy 30A PWM", specs: "30A PWM (not MPPT)", quantity: 1, notes: "PWM — less efficient than MPPT" },
      { roleCode: "battery_bank", isIncluded: false, name: "Not included", specs: "Need 12V 100Ah+", quantity: 1, estimatedCostCents: 30000 },
      { roleCode: "inverter", isIncluded: false, name: "Not included", specs: "Need 1000W+ pure sine", quantity: 1, estimatedCostCents: 20000 },
      { roleCode: "wiring_kit", isIncluded: true, name: "MC4 cables", specs: "10ft MC4", quantity: 1 },
      { roleCode: "mounting_hardware", isIncluded: true, name: "Z-brackets", specs: "Roof mount", quantity: 2 },
      { roleCode: "monitoring", isIncluded: false, name: "Not included", specs: "Optional BT module", quantity: 0, estimatedCostCents: 2500 },
    ],
  },
  {
    slug: "ecoflow-delta-pro-400w",
    title: "EcoFlow DELTA Pro + 400W Solar Panel",
    brand: "EcoFlow",
    retailer: "EcoFlow Direct",
    listedPriceCents: 429900,
    voltage: 48,
    panelW: 400,
    batteryTotalWh: 3600,
    batteryUsableWh: 3600,
    inverterW: 3600,
    inverterSurgeW: 7200,
    chemistry: "LiFePO4",
    includesPanels: true,
    includesBatteries: true,
    includesInverter: true,
    includesController: true,
    sourceUrl: "https://ecoflow.com/delta-pro-400w-bundle",
    items: [
      { roleCode: "panel_array", isIncluded: true, name: "EcoFlow 400W Portable Panel", specs: "400W folding, 22.6% eff", quantity: 1 },
      { roleCode: "charge_controller", isIncluded: true, name: "Built-in MPPT", specs: "Integrated in DELTA Pro", quantity: 1 },
      { roleCode: "battery_bank", isIncluded: true, name: "DELTA Pro LiFePO4", specs: "3,600Wh, expandable to 25kWh", quantity: 1 },
      { roleCode: "inverter", isIncluded: true, name: "Built-in Pure Sine", specs: "3600W / 7200W peak", quantity: 1 },
      { roleCode: "wiring_kit", isIncluded: true, name: "XT60 solar cable", specs: "Included", quantity: 1 },
      { roleCode: "mounting_hardware", isIncluded: false, name: "Not included", specs: "Panel is portable/folding", quantity: 0, estimatedCostCents: 0, notes: "Portable panel — no mounting needed" },
      { roleCode: "monitoring", isIncluded: true, name: "EcoFlow App", specs: "WiFi + BT monitoring", quantity: 1 },
    ],
  },
  {
    slug: "bluetti-ac300-b300-pv350",
    title: "Bluetti AC300 + B300 + PV350 Solar Panel",
    brand: "Bluetti",
    retailer: "Amazon",
    listedPriceCents: 379900,
    voltage: 48,
    panelW: 350,
    batteryTotalWh: 3072,
    batteryUsableWh: 3072,
    inverterW: 3000,
    inverterSurgeW: 6000,
    chemistry: "LiFePO4",
    includesPanels: true,
    includesBatteries: true,
    includesInverter: true,
    includesController: true,
    sourceUrl: "https://amazon.com/dp/B0EXAMPLE4",
    items: [
      { roleCode: "panel_array", isIncluded: true, name: "Bluetti PV350", specs: "350W portable, 23.4% eff", quantity: 1 },
      { roleCode: "charge_controller", isIncluded: true, name: "Built-in MPPT", specs: "Integrated in AC300", quantity: 1 },
      { roleCode: "battery_bank", isIncluded: true, name: "Bluetti B300 LiFePO4", specs: "3,072Wh, 3500+ cycles", quantity: 1 },
      { roleCode: "inverter", isIncluded: true, name: "Built-in Pure Sine", specs: "3000W / 6000W peak, split-phase 240V", quantity: 1 },
      { roleCode: "wiring_kit", isIncluded: true, name: "Solar + battery cables", specs: "Included", quantity: 1 },
      { roleCode: "mounting_hardware", isIncluded: false, name: "Not included", specs: "Portable panel", quantity: 0, estimatedCostCents: 0 },
      { roleCode: "monitoring", isIncluded: true, name: "Bluetti App", specs: "WiFi + BT", quantity: 1 },
    ],
  },
  {
    slug: "windynation-400w-complete",
    title: "WindyNation 400W Complete Off-Grid Kit",
    brand: "WindyNation",
    retailer: "Amazon",
    listedPriceCents: 114900,
    voltage: 12,
    panelW: 400,
    batteryTotalWh: 2400,
    batteryUsableWh: 1200,
    inverterW: 1500,
    inverterSurgeW: 3000,
    chemistry: "AGM",
    includesPanels: true,
    includesBatteries: true,
    includesInverter: true,
    includesController: true,
    sourceUrl: "https://amazon.com/dp/B0EXAMPLE5",
    items: [
      { roleCode: "panel_array", isIncluded: true, name: "WindyNation 100W Poly", specs: "4x 100W = 400W total", quantity: 4 },
      { roleCode: "charge_controller", isIncluded: true, name: "WindyNation P30L PWM", specs: "30A PWM", quantity: 1, notes: "PWM — less efficient" },
      { roleCode: "battery_bank", isIncluded: true, name: "WindyNation 100Ah AGM", specs: "2x 100Ah AGM = 1,200Wh usable", quantity: 2, notes: "AGM — 50% DoD, shorter cycle life" },
      { roleCode: "inverter", isIncluded: true, name: "VertaMax 1500W", specs: "1500W modified sine", quantity: 1, notes: "Modified sine — not safe for sensitive electronics" },
      { roleCode: "wiring_kit", isIncluded: true, name: "MC4 + battery cables", specs: "Included", quantity: 1 },
      { roleCode: "mounting_hardware", isIncluded: false, name: "Not included", specs: "Need roof or ground mount", quantity: 1, estimatedCostCents: 8000 },
      { roleCode: "monitoring", isIncluded: false, name: "Not included", specs: "Basic LCD on controller only", quantity: 0, estimatedCostCents: 3000 },
    ],
  },
  {
    slug: "renogy-800w-cabin-kit",
    title: "Renogy 800W 12V Solar Cabin Kit",
    brand: "Renogy",
    retailer: "Renogy Direct",
    listedPriceCents: 159900,
    voltage: 12,
    panelW: 800,
    batteryTotalWh: 0,
    batteryUsableWh: 0,
    inverterW: 0,
    inverterSurgeW: 0,
    chemistry: "None",
    includesPanels: true,
    includesBatteries: false,
    includesInverter: false,
    includesController: true,
    sourceUrl: "https://renogy.com/800w-cabin-kit",
    items: [
      { roleCode: "panel_array", isIncluded: true, name: "Renogy 200W 12V Mono", specs: "4x 200W = 800W total", quantity: 4 },
      { roleCode: "charge_controller", isIncluded: true, name: "Renogy Rover 60A MPPT", specs: "60A MPPT, BT", quantity: 1 },
      { roleCode: "battery_bank", isIncluded: false, name: "Not included", specs: "Need 200Ah+ LiFePO4 12V", quantity: 1, estimatedCostCents: 60000 },
      { roleCode: "inverter", isIncluded: false, name: "Not included", specs: "Need 3000W+ pure sine", quantity: 1, estimatedCostCents: 30000 },
      { roleCode: "wiring_kit", isIncluded: true, name: "Full cable kit", specs: "MC4, battery, tray cables", quantity: 1 },
      { roleCode: "mounting_hardware", isIncluded: true, name: "Z-bracket kit", specs: "8x Z-brackets for roof", quantity: 8 },
      { roleCode: "monitoring", isIncluded: true, name: "BT-2 Bluetooth Module", specs: "App monitoring", quantity: 1 },
    ],
  },
];

// ── Seed Functions ─────────────────────────────────────────────────────────────

async function seedBrands() {
  console.log("Seeding brands...");
  const rows = await db
    .insert(schema.brands)
    .values(BRANDS)
    .onConflictDoNothing()
    .returning();
  // Fetch all to get IDs for existing + new
  const all = await db.select().from(schema.brands);
  console.log(`  ${all.length} brands`);
  return new Map(all.map((b) => [b.name, b.id]));
}

async function seedRetailers() {
  console.log("Seeding retailers...");
  await db
    .insert(schema.retailers)
    .values(RETAILERS)
    .onConflictDoNothing();
  const all = await db.select().from(schema.retailers);
  console.log(`  ${all.length} retailers`);
  return new Map(all.map((r) => [r.name, r.id]));
}

async function seedComponentRoles() {
  console.log("Seeding component roles...");
  await db
    .insert(schema.componentRoles)
    .values(COMPONENT_ROLES)
    .onConflictDoNothing();
  const all = await db.select().from(schema.componentRoles);
  console.log(`  ${all.length} component roles`);
  return new Map(all.map((r) => [r.code, r.id]));
}

async function seedUseCases() {
  console.log("Seeding use cases...");
  await db
    .insert(schema.useCases)
    .values(USE_CASES)
    .onConflictDoNothing();
  const all = await db.select().from(schema.useCases);
  console.log(`  ${all.length} use cases`);
  return new Map(all.map((u) => [u.slug, u.id]));
}

async function seedKits(
  brandMap: Map<string, string>,
  retailerMap: Map<string, string>,
  roleMap: Map<string, string>,
  useCaseMap: Map<string, string>
) {
  console.log("Seeding kits...");
  const now = new Date();

  for (const seedKit of SEED_KITS) {
    const brandId = brandMap.get(seedKit.brand);
    const retailerId = retailerMap.get(seedKit.retailer);
    if (!brandId || !retailerId) {
      console.error(`  Missing brand=${seedKit.brand} or retailer=${seedKit.retailer}, skipping ${seedKit.slug}`);
      continue;
    }

    // Insert kit
    const [kit] = await db
      .insert(schema.kits)
      .values({
        brandId,
        title: seedKit.title,
        slug: seedKit.slug,
        nominalSystemVoltageV: seedKit.voltage.toFixed(2),
        panelArrayW: seedKit.panelW.toFixed(2),
        batteryTotalWh: seedKit.batteryTotalWh.toFixed(2),
        batteryUsableWh: seedKit.batteryUsableWh.toFixed(2),
        inverterContinuousW: seedKit.inverterW.toFixed(2),
        inverterSurgeW: seedKit.inverterSurgeW.toFixed(2),
        chemistry: seedKit.chemistry,
        includesPanels: seedKit.includesPanels,
        includesBatteries: seedKit.includesBatteries,
        includesInverter: seedKit.includesInverter,
        includesController: seedKit.includesController,
      })
      .onConflictDoNothing()
      .returning();

    if (!kit) {
      console.log(`  Kit ${seedKit.slug} already exists, skipping`);
      continue;
    }

    // Insert kit items (included components only for now — missing ones go to coverage)
    for (let i = 0; i < seedKit.items.length; i++) {
      const item = seedKit.items[i];
      const roleId = roleMap.get(item.roleCode);
      if (!roleId) continue;

      if (item.isIncluded) {
        await db.insert(schema.kitItems).values({
          kitId: kit.id,
          componentRoleId: roleId,
          quantity: item.quantity.toFixed(2),
          unitLabel: item.name,
          sortOrder: (i + 1) * 10,
          notes: item.notes ?? `${item.name} — ${item.specs}`,
        });
      }
    }

    // Insert kit offer
    const [offer] = await db
      .insert(schema.kitOffers)
      .values({
        kitId: kit.id,
        retailerId,
        sourceUrl: seedKit.sourceUrl,
        canonicalUrl: seedKit.sourceUrl,
        titleOnPage: seedKit.title,
      })
      .returning();

    // Insert initial price event
    const payloadHash = crypto
      .createHash("sha256")
      .update(JSON.stringify({ price: seedKit.listedPriceCents, ts: now.toISOString() }))
      .digest("hex")
      .slice(0, 16);

    const [priceEvent] = await db
      .insert(schema.kitPriceEvents)
      .values({
        offerId: offer.id,
        observedAt: now,
        sourceType: "manual",
        priceCents: seedKit.listedPriceCents,
        shippingCents: 0,
        inStock: true,
        rawPayloadHash: payloadHash,
        rawPayload: { source: "seed", price: seedKit.listedPriceCents },
      })
      .returning();

    // Read back total_known_cents from DB (generated column)
    const totalKnownCents = seedKit.listedPriceCents; // shipping=0, no surcharge/coupon

    // Insert current price snapshot
    await db.insert(schema.kitCurrentPrices).values({
      offerId: offer.id,
      kitId: kit.id,
      retailerId,
      latestEventId: priceEvent.id,
      observedAt: now,
      currencyCode: "USD",
      priceCents: seedKit.listedPriceCents,
      shippingCents: 0,
      totalKnownCents,
      inStock: true,
    });

    // Compute missing cost and completeness for default use case (rv-weekend)
    const defaultUseCaseId = useCaseMap.get("rv-weekend")!;
    let missingCents = 0;
    let includedRoles = 0;
    const totalRoles = seedKit.items.length;

    for (const item of seedKit.items) {
      const roleId = roleMap.get(item.roleCode);
      if (!roleId) continue;

      if (item.isIncluded) {
        includedRoles++;
        await db.insert(schema.kitRoleCoverage).values({
          kitId: kit.id,
          useCaseId: defaultUseCaseId,
          componentRoleId: roleId,
          status: "included",
          includedQuantity: item.quantity.toFixed(2),
          calculatorVersion: "seed-v1",
        });
      } else {
        const cost = item.estimatedCostCents ?? 0;
        missingCents += cost;
        await db.insert(schema.kitRoleCoverage).values({
          kitId: kit.id,
          useCaseId: defaultUseCaseId,
          componentRoleId: roleId,
          status: "missing",
          missingQuantity: Math.max(item.quantity, 1).toFixed(2),
          recommendedCostCents: cost,
          notes: item.notes,
          calculatorVersion: "seed-v1",
        });
      }
    }

    const completeness = totalRoles > 0 ? Math.round((includedRoles / totalRoles) * 100) : 0;
    const totalBeforeTax = seedKit.listedPriceCents + missingCents;

    // Insert total cost snapshot
    await db.insert(schema.kitTotalCostCurrent).values({
      kitId: kit.id,
      useCaseId: defaultUseCaseId,
      primaryKitOfferId: offer.id,
      baseOfferPriceCents: seedKit.listedPriceCents,
      missingComponentsCents: missingCents,
      totalBeforeTaxCents: totalBeforeTax,
      completenessScore: completeness.toFixed(2),
      lastPricedAt: now,
      calculatorVersion: "seed-v1",
    });

    console.log(`  ✓ ${seedKit.slug} — $${(seedKit.listedPriceCents / 100).toFixed(0)} listed, $${(totalBeforeTax / 100).toFixed(0)} real, ${completeness}% complete`);
  }
}

// ── Main ───────────────────────────────────────────────────────────────────────

async function main() {
  console.log("Starting seed...\n");

  const brandMap = await seedBrands();
  const retailerMap = await seedRetailers();
  const roleMap = await seedComponentRoles();
  const useCaseMap = await seedUseCases();
  await seedKits(brandMap, retailerMap, roleMap, useCaseMap);

  console.log("\nSeed complete!");
  await pool.end();
}

main().catch((err) => {
  console.error("Seed failed:", err);
  pool.end();
  process.exit(1);
});
