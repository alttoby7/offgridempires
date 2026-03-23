import type { Metadata } from "next";
import Link from "next/link";
import type { Kit } from "@/lib/demo-data";
import { getKits } from "@/lib/get-kits";
import { CompletenessBadges } from "@/components/ui/completeness-badges";
import { PriceTimestamp } from "@/components/ui/price-timestamp";
import { TrueCostBar } from "@/components/ui/true-cost-bar";

export const metadata: Metadata = {
  title: "Compare Solar Kits",
  description:
    "Side-by-side comparison of off-grid solar kits with normalized specs and true total cost.",
  alternates: { canonical: "/compare" },
  openGraph: {
    title: "Compare Solar Kits | OffGridEmpire",
    description:
      "Side-by-side comparison of off-grid solar kits with normalized specs and true total cost.",
    url: "/compare",
  },
};

// Demo: 3 pre-selected kits
const allKits = getKits();
const compareKits = [allKits[0], allKits[2], allKits[4]];

// --- Verdict system ---
interface Verdict {
  label: string;
  color: string;
  borderColor: string;
}

function computeVerdicts(kits: Kit[]): (Verdict | null)[] {
  const verdicts: (Verdict | null)[] = kits.map(() => null);

  // Lowest real build cost
  let lowestCostIdx = 0;
  kits.forEach((k, i) => {
    if (k.trueCost < kits[lowestCostIdx].trueCost) lowestCostIdx = i;
  });
  verdicts[lowestCostIdx] = {
    label: "Best True Value",
    color: "text-[var(--accent)]",
    borderColor: "border-[var(--accent)]/40",
  };

  // Most complete
  let mostCompleteIdx = 0;
  kits.forEach((k, i) => {
    if (k.completeness > kits[mostCompleteIdx].completeness) mostCompleteIdx = i;
  });
  if (mostCompleteIdx !== lowestCostIdx) {
    verdicts[mostCompleteIdx] = {
      label: "Most Complete",
      color: "text-[var(--success)]",
      borderColor: "border-[var(--success)]/40",
    };
  }

  // Best storage capacity (if not already tagged)
  let bestStorageIdx = 0;
  kits.forEach((k, i) => {
    if (k.storageWh > kits[bestStorageIdx].storageWh) bestStorageIdx = i;
  });
  if (!verdicts[bestStorageIdx]) {
    verdicts[bestStorageIdx] = {
      label: "Most Storage",
      color: "text-[var(--text-secondary)]",
      borderColor: "border-[var(--border)]",
    };
  }

  return verdicts;
}

const verdicts = computeVerdicts(compareKits);

// --- Section summaries ---
function pricingSummary(kits: Kit[]): string {
  const costs = kits.map((k) => k.trueCost);
  const minCost = Math.min(...costs);
  const maxCost = Math.max(...costs);
  const cheapestKit = kits[costs.indexOf(minCost)];
  const diff = maxCost - minCost;
  return `${cheapestKit.brand} is $${diff.toLocaleString()} cheaper to build than the most expensive option.`;
}

function specsSummary(kits: Kit[]): string {
  const bestStorage = kits.reduce((a, b) => (a.storageWh > b.storageWh ? a : b));
  const bestPanels = kits.reduce((a, b) => (a.panelWatts > b.panelWatts ? a : b));
  if (bestStorage.slug === bestPanels.slug) {
    return `${bestStorage.brand} leads in both solar wattage and battery storage.`;
  }
  return `${bestPanels.brand} has the most solar. ${bestStorage.brand} has the most storage.`;
}

function componentsSummary(kits: Kit[]): string {
  const complete = kits.filter((k) => k.completeness === 100);
  if (complete.length === kits.length) return "All kits include every required component.";
  if (complete.length > 0) {
    return `Only ${complete.map((k) => k.brand).join(" and ")} include${complete.length === 1 ? "s" : ""} all components. Others require additional purchases.`;
  }
  return "No kit is fully complete. All require additional component purchases.";
}

// --- Row types ---
type CellValue = string | number | boolean | null;

interface CompareRow {
  label: string;
  values: CellValue[];
  type: "text" | "number" | "cost" | "boolean";
  higherIsBetter?: boolean;
  unit?: string;
}

function getBest(values: CellValue[], higherIsBetter: boolean): number {
  let bestIdx = -1;
  let bestVal = higherIsBetter ? -Infinity : Infinity;
  values.forEach((v, i) => {
    if (typeof v !== "number" || v === 0) return;
    if (higherIsBetter ? v > bestVal : v < bestVal) { bestVal = v; bestIdx = i; }
  });
  return bestIdx;
}

function getWorst(values: CellValue[], higherIsBetter: boolean): number {
  let worstIdx = -1;
  let worstVal = higherIsBetter ? Infinity : -Infinity;
  values.forEach((v, i) => {
    if (typeof v !== "number" || v === 0) return;
    if (higherIsBetter ? v < worstVal : v > worstVal) { worstVal = v; worstIdx = i; }
  });
  return worstIdx;
}

// Only color decisive rows (pricing + completeness), not every spec row
const decisiveRows = new Set(["Advertised Price", "Real Build Cost", "Hidden Cost to Finish", "Completeness"]);

const sections: { title: string; summary: string; rows: CompareRow[] }[] = [
  {
    title: "Pricing",
    summary: pricingSummary(compareKits),
    rows: [
      { label: "Advertised Price", values: compareKits.map((k) => k.listedPrice), type: "cost", higherIsBetter: false },
      { label: "Hidden Cost to Finish", values: compareKits.map((k) => k.missingCost), type: "cost", higherIsBetter: false },
      { label: "Real Build Cost", values: compareKits.map((k) => k.trueCost), type: "cost", higherIsBetter: false },
      { label: "Cost / Wh", values: compareKits.map((k) => k.costPerWh), type: "text" },
    ],
  },
  {
    title: "Specifications",
    summary: specsSummary(compareKits),
    rows: [
      { label: "Completeness", values: compareKits.map((k) => k.completeness), type: "number", higherIsBetter: true, unit: "%" },
      { label: "Solar Panels", values: compareKits.map((k) => k.panelWatts), type: "number", higherIsBetter: true, unit: "W" },
      { label: "Battery Storage", values: compareKits.map((k) => k.storageWh), type: "number", higherIsBetter: true, unit: "Wh" },
      { label: "Inverter Output", values: compareKits.map((k) => k.inverterWatts), type: "number", higherIsBetter: true, unit: "W" },
      { label: "System Voltage", values: compareKits.map((k) => `${k.voltage}V`), type: "text" },
      { label: "Chemistry", values: compareKits.map((k) => k.chemistry), type: "text" },
    ],
  },
  {
    title: "Included Components",
    summary: componentsSummary(compareKits),
    rows: [
      { label: "Battery", values: compareKits.map((k) => k.included.battery), type: "boolean" },
      { label: "Inverter", values: compareKits.map((k) => k.included.inverter), type: "boolean" },
      { label: "Charge Controller", values: compareKits.map((k) => k.included.controller), type: "boolean" },
      { label: "Mounting", values: compareKits.map((k) => k.included.mounting), type: "boolean" },
      { label: "Monitoring", values: compareKits.map((k) => k.included.monitoring), type: "boolean" },
    ],
  },
];

function CellContent({ value, row, colIdx }: { value: CellValue; row: CompareRow; colIdx: number }) {
  const isDecisive = decisiveRows.has(row.label);
  const bestIdx = (row.type === "number" || row.type === "cost") ? getBest(row.values, row.higherIsBetter ?? false) : -1;
  const worstIdx = (row.type === "number" || row.type === "cost") ? getWorst(row.values, row.higherIsBetter ?? false) : -1;
  const isBest = isDecisive && colIdx === bestIdx && bestIdx !== worstIdx;
  const isWorst = isDecisive && colIdx === worstIdx && bestIdx !== worstIdx;

  if (row.type === "boolean") {
    return value ? (
      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--success)]/15 mx-auto">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--success)]"><path d="M20 6L9 17l-5-5" /></svg>
      </span>
    ) : (
      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--danger)]/15 mx-auto">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--danger)]"><path d="M18 6L6 18M6 6l12 12" /></svg>
      </span>
    );
  }

  if (row.type === "cost") {
    const n = value as number;
    return (
      <span className={`font-mono text-sm font-semibold ${isBest ? "text-[var(--success)]" : isWorst ? "text-[var(--danger)]/80" : "text-[var(--text-primary)]"}`}>
        {n === 0 ? "$0" : `$${n.toLocaleString()}`}
      </span>
    );
  }

  if (row.type === "number") {
    const n = value as number;
    return (
      <span className={`font-mono text-sm font-semibold ${isBest ? "text-[var(--success)]" : isWorst ? "text-[var(--danger)]/80" : "text-[var(--text-primary)]"}`}>
        {n === 0 ? "—" : `${n.toLocaleString()}${row.unit ?? ""}`}
      </span>
    );
  }

  return <span className="text-sm text-[var(--text-primary)]">{value === null || value === "" ? "—" : String(value)}</span>;
}

export default function ComparePage() {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-[var(--text-muted)] mb-6">
        <Link href="/" className="hover:text-[var(--accent)] transition-colors">Home</Link>
        <span>/</span>
        <span className="text-[var(--text-secondary)]">Compare</span>
      </nav>

      <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
        Side-by-Side Comparison
      </h1>
      <p className="text-sm text-[var(--text-muted)] mb-8">
        Normalized specs, real build cost, and component coverage
      </p>

      {/* ============ DESKTOP LAYOUT ============ */}
      <div className="hidden lg:block">
        {/* Kit header cards with verdict badges */}
        <div className="grid grid-cols-4 gap-0 mb-0">
          <div /> {/* Row label spacer */}
          {compareKits.map((kit, i) => {
            const verdict = verdicts[i];
            return (
              <div
                key={kit.id}
                className={`rounded-t border border-b-0 bg-[var(--bg-surface)] p-4 space-y-3 ${verdict ? verdict.borderColor : "border-[var(--border)]"}`}
              >
                {/* Verdict badge */}
                {verdict && (
                  <div className={`inline-flex items-center gap-1.5 rounded-sm border px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-wider ${verdict.color} ${verdict.borderColor} bg-[var(--bg-primary)]`}>
                    {verdict.label}
                  </div>
                )}

                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-mono text-[10px] text-[var(--text-muted)] uppercase">{kit.brand}</span>
                    <Link href={`/kits/${kit.slug}`} className="block text-sm font-semibold text-[var(--text-primary)] hover:text-[var(--accent)] transition-colors line-clamp-2 mt-0.5">
                      {kit.name}
                    </Link>
                  </div>
                  <button className="text-[var(--text-muted)] hover:text-[var(--danger)] transition-colors p-1" title="Remove">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
                  </button>
                </div>

                <TrueCostBar listedPrice={kit.listedPrice} missingCost={kit.missingCost} trueCost={kit.trueCost} compact />

                <div className="flex items-baseline justify-between">
                  <div>
                    <p className="font-mono text-[9px] text-[var(--text-muted)] uppercase">Real Build Cost</p>
                    <p className="font-mono text-lg font-bold text-[var(--accent)]">${kit.trueCost.toLocaleString()}</p>
                  </div>
                  <PriceTimestamp observedAt={kit.priceObservedAt} />
                </div>

                <CompletenessBadges included={kit.included} size="sm" />

                <a href="#" className="flex items-center justify-center gap-1.5 w-full rounded bg-[var(--accent)] py-2 text-xs font-bold text-[var(--bg-primary)] hover:bg-[var(--accent-hover)] transition-colors">
                  View on {kit.retailer}
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" /></svg>
                </a>
              </div>
            );
          })}
        </div>

        {/* Comparison table with section summaries */}
        <div className="rounded-b border border-[var(--border)] bg-[var(--bg-surface)] overflow-hidden">
          {sections.map((section) => (
            <div key={section.title}>
              {/* Section header + summary */}
              <div className="bg-[var(--bg-secondary)] border-b border-[var(--border)] px-4 py-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--text-muted)]">
                    {section.title}
                  </span>
                  <span className="text-xs text-[var(--text-secondary)] italic">
                    {section.summary}
                  </span>
                </div>
              </div>

              {/* Rows */}
              {section.rows.map((row, ri) => (
                <div
                  key={row.label}
                  className={`grid grid-cols-4 gap-0 border-b border-[var(--border)] last:border-b-0 ${ri % 2 === 1 ? "bg-[var(--bg-primary)]/30" : ""}`}
                >
                  <div className="px-4 py-3 flex items-center">
                    <span className="font-mono text-xs text-[var(--text-muted)]">{row.label}</span>
                  </div>
                  {row.values.map((val, ci) => (
                    <div key={ci} className="px-4 py-3 flex items-center justify-center border-l border-[var(--border)]">
                      <CellContent value={val} row={row} colIdx={ci} />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Bottom CTAs — repeated after evidence */}
        <div className="grid grid-cols-4 gap-0 mt-0">
          <div /> {/* spacer */}
          {compareKits.map((kit, i) => {
            const verdict = verdicts[i];
            return (
              <div key={kit.id} className={`border border-t-0 bg-[var(--bg-surface)] p-3 rounded-b ${verdict ? verdict.borderColor : "border-[var(--border)]"}`}>
                {verdict && (
                  <p className={`font-mono text-[10px] font-bold uppercase tracking-wider mb-2 ${verdict.color}`}>
                    {verdict.label}
                  </p>
                )}
                <a href="#" className={`flex items-center justify-center gap-1.5 w-full rounded py-2.5 text-xs font-bold transition-colors ${
                  i === 0
                    ? "bg-[var(--accent)] text-[var(--bg-primary)] hover:bg-[var(--accent-hover)]"
                    : "border border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--border-accent)] hover:text-[var(--accent)]"
                }`}>
                  View on {kit.retailer}
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" /></svg>
                </a>
              </div>
            );
          })}
        </div>
      </div>

      {/* ============ MOBILE LAYOUT: Baseline + Deltas ============ */}
      <div className="lg:hidden space-y-6">
        {/* Pin baseline */}
        <div className="rounded border border-[var(--accent)]/30 bg-[var(--bg-surface)] p-4">
          <p className="font-mono text-[10px] uppercase tracking-wider text-[var(--accent)] mb-2">
            Baseline Kit
          </p>
          <p className="text-sm font-semibold text-[var(--text-primary)]">{compareKits[0].name}</p>
          <div className="flex items-baseline gap-3 mt-2">
            <span className="font-mono text-lg font-bold text-[var(--accent)]">${compareKits[0].trueCost.toLocaleString()}</span>
            <span className="font-mono text-xs text-[var(--text-muted)]">real build cost</span>
          </div>
          <div className="flex items-center gap-3 mt-2">
            <span className="font-mono text-xs text-[var(--text-secondary)]">{compareKits[0].panelWatts}W solar</span>
            <span className="font-mono text-xs text-[var(--text-secondary)]">{compareKits[0].storageWh > 0 ? `${(compareKits[0].storageWh / 1000).toFixed(1)}kWh` : "No storage"}</span>
            <span className="font-mono text-xs text-[var(--text-secondary)]">{compareKits[0].completeness}% complete</span>
          </div>
        </div>

        {/* Delta cards for kits 2 and 3 */}
        {compareKits.slice(1).map((kit, i) => {
          const baseline = compareKits[0];
          const costDiff = kit.trueCost - baseline.trueCost;
          const storageDiff = kit.storageWh - baseline.storageWh;
          const wattDiff = kit.panelWatts - baseline.panelWatts;
          const completeDiff = kit.completeness - baseline.completeness;
          const verdict = verdicts[i + 1];

          function DeltaValue({ diff, unit, lowerBetter }: { diff: number; unit: string; lowerBetter?: boolean }) {
            const isGood = lowerBetter ? diff < 0 : diff > 0;
            const isBad = lowerBetter ? diff > 0 : diff < 0;
            if (diff === 0) return <span className="font-mono text-xs text-[var(--text-muted)]">Same</span>;
            return (
              <span className={`font-mono text-xs font-semibold ${isGood ? "text-[var(--success)]" : isBad ? "text-[var(--danger)]" : "text-[var(--text-primary)]"}`}>
                {diff > 0 ? "+" : ""}{diff.toLocaleString()}{unit}
              </span>
            );
          }

          return (
            <div key={kit.id} className={`rounded border bg-[var(--bg-surface)] p-4 space-y-3 ${verdict ? verdict.borderColor : "border-[var(--border)]"}`}>
              {verdict && (
                <span className={`inline-flex items-center rounded-sm border px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider ${verdict.color} ${verdict.borderColor} bg-[var(--bg-primary)]`}>
                  {verdict.label}
                </span>
              )}

              <div>
                <span className="font-mono text-[10px] text-[var(--text-muted)] uppercase">{kit.brand}</span>
                <Link href={`/kits/${kit.slug}`} className="block text-sm font-semibold text-[var(--text-primary)] hover:text-[var(--accent)] transition-colors mt-0.5">
                  {kit.name}
                </Link>
              </div>

              {/* Delta grid */}
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded bg-[var(--bg-primary)] px-3 py-2">
                  <p className="font-mono text-[9px] text-[var(--text-muted)] uppercase">Real Build Cost</p>
                  <p className="font-mono text-sm font-bold text-[var(--accent)]">${kit.trueCost.toLocaleString()}</p>
                  <DeltaValue diff={costDiff} unit="" lowerBetter />
                </div>
                <div className="rounded bg-[var(--bg-primary)] px-3 py-2">
                  <p className="font-mono text-[9px] text-[var(--text-muted)] uppercase">Completeness</p>
                  <p className="font-mono text-sm font-semibold text-[var(--text-primary)]">{kit.completeness}%</p>
                  <DeltaValue diff={completeDiff} unit="%" />
                </div>
                <div className="rounded bg-[var(--bg-primary)] px-3 py-2">
                  <p className="font-mono text-[9px] text-[var(--text-muted)] uppercase">Storage</p>
                  <p className="font-mono text-sm font-semibold text-[var(--text-primary)]">{kit.storageWh > 0 ? `${(kit.storageWh / 1000).toFixed(1)}kWh` : "—"}</p>
                  <DeltaValue diff={storageDiff} unit="Wh" />
                </div>
                <div className="rounded bg-[var(--bg-primary)] px-3 py-2">
                  <p className="font-mono text-[9px] text-[var(--text-muted)] uppercase">Solar</p>
                  <p className="font-mono text-sm font-semibold text-[var(--text-primary)]">{kit.panelWatts}W</p>
                  <DeltaValue diff={wattDiff} unit="W" />
                </div>
              </div>

              {/* Missing components callout */}
              {kit.missingCost > 0 && (
                <div className="rounded bg-[var(--danger)]/5 border border-[var(--danger)]/15 px-3 py-2">
                  <span className="font-mono text-xs text-[var(--danger)]">
                    +${kit.missingCost.toLocaleString()} in missing parts needed
                  </span>
                </div>
              )}

              <a href="#" className="flex items-center justify-center gap-1.5 w-full rounded border border-[var(--border)] py-2 text-xs font-medium text-[var(--text-secondary)] hover:border-[var(--border-accent)] hover:text-[var(--accent)] transition-colors">
                View on {kit.retailer}
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" /></svg>
              </a>
            </div>
          );
        })}
      </div>

      {/* Methodology note */}
      <div className="mt-8 text-center space-y-2">
        <p className="text-xs text-[var(--text-muted)]">
          Green = best in category for decisive metrics. Missing component costs are estimates of required parts only.
        </p>
        <Link href="/methodology" className="inline-flex items-center gap-1 text-xs text-[var(--accent)] hover:text-[var(--accent-hover)] transition-colors">
          How we calculate and compare
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" /></svg>
        </Link>
      </div>
    </div>
  );
}
