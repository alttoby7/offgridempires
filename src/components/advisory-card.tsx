/*
 * AdvisoryCard — warm-tinted editorial callout.
 * ADVISORY surface (warm tint), used for warnings, fit notes, methodology asides.
 *
 * Tones:
 *   - note    : neutral editorial aside (default)
 *   - warning : signal-red, used for receipt warnings, missing-part alerts
 *   - good    : muted field green, used for "complete kit" callouts
 */

type AdvisoryTone = "note" | "warning" | "good";

interface AdvisoryCardProps {
  tone?: AdvisoryTone;
  eyebrow?: string;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

const toneStyles: Record<AdvisoryTone, { bg: string; border: string; eyebrow: string; title: string; mark: string }> = {
  note: {
    bg: "bg-[var(--accent-soft-2)]/55",
    border: "border-[var(--accent)]/35",
    eyebrow: "!text-[var(--accent-hover)]",
    title: "text-[var(--ink)]",
    mark: "bg-[var(--accent)]",
  },
  warning: {
    bg: "bg-[var(--signal-red)]/[0.07]",
    border: "border-[var(--signal-red)]/35",
    eyebrow: "!text-[var(--signal-red)]",
    title: "text-[var(--ink)]",
    mark: "bg-[var(--signal-red)]",
  },
  good: {
    bg: "bg-[var(--success)]/[0.08]",
    border: "border-[var(--success)]/35",
    eyebrow: "!text-[var(--success)]",
    title: "text-[var(--ink)]",
    mark: "bg-[var(--success)]",
  },
};

export function AdvisoryCard({
  tone = "note",
  eyebrow,
  title,
  children,
  className,
}: AdvisoryCardProps) {
  const s = toneStyles[tone];
  return (
    <aside
      className={`relative rounded-sm border ${s.border} ${s.bg} pl-5 pr-5 py-4 ${className ?? ""}`}
    >
      {/* Left mark */}
      <span className={`absolute left-0 top-3 bottom-3 w-[3px] ${s.mark} rounded-full`} />
      {eyebrow && <p className={`eyebrow ${s.eyebrow} mb-1.5`}>{eyebrow}</p>}
      {title && (
        <h3 className={`font-display text-lg leading-snug ${s.title} mb-1`}>
          {title}
        </h3>
      )}
      <div className="text-sm leading-relaxed text-[var(--ink-soft)] [&_p]:leading-relaxed [&_strong]:text-[var(--ink)]">
        {children}
      </div>
    </aside>
  );
}
