/**
 * Generate sitemap.xml for OffGridEmpire.
 * Run before build: npx tsx scripts/generate-sitemap.ts
 */

import * as fs from "fs";
import * as path from "path";

const SITE_URL = "https://offgridempire.com";
const today = new Date().toISOString().split("T")[0];

interface SitemapEntry {
  loc: string;
  lastmod?: string;
  changefreq?: string;
  priority?: number;
}

function loadKitSlugs(): string[] {
  try {
    const data = JSON.parse(
      fs.readFileSync(path.join(__dirname, "../src/lib/data/kits.json"), "utf-8")
    );
    return data.map((k: { slug: string }) => k.slug);
  } catch {
    // Fall back to demo data slugs
    return [
      "renogy-400w-complete-lifepo4",
      "eco-worthy-200w-starter",
      "ecoflow-delta-pro-400w",
      "bluetti-ac300-b300-pv350",
      "windynation-400w-complete",
      "renogy-800w-cabin-kit",
    ];
  }
}

const categories = [
  "batteries",
  "panels",
  "charge-controllers",
  "inverters",
  "power-stations",
  "generators",
];

function buildEntries(): SitemapEntry[] {
  const entries: SitemapEntry[] = [];

  // Static pages
  entries.push({ loc: "/", changefreq: "daily", priority: 1.0, lastmod: today });
  entries.push({ loc: "/kits", changefreq: "daily", priority: 0.9, lastmod: today });
  entries.push({ loc: "/compare", changefreq: "weekly", priority: 0.8, lastmod: today });
  entries.push({ loc: "/products", changefreq: "weekly", priority: 0.7, lastmod: today });
  entries.push({ loc: "/calculator", changefreq: "weekly", priority: 0.8, lastmod: today });
  entries.push({ loc: "/methodology", changefreq: "monthly", priority: 0.5, lastmod: today });

  // Kit detail pages
  const kitSlugs = loadKitSlugs();
  for (const slug of kitSlugs) {
    entries.push({
      loc: `/kits/${slug}`,
      changefreq: "daily",
      priority: 0.8,
      lastmod: today,
    });
  }

  // Category pages
  for (const cat of categories) {
    entries.push({
      loc: `/categories/${cat}`,
      changefreq: "weekly",
      priority: 0.7,
      lastmod: today,
    });
  }

  return entries;
}

function toXml(entries: SitemapEntry[]): string {
  const urls = entries
    .map(
      (e) =>
        `  <url>
    <loc>${SITE_URL}${e.loc}</loc>${e.lastmod ? `\n    <lastmod>${e.lastmod}</lastmod>` : ""}${e.changefreq ? `\n    <changefreq>${e.changefreq}</changefreq>` : ""}${e.priority !== undefined ? `\n    <priority>${e.priority.toFixed(1)}</priority>` : ""}
  </url>`
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;
}

const entries = buildEntries();
const xml = toXml(entries);
const outPath = path.join(__dirname, "../public/sitemap.xml");
fs.writeFileSync(outPath, xml);
console.log(`Sitemap generated: ${entries.length} URLs → ${outPath}`);
