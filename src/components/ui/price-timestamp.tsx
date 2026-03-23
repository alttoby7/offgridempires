interface PriceTimestampProps {
  observedAt: string; // ISO string
  className?: string;
}

export function PriceTimestamp({ observedAt, className = "" }: PriceTimestampProps) {
  const date = new Date(observedAt);
  const now = new Date();
  const hoursAgo = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
  const isStale = hoursAgo > 24;

  const timeLabel =
    hoursAgo < 1
      ? "< 1hr ago"
      : hoursAgo < 24
        ? `${hoursAgo}hr ago`
        : `${Math.floor(hoursAgo / 24)}d ago`;

  return (
    <span
      className={`inline-flex items-center gap-1 font-mono text-[10px] ${
        isStale
          ? "text-[var(--warning)]"
          : "text-[var(--text-muted)]"
      } ${className}`}
      title={`Price observed: ${date.toLocaleString()}`}
    >
      {isStale && (
        <svg
          width="10"
          height="10"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      )}
      {isStale ? `Stale — ${timeLabel}` : `Updated ${timeLabel}`}
    </span>
  );
}
