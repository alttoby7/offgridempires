"use client";

import { useState } from "react";

export function PriceAlertForm({ kitSlug }: { kitSlug: string }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;

    setStatus("loading");
    try {
      const res = await fetch("/api/alerts/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), kitSlug }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to subscribe");
      }

      setStatus("success");

      // GA4 event
      if (typeof window !== "undefined" && "gtag" in window) {
        (window as { gtag: (...args: unknown[]) => void }).gtag("event", "alert_subscribe", {
          kit_slug: kitSlug,
        });
      }
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  if (status === "success") {
    return (
      <div className="border-t border-[var(--border)] pt-4">
        <p className="text-xs font-medium text-green-400">
          ✓ We&apos;ll email you when the price drops
        </p>
      </div>
    );
  }

  return (
    <div className="border-t border-[var(--border)] pt-4">
      <p className="text-xs font-medium text-[var(--text-muted)] uppercase mb-2">
        Price Drop Alert
      </p>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (status === "error") setStatus("idle");
          }}
          placeholder="your@email.com"
          required
          className="flex-1 rounded border border-[var(--border)] bg-[var(--bg-primary)] px-3 py-2 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent)] focus:outline-none"
        />
        <button
          type="submit"
          disabled={status === "loading"}
          className="rounded border border-[var(--accent)]/30 bg-[var(--accent)]/10 px-3 py-2 text-xs font-medium text-[var(--accent)] hover:bg-[var(--accent)]/20 transition-colors disabled:opacity-50"
        >
          {status === "loading" ? "..." : "Alert Me"}
        </button>
      </form>
      {status === "error" && (
        <p className="text-xs text-red-400 mt-1">{errorMsg}</p>
      )}
    </div>
  );
}
