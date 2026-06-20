import React from "react";
import Link from "next/link";

/**
 * Minimal, dependency-free prose renderer for decision-guide section bodies.
 * Supports exactly what the guide narrative needs: paragraphs (blank-line
 * separated), "- " bullet lists, **bold**, and [text](/internal-path) links.
 * Internal links (starting "/") render as next/link; external as <a>.
 *
 * Deliberately tiny — we do NOT pull an MDX/markdown pipeline into the route.
 */

function renderInline(text: string, keyPrefix: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  // Tokenize on **bold** and [text](url), left to right.
  const re = /\*\*(.+?)\*\*|\[(.+?)\]\(([^)]+)\)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) nodes.push(text.slice(last, m.index));
    if (m[1] !== undefined) {
      nodes.push(
        <strong key={`${keyPrefix}-b-${i}`} className="font-semibold text-[var(--text-primary)]">
          {m[1]}
        </strong>
      );
    } else if (m[2] !== undefined && m[3] !== undefined) {
      const href = m[3];
      const label = m[2];
      if (href.startsWith("/")) {
        nodes.push(
          <Link
            key={`${keyPrefix}-l-${i}`}
            href={href}
            className="text-[var(--accent)] hover:underline"
          >
            {label}
          </Link>
        );
      } else {
        nodes.push(
          <a
            key={`${keyPrefix}-a-${i}`}
            href={href}
            className="text-[var(--accent)] hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            {label}
          </a>
        );
      }
    }
    last = m.index + m[0].length;
    i += 1;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

export function Prose({ body }: { body: string }) {
  const blocks = body.trim().split(/\n\s*\n/);
  return (
    <div className="space-y-4">
      {blocks.map((block, bi) => {
        const lines = block.split("\n").map((l) => l.trim()).filter(Boolean);
        const isList = lines.length > 0 && lines.every((l) => l.startsWith("- "));
        if (isList) {
          return (
            <ul key={bi} className="space-y-1.5">
              {lines.map((l, li) => (
                <li
                  key={li}
                  className="flex items-start gap-2 text-sm text-[var(--text-secondary)] leading-relaxed"
                >
                  <span className="text-[var(--accent)] mt-0.5 shrink-0">◈</span>
                  <span>{renderInline(l.slice(2), `${bi}-${li}`)}</span>
                </li>
              ))}
            </ul>
          );
        }
        return (
          <p key={bi} className="text-sm text-[var(--text-secondary)] leading-relaxed">
            {renderInline(lines.join(" "), `${bi}`)}
          </p>
        );
      })}
    </div>
  );
}
