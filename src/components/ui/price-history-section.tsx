"use client";

import { useMemo } from "react";
import type { Kit, PriceHistoryPoint } from "@/lib/demo-data";
import { PriceHistoryChart, type PriceHistoryData } from "./price-history-chart";

/**
 * Bridge component: transforms Kit data into PriceHistoryData
 * and renders the chart. Sits between server page and client chart.
 */
export function PriceHistorySection({ kit }: { kit: Kit }) {
  const chartData = useMemo((): PriceHistoryData | null => {
    const history = kit.priceHistory;
    if (!history) return null;

    // Return empty data object (not null) so the chart shows empty state, not loading skeleton
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
    const currentPriceCents = kit.listedPrice * 100;
    const allTimeLowCents = Math.min(...prices);
    const allTimeHighCents = Math.max(...prices);
    const averageCents = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);

    return {
      history,
      currentPriceCents,
      allTimeLowCents,
      allTimeHighCents,
      averageCents,
    };
  }, [kit]);

  return <PriceHistoryChart data={chartData} kitName={kit.name} />;
}
