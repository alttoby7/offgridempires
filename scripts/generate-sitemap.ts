/**
 * Generate sitemap.xml for OffGridEmpire.
 * Run before build: npx tsx scripts/generate-sitemap.ts
 */

import * as fs from "fs";
import * as path from "path";
import { articles } from "../src/content/article-registry";

const SITE_URL = "https://offgridempire.com";
const today = new Date().toISOString().split("T")[0];

interface SitemapEntry {
  loc: string;
  lastmod?: string;
  changefreq?: string;
  priority?: number;
}

function loadKits(): { slug: string; brand: string }[] {
  try {
    const data = JSON.parse(
      fs.readFileSync(path.join(__dirname, "../src/lib/data/kits.json"), "utf-8")
    );
    return data
      .filter((k: { slug: string; listedPrice?: number }) => k.listedPrice && k.listedPrice > 0)
      .map((k: { slug: string; brand: string }) => ({ slug: k.slug, brand: k.brand }));
  } catch {
    return [];
  }
}

function brandSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

const categories = [
  "batteries",
  "panels",
  "charge-controllers",
  "inverters",
  "power-stations",
  "generators",
];

const useCases = ["rv", "cabin", "shed", "emergency", "homestead", "boat"];
const budgets = ["under-500", "under-1000", "under-2000", "under-3000", "under-4000"];

function buildEntries(): SitemapEntry[] {
  const entries: SitemapEntry[] = [];

  // Homepage — singular priority 1.0
  entries.push({ loc: "/", changefreq: "daily", priority: 1.0, lastmod: today });

  // Hubs — 0.9
  entries.push({ loc: "/kits", changefreq: "daily", priority: 0.9, lastmod: today });
  entries.push({ loc: "/calculator", changefreq: "weekly", priority: 0.9, lastmod: today });
  entries.push({ loc: "/portable-power", changefreq: "weekly", priority: 0.9, lastmod: today });
  entries.push({ loc: "/whole-home", changefreq: "weekly", priority: 0.9, lastmod: today });
  entries.push({ loc: "/solar-kits", changefreq: "weekly", priority: 0.9, lastmod: today });
  entries.push({ loc: "/products", changefreq: "weekly", priority: 0.9, lastmod: today });
  entries.push({ loc: "/tools/shed-solar-calculator", changefreq: "weekly", priority: 0.9, lastmod: today });

  // Secondary tool/aggregate pages — 0.7
  entries.push({ loc: "/compare", changefreq: "weekly", priority: 0.7, lastmod: today });
  entries.push({ loc: "/learn", changefreq: "weekly", priority: 0.7, lastmod: today });

  // Trust/static — 0.5
  entries.push({ loc: "/methodology", changefreq: "monthly", priority: 0.5, lastmod: today });
  entries.push({ loc: "/about", changefreq: "monthly", priority: 0.5, lastmod: today });
  entries.push({ loc: "/contact", changefreq: "monthly", priority: 0.4, lastmod: today });
  entries.push({ loc: "/affiliate-disclosure", changefreq: "monthly", priority: 0.4, lastmod: today });
  entries.push({ loc: "/privacy", changefreq: "monthly", priority: 0.3, lastmod: today });
  entries.push({ loc: "/terms", changefreq: "monthly", priority: 0.3, lastmod: today });

  // Kits + brands
  const kits = loadKits();
  for (const kit of kits) {
    entries.push({
      loc: `/kits/${kit.slug}`,
      changefreq: "daily",
      priority: 0.6,
      lastmod: today,
    });
  }

  // Brand landing pages
  const uniqueBrands = [...new Set(kits.map((k) => brandSlug(k.brand)))];
  for (const b of uniqueBrands) {
    entries.push({
      loc: `/brands/${b}`,
      changefreq: "weekly",
      priority: 0.7,
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

  // Best-for use-case pages
  for (const uc of useCases) {
    entries.push({
      loc: `/best-for/${uc}`,
      changefreq: "weekly",
      priority: 0.7,
      lastmod: today,
    });
  }

  // Budget landing pages
  for (const b of budgets) {
    entries.push({
      loc: `/solar-kits/${b}`,
      changefreq: "weekly",
      priority: 0.7,
      lastmod: today,
    });
  }

  // Learn articles
  for (const article of articles) {
    const priority =
      article.pageType === "pillar"
        ? 0.8
        : article.pageType === "cluster"
          ? 0.7
          : 0.6;
    entries.push({
      loc: `/learn/${article.slug}`,
      changefreq: "weekly",
      priority,
      lastmod: article.publishedAt || today,
    });
  }
  entries.push({ loc: "/learn/watts-to-kilowatts", changefreq: "weekly", priority: 0.7, lastmod: today });

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
