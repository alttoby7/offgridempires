import { useState } from "react";
import type { SystemAssumptions, SunTier } from "@/lib/calculator/types";
import { SUN_TIERS } from "@/lib/calculator/sun-hours";

interface StepLocationProps {
  assumptions: SystemAssumptions;
  onUpdate: (updates: Partial<SystemAssumptions>) => void;
}

export function StepLocation({ assumptions, onUpdate }: StepLocationProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  return (
    <div>
      <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-1">
        Where is your system?
      </h2>
      <p className="text-sm text-[var(--text-muted)] mb-6">
        Sun hours determine how much solar panel capacity you need. Enter your ZIP or pick a region.
      </p>

      {/* ZIP code input */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
          ZIP Code <span className="text-[var(--text-muted)] font-normal">(for precise sun hours)</span>
        </label>
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={assumptions.zipCode}
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, "").slice(0, 5);
              onUpdate({ zipCode: val });
            }}
            placeholder="e.g. 85001"
            className="w-32 rounded border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-2 font-mono text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)]/50 focus:border-[var(--accent)] focus:outline-none"
            maxLength={5}
          />
          {assumptions.sunSource === "zip" && (
            <span className="text-sm text-[var(--accent)]">
              {assumptions.sunHoursPerDay} peak sun hours/day
            </span>
          )}
        </div>
      </div>

      {/* Sun tier picker */}
      <div className="mb-8">
        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-3">
          {assumptions.sunSource === "zip" ? "Detected region" : "Or pick your region"}
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {(Object.entries(SUN_TIERS) as [SunTier, (typeof SUN_TIERS)[SunTier]][]).map(
            ([tier, info]) => {
              const isActive = assumptions.sunTier === tier;
              return (
                <button
                  key={tier}
                  onClick={() =>
                    onUpdate({
                      sunTier: tier,
                      sunSource: "tier",
                      zipCode: "",
                      sunHoursPerDay: info.hours,
                    })
                  }
                  className={`p-3 rounded border text-left transition-colors ${
                    isActive
                      ? "border-[var(--accent)] bg-[var(--accent)]/10"
                      : "border-[var(--border)] bg-[var(--bg-surface)] hover:border-[var(--accent)]/50"
                  }`}
                >
                  <div
                    className={`text-sm font-semibold ${
                      isActive ? "text-[var(--accent)]" : "text-[var(--text-primary)]"
                    }`}
                  >
                    {info.label}
                  </div>
                  <div className="font-mono text-lg font-bold text-[var(--text-primary)] my-1">
                    {info.hours}
                    <span className="text-xs text-[var(--text-muted)] font-normal ml-1">
                      hr/day
                    </span>
                  </div>
                  <div className="text-xs text-[var(--text-muted)]">{info.example}</div>
                </button>
              );
            }
          )}
        </div>
      </div>

      {/* Advanced settings */}
      <div className="border-t border-[var(--border)] pt-4">
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center gap-2 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
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
            className={`transition-transform ${showAdvanced ? "rotate-90" : ""}`}
          >
            <path d="M9 18l6-6-6-6" />
          </svg>
          System Assumptions
        </button>

        {showAdvanced && (
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            {/* Charge controller */}
            <div>
              <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">
                Charge Controller
              </label>
              <div className="flex rounded border border-[var(--border)] overflow-hidden">
                {(["mppt", "pwm"] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => onUpdate({ controllerType: type })}
                    className={`flex-1 px-3 py-2 text-sm font-medium transition-colors ${
                      assumptions.controllerType === type
                        ? "bg-[var(--accent)] text-[var(--bg-primary)]"
                        : "bg-[var(--bg-surface)] text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                    }`}
                  >
                    {type.toUpperCase()}
                  </button>
                ))}
              </div>
              <p className="text-xs text-[var(--text-muted)] mt-1">
                {assumptions.controllerType === "mppt" ? "94% efficient" : "80% efficient"}
              </p>
            </div>

            {/* Battery chemistry */}
            <div>
              <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">
                Battery Chemistry
              </label>
              <div className="flex rounded border border-[var(--border)] overflow-hidden">
                {(["lifepo4", "agm"] as const).map((chem) => (
                  <button
                    key={chem}
                    onClick={() => onUpdate({ batteryChemistry: chem })}
                    className={`flex-1 px-3 py-2 text-sm font-medium transition-colors ${
                      assumptions.batteryChemistry === chem
                        ? "bg-[var(--accent)] text-[var(--bg-primary)]"
                        : "bg-[var(--bg-surface)] text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                    }`}
                  >
                    {chem === "lifepo4" ? "LiFePO4" : "AGM"}
                  </button>
                ))}
              </div>
              <p className="text-xs text-[var(--text-muted)] mt-1">
                {assumptions.batteryChemistry === "lifepo4"
                  ? "90% usable (DoD)"
                  : "50% usable (DoD)"}
              </p>
            </div>

            {/* Autonomy days */}
            <div>
              <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">
                Days of Autonomy
              </label>
              <div className="flex rounded border border-[var(--border)] overflow-hidden">
                {[1, 2, 3].map((days) => (
                  <button
                    key={days}
                    onClick={() => onUpdate({ autonomyDays: days })}
                    className={`flex-1 px-3 py-2 text-sm font-medium transition-colors ${
                      assumptions.autonomyDays === days
                        ? "bg-[var(--accent)] text-[var(--bg-primary)]"
                        : "bg-[var(--bg-surface)] text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                    }`}
                  >
                    {days}
                  </button>
                ))}
              </div>
              <p className="text-xs text-[var(--text-muted)] mt-1">
                {assumptions.autonomyDays === 1
                  ? "1 day without sun"
                  : `${assumptions.autonomyDays} days without sun`}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
