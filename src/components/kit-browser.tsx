"use client";

import { useState, useMemo, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import type { Kit } from "@/lib/demo-data";
import { CompletenessBadges } from "@/components/ui/completeness-badges";
import { PriceTimestamp } from "@/components/ui/price-timestamp";
import { TrueCostBar } from "@/components/ui/true-cost-bar";

// ── Sort ────────────────────────────────────────────────────────────────────

type SortKey =
  | "true_cost_asc"
  | "true_cost_desc"
  | "cost_per_wh"
  | "panel_watts"
  | "storage"
  | "completeness";

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "true_cost_asc", label: "Real Build Cost: Low → High" },
  { value: "true_cost_desc", label: "Real Build Cost: High → Low" },
  { value: "cost_per_wh", label: "Cost per Wh" },
  { value: "panel_watts", label: "Panel Watts" },
  { value: "storage", label: "Storage Capacity" },
  { value: "completeness", label: "Completeness" },
];

function sortKits(kits: Kit[], key: SortKey): Kit[] {
  const sorted = [...kits];
  switch (key) {
    case "true_cost_asc":
      return sorted.sort((a, b) => a.trueCost - b.trueCost);
    case "true_cost_desc":
      return sorted.sort((a, b) => b.trueCost - a.trueCost);
    case "cost_per_wh": {
      const parse = (k: Kit) => {
        const n = parseFloat(k.costPerWh.replace("$", ""));
        return isNaN(n) ? Infinity : n;
      };
      return sorted.sort((a, b) => parse(a) - parse(b));
    }
    case "panel_watts":
      return sorted.sort((a, b) => b.panelWatts - a.panelWatts);
    case "storage":
      return sorted.sort((a, b) => b.storageWh - a.storageWh);
    case "completeness":
      return sorted.sort((a, b) => b.completeness - a.completeness);
  }
}

// ── Price Range Buckets ─────────────────────────────────────────────────────

const PRICE_RANGES = [
  { label: "Any Price", min: 0, max: Infinity },
  { label: "Under $1,000", min: 0, max: 999 },
  { label: "$1,000 — $2,500", min: 1000, max: 2500 },
  { label: "$2,500 — $5,000", min: 2500, max: 5000 },
  { label: "$5,000+", min: 5000, max: Infinity },
];

// ── Filter Dropdown ─────────────────────────────────────────────────────────

function FilterDropdown({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  const isActive = value !== options[0].value;
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`appearance-none rounded border px-3 py-1.5 pr-7 text-xs font-medium transition-colors cursor-pointer ${
          isActive
            ? "border-[var(--accent)]/50 bg-[var(--accent)]/10 text-[var(--accent)]"
            : "border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:border-[var(--border-accent)]"
        }`}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <svg
        width="10"
        height="10"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-current"
      >
        <path d="M6 9l6 6 6-6" />
      </svg>
    </div>
  );
}

// ── Kit Card ────────────────────────────────────────────────────────────────

function KitListCard({
  kit,
  isComparing,
  onToggleCompare,
}: {
  kit: Kit;
  isComparing: boolean;
  onToggleCompare: () => void;
}) {
  const hasMissing = kit.missingCost > 0;

  return (
    <div
      className={`group relative flex flex-col rounded bg-[var(--bg-surface)] transition-all duration-200 overflow-hidden ${
        isComparing
          ? "border-2 border-[var(--accent)]/50 shadow-[0_0_12px_rgba(245,158,11,0.08)]"
          : "border border-[var(--border)] hover:border-[var(--border-accent)]"
      }`}
    >
      {/* Compare checkbox */}
      <label className="absolute top-3 right-3 z-10 flex items-center gap-1.5 cursor-pointer">
        <input
          type="checkbox"
          className="sr-only peer"
          checked={isComparing}
          onChange={onToggleCompare}
        />
        <span
          className={`flex h-4 w-4 items-center justify-center rounded-sm border transition-colors ${
            isComparing
              ? "border-[var(--accent)] bg-[var(--accent)]/20"
              : "border-[var(--border)] bg-[var(--bg-primary)] peer-checked:border-[var(--accent)] peer-checked:bg-[var(--accent)]/20"
          }`}
        >
          <svg
            width="10"
            height="10"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`text-[var(--accent)] ${isComparing ? "opacity-100" : "opacity-0"}`}
          >
            <path d="M20 6L9 17l-5-5" />
          </svg>
        </span>
        <span className="text-xs uppercase tracking-wide text-[var(--text-muted)]">
          Compare
        </span>
      </label>

      {/* Completeness bar */}
      <div className="h-1 flex">
        <div className="bg-[var(--accent)]" style={{ width: `${kit.completeness}%` }} />
        <div className="bg-[var(--danger)]/30" style={{ width: `${100 - kit.completeness}%` }} />
      </div>

      <Link href={`/kits/${kit.slug}`} className="p-5 flex-1 flex flex-col gap-3">
        <div className="pr-20">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">
              {kit.brand}
            </span>
            <span className="text-xs text-[var(--text-muted)]">
              via {kit.retailer}
            </span>
          </div>
          <h3 className="text-base font-semibold text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors line-clamp-2">
            {kit.name}
          </h3>
        </div>

        {/* Specs grid */}
        <div className="grid grid-cols-4 gap-1.5">
          <div className="rounded bg-[var(--bg-primary)] px-2 py-1.5 text-center">
            <p className="text-xs text-[var(--text-muted)] uppercase">Panels</p>
            <p className="font-mono text-xs font-semibold text-[var(--text-primary)]">{kit.panelWatts}W</p>
          </div>
          <div className="rounded bg-[var(--bg-primary)] px-2 py-1.5 text-center">
            <p className="text-xs text-[var(--text-muted)] uppercase">Storage</p>
            <p className="font-mono text-xs font-semibold text-[var(--text-primary)]">
              {kit.storageWh > 0 ? `${(kit.storageWh / 1000).toFixed(1)}kWh` : "—"}
            </p>
          </div>
          <div className="rounded bg-[var(--bg-primary)] px-2 py-1.5 text-center">
            <p className="text-xs text-[var(--text-muted)] uppercase">Inverter</p>
            <p className="font-mono text-xs font-semibold text-[var(--text-primary)]">
              {kit.inverterWatts > 0 ? `${kit.inverterWatts}W` : "—"}
            </p>
          </div>
          <div className="rounded bg-[var(--bg-primary)] px-2 py-1.5 text-center">
            <p className="text-xs text-[var(--text-muted)] uppercase">$/Wh</p>
            <p className="font-mono text-xs font-semibold text-[var(--accent)]">{kit.costPerWh}</p>
          </div>
        </div>

        <CompletenessBadges included={kit.included} size="sm" />

        <TrueCostBar
          listedPrice={kit.listedPrice}
          missingCost={kit.missingCost}
          trueCost={kit.trueCost}
          compact
        />

        {/* Price row */}
        <div className="mt-auto pt-3 border-t border-[var(--border)] flex items-end justify-between">
          <div>
            <p className="text-xs font-medium text-[var(--text-muted)] uppercase">
              {hasMissing ? "Advertised" : "Price"}
            </p>
            <p
              className={`font-mono text-lg font-bold ${
                hasMissing
                  ? "text-[var(--text-secondary)] line-through decoration-1"
                  : "text-[var(--text-primary)]"
              }`}
            >
              ${kit.listedPrice.toLocaleString()}
            </p>
          </div>

          {hasMissing && (
            <div className="text-center">
              <p className="text-xs font-medium text-[var(--danger)]/70 uppercase">+ Missing</p>
              <p className="font-mono text-sm font-semibold text-[var(--danger)]/70">
                ~${kit.missingCost.toLocaleString()}
              </p>
            </div>
          )}

          <div className="text-right">
            <p className="text-xs font-medium text-[var(--text-muted)] uppercase">Real Build Cost</p>
            <p className="font-mono text-lg font-bold text-[var(--accent)]">
              ${kit.trueCost.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Timestamp + price change */}
        <div className="flex items-center justify-between">
          <PriceTimestamp observedAt={kit.priceObservedAt} />
          {kit.priceChange !== undefined && kit.priceChange !== 0 && (
            <span
              className={`font-mono text-xs font-semibold ${
                kit.priceChange < 0 ? "text-[var(--success)]" : "text-[var(--danger)]"
              }`}
            >
              {kit.priceChange < 0 ? "▼" : "▲"} ${Math.abs(kit.priceChange)}
            </span>
          )}
        </div>
      </Link>
    </div>
  );
}

// ── Main Component ──────────────────────────────────────────────────────────

export function KitBrowser({ allKits }: { allKits: Kit[] }) {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Derive filter options from data
  const brands = useMemo(
    () => [...new Set(allKits.map((k) => k.brand))].sort(),
    [allKits]
  );
  const chemistries = useMemo(
    () => [...new Set(allKits.map((k) => k.chemistry).filter((c) => c !== "None"))].sort(),
    [allKits]
  );
  const voltages = useMemo(
    () => [...new Set(allKits.map((k) => k.voltage))].sort((a, b) => a - b),
    [allKits]
  );

  // Read state from URL params (with defaults)
  const sortKey = (searchParams.get("sort") as SortKey) || "true_cost_asc";
  const brandFilter = searchParams.get("brand") || "all";
  const chemFilter = searchParams.get("chemistry") || "all";
  const voltageFilter = searchParams.get("voltage") || "all";
  const priceFilter = searchParams.get("price") || "0";
  const completeOnly = searchParams.get("complete") === "1";

  // Compare selection (local state — not in URL to avoid clutter)
  const [compareSet, setCompareSet] = useState<Set<string>>(new Set());

  const toggleCompare = useCallback((slug: string) => {
    setCompareSet((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) {
        next.delete(slug);
      } else if (next.size < 3) {
        next.add(slug);
      }
      return next;
    });
  }, []);

  // Update URL params
  const setParam = useCallback(
    (key: string, value: string, defaultValue: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value === defaultValue) {
        params.delete(key);
      } else {
        params.set(key, value);
      }
      const qs = params.toString();
      router.replace(`/kits${qs ? `?${qs}` : ""}`, { scroll: false });
    },
    [searchParams, router]
  );

  // Filter + sort
  const filteredKits = useMemo(() => {
    let kits = allKits;

    if (brandFilter !== "all") {
      kits = kits.filter((k) => k.brand === brandFilter);
    }
    if (chemFilter !== "all") {
      kits = kits.filter((k) => k.chemistry === chemFilter);
    }
    if (voltageFilter !== "all") {
      kits = kits.filter((k) => k.voltage === Number(voltageFilter));
    }
    if (priceFilter !== "0") {
      const range = PRICE_RANGES[Number(priceFilter)];
      if (range) {
        kits = kits.filter((k) => k.trueCost >= range.min && k.trueCost <= range.max);
      }
    }
    if (completeOnly) {
      kits = kits.filter((k) => k.completeness === 100);
    }

    return sortKits(kits, sortKey);
  }, [allKits, sortKey, brandFilter, chemFilter, voltageFilter, priceFilter, completeOnly]);

  const activeFilterCount = [
    brandFilter !== "all",
    chemFilter !== "all",
    voltageFilter !== "all",
    priceFilter !== "0",
    completeOnly,
  ].filter(Boolean).length;

  return (
    <>
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Solar Kits</h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            {allKits.length} kits compared with true total cost
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-[var(--text-muted)] uppercase">Sort:</span>
          <select
            value={sortKey}
            onChange={(e) => setParam("sort", e.target.value, "true_cost_asc")}
            className="rounded border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-1.5 text-xs text-[var(--text-secondary)] focus:border-[var(--accent)] focus:outline-none"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap gap-2 mb-6 p-3 rounded border border-[var(--border)] bg-[var(--bg-surface)]">
        <FilterDropdown
          label="Price"
          value={priceFilter}
          options={PRICE_RANGES.map((r, i) => ({ value: String(i), label: r.label }))}
          onChange={(v) => setParam("price", v, "0")}
        />
        <FilterDropdown
          label="Chemistry"
          value={chemFilter}
          options={[
            { value: "all", label: "Any Chemistry" },
            ...chemistries.map((c) => ({ value: c, label: c })),
          ]}
          onChange={(v) => setParam("chemistry", v, "all")}
        />
        <FilterDropdown
          label="Brand"
          value={brandFilter}
          options={[
            { value: "all", label: "Any Brand" },
            ...brands.map((b) => ({ value: b, label: b })),
          ]}
          onChange={(v) => setParam("brand", v, "all")}
        />
        <FilterDropdown
          label="Voltage"
          value={voltageFilter}
          options={[
            { value: "all", label: "Any Voltage" },
            ...voltages.map((v) => ({ value: String(v), label: `${v}V` })),
          ]}
          onChange={(v) => setParam("voltage", v, "all")}
        />

        <div className="flex-1" />

        {/* Clear filters */}
        {activeFilterCount > 0 && (
          <button
            onClick={() => router.replace("/kits", { scroll: false })}
            className="text-xs uppercase tracking-wide text-[var(--accent)] hover:text-[var(--accent-hover)] transition-colors"
          >
            Clear {activeFilterCount} filter{activeFilterCount > 1 ? "s" : ""}
          </button>
        )}

        {/* Complete only toggle */}
        <label className="inline-flex items-center gap-1.5 text-xs text-[var(--text-muted)] cursor-pointer">
          <input
            type="checkbox"
            className="sr-only peer"
            checked={completeOnly}
            onChange={(e) => setParam("complete", e.target.checked ? "1" : "0", "0")}
          />
          <span className="flex h-3.5 w-3.5 items-center justify-center rounded-sm border border-[var(--border)] bg-[var(--bg-primary)] peer-checked:border-[var(--accent)] peer-checked:bg-[var(--accent)]/20 transition-colors">
            {completeOnly && (
              <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--accent)]">
                <path d="M20 6L9 17l-5-5" />
              </svg>
            )}
          </span>
          <span className="text-xs uppercase tracking-wide">Complete kits only</span>
        </label>
      </div>

      {/* Results count + compare bar */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">
          Showing {filteredKits.length} of {allKits.length} kits
        </p>
        <Link
          href={
            compareSet.size > 0
              ? `/compare?kits=${[...compareSet].join(",")}`
              : "/compare"
          }
          className={`inline-flex items-center gap-1.5 rounded border px-3 py-1.5 text-xs font-medium transition-colors ${
            compareSet.size > 0
              ? "border-[var(--accent)]/50 bg-[var(--accent)]/10 text-[var(--accent)] hover:bg-[var(--accent)]/20"
              : "border-[var(--accent)]/30 bg-[var(--accent)]/5 text-[var(--accent)] hover:bg-[var(--accent)]/10"
          }`}
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="3" width="7" height="7" />
            <rect x="14" y="3" width="7" height="7" />
            <rect x="14" y="14" width="7" height="7" />
            <rect x="3" y="14" width="7" height="7" />
          </svg>
          Compare Selected ({compareSet.size})
          {compareSet.size >= 3 && (
            <span className="text-xs text-[var(--text-muted)]">max</span>
          )}
        </Link>
      </div>

      {/* Kit grid */}
      {filteredKits.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredKits.map((kit) => (
            <KitListCard
              key={kit.id}
              kit={kit}
              isComparing={compareSet.has(kit.slug)}
              onToggleCompare={() => toggleCompare(kit.slug)}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 rounded border border-dashed border-[var(--border)] bg-[var(--bg-surface)]">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-[var(--text-muted)] mb-3"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <p className="text-sm text-[var(--text-muted)]">No kits match your filters</p>
          <button
            onClick={() => router.replace("/kits", { scroll: false })}
            className="mt-2 text-xs text-[var(--accent)] hover:text-[var(--accent-hover)] transition-colors"
          >
            Clear all filters
          </button>
        </div>
      )}
    </>
  );
}
