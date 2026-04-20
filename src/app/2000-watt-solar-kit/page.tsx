import type { Metadata } from "next";
import { getKits } from "@/lib/get-kits";
import { HubPage, type HubConfig } from "@/components/hubs/hub-page";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "2000 Watt Solar Kit: Real Build Cost & Best Options",
  description:
    "2000W solar kits ranked by real build cost. Where 12V stops making sense, battery minimums, which kits ship incomplete, and budget picks at $1,500/$3,000/$6,000.",
  alternates: { canonical: "/2000-watt-solar-kit" },
  openGraph: {
    title: "2000 Watt Solar Kit: Real Build Cost & Best Options",
    description:
      "All 2000W solar kits compared by real build cost, with 12V→24V guidance and which builds still ship incomplete at this size.",
    url: "/2000-watt-solar-kit",
  },
};

const config: HubConfig = {
  slug: "2000-watt-solar-kit",
  title: "2000 Watt Solar Kit: Real Build Cost & Best Options",
  h1: "2000 Watt Solar Kit",
  metaDesc: "2000W solar kits ranked by real build cost.",
  summary:
    "A 2000W array produces 7–12kWh of usable energy per day, enough for a small cabin or a full-time van with AC. At this size, most 12V wiring starts hitting current limits and lithium batteries become mandatory. Every tracked 2000W kit ranked below by real build cost.",
  breadcrumbName: "2000 Watt Solar Kit",
  queryTopic: "2000 watt solar kit",
  topN: 8,
  selectKits: (all) =>
    all.filter((k) => k.panelWatts >= 1600 && k.panelWatts <= 2400),
  budgetTiers: [
    {
      budget: 1500,
      label: "Bare-Bones",
      note: "Panels + controller only — battery and inverter are a separate purchase.",
    },
    {
      budget: 3000,
      label: "Complete DIY",
      note: "Includes battery and inverter. Suitable for a small cabin or full-time van.",
    },
    {
      budget: 6000,
      label: "Expandable System",
      note: "Deep storage, stackable inverters, wired for 48V expansion.",
    },
  ],
  calculatorPresetUrl:
    "/calculator?v=1&step=1&l=led-light~6~6,mini-fridge~1~24,laptop~1~8,coffee-maker~1~0.5,wifi-router~1~24,box-fan~2~8",
  relatedCategoryHref: "/solar-kits",
  priceTierIntro:
    "2000W is the breakpoint where 12V starts making life hard — cable runs get thick, controllers overheat, and inverter current exceeds most DC breakers. Step-up buyers usually land at 24V and pay a $500–$1,000 premium over a cheap incomplete kit to get lithium storage and a pure-sine inverter.",
  overviewBullets: [
    "At 12V, 2000W of panels pulls ~160A — impractical. 24V is the sane default; 48V for runs over 30 ft.",
    "Minimum usable battery: 5kWh LiFePO4 for solo use, 10kWh+ for a couple or full cabin.",
    "Inverter: size for surge, not running — a 3,000W inverter handles most loads with a well pump or microwave.",
    "Many 'kits' at this size ship with panels + controller only — expect to buy battery + inverter separately for $1,500–$3,000 more.",
    "Roof area: ~105–120 sq ft for a 2000W array of residential-grade mono panels.",
  ],
};

export default function Page() {
  return <HubPage config={config} allKits={getKits()} />;
}
