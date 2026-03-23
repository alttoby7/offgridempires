import type { ApplianceDef } from "./types";

export const APPLIANCE_CATALOG: ApplianceDef[] = [
  // ── Lighting ──────────────────────────────────────────────────────────────
  { id: "led-light", name: "LED Light", category: "Lighting", defaultWatts: 9, defaultQty: 4, defaultHours: 5, dutyCycle: 1, surgeWatts: 0 },
  { id: "led-strip", name: "LED Strip", category: "Lighting", defaultWatts: 15, defaultQty: 1, defaultHours: 4, dutyCycle: 1, surgeWatts: 0 },
  { id: "security-floodlight", name: "Security Floodlight", category: "Lighting", defaultWatts: 30, defaultQty: 2, defaultHours: 10, dutyCycle: 1, surgeWatts: 0, notes: "Dusk-to-dawn LED" },
  { id: "porch-light", name: "Porch Light", category: "Lighting", defaultWatts: 12, defaultQty: 1, defaultHours: 6, dutyCycle: 1, surgeWatts: 0 },

  // ── Communication ─────────────────────────────────────────────────────────
  { id: "phone-charger", name: "Phone Charger", category: "Communication", defaultWatts: 18, defaultQty: 2, defaultHours: 2, dutyCycle: 1, surgeWatts: 0 },
  { id: "tablet-charger", name: "Tablet Charger", category: "Communication", defaultWatts: 15, defaultQty: 1, defaultHours: 2, dutyCycle: 1, surgeWatts: 0 },
  { id: "laptop", name: "Laptop", category: "Communication", defaultWatts: 65, defaultQty: 1, defaultHours: 4, dutyCycle: 1, surgeWatts: 0 },
  { id: "starlink", name: "Starlink", category: "Communication", defaultWatts: 50, defaultQty: 1, defaultHours: 12, dutyCycle: 1, surgeWatts: 0, notes: "V2 averages ~50W; V3 may differ" },
  { id: "wifi-router", name: "WiFi Router", category: "Communication", defaultWatts: 12, defaultQty: 1, defaultHours: 24, dutyCycle: 1, surgeWatts: 0 },
  { id: "security-cameras", name: "Security Camera System", category: "Communication", defaultWatts: 30, defaultQty: 1, defaultHours: 24, dutyCycle: 1, surgeWatts: 0, notes: "NVR + 4 cameras" },

  // ── Kitchen ───────────────────────────────────────────────────────────────
  { id: "mini-fridge", name: "Mini Fridge", category: "Kitchen", defaultWatts: 60, defaultQty: 1, defaultHours: 24, dutyCycle: 0.33, surgeWatts: 600, notes: "Compressor cycles ~33% of runtime" },
  { id: "chest-freezer", name: "Chest Freezer", category: "Kitchen", defaultWatts: 50, defaultQty: 1, defaultHours: 24, dutyCycle: 0.33, surgeWatts: 500, notes: "Compressor cycles ~33% of runtime" },
  { id: "coffee-maker", name: "Coffee Maker", category: "Kitchen", defaultWatts: 800, defaultQty: 1, defaultHours: 0.25, dutyCycle: 1, surgeWatts: 0 },
  { id: "microwave", name: "Microwave", category: "Kitchen", defaultWatts: 1000, defaultQty: 1, defaultHours: 0.25, dutyCycle: 1, surgeWatts: 0 },
  { id: "electric-kettle", name: "Electric Kettle", category: "Kitchen", defaultWatts: 1200, defaultQty: 1, defaultHours: 0.15, dutyCycle: 1, surgeWatts: 0, notes: "~10 min/day" },
  { id: "toaster", name: "Toaster", category: "Kitchen", defaultWatts: 800, defaultQty: 1, defaultHours: 0.1, dutyCycle: 1, surgeWatts: 0, notes: "~6 min/day" },
  { id: "blender", name: "Blender", category: "Kitchen", defaultWatts: 400, defaultQty: 1, defaultHours: 0.1, dutyCycle: 1, surgeWatts: 600 },
  { id: "instant-pot", name: "Instant Pot", category: "Kitchen", defaultWatts: 700, defaultQty: 1, defaultHours: 0.5, dutyCycle: 1, surgeWatts: 0, notes: "Average over cook cycle" },
  { id: "rice-cooker", name: "Rice Cooker", category: "Kitchen", defaultWatts: 400, defaultQty: 1, defaultHours: 0.5, dutyCycle: 1, surgeWatts: 0 },

  // ── Climate ───────────────────────────────────────────────────────────────
  { id: "12v-fan", name: "12V Fan", category: "Climate", defaultWatts: 25, defaultQty: 1, defaultHours: 8, dutyCycle: 1, surgeWatts: 0 },
  { id: "box-fan", name: "Box Fan", category: "Climate", defaultWatts: 75, defaultQty: 1, defaultHours: 6, dutyCycle: 1, surgeWatts: 0 },
  { id: "ceiling-fan", name: "Ceiling Fan", category: "Climate", defaultWatts: 60, defaultQty: 1, defaultHours: 8, dutyCycle: 1, surgeWatts: 0 },
  { id: "window-ac", name: "Window AC (Small)", category: "Climate", defaultWatts: 500, defaultQty: 1, defaultHours: 8, dutyCycle: 0.5, surgeWatts: 1500, notes: "Compressor cycles ~50% of runtime" },
  { id: "space-heater", name: "Space Heater (Small)", category: "Climate", defaultWatts: 750, defaultQty: 1, defaultHours: 4, dutyCycle: 1, surgeWatts: 0, notes: "Ceramic 750W low setting" },
  { id: "dehumidifier", name: "Dehumidifier", category: "Climate", defaultWatts: 300, defaultQty: 1, defaultHours: 8, dutyCycle: 0.5, surgeWatts: 600, notes: "Compressor cycles ~50%" },

  // ── Water ─────────────────────────────────────────────────────────────────
  { id: "well-pump", name: "Well Pump (½ HP)", category: "Water", defaultWatts: 750, defaultQty: 1, defaultHours: 1, dutyCycle: 1, surgeWatts: 1500, notes: "Typical submersible; runtime varies" },
  { id: "rv-water-pump", name: "RV Water Pump", category: "Water", defaultWatts: 60, defaultQty: 1, defaultHours: 1, dutyCycle: 1, surgeWatts: 0, notes: "12V demand pump" },
  { id: "tankless-water-heater", name: "Tankless Water Heater", category: "Water", defaultWatts: 1500, defaultQty: 1, defaultHours: 0.5, dutyCycle: 1, surgeWatts: 0, notes: "Small point-of-use electric" },

  // ── Entertainment ─────────────────────────────────────────────────────────
  { id: "tv-32", name: "TV (32\" LED)", category: "Entertainment", defaultWatts: 40, defaultQty: 1, defaultHours: 4, dutyCycle: 1, surgeWatts: 0 },
  { id: "tv-55", name: "TV (55\" LED)", category: "Entertainment", defaultWatts: 80, defaultQty: 1, defaultHours: 4, dutyCycle: 1, surgeWatts: 0 },
  { id: "gaming-console", name: "Gaming Console", category: "Entertainment", defaultWatts: 150, defaultQty: 1, defaultHours: 3, dutyCycle: 1, surgeWatts: 0 },
  { id: "portable-speaker", name: "Portable Speaker", category: "Entertainment", defaultWatts: 10, defaultQty: 1, defaultHours: 4, dutyCycle: 1, surgeWatts: 0 },

  // ── Tools ─────────────────────────────────────────────────────────────────
  { id: "drill-charger", name: "Drill Charger", category: "Tools", defaultWatts: 50, defaultQty: 1, defaultHours: 2, dutyCycle: 1, surgeWatts: 0 },
  { id: "work-light", name: "Work Light", category: "Tools", defaultWatts: 25, defaultQty: 1, defaultHours: 4, dutyCycle: 1, surgeWatts: 0 },
  { id: "circular-saw", name: "Circular Saw", category: "Tools", defaultWatts: 1400, defaultQty: 1, defaultHours: 0.5, dutyCycle: 1, surgeWatts: 2200, notes: "High surge on startup" },
  { id: "air-compressor", name: "Air Compressor", category: "Tools", defaultWatts: 1500, defaultQty: 1, defaultHours: 0.5, dutyCycle: 1, surgeWatts: 3000, notes: "Portable, high inrush" },
  { id: "angle-grinder", name: "Angle Grinder", category: "Tools", defaultWatts: 900, defaultQty: 1, defaultHours: 0.5, dutyCycle: 1, surgeWatts: 1800 },
  { id: "sewing-machine", name: "Sewing Machine", category: "Tools", defaultWatts: 100, defaultQty: 1, defaultHours: 2, dutyCycle: 1, surgeWatts: 0 },

  // ── Medical ───────────────────────────────────────────────────────────────
  { id: "cpap", name: "CPAP Machine", category: "Medical", defaultWatts: 40, defaultQty: 1, defaultHours: 8, dutyCycle: 1, surgeWatts: 0 },
  { id: "oxygen-concentrator", name: "Oxygen Concentrator", category: "Medical", defaultWatts: 300, defaultQty: 1, defaultHours: 12, dutyCycle: 1, surgeWatts: 0 },
  { id: "nebulizer", name: "Nebulizer", category: "Medical", defaultWatts: 50, defaultQty: 1, defaultHours: 0.5, dutyCycle: 1, surgeWatts: 0 },
];

export const APPLIANCE_CATEGORIES = [
  "Lighting",
  "Communication",
  "Kitchen",
  "Climate",
  "Water",
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
    description: "Lights, router, fridge, coffee maker, fan",
    applianceIds: ["led-light", "led-strip", "phone-charger", "wifi-router", "mini-fridge", "coffee-maker", "box-fan"],
  },
  {
    id: "homestead",
    label: "Homestead",
    description: "Full setup: lights, security, fridge, freezer, well pump",
    applianceIds: ["led-light", "security-floodlight", "phone-charger", "wifi-router", "security-cameras", "mini-fridge", "coffee-maker", "well-pump", "chest-freezer", "box-fan"],
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
    description: "Lights, phone, fridge, CPAP",
    applianceIds: ["led-light", "phone-charger", "mini-fridge", "cpap"],
  },
];
