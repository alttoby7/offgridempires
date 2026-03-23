/**
 * Export database data to static JSON files for the static site build.
 * Run this before `next build` to get fresh data from the DB.
 *
 * Usage: npx tsx scripts/export-data.ts
 *
 * Outputs:
 *   src/lib/data/kits.json — all kit listing data
 */

import * as dotenv from "dotenv";
import * as path from "path";
import * as fs from "fs";

// Load env BEFORE importing DB modules
dotenv.config({ path: path.resolve(__dirname, "../../../google-drive/0-AI/.env") });

import { getKitsForListingWithHistory, getPriceHistoryBySeries } from "../src/lib/db/queries";

async function main() {
  console.log("Exporting kit data from database...");

  const kits = await getKitsForListingWithHistory("rv-weekend");
  console.log(`  Found ${kits.length} kits`);

  const outDir = path.join(__dirname, "../src/lib/data");
  fs.mkdirSync(outDir, { recursive: true });

  const outPath = path.join(outDir, "kits.json");
  fs.writeFileSync(outPath, JSON.stringify(kits, null, 2));
  console.log(`  Written to ${outPath}`);

  // Export per-kit price history series for multi-retailer chart
  const historyDir = path.join(__dirname, "../public/data/history");
  fs.mkdirSync(historyDir, { recursive: true });

  let historyWritten = 0;
  for (const kit of kits) {
    const history = await getPriceHistoryBySeries(kit.id);
    if (!history) continue;

    // Need at least 2 total data points to be worth showing
    const totalPoints = history.series.reduce((sum, s) => sum + s.points.length, 0);
    if (totalPoints < 2) continue;

    // Store slug in history file (not kitId UUID)
    history.slug = kit.slug;
    const histPath = path.join(historyDir, `${kit.slug}.json`);
    fs.writeFileSync(histPath, JSON.stringify(history));
    historyWritten++;
  }
  console.log(`  Written ${historyWritten} history files to public/data/history/`);

  console.log("Export complete!");
  process.exit(0);
}

main().catch((err) => {
  console.error("Export failed:", err);
  process.exit(1);
});
