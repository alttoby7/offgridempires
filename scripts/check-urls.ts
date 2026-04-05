/**
 * URL audit script for OffGridEmpire.
 * Checks every statically-generated page against the live site (or a local base URL).
 *
 * Usage:
 *   npx tsx scripts/check-urls.ts                              # live site
 *   npx tsx scripts/check-urls.ts --base http://localhost:3000 # local dev
 *   npx tsx scripts/check-urls.ts --verbose                    # show all results
 *   npx tsx scripts/check-urls.ts --concurrency 20             # adjust parallelism
 */

import { getKitSlugs, getKits } from "../src/lib/get-kits";
import { getArticleSlugs } from "../src/content/article-registry";

// ── CLI args ─────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);

const BASE_URL = (() => {
  const idx = args.indexOf("--base");
  const val = idx !== -1 ? args[idx + 1] : "https://offgridempire.com";
  try {
    new URL(val);
  } catch {
    console.error(`Invalid --base URL: ${val}`);
    process.exit(1);
  }
  return val.replace(/\/$/, "");
})();

const VERBOSE = args.includes("--verbose");

const CONCURRENCY = (() => {
  const idx = args.indexOf("--concurrency");
  const val = idx !== -1 ? parseInt(args[idx + 1], 10) : 10;
  if (!Number.isInteger(val) || val < 1) {
    console.error(`--concurrency must be an integer >= 1 (got: ${args[idx + 1]})`);
    process.exit(1);
  }
  return val;
})();

const TIMEOUT_MS = 8000;

// ── Brand slug (mirrors src/app/brands/[brand]/page.tsx#brandSlug) ──────────

function brandSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

// ── Build URL list ────────────────────────────────────────────────────────────

function buildUrls(): string[] {
  const urls: string[] = [];

  // All static app routes (derived from src/app/**/page.tsx)
  const staticPaths = [
    "/",
    "/about",
    "/affiliate-disclosure",
    "/calculator",
    "/compare",
    "/contact",
    "/kits",
    "/learn",
    "/methodology",
    "/portable-power",
    "/privacy",
    "/products",
    "/solar-kits",
    "/terms",
    "/tools/shed-solar-calculator",
    "/whole-home",
  ];
  urls.push(...staticPaths);

  // Kit detail pages — uses same filter as generateStaticParams
  const kitSlugs = getKitSlugs();
  urls.push(...kitSlugs.map((s) => `/kits/${s}`));

  // Learn articles — same source as generateStaticParams
  const articleSlugs = getArticleSlugs();
  urls.push(...articleSlugs.map((s) => `/learn/${s}`));

  // Brand pages — same slug function as brands/[brand]/page.tsx
  const allKits = getKits();
  const brandSlugs = [...new Set(allKits.map((k) => brandSlug(k.brand)))];
  urls.push(...brandSlugs.map((s) => `/brands/${s}`));

  // Best-for pages (hardcoded in best-for/[usecase]/page.tsx)
  const usecases = ["rv", "cabin", "shed", "emergency", "homestead", "boat"];
  urls.push(...usecases.map((u) => `/best-for/${u}`));

  // Category pages (hardcoded in categories/[category]/page.tsx)
  const categories = [
    "batteries",
    "panels",
    "charge-controllers",
    "inverters",
    "power-stations",
    "generators",
  ];
  urls.push(...categories.map((c) => `/categories/${c}`));

  // Solar kits budget pages (hardcoded in solar-kits/[budget]/page.tsx)
  const budgets = ["under-500", "under-1000", "under-2000", "under-3000", "under-4000"];
  urls.push(...budgets.map((b) => `/solar-kits/${b}`));

  return urls;
}

// ── Concurrency semaphore ─────────────────────────────────────────────────────

class Semaphore {
  private available: number;
  private queue: Array<() => void> = [];

  constructor(count: number) {
    this.available = count;
  }

  async acquire(): Promise<void> {
    if (this.available > 0) {
      this.available--;
      return;
    }
    return new Promise((resolve) => this.queue.push(resolve));
  }

  release(): void {
    const next = this.queue.shift();
    if (next) {
      next();
    } else {
      this.available++;
    }
  }
}

// ── Check a single URL ────────────────────────────────────────────────────────

interface CheckResult {
  path: string;
  status: number | "TIMEOUT" | "ERROR";
  ok: boolean;
  error?: string;
}

async function checkUrl(urlPath: string): Promise<CheckResult> {
  const url = new URL(urlPath, BASE_URL + "/").toString();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  const attemptFetch = async (method: "HEAD" | "GET"): Promise<Response> => {
    return fetch(url, { method, signal: controller.signal, redirect: "follow" });
  };

  try {
    let res = await attemptFetch("HEAD");

    // Some servers reject HEAD — fall back to GET
    if (res.status === 405 || res.status === 501) {
      res = await attemptFetch("GET");
      // Drain body so the connection is released
      await res.body?.cancel();
    }

    clearTimeout(timer);
    return { path: urlPath, status: res.status, ok: res.status < 400 };
  } catch (err: unknown) {
    clearTimeout(timer);
    const isTimeout =
      err instanceof Error && (err.name === "AbortError" || err.name === "TimeoutError");
    return {
      path: urlPath,
      status: isTimeout ? "TIMEOUT" : "ERROR",
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const urls = buildUrls();
  const sem = new Semaphore(CONCURRENCY);

  console.log(`\nChecking ${urls.length} URLs against ${BASE_URL} ...`);
  console.log(`Concurrency: ${CONCURRENCY}  Timeout: ${TIMEOUT_MS}ms\n`);

  const results: CheckResult[] = [];
  let done = 0;

  const checks = urls.map(async (urlPath) => {
    await sem.acquire();
    try {
      const result = await checkUrl(urlPath);
      results.push(result);
      done++;
      if (process.stdout.isTTY) {
        process.stdout.write(`\r  Progress: ${done}/${urls.length}`);
      }
    } finally {
      sem.release();
    }
  });

  await Promise.all(checks);

  if (process.stdout.isTTY) process.stdout.write("\r" + " ".repeat(40) + "\r");

  const failures = results.filter((r) => !r.ok);
  const ok = results.filter((r) => r.ok).length;

  if (VERBOSE) {
    console.log("All results:");
    for (const r of results.sort((a, b) => a.path.localeCompare(b.path))) {
      const icon = r.ok ? "✓" : "✗";
      console.log(`  ${icon} ${String(r.status).padEnd(7)} ${r.path}`);
    }
    console.log();
  }

  console.log(`✓ ${ok} OK  (2xx or 3xx)`);

  if (failures.length === 0) {
    console.log(`\nAll ${urls.length} URLs returned non-error responses. No issues found.\n`);
    process.exit(0);
  } else {
    console.log(`✗ ${failures.length} FAILED:\n`);
    for (const r of failures.sort((a, b) => a.path.localeCompare(b.path))) {
      const detail = r.error ? `  (${r.error})` : "";
      console.log(`  ${String(r.status).padEnd(7)} ${r.path}${detail}`);
    }
    console.log();
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
