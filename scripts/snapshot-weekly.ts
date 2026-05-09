#!/usr/bin/env tsx
/**
 * Weekly snapshot generator. Run every Tuesday by cron.
 *
 * Reads:
 *   - src/lib/data/kits.json
 *   - data/weekly-paragraph.md (optional human intro)
 *
 * Writes:
 *   - public/data/weekly-archive/YYYY-MM-DD.json (the archive payload)
 *   - public/data/weekly-archive/index.json (list of snapshot dates, newest first)
 *
 * The Python sender script reads the latest YYYY-MM-DD.json to build emails.
 */

import * as fs from "fs";
import * as path from "path";
import { getTopPriceDrops } from "../src/lib/price-drops";

const ARCHIVE_DIR = path.join(__dirname, "../public/data/weekly-archive");
const PARAGRAPH_PATH = path.join(__dirname, "../data/weekly-paragraph.md");

function todayISO(): string {
  return new Date().toISOString().split("T")[0];
}

function readParagraph(): string {
  if (!fs.existsSync(PARAGRAPH_PATH)) return "";
  return fs.readFileSync(PARAGRAPH_PATH, "utf-8").trim();
}

function gapInsight(kit: { missingCost: number; included: Record<string, boolean> }): string {
  const missingRoles: string[] = [];
  if (kit.included.panels === false) missingRoles.push("panels");
  if (kit.included.battery === false) missingRoles.push("battery");
  if (kit.included.inverter === false) missingRoles.push("inverter");
  if (kit.included.mounting === false) missingRoles.push("mounting");
  if (kit.included.controller === false) missingRoles.push("charge controller");

  if (missingRoles.length === 0) return "Complete kit — no hidden parts.";
  if (kit.missingCost > 0) {
    const list =
      missingRoles.length === 1
        ? missingRoles[0]
        : missingRoles.length === 2
          ? `${missingRoles[0]} and ${missingRoles[1]}`
          : `${missingRoles[0]}, ${missingRoles[1]}, and ${missingRoles.length - 2} more`;
    return `Still needs ${list} — ~$${kit.missingCost.toLocaleString("en-US")} extra.`;
  }
  return `${missingRoles.length} component role${missingRoles.length > 1 ? "s" : ""} not included.`;
}

function main() {
  fs.mkdirSync(ARCHIVE_DIR, { recursive: true });

  const drops = getTopPriceDrops({ limit: 15, minDropCents: 2000, windowDays: 7 });
  const date = todayISO();

  const payload = {
    date,
    paragraph: readParagraph(),
    drops: drops.map((d, i) => ({
      rank: i + 1,
      slug: d.kit.slug,
      brand: d.kit.brand,
      name: d.kit.displayName ?? d.kit.name,
      retailer: d.kit.retailer,
      currentPriceCents: d.currentPriceCents,
      previousPriceCents: d.previousPriceCents,
      dropCents: d.dropCents,
      dropPercent: d.dropPercent,
      observedDate: d.observedDate,
      daysAgo: d.daysAgo,
      gapInsight: gapInsight({ missingCost: d.kit.missingCost, included: d.kit.included }),
      url: `https://offgridempire.com/kits/${d.kit.slug}/`,
    })),
  };

  const outPath = path.join(ARCHIVE_DIR, `${date}.json`);
  fs.writeFileSync(outPath, JSON.stringify(payload, null, 2));

  // Update index
  const indexPath = path.join(ARCHIVE_DIR, "index.json");
  let dates: string[] = [];
  if (fs.existsSync(indexPath)) {
    try {
      dates = JSON.parse(fs.readFileSync(indexPath, "utf-8"));
    } catch {
      dates = [];
    }
  }
  if (!dates.includes(date)) dates.unshift(date);
  dates.sort().reverse();
  fs.writeFileSync(indexPath, JSON.stringify(dates, null, 2));

  console.log(`Weekly snapshot saved: ${outPath} (${drops.length} drops)`);
}

main();
