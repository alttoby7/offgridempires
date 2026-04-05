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
