import type { ApplianceDef } from "./types";

export const APPLIANCE_CATALOG: ApplianceDef[] = [
  // ── Lighting ──────────────────────────────────────────────────────────────
  { id: "led-light", name: "LED Light", category: "Lighting", defaultWatts: 9, defaultQty: 4, defaultHours: 5, dutyCycle: 1, surgeWatts: 0 },
  { id: "led-strip", name: "LED Strip", category: "Lighting", defaultWatts: 15, defaultQty: 1, defaultHours: 4, dutyCycle: 1, surgeWatts: 0 },
  { id: "security-floodlight", name: "Security Floodlight", category: "Lighting", defaultWatts: 30, defaultQty: 2, defaultHours: 10, dutyCycle: 1, surgeWatts: 0, notes: "Dusk-to-dawn LED" },
  { id: "porch-light", name: "Porch Light", category: "Lighting", defaultWatts: 12, defaultQty: 1, defaultHours: 6, dutyCycle: 1, surgeWatts: 0 },

  // ── Communication ─────────────────────────────────────────────────────────
  { id: "phone-charger", name: "Phone Charger", category: "Communication", defaultWatts: 10, defaultQty: 2, defaultHours: 2, dutyCycle: 1, surgeWatts: 0, notes: "Average draw; fast charging peaks at 18-65W" },
  { id: "tablet-charger", name: "Tablet Charger", category: "Communication", defaultWatts: 15, defaultQty: 1, defaultHours: 2, dutyCycle: 1, surgeWatts: 0 },
  { id: "laptop", name: "Laptop", category: "Communication", defaultWatts: 50, defaultQty: 1, defaultHours: 4, dutyCycle: 1, surgeWatts: 0, notes: "Typical use; gaming laptops: 150-300W" },
  { id: "starlink", name: "Starlink", category: "Communication", defaultWatts: 75, defaultQty: 1, defaultHours: 24, dutyCycle: 1, surgeWatts: 0, notes: "V2 ~50W, V3 ~100W; most off-gridders run 24/7" },
  { id: "wifi-router", name: "WiFi Router", category: "Communication", defaultWatts: 12, defaultQty: 1, defaultHours: 24, dutyCycle: 1, surgeWatts: 0 },
  { id: "security-cameras", name: "Security Camera System", category: "Communication", defaultWatts: 40, defaultQty: 1, defaultHours: 24, dutyCycle: 1, surgeWatts: 0, notes: "NVR (20W) + 4 PoE cameras (5W each)" },
  { id: "ham-radio", name: "Ham Radio (HF)", category: "Communication", defaultWatts: 100, defaultQty: 1, defaultHours: 2, dutyCycle: 1, surgeWatts: 0, notes: "HF transceiver on transmit" },

  // ── Kitchen ───────────────────────────────────────────────────────────────
  { id: "mini-fridge", name: "Mini Fridge", category: "Kitchen", defaultWatts: 65, defaultQty: 1, defaultHours: 24, dutyCycle: 0.35, surgeWatts: 600, notes: "Compressor cycles ~35% of runtime" },
  { id: "chest-freezer", name: "Chest Freezer", category: "Kitchen", defaultWatts: 75, defaultQty: 1, defaultHours: 24, dutyCycle: 0.4, surgeWatts: 500, notes: "Compressor cycles ~40%; higher in hot climates" },
  { id: "coffee-maker", name: "Coffee Maker", category: "Kitchen", defaultWatts: 800, defaultQty: 1, defaultHours: 0.25, dutyCycle: 1, surgeWatts: 0 },
  { id: "microwave", name: "Microwave", category: "Kitchen", defaultWatts: 1400, defaultQty: 1, defaultHours: 0.25, dutyCycle: 1, surgeWatts: 2000, notes: "1000W output = ~1400W input draw; surge on startup" },
  { id: "electric-kettle", name: "Electric Kettle", category: "Kitchen", defaultWatts: 1200, defaultQty: 1, defaultHours: 0.15, dutyCycle: 1, surgeWatts: 0, notes: "~10 min/day" },
  { id: "toaster", name: "Toaster", category: "Kitchen", defaultWatts: 800, defaultQty: 1, defaultHours: 0.1, dutyCycle: 1, surgeWatts: 0, notes: "~6 min/day" },
  { id: "blender", name: "Blender", category: "Kitchen", defaultWatts: 400, defaultQty: 1, defaultHours: 0.1, dutyCycle: 1, surgeWatts: 600 },
  { id: "instant-pot", name: "Instant Pot", category: "Kitchen", defaultWatts: 700, defaultQty: 1, defaultHours: 0.5, dutyCycle: 1, surgeWatts: 0, notes: "Average over cook cycle" },
  { id: "rice-cooker", name: "Rice Cooker", category: "Kitchen", defaultWatts: 400, defaultQty: 1, defaultHours: 0.5, dutyCycle: 1, surgeWatts: 0 },
  { id: "dishwasher", name: "Dishwasher", category: "Kitchen", defaultWatts: 1200, defaultQty: 1, defaultHours: 1, dutyCycle: 1, surgeWatts: 0, notes: "Energy-efficient model; 1 cycle/day" },
  { id: "electric-oven", name: "Electric Oven", category: "Kitchen", defaultWatts: 2500, defaultQty: 1, defaultHours: 1, dutyCycle: 0.5, surgeWatts: 0, notes: "Average over cook cycle; propane preferred off-grid" },

  // ── Climate ───────────────────────────────────────────────────────────────
  { id: "12v-fan", name: "12V Fan", category: "Climate", defaultWatts: 25, defaultQty: 1, defaultHours: 8, dutyCycle: 1, surgeWatts: 0 },
  { id: "box-fan", name: "Box Fan", category: "Climate", defaultWatts: 75, defaultQty: 1, defaultHours: 6, dutyCycle: 1, surgeWatts: 0 },
  { id: "ceiling-fan", name: "Ceiling Fan", category: "Climate", defaultWatts: 60, defaultQty: 1, defaultHours: 8, dutyCycle: 1, surgeWatts: 0 },
  { id: "window-ac", name: "Window AC (Small)", category: "Climate", defaultWatts: 500, defaultQty: 1, defaultHours: 8, dutyCycle: 0.5, surgeWatts: 1500, notes: "5000 BTU; compressor cycles ~50%" },
  { id: "space-heater", name: "Space Heater", category: "Climate", defaultWatts: 1500, defaultQty: 1, defaultHours: 4, dutyCycle: 1, surgeWatts: 0, notes: "Standard 1500W; low setting = 750W" },
  { id: "dehumidifier", name: "Dehumidifier", category: "Climate", defaultWatts: 300, defaultQty: 1, defaultHours: 8, dutyCycle: 0.5, surgeWatts: 600, notes: "Compressor cycles ~50%" },
  { id: "pellet-stove", name: "Pellet Stove", category: "Climate", defaultWatts: 300, defaultQty: 1, defaultHours: 8, dutyCycle: 1, surgeWatts: 500, notes: "Auger motor + blower fan; igniter draws more on startup" },
  { id: "furnace-blower", name: "Furnace Blower", category: "Climate", defaultWatts: 500, defaultQty: 1, defaultHours: 8, dutyCycle: 0.5, surgeWatts: 1000, notes: "Gas/propane furnace fan motor" },
  { id: "propane-igniter", name: "Propane Appliance Electronics", category: "Climate", defaultWatts: 10, defaultQty: 1, defaultHours: 24, dutyCycle: 1, surgeWatts: 0, notes: "Control board + igniter for propane appliances" },

  // ── Water ─────────────────────────────────────────────────────────────────
  { id: "well-pump", name: "Well Pump (½ HP)", category: "Water", defaultWatts: 750, defaultQty: 1, defaultHours: 2, dutyCycle: 1, surgeWatts: 1500, notes: "Typical submersible; 1-6h/day based on household size" },
  { id: "rv-water-pump", name: "RV Water Pump", category: "Water", defaultWatts: 60, defaultQty: 1, defaultHours: 1, dutyCycle: 1, surgeWatts: 0, notes: "12V demand pump" },
  { id: "tankless-water-heater", name: "Tankless Water Heater", category: "Water", defaultWatts: 3500, defaultQty: 1, defaultHours: 0.5, dutyCycle: 1, surgeWatts: 0, notes: "Point-of-use, small sink only. Whole-house requires 7000W+ (not solar-viable)" },
  { id: "sump-pump", name: "Sump Pump", category: "Water", defaultWatts: 800, defaultQty: 1, defaultHours: 1, dutyCycle: 0.5, surgeWatts: 1600, notes: "Intermittent, seasonal; size varies" },
  { id: "uv-water-purifier", name: "UV Water Purifier", category: "Water", defaultWatts: 40, defaultQty: 1, defaultHours: 24, dutyCycle: 1, surgeWatts: 0, notes: "UV sterilizer, always-on" },
  { id: "ro-water-filter", name: "RO Water Filter", category: "Water", defaultWatts: 100, defaultQty: 1, defaultHours: 2, dutyCycle: 1, surgeWatts: 0, notes: "Reverse osmosis with booster pump" },

  // ── Laundry ───────────────────────────────────────────────────────────────
  { id: "washing-machine", name: "Washing Machine (HE)", category: "Laundry", defaultWatts: 500, defaultQty: 1, defaultHours: 1, dutyCycle: 1, surgeWatts: 1200, notes: "Front-load HE; top-load similar wattage" },
  { id: "iron", name: "Iron", category: "Laundry", defaultWatts: 1200, defaultQty: 1, defaultHours: 0.25, dutyCycle: 1, surgeWatts: 0, notes: "~15 min/day" },

  // ── Personal ──────────────────────────────────────────────────────────────
  { id: "hair-dryer", name: "Hair Dryer", category: "Personal", defaultWatts: 1500, defaultQty: 1, defaultHours: 0.25, dutyCycle: 1, surgeWatts: 0, notes: "~15 min/day; low setting = 750W" },
  { id: "vacuum-cleaner", name: "Vacuum Cleaner", category: "Personal", defaultWatts: 1000, defaultQty: 1, defaultHours: 0.25, dutyCycle: 1, surgeWatts: 1400, notes: "~15 min/day; cordless alternative: 200W" },

  // ── Entertainment ─────────────────────────────────────────────────────────
  { id: "tv-32", name: "TV (32\" LED)", category: "Entertainment", defaultWatts: 40, defaultQty: 1, defaultHours: 4, dutyCycle: 1, surgeWatts: 0 },
  { id: "tv-55", name: "TV (55\" LED)", category: "Entertainment", defaultWatts: 80, defaultQty: 1, defaultHours: 4, dutyCycle: 1, surgeWatts: 0 },
  { id: "gaming-console", name: "Gaming Console", category: "Entertainment", defaultWatts: 150, defaultQty: 1, defaultHours: 3, dutyCycle: 1, surgeWatts: 0 },
  { id: "portable-speaker", name: "Portable Speaker", category: "Entertainment", defaultWatts: 10, defaultQty: 1, defaultHours: 4, dutyCycle: 1, surgeWatts: 0 },
  { id: "projector", name: "Projector (LED)", category: "Entertainment", defaultWatts: 200, defaultQty: 1, defaultHours: 3, dutyCycle: 1, surgeWatts: 0, notes: "LED projector; lamp-based models: 300-400W" },

  // ── Tools ─────────────────────────────────────────────────────────────────
  { id: "drill-charger", name: "Drill Charger", category: "Tools", defaultWatts: 50, defaultQty: 1, defaultHours: 2, dutyCycle: 1, surgeWatts: 0 },
  { id: "work-light", name: "Work Light", category: "Tools", defaultWatts: 25, defaultQty: 1, defaultHours: 4, dutyCycle: 1, surgeWatts: 0 },
  { id: "circular-saw", name: "Circular Saw", category: "Tools", defaultWatts: 1400, defaultQty: 1, defaultHours: 0.5, dutyCycle: 1, surgeWatts: 2200, notes: "High surge on startup" },
  { id: "air-compressor", name: "Air Compressor", category: "Tools", defaultWatts: 1500, defaultQty: 1, defaultHours: 0.5, dutyCycle: 1, surgeWatts: 3000, notes: "Portable, high inrush" },
  { id: "angle-grinder", name: "Angle Grinder", category: "Tools", defaultWatts: 900, defaultQty: 1, defaultHours: 0.5, dutyCycle: 1, surgeWatts: 1800 },
  { id: "sewing-machine", name: "Sewing Machine", category: "Tools", defaultWatts: 100, defaultQty: 1, defaultHours: 2, dutyCycle: 1, surgeWatts: 0 },
  { id: "garage-door-opener", name: "Garage Door Opener", category: "Tools", defaultWatts: 600, defaultQty: 1, defaultHours: 0.05, dutyCycle: 1, surgeWatts: 1200, notes: "~3 min/day (2 open/close cycles)" },
  { id: "ev-charger-l1", name: "EV Charger (Level 1)", category: "Tools", defaultWatts: 1400, defaultQty: 1, defaultHours: 8, dutyCycle: 1, surgeWatts: 0, notes: "120V/12A; Level 2 requires 7000W+ (not solar-viable)" },

  // ── Medical ───────────────────────────────────────────────────────────────
  { id: "cpap", name: "CPAP Machine", category: "Medical", defaultWatts: 60, defaultQty: 1, defaultHours: 8, dutyCycle: 1, surgeWatts: 0, notes: "With heated humidifier; without humidifier: ~30W" },
  { id: "oxygen-concentrator", name: "Oxygen Concentrator", category: "Medical", defaultWatts: 300, defaultQty: 1, defaultHours: 12, dutyCycle: 1, surgeWatts: 0 },
  { id: "nebulizer", name: "Nebulizer", category: "Medical", defaultWatts: 50, defaultQty: 1, defaultHours: 0.5, dutyCycle: 1, surgeWatts: 0 },
];

export const APPLIANCE_CATEGORIES = [
  "Lighting",
  "Communication",
  "Kitchen",
  "Climate",
  "Water",
  "Laundry",
  "Personal",
  "Entertainment",
  "Tools",
  "Medical",
] as const;

// Quick-load presets
export interface LoadPreset {
  id: string;
  label: string;
  description: string;
  applianceIds: string[];
}

export const LOAD_PRESETS: LoadPreset[] = [
  {
    id: "van-life",
    label: "Van Life",
    description: "Lights, phone, laptop, fan, mini fridge",
    applianceIds: ["led-light", "phone-charger", "laptop", "12v-fan", "mini-fridge"],
  },
  {
    id: "weekend-cabin",
    label: "Weekend Cabin",
    description: "Lights, router, fridge, coffee maker, fan, hair dryer",
    applianceIds: ["led-light", "led-strip", "phone-charger", "wifi-router", "mini-fridge", "coffee-maker", "box-fan", "hair-dryer"],
  },
  {
    id: "homestead",
    label: "Homestead",
    description: "Full setup: lights, security, fridge, freezer, well pump, washer",
    applianceIds: ["led-light", "security-floodlight", "phone-charger", "wifi-router", "security-cameras", "mini-fridge", "coffee-maker", "well-pump", "chest-freezer", "box-fan", "washing-machine"],
  },
  {
    id: "boat",
    label: "Boat / Marine",
    description: "Lights, phone, fridge, water pump, fan",
    applianceIds: ["led-light", "phone-charger", "mini-fridge", "rv-water-pump", "12v-fan"],
  },
  {
    id: "emergency",
    label: "Emergency Backup",
    description: "Lights, phone, fridge, CPAP, sump pump",
    applianceIds: ["led-light", "phone-charger", "mini-fridge", "cpap", "sump-pump"],
  },
];
