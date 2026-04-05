/**
 * Article registry for /learn pages.
 * Updated by offgrid-writer Stage 7 when publishing new articles.
 */

import type { ArticleEntry } from "./types";

export const articles: ArticleEntry[] = [
  {
    slug: "portable-power-stations",
    title: "Portable Power Stations: 173 Options Compared by Real Build Cost",
    format: "category",
    pageType: "cluster",
    parentSlug: "portable-power-and-power-stations",
    publishedAt: "2026-04-04T00:00:00Z",
    primaryKeyword: "portable power stations",
  },
  {
    slug: "lithium-and-lifepo4-batteries",
    title: "Lithium and LiFePO4 Batteries: The Complete Guide for Off-Grid Solar",
    format: "guide",
    pageType: "cluster",
    parentSlug: "batteries-and-energy-storage",
    publishedAt: "2026-04-04T00:00:00Z",
    primaryKeyword: "lithium and lifepo4 batteries",
  },
  {
    slug: "rv-and-camper-solar",
    title: "RV and Camper Solar: What the Kits Don't Tell You",
    format: "guide",
    pageType: "cluster",
    parentSlug: null,
    publishedAt: "2026-04-04T00:00:00Z",
    primaryKeyword: "rv and camper solar",
  },
  {
    slug: "portable-solar-panels-and-chargers",
    title: "Portable Solar Panels and Chargers: 29 Systems Compared by Output and Real Build Cost",
    format: "category",
    pageType: "cluster",
    parentSlug: "portable-power-and-power-stations",
    publishedAt: "2026-04-05T00:00:00Z",
    primaryKeyword: "portable solar panels and chargers",
  },
  {
    slug: "watts-amps-volts-conversions",
    title: "Watts, Amps, and Volts: The Solar Math Every DIY Builder Needs",
    format: "tool",
    pageType: "supporting",
    parentSlug: "solar-panel-types-and-efficiency",
    publishedAt: "2026-04-05T00:00:00Z",
    primaryKeyword: "watts amps volts conversions",
  },
  {
    slug: "watts-to-kilowatts",
    title: "Watts, Kilowatts, and Kilowatt-Hours: The DIY Solar Sizing Guide",
    format: "guide",
    pageType: "supporting",
    parentSlug: "solar-batteries-and-storage",
    publishedAt: "2026-04-05T00:00:00Z",
    primaryKeyword: "watts to kilowatts",
  },
  {
    slug: "solar-water-and-pool-heating",
    title: "Solar Water and Pool Heating: The DIY Numbers Guide",
    format: "guide",
    pageType: "cluster",
    parentSlug: "solar-heating-cooling-lighting",
    publishedAt: "2026-04-05T00:00:00Z",
    primaryKeyword: "solar water and pool heating",
  },
  {
    slug: "solar-panels-for-home",
    title: "Solar Panels for Home: 140 DIY Kits Compared by Real Build Cost",
    format: "category",
    pageType: "supporting",
    parentSlug: null,
    publishedAt: "2026-04-05T00:00:00Z",
    primaryKeyword: "solar panels for home",
  },
  {
    slug: "battery-types-and-deep-cycle",
    title: "Battery Types and Deep Cycle: A Data-Backed Guide for Off-Grid Solar",
    format: "guide",
    pageType: "cluster",
    parentSlug: null,
    publishedAt: "2026-04-05T00:00:00Z",
    primaryKeyword: "battery types and deep cycle",
  },
  {
    slug: "solar-panel-kits-and-bundles",
    title: "Solar Panel Kits and Bundles",
    format: "category",
    pageType: "cluster",
    parentSlug: null,
    publishedAt: "2026-04-05T00:00:00Z",
    primaryKeyword: "solar panel kits and bundles",
  },
  {
    slug: "inverters-and-power-conversion",
    title: "The $600 Kit With an Inverter That Kills Your CPAP",
    format: "guide",
    pageType: "cluster",
    parentSlug: "inverters-charge-controllers-components",
    publishedAt: "2026-04-05T00:00:00Z",
    primaryKeyword: "inverters and power conversion",
  },
  {
    slug: "solar-installation-diy",
    title: "How to Install a DIY Off-Grid Solar System (With Real Costs)",
    format: "how-to",
    pageType: "cluster",
    parentSlug: "solar-installation-and-diy",
    publishedAt: "2026-04-05T00:00:00Z",
    primaryKeyword: "solar installation and diy",
  },
  {
    slug: "home-generators-and-backup-power",
    title: "Home Generators and Backup Power: 4 Categories, Real Costs, No Rankings",
    format: "guide",
    pageType: "cluster",
    parentSlug: null,
    publishedAt: "2026-04-05T00:00:00Z",
    primaryKeyword: "home generators and backup power",
  },
  {
    slug: "solar-for-sheds-and-small-structures",
    title: "Solar for Sheds Costs $359 to $1,899, Not $11,000",
    format: "guide",
    pageType: "cluster",
    parentSlug: "off-grid-system-design-and-diy",
    publishedAt: "2026-04-05T00:00:00Z",
    primaryKeyword: "solar for sheds and small structures",
  },
];

export function getArticleSlugs(): string[] {
  return articles.map((a) => a.slug);
}

export function getArticleBySlug(slug: string): ArticleEntry | undefined {
  return articles.find((a) => a.slug === slug);
}

export function getArticlesByParent(parentSlug: string): ArticleEntry[] {
  return articles.filter((a) => a.parentSlug === parentSlug);
}

export function getArticlesByFormat(
  format: ArticleEntry["format"]
): ArticleEntry[] {
  return articles.filter((a) => a.format === format);
}
