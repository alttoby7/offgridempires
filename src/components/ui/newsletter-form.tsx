"use client";

import { useState } from "react";

const WEEKLY_DROPS_SLUG = "__weekly_drops__";

export function NewsletterForm({ source }: { source?: string }) {
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
        body: JSON.stringify({ email: email.trim(), kitSlug: WEEKLY_DROPS_SLUG }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to subscribe");
      }

      setStatus("success");

      if (typeof window !== "undefined" && "gtag" in window) {
        (window as { gtag: (...args: unknown[]) => void }).gtag("event", "newsletter_subscribe", {
          source: source ?? "unknown",
        });
      }
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  if (status === "success") {
    return (
      <p className="text-sm text-[var(--accent)]">
        ✓ Subscribed. The next index lands Tuesday.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2 max-w-md">
      <input
        type="email"
        value={email}
        onChange={(e) => {
          setEmail(e.target.value);
          if (status === "error") setStatus("idle");
        }}
        placeholder="your@email.com"
        required
        className="flex-1 rounded-sm border border-[var(--rule)] bg-[var(--paper)] px-3 py-2 text-sm text-[var(--ink)] placeholder:text-[var(--ink-muted)] focus:border-[var(--accent)] focus:outline-none"
      />
      <button
        type="submit"
        disabled={status === "loading"}
        className="rounded-sm bg-[var(--ink)] px-4 py-2 text-sm font-semibold text-[var(--paper)] hover:bg-[var(--accent)] transition-colors disabled:opacity-50"
      >
        {status === "loading" ? "..." : "Get weekly drops"}
      </button>
      {status === "error" && (
        <p className="text-xs text-red-400 mt-1">{errorMsg}</p>
      )}
    </form>
  );
}
