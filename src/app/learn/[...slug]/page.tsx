import type { Metadata } from "next";
import Link from "next/link";
import * as fs from "fs";
import * as path from "path";
import { getArticleSlugs } from "@/content/article-registry";
import { ArticleRenderer } from "@/components/article-renderer";
import type { ArticleRecord } from "@/content/types";

export const dynamic = "force-static";

function loadArticle(slug: string): ArticleRecord | null {
  try {
    const filePath = path.join(
      process.cwd(),
      "src/content/articles",
      `${slug}.json`
    );
    const raw = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(raw) as ArticleRecord;
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
  const article = loadArticle(joinedSlug);

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
  const article = loadArticle(joinedSlug);

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
