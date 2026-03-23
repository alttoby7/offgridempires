import type { LoadEntry, SystemAssumptions } from "./types";
import { APPLIANCE_CATALOG } from "./appliances";

// ── Encode ──────────────────────────────────────────────────────────────────

function encodeCatalogLoad(entry: LoadEntry): string | null {
  const def = APPLIANCE_CATALOG.find((a) => a.name === entry.name);
  if (!def || entry.isCustom) return null;
  return `${def.id}~${entry.qty}~${entry.hoursPerDay}`;
}

function encodeCustomLoad(entry: LoadEntry): string {
  return `${encodeURIComponent(entry.name)}~${entry.watts}~${entry.qty}~${entry.hoursPerDay}~${entry.dutyCycle}~${entry.surgeWatts}`;
}

export function encodeState(
  step: 1 | 2 | 3,
  loads: LoadEntry[],
  assumptions: SystemAssumptions
): URLSearchParams {
  const params = new URLSearchParams();
  params.set("v", "1");
  params.set("step", String(step));

  // Catalog loads
  const catalogParts: string[] = [];
  const customParts: string[] = [];

  for (const load of loads) {
    const catalog = encodeCatalogLoad(load);
    if (catalog) {
      catalogParts.push(catalog);
    } else {
      customParts.push(encodeCustomLoad(load));
    }
  }

  if (catalogParts.length > 0) params.set("l", catalogParts.join(","));
  if (customParts.length > 0) params.set("c", customParts.join(","));

  // Assumptions — only encode non-defaults
  params.set("sun", String(assumptions.sunHoursPerDay));
  if (assumptions.zipCode) params.set("zip", assumptions.zipCode);
  if (assumptions.controllerType !== "mppt") params.set("ctrl", assumptions.controllerType);
  if (assumptions.batteryChemistry !== "lifepo4") params.set("chem", assumptions.batteryChemistry);
  if (assumptions.autonomyDays !== 1) params.set("auto", String(assumptions.autonomyDays));

  return params;
}

// ── Decode ──────────────────────────────────────────────────────────────────

let decodeCounter = 0;

function decodeCatalogLoad(encoded: string): LoadEntry | null {
  const parts = encoded.split("~");
  if (parts.length < 3) return null;

  const [id, qtyStr, hoursStr] = parts;
  const def = APPLIANCE_CATALOG.find((a) => a.id === id);
  if (!def) return null;

  return {
    id: `url-${++decodeCounter}`,
    name: def.name,
    watts: def.defaultWatts,
    qty: Number(qtyStr) || def.defaultQty,
    hoursPerDay: Number(hoursStr) || def.defaultHours,
    dutyCycle: def.dutyCycle,
    surgeWatts: def.surgeWatts,
    isCustom: false,
  };
}

function decodeCustomLoad(encoded: string): LoadEntry | null {
  const parts = encoded.split("~");
  if (parts.length < 6) return null;

  const [name, watts, qty, hours, duty, surge] = parts;

  return {
    id: `url-custom-${++decodeCounter}`,
    name: decodeURIComponent(name),
    watts: Number(watts) || 100,
    qty: Number(qty) || 1,
    hoursPerDay: Number(hours) || 1,
    dutyCycle: Number(duty) || 1,
    surgeWatts: Number(surge) || 0,
    isCustom: true,
  };
}

interface DecodedState {
  step: 1 | 2 | 3;
  loads: LoadEntry[];
  assumptions: SystemAssumptions;
}

export function decodeState(params: URLSearchParams): DecodedState | null {
  if (!params.has("v")) return null;

  const step = Math.min(3, Math.max(1, Number(params.get("step")) || 1)) as 1 | 2 | 3;

  // Decode loads
  const loads: LoadEntry[] = [];

  const catalogStr = params.get("l");
  if (catalogStr) {
    for (const part of catalogStr.split(",")) {
      const entry = decodeCatalogLoad(part);
      if (entry) loads.push(entry);
    }
  }

  const customStr = params.get("c");
  if (customStr) {
    for (const part of customStr.split(",")) {
      const entry = decodeCustomLoad(part);
      if (entry) loads.push(entry);
    }
  }

  // Decode assumptions — prefer explicit sun value over ZIP re-lookup
  const sunHoursPerDay = Number(params.get("sun")) || 4.5;
  const zipCode = params.get("zip") || "";
  const controllerType = params.get("ctrl") === "pwm" ? "pwm" as const : "mppt" as const;
  const batteryChemistry = params.get("chem") === "agm" ? "agm" as const : "lifepo4" as const;
  const autonomyDays = Number(params.get("auto")) || 1;

  let sunTier: "poor" | "average" | "good" | "desert" = "average";
  if (sunHoursPerDay <= 3.9) sunTier = "poor";
  else if (sunHoursPerDay <= 4.9) sunTier = "average";
  else if (sunHoursPerDay <= 5.9) sunTier = "good";
  else sunTier = "desert";

  const assumptions: SystemAssumptions = {
    sunHoursPerDay,
    sunSource: zipCode ? "zip" : "tier",
    zipCode,
    sunTier,
    autonomyDays,
    controllerType,
    batteryChemistry,
  };

  return { step, loads, assumptions };
}
