import { useState } from "react";
import type { LoadEntry, ApplianceCategory } from "@/lib/calculator/types";
import { APPLIANCE_CATALOG, APPLIANCE_CATEGORIES, LOAD_PRESETS } from "@/lib/calculator/appliances";
import { computeLoadWh } from "@/lib/calculator/engine";
import { ApplianceRow } from "./appliance-row";

interface StepLoadsProps {
  loads: LoadEntry[];
  onAdd: (applianceId: string) => void;
  onAddCustom: () => void;
  onUpdate: (id: string, updates: Partial<LoadEntry>) => void;
  onRemove: (id: string) => void;
  onLoadPreset: (presetId: string) => void;
  totalDailyWh: number;
}

const CATEGORY_ICONS: Record<ApplianceCategory, string> = {
  Lighting: "💡",
  Communication: "📡",
  Kitchen: "🍳",
  Climate: "🌡️",
  Water: "💧",
  Laundry: "👕",
  Personal: "🪥",
  Entertainment: "📺",
  Tools: "🔧",
  Medical: "🏥",
};

export function StepLoads({
  loads,
  onAdd,
  onAddCustom,
  onUpdate,
  onRemove,
  onLoadPreset,
  totalDailyWh,
}: StepLoadsProps) {
  const [showCatalog, setShowCatalog] = useState(loads.length === 0);
  const [activeCategory, setActiveCategory] = useState<ApplianceCategory>("Lighting");

  // IDs already in the load list
  const addedIds = new Set(loads.filter((l) => !l.isCustom).map((l) => l.name));

  const categoryAppliances = APPLIANCE_CATALOG.filter(
    (a) => a.category === activeCategory
  );

  return (
    <div>
      <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-1">
        What do you need to power?
      </h2>
      <p className="text-sm text-[var(--text-muted)] mb-6">
        Add your appliances to calculate daily energy needs. Use a preset to get started quickly.
      </p>

      {/* Presets */}
      <div className="flex flex-wrap gap-2 mb-6">
        {LOAD_PRESETS.map((preset) => (
          <button
            key={preset.id}
            onClick={() => {
              onLoadPreset(preset.id);
              setShowCatalog(false);
            }}
            className="group flex items-center gap-2 px-3 py-2 rounded border border-[var(--border)] bg-[var(--bg-surface)] hover:border-[var(--accent)]/50 transition-colors"
          >
            <span className="text-sm font-medium text-[var(--text-primary)] group-hover:text-[var(--accent)]">
              {preset.label}
            </span>
            <span className="text-xs text-[var(--text-muted)]">{preset.description}</span>
          </button>
        ))}
      </div>

      {/* Current loads */}
      {loads.length > 0 && (
        <div className="space-y-2 mb-6">
          {loads.map((entry) => (
            <ApplianceRow
              key={entry.id}
              entry={entry}
              onUpdate={onUpdate}
              onRemove={onRemove}
            />
          ))}

          {/* Running total */}
          <div className="flex items-center justify-between px-4 py-3 rounded border border-[var(--accent)]/30 bg-[var(--accent)]/5">
            <span className="text-sm font-medium text-[var(--text-secondary)]">
              Daily Energy Need
            </span>
            <div>
              <span className="font-mono text-lg font-bold text-[var(--accent)]">
                {totalDailyWh >= 1000
                  ? `${(totalDailyWh / 1000).toFixed(1)}kWh`
                  : `${Math.round(totalDailyWh)}Wh`}
              </span>
              <span className="text-xs text-[var(--text-muted)] ml-1">/day</span>
            </div>
          </div>
        </div>
      )}

      {/* Add more buttons */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setShowCatalog(!showCatalog)}
          className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--accent)] hover:border-[var(--accent)]/50 transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
          {showCatalog ? "Hide Catalog" : "Add Appliance"}
        </button>
        <button
          onClick={onAddCustom}
          className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded border border-dashed border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--accent)] hover:border-[var(--accent)]/50 transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
          Custom
        </button>
      </div>

      {/* Appliance catalog */}
      {showCatalog && (
        <div className="rounded border border-[var(--border)] bg-[var(--bg-surface)] overflow-hidden">
          {/* Category tabs */}
          <div className="flex overflow-x-auto border-b border-[var(--border)] bg-[var(--bg-primary)]">
            {APPLIANCE_CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  activeCategory === cat
                    ? "border-[var(--accent)] text-[var(--accent)]"
                    : "border-transparent text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
                }`}
              >
                <span className="text-xs">{CATEGORY_ICONS[cat]}</span>
                {cat}
              </button>
            ))}
          </div>

          {/* Appliances in category */}
          <div className="p-3 grid gap-2 sm:grid-cols-2">
            {categoryAppliances.map((appliance) => {
              const alreadyAdded = addedIds.has(appliance.name);
              const dailyWh =
                appliance.defaultWatts *
                appliance.defaultQty *
                appliance.defaultHours *
                appliance.dutyCycle;

              return (
                <button
                  key={appliance.id}
                  onClick={() => {
                    onAdd(appliance.id);
                  }}
                  disabled={alreadyAdded}
                  className={`flex items-center justify-between p-3 rounded border text-left transition-colors ${
                    alreadyAdded
                      ? "border-[var(--accent)]/20 bg-[var(--accent)]/5 opacity-60 cursor-default"
                      : "border-[var(--border)] hover:border-[var(--accent)]/50 hover:bg-[var(--bg-primary)]"
                  }`}
                >
                  <div>
                    <div className="text-sm font-medium text-[var(--text-primary)]">
                      {appliance.name}
                      {alreadyAdded && (
                        <span className="ml-2 text-xs text-[var(--accent)]">Added</span>
                      )}
                    </div>
                    <div className="text-xs text-[var(--text-muted)] mt-0.5">
                      {appliance.defaultWatts}W
                      {appliance.dutyCycle < 1 &&
                        ` × ${Math.round(appliance.dutyCycle * 100)}% duty`}
                      {appliance.defaultQty > 1 && ` × ${appliance.defaultQty}`}
                      {" · "}
                      {appliance.defaultHours}h/day
                    </div>
                    {appliance.notes && (
                      <div className="text-xs text-[var(--text-muted)] italic mt-0.5">
                        {appliance.notes}
                      </div>
                    )}
                  </div>
                  <span className="font-mono text-xs text-[var(--accent)] whitespace-nowrap ml-3">
                    {Math.round(dailyWh)}Wh
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
