"use client";

import { useMemo, useState } from "react";

interface Appliance {
  id: string;
  label: string;
  watts: number;
  defaultHours: number;
}

const APPLIANCE_LIBRARY: { group: string; items: Appliance[] }[] = [
  {
    group: "Lighting",
    items: [
      { id: "led-bulb", label: "LED bulb (10W)", watts: 10, defaultHours: 4 },
      { id: "led-strip", label: "LED strip (24W)", watts: 24, defaultHours: 4 },
    ],
  },
  {
    group: "Electronics",
    items: [
      { id: "phone-charger", label: "Phone charger", watts: 5, defaultHours: 3 },
      { id: "laptop", label: "Laptop (65W)", watts: 65, defaultHours: 4 },
      { id: "router", label: "Wi-Fi router", watts: 10, defaultHours: 24 },
      { id: "tv", label: "32&quot; LED TV", watts: 50, defaultHours: 3 },
    ],
  },
  {
    group: "Refrigeration",
    items: [
      { id: "12v-fridge", label: "12V cooler/fridge (40W)", watts: 40, defaultHours: 12 },
      { id: "mini-fridge", label: "Mini fridge (90W)", watts: 90, defaultHours: 8 },
      { id: "full-fridge", label: "Full-size fridge", watts: 150, defaultHours: 8 },
      { id: "chest-freezer", label: "Chest freezer", watts: 100, defaultHours: 8 },
    ],
  },
  {
    group: "Climate",
    items: [
      { id: "ceiling-fan", label: "Ceiling fan", watts: 75, defaultHours: 6 },
      { id: "space-heater", label: "Space heater (1500W)", watts: 1500, defaultHours: 2 },
      { id: "window-ac", label: "Window AC (700W)", watts: 700, defaultHours: 4 },
    ],
  },
  {
    group: "Appliances",
    items: [
      { id: "microwave", label: "Microwave", watts: 1000, defaultHours: 0.25 },
      { id: "coffee-maker", label: "Coffee maker", watts: 900, defaultHours: 0.25 },
      { id: "circular-saw", label: "Circular saw", watts: 1200, defaultHours: 0.5 },
    ],
  },
];

interface SelectedAppliance {
  id: string;
  hours: number;
  qty: number;
}

interface PresetConfig {
  id: string;
  label: string;
  description: string;
  appliances: { id: string; hours: number; qty: number }[];
  voltage: 12 | 24 | 48;
  autonomyDays: number;
}

const PRESETS: PresetConfig[] = [
  {
    id: "weekend-cabin",
    label: "Weekend cabin",
    description: "Lights, phones, small fridge",
    appliances: [
      { id: "led-bulb", hours: 4, qty: 4 },
      { id: "phone-charger", hours: 3, qty: 2 },
      { id: "12v-fridge", hours: 12, qty: 1 },
    ],
    voltage: 12,
    autonomyDays: 2,
  },
  {
    id: "rv-fulltime",
    label: "RV full-time",
    description: "Fridge, fan, electronics",
    appliances: [
      { id: "led-strip", hours: 4, qty: 1 },
      { id: "phone-charger", hours: 3, qty: 2 },
      { id: "laptop", hours: 4, qty: 1 },
      { id: "12v-fridge", hours: 12, qty: 1 },
      { id: "ceiling-fan", hours: 6, qty: 1 },
    ],
    voltage: 12,
    autonomyDays: 1,
  },
  {
    id: "off-grid-home",
    label: "Off-grid home",
    description: "Full-size fridge, lights, electronics, light cooking",
    appliances: [
      { id: "led-bulb", hours: 4, qty: 8 },
      { id: "router", hours: 24, qty: 1 },
      { id: "laptop", hours: 6, qty: 2 },
      { id: "tv", hours: 3, qty: 1 },
      { id: "full-fridge", hours: 8, qty: 1 },
      { id: "chest-freezer", hours: 8, qty: 1 },
      { id: "microwave", hours: 0.25, qty: 1 },
    ],
    voltage: 48,
    autonomyDays: 3,
  },
  {
    id: "emergency-backup",
    label: "Emergency backup",
    description: "3-day outage essentials",
    appliances: [
      { id: "led-bulb", hours: 4, qty: 4 },
      { id: "phone-charger", hours: 3, qty: 3 },
      { id: "router", hours: 24, qty: 1 },
      { id: "full-fridge", hours: 8, qty: 1 },
    ],
    voltage: 12,
    autonomyDays: 3,
  },
];

const APP_BY_ID: Record<string, Appliance> = Object.fromEntries(
  APPLIANCE_LIBRARY.flatMap((g) => g.items).map((a) => [a.id, a])
);

const INVERTER_EFFICIENCY = 0.9;
const LIFEPO4_USABLE_DOD = 0.8;
const LEAD_ACID_USABLE_DOD = 0.5;

export function BatterySizingCalculator() {
  const [selected, setSelected] = useState<Record<string, SelectedAppliance>>({});
  const [voltage, setVoltage] = useState<12 | 24 | 48>(12);
  const [autonomyDays, setAutonomyDays] = useState(2);
  const [chemistry, setChemistry] = useState<"lifepo4" | "lead-acid">("lifepo4");

  function loadPreset(preset: PresetConfig) {
    const next: Record<string, SelectedAppliance> = {};
    for (const a of preset.appliances) {
      next[a.id] = a;
    }
    setSelected(next);
    setVoltage(preset.voltage);
    setAutonomyDays(preset.autonomyDays);
  }

  function toggleAppliance(id: string) {
    setSelected((prev) => {
      if (prev[id]) {
        const { [id]: _, ...rest } = prev;
        return rest;
      }
      const a = APP_BY_ID[id];
      return { ...prev, [id]: { id, hours: a.defaultHours, qty: 1 } };
    });
  }

  function updateAppliance(id: string, key: "hours" | "qty", value: number) {
    setSelected((prev) =>
      prev[id] ? { ...prev, [id]: { ...prev[id], [key]: value } } : prev
    );
  }

  const dailyWh = useMemo(() => {
    return Object.values(selected).reduce((sum, sa) => {
      const a = APP_BY_ID[sa.id];
      return sum + a.watts * sa.hours * sa.qty;
    }, 0);
  }, [selected]);

  const acAdjustedWh = dailyWh / INVERTER_EFFICIENCY;
  const usableDoD = chemistry === "lifepo4" ? LIFEPO4_USABLE_DOD : LEAD_ACID_USABLE_DOD;
  const requiredBankWh = (acAdjustedWh * autonomyDays) / usableDoD;
  const requiredBankAh = requiredBankWh / voltage;

  const hasSelection = Object.keys(selected).length > 0;

  return (
    <div className="space-y-8">
      {/* Presets */}
      <section>
        <h2 className="font-display text-lg text-[var(--ink)] mb-3">Start from a preset</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.id}
              onClick={() => loadPreset(p)}
              className="text-left p-3 rounded-sm border border-[var(--rule)] hover:border-[var(--accent)] hover:bg-[var(--bg-secondary)] transition-colors"
            >
              <div className="font-medium text-sm text-[var(--ink)]">{p.label}</div>
              <div className="text-xs text-[var(--ink-muted)] mt-1">{p.description}</div>
            </button>
          ))}
        </div>
      </section>

      {/* Appliance picker */}
      <section>
        <h2 className="font-display text-lg text-[var(--ink)] mb-3">Pick your loads</h2>
        <div className="space-y-4">
          {APPLIANCE_LIBRARY.map((group) => (
            <div key={group.group}>
              <p className="eyebrow !text-[var(--ink-muted)] mb-2">{group.group}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {group.items.map((a) => {
                  const sa = selected[a.id];
                  return (
                    <div
                      key={a.id}
                      className={`flex items-center gap-3 p-2.5 rounded-sm border transition-colors ${
                        sa
                          ? "border-[var(--accent)] bg-[var(--accent)]/5"
                          : "border-[var(--rule)]"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={!!sa}
                        onChange={() => toggleAppliance(a.id)}
                        className="h-4 w-4"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-[var(--ink)]">{a.label}</div>
                        {sa && (
                          <div className="mt-1.5 flex items-center gap-2 text-xs">
                            <label className="text-[var(--ink-muted)]">Qty</label>
                            <input
                              type="number"
                              min={1}
                              max={20}
                              value={sa.qty}
                              onChange={(e) =>
                                updateAppliance(a.id, "qty", Math.max(1, +e.target.value))
                              }
                              className="w-12 rounded-sm border border-[var(--rule)] px-1.5 py-0.5 tabular"
                            />
                            <label className="text-[var(--ink-muted)] ml-2">hrs/day</label>
                            <input
                              type="number"
                              min={0.25}
                              max={24}
                              step={0.25}
                              value={sa.hours}
                              onChange={(e) =>
                                updateAppliance(a.id, "hours", +e.target.value)
                              }
                              className="w-14 rounded-sm border border-[var(--rule)] px-1.5 py-0.5 tabular"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Sizing parameters */}
      <section>
        <h2 className="font-display text-lg text-[var(--ink)] mb-3">Sizing parameters</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs text-[var(--ink-muted)] mb-1">System voltage</label>
            <select
              value={voltage}
              onChange={(e) => setVoltage(+e.target.value as 12 | 24 | 48)}
              className="w-full rounded-sm border border-[var(--rule)] px-3 py-2 text-sm"
            >
              <option value={12}>12V (small/mobile)</option>
              <option value={24}>24V (mid-size)</option>
              <option value={48}>48V (whole-home)</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-[var(--ink-muted)] mb-1">Days of autonomy</label>
            <select
              value={autonomyDays}
              onChange={(e) => setAutonomyDays(+e.target.value)}
              className="w-full rounded-sm border border-[var(--rule)] px-3 py-2 text-sm"
            >
              <option value={1}>1 day (sun every day)</option>
              <option value={2}>2 days (light cloud cover)</option>
              <option value={3}>3 days (cloudy region)</option>
              <option value={4}>4 days (winter buffer)</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-[var(--ink-muted)] mb-1">Chemistry</label>
            <select
              value={chemistry}
              onChange={(e) => setChemistry(e.target.value as "lifepo4" | "lead-acid")}
              className="w-full rounded-sm border border-[var(--rule)] px-3 py-2 text-sm"
            >
              <option value="lifepo4">LiFePO4 (80% DoD)</option>
              <option value="lead-acid">Lead-acid (50% DoD)</option>
            </select>
          </div>
        </div>
      </section>

      {/* Results */}
      <section className="border border-[var(--ink)] rounded-sm bg-[var(--paper)] p-6">
        <p className="eyebrow mb-2">Result</p>
        {!hasSelection ? (
          <p className="text-sm text-[var(--ink-soft)]">
            Pick at least one appliance to size your battery bank.
          </p>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-[var(--ink-muted)] uppercase tracking-wider">Daily load</p>
                <p className="font-display text-2xl text-[var(--ink)] tabular">
                  {dailyWh.toLocaleString("en-US", { maximumFractionDigits: 0 })} Wh
                </p>
              </div>
              <div>
                <p className="text-xs text-[var(--ink-muted)] uppercase tracking-wider">
                  Battery bank (Wh)
                </p>
                <p className="font-display text-2xl text-[var(--ink)] tabular">
                  {Math.round(requiredBankWh).toLocaleString("en-US")} Wh
                </p>
              </div>
              <div>
                <p className="text-xs text-[var(--ink-muted)] uppercase tracking-wider">
                  Battery bank (Ah at {voltage}V)
                </p>
                <p className="font-display text-2xl text-[var(--accent)] tabular">
                  {Math.round(requiredBankAh).toLocaleString("en-US")} Ah
                </p>
              </div>
            </div>
            <details className="text-xs text-[var(--ink-soft)] mt-4">
              <summary className="cursor-pointer text-[var(--accent)]">Show the math</summary>
              <div className="mt-3 space-y-1 font-[system-ui,sans-serif]">
                <div>Daily DC load: {Math.round(dailyWh).toLocaleString("en-US")} Wh</div>
                <div>
                  AC inverter losses (×{(1 / INVERTER_EFFICIENCY).toFixed(2)}):{" "}
                  {Math.round(acAdjustedWh).toLocaleString("en-US")} Wh/day
                </div>
                <div>
                  × {autonomyDays} days autonomy ÷ {Math.round(usableDoD * 100)}% usable depth =
                  {" "}
                  {Math.round(requiredBankWh).toLocaleString("en-US")} Wh battery bank
                </div>
                <div>
                  ÷ {voltage}V = {Math.round(requiredBankAh).toLocaleString("en-US")} Ah at the
                  battery
                </div>
              </div>
            </details>
          </div>
        )}
      </section>
    </div>
  );
}
