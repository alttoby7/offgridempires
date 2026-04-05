import type { Metadata } from "next";
import Link from "next/link";
import { articles } from "@/content/article-registry";
import { BreadcrumbJsonLd } from "@/components/json-ld";
import {
  Breadcrumb,
  PageTitle,
  ProseContainer,
  ContentCard,
} from "@/components/ui/prose";

export const metadata: Metadata = {
  title: "Learn — Off-Grid Solar Guides & Data",
  description:
    "Data-backed guides, comparisons, and tutorials for off-grid solar systems. Real kit specs, real build costs, no opinions.",
  alternates: { canonical: "/learn" },
  openGraph: {
    title: "Learn | OffGridEmpire",
    description:
      "Data-backed guides, comparisons, and tutorials for off-grid solar systems.",
    url: "/learn",
  },
};

export default function LearnIndexPage() {
  // Group articles by pageType
  const pillars = articles.filter((a) => a.pageType === "pillar");
  const clusters = articles.filter((a) => a.pageType === "cluster");
  const supporting = articles.filter((a) => a.pageType === "supporting");

  const hasArticles = articles.length > 0;

  return (
    <ProseContainer>
      <BreadcrumbJsonLd
        items={[
          { name: "Home", url: "/" },
          { name: "Learn", url: "/learn" },
        ]}
      />

      <Breadcrumb items={[{ href: "/", label: "Home" }, { label: "Learn" }]} />

      <PageTitle
        title="Learn"
        subtitle="Data-backed guides, comparisons, and tutorials. Real kit specs, real build costs, no opinions."
      />

      {!hasArticles && (
        <ContentCard>
          <p className="text-sm text-[var(--text-muted)]">
            Articles are on the way. In the meantime, explore{" "}
            <Link href="/kits" className="text-[var(--accent)] hover:underline">
              all kits
            </Link>{" "}
            or{" "}
            <Link
              href="/calculator"
              className="text-[var(--accent)] hover:underline"
            >
              size your system
            </Link>
            .
          </p>
        </ContentCard>
      )}

      {pillars.length > 0 && (
        <section className="mb-8">
          <h2 className="font-mono text-sm uppercase tracking-wider text-[var(--accent)] mb-4">
            Guides
          </h2>
          <div className="space-y-2">
            {pillars.map((article) => (
              <ArticleLink key={article.slug} article={article} />
            ))}
          </div>
        </section>
      )}

      {clusters.length > 0 && (
        <section className="mb-8">
          <h2 className="font-mono text-sm uppercase tracking-wider text-[var(--accent)] mb-4">
            Topics
          </h2>
          <div className="space-y-2">
            {clusters.map((article) => (
              <ArticleLink key={article.slug} article={article} />
            ))}
          </div>
        </section>
      )}

      {supporting.length > 0 && (
        <section className="mb-8">
          <h2 className="font-mono text-sm uppercase tracking-wider text-[var(--accent)] mb-4">
            Articles
          </h2>
          <div className="space-y-2">
            {supporting.map((article) => (
              <ArticleLink key={article.slug} article={article} />
            ))}
          </div>
        </section>
      )}
    </ProseContainer>
  );
}

function ArticleLink({
  article,
}: {
  article: (typeof articles)[number];
}) {
  return (
    <Link
      href={`/learn/${article.slug}`}
      className="flex items-center justify-between rounded border border-[var(--border)] bg-[var(--bg-surface)] px-4 py-3 hover:border-[var(--accent)]/30 transition-colors"
    >
      <div>
        <span className="text-sm text-[var(--text-primary)]">
          {article.title}
        </span>
        <div className="flex items-center gap-3 mt-1">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)]">
            {article.format}
          </span>
          <span className="text-[10px] text-[var(--text-muted)]">
            {article.publishedAt}
          </span>
        </div>
      </div>
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-[var(--text-muted)] flex-shrink-0"
      >
        <path d="M9 18l6-6-6-6" />
      </svg>
    </Link>
  );
}
