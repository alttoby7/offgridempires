/**
 * Generate the weekly price-drops RSS feed -> public/this-week/feed.xml
 * Run during build (after generate-sitemap). Backbone for syndication: RSS
 * readers, n8n/Zapier social fan-out, and anyone who wants drops without email.
 *
 * Items:
 *  - A rolling "current week" item built from live top drops (refreshed every
 *    deploy / 6h pipeline), described by data/weekly-paragraph.md when it's real.
 *  - One item per real weekly-archive issue (placeholder-paragraph issues skipped).
 */
import * as fs from "fs";
import * as path from "path";
import { getTopPriceDrops } from "../src/lib/price-drops";

const SITE_URL = "https://offgridempire.com";
const ARCHIVE_DIR = path.join(__dirname, "../public/data/weekly-archive");
const PARAGRAPH_FILE = path.join(__dirname, "../data/weekly-paragraph.md");
const OUT = path.join(__dirname, "../public/this-week/feed.xml");

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const isPlaceholder = (p: string) => !p || p.trim().startsWith("[");
const dollars = (cents: number) => `$${Math.round(cents / 100).toLocaleString()}`;

interface FeedItem { title: string; link: string; guid: string; pubDate: string; description: string; }

function dropsToHtml(drops: { brand?: string; name?: string; dropPercent: number; dropCents: number; currentPriceCents: number; url?: string; gapInsight?: string }[]): string {
  const li = drops.slice(0, 10).map((d) => {
    const label = `${d.brand ?? ""} ${d.name ?? ""}`.trim() || "Kit";
    const href = d.url?.startsWith("http") ? d.url : `${SITE_URL}${d.url ?? "/this-week/"}`;
    const gap = d.gapInsight ? ` — ${esc(d.gapInsight)}` : "";
    return `<li>${Math.round(d.dropPercent)}% off (${dollars(d.dropCents)}) <a href="${esc(href)}">${esc(label)}</a> now ${dollars(d.currentPriceCents)}${gap}</li>`;
  }).join("");
  return `<ul>${li}</ul>`;
}

function currentItem(): FeedItem | null {
  const drops = getTopPriceDrops({ limit: 10, minDropCents: 2000, windowDays: 7 });
  if (drops.length === 0) return null;
  let para = "";
  try { para = fs.readFileSync(PARAGRAPH_FILE, "utf-8"); } catch { /* none */ }
  const intro = isPlaceholder(para) ? "" : `<p>${esc(para.trim())}</p>`;
  const enriched = drops.map((d) => { const k = (d as { kit?: { brand?: string; displayName?: string; name?: string; slug?: string } }).kit; return { brand: k?.brand, name: k?.displayName ?? k?.name, dropPercent: d.dropPercent, dropCents: d.dropCents, currentPriceCents: d.currentPriceCents, url: k?.slug ? `/kits/${k.slug}/` : "/this-week/", gapInsight: (d as { gapInsight?: string }).gapInsight }; });
  const week = new Date().toISOString().split("T")[0];
  return {
    title: `Off-Grid Solar Price Drops — week of ${week}`,
    link: `${SITE_URL}/this-week/`,
    guid: `${SITE_URL}/this-week/#${week}`,
    pubDate: new Date().toUTCString(),
    description: `${intro}${dropsToHtml(enriched)}`,
  };
}

function archiveItems(): FeedItem[] {
  let dates: string[] = [];
  try { dates = JSON.parse(fs.readFileSync(path.join(ARCHIVE_DIR, "index.json"), "utf-8")); } catch { return []; }
  const items: FeedItem[] = [];
  for (const date of dates.sort().reverse()) {
    try {
      const issue = JSON.parse(fs.readFileSync(path.join(ARCHIVE_DIR, `${date}.json`), "utf-8"));
      if (isPlaceholder(issue.paragraph)) continue; // skip un-edited issues
      const intro = `<p>${esc(String(issue.paragraph).trim())}</p>`;
      items.push({
        title: `Off-Grid Solar Price Drops — ${date}`,
        link: `${SITE_URL}/this-week/archive/${date}/`,
        guid: `${SITE_URL}/this-week/archive/${date}/`,
        pubDate: new Date(`${date}T13:00:00Z`).toUTCString(),
        description: `${intro}${dropsToHtml(issue.drops ?? [])}`,
      });
    } catch { /* skip */ }
  }
  return items;
}

function build() {
  const items = [currentItem(), ...archiveItems()].filter(Boolean) as FeedItem[];
  const xmlItems = items.map((it) => `    <item>
      <title>${esc(it.title)}</title>
      <link>${esc(it.link)}</link>
      <guid isPermaLink="false">${esc(it.guid)}</guid>
      <pubDate>${it.pubDate}</pubDate>
      <description>${esc(it.description)}</description>
    </item>`).join("\n");
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>OffGridEmpire — Weekly Off-Grid Solar Price Drops</title>
    <link>${SITE_URL}/this-week/</link>
    <atom:link href="${SITE_URL}/this-week/feed.xml" rel="self" type="application/rss+xml"/>
    <description>The biggest verified price drops across 400+ off-grid solar kits, with real build cost and missing-component flags. Updated weekly.</description>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${xmlItems}
  </channel>
</rss>
`;
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, xml);
  console.log(`Feed generated: ${items.length} item(s) -> ${OUT}`);
}

build();
