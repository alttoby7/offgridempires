import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import * as fs from "fs";
import * as path from "path";
import { BreadcrumbJsonLd } from "@/components/json-ld";

export const dynamic = "force-static";
export const dynamicParams = false;

interface ArchiveDrop {
  rank: number;
  slug: string;
  brand: string;
  name: string;
  retailer: string;
  currentPriceCents: number;
  previousPriceCents: number;
  dropCents: number;
  dropPercent: number;
  observedDate: string;
  daysAgo: number;
  gapInsight: string;
  url: string;
}

interface ArchiveSnapshot {
  date: string;
  paragraph: string;
  drops: ArchiveDrop[];
}

const ARCHIVE_DIR = path.join(process.cwd(), "public/data/weekly-archive");

function readDates(): string[] {
  const indexPath = path.join(ARCHIVE_DIR, "index.json");
  if (!fs.existsSync(indexPath)) return [];
  try {
    return JSON.parse(fs.readFileSync(indexPath, "utf-8"));
  } catch {
    return [];
  }
}

function readSnapshot(date: string): ArchiveSnapshot | null {
  const p = path.join(ARCHIVE_DIR, `${date}.json`);
  if (!fs.existsSync(p)) return null;
  try {
    return JSON.parse(fs.readFileSync(p, "utf-8"));
  } catch {
    return null;
  }
}

export function generateStaticParams() {
  return readDates().map((date) => ({ date }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ date: string }>;
}): Promise<Metadata> {
  const { date } = await params;
  const snap = readSnapshot(date);
  if (!snap) return { title: "Archive Issue Not Found" };
  return {
    title: `Weekly price drops — ${date} — OffGridEmpire`,
    description: `${snap.drops.length} observed off-grid solar kit price drops, archived for ${date}.`,
    alternates: { canonical: `/this-week/archive/${date}` },
  };
}

function formatPrice(cents: number): string {
  return `$${Math.round(cents / 100).toLocaleString("en-US")}`;
}

export default async function ArchiveIssuePage({
  params,
}: {
  params: Promise<{ date: string }>;
}) {
  const { date } = await params;
  const snap = readSnapshot(date);
  if (!snap) notFound();

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-10">
      <BreadcrumbJsonLd
        items={[
          { name: "Home", url: "/" },
          { name: "This Week's Drops", url: "/this-week" },
          { name: "Archive", url: "/this-week/archive" },
          { name: snap.date, url: `/this-week/archive/${snap.date}` },
        ]}
      />

      <nav className="text-xs text-[var(--ink-muted)] mb-6">
        <Link href="/" className="hover:text-[var(--accent)]">Home</Link>
        <span className="mx-2">/</span>
        <Link href="/this-week/" className="hover:text-[var(--accent)]">This Week&apos;s Drops</Link>
        <span className="mx-2">/</span>
        <Link href="/this-week/archive/" className="hover:text-[var(--accent)]">Archive</Link>
        <span className="mx-2">/</span>
        <span>{snap.date}</span>
      </nav>

      <header className="mb-10">
        <p className="eyebrow mb-3">Issue dated {snap.date}</p>
        <h1 className="font-display text-3xl sm:text-4xl text-[var(--ink)] tracking-tight">
          Weekly price drops — {snap.date}
        </h1>
        {snap.paragraph && !snap.paragraph.startsWith("[") && (
          <p className="mt-4 max-w-3xl text-base text-[var(--ink-soft)] leading-relaxed">
            {snap.paragraph}
          </p>
        )}
      </header>

      <div className="space-y-3">
        {snap.drops.map((d) => (
          <article
            key={d.slug}
            className="border border-[var(--rule)] rounded-sm bg-[var(--paper)] p-5"
          >
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-3 flex-wrap">
                  <span className="text-xs tabular text-[var(--ink-muted)]">#{d.rank}</span>
                  <Link
                    href={`/kits/${d.slug}/`}
                    className="font-display text-lg text-[var(--ink)] hover:text-[var(--accent)]"
                  >
                    {d.brand} {d.name}
                  </Link>
                </div>
                <p className="mt-1 text-xs text-[var(--ink-muted)]">
                  Observed at <span className="text-[var(--ink-soft)]">{d.retailer}</span> ·
                  Last observed: {d.observedDate}
                </p>
                <p className="mt-2 text-sm text-[var(--ink-soft)]">{d.gapInsight}</p>
              </div>

              <div className="text-right shrink-0">
                <div className="font-display text-2xl text-[var(--ink)] tabular">
                  {formatPrice(d.currentPriceCents)}
                </div>
                <div className="text-xs text-[var(--ink-muted)] tabular line-through">
                  was {formatPrice(d.previousPriceCents)}
                </div>
                <div className="mt-1 inline-flex items-center gap-1 rounded-sm bg-[var(--accent)]/10 px-2 py-0.5 text-xs font-semibold text-[var(--accent)] tabular">
                  −{formatPrice(d.dropCents)} ({d.dropPercent.toFixed(1)}%)
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>

      <p className="mt-10 text-sm text-[var(--ink-muted)]">
        <Link href="/this-week/" className="text-[var(--accent)] hover:underline">
          See the live this-week page →
        </Link>
      </p>
    </div>
  );
}
