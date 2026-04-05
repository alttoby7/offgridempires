"use client";

import { useReducer, useMemo, useId } from "react";
import Link from "next/link";
import type { Kit } from "@/lib/demo-data";

// ── Types ────────────────────────────────────────────────────────────────────

type Unit = "W" | "kW" | "Wh" | "kWh" | "mAh";
type Tab = "converter" | "load-calc";

interface ConverterState {
  value: string;
  fromUnit: Unit;
  toUnit: Unit;
  hours: string;
  voltage: string;
}

interface LoadRow {
  id: string;
  name: string;
  watts: string;
  hoursPerDay: string;
}

interface SizingAssumptions {
  sunHoursPerDay: number;
  autonomyDays: number;
  batteryChemistry: "lifepo4" | "agm";
}

type Action =
  | { type: "SET_TAB"; tab: Tab }
  | { type: "CONV_VALUE"; value: string }
  | { type: "CONV_FROM"; unit: Unit }
  | { type: "CONV_TO"; unit: Unit }
  | { type: "CONV_HOURS"; hours: string }
  | { type: "CONV_VOLTAGE"; voltage: string }
  | { type: "LOAD_UPDATE_ROW"; id: string; field: keyof Omit<LoadRow, "id">; value: string }
  | { type: "LOAD_ADD_ROW" }
  | { type: "LOAD_REMOVE_ROW"; id: string }
  | { type: "LOAD_SET_ASSUMPTION"; key: keyof SizingAssumptions; value: number | string };

interface ToolState {
  tab: Tab;
  converter: ConverterState;
  loads: LoadRow[];
  assumptions: SizingAssumptions;
}

// ── Default data ─────────────────────────────────────────────────────────────

const DEFAULT_LOADS: LoadRow[] = [
  { id: "fridge", name: "Mini fridge", watts: "150", hoursPerDay: "8" },
  { id: "lights", name: "LED lighting", watts: "40", hoursPerDay: "6" },
  { id: "laptop", name: "Laptop", watts: "45", hoursPerDay: "4" },
  { id: "phone", name: "Phone charging", watts: "5", hoursPerDay: "2" },
  { id: "pump", name: "Water pump", watts: "60", hoursPerDay: "0.5" },
];

const DEFAULT_ASSUMPTIONS: SizingAssumptions = {
  sunHoursPerDay: 5,
  autonomyDays: 1.5,
  batteryChemistry: "lifepo4",
};

const INITIAL_STATE: ToolState = {
  tab: "converter",
  converter: {
    value: "",
    fromUnit: "W",
    toUnit: "kW",
    hours: "1",
    voltage: "12",
  },
  loads: DEFAULT_LOADS,
  assumptions: DEFAULT_ASSUMPTIONS,
};

// ── Reducer ──────────────────────────────────────────────────────────────────

function nextId(): string {
  return Math.random().toString(36).slice(2, 9);
}

function reducer(state: ToolState, action: Action): ToolState {
  switch (action.type) {
    case "SET_TAB":
      return { ...state, tab: action.tab };

    case "CONV_VALUE":
      return { ...state, converter: { ...state.converter, value: action.value } };
    case "CONV_FROM":
      return { ...state, converter: { ...state.converter, fromUnit: action.unit } };
    case "CONV_TO":
      return { ...state, converter: { ...state.converter, toUnit: action.unit } };
    case "CONV_HOURS":
      return { ...state, converter: { ...state.converter, hours: action.hours } };
    case "CONV_VOLTAGE":
      return { ...state, converter: { ...state.converter, voltage: action.voltage } };

    case "LOAD_UPDATE_ROW":
      return {
        ...state,
        loads: state.loads.map((r) =>
          r.id === action.id ? { ...r, [action.field]: action.value } : r
        ),
      };
    case "LOAD_ADD_ROW":
      return {
        ...state,
        loads: [
          ...state.loads,
          { id: nextId(), name: "", watts: "", hoursPerDay: "1" },
        ],
      };
    case "LOAD_REMOVE_ROW":
      return {
        ...state,
        loads: state.loads.filter((r) => r.id !== action.id),
      };
    case "LOAD_SET_ASSUMPTION":
      return {
        ...state,
        assumptions: {
          ...state.assumptions,
          [action.key]: action.value,
        },
      };
    default:
      return state;
  }
}

// ── Conversion logic ─────────────────────────────────────────────────────────

function needsHours(from: Unit, to: Unit): boolean {
  const energyUnits: Unit[] = ["Wh", "kWh"];
  const powerUnits: Unit[] = ["W", "kW"];
  return (
    (energyUnits.includes(from) && powerUnits.includes(to)) ||
    (powerUnits.includes(from) && energyUnits.includes(to))
  );
}

function needsVoltage(from: Unit, to: Unit): boolean {
  return from === "mAh" || to === "mAh";
}

interface ConvResult {
  result: number | null;
  error: string | null;
}

function convert(
  value: string,
  from: Unit,
  to: Unit,
  hours: string,
  voltage: string
): ConvResult {
  const v = parseFloat(value);
  if (isNaN(v) || v < 0) return { result: null, error: null };
  if (from === to) return { result: v, error: null };

  const h = parseFloat(hours);
  const volt = parseFloat(voltage);

  // Power conversions
  if (from === "W" && to === "kW") return { result: v / 1000, error: null };
  if (from === "kW" && to === "W") return { result: v * 1000, error: null };

  // Energy conversions
  if (from === "Wh" && to === "kWh") return { result: v / 1000, error: null };
  if (from === "kWh" && to === "Wh") return { result: v * 1000, error: null };

  // Power ↔ Energy
  if (from === "W" && to === "Wh") {
    if (isNaN(h) || h <= 0) return { result: null, error: "Enter hours/day above" };
    return { result: v * h, error: null };
  }
  if (from === "kW" && to === "kWh") {
    if (isNaN(h) || h <= 0) return { result: null, error: "Enter hours above" };
    return { result: v * h, error: null };
  }
  if (from === "W" && to === "kWh") {
    if (isNaN(h) || h <= 0) return { result: null, error: "Enter hours above" };
    return { result: (v * h) / 1000, error: null };
  }
  if (from === "kW" && to === "Wh") {
    if (isNaN(h) || h <= 0) return { result: null, error: "Enter hours above" };
    return { result: v * 1000 * h, error: null };
  }
  if (from === "Wh" && to === "W") {
    if (isNaN(h) || h <= 0) return { result: null, error: "Enter hours above" };
    return { result: v / h, error: null };
  }
  if (from === "kWh" && to === "kW") {
    if (isNaN(h) || h <= 0) return { result: null, error: "Enter hours above" };
    return { result: v / h, error: null };
  }
  if (from === "Wh" && to === "kW") {
    if (isNaN(h) || h <= 0) return { result: null, error: "Enter hours above" };
    return { result: v / h / 1000, error: null };
  }
  if (from === "kWh" && to === "W") {
    if (isNaN(h) || h <= 0) return { result: null, error: "Enter hours above" };
    return { result: (v * 1000) / h, error: null };
  }

  // mAh conversions
  if (from === "Wh" && to === "mAh") {
    if (isNaN(volt) || volt <= 0) return { result: null, error: "Enter voltage above" };
    return { result: (v * 1000) / volt, error: null };
  }
  if (from === "kWh" && to === "mAh") {
    if (isNaN(volt) || volt <= 0) return { result: null, error: "Enter voltage above" };
    return { result: (v * 1_000_000) / volt, error: null };
  }
  if (from === "mAh" && to === "Wh") {
    if (isNaN(volt) || volt <= 0) return { result: null, error: "Enter voltage above" };
    return { result: (v * volt) / 1000, error: null };
  }
  if (from === "mAh" && to === "kWh") {
    if (isNaN(volt) || volt <= 0) return { result: null, error: "Enter voltage above" };
    return { result: (v * volt) / 1_000_000, error: null };
  }
  if (from === "mAh" && to === "W") {
    if (isNaN(volt) || volt <= 0) return { result: null, error: "Enter voltage above" };
    if (isNaN(h) || h <= 0) return { result: null, error: "Enter hours and voltage above" };
    return { result: (v * volt) / (h * 1000), error: null };
  }
  if (from === "W" && to === "mAh") {
    if (isNaN(volt) || volt <= 0) return { result: null, error: "Enter voltage above" };
    if (isNaN(h) || h <= 0) return { result: null, error: "Enter hours and voltage above" };
    return { result: (v * h * 1000) / volt, error: null };
  }
  if (from === "kW" && to === "mAh") {
    if (isNaN(volt) || volt <= 0) return { result: null, error: "Enter voltage above" };
    if (isNaN(h) || h <= 0) return { result: null, error: "Enter hours and voltage above" };
    return { result: (v * 1000 * h * 1000) / volt, error: null };
  }
  if (from === "mAh" && to === "kW") {
    if (isNaN(volt) || volt <= 0) return { result: null, error: "Enter voltage above" };
    if (isNaN(h) || h <= 0) return { result: null, error: "Enter hours and voltage above" };
    return { result: (v * volt) / (h * 1_000_000), error: null };
  }

  return { result: null, error: "Conversion not supported" };
}

// ── Load calc logic ──────────────────────────────────────────────────────────

interface LoadCalcResult {
  rows: { id: string; whPerDay: number }[];
  totalDailyWh: number;
  requiredPanelWatts: number;
  requiredStorageWh: number;
  requiredInverterWatts: number;
  peakWatts: number;
}

function calcLoad(loads: LoadRow[], assumptions: SizingAssumptions): LoadCalcResult {
  const rows = loads.map((r) => {
    const w = parseFloat(r.watts);
    const h = parseFloat(r.hoursPerDay);
    const whPerDay = isNaN(w) || isNaN(h) || w <= 0 || h <= 0 ? 0 : w * h;
    return { id: r.id, whPerDay };
  });

  const totalDailyWh = Math.round(rows.reduce((s, r) => s + r.whPerDay, 0));

  const requiredPanelWatts = Math.round(
    (totalDailyWh * 1.25) / (assumptions.sunHoursPerDay * 0.8)
  );

  const dod = assumptions.batteryChemistry === "lifepo4" ? 0.9 : 0.5;
  const requiredStorageWh = Math.round(
    (totalDailyWh * assumptions.autonomyDays) / dod
  );

  const peakWatts = loads.reduce((max, r) => {
    const w = parseFloat(r.watts);
    return isNaN(w) ? max : Math.max(max, w);
  }, 0);

  const requiredInverterWatts = Math.round(peakWatts * 2);

  return {
    rows,
    totalDailyWh,
    requiredPanelWatts,
    requiredStorageWh,
    requiredInverterWatts,
    peakWatts,
  };
}

// ── Kit matching ─────────────────────────────────────────────────────────────

interface KitRec {
  kit: Kit;
  meetsSolar: boolean;
  meetsStorage: boolean;
}

function matchKits(kits: Kit[], result: LoadCalcResult): KitRec[] {
  if (result.totalDailyWh === 0) return [];

  const threshold = 0.7;
  const filtered = kits.filter(
    (k) =>
      k.panelWatts >= result.requiredPanelWatts * threshold &&
      k.storageWh >= result.requiredStorageWh * threshold
  );

  const ranked = filtered
    .map((kit) => ({
      kit,
      meetsSolar: kit.panelWatts >= result.requiredPanelWatts,
      meetsStorage: kit.storageWh >= result.requiredStorageWh,
    }))
    .sort((a, b) => {
      // Fully-meeting kits first
      const aFull = a.meetsSolar && a.meetsStorage ? 0 : 1;
      const bFull = b.meetsSolar && b.meetsStorage ? 0 : 1;
      if (aFull !== bFull) return aFull - bFull;
      return a.kit.trueCost - b.kit.trueCost;
    });

  return ranked.slice(0, 3);
}

// ── Formatting helpers ────────────────────────────────────────────────────────

function fmtResult(n: number, unit: Unit): string {
  if (unit === "mAh") {
    return n >= 1000 ? `${(n / 1000).toFixed(2)} Ah` : `${n.toFixed(1)} mAh`;
  }
  if (n >= 1000 && (unit === "W" || unit === "Wh")) {
    return `${(n / 1000).toFixed(3).replace(/\.?0+$/, "")} ${unit === "W" ? "kW" : "kWh"}`;
  }
  const decimals = n < 1 ? 4 : n < 10 ? 3 : n < 100 ? 2 : 1;
  const trimmed = n.toFixed(decimals).replace(/\.?0+$/, "");
  return `${trimmed} ${unit}`;
}

function fmtWh(wh: number): string {
  if (wh >= 1000) return `${(wh / 1000).toFixed(1)} kWh`;
  return `${wh} Wh`;
}

function fmtW(w: number): string {
  if (w >= 1000) return `${(w / 1000).toFixed(1)} kW`;
  return `${w} W`;
}

// ── Unit label descriptions ─────────────────────────────────────────────────

const UNIT_DESC: Record<Unit, string> = {
  W: "Watts — instantaneous power draw",
  kW: "Kilowatts — 1 kW = 1,000 W",
  Wh: "Watt-hours — energy over time",
  kWh: "Kilowatt-hours — 1 kWh = 1,000 Wh",
  mAh: "Milliamp-hours — battery capacity (needs voltage)",
};

const UNITS: Unit[] = ["W", "kW", "Wh", "kWh", "mAh"];

// ── Sub-components ────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  unit,
  accent,
}: {
  label: string;
  value: string;
  unit?: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded border border-[var(--border)] bg-[var(--bg-surface)] p-4">
      <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide mb-1">
        {label}
      </p>
      <div className="flex items-baseline gap-1">
        <span
          className={`font-mono text-2xl font-bold leading-none ${
            accent ? "text-[var(--accent)]" : "text-[var(--text-primary)]"
          }`}
        >
          {value}
        </span>
        {unit && (
          <span className="text-sm text-[var(--text-muted)]">{unit}</span>
        )}
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
        active
          ? "border-[var(--accent)] text-[var(--accent)]"
          : "border-transparent text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
      }`}
    >
      {children}
    </button>
  );
}

function UnitButton({
  unit,
  active,
  onClick,
}: {
  unit: Unit;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      title={UNIT_DESC[unit]}
      onClick={onClick}
      className={`px-3 py-1.5 text-xs font-mono rounded border transition-colors ${
        active
          ? "border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]"
          : "border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--accent)]/40 hover:text-[var(--text-secondary)]"
      }`}
    >
      {unit}
    </button>
  );
}

function NumberInput({
  id,
  label,
  value,
  onChange,
  placeholder,
  hint,
}: {
  id?: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  hint?: string;
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="block text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide mb-1.5"
      >
        {label}
      </label>
      <input
        id={id}
        type="number"
        inputMode="decimal"
        min="0"
        placeholder={placeholder ?? "e.g. 100"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2 font-mono text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]/30 transition-colors"
      />
      {hint && (
        <p className="mt-1 text-xs text-[var(--text-muted)]">{hint}</p>
      )}
    </div>
  );
}

// ── Converter Tab ─────────────────────────────────────────────────────────────

function ConverterTab({
  state,
  dispatch,
}: {
  state: ConverterState;
  dispatch: React.Dispatch<Action>;
}) {
  const uid = useId();
  const showHours = needsHours(state.fromUnit, state.toUnit);
  const showVoltage = needsVoltage(state.fromUnit, state.toUnit);

  const convResult = useMemo(
    () => convert(state.value, state.fromUnit, state.toUnit, state.hours, state.voltage),
    [state]
  );

  const hasInput = state.value !== "";

  return (
    <div className="space-y-6 p-5">
      {/* Unit selector — from */}
      <div>
        <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide mb-2">
          Convert from
        </p>
        <div className="flex flex-wrap gap-2">
          {UNITS.map((u) => (
            <UnitButton
              key={u}
              unit={u}
              active={state.fromUnit === u}
              onClick={() => dispatch({ type: "CONV_FROM", unit: u })}
            />
          ))}
        </div>
        <p className="mt-1.5 text-xs text-[var(--text-muted)]">
          {UNIT_DESC[state.fromUnit]}
        </p>
      </div>

      {/* Unit selector — to */}
      <div>
        <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide mb-2">
          Convert to
        </p>
        <div className="flex flex-wrap gap-2">
          {UNITS.map((u) => (
            <UnitButton
              key={u}
              unit={u}
              active={state.toUnit === u}
              onClick={() => dispatch({ type: "CONV_TO", unit: u })}
            />
          ))}
        </div>
        <p className="mt-1.5 text-xs text-[var(--text-muted)]">
          {UNIT_DESC[state.toUnit]}
        </p>
      </div>

      {/* Inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <NumberInput
          id={`${uid}-value`}
          label={`Value (${state.fromUnit})`}
          value={state.value}
          onChange={(v) => dispatch({ type: "CONV_VALUE", value: v })}
          placeholder="e.g. 100"
        />
        {showHours && (
          <NumberInput
            id={`${uid}-hours`}
            label="Hours"
            value={state.hours}
            onChange={(h) => dispatch({ type: "CONV_HOURS", hours: h })}
            placeholder="e.g. 5"
            hint="Used for power ↔ energy conversions"
          />
        )}
        {showVoltage && (
          <NumberInput
            id={`${uid}-voltage`}
            label="Voltage (V)"
            value={state.voltage}
            onChange={(v) => dispatch({ type: "CONV_VOLTAGE", voltage: v })}
            placeholder="e.g. 12"
            hint="12V, 24V, 48V, or 3.7V for Li-ion cells"
          />
        )}
      </div>

      {/* Result */}
      <div
        className={`rounded border px-5 py-4 transition-colors ${
          convResult.error
            ? "border-[var(--warning)]/40 bg-[var(--warning)]/5"
            : "border-[var(--border)] bg-[var(--bg-elevated)]"
        }`}
      >
        <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide mb-2">
          Result
        </p>
        {!hasInput ? (
          <p className="text-sm text-[var(--text-muted)]">
            Enter a value above to convert
          </p>
        ) : convResult.error ? (
          <p className="text-sm text-[var(--warning)]">{convResult.error}</p>
        ) : convResult.result === null ? (
          <p className="font-mono text-2xl text-[var(--text-muted)]">—</p>
        ) : (
          <p className="font-mono text-2xl font-bold text-[var(--accent)] leading-none">
            {fmtResult(convResult.result, state.toUnit)}
          </p>
        )}
      </div>

      {/* Quick reference */}
      <details className="group">
        <summary className="cursor-pointer flex items-center gap-2 text-xs font-mono text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors list-none">
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="transition-transform group-open:rotate-90"
          >
            <path d="M9 18l6-6-6-6" />
          </svg>
          <span className="uppercase tracking-wide">Quick reference</span>
        </summary>
        <div className="mt-3 rounded border border-[var(--border)] bg-[var(--bg-primary)] p-4 font-mono text-xs text-[var(--text-secondary)] space-y-1.5">
          <div>1 kW = 1,000 W</div>
          <div>1 kWh = 1,000 Wh</div>
          <div>100W × 5h = 500 Wh = 0.5 kWh</div>
          <div>1 kWh at 12V = 83,333 mAh</div>
          <div>1 kWh at 48V = 20,833 mAh</div>
          <div className="pt-1 border-t border-[var(--border)] text-[var(--text-muted)]">
            Wh = Watt-hours (energy stored/used). W = Watts (power rate).
            A 100Ah battery at 12V = 1,200 Wh = 1.2 kWh.
          </div>
        </div>
      </details>
    </div>
  );
}

// ── Load Calculator Tab ───────────────────────────────────────────────────────

function LoadCalcTab({
  loads,
  assumptions,
  kits,
  dispatch,
}: {
  loads: LoadRow[];
  assumptions: SizingAssumptions;
  kits: Kit[];
  dispatch: React.Dispatch<Action>;
}) {
  const result = useMemo(() => calcLoad(loads, assumptions), [loads, assumptions]);
  const kitRecs = useMemo(() => matchKits(kits, result), [kits, result]);
  const hasLoads = result.totalDailyWh > 0;

  return (
    <div className="space-y-6 p-5">
      {/* Appliance table */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">
            Appliances
          </p>
          <button
            onClick={() => dispatch({ type: "LOAD_ADD_ROW" })}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono rounded border border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--accent)]/40 hover:text-[var(--accent)] transition-colors"
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Add appliance
          </button>
        </div>

        {/* Responsive table wrapper */}
        <div className="rounded border border-[var(--border)] overflow-hidden">
          {/* Header */}
          <div className="hidden sm:grid sm:grid-cols-[1fr_100px_100px_80px_32px] gap-0 bg-[var(--bg-elevated)] border-b border-[var(--border)]">
            <div className="px-3 py-2 text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">
              Appliance
            </div>
            <div className="px-3 py-2 text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">
              Watts
            </div>
            <div className="px-3 py-2 text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">
              Hours/day
            </div>
            <div className="px-3 py-2 text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide text-right">
              Wh/day
            </div>
            <div />
          </div>

          {/* Rows */}
          <div className="divide-y divide-[var(--border)]">
            {loads.map((row, idx) => {
              const rowResult = result.rows.find((r) => r.id === row.id);
              const wh = rowResult?.whPerDay ?? 0;
              return (
                <LoadRowItem
                  key={row.id}
                  row={row}
                  wh={wh}
                  idx={idx}
                  dispatch={dispatch}
                />
              );
            })}
          </div>

          {/* Total row */}
          <div className="grid grid-cols-[1fr_auto] sm:grid-cols-[1fr_100px_100px_80px_32px] border-t-2 border-[var(--border)] bg-[var(--bg-elevated)]">
            <div className="px-3 py-2.5 text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">
              Total
            </div>
            <div className="hidden sm:block px-3 py-2.5" />
            <div className="hidden sm:block px-3 py-2.5" />
            <div className="px-3 py-2.5 text-right sm:text-right font-mono text-sm font-bold text-[var(--accent)]">
              {result.totalDailyWh.toLocaleString()} Wh
            </div>
            <div className="hidden sm:block" />
          </div>
        </div>
      </div>

      {/* Assumptions */}
      <div>
        <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide mb-3">
          Sizing Assumptions
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide mb-1.5">
              Peak Sun Hours/Day
            </label>
            <select
              value={assumptions.sunHoursPerDay}
              onChange={(e) =>
                dispatch({
                  type: "LOAD_SET_ASSUMPTION",
                  key: "sunHoursPerDay",
                  value: parseFloat(e.target.value),
                })
              }
              className="w-full rounded border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2 font-mono text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]/30 transition-colors"
            >
              <option value="3">3h — cloudy/winter</option>
              <option value="4">4h — overcast region</option>
              <option value="5">5h — average US (default)</option>
              <option value="6">6h — SW US / desert</option>
              <option value="7">7h — peak desert</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide mb-1.5">
              Autonomy Days
            </label>
            <select
              value={assumptions.autonomyDays}
              onChange={(e) =>
                dispatch({
                  type: "LOAD_SET_ASSUMPTION",
                  key: "autonomyDays",
                  value: parseFloat(e.target.value),
                })
              }
              className="w-full rounded border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2 font-mono text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]/30 transition-colors"
            >
              <option value="1">1 day — minimal reserve</option>
              <option value="1.5">1.5 days (default)</option>
              <option value="2">2 days — standard</option>
              <option value="3">3 days — extended backup</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide mb-1.5">
              Battery Chemistry
            </label>
            <select
              value={assumptions.batteryChemistry}
              onChange={(e) =>
                dispatch({
                  type: "LOAD_SET_ASSUMPTION",
                  key: "batteryChemistry",
                  value: e.target.value as "lifepo4" | "agm",
                })
              }
              className="w-full rounded border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2 font-mono text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]/30 transition-colors"
            >
              <option value="lifepo4">LiFePO₄ — 90% DoD</option>
              <option value="agm">AGM — 50% DoD</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results */}
      {hasLoads && (
        <>
          <div>
            <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide mb-3">
              System Sizing
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatCard
                label="Daily Energy"
                value={
                  result.totalDailyWh >= 1000
                    ? (result.totalDailyWh / 1000).toFixed(1)
                    : result.totalDailyWh.toString()
                }
                unit={result.totalDailyWh >= 1000 ? "kWh" : "Wh"}
                accent
              />
              <StatCard
                label="Solar Needed"
                value={fmtW(result.requiredPanelWatts).split(" ")[0]}
                unit={fmtW(result.requiredPanelWatts).split(" ")[1]}
              />
              <StatCard
                label="Storage Needed"
                value={fmtWh(result.requiredStorageWh).split(" ")[0]}
                unit={fmtWh(result.requiredStorageWh).split(" ")[1]}
              />
              <StatCard
                label="Inverter Min"
                value={fmtW(result.requiredInverterWatts).split(" ")[0]}
                unit={fmtW(result.requiredInverterWatts).split(" ")[1]}
              />
            </div>
          </div>

          {/* Show math */}
          <details className="group">
            <summary className="cursor-pointer flex items-center gap-2 text-xs font-mono text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors list-none">
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="transition-transform group-open:rotate-90"
              >
                <path d="M9 18l6-6-6-6" />
              </svg>
              <span className="uppercase tracking-wide">Show the math</span>
            </summary>
            <div className="mt-3 rounded border border-[var(--border)] bg-[var(--bg-primary)] p-4 font-mono text-xs text-[var(--text-secondary)] space-y-3 overflow-x-auto">
              <div>
                <div className="text-[var(--text-muted)] mb-1">Daily consumption:</div>
                {loads.map((l, i) => {
                  const w = parseFloat(l.watts);
                  const h = parseFloat(l.hoursPerDay);
                  const wh = result.rows[i]?.whPerDay ?? 0;
                  if (!l.name && !l.watts) return null;
                  return (
                    <div key={l.id} className="ml-2">
                      {l.name || "Appliance"}: {isNaN(w) ? "?" : w}W × {isNaN(h) ? "?" : h}h ={" "}
                      <span className="text-[var(--accent)]">{wh}Wh</span>
                    </div>
                  );
                })}
                <div className="mt-1 font-semibold">
                  Total = <span className="text-[var(--accent)]">{result.totalDailyWh}Wh/day</span>
                </div>
              </div>
              <div>
                <div className="text-[var(--text-muted)] mb-1">Solar sizing:</div>
                <div className="ml-2">
                  {result.totalDailyWh}Wh × 1.25 ÷ ({assumptions.sunHoursPerDay}h × 0.80) ={" "}
                  <span className="text-[var(--accent)]">{result.requiredPanelWatts}W</span>
                </div>
              </div>
              <div>
                <div className="text-[var(--text-muted)] mb-1">Battery storage:</div>
                <div className="ml-2">
                  {result.totalDailyWh}Wh × {assumptions.autonomyDays}d ÷{" "}
                  {assumptions.batteryChemistry === "lifepo4" ? "0.90" : "0.50"} DoD ={" "}
                  <span className="text-[var(--accent)]">{result.requiredStorageWh}Wh</span>
                </div>
              </div>
              <div>
                <div className="text-[var(--text-muted)] mb-1">Inverter sizing:</div>
                <div className="ml-2">
                  {result.peakWatts}W peak × 2 (surge) ={" "}
                  <span className="text-[var(--accent)]">{result.requiredInverterWatts}W</span>
                </div>
              </div>
            </div>
          </details>

          {/* Kit recommendations */}
          {kitRecs.length > 0 && (
            <div>
              <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide mb-3">
                Matched Kits
              </p>
              <div className="space-y-2">
                {kitRecs.map(({ kit, meetsSolar, meetsStorage }) => {
                  const bothMeet = meetsSolar && meetsStorage;
                  return (
                    <div
                      key={kit.id}
                      className={`rounded border p-4 ${
                        bothMeet
                          ? "border-[var(--success)]/30 bg-[var(--success)]/5"
                          : "border-[var(--border)] bg-[var(--bg-surface)]"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <Link
                            href={`/kits/${kit.slug}`}
                            className="text-sm font-semibold text-[var(--text-primary)] hover:text-[var(--accent)] transition-colors block truncate"
                          >
                            {kit.name}
                          </Link>
                          <div className="text-xs text-[var(--text-muted)] mt-0.5">
                            {kit.brand} · ${kit.trueCost.toLocaleString()} real cost
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {bothMeet && (
                            <span className="text-xs font-mono px-2 py-0.5 rounded bg-[var(--success)]/10 text-[var(--success)] border border-[var(--success)]/20">
                              meets
                            </span>
                          )}
                          <Link
                            href={`/kits/${kit.slug}`}
                            className="text-xs text-[var(--accent)] hover:underline"
                          >
                            View →
                          </Link>
                        </div>
                      </div>
                      <div className="mt-3 grid grid-cols-3 gap-2">
                        <SpecPill
                          label="Solar"
                          value={`${kit.panelWatts}W`}
                          ok={meetsSolar}
                          needed={`${result.requiredPanelWatts}W req.`}
                        />
                        <SpecPill
                          label="Storage"
                          value={fmtWh(kit.storageWh)}
                          ok={meetsStorage}
                          needed={`${fmtWh(result.requiredStorageWh)} req.`}
                        />
                        <SpecPill
                          label="Inverter"
                          value={`${kit.inverterWatts}W`}
                          ok={kit.inverterWatts >= result.requiredInverterWatts}
                          needed={`${result.requiredInverterWatts}W req.`}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
              <p className="mt-3 text-xs text-[var(--text-muted)]">
                For deeper kit matching and comparison,{" "}
                <Link href="/calculator" className="text-[var(--accent)] hover:underline">
                  use the full sizing calculator
                </Link>
                .
              </p>
            </div>
          )}

          {kitRecs.length === 0 && result.totalDailyWh > 0 && (
            <div className="rounded border border-[var(--border)] bg-[var(--bg-surface)] px-4 py-3 text-sm text-[var(--text-muted)]">
              No tracked kits closely match this load.{" "}
              <Link href="/calculator" className="text-[var(--accent)] hover:underline">
                Try the full calculator
              </Link>{" "}
              for component-level sizing.
            </div>
          )}
        </>
      )}

      {!hasLoads && (
        <div className="rounded border border-[var(--border)] bg-[var(--bg-surface)] px-4 py-3 text-sm text-[var(--text-muted)]">
          Add at least one appliance with watts and hours to see sizing results.
        </div>
      )}
    </div>
  );
}

function LoadRowItem({
  row,
  wh,
  idx,
  dispatch,
}: {
  row: LoadRow;
  wh: number;
  idx: number;
  dispatch: React.Dispatch<Action>;
}) {
  return (
    <div className="sm:grid sm:grid-cols-[1fr_100px_100px_80px_32px] gap-0 items-center">
      {/* Mobile: stacked layout */}
      <div className="sm:hidden p-3 bg-[var(--bg-surface)]">
        <div className="flex items-center justify-between mb-2">
          <input
            type="text"
            value={row.name}
            placeholder={`Appliance ${idx + 1}`}
            onChange={(e) =>
              dispatch({ type: "LOAD_UPDATE_ROW", id: row.id, field: "name", value: e.target.value })
            }
            className="flex-1 rounded border border-[var(--border)] bg-[var(--bg-elevated)] px-2 py-1 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]/30 transition-colors min-w-0"
          />
          <button
            onClick={() => dispatch({ type: "LOAD_REMOVE_ROW", id: row.id })}
            aria-label="Remove row"
            className="ml-2 p-1 text-[var(--text-muted)] hover:text-[var(--danger)] transition-colors rounded"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs text-[var(--text-muted)] mb-1">Watts</label>
            <input
              type="number"
              inputMode="decimal"
              min="0"
              value={row.watts}
              placeholder="0"
              onChange={(e) =>
                dispatch({ type: "LOAD_UPDATE_ROW", id: row.id, field: "watts", value: e.target.value })
              }
              className="w-full rounded border border-[var(--border)] bg-[var(--bg-elevated)] px-2 py-1 font-mono text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]/30 transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs text-[var(--text-muted)] mb-1">Hrs/day</label>
            <input
              type="number"
              inputMode="decimal"
              min="0"
              max="24"
              value={row.hoursPerDay}
              placeholder="0"
              onChange={(e) =>
                dispatch({ type: "LOAD_UPDATE_ROW", id: row.id, field: "hoursPerDay", value: e.target.value })
              }
              className="w-full rounded border border-[var(--border)] bg-[var(--bg-elevated)] px-2 py-1 font-mono text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]/30 transition-colors"
            />
          </div>
        </div>
        <div className="mt-2 text-right font-mono text-sm text-[var(--accent)]">
          {wh > 0 ? `${wh.toLocaleString()} Wh/day` : "—"}
        </div>
      </div>

      {/* Desktop: grid layout */}
      <div className="hidden sm:block px-3 py-2">
        <input
          type="text"
          value={row.name}
          placeholder={`Appliance ${idx + 1}`}
          onChange={(e) =>
            dispatch({ type: "LOAD_UPDATE_ROW", id: row.id, field: "name", value: e.target.value })
          }
          className="w-full rounded border border-[var(--border)] bg-[var(--bg-elevated)] px-2 py-1 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]/30 transition-colors"
        />
      </div>
      <div className="hidden sm:block px-3 py-2">
        <input
          type="number"
          inputMode="decimal"
          min="0"
          value={row.watts}
          placeholder="0"
          onChange={(e) =>
            dispatch({ type: "LOAD_UPDATE_ROW", id: row.id, field: "watts", value: e.target.value })
          }
          className="w-full rounded border border-[var(--border)] bg-[var(--bg-elevated)] px-2 py-1 font-mono text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]/30 transition-colors"
        />
      </div>
      <div className="hidden sm:block px-3 py-2">
        <input
          type="number"
          inputMode="decimal"
          min="0"
          max="24"
          value={row.hoursPerDay}
          placeholder="0"
          onChange={(e) =>
            dispatch({ type: "LOAD_UPDATE_ROW", id: row.id, field: "hoursPerDay", value: e.target.value })
          }
          className="w-full rounded border border-[var(--border)] bg-[var(--bg-elevated)] px-2 py-1 font-mono text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]/30 transition-colors"
        />
      </div>
      <div className="hidden sm:flex px-3 py-2 justify-end font-mono text-sm text-[var(--accent)]">
        {wh > 0 ? wh.toLocaleString() : "—"}
      </div>
      <div className="hidden sm:flex items-center justify-center py-2">
        <button
          onClick={() => dispatch({ type: "LOAD_REMOVE_ROW", id: row.id })}
          aria-label="Remove row"
          className="p-1 text-[var(--text-muted)] hover:text-[var(--danger)] transition-colors rounded"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}

function SpecPill({
  label,
  value,
  ok,
  needed,
}: {
  label: string;
  value: string;
  ok: boolean;
  needed: string;
}) {
  return (
    <div className="rounded border border-[var(--border)] bg-[var(--bg-primary)] px-2 py-1.5">
      <p className="text-xs text-[var(--text-muted)] mb-0.5">{label}</p>
      <p
        className={`font-mono text-sm font-semibold ${
          ok ? "text-[var(--success)]" : "text-[var(--warning)]"
        }`}
      >
        {value}
      </p>
      <p className="text-xs text-[var(--text-muted)] mt-0.5">{needed}</p>
    </div>
  );
}

// ── Root component ────────────────────────────────────────────────────────────

interface WattsToKilowattsToolProps {
  kits: Kit[];
}

export function WattsToKilowattsTool({ kits }: WattsToKilowattsToolProps) {
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE);

  return (
    <div className="rounded border border-[var(--border)] bg-[var(--bg-surface)] overflow-hidden">
      {/* Tab bar */}
      <div className="flex border-b border-[var(--border)] bg-[var(--bg-elevated)] px-4">
        <TabButton
          active={state.tab === "converter"}
          onClick={() => dispatch({ type: "SET_TAB", tab: "converter" })}
        >
          Unit Converter
        </TabButton>
        <TabButton
          active={state.tab === "load-calc"}
          onClick={() => dispatch({ type: "SET_TAB", tab: "load-calc" })}
        >
          Load Calculator
        </TabButton>
      </div>

      {/* Tab content */}
      {state.tab === "converter" ? (
        <ConverterTab state={state.converter} dispatch={dispatch} />
      ) : (
        <LoadCalcTab
          loads={state.loads}
          assumptions={state.assumptions}
          kits={kits}
          dispatch={dispatch}
        />
      )}
    </div>
  );
}
