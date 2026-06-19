/**
 * Canonical load profiles — the bridge between the static evidence graph and the
 * live verdict engine (computeVerdicts).
 *
 * The verdict engine takes a runtime `loads[]` from the calculator. For *static*
 * decision pages we precompute against a fixed set of named load profiles (the
 * decision-page intents). Each profile is a canonical `loads[] + assumptions{}`
 * defined ONCE here. The evidence builder runs `computeVerdicts()` per profile so
 * "verdict block tied to a real load profile" becomes a build-time fact.
 *
 * The 7 profiles map 1:1 to the ~25-40 decision pages we keep. Adding a profile is
 * a content decision (it can create a new indexable intent) and passes the human gate.
 *
 * IMPORTANT: each LoadEntry.name MUST exactly match an APPLIANCE_CATALOG name so the
 * 14 curated FailureNotes (which key off the catalog id via name lookup) can fire.
 * We therefore build loads straight from the catalog defaults — realistic watts,
 * surge, duty cycle, and hours per device, with optional per-profile overrides.
 *
 * See A4 — Evidence-Graph Spec §2.4.
 */

import { APPLIANCE_CATALOG } from "../src/lib/calculator/appliances";
import type {
  LoadEntry,
  SystemAssumptions,
  ApplianceDef,
} from "../src/lib/calculator/types";

export interface LoadProfile {
  id: string;
  label: string;
  /** Human-readable one-line summary of the load list (for LoadProfileMeta). */
  loadSummary: string;
  loads: LoadEntry[];
  assumptions: SystemAssumptions;
}

const CATALOG_BY_ID = new Map<string, ApplianceDef>(
  APPLIANCE_CATALOG.map((a) => [a.id, a])
);

/** Per-load spec: a catalog appliance id with optional overrides. */
interface LoadSpec {
  id: string;
  qty?: number;
  hoursPerDay?: number;
}

/** Build a LoadEntry from a catalog appliance (so name matches → failure notes fire). */
function makeLoad(spec: LoadSpec): LoadEntry {
  const def = CATALOG_BY_ID.get(spec.id);
  if (!def) {
    // Fail loud here too: a typo'd appliance id would silently drop a load.
    throw new Error(`load-profiles: unknown appliance id "${spec.id}"`);
  }
  return {
    id: def.id,
    name: def.name, // MUST equal catalog name for verdict engine mapping
    watts: def.defaultWatts,
    qty: spec.qty ?? def.defaultQty,
    hoursPerDay: spec.hoursPerDay ?? def.defaultHours,
    dutyCycle: def.dutyCycle,
    surgeWatts: def.surgeWatts,
    isCustom: false,
  };
}

/** Shared assumption baseline; profiles override what matters to their intent. */
function assumptions(over: Partial<SystemAssumptions>): SystemAssumptions {
  return {
    sunHoursPerDay: 4.5,
    sunSource: "tier",
    zipCode: "",
    sunTier: "average",
    autonomyDays: 1,
    controllerType: "mppt",
    batteryChemistry: "lifepo4",
    ...over,
  };
}

function profile(
  id: string,
  label: string,
  loadSummary: string,
  specs: LoadSpec[],
  over: Partial<SystemAssumptions>
): LoadProfile {
  return {
    id,
    label,
    loadSummary,
    loads: specs.map(makeLoad),
    assumptions: assumptions(over),
  };
}

/**
 * The 7 canonical profiles. Order is stable (drives deterministic iteration).
 */
export const LOAD_PROFILES: LoadProfile[] = [
  profile(
    "rv-weekend",
    "RV Weekend",
    "Lights, phone charging, laptop, a 12V fan, and a mini fridge for weekend RV trips.",
    [
      { id: "led-light", qty: 4 },
      { id: "phone-charger", qty: 2 },
      { id: "laptop" },
      { id: "12v-fan" },
      { id: "mini-fridge" },
    ],
    { autonomyDays: 1, sunTier: "good", sunHoursPerDay: 5.5 }
  ),

  profile(
    "cabin-fridge-lights",
    "Cabin: Fridge + Lights",
    "Lights, WiFi, a mini fridge, coffee maker, and a fan for a weekend cabin.",
    [
      { id: "led-light", qty: 6 },
      { id: "led-strip" },
      { id: "wifi-router" },
      { id: "mini-fridge" },
      { id: "coffee-maker" },
      { id: "box-fan" },
    ],
    { autonomyDays: 2, sunTier: "average", sunHoursPerDay: 4.5 }
  ),

  profile(
    "cpap-medical",
    "CPAP / Medical Backup",
    "A CPAP machine plus lights and phone charging — keep therapy running through a cloudy night.",
    [
      { id: "cpap" },
      { id: "led-light", qty: 2 },
      { id: "phone-charger" },
    ],
    { autonomyDays: 2, sunTier: "average", sunHoursPerDay: 4.5 }
  ),

  profile(
    "well-pump-homestead",
    "Homestead Well Pump",
    "A ½ HP well pump, fridge, freezer, lights, security cameras, and WiFi for a working homestead.",
    [
      { id: "well-pump" },
      { id: "mini-fridge" },
      { id: "chest-freezer" },
      { id: "led-light", qty: 8 },
      { id: "security-cameras" },
      { id: "wifi-router" },
    ],
    { autonomyDays: 3, sunTier: "average", sunHoursPerDay: 4.5 }
  ),

  profile(
    "starlink-remote-work",
    "Starlink Remote Work",
    "Always-on Starlink, WiFi, a laptop, lights, and phone charging for off-grid remote work.",
    [
      { id: "starlink" },
      { id: "wifi-router" },
      { id: "laptop" },
      { id: "led-light", qty: 4 },
      { id: "phone-charger", qty: 2 },
    ],
    { autonomyDays: 2, sunTier: "average", sunHoursPerDay: 4.5 }
  ),

  profile(
    "emergency-backup",
    "Emergency Backup",
    "Lights, phone charging, a fridge, CPAP, and a sump pump to ride out a grid outage.",
    [
      { id: "led-light", qty: 4 },
      { id: "phone-charger", qty: 2 },
      { id: "mini-fridge" },
      { id: "cpap" },
      { id: "sump-pump" },
    ],
    { autonomyDays: 3, sunTier: "average", sunHoursPerDay: 4.5 }
  ),

  profile(
    "whole-home-essentials",
    "Whole-Home Essentials",
    "Fridge, freezer, well pump, lights, WiFi, security, a washer, and a microwave — full-time off-grid essentials.",
    [
      { id: "mini-fridge" },
      { id: "chest-freezer" },
      { id: "well-pump" },
      { id: "led-light", qty: 10 },
      { id: "wifi-router" },
      { id: "security-cameras" },
      { id: "washing-machine" },
      { id: "microwave" },
    ],
    { autonomyDays: 2, sunTier: "average", sunHoursPerDay: 4.5 }
  ),
];
