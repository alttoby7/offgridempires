import Link from "next/link";
import { getRelatedArticles } from "@/lib/kit-articles";
import type { Kit } from "@/lib/demo-data";

interface KitArticleHandoffsProps {
  kit: Kit;
  max?: number;
}

export function KitArticleHandoffs({ kit, max = 3 }: KitArticleHandoffsProps) {
  const matches = getRelatedArticles(kit, max);
  if (matches.length === 0) return null;

  return (
    <section>
      <div className="flex items-baseline gap-3 mb-4">
        <h2 className="font-display text-xl text-[var(--ink)]">Read further</h2>
        <span className="flex-1 border-b border-[var(--rule)]" />
        <span className="eyebrow">From our research</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {matches.map(({ article, reason }) => (
          <Link
            key={article.slug}
            href={`/learn/${article.slug}`}
            className="group block rounded-sm border border-[var(--rule)] bg-[var(--bg-surface)] p-4 hover:border-[var(--accent)] transition-colors"
          >
            <p className="eyebrow !text-[var(--accent)] mb-1.5">{article.format}</p>
            <h3 className="font-display text-base leading-snug text-[var(--ink)] group-hover:text-[var(--accent)] transition-colors">
              {article.title}
            </h3>
            <p className="mt-2 text-xs text-[var(--ink-muted)] italic leading-relaxed">
              {reason}
            </p>
            <span className="mt-3 inline-flex items-center gap-1 text-xs text-[var(--accent)] group-hover:underline">
              Read article →
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
