import type {
  LoadEntry,
  SystemAssumptions,
  SizingResult,
  KitMatch,
  FitBucket,
  EfficiencyFactors,
} from "./types";
import type { Kit } from "@/lib/demo-data";

// ── Efficiency Constants ────────────────────────────────────────────────────

export const EFFICIENCY: EfficiencyFactors = {
  mppt: 0.94,
  pwm: 0.80,
  inverter: 0.90,
  misc: 0.95,
  lifepo4DoD: 0.90,
  agmDoD: 0.50,
};

// ── Compute daily Wh for a single load entry ────────────────────────────────

export function computeLoadWh(entry: LoadEntry): number {
  return entry.watts * entry.qty * entry.hoursPerDay * entry.dutyCycle;
}

// ── Main sizing computation ─────────────────────────────────────────────────

export function computeSizing(
  loads: LoadEntry[],
  assumptions: SystemAssumptions
): SizingResult {
  const totalDailyWh = loads.reduce((sum, l) => sum + computeLoadWh(l), 0);
  const peakContinuousWatts = loads.reduce((sum, l) => sum + l.watts * l.qty, 0);
  const peakSurgeWatts = loads.length > 0
    ? Math.max(...loads.map((l) => l.surgeWatts * l.qty))
    : 0;

  const controllerEff =
    assumptions.controllerType === "mppt" ? EFFICIENCY.mppt : EFFICIENCY.pwm;
  const dod =
    assumptions.batteryChemistry === "lifepo4"
      ? EFFICIENCY.lifepo4DoD
      : EFFICIENCY.agmDoD;
  const systemEfficiency = controllerEff * EFFICIENCY.inverter * EFFICIENCY.misc;

  const requiredPanelWatts =
    assumptions.sunHoursPerDay > 0
      ? Math.ceil(totalDailyWh / (assumptions.sunHoursPerDay * controllerEff * EFFICIENCY.misc))
      : 0;

  const requiredStorageWh = Math.ceil(
    (totalDailyWh * assumptions.autonomyDays) / dod
  );

  const requiredInverterWatts = Math.ceil(
    peakContinuousWatts / EFFICIENCY.inverter
  );

  return {
    totalDailyWh: Math.round(totalDailyWh),
    peakContinuousWatts,
    peakSurgeWatts,
    requiredPanelWatts,
    requiredStorageWh,
    requiredInverterWatts,
    systemEfficiency,
  };
}

// ── Kit matching ────────────────────────────────────────────────────────────

const BUCKET_ORDER: Record<FitBucket, number> = {
  meets: 0,
  near: 1,
  lighter: 2,
  "solar-only": 3,
  undersized: 4,
};

export function matchKits(sizing: SizingResult, kits: Kit[]): KitMatch[] {
  if (sizing.totalDailyWh === 0) return [];

  return kits
    .map((kit) => {
      const solarCoverage =
        sizing.requiredPanelWatts > 0
          ? (kit.panelWatts / sizing.requiredPanelWatts) * 100
          : 100;
      const storageCoverage =
        sizing.requiredStorageWh > 0
          ? (kit.storageWh / sizing.requiredStorageWh) * 100
          : 100;
      const inverterCoverage =
        sizing.requiredInverterWatts > 0
          ? (kit.inverterWatts / sizing.requiredInverterWatts) * 100
          : 100;

      const gaps: string[] = [];
      if (solarCoverage < 100) {
        gaps.push(
          `Need ${(sizing.requiredPanelWatts - kit.panelWatts).toLocaleString()}W more solar`
        );
      }
      if (storageCoverage < 100) {
        const need = sizing.requiredStorageWh - kit.storageWh;
        gaps.push(
          need >= 1000
            ? `Need ${(need / 1000).toFixed(1)}kWh more storage`
            : `Need ${need.toLocaleString()}Wh more storage`
        );
      }
      if (inverterCoverage < 100) {
        gaps.push(
          `Need ${(sizing.requiredInverterWatts - kit.inverterWatts).toLocaleString()}W more inverter`
        );
      }
      if (!kit.included.battery) {
        gaps.push("Kit does not include a battery");
      }
      if (!kit.included.inverter) {
        gaps.push("Kit does not include an inverter");
      }

      const minCoverage = Math.min(solarCoverage, storageCoverage, inverterCoverage);
      const isSolarOnly =
        solarCoverage >= 80 && (kit.storageWh === 0 || kit.inverterWatts === 0);

      let bucket: FitBucket;
      if (minCoverage >= 100 && kit.included.battery && kit.included.inverter) {
        bucket = "meets";
      } else if (isSolarOnly) {
        bucket = "solar-only";
      } else if (minCoverage >= 80) {
        bucket = "near";
      } else if (minCoverage >= 50) {
        bucket = "lighter";
      } else {
        bucket = "undersized";
      }

      const score = (solarCoverage + storageCoverage + inverterCoverage) / 3;

      return {
        kit,
        solarCoverage,
        storageCoverage,
        inverterCoverage,
        bucket,
        gaps,
        score,
      };
    })
    .sort((a, b) => {
      const diff = BUCKET_ORDER[a.bucket] - BUCKET_ORDER[b.bucket];
      if (diff !== 0) return diff;
      return b.score - a.score;
    });
}

// ── Bucket labels ───────────────────────────────────────────────────────────

export const BUCKET_LABELS: Record<FitBucket, { label: string; color: string }> = {
  meets: { label: "Meets Your Needs", color: "var(--success)" },
  near: { label: "Near Fit", color: "var(--accent)" },
  lighter: { label: "Only If Lighter Usage", color: "var(--warning)" },
  "solar-only": { label: "Solar-Only Starter", color: "var(--text-muted)" },
  undersized: { label: "Undersized", color: "var(--danger)" },
};
