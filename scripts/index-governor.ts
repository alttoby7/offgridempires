/**
 * INDEX GOVERNOR — build-time guardrail.
 *
 * Runs FIRST in the build (before sitemap/next build). It:
 *   1. Resolves the full approved indexable surface = the static allowlist in
 *      src/lib/index-manifest.ts + the kit pages that pass the quality gate in
 *      get-kits.ts (complete systems only).
 *   2. Writes src/lib/data/index-manifest.json — the materialized list, for
 *      human review in PRs (so a reviewer sees exactly which URLs are indexed).
 *   3. HARD-FAILS the build (exit 1) if the resolved set exceeds INDEX_CEILING
 *      or is implausibly small — so the index can never silently balloon back
 *      to the hundreds of thin pages that got the domain demoted, nor collapse
 *      to nothing on a data accident.
 *
 * Deterministic: sorted, no timestamp, so an unchanged data set produces a
 * byte-identical manifest (no pipeline commit churn).
 */

import * as fs from "fs";
import * as path from "path";
import {
  INDEXABLE_PATHS,
  INDEX_CEILING,
} from "../src/lib/index-manifest";
import { getIndexableKitSlugs } from "../src/lib/get-kits";
import { getIndexableDecisionGuideSlugs } from "../src/content/decision-guide-registry";

const FLOOR = 15; // sanity floor — fewer than this means the data/gate broke

const staticPaths = [...INDEXABLE_PATHS].sort();
const kitSlugs = getIndexableKitSlugs().sort();
const kitPaths = kitSlugs.map((s) => `/kits/${s}`);
// Decision guides count against the ceiling only once a human flips `indexable`.
const guidePaths = getIndexableDecisionGuideSlugs().sort().map((s) => `/guides/${s}`);
const total = staticPaths.length + kitPaths.length + guidePaths.length;

const manifest = {
  ceiling: INDEX_CEILING,
  counts: {
    total,
    static: staticPaths.length,
    kits: kitPaths.length,
    guides: guidePaths.length,
  },
  static: staticPaths,
  kits: kitPaths,
  guides: guidePaths,
};

const outPath = path.join(__dirname, "../src/lib/data/index-manifest.json");
fs.writeFileSync(outPath, JSON.stringify(manifest, null, 2) + "\n");

console.log(
  `Index governor: ${total} indexable URLs (${staticPaths.length} static + ${kitPaths.length} kit + ${guidePaths.length} guide) → ${outPath}`
);

if (total > INDEX_CEILING) {
  console.error(
    `\n✗ INDEX GOVERNOR FAILED: ${total} indexable URLs exceeds the ceiling of ${INDEX_CEILING}.\n` +
      `  The indexable surface may only grow by human approval (edit src/lib/index-manifest.ts).\n` +
      `  This guard exists because mass page growth is what got the domain demoted.\n`
  );
  process.exit(1);
}

if (total < FLOOR) {
  console.error(
    `\n✗ INDEX GOVERNOR FAILED: only ${total} indexable URLs (< floor ${FLOOR}).\n` +
      `  The kit quality gate or kits.json likely broke — refusing to ship a near-empty index.\n`
  );
  process.exit(1);
}

console.log(`✓ Index governor OK (ceiling ${INDEX_CEILING}, floor ${FLOOR}).`);
