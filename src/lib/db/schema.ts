import {
  pgTable,
  pgEnum,
  uuid,
  text,
  boolean,
  numeric,
  integer,
  timestamp,
  jsonb,
  char,
  uniqueIndex,
  index,
  primaryKey,
  bigserial,
  check,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

// ── ENUMs ──────────────────────────────────────────────────────────────────────

export const retailerTypeEnum = pgEnum("retailer_type", [
  "amazon",
  "shareasale",
  "impact",
  "direct",
  "manual",
]);

export const productCategoryEnum = pgEnum("product_category", [
  "solar_panel",
  "battery",
  "inverter",
  "charge_controller",
  "mounting",
  "cable",
  "connector",
  "fuse_breaker",
  "combiner",
  "monitor",
  "accessory",
]);

export const componentRoleCodeEnum = pgEnum("component_role_code", [
  "panel_array",
  "battery_bank",
  "inverter",
  "charge_controller",
  "mounting_hardware",
  "wiring_kit",
  "fuse_or_breaker",
  "combiner_box",
  "monitoring",
  "grounding",
  "transfer_switch",
  "generator_input",
  "other",
]);

export const coverageStatusEnum = pgEnum("coverage_status", [
  "included",
  "partial",
  "missing",
  "extra",
  "not_applicable",
]);

export const priceEventSourceEnum = pgEnum("price_event_source", [
  "api",
  "feed",
  "scrape",
  "manual",
]);

export const alertTargetTypeEnum = pgEnum("alert_target_type", [
  "product",
  "kit",
]);

export const alertStatusEnum = pgEnum("alert_status", [
  "active",
  "paused",
  "fired",
  "unsubscribed",
]);

export const runStatusEnum = pgEnum("run_status", [
  "running",
  "succeeded",
  "partially_failed",
  "failed",
]);

export const itemStatusEnum = pgEnum("item_status", [
  "pending",
  "succeeded",
  "unchanged",
  "failed",
  "skipped",
]);

// ── Core Tables ────────────────────────────────────────────────────────────────

export const brands = pgTable("brands", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull().unique(), // citext in DB
  slug: text("slug").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const retailers = pgTable("retailers", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull().unique(),
  slug: text("slug").notNull().unique(),
  retailerType: retailerTypeEnum("retailer_type").notNull(),
  homepageUrl: text("homepage_url"),
  affiliateNetwork: text("affiliate_network"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const componentRoles = pgTable("component_roles", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: componentRoleCodeEnum("code").notNull().unique(),
  label: text("label").notNull(),
  description: text("description"),
});

// ── Products ───────────────────────────────────────────────────────────────────

export const products = pgTable(
  "products",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    brandId: uuid("brand_id").references(() => brands.id),
    category: productCategoryEnum("category").notNull(),
    title: text("title").notNull(),
    slug: text("slug").notNull().unique(),
    modelNumber: text("model_number"),
    mpn: text("mpn"),
    upc: text("upc"),
    canonicalVoltageV: numeric("canonical_voltage_v", { precision: 8, scale: 2 }),
    nominalSystemVoltageV: numeric("nominal_system_voltage_v", { precision: 8, scale: 2 }),
    powerW: numeric("power_w", { precision: 10, scale: 2 }),
    energyWh: numeric("energy_wh", { precision: 12, scale: 2 }),
    usableEnergyWh: numeric("usable_energy_wh", { precision: 12, scale: 2 }),
    continuousOutputW: numeric("continuous_output_w", { precision: 10, scale: 2 }),
    surgeOutputW: numeric("surge_output_w", { precision: 10, scale: 2 }),
    chemistry: text("chemistry"),
    warrantyYears: numeric("warranty_years", { precision: 5, scale: 2 }),
    weightKg: numeric("weight_kg", { precision: 10, scale: 2 }),
    isDiscontinued: boolean("is_discontinued").notNull().default(false),
    rawSpecs: jsonb("raw_specs").notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_products_category").on(table.category),
    index("idx_products_brand_category").on(table.brandId, table.category),
    index("idx_products_power_w").on(table.powerW),
    index("idx_products_energy_wh").on(table.energyWh),
  ]
);

export const productRoleAssignments = pgTable(
  "product_role_assignments",
  {
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    componentRoleId: uuid("component_role_id")
      .notNull()
      .references(() => componentRoles.id),
    isPrimary: boolean("is_primary").notNull().default(false),
  },
  (table) => [primaryKey({ columns: [table.productId, table.componentRoleId] })]
);

// ── Spec Subtables ─────────────────────────────────────────────────────────────

export const solarPanelSpecs = pgTable("solar_panel_specs", {
  productId: uuid("product_id")
    .primaryKey()
    .references(() => products.id, { onDelete: "cascade" }),
  panelType: text("panel_type"),
  ratedWatts: numeric("rated_watts", { precision: 10, scale: 2 }).notNull(),
  vmpV: numeric("vmp_v", { precision: 10, scale: 2 }),
  impA: numeric("imp_a", { precision: 10, scale: 2 }),
  vocV: numeric("voc_v", { precision: 10, scale: 2 }),
  iscA: numeric("isc_a", { precision: 10, scale: 2 }),
  cellCount: integer("cell_count"),
  lengthMm: numeric("length_mm", { precision: 10, scale: 2 }),
  widthMm: numeric("width_mm", { precision: 10, scale: 2 }),
  frameType: text("frame_type"),
});

export const batterySpecs = pgTable("battery_specs", {
  productId: uuid("product_id")
    .primaryKey()
    .references(() => products.id, { onDelete: "cascade" }),
  chemistry: text("chemistry").notNull(),
  nominalVoltageV: numeric("nominal_voltage_v", { precision: 10, scale: 2 }).notNull(),
  capacityAh: numeric("capacity_ah", { precision: 10, scale: 2 }).notNull(),
  totalWh: numeric("total_wh", { precision: 12, scale: 2 }).notNull(),
  usableWh: numeric("usable_wh", { precision: 12, scale: 2 }).notNull(),
  maxContinuousDischargeA: numeric("max_continuous_discharge_a", { precision: 10, scale: 2 }),
  cycleLife: integer("cycle_life"),
  heated: boolean("heated"),
});

export const inverterSpecs = pgTable("inverter_specs", {
  productId: uuid("product_id")
    .primaryKey()
    .references(() => products.id, { onDelete: "cascade" }),
  inverterType: text("inverter_type"),
  inputVoltageV: numeric("input_voltage_v", { precision: 10, scale: 2 }).notNull(),
  outputVoltageV: numeric("output_voltage_v", { precision: 10, scale: 2 }).notNull(),
  continuousW: numeric("continuous_w", { precision: 10, scale: 2 }).notNull(),
  surgeW: numeric("surge_w", { precision: 10, scale: 2 }),
  pureSine: boolean("pure_sine"),
  chargerIncluded: boolean("charger_included"),
});

export const chargeControllerSpecs = pgTable("charge_controller_specs", {
  productId: uuid("product_id")
    .primaryKey()
    .references(() => products.id, { onDelete: "cascade" }),
  controllerType: text("controller_type"),
  batteryVoltageMinV: numeric("battery_voltage_min_v", { precision: 10, scale: 2 }),
  batteryVoltageMaxV: numeric("battery_voltage_max_v", { precision: 10, scale: 2 }),
  maxPvInputV: numeric("max_pv_input_v", { precision: 10, scale: 2 }),
  maxChargeCurrentA: numeric("max_charge_current_a", { precision: 10, scale: 2 }),
  maxPvW12v: numeric("max_pv_w_12v", { precision: 10, scale: 2 }),
  maxPvW24v: numeric("max_pv_w_24v", { precision: 10, scale: 2 }),
  mppt: boolean("mppt"),
});

// ── Product Offers & Pricing ───────────────────────────────────────────────────

export const productOffers = pgTable(
  "product_offers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    retailerId: uuid("retailer_id")
      .notNull()
      .references(() => retailers.id),
    retailerSku: text("retailer_sku"),
    asin: text("asin"),
    sourceUrl: text("source_url").notNull(),
    canonicalUrl: text("canonical_url").notNull(),
    affiliateUrl: text("affiliate_url"),
    titleOnPage: text("title_on_page"),
    availabilityText: text("availability_text"),
    currencyCode: char("currency_code", { length: 3 }).notNull().default("USD"),
    isActive: boolean("is_active").notNull().default(true),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true }),
    firstSeenAt: timestamp("first_seen_at", { withTimezone: true }).notNull().defaultNow(),
    rawOffer: jsonb("raw_offer").notNull().default({}),
  },
  (table) => [
    uniqueIndex("product_offers_retailer_canonical").on(table.retailerId, table.canonicalUrl),
    index("idx_product_offers_product").on(table.productId),
    index("idx_product_offers_retailer").on(table.retailerId),
  ]
);

export const productPriceEvents = pgTable(
  "product_price_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    offerId: uuid("offer_id")
      .notNull()
      .references(() => productOffers.id, { onDelete: "cascade" }),
    observedAt: timestamp("observed_at", { withTimezone: true }).notNull(),
    sourceType: priceEventSourceEnum("source_type").notNull(),
    sourceRunId: uuid("source_run_id"),
    currencyCode: char("currency_code", { length: 3 }).notNull().default("USD"),
    priceCents: integer("price_cents"),
    shippingCents: integer("shipping_cents"),
    freightSurchargeCents: integer("freight_surcharge_cents"),
    couponCents: integer("coupon_cents"),
    taxCents: integer("tax_cents"),
    // total_known_cents is a generated column in DB — read-only
    inStock: boolean("in_stock"),
    sellerName: text("seller_name"),
    rawPayloadHash: text("raw_payload_hash").notNull(),
    rawPayload: jsonb("raw_payload").notNull().default({}),
  },
  (table) => [
    uniqueIndex("product_price_events_dedup").on(table.offerId, table.observedAt, table.rawPayloadHash),
    index("idx_product_price_events_offer_observed_desc").on(table.offerId, table.observedAt),
  ]
);

export const productCurrentPrices = pgTable(
  "product_current_prices",
  {
    offerId: uuid("offer_id")
      .primaryKey()
      .references(() => productOffers.id, { onDelete: "cascade" }),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    retailerId: uuid("retailer_id")
      .notNull()
      .references(() => retailers.id),
    latestEventId: uuid("latest_event_id")
      .notNull()
      .references(() => productPriceEvents.id),
    observedAt: timestamp("observed_at", { withTimezone: true }).notNull(),
    currencyCode: char("currency_code", { length: 3 }).notNull(),
    priceCents: integer("price_cents"),
    shippingCents: integer("shipping_cents"),
    freightSurchargeCents: integer("freight_surcharge_cents"),
    couponCents: integer("coupon_cents"),
    totalKnownCents: integer("total_known_cents"),
    inStock: boolean("in_stock"),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_product_current_prices_product").on(table.productId, table.totalKnownCents),
    index("idx_product_current_prices_retailer").on(table.retailerId),
  ]
);

// ── Kits ───────────────────────────────────────────────────────────────────────

export const kits = pgTable(
  "kits",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    brandId: uuid("brand_id").references(() => brands.id),
    title: text("title").notNull(),
    slug: text("slug").notNull().unique(),
    description: text("description"),
    nominalSystemVoltageV: numeric("nominal_system_voltage_v", { precision: 10, scale: 2 }),
    panelArrayW: numeric("panel_array_w", { precision: 10, scale: 2 }),
    batteryTotalWh: numeric("battery_total_wh", { precision: 12, scale: 2 }),
    batteryUsableWh: numeric("battery_usable_wh", { precision: 12, scale: 2 }),
    inverterContinuousW: numeric("inverter_continuous_w", { precision: 10, scale: 2 }),
    inverterSurgeW: numeric("inverter_surge_w", { precision: 10, scale: 2 }),
    chemistry: text("chemistry"),
    includesPanels: boolean("includes_panels").notNull().default(false),
    includesBatteries: boolean("includes_batteries").notNull().default(false),
    includesInverter: boolean("includes_inverter").notNull().default(false),
    includesController: boolean("includes_controller").notNull().default(false),
    isActive: boolean("is_active").notNull().default(true),
    imageUrl: text("image_url"),
    rawMetadata: jsonb("raw_metadata").notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_kits_filter_core").on(
      table.panelArrayW,
      table.batteryUsableWh,
      table.inverterContinuousW,
      table.nominalSystemVoltageV
    ),
  ]
);

export const kitItems = pgTable(
  "kit_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    kitId: uuid("kit_id")
      .notNull()
      .references(() => kits.id, { onDelete: "cascade" }),
    productId: uuid("product_id").references(() => products.id),
    componentRoleId: uuid("component_role_id")
      .notNull()
      .references(() => componentRoles.id),
    quantity: numeric("quantity", { precision: 10, scale: 2 }).notNull().default("1"),
    unitLabel: text("unit_label"),
    sortOrder: integer("sort_order").notNull().default(100),
    notes: text("notes"),
  },
  (table) => [
    uniqueIndex("kit_items_dedup").on(table.kitId, table.productId, table.componentRoleId),
    index("idx_kit_items_kit").on(table.kitId, table.sortOrder),
    index("idx_kit_items_role").on(table.componentRoleId),
  ]
);

// ── Kit Offers & Pricing ───────────────────────────────────────────────────────

export const kitOffers = pgTable(
  "kit_offers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    kitId: uuid("kit_id")
      .notNull()
      .references(() => kits.id, { onDelete: "cascade" }),
    retailerId: uuid("retailer_id")
      .notNull()
      .references(() => retailers.id),
    retailerSku: text("retailer_sku"),
    asin: text("asin"),
    externalProductId: text("external_product_id"),
    externalVariantId: text("external_variant_id"),
    sourceUrl: text("source_url").notNull(),
    canonicalUrl: text("canonical_url").notNull(),
    affiliateUrl: text("affiliate_url"),
    titleOnPage: text("title_on_page"),
    currencyCode: char("currency_code", { length: 3 }).notNull().default("USD"),
    isActive: boolean("is_active").notNull().default(true),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true }),
    firstSeenAt: timestamp("first_seen_at", { withTimezone: true }).notNull().defaultNow(),
    rawOffer: jsonb("raw_offer").notNull().default({}),
  },
  (table) => [
    uniqueIndex("kit_offers_retailer_canonical").on(table.retailerId, table.canonicalUrl),
  ]
);

export const kitPriceEvents = pgTable(
  "kit_price_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    offerId: uuid("offer_id")
      .notNull()
      .references(() => kitOffers.id, { onDelete: "cascade" }),
    observedAt: timestamp("observed_at", { withTimezone: true }).notNull(),
    sourceType: priceEventSourceEnum("source_type").notNull(),
    sourceRunId: uuid("source_run_id"),
    currencyCode: char("currency_code", { length: 3 }).notNull().default("USD"),
    priceCents: integer("price_cents"),
    shippingCents: integer("shipping_cents"),
    freightSurchargeCents: integer("freight_surcharge_cents"),
    couponCents: integer("coupon_cents"),
    taxCents: integer("tax_cents"),
    inStock: boolean("in_stock"),
    rawPayloadHash: text("raw_payload_hash").notNull(),
    rawPayload: jsonb("raw_payload").notNull().default({}),
  },
  (table) => [
    uniqueIndex("kit_price_events_dedup").on(table.offerId, table.observedAt, table.rawPayloadHash),
    index("idx_kit_price_events_offer_observed_desc").on(table.offerId, table.observedAt),
  ]
);

export const kitCurrentPrices = pgTable(
  "kit_current_prices",
  {
    offerId: uuid("offer_id")
      .primaryKey()
      .references(() => kitOffers.id, { onDelete: "cascade" }),
    kitId: uuid("kit_id")
      .notNull()
      .references(() => kits.id, { onDelete: "cascade" }),
    retailerId: uuid("retailer_id")
      .notNull()
      .references(() => retailers.id),
    latestEventId: uuid("latest_event_id")
      .notNull()
      .references(() => kitPriceEvents.id),
    observedAt: timestamp("observed_at", { withTimezone: true }).notNull(),
    currencyCode: char("currency_code", { length: 3 }).notNull(),
    priceCents: integer("price_cents"),
    shippingCents: integer("shipping_cents"),
    freightSurchargeCents: integer("freight_surcharge_cents"),
    couponCents: integer("coupon_cents"),
    totalKnownCents: integer("total_known_cents"),
    inStock: boolean("in_stock"),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_kit_current_prices_kit").on(table.kitId, table.totalKnownCents),
  ]
);

// ── Use Cases & Coverage ───────────────────────────────────────────────────────

export const useCases = pgTable("use_cases", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  label: text("label").notNull(),
  description: text("description"),
  defaultDailyLoadWh: numeric("default_daily_load_wh", { precision: 12, scale: 2 }),
  defaultPeakW: numeric("default_peak_w", { precision: 10, scale: 2 }),
  nominalVoltageV: numeric("nominal_voltage_v", { precision: 10, scale: 2 }),
  autonomyHours: numeric("autonomy_hours", { precision: 10, scale: 2 }),
  assumptionSet: jsonb("assumption_set").notNull().default({}),
  isActive: boolean("is_active").notNull().default(true),
});

export const kitRoleRequirements = pgTable(
  "kit_role_requirements",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    kitId: uuid("kit_id")
      .notNull()
      .references(() => kits.id, { onDelete: "cascade" }),
    useCaseId: uuid("use_case_id")
      .notNull()
      .references(() => useCases.id, { onDelete: "cascade" }),
    componentRoleId: uuid("component_role_id")
      .notNull()
      .references(() => componentRoles.id),
    requiredQuantity: numeric("required_quantity", { precision: 10, scale: 2 }),
    requiredPowerW: numeric("required_power_w", { precision: 10, scale: 2 }),
    requiredEnergyWh: numeric("required_energy_wh", { precision: 12, scale: 2 }),
    requiredVoltageV: numeric("required_voltage_v", { precision: 10, scale: 2 }),
    requirementText: text("requirement_text"),
    calculatorVersion: text("calculator_version").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("kit_role_requirements_dedup").on(table.kitId, table.useCaseId, table.componentRoleId),
  ]
);

export const kitRoleCoverage = pgTable(
  "kit_role_coverage",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    kitId: uuid("kit_id")
      .notNull()
      .references(() => kits.id, { onDelete: "cascade" }),
    useCaseId: uuid("use_case_id")
      .notNull()
      .references(() => useCases.id, { onDelete: "cascade" }),
    componentRoleId: uuid("component_role_id")
      .notNull()
      .references(() => componentRoles.id),
    status: coverageStatusEnum("status").notNull(),
    includedQuantity: numeric("included_quantity", { precision: 10, scale: 2 }),
    coveredPowerW: numeric("covered_power_w", { precision: 10, scale: 2 }),
    coveredEnergyWh: numeric("covered_energy_wh", { precision: 12, scale: 2 }),
    missingQuantity: numeric("missing_quantity", { precision: 10, scale: 2 }),
    missingPowerW: numeric("missing_power_w", { precision: 10, scale: 2 }),
    missingEnergyWh: numeric("missing_energy_wh", { precision: 12, scale: 2 }),
    recommendedProductId: uuid("recommended_product_id").references(() => products.id),
    recommendedOfferId: uuid("recommended_offer_id").references(() => productOffers.id),
    recommendedCostCents: integer("recommended_cost_cents"),
    notes: text("notes"),
    calculatorVersion: text("calculator_version").notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("kit_role_coverage_dedup").on(table.kitId, table.useCaseId, table.componentRoleId),
    index("idx_kit_role_coverage_lookup").on(table.kitId, table.useCaseId, table.status),
  ]
);

export const kitTotalCostCurrent = pgTable(
  "kit_total_cost_current",
  {
    kitId: uuid("kit_id")
      .notNull()
      .references(() => kits.id, { onDelete: "cascade" }),
    useCaseId: uuid("use_case_id")
      .notNull()
      .references(() => useCases.id, { onDelete: "cascade" }),
    primaryKitOfferId: uuid("primary_kit_offer_id").references(() => kitOffers.id),
    baseOfferPriceCents: integer("base_offer_price_cents").notNull(),
    missingComponentsCents: integer("missing_components_cents").notNull().default(0),
    knownShippingCents: integer("known_shipping_cents").notNull().default(0),
    freightSurchargeCents: integer("freight_surcharge_cents").notNull().default(0),
    couponCents: integer("coupon_cents").notNull().default(0),
    estimatedTaxCents: integer("estimated_tax_cents"),
    totalBeforeTaxCents: integer("total_before_tax_cents").notNull(),
    totalAfterTaxCents: integer("total_after_tax_cents"),
    completenessScore: numeric("completeness_score", { precision: 5, scale: 2 }).notNull(),
    lastPricedAt: timestamp("last_priced_at", { withTimezone: true }).notNull(),
    calculatorVersion: text("calculator_version").notNull(),
  },
  (table) => [primaryKey({ columns: [table.kitId, table.useCaseId] })]
);

// ── Alerts ─────────────────────────────────────────────────────────────────────

export const subscribers = pgTable("subscribers", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(), // citext in DB
  emailVerifiedAt: timestamp("email_verified_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const priceAlerts = pgTable(
  "price_alerts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    subscriberId: uuid("subscriber_id")
      .notNull()
      .references(() => subscribers.id, { onDelete: "cascade" }),
    targetType: alertTargetTypeEnum("target_type").notNull(),
    productId: uuid("product_id").references(() => products.id),
    kitId: uuid("kit_id").references(() => kits.id),
    targetPriceCents: integer("target_price_cents").notNull(),
    status: alertStatusEnum("status").notNull().default("active"),
    lastEvaluatedAt: timestamp("last_evaluated_at", { withTimezone: true }),
    lastNotifiedAt: timestamp("last_notified_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_price_alerts_product_active").on(table.productId),
    index("idx_price_alerts_kit_active").on(table.kitId),
  ]
);

// ── Ingestion ──────────────────────────────────────────────────────────────────

export const ingestionRuns = pgTable("ingestion_runs", {
  id: uuid("id").primaryKey().defaultRandom(),
  sourceName: text("source_name").notNull(),
  sourceType: priceEventSourceEnum("source_type").notNull(),
  scheduledAt: timestamp("scheduled_at", { withTimezone: true }).notNull(),
  startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
  finishedAt: timestamp("finished_at", { withTimezone: true }),
  status: runStatusEnum("status").notNull().default("running"),
  itemCount: integer("item_count").notNull().default(0),
  succeededCount: integer("succeeded_count").notNull().default(0),
  failedCount: integer("failed_count").notNull().default(0),
  metadata: jsonb("metadata").notNull().default({}),
});

export const ingestionRunItems = pgTable(
  "ingestion_run_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    runId: uuid("run_id")
      .notNull()
      .references(() => ingestionRuns.id, { onDelete: "cascade" }),
    sourceKey: text("source_key").notNull(),
    targetKind: text("target_kind").notNull(),
    targetOfferId: uuid("target_offer_id"),
    payloadHash: text("payload_hash").notNull(),
    observedAt: timestamp("observed_at", { withTimezone: true }).notNull(),
    status: itemStatusEnum("status").notNull().default("pending"),
    errorCode: text("error_code"),
    errorMessage: text("error_message"),
    retryCount: integer("retry_count").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    processedAt: timestamp("processed_at", { withTimezone: true }),
  },
  (table) => [
    uniqueIndex("ingestion_run_items_dedup").on(table.runId, table.sourceKey, table.payloadHash),
    index("idx_ingestion_run_items_run_status").on(table.runId, table.status),
  ]
);

// ── Price Change Queue ─────────────────────────────────────────────────────────

export const priceChangeQueue = pgTable(
  "price_change_queue",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    targetType: alertTargetTypeEnum("target_type").notNull(),
    offerId: uuid("offer_id").notNull(),
    entityId: uuid("entity_id").notNull(),
    latestEventId: uuid("latest_event_id").notNull(),
    oldTotalCents: integer("old_total_cents"),
    newTotalCents: integer("new_total_cents"),
    observedAt: timestamp("observed_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    processedAt: timestamp("processed_at", { withTimezone: true }),
  },
  (table) => [
    index("idx_price_change_queue_unprocessed").on(table.processedAt),
  ]
);

export const alertNotifications = pgTable(
  "alert_notifications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    alertId: uuid("alert_id")
      .notNull()
      .references(() => priceAlerts.id, { onDelete: "cascade" }),
    latestEventId: uuid("latest_event_id").notNull(),
    sentAt: timestamp("sent_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("alert_notifications_dedup").on(table.alertId, table.latestEventId),
  ]
);
