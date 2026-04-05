"use client";

import { useState, useMemo } from "react";

type Mode = "watts-volts" | "watts-amps" | "amps-volts";

interface CalcInputs {
  a: string;
  b: string;
}

interface CalcResult {
  computed: number | null;
  computedLabel: string;
  computedUnit: string;
  amps: number | null;
  watts: number | null;
  volts: number | null;
  wireGauge: string | null;
  mpptAmps: number | null;
  voltageRec: string | null;
  voltageReason: string | null;
}

const AWG_TABLE: { awg: string; maxAmps: number; label: string }[] = [
  { awg: "16 AWG", maxAmps: 13, label: "Under 150W at 12V" },
  { awg: "14 AWG", maxAmps: 15, label: "100–150W at 12V; 400–600W at 48V" },
  { awg: "12 AWG", maxAmps: 20, label: "200–240W at 12V; 400W at 24V" },
  { awg: "10 AWG", maxAmps: 30, label: "300–360W at 12V" },
  { awg: "8 AWG",  maxAmps: 40, label: "400–480W at 12V" },
  { awg: "6 AWG",  maxAmps: 55, label: "600W+ at 12V" },
  { awg: "4 AWG",  maxAmps: 70, label: "800W+ at 12V" },
];

function getChargingVoltage(nominalVolts: number): number {
  if (nominalVolts <= 14) return 14.4;
  if (nominalVolts <= 28) return 28.8;
  return 57.6;
}

function getWireGauge(amps: number): string | null {
  const required = amps * 1.25;
  const match = AWG_TABLE.find((r) => r.maxAmps >= required);
  return match ? match.awg : "2 AWG or larger";
}

function getVoltageRec(watts: number): { rec: string; reason: string } {
  if (watts < 300) return { rec: "12V", reason: "under 300W; standard DC accessories run natively at 12V" };
  if (watts <= 800) return { rec: "24V", reason: "300–800W range; cuts wire cost vs 12V by 50%" };
  return { rec: "48V", reason: "above 800W; standard for permanent off-grid installs" };
}

function compute(mode: Mode, inputs: CalcInputs): CalcResult {
  const a = parseFloat(inputs.a);
  const b = parseFloat(inputs.b);
  const aValid = !isNaN(a) && a > 0;
  const bValid = !isNaN(b) && b > 0;

  let watts: number | null = null;
  let volts: number | null = null;
  let amps: number | null = null;

  if (mode === "watts-volts" && aValid && bValid) {
    watts = a; volts = b; amps = a / b;
  } else if (mode === "watts-amps" && aValid && bValid) {
    watts = a; amps = b; volts = a / b;
  } else if (mode === "amps-volts" && aValid && bValid) {
    amps = a; volts = b; watts = a * b;
  } else {
    // partial — fill what we can
    if (mode === "watts-volts") { if (aValid) watts = a; if (bValid) volts = b; }
    if (mode === "watts-amps") { if (aValid) watts = a; if (bValid) amps = b; }
    if (mode === "amps-volts") { if (aValid) amps = a; if (bValid) volts = b; }
  }

  const computed = mode === "watts-volts" ? amps : mode === "watts-amps" ? volts : watts;
  const computedLabel = mode === "watts-volts" ? "Amps" : mode === "watts-amps" ? "Volts" : "Watts";
  const computedUnit = mode === "watts-volts" ? "A" : mode === "watts-amps" ? "V" : "W";

  let wireGauge: string | null = null;
  let mpptAmps: number | null = null;
  let voltageRec: string | null = null;
  let voltageReason: string | null = null;

  if (amps !== null && amps > 0) {
    wireGauge = getWireGauge(amps);
    if (watts !== null && volts !== null) {
      const chargingV = getChargingVoltage(volts);
      mpptAmps = Math.ceil((watts / chargingV) * 1.25 * 10) / 10;
    }
  }

  if (watts !== null && watts > 0) {
    const rec = getVoltageRec(watts);
    voltageRec = rec.rec;
    voltageReason = rec.reason;
  }

  return { computed, computedLabel, computedUnit, amps, watts, volts, wireGauge, mpptAmps, voltageRec, voltageReason };
}

const MODES: { id: Mode; label: string; aLabel: string; bLabel: string; aPlaceholder: string; bPlaceholder: string }[] = [
  { id: "watts-volts", label: "Watts + Volts", aLabel: "Watts (W)", bLabel: "Volts (V)", aPlaceholder: "e.g. 200", bPlaceholder: "e.g. 12" },
  { id: "watts-amps",  label: "Watts + Amps",  aLabel: "Watts (W)", bLabel: "Amps (A)",  aPlaceholder: "e.g. 200", bPlaceholder: "e.g. 16.7" },
  { id: "amps-volts",  label: "Amps + Volts",  aLabel: "Amps (A)",  bLabel: "Volts (V)", aPlaceholder: "e.g. 16.7", bPlaceholder: "e.g. 12" },
];

function fmt(n: number | null, decimals = 1): string {
  if (n === null) return "—";
  return n % 1 === 0 ? String(n) : n.toFixed(decimals);
}

export function WattsAmpsCalc() {
  const [mode, setMode] = useState<Mode>("watts-volts");
  const [inputs, setInputs] = useState<CalcInputs>({ a: "", b: "" });
  const [showTable, setShowTable] = useState(false);

  const result = useMemo(() => compute(mode, inputs), [mode, inputs]);
  const modeConfig = MODES.find((m) => m.id === mode)!;

  const hasResult = result.computed !== null;
  const hasAnyInput = inputs.a !== "" || inputs.b !== "";

  return (
    <div className="my-8 rounded border border-[var(--border)] bg-[var(--bg-surface)] overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-[var(--border)] bg-[var(--bg-elevated)]">
        <span className="font-mono text-xs uppercase tracking-wider text-[var(--accent)]">
          Watts / Amps / Volts Calculator
        </span>
      </div>

      <div className="p-5 space-y-5">
        {/* Mode selector */}
        <div>
          <p className="text-xs text-[var(--text-muted)] mb-2 font-mono uppercase tracking-wide">
            I know these two values:
          </p>
          <div className="flex flex-wrap gap-2">
            {MODES.map((m) => (
              <button
                key={m.id}
                onClick={() => { setMode(m.id); setInputs({ a: "", b: "" }); }}
                className={`px-3 py-1.5 text-xs font-mono rounded border transition-colors ${
                  mode === m.id
                    ? "border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]"
                    : "border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--accent)]/40 hover:text-[var(--text-secondary)]"
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { label: modeConfig.aLabel, placeholder: modeConfig.aPlaceholder, key: "a" as const },
            { label: modeConfig.bLabel, placeholder: modeConfig.bPlaceholder, key: "b" as const },
          ].map((field) => (
            <div key={field.key}>
              <label className="block text-xs text-[var(--text-muted)] font-mono mb-1.5 uppercase tracking-wide">
                {field.label}
              </label>
              <input
                type="number"
                inputMode="decimal"
                placeholder={field.placeholder}
                value={inputs[field.key]}
                onChange={(e) => setInputs((prev) => ({ ...prev, [field.key]: e.target.value }))}
                className="w-full rounded border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2 font-mono text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]/30 transition-colors"
              />
            </div>
          ))}
        </div>

        {/* Primary Result */}
        <div className="rounded border border-[var(--border)] bg-[var(--bg-elevated)] px-4 py-3">
          <p className="text-xs text-[var(--text-muted)] font-mono uppercase tracking-wide mb-1">
            {result.computedLabel} =
          </p>
          {!hasAnyInput ? (
            <p className="text-sm text-[var(--text-muted)]">Enter two values above</p>
          ) : hasResult ? (
            <p className="font-mono text-2xl text-[var(--accent)] leading-none">
              {fmt(result.computed)}<span className="text-base ml-1 text-[var(--text-secondary)]">{result.computedUnit}</span>
            </p>
          ) : (
            <p className="font-mono text-2xl text-[var(--text-muted)]">—</p>
          )}
        </div>

        {/* Downstream results */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Wire Gauge */}
          <div className="rounded border border-[var(--border)] bg-[var(--bg-elevated)] px-4 py-3">
            <p className="text-xs text-[var(--text-muted)] font-mono uppercase tracking-wide mb-1">Wire Gauge Min</p>
            <p className="font-mono text-lg text-[var(--text-primary)] leading-none mb-1">
              {result.wireGauge ?? "—"}
            </p>
            <p className="text-xs text-[var(--text-muted)]">NEC 125% factor applied</p>
          </div>

          {/* MPPT */}
          <div className="rounded border border-[var(--border)] bg-[var(--bg-elevated)] px-4 py-3">
            <p className="text-xs text-[var(--text-muted)] font-mono uppercase tracking-wide mb-1">MPPT Min</p>
            <p className="font-mono text-lg text-[var(--text-primary)] leading-none mb-1">
              {result.mpptAmps !== null ? `${fmt(result.mpptAmps)}A` : "—"}
            </p>
            <p className="text-xs text-[var(--text-muted)]">uses charging voltage</p>
          </div>

          {/* Voltage rec */}
          <div className="rounded border border-[var(--border)] bg-[var(--bg-elevated)] px-4 py-3">
            <p className="text-xs text-[var(--text-muted)] font-mono uppercase tracking-wide mb-1">System Voltage</p>
            <p className="font-mono text-lg text-[var(--text-primary)] leading-none mb-1">
              {result.voltageRec ? `${result.voltageRec} rec.` : "—"}
            </p>
            <p className="text-xs text-[var(--text-muted)]">{result.voltageReason ?? "enter watts to see"}</p>
          </div>
        </div>

        {/* AWG Reference Table (collapsible) */}
        <div className="border border-[var(--border)] rounded">
          <button
            onClick={() => setShowTable((p) => !p)}
            className="w-full flex items-center justify-between px-4 py-2.5 text-xs font-mono text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
          >
            <span className="uppercase tracking-wide">AWG Reference Table (NEC 310.15)</span>
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={`transition-transform ${showTable ? "rotate-180" : ""}`}
            >
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>

          {showTable && (
            <div className="border-t border-[var(--border)] overflow-x-auto">
              <table className="w-full text-xs font-mono">
                <thead>
                  <tr className="bg-[var(--bg-elevated)]">
                    <th className="px-4 py-2 text-left text-[var(--text-muted)] uppercase tracking-wide">AWG</th>
                    <th className="px-4 py-2 text-left text-[var(--text-muted)] uppercase tracking-wide">Max Amps</th>
                    <th className="px-4 py-2 text-left text-[var(--text-muted)] uppercase tracking-wide">Typical Use</th>
                  </tr>
                </thead>
                <tbody>
                  {AWG_TABLE.map((row) => (
                    <tr key={row.awg} className="border-t border-[var(--border)]">
                      <td className="px-4 py-2 text-[var(--text-primary)]">{row.awg}</td>
                      <td className="px-4 py-2 text-[var(--accent)]">{row.maxAmps}A</td>
                      <td className="px-4 py-2 text-[var(--text-muted)]">{row.label}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <p className="text-xs text-[var(--text-muted)]">
          For full system sizing (battery, panels, inverter), use the{" "}
          <a href="/calculator" className="text-[var(--accent)] hover:underline">Solar Sizing Calculator</a>.
        </p>
      </div>
    </div>
  );
}
