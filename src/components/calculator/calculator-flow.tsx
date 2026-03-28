"use client";

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import type { Kit } from "@/lib/demo-data";
import type { LoadEntry, SystemAssumptions, SunTier } from "@/lib/calculator/types";
import { APPLIANCE_CATALOG, LOAD_PRESETS } from "@/lib/calculator/appliances";
import { lookupSunHours, getSunTier, SUN_TIERS } from "@/lib/calculator/sun-hours";
import { computeSizing, matchKits } from "@/lib/calculator/engine";
import { encodeState, decodeState } from "@/lib/calculator/url-codec";
import { saveSizing } from "@/lib/calculator/calc-storage";
import { StepLoads } from "./step-loads";
import { StepLocation } from "./step-location";
import { StepResults } from "./step-results";

const DEFAULT_ASSUMPTIONS: SystemAssumptions = {
  sunHoursPerDay: 4.5,
  sunSource: "tier",
  zipCode: "",
  sunTier: "average",
  autonomyDays: 1,
  controllerType: "mppt",
  batteryChemistry: "lifepo4",
};

let entryCounter = 0;
function nextId() {
  return `load-${++entryCounter}-${Date.now()}`;
}

function applianceToEntry(id: string): LoadEntry | null {
  const def = APPLIANCE_CATALOG.find((a) => a.id === id);
  if (!def) return null;
  return {
    id: nextId(),
    name: def.name,
    watts: def.defaultWatts,
    qty: def.defaultQty,
    hoursPerDay: def.defaultHours,
    dutyCycle: def.dutyCycle,
    surgeWatts: def.surgeWatts,
    isCustom: false,
  };
}

interface CalculatorFlowProps {
  allKits: Kit[];
}

export function CalculatorFlow({ allKits }: CalculatorFlowProps) {
  const searchParams = useSearchParams();
  const router = useRouter();

  // ── URL hydration on mount ─────────────────────────────────────────────
  const hydrated = useRef(false);
  const initialState = useMemo(() => {
    if (hydrated.current) return null;
    return decodeState(searchParams);
  }, [searchParams]);

  const [step, setStep] = useState<1 | 2 | 3>(initialState?.step ?? 1);
  const [loads, setLoads] = useState<LoadEntry[]>(initialState?.loads ?? []);
  const [assumptions, setAssumptions] = useState<SystemAssumptions>(
    initialState?.assumptions ?? DEFAULT_ASSUMPTIONS
  );

  // Mark hydrated after first render
  useEffect(() => { hydrated.current = true; }, []);

  // ── Load management ─────────────────────────────────────────────────────

  const addAppliance = useCallback((applianceId: string) => {
    const entry = applianceToEntry(applianceId);
    if (entry) setLoads((prev) => [...prev, entry]);
  }, []);

  const addCustom = useCallback(() => {
    setLoads((prev) => [
      ...prev,
      {
        id: nextId(),
        name: "",
        watts: 100,
        qty: 1,
        hoursPerDay: 1,
        dutyCycle: 1,
        surgeWatts: 0,
        isCustom: true,
      },
    ]);
  }, []);

  const updateLoad = useCallback((id: string, updates: Partial<LoadEntry>) => {
    setLoads((prev) =>
      prev.map((l) => (l.id === id ? { ...l, ...updates } : l))
    );
  }, []);

  const removeLoad = useCallback((id: string) => {
    setLoads((prev) => prev.filter((l) => l.id !== id));
  }, []);

  const loadPreset = useCallback((presetId: string) => {
    const preset = LOAD_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    const entries = preset.applianceIds
      .map(applianceToEntry)
      .filter((e): e is LoadEntry => e !== null);
    setLoads(entries);
  }, []);

  // ── Assumptions management ──────────────────────────────────────────────

  const updateAssumptions = useCallback((updates: Partial<SystemAssumptions>) => {
    setAssumptions((prev) => {
      const next = { ...prev, ...updates };
      // Auto-lookup sun hours when ZIP changes
      if (updates.zipCode !== undefined) {
        const hours = lookupSunHours(updates.zipCode);
        if (hours !== null) {
          next.sunHoursPerDay = hours;
          next.sunSource = "zip";
          next.sunTier = getSunTier(hours);
        }
      }
      // Update hours when tier changes
      if (updates.sunTier !== undefined && next.sunSource === "tier") {
        next.sunHoursPerDay = SUN_TIERS[updates.sunTier].hours;
      }
      return next;
    });
  }, []);

  // ── URL sync on state changes ──────────────────────────────────────────

  useEffect(() => {
    if (!hydrated.current) return;
    if (loads.length === 0 && step === 1) return; // don't encode empty state
    const params = encodeState(step, loads, assumptions);
    router.replace(`?${params.toString()}`, { scroll: false });
  }, [step, loads, assumptions, router]);

  // ── Computed results ────────────────────────────────────────────────────

  const sizing = useMemo(() => computeSizing(loads, assumptions), [loads, assumptions]);
  const kitMatches = useMemo(() => matchKits(sizing, allKits), [sizing, allKits]);

  // Persist sizing to localStorage when user reaches results step
  useEffect(() => {
    if (step === 3 && sizing.totalDailyWh > 0) {
      saveSizing(sizing);
    }
  }, [step, sizing]);

  // ── Share URL ──────────────────────────────────────────────────────────

  const shareUrl = useMemo(() => {
    const params = encodeState(3, loads, assumptions);
    return `https://offgridempire.com/calculator?${params.toString()}`;
  }, [loads, assumptions]);

  // ── Daily Wh running total ──────────────────────────────────────────────

  const totalDailyWh = sizing.totalDailyWh;

  // ── Navigation ──────────────────────────────────────────────────────────

  const canAdvance = step === 1 ? loads.length > 0 : true;

  const goNext = useCallback(() => {
    if (step < 3) setStep((s) => (s + 1) as 1 | 2 | 3);
  }, [step]);

  const goBack = useCallback(() => {
    if (step > 1) setStep((s) => (s - 1) as 1 | 2 | 3);
  }, [step]);

  return (
    <div>
      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-8">
        {[
          { n: 1, label: "Appliances" },
          { n: 2, label: "Location" },
          { n: 3, label: "Results" },
        ].map(({ n, label }, i) => (
          <div key={n} className="flex items-center gap-2">
            {i > 0 && (
              <div
                className={`h-px w-8 sm:w-12 ${
                  step >= n ? "bg-[var(--accent)]" : "bg-[var(--border)]"
                }`}
              />
            )}
            <button
              onClick={() => {
                if (n === 1 || (n === 2 && loads.length > 0) || (n === 3 && loads.length > 0)) {
                  setStep(n as 1 | 2 | 3);
                }
              }}
              className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                step === n
                  ? "bg-[var(--accent)] text-[var(--bg-primary)]"
                  : step > n
                  ? "bg-[var(--bg-surface)] text-[var(--accent)] border border-[var(--accent)]/30"
                  : "bg-[var(--bg-surface)] text-[var(--text-muted)] border border-[var(--border)]"
              }`}
            >
              <span className="font-mono text-xs">{n}</span>
              <span className="hidden sm:inline">{label}</span>
            </button>
          </div>
        ))}
      </div>

      {/* Step content */}
      {step === 1 && (
        <StepLoads
          loads={loads}
          onAdd={addAppliance}
          onAddCustom={addCustom}
          onUpdate={updateLoad}
          onRemove={removeLoad}
          onLoadPreset={loadPreset}
          totalDailyWh={totalDailyWh}
        />
      )}

      {step === 2 && (
        <StepLocation
          assumptions={assumptions}
          onUpdate={updateAssumptions}
        />
      )}

      {step === 3 && (
        <StepResults
          loads={loads}
          assumptions={assumptions}
          sizing={sizing}
          kitMatches={kitMatches}
          shareUrl={shareUrl}
        />
      )}

      {/* Navigation buttons */}
      <div className="flex items-center justify-between mt-8 pt-6 border-t border-[var(--border)]">
        {step > 1 ? (
          <button
            onClick={goBack}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border)] rounded hover:border-[var(--accent)]/50 transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Back
          </button>
        ) : (
          <div />
        )}

        {step < 3 && (
          <button
            onClick={goNext}
            disabled={!canAdvance}
            className={`flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded transition-colors ${
              canAdvance
                ? "bg-[var(--accent)] text-[var(--bg-primary)] hover:bg-[var(--accent-hover)]"
                : "bg-[var(--bg-surface)] text-[var(--text-muted)] cursor-not-allowed border border-[var(--border)]"
            }`}
          >
            {step === 1 ? "Set Location" : "See Results"}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
