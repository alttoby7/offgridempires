#!/usr/bin/env tsx
/**
 * Decision-guide validator + drift lint.
 *
 * Two jobs, both run before `next build`:
 *   1. VALIDATE — resolve every guide via getResolvedDecisionGuide(). This
 *      exercises strict podium resolution + fail-loud token resolution, so a
 *      missing kit, a delisted price, a typo'd token, or an unknown field is a
 *      hard error. Also asserts no `{…}` / `[[const:…]]` markers survive.
 *   2. LINT — scan the RAW prose for "naked" money literals ($… or …/Wh) that
 *      are neither a {token} nor a [[const:…]] escape. A naked $-literal is how
 *      prose silently drifts from the price cron. (Watts are static specs and
 *      out of scope for Phase 1.)
 *
 * Usage:
 *   npx tsx scripts/validate-decision-guides.ts            # report-only
 *   npx tsx scripts/validate-decision-guides.ts --strict   # nonzero exit on lint hits
 * Resolution errors ALWAYS fail (exit 1), strict or not.
 */

import {
  getDecisionGuide,
  getDecisionGuideSlugs,
} from "../src/content/decision-guide-registry";
import { getResolvedDecisionGuide } from "../src/lib/decision/resolve";
import type { DecisionGuideMeta } from "../src/lib/decision/types";

const STRICT = process.argv.includes("--strict");

/** Naked money literals that should be a {token} or [[const:…]] instead. */
const MONEY = /\$\d[\d,]*(?:\.\d+)?/g; // $899, $1,299, $0.49
const PER_WH = /\d[\d.,]*\s*\/\s*Wh\b/gi; // 0.49/Wh

interface Field {
  path: string;
  text: string;
}

function managedFields(m: DecisionGuideMeta): Field[] {
  const f: Field[] = [
    { path: "answer", text: m.answer },
    { path: "metaDescription", text: m.metaDescription },
    { path: "cohortLabel", text: m.cohortLabel },
  ];
  if (m.receiptNote) f.push({ path: "receiptNote", text: m.receiptNote });
  m.picks.forEach((p, i) => {
    f.push({ path: `picks[${i}].label`, text: p.label });
    f.push({ path: `picks[${i}].rationale`, text: p.rationale });
  });
  m.sections.forEach((s, i) => {
    f.push({ path: `sections[${i}].heading`, text: s.heading });
    f.push({ path: `sections[${i}].body`, text: s.body });
  });
  m.whyWon.forEach((t, i) => f.push({ path: `whyWon[${i}]`, text: t }));
  m.whyFailed.forEach((t, i) => f.push({ path: `whyFailed[${i}]`, text: t }));
  m.faqs.forEach((q, i) => {
    f.push({ path: `faqs[${i}].question`, text: q.question });
    f.push({ path: `faqs[${i}].answer`, text: q.answer });
  });
  return f;
}

/** Strip {tokens} and [[const:…]] so only un-escaped literals remain. */
function stripManaged(text: string): string {
  return text.replace(/\{[^{}]+\}/g, "").replace(/\[\[const:[^\]]*\]\]/g, "");
}

function main() {
  const slugs = getDecisionGuideSlugs();
  let resolveErrors = 0;
  let lintHits = 0;
  let leftoverHits = 0;

  for (const slug of slugs) {
    // 1. VALIDATE — resolution must not throw.
    let resolved;
    try {
      resolved = getResolvedDecisionGuide(slug);
    } catch (e) {
      resolveErrors++;
      console.error(`✗ [${slug}] RESOLVE ERROR: ${(e as Error).message}`);
      continue;
    }
    if (!resolved) {
      resolveErrors++;
      console.error(`✗ [${slug}] not found`);
      continue;
    }

    // Assert no markers survived resolution.
    for (const { path, text } of managedFields(resolved.meta)) {
      const leftover = text.match(/\{[^{}]+\}|\[\[const:/);
      if (leftover) {
        leftoverHits++;
        console.error(`✗ [${slug}] ${path}: unresolved marker "${leftover[0]}"`);
      }
    }

    // 2. LINT — naked money literals in the RAW prose.
    const raw = getDecisionGuide(slug)!;
    for (const { path, text } of managedFields(raw)) {
      const bare = stripManaged(text);
      const hits = [...(bare.match(MONEY) ?? []), ...(bare.match(PER_WH) ?? [])];
      if (hits.length) {
        lintHits += hits.length;
        console.warn(`  ⚠ [${slug}] ${path}: naked money literal(s) ${JSON.stringify(hits)} — tokenize or [[const:…]]`);
      }
    }
  }

  console.log(
    `\nGuides: ${slugs.length} | resolve errors: ${resolveErrors} | unresolved markers: ${leftoverHits} | lint hits: ${lintHits}`
  );

  if (resolveErrors > 0 || leftoverHits > 0) {
    console.error("FAILED — resolution/marker errors must be fixed.");
    process.exit(1);
  }
  if (lintHits > 0 && STRICT) {
    console.error("FAILED (--strict) — naked money literals remain.");
    process.exit(1);
  }
  console.log(lintHits > 0 ? "OK (lint hits are warnings; run --strict to enforce)" : "OK — clean.");
}

main();
