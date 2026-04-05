/**
 * Article content types for /learn pages.
 */

export interface ArticleEntry {
  slug: string;
  title: string;
  format: "category" | "listicle" | "guide" | "how-to" | "tool" | "comparison";
  pageType: "pillar" | "cluster" | "supporting";
  parentSlug: string | null;
  publishedAt: string;
  primaryKeyword: string;
}

export interface ArticleBreadcrumb {
  label: string;
  href?: string;
}

export interface ArticleToolLink {
  href: string;
  label: string;
}

export interface ArticleRecord {
  slug: string;
  title: string;
  metaTitle: string;
  metaDescription: string;
  publishedAt: string;
  updatedAt: string;
  readingTime: string;
  format: ArticleEntry["format"];
  pageType: ArticleEntry["pageType"];
  funnelStage: "awareness" | "consideration" | "decision";
  parentSlug: string | null;
  primaryKeyword: string;
  secondaryKeywords: string[];
  breadcrumb: ArticleBreadcrumb[];
  relatedToolPages: ArticleToolLink[];
  relatedArticles: { slug: string; title: string }[];
  kitSlugs: string[];
  body: string;
}
