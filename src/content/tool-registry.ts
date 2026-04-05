/**
 * Tool page registry for cross-linking from /learn articles.
 * Maps topic keywords to relevant tool pages on the site.
 */

export interface ToolLink {
  keywords: string[];
  href: string;
  label: string;
  description: string;
}

export const toolLinks: ToolLink[] = [
  {
    keywords: ["compare", "vs", "versus", "side-by-side"],
    href: "/compare",
    label: "Compare Kits",
    description: "Side-by-side kit comparison tool",
  },
  {
    keywords: ["calculator", "sizing", "how much", "size my system", "watts"],
    href: "/calculator",
    label: "Size My System",
    description: "Solar system sizing calculator",
  },
  {
    keywords: ["kit", "kits", "solar kit", "all kits"],
    href: "/kits",
    label: "Browse All Kits",
    description: "Full kit listing with filters",
  },
  {
    keywords: ["battery", "batteries", "lifepo4", "agm", "lithium"],
    href: "/categories/batteries",
    label: "Browse Batteries",
    description: "Battery category page",
  },
  {
    keywords: ["panel", "panels", "solar panel", "solar panels"],
    href: "/categories/panels",
    label: "Browse Panels",
    description: "Solar panel category page",
  },
  {
    keywords: ["inverter", "inverters", "pure sine", "power conversion"],
    href: "/categories/inverters",
    label: "Browse Inverters",
    description: "Inverter category page",
  },
  {
    keywords: ["charge controller", "mppt", "pwm", "controller"],
    href: "/categories/charge-controllers",
    label: "Browse Charge Controllers",
    description: "Charge controller category page",
  },
  {
    keywords: ["portable", "power station", "generator"],
    href: "/portable-power",
    label: "Portable Power",
    description: "Portable power station listings",
  },
  {
    keywords: ["rv", "van", "camper", "van life"],
    href: "/best-for/rv",
    label: "RV & Van Solar",
    description: "Kits rated for RV and van life",
  },
  {
    keywords: ["cabin", "off-grid cabin"],
    href: "/best-for/cabin",
    label: "Cabin Solar",
    description: "Kits rated for cabin use",
  },
  {
    keywords: ["shed", "workshop"],
    href: "/best-for/shed",
    label: "Shed Solar",
    description: "Kits rated for shed and workshop",
  },
  {
    keywords: ["emergency", "backup", "power outage"],
    href: "/best-for/emergency",
    label: "Emergency Backup",
    description: "Kits rated for emergency use",
  },
  {
    keywords: ["homestead", "off-grid home"],
    href: "/best-for/homestead",
    label: "Homestead Solar",
    description: "Kits rated for homestead use",
  },
  {
    keywords: ["methodology", "how we score", "real build cost"],
    href: "/methodology",
    label: "Our Methodology",
    description: "How we calculate real build cost",
  },
];

/**
 * Find the most relevant tool pages for a given topic.
 */
export function findToolLinks(topic: string, max = 3): ToolLink[] {
  const topicLower = topic.toLowerCase();
  const scored = toolLinks.map((link) => {
    const matches = link.keywords.filter((kw) => topicLower.includes(kw));
    return { link, score: matches.length };
  });
  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, max)
    .map((s) => s.link);
}
