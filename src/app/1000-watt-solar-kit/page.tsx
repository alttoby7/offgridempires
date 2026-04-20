import type { Metadata } from "next";
import { getKits } from "@/lib/get-kits";
import { HubPage, type HubConfig } from "@/components/hubs/hub-page";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "1000 Watt Solar Kit: Real Build Cost & Best Options",
  description:
    "1000W solar kits ranked by real build cost. What a 1000W system actually powers, 12V vs 24V guidance, starter-kit traps, and budget picks at $800/$1,500/$3,000.",
  alternates: { canonical: "/1000-watt-solar-kit" },
  openGraph: {
    title: "1000 Watt Solar Kit: Real Build Cost & Best Options",
    description:
      "All 1000W solar kits compared by real build cost, with what 1000W actually powers and how to avoid starter-kit traps.",
    url: "/1000-watt-solar-kit",
  },
};

const config: HubConfig = {
  slug: "1000-watt-solar-kit",
  title: "1000 Watt Solar Kit: Real Build Cost & Best Options",
  h1: "1000 Watt Solar Kit",
  metaDesc: "1000W solar kits ranked by real build cost.",
  summary:
    "A 1000W solar array can produce 3.5–6kWh per day depending on location, roughly enough to run a fridge, laptop, lights, and fans without grid power. We rank every tracked 1000W-class kit by real build cost so you see which ones actually deliver a working system and which leave out the expensive parts.",
  breadcrumbName: "1000 Watt Solar Kit",
  queryTopic: "1000 watt solar kit",
  topN: 7,
  selectKits: (all) =>
    all.filter((k) => k.panelWatts >= 800 && k.panelWatts <= 1250),
  budgetTiers: [
    {
      budget: 800,
      label: "Starter",
      note: "Panels + controller only — you'll still need battery, inverter, wiring.",
    },
    {
      budget: 1500,
      label: "Complete DIY",
      note: "Kits that include battery and inverter — plug-and-play ready.",
    },
    {
      budget: 3000,
      label: "High-Capacity Build",
      note: "Lithium storage, 3,000W+ inverter, multi-day autonomy.",
    },
  ],
  calculatorPresetUrl:
    "/calculator?v=1&step=1&l=led-light~4~6,wifi-router~1~24,mini-fridge~1~24,laptop~1~6,box-fan~1~6",
  relatedCategoryHref: "/solar-kits",
  priceTierIntro:
    "'1000W kit' means different things depending on what's in the box. Some sellers price panels-only at $800; complete kits with battery and inverter start closer to $1,500; high-capacity lithium builds push above $3,000. Real build cost is the only honest comparison.",
  overviewBullets: [
    "1000W of panels ≠ 1000W continuous AC output — inverter size matters more than panel size for what you can run.",
    "At 12V, 1000W of panels pulls ~80A — you need 4 AWG wire and proper fusing. Bump to 24V to halve that current.",
    "A 1000W array pairs sanely with a 2–3kWh lithium bank; anything smaller will bottleneck cloudy-day autonomy.",
    "'Starter kit' traps: if a 1000W kit prices under $800, check whether it ships a battery — most don't.",
    "Roof area: expect ~55 sq ft of panels for a 1000W array using modern mono panels.",
  ],
};

export default function Page() {
  return <HubPage config={config} allKits={getKits()} />;
}
