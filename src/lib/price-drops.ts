import { getKits } from "./get-kits";
import type { Kit, PriceHistoryPoint } from "./demo-data";

export interface PriceDrop {
  kit: Kit;
  previousPriceCents: number;
  currentPriceCents: number;
  dropCents: number;
  dropPercent: number;
  observedDate: string;
  daysAgo: number;
}

function toUTCDate(yyyymmdd: string): Date {
  return new Date(`${yyyymmdd}T00:00:00Z`);
}

function daysBetween(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / 86_400_000);
}

/**
 * Find the most recent price-change drop in a kit's history.
 * Compares the latest priceHistory entry to the prior distinct price.
 * Returns null if no recent drop or insufficient history.
 */
function findRecentDrop(history: PriceHistoryPoint[], referenceDate: Date): { previous: number; current: number; observedDate: string } | null {
  if (!history || history.length < 2) return null;
  const sorted = [...history].sort((a, b) => a.date.localeCompare(b.date));
  const latest = sorted[sorted.length - 1];

  for (let i = sorted.length - 2; i >= 0; i--) {
    if (sorted[i].priceCents !== latest.priceCents) {
      if (sorted[i].priceCents > latest.priceCents) {
        return { previous: sorted[i].priceCents, current: latest.priceCents, observedDate: latest.date };
      }
      return null;
    }
  }
  return null;
}

/**
 * Top N kits by absolute price drop in the trailing window.
 * window in days — defaults to 14 since pipeline writes priceHistory only on actual changes.
 */
export function getTopPriceDrops(opts: { limit?: number; minDropCents?: number; windowDays?: number } = {}): PriceDrop[] {
  const limit = opts.limit ?? 15;
  const minDropCents = opts.minDropCents ?? 2000;
  const windowDays = opts.windowDays ?? 14;

  const kits = getKits();
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const drops: PriceDrop[] = [];

  for (const kit of kits) {
    if (!kit.priceHistory || kit.priceHistory.length < 2) continue;
    if (kit.listedPrice <= 0) continue;

    const recent = findRecentDrop(kit.priceHistory, today);
    if (!recent) continue;

    const dropCents = recent.previous - recent.current;
    if (dropCents < minDropCents) continue;

    const observed = toUTCDate(recent.observedDate);
    const daysAgo = daysBetween(observed, today);
    if (daysAgo > windowDays) continue;

    const dropPercent = (dropCents / recent.previous) * 100;

    drops.push({
      kit,
      previousPriceCents: recent.previous,
      currentPriceCents: recent.current,
      dropCents,
      dropPercent,
      observedDate: recent.observedDate,
      daysAgo,
    });
  }

  drops.sort((a, b) => b.dropCents - a.dropCents);
  return drops.slice(0, limit);
}

export function formatDropCents(cents: number): string {
  return `$${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}
