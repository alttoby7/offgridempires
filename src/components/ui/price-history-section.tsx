"use client";

import { useMemo, useEffect, useState } from "react";
import type { Kit, KitPriceHistory } from "@/lib/demo-data";
import { PriceHistoryChart, type PriceHistoryData } from "./price-history-chart";

/**
 * Bridge component: transforms Kit data into PriceHistoryData.
 * Lazy-fetches /data/history/[slug].json for multi-retailer series when available.
 * Falls back to single-series synthetic history from kit.priceHistory.
 */
export function PriceHistorySection({ kit }: { kit: Kit }) {
  const [multiHistory, setMultiHistory] = useState<KitPriceHistory | null>(null);
  const [fetchDone, setFetchDone] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch(`/data/history/${kit.slug}.json`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data: KitPriceHistory | null) => {
        if (!cancelled) {
          setMultiHistory(data);
          setFetchDone(true);
        }
      })
      .catch(() => {
        if (!cancelled) setFetchDone(true);
      });
    return () => { cancelled = true; };
  }, [kit.slug]);

  // Single-series fallback from kit.priceHistory
  const singleSeriesData = useMemo((): PriceHistoryData | null => {
    const history = kit.priceHistory;
    if (!history) return null;
    if (history.length < 2) {
      return {
        history,
        currentPriceCents: kit.listedPrice * 100,
        allTimeLowCents: kit.listedPrice * 100,
        allTimeHighCents: kit.listedPrice * 100,
        averageCents: kit.listedPrice * 100,
      };
    }
    const prices = history.map((p) => p.priceCents);
    return {
      history,
      currentPriceCents: kit.listedPrice * 100,
      allTimeLowCents: Math.min(...prices),
      allTimeHighCents: Math.max(...prices),
      averageCents: Math.round(prices.reduce((a, b) => a + b, 0) / prices.length),
    };
  }, [kit]);

  // Once fetch is done, prefer multi-series if available and has enough data
  const hasMultiData =
    fetchDone &&
    multiHistory !== null &&
    multiHistory.lowestAvailable.length >= 2;

  return (
    <PriceHistoryChart
      data={hasMultiData ? null : singleSeriesData}
      multiHistory={hasMultiData ? multiHistory! : undefined}
      kitName={kit.name}
    />
  );
}
