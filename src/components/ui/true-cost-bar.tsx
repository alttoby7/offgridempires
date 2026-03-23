interface TrueCostBarProps {
  listedPrice: number;
  missingCost: number;
  trueCost: number;
  compact?: boolean;
}

export function TrueCostBar({
  listedPrice,
  missingCost,
  trueCost,
  compact = false,
}: TrueCostBarProps) {
  const listedPct = trueCost > 0 ? (listedPrice / trueCost) * 100 : 100;
  const missingPct = trueCost > 0 ? (missingCost / trueCost) * 100 : 0;
  const hasMissing = missingCost > 0;

  return (
    <div className={compact ? "" : "space-y-2"}>
      {!compact && (
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">
            Real Build Cost Breakdown
          </span>
          <span className="font-mono text-sm font-bold text-[var(--accent)]">
            ${trueCost.toLocaleString()}
          </span>
        </div>
      )}

      {/* Stacked bar */}
      <div className="flex h-3 rounded-sm overflow-hidden bg-[var(--bg-primary)] border border-[var(--border)]">
        <div
          className="bg-[var(--accent)]/60 transition-all duration-500"
          style={{ width: `${listedPct}%` }}
          title={`Kit price: $${listedPrice.toLocaleString()}`}
        />
        {hasMissing && (
          <div
            className="bg-[var(--danger)]/40 border-l border-[var(--bg-primary)] transition-all duration-500"
            style={{ width: `${missingPct}%` }}
            title={`Missing components: ~$${missingCost.toLocaleString()}`}
          />
        )}
      </div>

      {!compact && (
        <div className="flex items-center gap-4 text-xs">
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-2.5 h-2.5 rounded-sm bg-[var(--accent)]/60" />
            <span className="text-[var(--text-secondary)]">
              Kit price ${listedPrice.toLocaleString()}
            </span>
          </span>
          {hasMissing && (
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-2.5 h-2.5 rounded-sm bg-[var(--danger)]/40" />
              <span className="text-[var(--text-secondary)]">
                Missing ~${missingCost.toLocaleString()}
              </span>
            </span>
          )}
        </div>
      )}
    </div>
  );
}
