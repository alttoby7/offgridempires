import type { Metadata } from "next";
import Link from "next/link";
import * as fs from "fs";
import * as path from "path";
import { getArticleSlugs } from "@/content/article-registry";
import { ArticleRenderer } from "@/components/article-renderer";
import type { ArticleRecord } from "@/content/types";

export const dynamic = "force-static";

// Kit field type for price resolution
interface KitData {
  slug: string;
  name: string;
  displayName: string;
  listedPrice: number;
  trueCost: number;
  missingCost: number;
  panelWatts: number;
  storageWh: number;
  inverterWatts: number;
  voltage: number;
  brand: string;
  completeness: number;
  costPerWh: string;
  costPerW: string;
}

// Load kits.json once and build a slug → kit map for marker resolution
function loadKitsMap(): Map<string, KitData> {
  try {
    const filePath = path.join(process.cwd(), "src/lib/data/kits.json");
    const raw = fs.readFileSync(filePath, "utf-8");
    const kits: KitData[] = JSON.parse(raw);
    return new Map(kits.map((k) => [k.slug, k]));
  } catch {
    return new Map();
  }
}

// Format a kit field value for display
function formatKitField(kit: KitData, field: string): string {
  switch (field) {
    case "listedPrice":
    case "trueCost":
    case "missingCost":
      return `$${kit[field as "listedPrice" | "trueCost" | "missingCost"].toLocaleString()}`;
    case "panelWatts":
      return `${kit.panelWatts}W`;
    case "storageWh":
      return kit.storageWh > 0 ? `${kit.storageWh.toLocaleString()}Wh` : "N/A";
    case "inverterWatts":
      return kit.inverterWatts > 0 ? `${kit.inverterWatts}W` : "N/A";
    case "voltage":
      return `${kit.voltage}V`;
    case "completeness":
      return `${kit.completeness}%`;
    case "name":
      return kit.name;
    case "displayName":
      return kit.displayName;
    case "brand":
      return kit.brand;
    case "costPerWh":
      return kit.costPerWh;
    case "costPerW":
      return kit.costPerW;
    default:
      return `[MISSING: ${kit.slug}:${field}]`;
  }
}

// Resolve {{KIT:slug:field}} markers in article body using live kits.json data.
// Resolved values are wrapped in <data> tags so the renderer displays them in monospace.
function resolveKitMarkers(body: string, kitsMap: Map<string, KitData>): string {
  return body.replace(/\{\{KIT:([^:}]+):([^}]+)\}\}/g, (_match, slug, field) => {
    const kit = kitsMap.get(slug);
    if (!kit) return `[MISSING: ${slug}:${field}]`;
    const value = formatKitField(kit, field);
    return `<data>${value}</data>`;
  });
}

function loadArticle(slug: string, kitsMap: Map<string, KitData>): ArticleRecord | null {
  try {
    const filePath = path.join(
      process.cwd(),
      "src/content/articles",
      `${slug}.json`
    );
    const raw = fs.readFileSync(filePath, "utf-8");
    const record = JSON.parse(raw) as ArticleRecord;
    // Resolve any {{KIT:slug:field}} markers in the body using live kit data
    record.body = resolveKitMarkers(record.body, kitsMap);
    return record;
  } catch {
    return null;
  }
}

export function generateStaticParams() {
  return getArticleSlugs().map((slug) => ({
    slug: slug.split("/"),
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const joinedSlug = slug.join("/");
  const kitsMap = loadKitsMap();
  const article = loadArticle(joinedSlug, kitsMap);

  if (!article) {
    return { title: "Article Not Found" };
  }

  return {
    title: article.metaTitle,
    description: article.metaDescription,
    alternates: { canonical: `/learn/${joinedSlug}` },
    openGraph: {
      title: article.metaTitle,
      description: article.metaDescription,
      url: `/learn/${joinedSlug}`,
      type: "article",
      publishedTime: article.publishedAt,
      modifiedTime: article.updatedAt,
    },
  };
}

export default async function LearnArticlePage({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug } = await params;
  const joinedSlug = slug.join("/");
  const kitsMap = loadKitsMap();
  const article = loadArticle(joinedSlug, kitsMap);

  if (!article) {
    return (
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-16 text-center">
        <h1 className="text-xl font-bold text-[var(--text-primary)]">
          Article not found
        </h1>
        <Link
          href="/learn"
          className="text-sm text-[var(--accent)] mt-4 inline-block"
        >
          &larr; Back to Learn
        </Link>
      </div>
    );
  }

  return <ArticleRenderer article={article} />;
}
