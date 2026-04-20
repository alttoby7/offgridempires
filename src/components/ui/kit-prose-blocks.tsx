import Link from "next/link";
import type { Kit } from "@/lib/demo-data";
import { getSimilarKits } from "@/lib/similar-kits";

type SystemType = "portable" | "diy-kit" | "whole-home" | "panels-only";

const TYPE_LABELS: Record<SystemType, string> = {
  portable: "portable power station",
  "diy-kit": "DIY solar kit",
  "whole-home": "whole-home off-grid system",
  "panels-only": "panel-only kit",
};

const USE_CASE_LABELS: Record<string, string> = {
  rv: "RV and van life",
  cabin: "cabins",
  shed: "sheds",
  emergency: "emergency backup",
  homestead: "homesteads",
  boat: "boats and marine",
};

function parseCurrency(v: string): number {
  const n = parseFloat(v.replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function cohort(kit: Kit, allKits: Kit[]): Kit[] {
  const type = kit.systemType;
  if (!type) return [];
  return allKits.filter((k) => k.slug !== kit.slug && k.systemType === type);
}

function wattBand(kit: Kit, peers: Kit[]): Kit[] {
  if (kit.panelWatts === 0) return peers;
  const lo = kit.panelWatts / 1.75;
  const hi = kit.panelWatts * 1.75;
  const band = peers.filter((k) => k.panelWatts >= lo && k.panelWatts <= hi);
  return band.length >= 4 ? band : peers;
}

function percentile(value: number, values: number[]): number {
  if (values.length === 0 || !Number.isFinite(value)) return 50;
  const sorted = [...values].filter((v) => Number.isFinite(v) && v > 0).sort((a, b) => a - b);
  if (sorted.length === 0) return 50;
  let below = 0;
  for (const v of sorted) {
    if (v < value) below += 1;
  }
  return Math.round((below / sorted.length) * 100);
}

function severityBucket(delta: number, pct: number): "negligible" | "moderate" | "severe" {
  if (delta < 50 || pct < 5) return "negligible";
  if (delta < 250 && pct < 20) return "moderate";
  return "severe";
}

function missingList(kit: Kit): string[] {
  return kit.items.filter((i) => !i.isIncluded).map((i) => i.role.toLowerCase());
}

function formatList(items: string[]): string {
  if (items.length === 0) return "";
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
}

function topUseCases(kit: Kit): string[] {
  return Object.entries(kit.useCaseRatings)
    .filter(([, r]) => r === "excellent" || r === "good")
    .sort(
      (a, b) =>
        (a[1] === "excellent" ? 0 : 1) - (b[1] === "excellent" ? 0 : 1)
    )
    .slice(0, 2)
    .map(([k]) => USE_CASE_LABELS[k] ?? k);
}

function findAlternatives(
  kit: Kit,
  allKits: Kit[]
): {
  cheaper?: Kit;
  moreComplete?: Kit;
  betterValue?: Kit;
} {
  const peers = getSimilarKits(kit, allKits, 12);
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

function Block({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="font-mono text-[10px] uppercase tracking-wider text-[var(--text-muted)] mb-1">
        {label}
      </div>
      <div className="text-sm text-[var(--text-secondary)] leading-relaxed">
        {children}
      </div>
    </div>
  );
}

export function KitProseBlocks({
  kit,
  allKits,
}: {
  kit: Kit;
  allKits: Kit[];
}) {
  const peers = cohort(kit, allKits);
  const band = wattBand(kit, peers);
  const typeLabel = TYPE_LABELS[kit.systemType ?? "diy-kit"];
  const useCases = topUseCases(kit);
  const useCaseStr = useCases.length > 0 ? formatList(useCases) : "general off-grid use";

  // 1. Identity
  const identity = (
    <>
      The <strong className="text-[var(--text-primary)]">{kit.brand} {kit.displayName ?? kit.name}</strong> is a {kit.panelWatts > 0 ? `${kit.panelWatts}W` : "solar-only"} {typeLabel}
      {kit.storageWh > 0 ? ` with ${(kit.storageWh / 1000).toFixed(1)}kWh of ${kit.chemistry === "None" ? "" : `${kit.chemistry} `}storage` : " sold without battery storage"}
      {kit.inverterWatts > 0 ? ` and a ${kit.inverterWatts.toLocaleString()}W inverter` : ""}, pitched at {useCaseStr}.
    </>
  );

  // 2. Cost verdict
  const delta = kit.missingCost;
  const pct = kit.listedPrice > 0 ? Math.round((delta / kit.listedPrice) * 100) : 0;
  const severity = severityBucket(delta, pct);
  const severityCopy: Record<typeof severity, string> = {
    negligible: `The advertised price of $${kit.listedPrice.toLocaleString()} closely matches the real build cost of $${kit.trueCost.toLocaleString()} — no meaningful hidden cost.`,
    moderate: `The advertised price of $${kit.listedPrice.toLocaleString()} rises to $${kit.trueCost.toLocaleString()} once required missing parts are added — a moderate ${pct}% gap ($${delta.toLocaleString()}) buyers should plan for.`,
    severe: `The advertised price of $${kit.listedPrice.toLocaleString()} balloons to $${kit.trueCost.toLocaleString()} after missing parts are priced in — a severe ${pct}% gap ($${delta.toLocaleString()}) that makes the sticker price misleading.`,
  };
  const costVerdict = <>{severityCopy[severity]}</>;

  // 3. Completeness verdict
  const missing = missingList(kit);
  let completenessCopy: React.ReactNode;
  if (missing.length === 0) {
    completenessCopy = <>Complete as sold — every one of the seven standard component roles ships in the box.</>;
  } else if (missing.length <= 2) {
    completenessCopy = (
      <>
        Ships <strong className="text-[var(--text-primary)]">mostly complete ({kit.completeness}%)</strong>, missing only {formatList(missing)} — expect to source {missing.length === 1 ? "that piece" : "those"} separately before install.
      </>
    );
  } else {
    completenessCopy = (
      <>
        Ships <strong className="text-[var(--text-primary)]">{kit.completeness}% complete</strong>, missing {missing.length} roles: {formatList(missing)}. Plan on sourcing each before the system produces usable power.
      </>
    );
  }

  // 4. Fit verdict
  const excellentUseCases = Object.entries(kit.useCaseRatings)
    .filter(([, r]) => r === "excellent")
    .map(([k]) => USE_CASE_LABELS[k] ?? k);
  const poorUseCases = Object.entries(kit.useCaseRatings)
    .filter(([, r]) => r === "poor")
    .map(([k]) => USE_CASE_LABELS[k] ?? k);
  const fitVerdict = (
    <>
      Best suited for {excellentUseCases.length > 0 ? formatList(excellentUseCases) : useCaseStr}
      {kit.voltage > 0 ? `, running on a ${kit.voltage}V system` : ""}
      {kit.chemistry !== "None" && kit.chemistry !== "Unknown" ? ` with ${kit.chemistry} chemistry` : ""}.
      {poorUseCases.length > 0 && (
        <>
          {" "}
          Underpowered for {formatList(poorUseCases)} — the {kit.panelWatts > 0 ? `${kit.panelWatts}W array` : "kit"}
          {kit.storageWh > 0 ? ` and ${(kit.storageWh / 1000).toFixed(1)}kWh bank` : ""} falls short of those daily loads.
        </>
      )}
    </>
  );

  // 5. Value vs peers
  const kitCpw = parseCurrency(kit.costPerW);
  const kitCpwh = parseCurrency(kit.costPerWh);
  const peerCpws = band.map((k) => parseCurrency(k.costPerW));
  const peerCpwhs = band.map((k) => parseCurrency(k.costPerWh));
  const cpwPct = kitCpw > 0 ? percentile(kitCpw, peerCpws) : null;
  const cpwhPct = kitCpwh > 0 ? percentile(kitCpwh, peerCpwhs) : null;

  const valueLabel = (p: number | null): string => {
    if (p === null) return "not applicable";
    if (p <= 25) return "best quartile";
    if (p <= 50) return "above average";
    if (p <= 75) return "below average";
    return "expensive quartile";
  };
  const valueVerdict = (
    <>
      Against the {band.length} peer kits in the {kit.panelWatts > 0 ? `${kit.panelWatts}W wattage band` : "same category"}, this one prices at{" "}
      <strong className="text-[var(--text-primary)]">{kit.costPerW}/W</strong>{" "}
      ({valueLabel(cpwPct)}{cpwPct !== null ? `, ${cpwPct}th percentile` : ""})
      {kitCpwh > 0 && cpwhPct !== null && (
        <>
          {" "}and <strong className="text-[var(--text-primary)]">{kit.costPerWh}/Wh</strong>{" "}
          ({valueLabel(cpwhPct)}, {cpwhPct}th percentile)
        </>
      )}
      . Lower percentiles mean better value per watt or watt-hour.
    </>
  );

  // 6. Deal status
  const history = kit.priceHistory ?? [];
  let dealCopy: React.ReactNode;
  if (history.length < 5) {
    dealCopy = <>Price history is still limited — no meaningful deal baseline yet.</>;
  } else {
    const nowCents = Math.round(kit.listedPrice * 100);
    const prices = history.map((p) => p.priceCents).filter((c) => c > 0);
    const min = Math.min(...prices);
    const avg = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);
    const pctOverMin = min > 0 ? Math.round(((nowCents - min) / min) * 100) : 0;
    if (pctOverMin <= 3) dealCopy = <>Currently <strong className="text-[var(--success)]">near the all-time low</strong> in tracked price history — a strong buying window.</>;
    else if (nowCents < avg) dealCopy = <>Currently priced <strong className="text-[var(--accent)]">below the average</strong> of {history.length} tracked observations — a reasonable buying window.</>;
    else if (pctOverMin >= 15) dealCopy = <>Currently <strong className="text-[var(--danger)]">{pctOverMin}% above the tracked low</strong> — a poor deal window; wait for a discount.</>;
    else dealCopy = <>Currently <strong className="text-[var(--text-primary)]">close to the average</strong> tracked price — neither a deal nor a poor window.</>;
  }

  // 7. Install complexity
  const complexityFactors: string[] = [];
  if (missing.length >= 3) complexityFactors.push(`${missing.length} missing component roles to source`);
  if (kit.voltage >= 48) complexityFactors.push("48V DC wiring that requires proper breakers and cable gauge");
  else if (kit.voltage <= 12 && kit.panelWatts >= 600) complexityFactors.push("a 12V system pushed toward its current-carrying ceiling");
  if (!kit.included?.mounting) complexityFactors.push("mounting hardware to buy and spec separately");
  if (!kit.included?.wiring) complexityFactors.push("battery and PV cables plus fuses to size correctly");
  if (kit.systemType === "whole-home") complexityFactors.push("a licensed electrician for final grid-adjacent connections");

  let complexityCopy: React.ReactNode;
  if (complexityFactors.length === 0) {
    complexityCopy = <>Install complexity is low — the kit ships plug-and-play with no extra sourcing or wiring decisions required.</>;
  } else if (complexityFactors.length <= 2) {
    complexityCopy = <>Moderate install work: {formatList(complexityFactors)}. A handy owner can complete it in a weekend.</>;
  } else {
    complexityCopy = <>Significant install work: {formatList(complexityFactors)}. Budget for sourcing time and verify each piece against the kit&apos;s voltage before wiring.</>;
  }

  // 8. Alternatives
  const alt = findAlternatives(kit, allKits);
  const altLinks: { label: string; kit: Kit; reason: string }[] = [];
  if (alt.cheaper)
    altLinks.push({
      label: "Cheaper in cohort",
      kit: alt.cheaper,
      reason: `$${alt.cheaper.trueCost.toLocaleString()} real build cost`,
    });
  if (alt.moreComplete)
    altLinks.push({
      label: "More complete",
      kit: alt.moreComplete,
      reason: `${alt.moreComplete.completeness}% complete vs ${kit.completeness}%`,
    });
  if (alt.betterValue)
    altLinks.push({
      label: "Better value per watt",
      kit: alt.betterValue,
      reason: `${alt.betterValue.costPerW}/W`,
    });

  return (
    <section className="border border-[var(--border)] rounded bg-[var(--bg-surface)] p-5 sm:p-6 space-y-4">
      <Block label="At a glance">{identity}</Block>
      <Block label="Cost verdict">{costVerdict}</Block>
      <Block label="Completeness">{completenessCopy}</Block>
      <Block label="Best fit">{fitVerdict}</Block>
      <Block label={`Value vs ${band.length} peers`}>{valueVerdict}</Block>
      <Block label="Deal status">{dealCopy}</Block>
      <Block label="Install complexity">{complexityCopy}</Block>
      {altLinks.length > 0 && (
        <Block label="Alternatives in cohort">
          <ul className="space-y-1.5 mt-1">
            {altLinks.map((a) => (
              <li key={a.label} className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-3">
                <span className="font-mono text-xs text-[var(--text-muted)] min-w-[160px]">
                  {a.label}
                </span>
                <Link
                  href={`/kits/${a.kit.slug}`}
                  className="text-[var(--accent)] hover:underline"
                >
                  {a.kit.brand} {a.kit.displayName ?? a.kit.name}
                </Link>
                <span className="text-xs text-[var(--text-muted)]">
                  — {a.reason}
                </span>
              </li>
            ))}
          </ul>
        </Block>
      )}
    </section>
  );
}
