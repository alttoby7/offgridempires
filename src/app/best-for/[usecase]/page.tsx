import type { Metadata } from "next";
import Link from "next/link";
import { getKits } from "@/lib/get-kits";
import { KitCard } from "@/components/kit-card";
import { BreadcrumbJsonLd } from "@/components/json-ld";

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

  return {
    title: uc.title,
    description: uc.description,
    alternates: { canonical: `/best-for/${usecase}` },
    openGraph: { title: `${uc.title} | OffGridEmpire`, description: uc.description, url: `/best-for/${usecase}` },
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

  // Sort by rating for this use case: excellent > good > fair > poor, then by trueCost
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

      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-[var(--text-muted)] mb-6">
        <Link href="/" className="hover:text-[var(--accent)] transition-colors">Home</Link>
        <span>/</span>
        <Link href="/kits" className="hover:text-[var(--accent)] transition-colors">Kits</Link>
        <span>/</span>
        <span className="text-[var(--text-secondary)]">{uc.h1}</span>
      </nav>

      {/* Header */}
      <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)] mb-3">
        {uc.h1}
      </h1>
      <p className="text-sm text-[var(--text-secondary)] leading-relaxed max-w-3xl mb-6">
        {uc.intro}
      </p>

      {/* Power requirements */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="rounded border border-[var(--border)] bg-[var(--bg-surface)] px-4 py-2.5">
          <p className="font-mono text-lg font-bold text-[var(--accent)]">
            {uc.dailyWh.toLocaleString()} Wh
          </p>
          <p className="text-xs text-[var(--text-muted)]">Daily Load</p>
        </div>
        <div className="rounded border border-[var(--border)] bg-[var(--bg-surface)] px-4 py-2.5">
          <p className="font-mono text-lg font-bold text-[var(--accent)]">
            {uc.peakW.toLocaleString()}W
          </p>
          <p className="text-xs text-[var(--text-muted)]">Peak Draw</p>
        </div>
        <div className="rounded border border-[var(--border)] bg-[var(--bg-surface)] px-4 py-2.5">
          <p className="font-mono text-lg font-bold text-[var(--accent)]">
            {excellent.length + good.length}
          </p>
          <p className="text-xs text-[var(--text-muted)]">Recommended Kits</p>
        </div>
      </div>

      {/* Tips */}
      <div className="rounded border border-[var(--border)] bg-[var(--bg-surface)] p-5 mb-8">
        <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-3">
          What to look for
        </h2>
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {uc.tips.map((tip) => (
            <li key={tip} className="flex items-start gap-2 text-sm text-[var(--text-secondary)]">
              <span className="text-[var(--accent)] mt-0.5">◈</span>
              {tip}
            </li>
          ))}
        </ul>
      </div>

      {/* Kit sections by rating */}
      {excellent.length > 0 && (
        <KitSection
          title="Excellent"
          subtitle="These kits meet or exceed all power requirements for this use case."
          kits={excellent}
          color="var(--success)"
        />
      )}
      {good.length > 0 && (
        <KitSection
          title="Good"
          subtitle="Solid options that cover most needs — may fall short on storage or inverter capacity."
          kits={good}
          color="var(--accent)"
        />
      )}
      {fair.length > 0 && (
        <KitSection
          title="Fair"
          subtitle="Usable with caveats — expect limitations in capacity or missing components."
          kits={fair}
          color="var(--text-muted)"
        />
      )}
      {poor.length > 0 && (
        <KitSection
          title="Not Recommended"
          subtitle="These kits lack the capacity or components needed for this use case."
          kits={poor}
          color="var(--danger)"
          collapsed
        />
      )}

      {/* Cross-links */}
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
        <span
          className="inline-block w-2.5 h-2.5 rounded-full"
          style={{ backgroundColor: color }}
        />
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
