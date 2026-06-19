import type { Verdict } from "@/lib/calculator/types";

/**
 * Presentational verdict UI — shared by the planner results (client) and the
 * pre-built use-case pages (server). No hooks, so it renders in either context.
 */

export const VERDICT_STYLE: Record<
  Verdict["severity"],
  { color: string; label: string; icon: string }
> = {
  blocker: { color: "var(--danger)", label: "Won't work as-is", icon: "✕" },
  warning: { color: "var(--warning)", label: "Watch out", icon: "!" },
  ok: { color: "var(--success)", label: "Looks good", icon: "✓" },
};

export function VerdictCard({ verdict }: { verdict: Verdict }) {
  const style = VERDICT_STYLE[verdict.severity];
  return (
    <div
      className="rounded border bg-[var(--bg-surface)] p-4"
      style={{ borderColor: `${style.color}55` }}
    >
      <div className="flex items-start gap-3">
        <span
          className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold"
          style={{ backgroundColor: `${style.color}22`, color: style.color }}
          aria-hidden
        >
          {style.icon}
        </span>
        <div className="min-w-0">
          <span
            className="text-[10px] font-semibold uppercase tracking-wide"
            style={{ color: style.color }}
          >
            {style.label}
          </span>
          <h4 className="text-sm font-semibold text-[var(--text-primary)] mt-0.5">
            {verdict.title}
          </h4>
          <p className="text-xs text-[var(--text-secondary)] mt-1 leading-relaxed">
            {verdict.detail}
          </p>
          {verdict.fix && (
            <p className="text-xs mt-2 leading-relaxed">
              <span className="font-semibold text-[var(--text-primary)]">Fix: </span>
              <span className="text-[var(--text-secondary)]">{verdict.fix}</span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export function VerdictList({ verdicts }: { verdicts: Verdict[] }) {
  return (
    <div className="space-y-2">
      {verdicts.map((v) => (
        <VerdictCard key={v.id} verdict={v} />
      ))}
    </div>
  );
}
