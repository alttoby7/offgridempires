"use client";

import { useState, useMemo, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import type { Kit, KitItem } from "@/lib/demo-data";
import { PriceTimestamp } from "@/components/ui/price-timestamp";

// ── Category → Role mapping ─────────────────────────────────────────────────

const CATEGORY_ROLES: Record<string, string[]> = {
  batteries: ["Battery"],
  panels: ["Solar Panels"],
  "charge-controllers": ["Charge Controller"],
  inverters: ["Inverter"],
  "power-stations": ["Battery", "Inverter", "Charge Controller"], // all-in-ones
  generators: ["Inverter"], // fallback
};

// ── Sort ────────────────────────────────────────────────────────────────────

type SortKey = "true_cost_asc" | "true_cost_desc" | "component_cost" | "panel_watts" | "storage" | "completeness";

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "true_cost_asc", label: "Real Build Cost: Low → High" },
  { value: "true_cost_desc", label: "Real Build Cost: High → Low" },
  { value: "component_cost", label: "Component Cost" },
  { value: "panel_watts", label: "Panel Watts" },
  { value: "storage", label: "Storage Capacity" },
  { value: "completeness", label: "Completeness" },
];

// ── Component info extraction ───────────────────────────────────────────────

interface ComponentInfo {
  item: KitItem;
  isIncluded: boolean;
  cost: number | null; // estimated cost if missing, null if included
}

function getComponentInfo(kit: Kit, roles: string[]): ComponentInfo | null {
  // Find the first matching item
  const item = kit.items.find((i) => roles.includes(i.role));
  if (!item) return null;
  return {
    item,
    isIncluded: item.isIncluded,
    cost: item.isIncluded ? null : item.estimatedCost ?? null,
  };
}

// ── Main Component ──────────────────────────────────────────────────────────

interface CategoryBrowserProps {
  allKits: Kit[];
  category: string;
  categoryTitle: string;
}

export function CategoryBrowser({ allKits, category, categoryTitle }: CategoryBrowserProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const roles = CATEGORY_ROLES[category] ?? [];

  // Filters from URL
  const sortKey = (searchParams.get("sort") as SortKey) || "true_cost_asc";
  const showFilter = searchParams.get("show") || "all"; // all | included | missing
  const brandFilter = searchParams.get("brand") || "all";

  // Derive brands from data
  const brands = useMemo(
    () => [...new Set(allKits.map((k) => k.brand))].sort(),
    [allKits]
  );

  const setParam = useCallback(
    (key: string, value: string, defaultValue: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value === defaultValue) {
        params.delete(key);
      } else {
        params.set(key, value);
      }
      const qs = params.toString();
      router.replace(`/categories/${category}${qs ? `?${qs}` : ""}`, { scroll: false });
    },
    [searchParams, router, category]
  );

  // Build kit + component info pairs
  const kitsWithComponents = useMemo(() => {
    return allKits.map((kit) => ({
      kit,
      component: getComponentInfo(kit, roles),
    }));
  }, [allKits, roles]);

  // Filter
  const filtered = useMemo(() => {
    let result = kitsWithComponents;

    // Brand filter
    if (brandFilter !== "all") {
      result = result.filter((k) => k.kit.brand === brandFilter);
    }

    // Show filter: included/missing
    if (showFilter === "included") {
      result = result.filter((k) => k.component?.isIncluded);
    } else if (showFilter === "missing") {
      result = result.filter((k) => k.component && !k.component.isIncluded);
    }

    return result;
  }, [kitsWithComponents, brandFilter, showFilter]);

  // Sort
  const sorted = useMemo(() => {
    const arr = [...filtered];
    switch (sortKey) {
      case "true_cost_asc":
        return arr.sort((a, b) => a.kit.trueCost - b.kit.trueCost);
      case "true_cost_desc":
        return arr.sort((a, b) => b.kit.trueCost - a.kit.trueCost);
      case "component_cost": {
        const getCost = (k: typeof arr[0]) => {
          if (!k.component) return Infinity;
          if (k.component.isIncluded) return 0;
          return k.component.cost ?? Infinity;
        };
        return arr.sort((a, b) => getCost(a) - getCost(b));
      }
      case "panel_watts":
        return arr.sort((a, b) => b.kit.panelWatts - a.kit.panelWatts);
      case "storage":
        return arr.sort((a, b) => b.kit.storageWh - a.kit.storageWh);
      case "completeness":
        return arr.sort((a, b) => b.kit.completeness - a.kit.completeness);
    }
  }, [filtered, sortKey]);

  // Stats
  const includedCount = kitsWithComponents.filter((k) => k.component?.isIncluded).length;
  const missingCount = kitsWithComponents.filter((k) => k.component && !k.component.isIncluded).length;

  // Active filter count
  const activeFilters = [
    sortKey !== "true_cost_asc",
    showFilter !== "all",
    brandFilter !== "all",
  ].filter(Boolean).length;

  return (
    <div>
      {/* Summary stats */}
      <div className="flex flex-wrap items-center gap-4 mb-6">
        <div className="flex items-center gap-2 rounded border border-[var(--success)]/30 bg-[var(--success)]/5 px-3 py-1.5">
          <span className="font-mono text-sm font-bold text-[var(--success)]">{includedCount}</span>
          <span className="text-xs text-[var(--text-secondary)]">kits include {categoryTitle.toLowerCase()}</span>
        </div>
        <div className="flex items-center gap-2 rounded border border-[var(--danger)]/30 bg-[var(--danger)]/5 px-3 py-1.5">
          <span className="font-mono text-sm font-bold text-[var(--danger)]">{missingCount}</span>
          <span className="text-xs text-[var(--text-secondary)]">kits need {categoryTitle.toLowerCase()}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        {/* Sort */}
        <select
          value={sortKey}
          onChange={(e) => setParam("sort", e.target.value, "true_cost_asc")}
          className="rounded border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-2 text-sm text-[var(--text-primary)] focus:border-[var(--accent)] focus:outline-none"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>

        {/* Show filter */}
        <div className="flex rounded border border-[var(--border)] overflow-hidden">
          {[
            { value: "all", label: "All" },
            { value: "included", label: "Included" },
            { value: "missing", label: "Missing" },
          ].map((opt) => (
            <button
              key={opt.value}
              onClick={() => setParam("show", opt.value, "all")}
              aria-pressed={showFilter === opt.value}
              className={`px-3 py-2 text-xs font-medium transition-colors ${
                showFilter === opt.value
                  ? "bg-[var(--accent)] text-[var(--bg-primary)]"
                  : "bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Brand filter */}
        <select
          value={brandFilter}
          onChange={(e) => setParam("brand", e.target.value, "all")}
          className={`rounded border px-3 py-2 text-sm focus:border-[var(--accent)] focus:outline-none ${
            brandFilter !== "all"
              ? "border-[var(--accent)]/50 bg-[var(--accent)]/5 text-[var(--accent)]"
              : "border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-primary)]"
          }`}
        >
          <option value="all">All Brands</option>
          {brands.map((b) => (
            <option key={b} value={b}>{b}</option>
          ))}
        </select>

        {/* Clear */}
        {activeFilters > 0 && (
          <button
            onClick={() => router.replace(`/categories/${category}`, { scroll: false })}
            className="text-xs text-[var(--accent)] hover:text-[var(--accent-hover)] transition-colors"
          >
            Clear {activeFilters} filter{activeFilters > 1 ? "s" : ""}
          </button>
        )}
      </div>

      {/* Results */}
      {sorted.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 rounded border border-dashed border-[var(--border)] bg-[var(--bg-surface)]">
          <p className="text-sm text-[var(--text-muted)] mb-2">No kits match your filters</p>
          <button
            onClick={() => router.replace(`/categories/${category}`, { scroll: false })}
            className="text-xs text-[var(--accent)] hover:text-[var(--accent-hover)] transition-colors"
          >
            Clear all filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sorted.map(({ kit, component }) => (
            <Link
              key={kit.slug}
              href={`/kits/${kit.slug}`}
              className="group relative flex flex-col border border-[var(--border)] rounded bg-[var(--bg-surface)] hover:border-[var(--border-accent)] transition-all duration-200 overflow-hidden"
            >
              {/* Component status bar */}
              <div className={`h-1 ${component?.isIncluded ? "bg-[var(--success)]" : "bg-[var(--danger)]/60"}`} />

              <div className="p-5 flex-1 flex flex-col gap-3">
                {/* Brand + name */}
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">
                    {kit.brand}
                  </p>
                  <h3 className="text-base font-semibold text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors line-clamp-2 mt-1">
                    {kit.name}
                  </h3>
                </div>

                {/* Component detail */}
                {component && (
                  <div className={`rounded px-3 py-2.5 ${
                    component.isIncluded
                      ? "bg-[var(--success)]/5 border border-[var(--success)]/20"
                      : "bg-[var(--danger)]/5 border border-[var(--danger)]/20"
                  }`}>
                    <div className="flex items-center gap-2 mb-1">
                      {component.isIncluded ? (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--success)]"><path d="M20 6L9 17l-5-5" /></svg>
                      ) : (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--danger)]"><path d="M18 6L6 18M6 6l12 12" /></svg>
                      )}
                      <span className={`text-xs font-semibold ${
                        component.isIncluded ? "text-[var(--success)]" : "text-[var(--danger)]"
                      }`}>
                        {component.isIncluded ? "Included" : "Not Included"}
                      </span>
                    </div>
                    <p className="text-sm text-[var(--text-primary)]">
                      {component.item.name}
                    </p>
                    {component.item.specs && (
                      <p className="text-xs text-[var(--text-muted)] mt-0.5">
                        {component.item.specs}
                      </p>
                    )}
                    {!component.isIncluded && component.cost && (
                      <p className="font-mono text-xs text-[var(--danger)] mt-1">
                        ~${component.cost.toLocaleString()} estimated
                      </p>
                    )}
                  </div>
                )}

                {/* Kit cost */}
                <div className="flex items-baseline gap-3">
                  {kit.missingCost > 0 && (
                    <span className="font-mono text-sm text-[var(--text-muted)] line-through decoration-1">
                      ${kit.listedPrice.toLocaleString()}
                    </span>
                  )}
                  <span className="font-mono text-lg font-bold text-[var(--accent)]">
                    ${kit.trueCost.toLocaleString()}
                  </span>
                  <span className="text-xs text-[var(--text-muted)]">real build cost</span>
                </div>

                {/* Quick specs */}
                <div className="flex items-center gap-3 text-sm">
                  <span className="font-mono text-[var(--text-secondary)]">{kit.panelWatts}W</span>
                  <span className="font-mono text-[var(--text-secondary)]">
                    {kit.storageWh > 0 ? `${(kit.storageWh / 1000).toFixed(1)}kWh` : "—"}
                  </span>
                  <span className="font-mono text-[var(--text-secondary)]">{kit.completeness}%</span>
                </div>

                {/* Footer */}
                <div className="mt-auto pt-3 border-t border-[var(--border)] flex items-center justify-between">
                  <PriceTimestamp observedAt={kit.priceObservedAt} />
                  <span className="text-xs text-[var(--accent)] group-hover:underline">
                    View details &rarr;
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
