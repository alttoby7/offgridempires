import type { Metadata } from "next";
import Link from "next/link";
import { articles } from "@/content/article-registry";
import { BreadcrumbJsonLd } from "@/components/json-ld";
import {
  Breadcrumb,
  PageTitle,
  ProseContainer,
} from "@/components/ui/prose";

export const metadata: Metadata = {
  title: "Off-Grid Solar Learning Center",
  description:
    "Data-backed guides, comparisons, and tutorials for off-grid solar systems. Real kit specs, real build costs, no opinions.",
  alternates: { canonical: "/learn" },
  openGraph: {
    title: "Off-Grid Solar Learning Center",
    description:
      "Data-backed guides, comparisons, and tutorials for off-grid solar systems.",
    url: "/learn",
  },
};

const FORMAT_STYLES: Record<string, string> = {
  guide: "bg-[var(--success)]/15 text-[var(--success)]",
  category: "bg-[var(--accent)]/15 text-[var(--accent)]",
  "how-to": "bg-blue-500/15 text-blue-400",
  tool: "bg-purple-500/15 text-purple-400",
  comparison: "bg-cyan-500/15 text-cyan-400",
  listicle: "bg-[var(--accent)]/15 text-[var(--accent)]",
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function LearnIndexPage() {
  // Sort all articles by date descending
  const sorted = [...articles].sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );

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

      {/* Stats + CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <p className="font-mono text-xs text-[var(--text-muted)]">
          {articles.length} articles &middot; 419+ kits in database
        </p>
        <Link
          href="/calculator"
          className="inline-flex items-center gap-2 rounded bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-black hover:bg-[var(--accent-hover)] transition-colors w-fit"
        >
          Size My System
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </Link>
      </div>

      {/* Article list */}
      <div className="space-y-2">
        {sorted.map((article) => (
          <Link
            key={article.slug}
            href={`/learn/${article.slug}`}
            className="group flex items-center justify-between rounded border border-[var(--border)] bg-[var(--bg-surface)] px-4 py-3.5 hover:border-[var(--accent)]/30 transition-colors"
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2.5 mb-1.5">
                <span
                  className={`inline-block px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider ${FORMAT_STYLES[article.format] || FORMAT_STYLES.guide}`}
                >
                  {article.format}
                </span>
                <span className="text-[10px] text-[var(--text-muted)]">
                  {formatDate(article.publishedAt)}
                </span>
              </div>
              <span className="text-sm text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors line-clamp-2">
                {article.title}
              </span>
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
              className="text-[var(--text-muted)] flex-shrink-0 ml-4 group-hover:text-[var(--accent)] transition-colors"
            >
              <path d="M9 18l6-6-6-6" />
            </svg>
          </Link>
        ))}
      </div>

      {/* Bottom CTAs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-10">
        <Link
          href="/kits"
          className="flex items-center justify-between rounded border border-[var(--accent)]/30 bg-[var(--accent)]/5 px-5 py-4 text-sm font-medium text-[var(--accent)] hover:bg-[var(--accent)]/10 transition-colors"
        >
          <span>Browse All Kits</span>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </Link>
        <Link
          href="/compare"
          className="flex items-center justify-between rounded border border-[var(--border)] bg-[var(--bg-surface)] px-5 py-4 text-sm font-medium text-[var(--text-secondary)] hover:border-[var(--accent)]/30 hover:text-[var(--accent)] transition-colors"
        >
          <span>Compare Kits</span>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    </ProseContainer>
  );
}
