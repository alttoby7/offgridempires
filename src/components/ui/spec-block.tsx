interface SpecBlockProps {
  label: string;
  value: string;
  highlight?: boolean;
  winner?: boolean;
  loser?: boolean;
}

export function SpecBlock({ label, value, highlight, winner, loser }: SpecBlockProps) {
  let borderClass = "";
  if (winner) borderClass = "border-[var(--success)]/30 bg-[var(--success)]/5";
  else if (loser) borderClass = "border-[var(--danger)]/20 bg-[var(--danger)]/5";

  return (
    <div
      className={`rounded border bg-[var(--bg-primary)] px-2.5 py-2 ${
        borderClass || "border-transparent"
      }`}
    >
      <p className="font-mono text-[10px] text-[var(--text-muted)] uppercase tracking-wider">
        {label}
      </p>
      <p
        className={`font-mono text-sm font-semibold mt-0.5 ${
          highlight
            ? "text-[var(--accent)]"
            : winner
              ? "text-[var(--success)]"
              : loser
                ? "text-[var(--danger)]/80"
                : "text-[var(--text-primary)]"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
