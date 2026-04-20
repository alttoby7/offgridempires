"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export function FloatingCta() {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem("floating-cta-dismissed")) {
      setDismissed(true);
      return;
    }

    function onScroll() {
      const scrollPct =
        window.scrollY /
        (document.documentElement.scrollHeight - window.innerHeight);
      setVisible(scrollPct > 0.5);
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (dismissed || !visible) return null;

  function dismiss() {
    setDismissed(true);
    sessionStorage.setItem("floating-cta-dismissed", "1");
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 hidden sm:flex items-center gap-3 rounded border border-[var(--accent)]/30 bg-[var(--bg-surface)] px-4 py-3 shadow-lg backdrop-blur-sm animate-in fade-in slide-in-from-bottom-2 sm:bottom-6 sm:right-6">
      <Link
        href="/calculator/"
        className="text-sm font-medium text-[var(--accent)] hover:underline whitespace-nowrap"
      >
        Found your system size? &rarr; Size My System
      </Link>
      <button
        onClick={dismiss}
        className="text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors ml-1"
        aria-label="Dismiss"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
