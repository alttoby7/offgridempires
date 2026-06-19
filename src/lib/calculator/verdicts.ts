import type { LoadEntry, SystemAssumptions, SizingResult, Verdict } from "./types";
import { APPLIANCE_CATALOG } from "./appliances";
import { FAILURE_NOTES } from "./failure-notes";

/**
 * The verdict engine — the "what works / what won't" moat.
 *
 * Turns the already-computed sizing signals (peakSurgeWatts, autonomy, the load
 * list) into plain-English, opinionated verdicts with a fix. Two sources, blended:
 *   1. Deterministic rules below (config-level: surge headroom, autonomy, chemistry).
 *   2. Curated real-world failure notes (appliance-level), from failure-notes.ts.
 *
 * This is intentionally judgment, not prettier math: every verdict either blocks a
 * setup that will fail or warns about a choice that quietly costs money/uptime.
 */

const SEVERITY_ORDER: Record<Verdict["severity"], number> = {
  blocker: 0,
  warning: 1,
  ok: 2,
};

/** Map a load back to its catalog appliance id (loads carry the catalog name). */
function applianceIdFor(load: LoadEntry): string | null {
  const def = APPLIANCE_CATALOG.find((a) => a.name === load.name);
  return def?.id ?? null;
}

/** Round up to a tidy inverter size in watts. */
function roundUpInverter(watts: number): number {
  return Math.ceil(watts / 500) * 500;
}

export function computeVerdicts(
  loads: LoadEntry[],
  assumptions: SystemAssumptions,
  sizing: SizingResult
): Verdict[] {
  if (loads.length === 0) return [];

  const verdicts: Verdict[] = [];
  const presentIds = new Set(
    loads.map(applianceIdFor).filter((id): id is string => id !== null)
  );

  // ── Curated real-world notes (appliance-level) ────────────────────────────
  // Run these first; they own the specific painful appliances with rich detail.
  const coveredIds = new Set<string>();
  for (const note of FAILURE_NOTES) {
    if (note.appliances.some((id) => presentIds.has(id))) {
      verdicts.push({
        id: note.id,
        severity: note.severity,
        title: note.title,
        detail: note.detail,
        fix: note.fix,
      });
      note.appliances.forEach((id) => coveredIds.add(id));
    }
  }

  // ── Rule: inverter surge headroom (catches custom / uncovered loads) ───────
  // A right-sized inverter (requiredInverterWatts continuous) typically tolerates
  // ~2x surge for a moment. If the worst startup spike exceeds that, it can stall.
  const surgeCeiling = sizing.requiredInverterWatts * 2;
  if (sizing.peakSurgeWatts > surgeCeiling && sizing.requiredInverterWatts > 0) {
    const offender = [...loads].sort(
      (a, b) => b.surgeWatts * b.qty - a.surgeWatts * a.qty
    )[0];
    const offenderId = offender ? applianceIdFor(offender) : null;
    // Skip if a curated note already covers the offending appliance.
    if (!offenderId || !coveredIds.has(offenderId)) {
      const offenderSurge = offender ? offender.surgeWatts * offender.qty : sizing.peakSurgeWatts;
      verdicts.push({
        id: "rule-surge-headroom",
        severity: "blocker",
        title: `${offender?.name ?? "Your biggest motor load"} can stall a right-sized inverter on startup`,
        detail: `It spikes to about ${offenderSurge.toLocaleString()}W for a split second on start — past the ~${surgeCeiling.toLocaleString()}W surge ceiling of the ${sizing.requiredInverterWatts.toLocaleString()}W inverter your running watts call for.`,
        fix: `Step up to roughly a ${roundUpInverter(sizing.peakSurgeWatts / 2).toLocaleString()}W continuous inverter (so its surge clears ${sizing.peakSurgeWatts.toLocaleString()}W), or add a soft starter to that appliance.`,
      });
    }
  }

  // ── Rule: thin autonomy on critical / always-on loads ─────────────────────
  const CRITICAL_IDS = [
    "cpap",
    "oxygen-concentrator",
    "nebulizer",
    "mini-fridge",
    "chest-freezer",
    "well-pump",
    "sump-pump",
    "security-cameras",
    "starlink",
  ];
  const hasCritical = [...presentIds].some((id) => CRITICAL_IDS.includes(id));
  if (assumptions.autonomyDays <= 1 && hasCritical) {
    verdicts.push({
      id: "rule-low-autonomy",
      severity: "warning",
      title: "One day of battery autonomy is thin for the critical loads you listed",
      detail:
        "You have loads that can't simply wait for sun — fridge/freezer, a pump, medical gear, or always-on connectivity. A single overcast stretch can take the bank to empty before noon.",
      fix: "Plan 2–3 days of autonomy for critical setups. Bump the \"days of autonomy\" input and re-check the battery size.",
    });
  }

  // ── Rule: AGM usable-capacity penalty ─────────────────────────────────────
  if (assumptions.batteryChemistry === "agm") {
    verdicts.push({
      id: "rule-agm-penalty",
      severity: "warning",
      title: "AGM batteries give you only about half their rated capacity",
      detail:
        "To get a reasonable lifespan you can only pull AGM down to ~50%, so a 100Ah AGM bank is really ~50Ah of usable energy. LiFePO4 safely uses ~90%, nearly doubling real capacity per dollar over its life.",
      fix: "Unless you have a specific reason for AGM, switch the chemistry to LiFePO4 and re-size — it's usually cheaper per usable kWh over time.",
    });
  }

  // ── Dedupe + order (blocker → warning), then fall back to an "ok" ──────────
  const seen = new Set<string>();
  const deduped = verdicts.filter((v) => {
    if (seen.has(v.id)) return false;
    seen.add(v.id);
    return true;
  });

  deduped.sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]);

  if (deduped.length === 0) {
    deduped.push({
      id: "ok-clean",
      severity: "ok",
      title: "No red flags for this load list",
      detail:
        "Nothing here trips the usual off-grid traps — no brutal motor surges, runaway resistive heat, or critical loads left without buffer. Size to the numbers below and you're on solid ground.",
    });
  }

  return deduped;
}

/** Convenience for headlines: how many blockers / warnings in a verdict list. */
export function verdictCounts(verdicts: Verdict[]): {
  blockers: number;
  warnings: number;
} {
  return {
    blockers: verdicts.filter((v) => v.severity === "blocker").length,
    warnings: verdicts.filter((v) => v.severity === "warning").length,
  };
}
