import Link from "next/link";

interface DataFooterProps {
  kitCount?: number;
  updated?: string;
}

export function DataFooter({ kitCount, updated }: DataFooterProps) {
  const date = (updated ?? new Date().toISOString()).slice(0, 10);
  return (
    <div
      className="font-mono text-xs text-[var(--text-muted)] mb-6 flex flex-wrap items-center gap-x-2 gap-y-1"
      data-nosnippet
    >
      <span>Updated {date}</span>
      <span aria-hidden="true">·</span>
      {kitCount != null && (
        <>
          <span>Based on {kitCount.toLocaleString()} kits</span>
          <span aria-hidden="true">·</span>
        </>
      )}
      <span>Prices refreshed every 6h</span>
      <span aria-hidden="true">·</span>
      <Link
        href="/methodology"
        className="text-[var(--accent)] hover:underline"
      >
        Methodology &rarr;
      </Link>
    </div>
  );
}
