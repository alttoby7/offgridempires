import type { ApplianceDef } from "./types";

export const APPLIANCE_CATALOG: ApplianceDef[] = [
  // ── Lighting ──────────────────────────────────────────────────────────────
  { id: "led-light", name: "LED Light", category: "Lighting", defaultWatts: 9, defaultQty: 4, defaultHours: 5, dutyCycle: 1, surgeWatts: 0 },
  { id: "led-strip", name: "LED Strip", category: "Lighting", defaultWatts: 15, defaultQty: 1, defaultHours: 4, dutyCycle: 1, surgeWatts: 0 },

  // ── Communication ─────────────────────────────────────────────────────────
  { id: "phone-charger", name: "Phone Charger", category: "Communication", defaultWatts: 18, defaultQty: 2, defaultHours: 2, dutyCycle: 1, surgeWatts: 0 },
  { id: "laptop", name: "Laptop", category: "Communication", defaultWatts: 65, defaultQty: 1, defaultHours: 4, dutyCycle: 1, surgeWatts: 0 },
  { id: "starlink", name: "Starlink", category: "Communication", defaultWatts: 50, defaultQty: 1, defaultHours: 12, dutyCycle: 1, surgeWatts: 0, notes: "V2 averages ~50W; V3 may differ" },
  { id: "wifi-router", name: "WiFi Router", category: "Communication", defaultWatts: 12, defaultQty: 1, defaultHours: 24, dutyCycle: 1, surgeWatts: 0 },

  // ── Kitchen ───────────────────────────────────────────────────────────────
  { id: "mini-fridge", name: "Mini Fridge", category: "Kitchen", defaultWatts: 60, defaultQty: 1, defaultHours: 24, dutyCycle: 0.33, surgeWatts: 600, notes: "Compressor cycles ~33% of runtime" },
  { id: "chest-freezer", name: "Chest Freezer", category: "Kitchen", defaultWatts: 50, defaultQty: 1, defaultHours: 24, dutyCycle: 0.33, surgeWatts: 500, notes: "Compressor cycles ~33% of runtime" },
  { id: "coffee-maker", name: "Coffee Maker", category: "Kitchen", defaultWatts: 800, defaultQty: 1, defaultHours: 0.25, dutyCycle: 1, surgeWatts: 0 },
  { id: "microwave", name: "Microwave", category: "Kitchen", defaultWatts: 1000, defaultQty: 1, defaultHours: 0.25, dutyCycle: 1, surgeWatts: 0 },

  // ── Climate ───────────────────────────────────────────────────────────────
  { id: "12v-fan", name: "12V Fan", category: "Climate", defaultWatts: 25, defaultQty: 1, defaultHours: 8, dutyCycle: 1, surgeWatts: 0 },
  { id: "box-fan", name: "Box Fan", category: "Climate", defaultWatts: 75, defaultQty: 1, defaultHours: 6, dutyCycle: 1, surgeWatts: 0 },
  { id: "window-ac", name: "Window AC (Small)", category: "Climate", defaultWatts: 500, defaultQty: 1, defaultHours: 8, dutyCycle: 0.5, surgeWatts: 1500, notes: "Compressor cycles ~50% of runtime" },

  // ── Tools ─────────────────────────────────────────────────────────────────
  { id: "drill-charger", name: "Drill Charger", category: "Tools", defaultWatts: 50, defaultQty: 1, defaultHours: 2, dutyCycle: 1, surgeWatts: 0 },
  { id: "work-light", name: "Work Light", category: "Tools", defaultWatts: 25, defaultQty: 1, defaultHours: 4, dutyCycle: 1, surgeWatts: 0 },
  { id: "circular-saw", name: "Circular Saw", category: "Tools", defaultWatts: 1400, defaultQty: 1, defaultHours: 0.5, dutyCycle: 1, surgeWatts: 2200, notes: "High surge on startup" },

  // ── Medical ───────────────────────────────────────────────────────────────
  { id: "cpap", name: "CPAP Machine", category: "Medical", defaultWatts: 40, defaultQty: 1, defaultHours: 8, dutyCycle: 1, surgeWatts: 0 },
  { id: "oxygen-concentrator", name: "Oxygen Concentrator", category: "Medical", defaultWatts: 300, defaultQty: 1, defaultHours: 12, dutyCycle: 1, surgeWatts: 0 },
];

export const APPLIANCE_CATEGORIES = [
  "Lighting",
  "Communication",
  "Kitchen",
  "Climate",
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
    id: "emergency",
    label: "Emergency Backup",
    description: "Lights, phone, fridge, CPAP",
    applianceIds: ["led-light", "phone-charger", "mini-fridge", "cpap"],
  },
];
