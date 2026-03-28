"use client";

import { useState, useRef, useEffect } from "react";

interface InfoTipProps {
  /** The label/trigger text shown inline */
  label: string;
  /** Educational content shown on expand */
  children: React.ReactNode;
  /** Optional variant */
  variant?: "inline" | "block";
}

/**
 * Expandable inline educational tip.
 * Click the (?) icon to reveal contextual explanation.
 */
export function InfoTip({ label, children, variant = "inline" }: InfoTipProps) {
  const [open, setOpen] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  if (variant === "block") {
    return (
      <details className="group mt-2">
        <summary className="flex items-center gap-1.5 cursor-pointer text-xs text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors select-none list-none">
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="shrink-0 transition-transform group-open:rotate-90"
          >
            <path d="M9 18l6-6-6-6" />
          </svg>
          {label}
        </summary>
        <div className="mt-2 pl-5 text-xs text-[var(--text-secondary)] leading-relaxed border-l border-[var(--border)]">
          {children}
        </div>
      </details>
    );
  }

  return (
    <span className="relative inline-flex items-center gap-0.5">
      <button
        onClick={() => setOpen(!open)}
        className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full border border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors text-[9px] font-bold leading-none"
        aria-label={`Learn more about ${label}`}
      >
        ?
      </button>
      {open && (
        <div
          ref={contentRef}
          className="absolute left-6 top-0 z-30 w-64 rounded border border-[var(--border)] bg-[var(--bg-elevated)] p-3 text-xs text-[var(--text-secondary)] leading-relaxed shadow-lg"
        >
          <button
            onClick={() => setOpen(false)}
            className="absolute top-1.5 right-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
          {children}
        </div>
      )}
    </span>
  );
}
