export interface PriceHistoryPoint {
  date: string;
  priceCents: number;
}

export interface PriceHistorySeriesPoint {
  date: string;
  priceCents: number | null;
  inStock: boolean;
}

export interface PriceHistorySeries {
  offerId: string;
  retailerName: string;
  retailerSlug: string;
  points: PriceHistorySeriesPoint[];
}

export interface KitPriceHistory {
  slug: string;
  series: PriceHistorySeries[];
  /** Pre-computed: daily MIN price across in-stock offers */
  lowestAvailable: Array<{ date: string; priceCents: number | null }>;
}

export interface Kit {
  id: string;
  slug: string;
  name: string;
  displayName: string;
  imageUrl?: string;
  brand: string;
  listedPrice: number;
  missingCost: number;
  trueCost: number;
  panelWatts: number;
  storageWh: number;
  inverterWatts: number;
  voltage: number;
  chemistry: string;
  costPerWh: string;
  costPerW: string;
  useCases: string[];
  useCaseRatings: Record<string, "excellent" | "good" | "fair" | "poor">;
  included: Record<string, boolean>;
  priceChange?: number;
  priceObservedAt: string;
  retailer: string;
  retailerSlug?: string;
  sourceUrl?: string;
  completeness: number; // 0-100%
  items: KitItem[];
  priceHistory?: PriceHistoryPoint[];
  offers?: KitOffer[];
}

export interface KitOffer {
  retailer: string;
  retailerSlug: string;
  price: number;
  sourceUrl?: string;
  inStock: boolean;
  observedAt: string;
}

export interface KitItem {
  role: string;
  isIncluded: boolean;
  name: string;
  specs: string;
  quantity: number;
  estimatedCost?: number;
  notes?: string;
  recommendedAsin?: string;
  recommendedBrand?: string;
}

const now = new Date();
const hoursAgo = (h: number) => new Date(now.getTime() - h * 60 * 60 * 1000).toISOString();

/**
 * Generate synthetic price history for demo kits.
 * Creates realistic daily price data with trends, seasonal variation, and occasional sales.
 */
function generatePriceHistory(
  currentPriceCents: number,
  days: number,
  opts: { volatility?: number; trend?: "up" | "down" | "flat"; saleDrop?: number } = {}
): PriceHistoryPoint[] {
  const { volatility = 0.02, trend = "flat", saleDrop = 0 } = opts;
  const points: PriceHistoryPoint[] = [];
  const trendFactor = trend === "up" ? 0.0003 : trend === "down" ? -0.0003 : 0;

  // Work backwards from current price
  let price = currentPriceCents;
  const prices: number[] = [price];

  for (let d = 1; d < days; d++) {
    // Random walk with mean reversion
    const noise = (Math.random() - 0.5) * 2 * volatility * price;
    const reversion = (currentPriceCents - price) * 0.01;
    price = price - noise - trendFactor * price + reversion;

    // Occasional sale events (every ~45 days, lasting 3-5 days)
    if (saleDrop > 0 && d % 45 < 3) {
      price = price * (1 - saleDrop);
    }

    prices.push(Math.round(Math.max(price * 0.7, price)));
  }

  prices.reverse();

  for (let i = 0; i < prices.length; i++) {
    const date = new Date(now.getTime() - (days - 1 - i) * 24 * 60 * 60 * 1000);
    points.push({
      date: date.toISOString().split("T")[0],
      priceCents: prices[i],
    });
  }

  return points;
}

export const demoKits: Kit[] = [
  {
    id: "1",
    slug: "renogy-400w-complete-lifepo4",
    name: "Renogy 400W 12V Complete Solar Kit with 200Ah LiFePO4",
    brand: "Renogy",
    listedPrice: 1899,
    missingCost: 0,
    trueCost: 1899,
    panelWatts: 400,
    storageWh: 2560,
    inverterWatts: 2000,
    voltage: 12,
    chemistry: "LiFePO4",
    costPerWh: "$0.74",
    costPerW: "$4.75",
    useCases: ["rv", "cabin", "shed"],
    useCaseRatings: { rv: "excellent", cabin: "excellent", shed: "good", emergency: "good", homestead: "poor", boat: "fair" },
    included: { panels: true, controller: true, battery: true, inverter: true, wiring: true, mounting: true, monitoring: true },
    priceChange: -67,
    priceObservedAt: hoursAgo(3),
    retailer: "Amazon",
    completeness: 100,
    items: [
      { role: "Solar Panels", isIncluded: true, name: "Renogy 100W 12V Mono", specs: "4× 100W = 400W total", quantity: 4 },
      { role: "Charge Controller", isIncluded: true, name: "Renogy Rover 40A MPPT", specs: "40A, 12/24V auto", quantity: 1 },
      { role: "Battery", isIncluded: true, name: "Renogy 200Ah 12V LiFePO4", specs: "2,560Wh, 4000 cycles", quantity: 1 },
      { role: "Inverter", isIncluded: true, name: "Renogy 2000W Pure Sine", specs: "2000W cont / 4000W peak", quantity: 1 },
      { role: "Wiring", isIncluded: true, name: "MC4 cables + battery cables", specs: "20ft MC4, 6AWG battery", quantity: 1 },
      { role: "Mounting", isIncluded: true, name: "Z-bracket mounts", specs: "Roof mount, aluminum", quantity: 4 },
      { role: "Monitoring", isIncluded: true, name: "BT-2 Bluetooth Module", specs: "App monitoring", quantity: 1 },
    ],
    priceHistory: generatePriceHistory(189900, 180, { volatility: 0.015, trend: "down", saleDrop: 0.04 }),
  },
  {
    id: "2",
    slug: "eco-worthy-200w-starter",
    name: "Eco-Worthy 200W 12V Solar Starter Kit",
    brand: "Eco-Worthy",
    listedPrice: 289,
    missingCost: 750,
    trueCost: 1039,
    panelWatts: 200,
    storageWh: 0,
    inverterWatts: 0,
    voltage: 12,
    chemistry: "None",
    costPerWh: "N/A",
    costPerW: "$5.20",
    useCases: ["shed"],
    useCaseRatings: { rv: "poor", cabin: "poor", shed: "fair", emergency: "poor", homestead: "poor", boat: "poor" },
    included: { panels: true, controller: true, battery: false, inverter: false, wiring: true, mounting: true, monitoring: false },
    priceChange: -12,
    priceObservedAt: hoursAgo(5),
    retailer: "Amazon",
    completeness: 57,
    items: [
      { role: "Solar Panels", isIncluded: true, name: "Eco-Worthy 100W Mono", specs: "2× 100W = 200W total", quantity: 2 },
      { role: "Charge Controller", isIncluded: true, name: "Eco-Worthy 30A PWM", specs: "30A PWM (not MPPT)", quantity: 1, notes: "PWM — less efficient than MPPT" },
      { role: "Battery", isIncluded: false, name: "Not included", specs: "Need 12V 100Ah+", quantity: 1, estimatedCost: 300 },
      { role: "Inverter", isIncluded: false, name: "Not included", specs: "Need 1000W+ pure sine", quantity: 1, estimatedCost: 200 },
      { role: "Wiring", isIncluded: true, name: "MC4 cables", specs: "10ft MC4", quantity: 1 },
      { role: "Mounting", isIncluded: true, name: "Z-brackets", specs: "Roof mount", quantity: 2 },
      { role: "Monitoring", isIncluded: false, name: "Not included", specs: "Optional BT module", quantity: 0, estimatedCost: 25 },
    ],
    priceHistory: generatePriceHistory(28900, 120, { volatility: 0.025, trend: "flat", saleDrop: 0.05 }),
  },
  {
    id: "3",
    slug: "ecoflow-delta-pro-400w",
    name: "EcoFlow DELTA Pro + 400W Solar Panel",
    brand: "EcoFlow",
    listedPrice: 4299,
    missingCost: 0,
    trueCost: 4299,
    panelWatts: 400,
    storageWh: 3600,
    inverterWatts: 3600,
    voltage: 48,
    chemistry: "LiFePO4",
    costPerWh: "$1.19",
    costPerW: "$10.75",
    useCases: ["rv", "cabin", "homestead", "emergency"],
    useCaseRatings: { rv: "excellent", cabin: "excellent", shed: "good", emergency: "excellent", homestead: "good", boat: "fair" },
    included: { panels: true, controller: true, battery: true, inverter: true, wiring: true, mounting: false, monitoring: true },
    priceObservedAt: hoursAgo(2),
    retailer: "EcoFlow Direct",
    completeness: 86,
    items: [
      { role: "Solar Panels", isIncluded: true, name: "EcoFlow 400W Portable Panel", specs: "400W folding, 22.6% eff", quantity: 1 },
      { role: "Charge Controller", isIncluded: true, name: "Built-in MPPT", specs: "Integrated in DELTA Pro", quantity: 1 },
      { role: "Battery", isIncluded: true, name: "DELTA Pro LiFePO4", specs: "3,600Wh, expandable to 25kWh", quantity: 1 },
      { role: "Inverter", isIncluded: true, name: "Built-in Pure Sine", specs: "3600W / 7200W peak", quantity: 1 },
      { role: "Wiring", isIncluded: true, name: "XT60 solar cable", specs: "Included", quantity: 1 },
      { role: "Mounting", isIncluded: false, name: "Not included", specs: "Panel is portable/folding", quantity: 0, estimatedCost: 0, notes: "Portable panel — no mounting needed" },
      { role: "Monitoring", isIncluded: true, name: "EcoFlow App", specs: "WiFi + BT monitoring", quantity: 1 },
    ],
    priceHistory: generatePriceHistory(429900, 270, { volatility: 0.01, trend: "down", saleDrop: 0.03 }),
  },
  {
    id: "4",
    slug: "bluetti-ac300-b300-pv350",
    name: "Bluetti AC300 + B300 + PV350 Solar Panel",
    brand: "Bluetti",
    listedPrice: 3799,
    missingCost: 0,
    trueCost: 3799,
    panelWatts: 350,
    storageWh: 3072,
    inverterWatts: 3000,
    voltage: 48,
    chemistry: "LiFePO4",
    costPerWh: "$1.24",
    costPerW: "$10.85",
    useCases: ["rv", "cabin", "homestead", "emergency"],
    useCaseRatings: { rv: "excellent", cabin: "excellent", shed: "fair", emergency: "excellent", homestead: "good", boat: "poor" },
    included: { panels: true, controller: true, battery: true, inverter: true, wiring: true, mounting: false, monitoring: true },
    priceChange: -200,
    priceObservedAt: hoursAgo(8),
    retailer: "Amazon",
    completeness: 86,
    items: [
      { role: "Solar Panels", isIncluded: true, name: "Bluetti PV350", specs: "350W portable, 23.4% eff", quantity: 1 },
      { role: "Charge Controller", isIncluded: true, name: "Built-in MPPT", specs: "Integrated in AC300", quantity: 1 },
      { role: "Battery", isIncluded: true, name: "Bluetti B300 LiFePO4", specs: "3,072Wh, 3500+ cycles", quantity: 1 },
      { role: "Inverter", isIncluded: true, name: "Built-in Pure Sine", specs: "3000W / 6000W peak, split-phase 240V", quantity: 1 },
      { role: "Wiring", isIncluded: true, name: "Solar + battery cables", specs: "Included", quantity: 1 },
      { role: "Mounting", isIncluded: false, name: "Not included", specs: "Portable panel", quantity: 0, estimatedCost: 0 },
      { role: "Monitoring", isIncluded: true, name: "Bluetti App", specs: "WiFi + BT", quantity: 1 },
    ],
    priceHistory: generatePriceHistory(379900, 365, { volatility: 0.012, trend: "down", saleDrop: 0.06 }),
  },
  {
    id: "5",
    slug: "windynation-400w-complete",
    name: "WindyNation 400W Complete Off-Grid Kit",
    brand: "WindyNation",
    listedPrice: 1149,
    missingCost: 350,
    trueCost: 1499,
    panelWatts: 400,
    storageWh: 1200,
    inverterWatts: 1500,
    voltage: 12,
    chemistry: "AGM",
    costPerWh: "$1.25",
    costPerW: "$3.75",
    useCases: ["rv", "cabin", "shed"],
    useCaseRatings: { rv: "good", cabin: "good", shed: "excellent", emergency: "fair", homestead: "poor", boat: "good" },
    included: { panels: true, controller: true, battery: true, inverter: true, wiring: true, mounting: false, monitoring: false },
    priceObservedAt: hoursAgo(18),
    retailer: "Amazon",
    completeness: 71,
    items: [
      { role: "Solar Panels", isIncluded: true, name: "WindyNation 100W Poly", specs: "4× 100W = 400W total", quantity: 4 },
      { role: "Charge Controller", isIncluded: true, name: "WindyNation P30L PWM", specs: "30A PWM", quantity: 1, notes: "PWM — less efficient" },
      { role: "Battery", isIncluded: true, name: "WindyNation 100Ah AGM", specs: "2× 100Ah AGM = 1,200Wh usable", quantity: 2, notes: "AGM — 50% DoD, shorter cycle life" },
      { role: "Inverter", isIncluded: true, name: "VertaMax 1500W", specs: "1500W modified sine", quantity: 1, notes: "Modified sine — not safe for sensitive electronics" },
      { role: "Wiring", isIncluded: true, name: "MC4 + battery cables", specs: "Included", quantity: 1 },
      { role: "Mounting", isIncluded: false, name: "Not included", specs: "Need roof or ground mount", quantity: 1, estimatedCost: 80 },
      { role: "Monitoring", isIncluded: false, name: "Not included", specs: "Basic LCD on controller only", quantity: 0, estimatedCost: 30 },
    ],
    priceHistory: generatePriceHistory(114900, 90, { volatility: 0.02, trend: "flat" }),
  },
  {
    id: "6",
    slug: "renogy-800w-cabin-kit",
    name: "Renogy 800W 12V Solar Cabin Kit",
    brand: "Renogy",
    listedPrice: 1599,
    missingCost: 900,
    trueCost: 2499,
    panelWatts: 800,
    storageWh: 0,
    inverterWatts: 0,
    voltage: 12,
    chemistry: "None",
    costPerWh: "N/A",
    costPerW: "$3.12",
    useCases: ["cabin", "homestead"],
    useCaseRatings: { rv: "poor", cabin: "good", shed: "fair", emergency: "poor", homestead: "fair", boat: "poor" },
    included: { panels: true, controller: true, battery: false, inverter: false, wiring: true, mounting: true, monitoring: true },
    priceChange: -100,
    priceObservedAt: hoursAgo(6),
    retailer: "Renogy Direct",
    completeness: 57,
    items: [
      { role: "Solar Panels", isIncluded: true, name: "Renogy 200W 12V Mono", specs: "4× 200W = 800W total", quantity: 4 },
      { role: "Charge Controller", isIncluded: true, name: "Renogy Rover 60A MPPT", specs: "60A MPPT, BT", quantity: 1 },
      { role: "Battery", isIncluded: false, name: "Not included", specs: "Need 200Ah+ LiFePO4 12V", quantity: 1, estimatedCost: 600 },
      { role: "Inverter", isIncluded: false, name: "Not included", specs: "Need 3000W+ pure sine", quantity: 1, estimatedCost: 300 },
      { role: "Wiring", isIncluded: true, name: "Full cable kit", specs: "MC4, battery, tray cables", quantity: 1 },
      { role: "Mounting", isIncluded: true, name: "Z-bracket kit", specs: "8× Z-brackets for roof", quantity: 8 },
      { role: "Monitoring", isIncluded: true, name: "BT-2 Bluetooth Module", specs: "App monitoring", quantity: 1 },
    ],
    priceHistory: generatePriceHistory(159900, 200, { volatility: 0.018, trend: "up", saleDrop: 0.05 }),
  },
];

export const useCaseOptions = [
  { value: "rv", label: "RV & Van Life" },
  { value: "cabin", label: "Weekend Cabin" },
  { value: "homestead", label: "Homestead" },
  { value: "emergency", label: "Emergency" },
  { value: "shed", label: "Shed & Workshop" },
  { value: "boat", label: "Boat & Marine" },
];

export const brandOptions = [
  "Renogy",
  "EcoFlow",
  "Bluetti",
  "Eco-Worthy",
  "WindyNation",
  "Goal Zero",
  "Jackery",
  "EG4",
];

export const chemistryOptions = ["LiFePO4", "AGM", "Lead-Acid", "None"];
