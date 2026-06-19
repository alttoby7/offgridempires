import type { Metadata } from "next";
import Link from "next/link";
import { getKits } from "@/lib/get-kits";
import { KitCard } from "@/components/kit-card";
import { BreadcrumbJsonLd } from "@/components/json-ld";
import { DataFooter } from "@/components/ui/data-footer";
import { BomTable } from "@/components/ui/bom-table";
import { AffiliateLink } from "@/components/ui/affiliate-link";
import { VerdictList } from "@/components/calculator/verdict-list";
import { getKitsUpdated } from "@/lib/data-meta";
import { APPLIANCE_CATALOG } from "@/lib/calculator/appliances";
import { computeSizing, matchKits } from "@/lib/calculator/engine";
import { computeVerdicts } from "@/lib/calculator/verdicts";
import { buildAffiliateUrl } from "@/lib/affiliate";
import type { LoadEntry, SystemAssumptions } from "@/lib/calculator/types";
import type { Kit } from "@/lib/demo-data";

export const dynamic = "force-static";
export const dynamicParams = false;

const USE_CASES: Record<
  string,
  {
    title: string;
    h1: string;
    description: string;
    intro: string;
    dailyWh: number;
    peakW: number;
    tips: string[];
  }
> = {
  rv: {
    title: "Best Solar Kits for RV & Van Life",
    h1: "Best Solar Kits for RV & Van Life",
    description:
      "Compare the best off-grid solar kits for RVs, campervans, and van life. Real build costs, completeness scores, and use case ratings from actual specs.",
    intro:
      "RV and van life solar needs to cover 1,000–2,000 Wh/day for lights, fridge, phone charging, and a fan. You need a compact system that fits on a roof rack or van roof, with at least 200W of panels and 1,200 Wh of usable storage for a comfortable weekend.",
    dailyWh: 1500,
    peakW: 1000,
    tips: [
      "200–400W panels cover most RV rooftops",
      "LiFePO4 batteries save 40–60 lbs vs AGM",
      "MPPT controllers squeeze 15–25% more power from partial shade",
      "Plan for 1,200+ Wh storage for overnight without hookups",
    ],
  },
  cabin: {
    title: "Best Solar Kits for Weekend Cabins",
    h1: "Best Solar Kits for Weekend Cabins",
    description:
      "Compare solar kits rated for weekend cabin use. See true build costs and which kits include everything you need for off-grid cabin power.",
    intro:
      "A weekend cabin typically needs 2,000–4,000 Wh/day for lighting, a small fridge, water pump, phone charging, and occasional power tools. You want 400W+ panels, 2,400+ Wh of storage, and a 2,000W inverter to run everything comfortably.",
    dailyWh: 3000,
    peakW: 2000,
    tips: [
      "400W+ panels for reliable winter charging",
      "2,400+ Wh storage for 2 days of autonomy",
      "Pure sine wave inverter for sensitive electronics",
      "Mounting hardware matters — roof or ground mount based on tree cover",
    ],
  },
  shed: {
    title: "Best Solar Kits for Sheds & Workshops",
    h1: "Best Solar Kits for Sheds & Workshops",
    description:
      "Compare solar kits for sheds and workshops. Low power needs, budget-friendly options with true cost breakdowns.",
    intro:
      "A shed or workshop needs 300–800 Wh/day — just lights, a radio, maybe a small tool charger. This is the most forgiving use case: even small starter kits can handle it. Focus on low cost and simplicity over capacity.",
    dailyWh: 500,
    peakW: 500,
    tips: [
      "100–200W panels are plenty for shed lighting",
      "AGM batteries are fine for low-cycle shed use",
      "PWM controllers work well at this scale — no need for MPPT",
      "Budget kits excel here — don't overspend",
    ],
  },
  emergency: {
    title: "Best Solar Kits for Emergency Backup",
    h1: "Best Solar Kits for Emergency Backup",
    description:
      "Compare solar kits for emergency and disaster preparedness. Rated by storage capacity, inverter power, and days of autonomy.",
    intro:
      "Emergency backup needs reliable power for 3+ days without sun: fridge, medical devices, communications, and lighting. You need big storage (4,000+ Wh), a strong inverter (3,000W+), and LiFePO4 chemistry that won't fail after sitting unused for months.",
    dailyWh: 2000,
    peakW: 3000,
    tips: [
      "LiFePO4 holds charge for months — critical for emergency standby",
      "3,000W+ inverter for fridge startup surge",
      "72+ hours of autonomy without sun is the gold standard",
      "Portable power stations offer grab-and-go emergency power",
    ],
  },
  homestead: {
    title: "Best Solar Kits for Homesteads",
    h1: "Best Solar Kits for Homesteads & Off-Grid Homes",
    description:
      "Compare solar kits for full-time off-grid homestead living. Most kits aren't powerful enough — see which ones come closest and what you'll need to add.",
    intro:
      "A homestead draws 6,000–10,000 Wh/day — full-size fridge, washing machine, water pump, lights, and electronics. No kit in our database is rated \"excellent\" for homestead use because the power demands exceed what any single consumer kit provides. You'll likely need multiple kits or a custom system.",
    dailyWh: 8000,
    peakW: 5000,
    tips: [
      "Most consumer kits max out at 2,000–5,000 Wh — you'll need multiples",
      "48V systems reduce wire losses for larger installations",
      "LiFePO4 is essential for daily deep cycling",
      "Consider a hybrid inverter with generator input for winter backup",
    ],
  },
  boat: {
    title: "Best Solar Kits for Boats & Marine Use",
    h1: "Best Solar Kits for Boats & Marine",
    description:
      "Compare solar kits rated for marine and boat use. Compact panels, corrosion-resistant components, and enough power for navigation and cabin electronics.",
    intro:
      "Marine solar needs to handle 800–1,500 Wh/day for navigation lights, instruments, radio, fridge, and cabin lighting. Space is limited, so panel efficiency and compact batteries matter. Corrosion resistance is important — LiFePO4 batteries handle the marine environment better than lead-acid.",
    dailyWh: 1000,
    peakW: 800,
    tips: [
      "Flexible panels can conform to curved cabin tops",
      "LiFePO4 handles marine vibration and humidity better",
      "200–400W panels fit most sailboat and powerboat decks",
      "Waterproof charge controllers are worth the premium",
    ],
  },
};

/**
 * Rich "planned-system verdict page" config — only for the use cases we've
 * rebuilt around the painful-load questions (RV + Cabin first). When a use case
 * has a PlanConfig, the page leads with the honest verdict + a buildable system
 * instead of a kit list. Others fall back to the legacy list layout.
 */
interface PlanConfig {
  metaTitle: string;
  metaDescription: string;
  question: string;
  lede: string;
  /** A realistic representative load list for this use case (catalog ids). */
  loadIds: string[];
  assumptions: SystemAssumptions;
}

const PLAN_CONFIG: Record<string, PlanConfig> = {
  rv: {
    metaTitle: "Will Solar Actually Run Your RV? What Works & What Won't (2026)",
    metaDescription:
      "An honest off-grid solar plan for RV & van life — what a typical rig can really run, where setups stall, and the exact system that covers it. No sales pitch.",
    question: "Will solar actually run your RV? What works — and what won't.",
    lede:
      "Most RV solar advice sells you a kit and hopes for the best. We start from the honest math: here's what a realistic van/RV setup can run, where it quietly falls short, and the exact system that actually covers it — so you buy once.",
    loadIds: [
      "led-light",
      "phone-charger",
      "laptop",
      "12v-fan",
      "mini-fridge",
      "rv-water-pump",
      "starlink",
    ],
    assumptions: {
      sunHoursPerDay: 5.0,
      sunSource: "tier",
      zipCode: "",
      sunTier: "good",
      autonomyDays: 1,
      controllerType: "mppt",
      batteryChemistry: "lifepo4",
    },
  },
  cabin: {
    metaTitle: "Will Solar Run Your Cabin? Honest Off-Grid Plan (2026)",
    metaDescription:
      "An honest off-grid solar plan for a weekend cabin — what it can really power (including the well pump that trips inverters), and the exact system that covers it.",
    question: "Will solar run your cabin? Here's what works — and what won't.",
    lede:
      "A weekend cabin is where the well pump, the fridge, and a cloudy weekend quietly break a system that looked fine on paper. Here's the honest verdict on a typical cabin load — and the exact system that holds up.",
    loadIds: [
      "led-light",
      "wifi-router",
      "mini-fridge",
      "coffee-maker",
      "well-pump",
      "box-fan",
      "washing-machine",
    ],
    assumptions: {
      sunHoursPerDay: 4.5,
      sunSource: "tier",
      zipCode: "",
      sunTier: "average",
      autonomyDays: 2,
      controllerType: "mppt",
      batteryChemistry: "lifepo4",
    },
  },
};

// ── Helpers for the planned-system layout ────────────────────────────────────

function presetToLoads(ids: string[]): LoadEntry[] {
  const loads: LoadEntry[] = [];
  ids.forEach((id, i) => {
    const def = APPLIANCE_CATALOG.find((a) => a.id === id);
    if (!def) return;
    loads.push({
      id: `plan-${i}`,
      name: def.name,
      watts: def.defaultWatts,
      qty: def.defaultQty,
      hoursPerDay: def.defaultHours,
      dutyCycle: def.dutyCycle,
      surgeWatts: def.surgeWatts,
      isCustom: false,
    });
  });
  return loads;
}

/** Build a /calculator deep-link that pre-loads this use case's representative loads. */
function buildPlannerUrl(ids: string[]): string {
  const parts = ids
    .map((id) => {
      const def = APPLIANCE_CATALOG.find((a) => a.id === id);
      return def ? `${def.id}~${def.defaultQty}~${def.defaultHours}` : null;
    })
    .filter((p): p is string => p !== null);
  return `/calculator?v=1&step=1&l=${parts.join(",")}`;
}

/** Best in-stock affiliate buy link for a kit (falls back to its primary source). */
function bestBuy(kit: Kit): { url: string; retailer: string; price: number } | null {
  const inStock = (kit.offers ?? []).filter((o) => o.inStock && o.sourceUrl);
  const best = [...inStock].sort((a, b) => a.price - b.price)[0];
  if (best?.sourceUrl) {
    const url = buildAffiliateUrl(best.sourceUrl, best.retailerSlug);
    if (url) return { url, retailer: best.retailer, price: best.price };
  }
  if (kit.sourceUrl) {
    const url = buildAffiliateUrl(kit.sourceUrl, kit.retailerSlug ?? "amazon");
    if (url) return { url, retailer: kit.retailer, price: kit.listedPrice };
  }
  return null;
}

function fmtWh(wh: number): string {
  return wh >= 1000 ? `${(wh / 1000).toFixed(1)} kWh` : `${wh} Wh`;
}

export function generateStaticParams() {
  return Object.keys(USE_CASES).map((usecase) => ({ usecase }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ usecase: string }>;
}): Promise<Metadata> {
  const { usecase } = await params;
  const uc = USE_CASES[usecase];
  if (!uc) return { title: "Use Case Not Found" };

  const plan = PLAN_CONFIG[usecase];
  const title = plan ? plan.metaTitle : `${uc.title} (2026): Real Build Cost Comparison`;
  const description = plan ? plan.metaDescription : uc.description;
  return {
    title,
    description,
    alternates: { canonical: `/best-for/${usecase}` },
    openGraph: { title, description, url: `/best-for/${usecase}` },
  };
}

export default async function UseCasePage({
  params,
}: {
  params: Promise<{ usecase: string }>;
}) {
  const { usecase } = await params;
  const uc = USE_CASES[usecase];
  if (!uc) return <div className="p-8 text-center text-[var(--text-muted)]">Use case not found.</div>;

  const allKits = getKits();
  const plan = PLAN_CONFIG[usecase];

  if (plan) {
    return <PlannedSystemLayout usecase={usecase} uc={uc} plan={plan} allKits={allKits} />;
  }

  return <KitListLayout usecase={usecase} uc={uc} allKits={allKits} />;
}

// ── Planned-system verdict layout (RV + Cabin) ───────────────────────────────

function PlannedSystemLayout({
  usecase,
  uc,
  plan,
  allKits,
}: {
  usecase: string;
  uc: (typeof USE_CASES)[string];
  plan: PlanConfig;
  allKits: Kit[];
}) {
  const loads = presetToLoads(plan.loadIds);
  const sizing = computeSizing(loads, plan.assumptions);
  const verdicts = computeVerdicts(loads, plan.assumptions, sizing);
  const matches = matchKits(sizing, allKits);
  const recommended =
    matches.find((m) => m.bucket === "meets") ??
    matches.find((m) => m.bucket === "near") ??
    matches[0] ??
    null;
  const shortlist = matches
    .filter((m) => m.bucket === "meets" || m.bucket === "near")
    .slice(0, 3);

  const label = uc.title.replace("Best Solar Kits for ", "");
  const loadNames = loads.map((l) => l.name.toLowerCase());
  const buy = recommended ? bestBuy(recommended.kit) : null;

  const sizingCards = [
    { label: "Daily energy", value: fmtWh(sizing.totalDailyWh) },
    { label: "Solar needed", value: `${sizing.requiredPanelWatts.toLocaleString()}W` },
    { label: "Storage needed", value: fmtWh(sizing.requiredStorageWh) },
    { label: "Inverter needed", value: `${sizing.requiredInverterWatts.toLocaleString()}W` },
  ];

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
      <BreadcrumbJsonLd
        items={[
          { name: "Home", url: "/" },
          { name: "Plan your system", url: "/calculator" },
          { name: label, url: `/best-for/${usecase}` },
        ]}
      />

      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-[var(--text-muted)] mb-6">
        <Link href="/" className="hover:text-[var(--accent)] transition-colors">Home</Link>
        <span>/</span>
        <Link href="/calculator" className="hover:text-[var(--accent)] transition-colors">Plan</Link>
        <span>/</span>
        <span className="text-[var(--text-secondary)]">{label}</span>
      </nav>

      {/* Header */}
      <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)] mb-3 leading-tight">
        {plan.question}
      </h1>
      <p className="text-sm text-[var(--text-secondary)] leading-relaxed max-w-2xl mb-4">
        {plan.lede}
      </p>
      <DataFooter kitCount={allKits.length} updated={getKitsUpdated()} />

      {/* Section 1: the honest verdict */}
      <section className="mt-8">
        <h2 className="text-lg font-bold text-[var(--text-primary)] mb-1">
          What works — and what won&apos;t — for a typical {label.toLowerCase()}
        </h2>
        <p className="text-xs text-[var(--text-muted)] mb-4 max-w-2xl">
          Based on a realistic load list ({loadNames.join(", ")}). Here&apos;s where setups like
          this actually trip up — the part the wattage math doesn&apos;t show.
        </p>
        <VerdictList verdicts={verdicts} />
      </section>

      {/* Section 2: the system that covers it */}
      <section className="mt-10">
        <h2 className="text-lg font-bold text-[var(--text-primary)] mb-1">
          The system that actually covers it
        </h2>
        <p className="text-xs text-[var(--text-muted)] mb-4 max-w-2xl">
          Sized for this load at {plan.assumptions.sunHoursPerDay} peak sun hours/day and{" "}
          {plan.assumptions.autonomyDays} day{plan.assumptions.autonomyDays !== 1 ? "s" : ""} of
          autonomy.
        </p>

        {/* Sizing cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {sizingCards.map((card) => (
            <div key={card.label} className="rounded border border-[var(--border)] bg-[var(--bg-surface)] p-4">
              <div className="text-xs text-[var(--text-muted)] mb-1">{card.label}</div>
              <div className="font-mono text-xl font-bold text-[var(--accent)]">{card.value}</div>
            </div>
          ))}
        </div>

        {/* Recommended buildable kit */}
        {recommended ? (
          <div className="rounded border border-[var(--accent)]/30 bg-[var(--accent)]/[0.03] p-5">
            <div className="flex flex-wrap items-start justify-between gap-3 mb-1">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--accent)] mb-1">
                  {recommended.bucket === "meets" ? "Closest single-kit match" : "Best starting point"}
                </p>
                <Link
                  href={`/kits/${recommended.kit.slug}`}
                  className="text-base font-semibold text-[var(--text-primary)] hover:text-[var(--accent)] transition-colors"
                >
                  {recommended.kit.name}
                </Link>
                <div className="text-xs text-[var(--text-muted)] mt-0.5">
                  {recommended.kit.brand} · ${recommended.kit.trueCost.toLocaleString()} real build cost
                  {recommended.kit.missingCost > 0
                    ? ` (incl. ~$${recommended.kit.missingCost.toLocaleString()} in parts it doesn't include)`
                    : ""}
                </div>
              </div>
              {buy && (
                <AffiliateLink
                  href={buy.url}
                  kitSlug={recommended.kit.slug}
                  retailer={buy.retailer}
                  price={buy.price}
                  className="inline-flex items-center gap-1.5 rounded-sm bg-[var(--accent)] px-4 py-2 text-xs font-semibold text-[var(--bg-primary)] hover:bg-[var(--accent-hover)] transition-colors"
                >
                  Check price at {buy.retailer}
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" />
                  </svg>
                </AffiliateLink>
              )}
            </div>

            {recommended.gaps.length > 0 && (
              <p className="text-xs text-[var(--warning)] mt-2 mb-4">
                What it still needs: {recommended.gaps.join(" · ")}
              </p>
            )}

            {/* Full bill of materials */}
            <div className="mt-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)] mb-2">
                The full bill of materials
              </p>
              <BomTable items={recommended.kit.items} missingCost={recommended.kit.missingCost} />
            </div>
          </div>
        ) : (
          <div className="rounded border border-[var(--warning)]/30 bg-[var(--warning)]/5 p-5 text-sm text-[var(--text-secondary)]">
            No single kit we track cleanly covers this load. You&apos;ll get a better result building
            from components — start with the planner below to see the exact panel, battery, and
            inverter targets.
          </div>
        )}
      </section>

      {/* Section 3: customize in the planner */}
      <Link
        href={buildPlannerUrl(plan.loadIds)}
        className="mt-8 flex items-center gap-3 rounded border border-[var(--accent)]/30 bg-[var(--accent)]/5 p-4 hover:border-[var(--accent)]/50 hover:bg-[var(--accent)]/10 transition-colors group"
      >
        <span className="text-xl" aria-hidden>⚡</span>
        <div className="flex-1">
          <p className="text-sm font-semibold text-[var(--accent)] group-hover:underline">
            Not your exact setup? Adjust it in the planner
          </p>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            We&apos;ll pre-load this {label.toLowerCase()} list — add or remove appliances and the
            verdict + sizing update for you.
          </p>
        </div>
        <svg className="shrink-0 text-[var(--accent)]" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12h14M12 5l7 7-7 7" />
        </svg>
      </Link>

      {/* Section 4: honest shortlist */}
      {shortlist.length > 0 && (
        <section className="mt-10">
          <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-3">
            Other kits that fit this load
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {shortlist.map((m) => (
              <KitCard key={m.kit.slug} kit={m.kit} />
            ))}
          </div>
        </section>
      )}

      {/* Cross-links */}
      <CrossLinks usecase={usecase} />
    </div>
  );
}

// ── Legacy kit-list layout (shed / emergency / homestead / boat) ─────────────

function KitListLayout({
  usecase,
  uc,
  allKits,
}: {
  usecase: string;
  uc: (typeof USE_CASES)[string];
  allKits: Kit[];
}) {
  const ratingOrder = { excellent: 0, good: 1, fair: 2, poor: 3 };
  const kits = [...allKits].sort((a, b) => {
    const ra = ratingOrder[a.useCaseRatings[usecase] ?? "poor"];
    const rb = ratingOrder[b.useCaseRatings[usecase] ?? "poor"];
    if (ra !== rb) return ra - rb;
    return a.trueCost - b.trueCost;
  });

  const excellent = kits.filter((k) => k.useCaseRatings[usecase] === "excellent");
  const good = kits.filter((k) => k.useCaseRatings[usecase] === "good");
  const fair = kits.filter((k) => k.useCaseRatings[usecase] === "fair");
  const poor = kits.filter((k) => k.useCaseRatings[usecase] === "poor");

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <BreadcrumbJsonLd
        items={[
          { name: "Home", url: "/" },
          { name: "Best For", url: "/kits" },
          { name: uc.h1, url: `/best-for/${usecase}` },
        ]}
      />

      <nav className="flex items-center gap-2 text-sm text-[var(--text-muted)] mb-6">
        <Link href="/" className="hover:text-[var(--accent)] transition-colors">Home</Link>
        <span>/</span>
        <Link href="/kits" className="hover:text-[var(--accent)] transition-colors">Kits</Link>
        <span>/</span>
        <span className="text-[var(--text-secondary)]">{uc.h1}</span>
      </nav>

      <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)] mb-3">{uc.h1}</h1>
      <p className="text-sm text-[var(--text-secondary)] leading-relaxed max-w-3xl mb-4">{uc.intro}</p>

      <DataFooter kitCount={kits.length} updated={getKitsUpdated()} />

      <div className="flex flex-wrap gap-3 mb-6 mt-4">
        <div className="rounded border border-[var(--border)] bg-[var(--bg-surface)] px-4 py-2.5">
          <p className="font-mono text-lg font-bold text-[var(--accent)]">{uc.dailyWh.toLocaleString()} Wh</p>
          <p className="text-xs text-[var(--text-muted)]">Daily Load</p>
        </div>
        <div className="rounded border border-[var(--border)] bg-[var(--bg-surface)] px-4 py-2.5">
          <p className="font-mono text-lg font-bold text-[var(--accent)]">{uc.peakW.toLocaleString()}W</p>
          <p className="text-xs text-[var(--text-muted)]">Peak Draw</p>
        </div>
        <div className="rounded border border-[var(--border)] bg-[var(--bg-surface)] px-4 py-2.5">
          <p className="font-mono text-lg font-bold text-[var(--accent)]">{excellent.length + good.length}</p>
          <p className="text-xs text-[var(--text-muted)]">Recommended Kits</p>
        </div>
      </div>

      <Link
        href="/calculator"
        className="flex items-center gap-3 rounded border border-[var(--accent)]/30 bg-[var(--accent)]/5 p-4 mb-6 hover:border-[var(--accent)]/50 hover:bg-[var(--accent)]/10 transition-colors group"
      >
        <span className="text-xl">⚡</span>
        <div className="flex-1">
          <p className="text-sm font-semibold text-[var(--accent)] group-hover:underline">
            Size your system for {uc.h1.replace("Best Solar Kits for ", "")}
          </p>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            Enter your exact appliances to find kits that fit your power needs.
          </p>
        </div>
        <svg className="shrink-0 text-[var(--accent)]" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12h14M12 5l7 7-7 7" />
        </svg>
      </Link>

      <div className="rounded border border-[var(--border)] bg-[var(--bg-surface)] p-5 mb-8">
        <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-3">What to look for</h2>
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {uc.tips.map((tip) => (
            <li key={tip} className="flex items-start gap-2 text-sm text-[var(--text-secondary)]">
              <span className="text-[var(--accent)] mt-0.5">◈</span>
              {tip}
            </li>
          ))}
        </ul>
      </div>

      {excellent.length > 0 && (
        <KitSection title="Excellent" subtitle="These kits meet or exceed all power requirements for this use case." kits={excellent} color="var(--success)" />
      )}
      {good.length > 0 && (
        <KitSection title="Good" subtitle="Solid options that cover most needs — may fall short on storage or inverter capacity." kits={good} color="var(--accent)" />
      )}
      {fair.length > 0 && (
        <KitSection title="Fair" subtitle="Usable with caveats — expect limitations in capacity or missing components." kits={fair} color="var(--text-muted)" />
      )}
      {poor.length > 0 && (
        <KitSection title="Not Recommended" subtitle="These kits lack the capacity or components needed for this use case." kits={poor} color="var(--danger)" collapsed />
      )}

      <CrossLinks usecase={usecase} />
    </div>
  );
}

function CrossLinks({ usecase }: { usecase: string }) {
  return (
    <div className="mt-12 pt-6 border-t border-[var(--border)]">
      <p className="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)] mb-3">
        Other Use Cases
      </p>
      <div className="flex flex-wrap gap-2">
        {Object.entries(USE_CASES)
          .filter(([key]) => key !== usecase)
          .map(([key, val]) => (
            <Link
              key={key}
              href={`/best-for/${key}`}
              className="rounded border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-1.5 text-xs text-[var(--text-secondary)] hover:border-[var(--border-accent)] hover:text-[var(--accent)] transition-colors"
            >
              {val.title.replace("Best Solar Kits for ", "")}
            </Link>
          ))}
      </div>
    </div>
  );
}

function KitSection({
  title,
  subtitle,
  kits,
  color,
  collapsed,
}: {
  title: string;
  subtitle: string;
  kits: ReturnType<typeof getKits>;
  color: string;
  collapsed?: boolean;
}) {
  return (
    <section className="mb-8">
      <div className="flex items-center gap-3 mb-2">
        <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
        <h2 className="text-lg font-bold text-[var(--text-primary)]">{title}</h2>
        <span className="font-mono text-sm text-[var(--text-muted)]">({kits.length})</span>
      </div>
      <p className="text-sm text-[var(--text-muted)] mb-4">{subtitle}</p>

      {collapsed ? (
        <details className="group">
          <summary className="text-xs text-[var(--text-muted)] cursor-pointer hover:text-[var(--accent)] transition-colors mb-4">
            Show {kits.length} not-recommended kits
          </summary>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {kits.map((kit) => (
              <KitCard key={kit.slug} kit={kit} />
            ))}
          </div>
        </details>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {kits.map((kit) => (
            <KitCard key={kit.slug} kit={kit} />
          ))}
        </div>
      )}
    </section>
  );
}
