import { useState } from "react";
import Link from "next/link";
import type { LoadEntry, SystemAssumptions, SizingResult, KitMatch, FitBucket } from "@/lib/calculator/types";
import { EFFICIENCY, BUCKET_LABELS, computeLoadWh } from "@/lib/calculator/engine";

interface StepResultsProps {
  loads: LoadEntry[];
  assumptions: SystemAssumptions;
  sizing: SizingResult;
  kitMatches: KitMatch[];
}

function fmt(n: number): string {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : n.toLocaleString();
}

function CoverageBar({ pct, label }: { pct: number; label: string }) {
  const clamped = Math.min(pct, 200);
  const color =
    pct >= 100 ? "var(--success)" : pct >= 80 ? "var(--accent)" : pct >= 50 ? "var(--warning)" : "var(--danger)";

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-[var(--text-muted)] w-14 shrink-0">{label}</span>
      <div className="flex-1 h-2 rounded-full bg-[var(--bg-primary)] overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${Math.min(100, (clamped / 200) * 100)}%`,
            backgroundColor: color,
          }}
        />
      </div>
      <span className="font-mono text-xs w-10 text-right" style={{ color }}>
        {Math.round(pct)}%
      </span>
    </div>
  );
}

export function StepResults({ loads, assumptions, sizing, kitMatches }: StepResultsProps) {
  const [showMath, setShowMath] = useState(false);

  const meetsCount = kitMatches.filter((m) => m.bucket === "meets").length;
  const nearCount = kitMatches.filter((m) => m.bucket === "near").length;

  return (
    <div>
      <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-1">
        Your Power Profile
      </h2>
      <p className="text-sm text-[var(--text-muted)] mb-6">
        Based on {loads.length} appliance{loads.length !== 1 ? "s" : ""} at{" "}
        {assumptions.sunHoursPerDay} peak sun hours/day.
      </p>

      {/* Sizing summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        {[
          {
            label: "Daily Energy",
            value: sizing.totalDailyWh >= 1000
              ? `${(sizing.totalDailyWh / 1000).toFixed(1)}`
              : `${sizing.totalDailyWh}`,
            unit: sizing.totalDailyWh >= 1000 ? "kWh" : "Wh",
          },
          { label: "Solar Needed", value: fmt(sizing.requiredPanelWatts), unit: "W" },
          {
            label: "Storage Needed",
            value: sizing.requiredStorageWh >= 1000
              ? `${(sizing.requiredStorageWh / 1000).toFixed(1)}`
              : `${sizing.requiredStorageWh}`,
            unit: sizing.requiredStorageWh >= 1000 ? "kWh" : "Wh",
          },
          { label: "Inverter Needed", value: fmt(sizing.requiredInverterWatts), unit: "W" },
        ].map((card) => (
          <div
            key={card.label}
            className="rounded border border-[var(--border)] bg-[var(--bg-surface)] p-4"
          >
            <div className="text-xs text-[var(--text-muted)] mb-1">{card.label}</div>
            <div className="flex items-baseline gap-1">
              <span className="font-mono text-2xl font-bold text-[var(--accent)]">
                {card.value}
              </span>
              <span className="text-sm text-[var(--text-muted)]">{card.unit}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Show math */}
      <div className="mb-8">
        <button
          onClick={() => setShowMath(!showMath)}
          className="flex items-center gap-2 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors"
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`transition-transform ${showMath ? "rotate-90" : ""}`}
          >
            <path d="M9 18l6-6-6-6" />
          </svg>
          Show the math
        </button>

        {showMath && (
          <div className="mt-3 rounded border border-[var(--border)] bg-[var(--bg-primary)] p-4 font-mono text-xs text-[var(--text-secondary)] space-y-3 overflow-x-auto">
            <div>
              <div className="text-[var(--text-muted)] mb-1">Daily energy consumption:</div>
              {loads.map((l) => (
                <div key={l.id} className="ml-2">
                  {l.name}: {l.watts}W × {l.qty} × {l.hoursPerDay}h × {l.dutyCycle} ={" "}
                  <span className="text-[var(--accent)]">{Math.round(computeLoadWh(l))}Wh</span>
                </div>
              ))}
              <div className="mt-1 font-semibold">
                Total = <span className="text-[var(--accent)]">{sizing.totalDailyWh}Wh/day</span>
              </div>
            </div>

            <div>
              <div className="text-[var(--text-muted)] mb-1">Solar panel sizing:</div>
              <div className="ml-2">
                {sizing.totalDailyWh}Wh ÷ ({assumptions.sunHoursPerDay}h ×{" "}
                {assumptions.controllerType === "mppt" ? EFFICIENCY.mppt : EFFICIENCY.pwm} ×{" "}
                {EFFICIENCY.misc}) ={" "}
                <span className="text-[var(--accent)]">{sizing.requiredPanelWatts}W</span>
              </div>
            </div>

            <div>
              <div className="text-[var(--text-muted)] mb-1">Battery storage:</div>
              <div className="ml-2">
                {sizing.totalDailyWh}Wh × {assumptions.autonomyDays} day
                {assumptions.autonomyDays > 1 ? "s" : ""} ÷{" "}
                {assumptions.batteryChemistry === "lifepo4"
                  ? EFFICIENCY.lifepo4DoD
                  : EFFICIENCY.agmDoD}{" "}
                DoD = <span className="text-[var(--accent)]">{sizing.requiredStorageWh}Wh</span>
              </div>
            </div>

            <div>
              <div className="text-[var(--text-muted)] mb-1">Inverter sizing:</div>
              <div className="ml-2">
                {sizing.peakContinuousWatts}W continuous ÷ {EFFICIENCY.inverter} ={" "}
                <span className="text-[var(--accent)]">{sizing.requiredInverterWatts}W</span>
              </div>
              {sizing.peakSurgeWatts > 0 && (
                <div className="ml-2 text-[var(--text-muted)]">
                  Peak surge: {sizing.peakSurgeWatts}W (check inverter surge rating)
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Kit match summary */}
      {meetsCount === 0 && (
        <div className="rounded border border-[var(--warning)]/30 bg-[var(--warning)]/5 px-4 py-3 mb-6">
          <div className="text-sm font-medium text-[var(--warning)]">
            No kit fully meets your needs
          </div>
          <div className="text-xs text-[var(--text-muted)] mt-1">
            Your system requires more capacity than any single kit we track provides.
            {nearCount > 0
              ? ` ${nearCount} kit${nearCount > 1 ? "s" : ""} come close — check the gap details below.`
              : " You may need to combine kits or buy components separately."}
          </div>
        </div>
      )}

      {meetsCount > 0 && (
        <div className="rounded border border-[var(--success)]/30 bg-[var(--success)]/5 px-4 py-3 mb-6">
          <div className="text-sm font-medium" style={{ color: "var(--success)" }}>
            {meetsCount} kit{meetsCount > 1 ? "s" : ""} meet{meetsCount === 1 ? "s" : ""} your
            needs
          </div>
        </div>
      )}

      {/* Kit matches by bucket */}
      <div className="space-y-6">
        {(["meets", "near", "lighter", "solar-only", "undersized"] as FitBucket[]).map(
          (bucket) => {
            const matches = kitMatches.filter((m) => m.bucket === bucket);
            if (matches.length === 0) return null;

            const bucketInfo = BUCKET_LABELS[bucket];

            return (
              <div key={bucket}>
                <div className="flex items-center gap-2 mb-3">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: bucketInfo.color }}
                  />
                  <h3 className="text-sm font-semibold" style={{ color: bucketInfo.color }}>
                    {bucketInfo.label}
                  </h3>
                  <span className="text-xs text-[var(--text-muted)]">
                    ({matches.length} kit{matches.length !== 1 ? "s" : ""})
                  </span>
                </div>

                <div className="space-y-2">
                  {matches.map((match) => (
                    <div
                      key={match.kit.id}
                      className="rounded border border-[var(--border)] bg-[var(--bg-surface)] p-4"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <Link
                            href={`/kits/${match.kit.slug}`}
                            className="text-sm font-semibold text-[var(--text-primary)] hover:text-[var(--accent)] transition-colors"
                          >
                            {match.kit.name}
                          </Link>
                          <div className="text-xs text-[var(--text-muted)] mt-0.5">
                            {match.kit.brand} · ${match.kit.trueCost.toLocaleString()} real cost
                          </div>
                        </div>
                        <Link
                          href={`/kits/${match.kit.slug}`}
                          className="text-xs text-[var(--accent)] hover:underline shrink-0 ml-4"
                        >
                          View Kit →
                        </Link>
                      </div>

                      {/* Coverage bars */}
                      <div className="space-y-1.5">
                        <CoverageBar pct={match.solarCoverage} label="Solar" />
                        <CoverageBar pct={match.storageCoverage} label="Storage" />
                        <CoverageBar pct={match.inverterCoverage} label="Inverter" />
                      </div>

                      {/* Gap strings */}
                      {match.gaps.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-[var(--border)]">
                          <div className="flex flex-wrap gap-2">
                            {match.gaps.map((gap, i) => (
                              <span
                                key={i}
                                className="text-xs px-2 py-0.5 rounded bg-[var(--bg-primary)] text-[var(--text-muted)] border border-[var(--border)]"
                              >
                                {gap}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          }
        )}
      </div>

      {/* Screen reader summary */}
      <div className="sr-only" role="status" aria-live="polite">
        Your system needs {sizing.totalDailyWh} watt-hours per day,{" "}
        {sizing.requiredPanelWatts} watts of solar panels,{" "}
        {sizing.requiredStorageWh} watt-hours of battery storage, and a{" "}
        {sizing.requiredInverterWatts} watt inverter.{" "}
        {meetsCount > 0
          ? `${meetsCount} kit${meetsCount !== 1 ? "s" : ""} fully meet your needs.`
          : "No tracked kit fully meets your needs."}
      </div>
    </div>
  );
}
