import type { Metadata } from "next";
import { getKits } from "@/lib/get-kits";
import { HubPage, type HubConfig } from "@/components/hubs/hub-page";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Best Solar Generator Under $500: Real Build Cost Ranked",
  description:
    "Sub-$500 solar generators ranked by real build cost, $/Wh, output, and recharge speed. Includes which bundles hide panel upsells and which are truly complete.",
  alternates: { canonical: "/best-solar-generator-under-500" },
  openGraph: {
    title: "Best Solar Generator Under $500: Real Build Cost Ranked",
    description:
      "Sub-$500 solar generators ranked with honest $/Wh math and panel-bundle transparency.",
    url: "/best-solar-generator-under-500",
  },
};

const config: HubConfig = {
  slug: "best-solar-generator-under-500",
  title: "Best Solar Generator Under $500: Real Build Cost Ranked",
  h1: "Best Solar Generator Under $500",
  metaDesc: "Sub-$500 solar generators ranked by real build cost.",
  summary:
    "Under $500, you're buying a 500–1,000Wh portable power station — enough for a weekend of phone charging, a CPAP, and a mini fridge for a few hours. The brands compete on $/Wh, inverter output, and whether a solar panel is actually in the box. Below, every tracked sub-$500 unit ranked by real build cost.",
  breadcrumbName: "Best Solar Generator Under $500",
  queryTopic: "solar generator under $500",
  topN: 8,
  selectKits: (all) =>
    all.filter(
      (k) =>
        k.systemType === "portable" &&
        k.trueCost > 0 &&
        k.trueCost <= 500 &&
        k.storageWh > 0
    ),
  budgetTiers: [
    {
      budget: 250,
      label: "Emergency-Only",
      note: "300–500Wh units for phones, lights, a CPAP on short outages.",
    },
    {
      budget: 350,
      label: "Weekend Camper",
      note: "500–800Wh with a higher-output inverter for small appliances.",
    },
    {
      budget: 500,
      label: "Multi-Day Prepper",
      note: "~1kWh lithium storage and a real panel bundle for recharge.",
    },
  ],
  calculatorPresetUrl:
    "/calculator?v=1&step=1&l=led-light~3~4,phone-charger~2~2,cpap~1~8,mini-fridge~1~12",
  relatedCategoryHref: "/portable-power",
  priceTierIntro:
    "$500 is the sweet spot where LiFePO4 chemistry starts showing up — longer-lasting than older Li-ion packs. Sub-$300 units are fine for outage coverage but have fewer cycles; $400–$500 buys a unit you can run a fridge on daily for a weekend trip.",
  overviewBullets: [
    "$/Wh is the right value metric — $0.50/Wh is excellent at this price, $0.80/Wh is the ceiling.",
    "LiFePO4 (lithium iron phosphate) cycles 3,000+ times. Older NMC chemistry stops at ~500 cycles — check the spec before buying.",
    "Most sub-$500 bundles don't ship a solar panel. Read the real build cost column — kits with 'panels: included' are genuinely turnkey.",
    "Inverter output matters: 300W runs a CPAP + phone charger; 600W+ runs a coffee maker or small fridge.",
    "Pass-through charging lets you run loads while recharging — verify this spec if you plan to use the unit as an UPS.",
  ],
};

export default function Page() {
  return <HubPage config={config} allKits={getKits()} />;
}
