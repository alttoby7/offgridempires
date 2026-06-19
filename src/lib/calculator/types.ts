import type { Kit } from "@/lib/demo-data";

// ── Appliance Catalog ───────────────────────────────────────────────────────

export interface ApplianceDef {
  id: string;
  name: string;
  category: ApplianceCategory;
  defaultWatts: number;
  defaultQty: number;
  defaultHours: number;
  dutyCycle: number;
  surgeWatts: number;
  notes?: string;
}

export type ApplianceCategory =
  | "Lighting"
  | "Communication"
  | "Kitchen"
  | "Climate"
  | "Water"
  | "Laundry"
  | "Personal"
  | "Entertainment"
  | "Tools"
  | "Medical";

// ── User Load Entry ─────────────────────────────────────────────────────────

export interface LoadEntry {
  id: string;
  name: string;
  watts: number;
  qty: number;
  hoursPerDay: number;
  dutyCycle: number;
  surgeWatts: number;
  isCustom: boolean;
}

// ── Location & Assumptions ──────────────────────────────────────────────────

export type SunTier = "poor" | "average" | "good" | "desert";

export interface SystemAssumptions {
  sunHoursPerDay: number;
  sunSource: "zip" | "tier";
  zipCode: string;
  sunTier: SunTier;
  autonomyDays: number;
  controllerType: "mppt" | "pwm";
  batteryChemistry: "lifepo4" | "agm";
}

// ── Efficiency Constants ────────────────────────────────────────────────────

export interface EfficiencyFactors {
  mppt: number;
  pwm: number;
  inverter: number;
  misc: number;
  lifepo4DoD: number;
  agmDoD: number;
}

// ── Sizing Result ───────────────────────────────────────────────────────────

export interface SizingResult {
  totalDailyWh: number;
  peakContinuousWatts: number;
  peakSurgeWatts: number;
  requiredPanelWatts: number;
  requiredStorageWh: number;
  requiredInverterWatts: number;
  systemEfficiency: number;
}

// ── Verdicts ("what works / what won't") ────────────────────────────────────

export type VerdictSeverity = "blocker" | "warning" | "ok";

export interface Verdict {
  /** Stable id, used for React keys + dedupe */
  id: string;
  severity: VerdictSeverity;
  /** Plain-English headline, e.g. "Your well pump can stall a right-sized inverter" */
  title: string;
  /** Why it happens — the field reality the raw math misses */
  detail: string;
  /** What to actually do about it (omitted on "ok") */
  fix?: string;
}

// ── Kit Match ───────────────────────────────────────────────────────────────

export type FitBucket =
  | "meets"
  | "near"
  | "lighter"
  | "solar-only"
  | "undersized";

export interface KitMatch {
  kit: Kit;
  solarCoverage: number;
  storageCoverage: number;
  inverterCoverage: number;
  bucket: FitBucket;
  gaps: string[];
  score: number;
}

// ── Calculator State ────────────────────────────────────────────────────────

export interface CalculatorState {
  step: 1 | 2 | 3;
  loads: LoadEntry[];
  assumptions: SystemAssumptions;
}
