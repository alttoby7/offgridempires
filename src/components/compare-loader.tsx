"use client";

import { useSearchParams } from "next/navigation";
import { useMemo } from "react";
import type { Kit } from "@/lib/demo-data";

/**
 * Reads ?kits=slug1,slug2,slug3 from URL and resolves to Kit objects.
 * Falls back to default selection if no param or slugs not found.
 */
export function useCompareKits(allKits: Kit[]): Kit[] {
  const searchParams = useSearchParams();
  const kitSlugs = searchParams.get("kits");

  return useMemo(() => {
    if (kitSlugs) {
      const slugs = kitSlugs.split(",").filter(Boolean);
      const found = slugs
        .map((s) => allKits.find((k) => k.slug === s))
        .filter((k): k is Kit => k !== undefined);
      if (found.length >= 2) return found.slice(0, 3);
    }
    // Default: first 3 kits
    return allKits.slice(0, 3);
  }, [allKits, kitSlugs]);
}
