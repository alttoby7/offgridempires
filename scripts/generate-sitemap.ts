/**
 * Generate sitemap.xml for OffGridEmpire.
 * Run before build: npx tsx scripts/generate-sitemap.ts
 */

import * as fs from "fs";
import * as path from "path";
import { articles } from "../src/content/article-registry";
import { decisionGuides } from "../src/content/decision-guide-registry";
import { getPrimaryKitSlugs } from "../src/lib/get-kits";
import { isIndexablePath } from "../src/lib/index-manifest";

const SITE_URL = "https://offgridempire.com";
const today = new Date().toISOString().split("T")[0];

interface SitemapEntry {
  loc: string;
  lastmod?: string;
  changefreq?: string;
  priority?: number;
}

function loadKits(): { slug: string; brand: string; lastObserved: string }[] {
  try {
    const data = JSON.parse(
      fs.readFileSync(path.join(__dirname, "../src/lib/data/kits.json"), "utf-8")
    );
    // Only emit ONE primary URL per variant group — non-primary variants are
    // noindex'd, so they must not appear in the sitemap.
    const primarySlugs = new Set(getPrimaryKitSlugs());
    return data
      .filter((k: { slug: string; listedPrice?: number }) => k.listedPrice && k.listedPrice > 0)
      .filter((k: { slug: string }) => primarySlugs.has(k.slug))
      .map((k: { slug: string; brand: string; priceObservedAt?: string; priceHistory?: { date: string }[] }) => {
        // Use the most recent real observation date — fall back to priceObservedAt or today
        let lastObserved = today;
        if (k.priceHistory && k.priceHistory.length > 0) {
          const latest = k.priceHistory
            .map((p) => p.date)
            .sort()
            .reverse()[0];
          if (latest) lastObserved = latest.split("T")[0];
        } else if (k.priceObservedAt) {
          lastObserved = k.priceObservedAt.split("T")[0];
        }
        return { slug: k.slug, brand: k.brand, lastObserved };
      });
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
  entries.push({ loc: "/tools/battery-sizing-calculator", changefreq: "weekly", priority: 0.9, lastmod: today });

  // Weekly price-drops index — refreshed every 6h via pipeline
  entries.push({ loc: "/this-week", changefreq: "daily", priority: 0.9, lastmod: today });
  entries.push({ loc: "/this-week/archive", changefreq: "weekly", priority: 0.7, lastmod: today });

  // Per-issue archive snapshots
  try {
    const archiveIndexPath = path.join(__dirname, "../public/data/weekly-archive/index.json");
    if (fs.existsSync(archiveIndexPath)) {
      const dates: string[] = JSON.parse(fs.readFileSync(archiveIndexPath, "utf-8"));
      for (const date of dates) {
        entries.push({
          loc: `/this-week/archive/${date}`,
          changefreq: "yearly",
          priority: 0.5,
          lastmod: date,
        });
      }
    }
  } catch {
    // ignore — first run or missing file
  }

  // Demand-matched hubs (ranked tables, cohort value calls) — 0.9
  entries.push({ loc: "/best-rv-solar-kit", changefreq: "weekly", priority: 0.9, lastmod: today });
  entries.push({ loc: "/1000-watt-solar-kit", changefreq: "weekly", priority: 0.9, lastmod: today });
  entries.push({ loc: "/2000-watt-solar-kit", changefreq: "weekly", priority: 0.9, lastmod: today });
  entries.push({ loc: "/best-solar-generator-under-500", changefreq: "weekly", priority: 0.9, lastmod: today });

  // Secondary tool/aggregate pages — 0.7
  entries.push({ loc: "/compare", changefreq: "weekly", priority: 0.7, lastmod: today });
  entries.push({ loc: "/learn", changefreq: "weekly", priority: 0.7, lastmod: today });

  // Trust/static — 0.5
  entries.push({ loc: "/methodology", changefreq: "monthly", priority: 0.5, lastmod: today });
  entries.push({ loc: "/how-real-build-cost-is-calculated", changefreq: "monthly", priority: 0.7, lastmod: today });
  entries.push({ loc: "/data-sources", changefreq: "monthly", priority: 0.5, lastmod: today });
  entries.push({ loc: "/editorial-policy", changefreq: "monthly", priority: 0.5, lastmod: today });
  entries.push({ loc: "/reports", changefreq: "monthly", priority: 0.6, lastmod: today });
  entries.push({ loc: "/reports/state-of-off-grid-solar-pricing-2026", changefreq: "monthly", priority: 0.8, lastmod: today });
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
      lastmod: kit.lastObserved,
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

  // Decision guides — only the human-approved (indexable) ones survive the
  // isIndexablePath filter below; noindex drafts render but stay out of sitemap.
  for (const g of decisionGuides) {
    entries.push({
      loc: `/guides/${g.slug}`,
      changefreq: "weekly",
      priority: 0.8,
      lastmod: (g.updatedAt || today).split("T")[0],
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

// INDEX GOVERNOR: emit ONLY URLs the manifest approves (and only kit pages that
// pass the quality gate). Everything else — thin brand/category/budget/archive
// pages, non-kept hubs/learn/best-for — is dropped from the sitemap (and renders
// noindex,follow). This is what takes the sitemap 197 → ~25-40.
const allEntries = buildEntries();
const entries = allEntries.filter((e) => isIndexablePath(e.loc));
const xml = toXml(entries);
const outPath = path.join(__dirname, "../public/sitemap.xml");
fs.writeFileSync(outPath, xml);
console.log(
  `Sitemap generated: ${entries.length} URLs (governed; dropped ${allEntries.length - entries.length} non-indexable) → ${outPath}`
);
