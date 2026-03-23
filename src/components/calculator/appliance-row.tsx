import type { LoadEntry } from "@/lib/calculator/types";
import { computeLoadWh } from "@/lib/calculator/engine";

interface ApplianceRowProps {
  entry: LoadEntry;
  onUpdate: (id: string, updates: Partial<LoadEntry>) => void;
  onRemove: (id: string) => void;
}

export function ApplianceRow({ entry, onUpdate, onRemove }: ApplianceRowProps) {
  const dailyWh = computeLoadWh(entry);

  return (
    <div className="flex flex-wrap items-center gap-3 rounded border border-[var(--border)] bg-[var(--bg-surface)] px-4 py-3">
      {/* Name */}
      <div className="flex-1 min-w-[140px]">
        {entry.isCustom ? (
          <input
            type="text"
            value={entry.name}
            onChange={(e) => onUpdate(entry.id, { name: e.target.value })}
            className="w-full bg-transparent text-sm text-[var(--text-primary)] border-b border-[var(--border)] focus:border-[var(--accent)] focus:outline-none py-0.5"
            placeholder="Appliance name"
          />
        ) : (
          <span className="text-sm text-[var(--text-primary)]">{entry.name}</span>
        )}
      </div>

      {/* Watts */}
      <div className="flex items-center gap-1">
        <input
          type="number"
          value={entry.watts}
          onChange={(e) => onUpdate(entry.id, { watts: Math.max(0, Number(e.target.value)) })}
          className="w-16 rounded border border-[var(--border)] bg-[var(--bg-primary)] px-2 py-1 font-mono text-sm text-[var(--text-primary)] text-right focus:border-[var(--accent)] focus:outline-none"
          min={0}
          step={1}
        />
        <span className="text-xs text-[var(--text-muted)]">W</span>
      </div>

      {/* Quantity */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => onUpdate(entry.id, { qty: Math.max(1, entry.qty - 1) })}
          className="w-6 h-6 flex items-center justify-center rounded border border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors text-xs"
        >
          −
        </button>
        <span className="font-mono text-sm text-[var(--text-primary)] w-5 text-center">
          {entry.qty}
        </span>
        <button
          onClick={() => onUpdate(entry.id, { qty: entry.qty + 1 })}
          className="w-6 h-6 flex items-center justify-center rounded border border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors text-xs"
        >
          +
        </button>
      </div>

      {/* Hours per day */}
      <div className="flex items-center gap-1">
        <input
          type="number"
          value={entry.hoursPerDay}
          onChange={(e) =>
            onUpdate(entry.id, {
              hoursPerDay: Math.max(0, Math.min(24, Number(e.target.value))),
            })
          }
          className="w-14 rounded border border-[var(--border)] bg-[var(--bg-primary)] px-2 py-1 font-mono text-sm text-[var(--text-primary)] text-right focus:border-[var(--accent)] focus:outline-none"
          min={0}
          max={24}
          step={0.25}
        />
        <span className="text-xs text-[var(--text-muted)]">hr/d</span>
      </div>

      {/* Daily Wh */}
      <div className="w-20 text-right">
        <span className="font-mono text-sm font-semibold text-[var(--accent)]">
          {Math.round(dailyWh)}
        </span>
        <span className="text-xs text-[var(--text-muted)] ml-1">Wh</span>
      </div>

      {/* Remove */}
      <button
        onClick={() => onRemove(entry.id)}
        className="text-[var(--text-muted)] hover:text-[var(--danger)] transition-colors p-1"
        title="Remove"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
