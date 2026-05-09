import Link from "next/link";

interface BylineProps {
  /** Real last-observed timestamp (ISO date or formatted) */
  lastUpdated: string;
  /** Specific data context (e.g., "Price observed", "Article reviewed") */
  observationLabel?: string;
  /** Optional refresh cadence text */
  cadence?: string;
}

/**
 * Honest data-byline for OGE pages. Shows real observation timestamps and
 * methodology link instead of fabricated human author lines. The site is
 * framed as a data tool — bylines should match.
 */
export function Byline({
  lastUpdated,
  observationLabel = "Last observed",
  cadence = "Prices refreshed every 6 hours",
}: BylineProps) {
  return (
    <div className="my-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[var(--ink-muted)] font-[system-ui,sans-serif]">
      <span className="inline-flex items-center gap-1.5">
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full rounded-full bg-[var(--accent)] opacity-60 animate-ping" />
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[var(--accent)]" />
        </span>
        <span className="tabular">
          {observationLabel}: <span className="text-[var(--ink-soft)]">{lastUpdated}</span>
        </span>
      </span>
      <span className="text-[var(--rule)]">·</span>
      <span className="tabular">{cadence}</span>
      <span className="text-[var(--rule)]">·</span>
      <Link
        href="/how-real-build-cost-is-calculated/"
        className="text-[var(--accent)] hover:underline"
      >
        Methodology
      </Link>
    </div>
  );
}
