/*
 * FitChip — the "Best for: ..." callout above kit page fold.
 * ADVISORY surface: warm tint, editorial voice.
 */

const USE_CASE_LABELS: Record<string, string> = {
  rv: "RV / van life",
  cabin: "weekend cabin",
  shed: "shed / workshop",
  emergency: "emergency backup",
  homestead: "homestead",
  boat: "boat / marine",
};

interface FitChipProps {
  useCaseRatings: Record<string, "excellent" | "good" | "fair" | "poor">;
  variant?: "inline" | "block";
  max?: number;
}

export function FitChip({ useCaseRatings, variant = "block", max = 3 }: FitChipProps) {
  const excellent = Object.entries(useCaseRatings)
    .filter(([, r]) => r === "excellent")
    .map(([k]) => USE_CASE_LABELS[k] ?? k);
  const good = Object.entries(useCaseRatings)
    .filter(([, r]) => r === "good")
    .map(([k]) => USE_CASE_LABELS[k] ?? k);

  const fits = excellent.concat(good).slice(0, max);
  if (fits.length === 0) return null;

  const text =
    fits.length === 1
      ? fits[0]
      : fits.length === 2
        ? `${fits[0]} and ${fits[1]}`
        : `${fits.slice(0, -1).join(", ")}, and ${fits[fits.length - 1]}`;

  if (variant === "inline") {
    return (
      <span className="inline-flex items-center gap-2 text-sm text-[var(--ink-soft)]">
        <span className="eyebrow !text-[var(--accent)]">Best for</span>
        <span className="font-display italic">{text}</span>
      </span>
    );
  }

  return (
    <div className="inline-flex items-baseline gap-3 rounded-sm border border-[var(--accent)]/30 bg-[var(--accent-soft)]/35 px-3.5 py-2">
      <span className="eyebrow !text-[var(--accent-hover)]">Best for</span>
      <span className="font-display text-base italic text-[var(--ink)]">{text}</span>
    </div>
  );
}

interface AvoidChipProps {
  useCaseRatings: Record<string, "excellent" | "good" | "fair" | "poor">;
  max?: number;
}

export function AvoidChip({ useCaseRatings, max = 2 }: AvoidChipProps) {
  const poor = Object.entries(useCaseRatings)
    .filter(([, r]) => r === "poor")
    .map(([k]) => USE_CASE_LABELS[k] ?? k)
    .slice(0, max);

  if (poor.length === 0) return null;

  const text =
    poor.length === 1
      ? poor[0]
      : `${poor.slice(0, -1).join(", ")} or ${poor[poor.length - 1]}`;

  return (
    <div className="inline-flex items-baseline gap-3 rounded-sm border border-[var(--signal-red)]/30 bg-[var(--signal-red)]/[0.06] px-3.5 py-2">
      <span className="eyebrow !text-[var(--signal-red)]">Underpowered for</span>
      <span className="font-display text-base italic text-[var(--ink)]">{text}</span>
    </div>
  );
}
