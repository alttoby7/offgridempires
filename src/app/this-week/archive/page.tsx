import type { Metadata } from "next";
import Link from "next/link";
import * as fs from "fs";
import * as path from "path";
import { BreadcrumbJsonLd } from "@/components/json-ld";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Weekly Price-Drops Archive — OffGridEmpire",
  description:
    "Every Tuesday's index of off-grid solar kit price drops, archived. Permanent shareable URLs for each issue.",
  alternates: { canonical: "/this-week/archive" },
};

interface ArchiveEntry {
  date: string;
  paragraph?: string;
  drops?: { rank: number; brand: string; name: string }[];
}

function readArchiveDates(): string[] {
  const indexPath = path.join(process.cwd(), "public/data/weekly-archive/index.json");
  if (!fs.existsSync(indexPath)) return [];
  try {
    return JSON.parse(fs.readFileSync(indexPath, "utf-8"));
  } catch {
    return [];
  }
}

function readSnapshot(date: string): ArchiveEntry | null {
  const p = path.join(process.cwd(), `public/data/weekly-archive/${date}.json`);
  if (!fs.existsSync(p)) return null;
  try {
    return JSON.parse(fs.readFileSync(p, "utf-8"));
  } catch {
    return null;
  }
}

export default function WeeklyArchiveIndex() {
  const dates = readArchiveDates();

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-10">
      <BreadcrumbJsonLd
        items={[
          { name: "Home", url: "/" },
          { name: "This Week's Drops", url: "/this-week" },
          { name: "Archive", url: "/this-week/archive" },
        ]}
      />

      <nav className="text-xs text-[var(--ink-muted)] mb-6">
        <Link href="/" className="hover:text-[var(--accent)]">Home</Link>
        <span className="mx-2">/</span>
        <Link href="/this-week/" className="hover:text-[var(--accent)]">This Week&apos;s Drops</Link>
        <span className="mx-2">/</span>
        <span>Archive</span>
      </nav>

      <header className="mb-10">
        <h1 className="font-display text-3xl sm:text-4xl text-[var(--ink)] tracking-tight">
          Weekly price-drops archive
        </h1>
        <p className="mt-3 text-base text-[var(--ink-soft)] max-w-2xl">
          Every Tuesday we publish the biggest observed off-grid kit price drops. Each issue gets
          its own permanent URL.
        </p>
      </header>

      {dates.length === 0 ? (
        <p className="text-[var(--ink-soft)]">No archived issues yet — the first one ships Tuesday.</p>
      ) : (
        <ul className="space-y-2">
          {dates.map((date) => {
            const snap = readSnapshot(date);
            const dropCount = snap?.drops?.length ?? 0;
            return (
              <li key={date} className="border-b border-[var(--rule)] py-3">
                <Link
                  href={`/this-week/archive/${date}/`}
                  className="flex items-baseline justify-between gap-4 group"
                >
                  <span className="font-display text-lg text-[var(--ink)] group-hover:text-[var(--accent)]">
                    {date}
                  </span>
                  <span className="text-xs text-[var(--ink-muted)] tabular">
                    {dropCount} drop{dropCount === 1 ? "" : "s"}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
