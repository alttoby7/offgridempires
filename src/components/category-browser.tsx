"use client";

import { useState, useMemo, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import type { Kit, KitItem } from "@/lib/demo-data";

// ── Category → Role mapping ─────────────────────────────────────────────────

const CATEGORY_ROLES: Record<string, string[]> = {
  batteries: ["Battery"],
  panels: ["Solar Panels"],
  "charge-controllers": ["Charge Controller"],
  inverters: ["Inverter"],
  "power-stations": ["Battery", "Inverter", "Charge Controller"],
  generators: ["Inverter"],
};

const AFFILIATE_TAG = "fidohikes-20";

// ── Types ────────────────────────────────────────────────────────────────────

interface ComponentEntry {
  /** Normalized component name (dedupe key) */
  name: string;
  /** Raw specs string */
  specs: string;
  /** Brand of the component */
  brand: string;
  /** Per-unit wattage (panels), capacity (batteries), or power (inverters) */
  unitValue: number;
  /** Unit label like "W", "Wh", "A" */
  unitLabel: string;
  /** Type tag: "Mono", "Poly", "Portable", "LiFePO4", "MPPT", "PWM", etc. */
  type: string;
  /** Is this included in any kit, or always missing? */
  isIncluded: boolean;
  /** Recommended ASIN for missing components */
  recommendedAsin?: string;
  /** Kits that use this component */
  kits: {
    slug: string;
    name: string;
    brand: string;
    quantity: number;
    totalValue: number; // total panel watts, storage Wh, etc.
    trueCost: number;
    isIncluded: boolean;
    estimatedCost?: number;
  }[];
}

// ── Extraction helpers ──────────────────────────────────────────────────────

function parseWattage(name: string, specs: string): number {
  // Try to extract wattage like "100W", "200W", "350W", "400W"
  const match = (name + " " + specs).match(/(\d+)\s*W\b/i);
  return match ? parseInt(match[1], 10) : 0;
}

function parseCapacity(specs: string): number {
  // Try "100Ah", "200Ah", "1280Wh"
  const whMatch = specs.match(/(\d+)\s*Wh\b/i);
  if (whMatch) return parseInt(whMatch[1], 10);
  const ahMatch = specs.match(/(\d+)\s*Ah\b/i);
  if (ahMatch) return parseInt(ahMatch[1], 10) * 12; // assume 12V
  return 0;
}

function parseType(name: string, specs: string, category: string): string {
  const combined = (name + " " + specs).toLowerCase();
  if (category === "panels") {
    if (combined.includes("portable") || combined.includes("folding")) return "Portable";
    if (combined.includes("mono")) return "Monocrystalline";
    if (combined.includes("poly")) return "Polycrystalline";
    return "Panel";
  }
  if (category === "batteries") {
    if (combined.includes("lifepo4") || combined.includes("lithium")) return "LiFePO4";
    if (combined.includes("agm")) return "AGM";
    return "Battery";
  }
  if (category === "charge-controllers") {
    if (combined.includes("mppt")) return "MPPT";
    if (combined.includes("pwm")) return "PWM";
    return "Controller";
  }
  if (category === "inverters") {
    if (combined.includes("pure sine")) return "Pure Sine Wave";
    if (combined.includes("modified")) return "Modified Sine";
    if (combined.includes("charger")) return "Inverter/Charger";
    return "Inverter";
  }
  return "";
}

function extractBrand(itemName: string, kitBrand: string): string {
  // Try to get brand from component name
  const brands = ["Renogy", "Eco-Worthy", "ECO-WORTHY", "WindyNation", "Jackery", "EcoFlow", "Bluetti", "BLUETTI", "BougeRV", "Victron", "BESTEK", "AIMS", "SOK", "Battle Born", "EG4", "Giandel"];
  for (const b of brands) {
    if (itemName.toLowerCase().startsWith(b.toLowerCase())) return b;
  }
  return kitBrand;
}

function normalizeComponentName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

function getUnitInfo(category: string): { label: string; getter: (name: string, specs: string) => number } {
  switch (category) {
    case "panels":
      return { label: "W", getter: parseWattage };
    case "batteries":
      return { label: "Wh", getter: (_, specs) => parseCapacity(specs) };
    case "inverters":
      return { label: "W", getter: parseWattage };
    case "charge-controllers":
      return { label: "A", getter: (name, specs) => {
        const match = (name + " " + specs).match(/(\d+)\s*A\b/i);
        return match ? parseInt(match[1], 10) : 0;
      }};
    default:
      return { label: "", getter: () => 0 };
  }
}

function getKitTotalValue(kit: Kit, category: string): number {
  switch (category) {
    case "panels": return kit.panelWatts;
    case "batteries": return kit.storageWh;
    case "inverters": return kit.inverterWatts;
    default: return 0;
  }
}

// ── Sort ────────────────────────────────────────────────────────────────────

type SortKey = "value_desc" | "value_asc" | "kits_desc" | "brand" | "type";

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "value_desc", label: "Highest Rated First" },
  { value: "value_asc", label: "Most Affordable First" },
  { value: "kits_desc", label: "Most Popular" },
  { value: "brand", label: "Brand A-Z" },
  { value: "type", label: "Type" },
];

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
  const unitInfo = getUnitInfo(category);

  const sortKey = (searchParams.get("sort") as SortKey) || "value_desc";
  const brandFilter = searchParams.get("brand") || "all";
  const typeFilter = searchParams.get("type") || "all";

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

  // ── Build component entries ─────────────────────────────────────────────
  const components = useMemo(() => {
    const map = new Map<string, ComponentEntry>();

    for (const kit of allKits) {
      const matchingItems = kit.items.filter((i) => roles.includes(i.role));

      for (const item of matchingItems) {
        const normName = normalizeComponentName(item.name);
        const brand = extractBrand(item.name, kit.brand);
        const unitValue = unitInfo.getter(item.name, item.specs);
        const type = parseType(item.name, item.specs, category);

        const existing = map.get(normName);
        const kitEntry = {
          slug: kit.slug,
          name: kit.name,
          brand: kit.brand,
          quantity: item.quantity,
          totalValue: getKitTotalValue(kit, category),
          trueCost: kit.trueCost,
          isIncluded: item.isIncluded,
          estimatedCost: item.estimatedCost,
        };

        if (existing) {
          existing.kits.push(kitEntry);
          // Update isIncluded if any kit includes it
          if (item.isIncluded) existing.isIncluded = true;
        } else {
          map.set(normName, {
            name: item.name,
            specs: item.specs,
            brand,
            unitValue,
            unitLabel: unitInfo.label,
            type,
            isIncluded: item.isIncluded,
            recommendedAsin: item.recommendedAsin,
            kits: [kitEntry],
          });
        }
      }
    }

    return Array.from(map.values());
  }, [allKits, roles, category, unitInfo]);

  // Derive filter options
  const brands = useMemo(() => [...new Set(components.map((c) => c.brand))].sort(), [components]);
  const types = useMemo(() => [...new Set(components.map((c) => c.type).filter(Boolean))].sort(), [components]);

  // Filter
  const filtered = useMemo(() => {
    let result = components;
    if (brandFilter !== "all") result = result.filter((c) => c.brand === brandFilter);
    if (typeFilter !== "all") result = result.filter((c) => c.type === typeFilter);
    return result;
  }, [components, brandFilter, typeFilter]);

  // Sort
  const sorted = useMemo(() => {
    const arr = [...filtered];
    switch (sortKey) {
      case "value_desc": return arr.sort((a, b) => b.unitValue - a.unitValue);
      case "value_asc": return arr.sort((a, b) => a.unitValue - b.unitValue);
      case "kits_desc": return arr.sort((a, b) => b.kits.length - a.kits.length);
      case "brand": return arr.sort((a, b) => a.brand.localeCompare(b.brand));
      case "type": return arr.sort((a, b) => a.type.localeCompare(b.type));
    }
  }, [filtered, sortKey]);

  const includedCount = components.filter((c) => c.isIncluded).length;
  const missingCount = components.filter((c) => !c.isIncluded).length;

  const activeFilters = [
    sortKey !== "value_desc",
    brandFilter !== "all",
    typeFilter !== "all",
  ].filter(Boolean).length;

  return (
    <div>
      {/* Summary */}
      <div className="flex flex-wrap items-center gap-4 mb-6">
        <div className="flex items-center gap-2 rounded border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-1.5">
          <span className="font-mono text-sm font-bold text-[var(--accent)]">{components.length}</span>
          <span className="text-xs text-[var(--text-secondary)]">unique {categoryTitle.toLowerCase()}</span>
        </div>
        {includedCount > 0 && (
          <div className="flex items-center gap-2 rounded border border-[var(--success)]/30 bg-[var(--success)]/5 px-3 py-1.5">
            <span className="font-mono text-sm font-bold text-[var(--success)]">{includedCount}</span>
            <span className="text-xs text-[var(--text-secondary)]">included in kits</span>
          </div>
        )}
        {missingCount > 0 && (
          <div className="flex items-center gap-2 rounded border border-[var(--danger)]/30 bg-[var(--danger)]/5 px-3 py-1.5">
            <span className="font-mono text-sm font-bold text-[var(--danger)]">{missingCount}</span>
            <span className="text-xs text-[var(--text-secondary)]">recommended add-ons</span>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <select
          value={sortKey}
          onChange={(e) => setParam("sort", e.target.value, "value_desc")}
          className="rounded border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-2 text-sm text-[var(--text-primary)] focus:border-[var(--accent)] focus:outline-none"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>

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

        {types.length > 1 && (
          <select
            value={typeFilter}
            onChange={(e) => setParam("type", e.target.value, "all")}
            className={`rounded border px-3 py-2 text-sm focus:border-[var(--accent)] focus:outline-none ${
              typeFilter !== "all"
                ? "border-[var(--accent)]/50 bg-[var(--accent)]/5 text-[var(--accent)]"
                : "border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-primary)]"
            }`}
          >
            <option value="all">All Types</option>
            {types.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        )}

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
          <p className="text-sm text-[var(--text-muted)] mb-2">No components match your filters</p>
          <button
            onClick={() => router.replace(`/categories/${category}`, { scroll: false })}
            className="text-xs text-[var(--accent)] hover:text-[var(--accent-hover)] transition-colors"
          >
            Clear all filters
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {sorted.map((comp, i) => (
            <ComponentCard key={comp.name + i} component={comp} category={category} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Component Card ──────────────────────────────────────────────────────────

function ComponentCard({ component: comp, category }: { component: ComponentEntry; category: string }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={`rounded border overflow-hidden ${
      comp.isIncluded
        ? "border-[var(--border)] bg-[var(--bg-surface)]"
        : "border-[var(--danger)]/20 bg-[var(--danger)]/[0.02]"
    }`}>
      {/* Header */}
      <div className="p-5">
        <div className="flex flex-col sm:flex-row sm:items-start gap-4">
          {/* Left: component info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">
                {comp.brand}
              </span>
              <span className={`text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                comp.isIncluded
                  ? "bg-[var(--success)]/10 text-[var(--success)]"
                  : "bg-[var(--danger)]/10 text-[var(--danger)]"
              }`}>
                {comp.isIncluded ? "Kit Component" : "Recommended Add-on"}
              </span>
            </div>
            <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-1">
              {comp.name}
            </h3>
            {comp.specs && comp.specs !== comp.name && (
              <p className="text-sm text-[var(--text-muted)] line-clamp-2">
                {comp.specs}
              </p>
            )}
          </div>

          {/* Right: key metrics */}
          <div className="flex items-center gap-4 sm:gap-6 shrink-0">
            {comp.unitValue > 0 && (
              <div className="text-center">
                <p className="font-mono text-xl font-bold text-[var(--accent)]">
                  {comp.unitValue.toLocaleString()}
                  <span className="text-sm font-medium text-[var(--text-muted)] ml-0.5">{comp.unitLabel}</span>
                </p>
                <p className="text-[10px] font-medium uppercase tracking-wide text-[var(--text-muted)]">
                  {category === "panels" ? "Per Panel" : category === "batteries" ? "Capacity" : category === "inverters" ? "Output" : "Rating"}
                </p>
              </div>
            )}
            {comp.type && (
              <div className="text-center">
                <p className="text-sm font-semibold text-[var(--text-secondary)]">{comp.type}</p>
                <p className="text-[10px] font-medium uppercase tracking-wide text-[var(--text-muted)]">Type</p>
              </div>
            )}
            <div className="text-center">
              <p className="font-mono text-lg font-bold text-[var(--text-primary)]">{comp.kits.length}</p>
              <p className="text-[10px] font-medium uppercase tracking-wide text-[var(--text-muted)]">
                {comp.kits.length === 1 ? "Kit" : "Kits"}
              </p>
            </div>
          </div>
        </div>

        {/* Affiliate link for missing components */}
        {!comp.isIncluded && comp.recommendedAsin && (
          <a
            href={`https://www.amazon.com/dp/${comp.recommendedAsin}?tag=${AFFILIATE_TAG}`}
            target="_blank"
            rel="noopener noreferrer sponsored"
            className="inline-flex items-center gap-1.5 mt-3 rounded border border-[var(--accent)]/30 bg-[var(--accent)]/10 px-3 py-1.5 text-xs font-medium text-[var(--accent)] hover:bg-[var(--accent)]/20 transition-colors"
          >
            View on Amazon
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" />
            </svg>
          </a>
        )}
      </div>

      {/* Kit list toggle */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 px-5 py-2.5 border-t border-[var(--border)] bg-[var(--bg-primary)] hover:bg-[var(--bg-elevated)] transition-colors cursor-pointer"
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
          className={`transition-transform duration-200 text-[var(--text-muted)] ${expanded ? "rotate-180" : ""}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
        <span className="text-xs font-medium text-[var(--text-muted)]">
          {expanded ? "Hide" : "Show"} {comp.kits.length} kit{comp.kits.length !== 1 ? "s" : ""} {comp.isIncluded ? "using" : "needing"} this component
        </span>
      </button>

      {/* Expanded kit list */}
      {expanded && (
        <div className="border-t border-[var(--border)]">
          {comp.kits.map((kit) => (
            <Link
              key={kit.slug}
              href={`/kits/${kit.slug}`}
              className="group flex items-center justify-between gap-4 px-5 py-3 border-b border-[var(--border)] last:border-b-0 hover:bg-[var(--bg-elevated)] transition-colors"
            >
              <div className="min-w-0">
                <p className="text-xs font-medium text-[var(--text-muted)]">{kit.brand}</p>
                <p className="text-sm font-medium text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors truncate">
                  {kit.name}
                </p>
              </div>
              <div className="flex items-center gap-4 shrink-0">
                {kit.quantity > 1 && (
                  <span className="font-mono text-xs text-[var(--text-muted)]">{kit.quantity}&times;</span>
                )}
                {kit.totalValue > 0 && (
                  <span className="font-mono text-xs text-[var(--text-secondary)]">
                    {kit.totalValue.toLocaleString()}{category === "panels" ? "W" : category === "batteries" ? "Wh" : "W"} total
                  </span>
                )}
                {!kit.isIncluded && kit.estimatedCost && (
                  <span className="font-mono text-xs text-[var(--danger)]">~${kit.estimatedCost.toLocaleString()}</span>
                )}
                <span className="font-mono text-sm font-bold text-[var(--accent)]">
                  ${kit.trueCost.toLocaleString()}
                </span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--text-muted)] group-hover:text-[var(--accent)] transition-colors">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
