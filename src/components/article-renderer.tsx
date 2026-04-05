import Link from "next/link";
import type { ArticleRecord } from "@/content/types";
import { ArticleKitEmbed } from "./article-kit-embed";
import {
  Breadcrumb,
  PageTitle,
  ProseContainer,
  ContentCard,
} from "@/components/ui/prose";
import { BreadcrumbJsonLd } from "@/components/json-ld";

const SITE_URL = "https://offgridempire.com";

function ArticleJsonLd({ article }: { article: ArticleRecord }) {
  const data = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    datePublished: article.publishedAt,
    dateModified: article.updatedAt,
    publisher: {
      "@type": "Organization",
      name: "OffGridEmpire",
      url: SITE_URL,
    },
    mainEntityOfPage: `${SITE_URL}/learn/${article.slug}`,
    description: article.metaDescription,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

/**
 * Parse article markdown body into React elements.
 *
 * Handles:
 * - Headings (## H2, ### H3)
 * - Paragraphs
 * - Bold (**text**), Italic (*text*)
 * - Links [text](url)
 * - Unordered lists (- item)
 * - Ordered lists (1. item)
 * - Tables (| col | col |)
 * - Kit embeds [KIT_EMBED:slug]
 * - Tool CTAs [TOOL_CTA:url:label]
 * - Data values <data>value</data>
 * - Horizontal rules (---)
 */
function renderBody(body: string) {
  const lines = body.split("\n");
  const elements: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Empty line
    if (line.trim() === "") {
      i++;
      continue;
    }

    // Kit embed
    if (line.trim().match(/^\[KIT_EMBED:([^\]]+)\]$/)) {
      const slug = line.trim().match(/^\[KIT_EMBED:([^\]]+)\]$/)![1];
      elements.push(<ArticleKitEmbed key={`kit-${i}`} slug={slug} />);
      i++;
      continue;
    }

    // Tool CTA
    if (line.trim().match(/^\[TOOL_CTA:([^:]+):([^\]]+)\]$/)) {
      const match = line.trim().match(/^\[TOOL_CTA:([^:]+):([^\]]+)\]$/)!;
      elements.push(
        <div key={`cta-${i}`} className="my-6">
          <Link
            href={match[1]}
            className="flex items-center justify-between rounded border border-[var(--accent)]/30 bg-[var(--accent)]/5 px-5 py-4 text-sm font-medium text-[var(--accent)] hover:bg-[var(--accent)]/10 transition-colors"
          >
            <span>{match[2]}</span>
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
      );
      i++;
      continue;
    }

    // Horizontal rule
    if (line.trim() === "---") {
      elements.push(
        <hr
          key={`hr-${i}`}
          className="my-8 border-[var(--border)]"
        />
      );
      i++;
      continue;
    }

    // H2
    if (line.startsWith("## ")) {
      const text = line.slice(3);
      const id = text
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
      elements.push(
        <h2
          key={`h2-${i}`}
          id={id}
          className="font-mono text-sm uppercase tracking-wider text-[var(--accent)] mt-10 mb-4"
        >
          {text}
        </h2>
      );
      i++;
      continue;
    }

    // H3
    if (line.startsWith("### ")) {
      const text = line.slice(4);
      elements.push(
        <h3
          key={`h3-${i}`}
          className="text-base font-semibold text-[var(--text-primary)] mt-6 mb-3"
        >
          {text}
        </h3>
      );
      i++;
      continue;
    }

    // Unordered list
    if (line.match(/^[-*] /)) {
      const items: string[] = [];
      while (i < lines.length && lines[i].match(/^[-*] /)) {
        items.push(lines[i].replace(/^[-*] /, ""));
        i++;
      }
      elements.push(
        <ul
          key={`ul-${i}`}
          className="list-disc list-inside space-y-1 mb-4 text-sm text-[var(--text-secondary)] leading-relaxed"
        >
          {items.map((item, j) => (
            <li key={j}>{renderInline(item)}</li>
          ))}
        </ul>
      );
      continue;
    }

    // Ordered list
    if (line.match(/^\d+\. /)) {
      const items: string[] = [];
      while (i < lines.length && lines[i].match(/^\d+\. /)) {
        items.push(lines[i].replace(/^\d+\. /, ""));
        i++;
      }
      elements.push(
        <ol
          key={`ol-${i}`}
          className="list-decimal list-inside space-y-1 mb-4 text-sm text-[var(--text-secondary)] leading-relaxed"
        >
          {items.map((item, j) => (
            <li key={j}>{renderInline(item)}</li>
          ))}
        </ol>
      );
      continue;
    }

    // Table
    if (line.includes("|") && line.trim().startsWith("|")) {
      const tableLines: string[] = [];
      while (
        i < lines.length &&
        lines[i].includes("|") &&
        lines[i].trim().startsWith("|")
      ) {
        tableLines.push(lines[i]);
        i++;
      }
      if (tableLines.length >= 2) {
        const headerCells = tableLines[0]
          .split("|")
          .filter((c) => c.trim())
          .map((c) => c.trim());
        // Skip separator row
        const bodyRows = tableLines.slice(2).map((row) =>
          row
            .split("|")
            .filter((c) => c.trim())
            .map((c) => c.trim())
        );
        elements.push(
          <div key={`table-${i}`} className="overflow-x-auto mb-6">
            <table className="w-full text-sm border border-[var(--border)]">
              <thead>
                <tr className="bg-[var(--bg-elevated)]">
                  {headerCells.map((cell, j) => (
                    <th
                      key={j}
                      className="px-3 py-2 text-left font-mono text-xs uppercase tracking-wider text-[var(--text-muted)] border-b border-[var(--border)]"
                    >
                      {cell}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {bodyRows.map((row, j) => (
                  <tr
                    key={j}
                    className="border-b border-[var(--border)] last:border-0"
                  >
                    {row.map((cell, k) => (
                      <td
                        key={k}
                        className="px-3 py-2 text-[var(--text-secondary)]"
                      >
                        {renderInline(cell)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      }
      continue;
    }

    // Paragraph (default)
    elements.push(
      <p
        key={`p-${i}`}
        className="text-sm text-[var(--text-secondary)] leading-relaxed mb-4"
      >
        {renderInline(line)}
      </p>
    );
    i++;
  }

  return elements;
}

/**
 * Render inline markdown: bold, italic, links, data tags, code.
 */
function renderInline(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  // Split on patterns: **bold**, *italic*, [text](url), <data>value</data>, `code`
  const regex =
    /(\*\*(.+?)\*\*|\*(.+?)\*|\[([^\]]+)\]\(([^)]+)\)|<data>(.+?)<\/data>|`(.+?)`)/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    // Text before match
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    if (match[2]) {
      // Bold
      parts.push(
        <strong key={match.index} className="font-semibold text-[var(--text-primary)]">
          {match[2]}
        </strong>
      );
    } else if (match[3]) {
      // Italic
      parts.push(<em key={match.index}>{match[3]}</em>);
    } else if (match[4] && match[5]) {
      // Link
      const isExternal = match[5].startsWith("http");
      parts.push(
        <Link
          key={match.index}
          href={match[5]}
          className="text-[var(--accent)] hover:underline"
          {...(isExternal ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        >
          {match[4]}
        </Link>
      );
    } else if (match[6]) {
      // Data value
      parts.push(
        <span key={match.index} className="font-mono text-[var(--accent)]">
          {match[6]}
        </span>
      );
    } else if (match[7]) {
      // Code
      parts.push(
        <code
          key={match.index}
          className="font-mono text-xs bg-[var(--bg-elevated)] px-1.5 py-0.5 rounded"
        >
          {match[7]}
        </code>
      );
    }

    lastIndex = match.index + match[0].length;
  }

  // Remaining text
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length === 1 ? parts[0] : <>{parts}</>;
}

export function ArticleRenderer({ article }: { article: ArticleRecord }) {
  return (
    <ProseContainer>
      <BreadcrumbJsonLd
        items={article.breadcrumb
          .filter((b) => b.href)
          .map((b) => ({ name: b.label, url: b.href! }))}
      />
      <ArticleJsonLd article={article} />

      <Breadcrumb
        items={article.breadcrumb.map((b) => ({
          href: b.href,
          label: b.label,
        }))}
      />

      <PageTitle title={article.title} />

      <div className="flex items-center gap-4 text-xs text-[var(--text-muted)] mb-8">
        <time dateTime={article.publishedAt}>
          {new Date(article.publishedAt).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
          })}
        </time>
        <span>{article.readingTime}</span>
      </div>

      <ContentCard>{renderBody(article.body)}</ContentCard>

      {/* Related tool pages */}
      {article.relatedToolPages.length > 0 && (
        <div className="mt-8">
          <h2 className="font-mono text-sm uppercase tracking-wider text-[var(--accent)] mb-4">
            Explore the Data
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {article.relatedToolPages.map((tool) => (
              <Link
                key={tool.href}
                href={tool.href}
                className="flex items-center justify-between rounded border border-[var(--border)] bg-[var(--bg-surface)] px-4 py-3 text-sm text-[var(--text-secondary)] hover:border-[var(--accent)]/30 hover:text-[var(--accent)] transition-colors"
              >
                <span>{tool.label}</span>
                <svg
                  width="14"
                  height="14"
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
            ))}
          </div>
        </div>
      )}
    </ProseContainer>
  );
}
