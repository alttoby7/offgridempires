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

import { getKitsForListingWithHistory } from "../src/lib/db/queries";

async function main() {
  console.log("Exporting kit data from database...");

  const kits = await getKitsForListingWithHistory("rv-weekend");
  console.log(`  Found ${kits.length} kits`);

  const outDir = path.join(__dirname, "../src/lib/data");
  fs.mkdirSync(outDir, { recursive: true });

  const outPath = path.join(outDir, "kits.json");
  fs.writeFileSync(outPath, JSON.stringify(kits, null, 2));
  console.log(`  Written to ${outPath}`);

  console.log("Export complete!");
  process.exit(0);
}

main().catch((err) => {
  console.error("Export failed:", err);
  process.exit(1);
});
