import type { Metadata } from "next";
import { getKits } from "@/lib/get-kits";
import { HubPage, type HubConfig } from "@/components/hubs/hub-page";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Best RV Solar Kit (2026): Real Build Cost Comparison",
  description:
    "Top RV solar kits ranked by real build cost, completeness, and fit. Includes 12V vs 24V guidance, sticker-price traps, and budget picks at $500/$1,500/$3,000.",
  alternates: { canonical: "/best-rv-solar-kit" },
  openGraph: {
    title: "Best RV Solar Kit (2026): Real Build Cost Comparison",
    description:
      "RV solar kits ranked by real build cost. See hidden missing-part costs and what to buy at each budget.",
    url: "/best-rv-solar-kit",
  },
};

const config: HubConfig = {
  slug: "best-rv-solar-kit",
  title: "Best RV Solar Kit (2026): Real Build Cost Comparison",
  h1: "Best RV Solar Kit (2026)",
  metaDesc: "RV solar kits ranked by real build cost.",
  summary:
    "RV solar kits promise a turnkey install but most ship without batteries, inverters, or mounting hardware. We rank every kit with a proven RV use case by its real build cost — advertised price plus any required missing parts — so the cheapest sticker isn't automatically the cheapest rig.",
  breadcrumbName: "Best RV Solar Kit",
  queryTopic: "RV solar kit",
  topN: 7,
  selectKits: (all) =>
    all.filter(
      (k) =>
        (k.useCaseRatings?.rv === "excellent" || k.useCaseRatings?.rv === "good") &&
        k.systemType !== "whole-home" &&
        k.panelWatts > 0 &&
        k.panelWatts <= 1200
    ),
  budgetTiers: [
    {
      budget: 500,
      label: "Weekend / Overlander",
      note: "Minimal build for lights, phones, and a 12V fridge on short trips.",
    },
    {
      budget: 1500,
      label: "Full-Time Van",
      note: "Enough storage and solar to run a fridge, laptop, and fan daily.",
    },
    {
      budget: 3000,
      label: "Expedition / Class A",
      note: "Deep storage, inverter headroom, and multi-day autonomy.",
    },
  ],
  calculatorPresetUrl:
    "/calculator?v=1&step=1&l=led-light~4~5,phone-charger~2~2,laptop~1~4,12v-fan~1~6,mini-fridge~1~24",
  relatedCategoryHref: "/best-for/rv",
  relatedArticleHref: "/learn/portable-power-stations",
  priceTierIntro:
    "RV builds split into three rough tiers. Below $500 you're buying coverage for phones and lights; at $1,500 you get daily fridge + laptop headroom; above $3,000 you can run an induction cooktop or AC on battery for hours.",
  overviewBullets: [
    "12V is the default for most RVs; jump to 24V only when panels exceed ~600W or runs get long.",
    "Lithium (LiFePO4) is worth the premium — 3–5× the cycle life of lead-acid and 50% less weight.",
    "Portable suitcase panels beat roof-mount for shaded campsites; permanent roof-mount wins on highway days.",
    "The cheapest advertised kit is rarely the cheapest build — check 'hidden' column before you buy.",
    "If you boondock regularly, size battery at 2× daily load to survive one cloudy day without the truck alternator.",
  ],
};

export default function Page() {
  return <HubPage config={config} allKits={getKits()} />;
}
