import Link from "next/link";
import type { Kit } from "@/lib/demo-data";
import { getSimilarKits } from "@/lib/similar-kits";

/*
 * KitEvidence — replaces the templated 8-block prose with structured evidence
 * modules. Same underlying logic as the old KitProseBlocks, rendered as
 * data/badges/chips. Where a kit has no unique evidence beyond specs, the
 * corresponding module simply does not render — no boilerplate filler.
 */

const USE_CASE_LABELS: Record<string, string> = {
  rv: "RV / van",
  cabin: "Cabin",
  shed: "Shed",
  emergency: "Emergency",
  homestead: "Homestead",
  boat: "Boat",
};

const ROLE_LABELS: Record<string, string> = {
  panels: "Panels",
  controller: "Charge controller",
  battery: "Battery",
  inverter: "Inverter",
  wiring: "Wiring",
  mounting: "Mounting",
  monitoring: "Monitoring",
};

function parseCurrency(v: string): number {
  const n = parseFloat(v.replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function cohort(kit: Kit, all: Kit[]): Kit[] {
  if (!kit.systemType) return [];
  return all.filter((k) => k.slug !== kit.slug && k.systemType === kit.systemType);
}

function wattBand(kit: Kit, peers: Kit[]): Kit[] {
  if (kit.panelWatts === 0) return peers;
  const lo = kit.panelWatts / 1.75;
  const hi = kit.panelWatts * 1.75;
  const band = peers.filter((k) => k.panelWatts >= lo && k.panelWatts <= hi);
  return band.length >= 4 ? band : peers;
}

function percentile(value: number, values: number[]): number {
  const sorted = [...values].filter((v) => Number.isFinite(v) && v > 0).sort((a, b) => a - b);
  if (sorted.length === 0) return 50;
  let below = 0;
  for (const v of sorted) if (v < value) below += 1;
  return Math.round((below / sorted.length) * 100);
}

function severity(delta: number, pct: number): "negligible" | "moderate" | "severe" {
  if (delta < 50 || pct < 5) return "negligible";
  if (delta < 250 && pct < 20) return "moderate";
  return "severe";
}

function findAlternatives(kit: Kit, all: Kit[]) {
  const peers = getSimilarKits(kit, all, 12);
  const cheaper = peers
    .filter((p) => p.trueCost < kit.trueCost && p.completeness >= kit.completeness - 10)
    .sort((a, b) => a.trueCost - b.trueCost)[0];
  const moreComplete = peers
    .filter((p) => p.completeness > kit.completeness)
    .sort((a, b) => b.completeness - a.completeness || a.trueCost - b.trueCost)[0];
  const kitCpw = parseCurrency(kit.costPerW);
  const betterValue = peers
    .map((p) => ({ p, cpw: parseCurrency(p.costPerW) }))
    .filter(({ cpw }) => cpw > 0 && kitCpw > 0 && cpw < kitCpw)
    .sort((a, b) => a.cpw - b.cpw)
    .map(({ p }) => p)[0];
  return { cheaper, moreComplete, betterValue };
}

/* ── Sub-components ───────────────────────────────────────────────────────── */

function ModuleHeader({ label, hint }: { label: string; hint?: string }) {
  return (
    <div className="flex items-baseline justify-between mb-3">
      <span className="eyebrow">{label}</span>
      {hint && <span className="text-[10px] text-[var(--ink-muted)] italic">{hint}</span>}
    </div>
  );
}

function PercentileBar({ pct, label }: { pct: number; label: string }) {
  const tone =
    pct <= 25 ? "var(--success)" : pct <= 50 ? "var(--accent)" : pct <= 75 ? "var(--ink-muted)" : "var(--signal-red)";
  return (
    <div className="space-y-1">
      <div className="relative h-1.5 rounded-full bg-[var(--bg-elevated)] overflow-hidden">
        <div
          className="absolute top-0 left-0 h-full rounded-full"
          style={{ width: `${pct}%`, background: tone }}
        />
        <div
          className="absolute top-[-2px] h-[10px] w-[2px]"
          style={{ left: `${pct}%`, background: "var(--ink)" }}
        />
      </div>
      <p className="text-xs text-[var(--ink-soft)]">
        <span className="tabular font-semibold">{pct}<sup>th</sup> percentile</span> {label}
      </p>
    </div>
  );
}

/* ── Main ─────────────────────────────────────────────────────────────────── */

export function KitEvidence({ kit, allKits }: { kit: Kit; allKits: Kit[] }) {
  const peers = cohort(kit, allKits);
  const band = wattBand(kit, peers);

  // Cost verdict
  const delta = kit.missingCost;
  const pct = kit.listedPrice > 0 ? Math.round((delta / kit.listedPrice) * 100) : 0;
  const sev = severity(delta, pct);

  // Completeness
  const missingItems = kit.items.filter((i) => !i.isIncluded);
  const missingRoles = Array.from(new Set(missingItems.map((i) => ROLE_LABELS[i.role] ?? i.role)));

  // Value
  const kitCpw = parseCurrency(kit.costPerW);
  const kitCpwh = parseCurrency(kit.costPerWh);
  const peerCpws = band.map((k) => parseCurrency(k.costPerW)).filter((v) => v > 0);
  const peerCpwhs = band.map((k) => parseCurrency(k.costPerWh)).filter((v) => v > 0);
  const cpwPct = kitCpw > 0 && peerCpws.length >= 4 ? percentile(kitCpw, peerCpws) : null;
  const cpwhPct = kitCpwh > 0 && peerCpwhs.length >= 4 ? percentile(kitCpwh, peerCpwhs) : null;

  // Deal status
  const history = kit.priceHistory ?? [];
  const prices = history.map((p) => p.priceCents).filter((c) => c > 0);
  let dealBadge: { label: string; tone: "good" | "ok" | "bad" | "neutral" } | null = null;
  if (prices.length >= 5) {
    const min = Math.min(...prices);
    const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
    const nowCents = kit.listedPrice * 100;
    const pctOverMin = min > 0 ? Math.round(((nowCents - min) / min) * 100) : 0;
    if (pctOverMin <= 3) dealBadge = { label: "At or near tracked low", tone: "good" };
    else if (nowCents < avg) dealBadge = { label: "Below tracked average", tone: "ok" };
    else if (pctOverMin >= 15) dealBadge = { label: `${pctOverMin}% above tracked low`, tone: "bad" };
    else dealBadge = { label: "Near average", tone: "neutral" };
  }

  // Install complexity factors
  const complexity: string[] = [];
  if (missingRoles.length >= 3) complexity.push(`${missingRoles.length} parts to source`);
  if (kit.voltage >= 48) complexity.push("48V wiring + breakers");
  else if (kit.voltage <= 12 && kit.panelWatts >= 600) complexity.push("12V at high current");
  if (kit.included && !kit.included.mounting) complexity.push("Mount hardware separate");
  if (kit.included && !kit.included.wiring) complexity.push("Cables / fuses separate");
  if (kit.systemType === "whole-home") complexity.push("Licensed electrician");

  // Alternatives
  const alt = findAlternatives(kit, allKits);
  const altItems: { label: string; kit: Kit; reason: string }[] = [];
  if (alt.cheaper)
    altItems.push({
      label: "Cheaper in cohort",
      kit: alt.cheaper,
      reason: `$${alt.cheaper.trueCost.toLocaleString()} real build cost`,
    });
  if (alt.moreComplete)
    altItems.push({
      label: "More complete",
      kit: alt.moreComplete,
      reason: `${alt.moreComplete.completeness}% complete vs ${kit.completeness}%`,
    });
  if (alt.betterValue)
    altItems.push({
      label: "Better $/W",
      kit: alt.betterValue,
      reason: `${alt.betterValue.costPerW}/W`,
    });

  // Use cases excellent / poor
  const fitGood = Object.entries(kit.useCaseRatings)
    .filter(([, r]) => r === "excellent" || r === "good")
    .map(([k]) => USE_CASE_LABELS[k] ?? k);
  const fitPoor = Object.entries(kit.useCaseRatings)
    .filter(([, r]) => r === "poor")
    .map(([k]) => USE_CASE_LABELS[k] ?? k);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      {/* Cost verdict */}
      <div className="rounded-sm border border-[var(--rule)] bg-[var(--bg-surface)] p-5">
        <ModuleHeader label="Cost verdict" />
        <div className="flex items-baseline gap-3">
          <span
            className={`tabular text-3xl font-display ${
              sev === "severe" ? "text-[var(--signal-red)]" : sev === "moderate" ? "text-[var(--accent)]" : "text-[var(--success)]"
            }`}
          >
            {sev === "negligible" ? "—" : `+$${delta.toLocaleString()}`}
          </span>
          <span className="text-sm text-[var(--ink-soft)]">
            {sev === "negligible"
              ? "Advertised price ≈ real build cost"
              : sev === "moderate"
                ? `${pct}% gap to plan for`
                : `${pct}% gap — sticker is misleading`}
          </span>
        </div>
        <div className="mt-3 flex items-center gap-3 text-xs text-[var(--ink-muted)]">
          <span className="tabular">${kit.listedPrice.toLocaleString()} advertised</span>
          <span>→</span>
          <span className="tabular text-[var(--ink)] font-semibold">${kit.trueCost.toLocaleString()} real</span>
        </div>
      </div>

      {/* Completeness */}
      <div className="rounded-sm border border-[var(--rule)] bg-[var(--bg-surface)] p-5">
        <ModuleHeader label="Completeness" hint={`${kit.completeness}%`} />
        {missingRoles.length === 0 ? (
          <p className="text-sm text-[var(--success)] font-display italic">
            Complete as sold — every standard role ships in the box.
          </p>
        ) : (
          <>
            <p className="text-xs text-[var(--ink-soft)] mb-2">Missing required parts:</p>
            <div className="flex flex-wrap gap-1.5">
              {missingRoles.map((r) => (
                <span
                  key={r}
                  className="inline-flex items-center gap-1 rounded-sm border border-[var(--signal-red)]/30 bg-[var(--signal-red)]/[0.06] px-2 py-0.5 text-xs text-[var(--signal-red)]"
                >
                  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
                  {r}
                </span>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Best fit */}
      {(fitGood.length > 0 || fitPoor.length > 0) && (
        <div className="rounded-sm border border-[var(--rule)] bg-[var(--bg-surface)] p-5">
          <ModuleHeader label="Use-case fit" />
          <div className="space-y-2.5">
            {fitGood.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-xs text-[var(--ink-soft)]">Best for:</span>
                {fitGood.map((u) => (
                  <span
                    key={u}
                    className="inline-flex items-center rounded-sm border border-[var(--success)]/30 bg-[var(--success)]/[0.08] px-2 py-0.5 text-xs text-[var(--success)]"
                  >
                    {u}
                  </span>
                ))}
              </div>
            )}
            {fitPoor.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-xs text-[var(--ink-soft)]">Underpowered for:</span>
                {fitPoor.map((u) => (
                  <span
                    key={u}
                    className="inline-flex items-center rounded-sm border border-[var(--signal-red)]/30 bg-[var(--signal-red)]/[0.06] px-2 py-0.5 text-xs text-[var(--signal-red)]"
                  >
                    {u}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Value vs peers — only if we have enough comparison data */}
      {(cpwPct !== null || cpwhPct !== null) && (
        <div className="rounded-sm border border-[var(--rule)] bg-[var(--bg-surface)] p-5">
          <ModuleHeader label={`vs ${band.length} cohort peers`} hint="Lower = cheaper" />
          <div className="space-y-3">
            {cpwPct !== null && (
              <PercentileBar
                pct={cpwPct}
                label={`for ${kit.costPerW}/W`}
              />
            )}
            {cpwhPct !== null && (
              <PercentileBar
                pct={cpwhPct}
                label={`for ${kit.costPerWh}/Wh`}
              />
            )}
          </div>
        </div>
      )}

      {/* Deal status */}
      {dealBadge && (
        <div className="rounded-sm border border-[var(--rule)] bg-[var(--bg-surface)] p-5">
          <ModuleHeader label="Deal status" hint={`${prices.length} datapoints`} />
          <span
            className={`inline-flex items-center gap-1.5 rounded-sm border px-2.5 py-1 text-sm ${
              dealBadge.tone === "good"
                ? "border-[var(--success)]/40 bg-[var(--success)]/10 text-[var(--success)]"
                : dealBadge.tone === "ok"
                  ? "border-[var(--accent)]/40 bg-[var(--accent)]/10 text-[var(--accent-hover)]"
                  : dealBadge.tone === "bad"
                    ? "border-[var(--signal-red)]/40 bg-[var(--signal-red)]/[0.07] text-[var(--signal-red)]"
                    : "border-[var(--rule)] bg-[var(--bg-elevated)] text-[var(--ink-soft)]"
            }`}
          >
            {dealBadge.label}
          </span>
        </div>
      )}

      {/* Install complexity */}
      {complexity.length > 0 && (
        <div className="rounded-sm border border-[var(--rule)] bg-[var(--bg-surface)] p-5">
          <ModuleHeader label="Install complexity" hint={complexity.length === 1 ? "Low" : complexity.length <= 2 ? "Moderate" : "High"} />
          <div className="flex flex-wrap gap-1.5">
            {complexity.map((c) => (
              <span
                key={c}
                className="inline-flex items-center gap-1 rounded-sm border border-[var(--rule)] bg-[var(--bg-elevated)] px-2 py-0.5 text-xs text-[var(--ink-soft)]"
              >
                {c}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Alternatives — full-width below if there are matches */}
      {altItems.length > 0 && (
        <div className="md:col-span-2 rounded-sm border border-[var(--rule)] bg-[var(--bg-surface)] p-5">
          <ModuleHeader label="Alternatives in cohort" hint="Same system type, similar specs" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {altItems.map((a) => (
              <Link
                key={a.label}
                href={`/kits/${a.kit.slug}`}
                className="group block rounded-sm border border-[var(--rule)] bg-[var(--paper)] p-3 hover:border-[var(--accent)] transition-colors"
              >
                <p className="eyebrow mb-1">{a.label}</p>
                <p className="font-display text-sm leading-snug text-[var(--ink)] group-hover:text-[var(--accent)] transition-colors">
                  {a.kit.brand} {a.kit.displayName ?? a.kit.name}
                </p>
                <p className="mt-1.5 text-xs text-[var(--ink-muted)]">{a.reason}</p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
