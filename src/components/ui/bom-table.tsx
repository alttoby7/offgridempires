"use client";

import { useState } from "react";
import type { KitItem } from "@/lib/demo-data";

function StatusIcon({ included }: { included: boolean }) {
  if (included) {
    return (
      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--success)]/15">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--success)]">
          <path d="M20 6L9 17l-5-5" />
        </svg>
      </span>
    );
  }
  return (
    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--danger)]/15">
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--danger)]">
        <path d="M18 6L6 18M6 6l12 12" />
      </svg>
    </span>
  );
}

const AFFILIATE_TAG = "fidohikes-20";

function buildAffiliateUrl(asin: string): string {
  return `https://www.amazon.com/dp/${asin}?tag=${AFFILIATE_TAG}`;
}

function CostCell({ item }: { item: KitItem }) {
  if (item.isIncluded) {
    return <span className="font-mono text-xs text-[var(--success)]/70">Included</span>;
  }
  if (item.estimatedCost && item.estimatedCost > 0) {
    return (
      <span className="flex flex-col items-end gap-0.5">
        <span className="font-mono text-xs font-semibold text-[var(--danger)]">~${item.estimatedCost.toLocaleString()}</span>
        {item.recommendedAsin && (
          <a
            href={buildAffiliateUrl(item.recommendedAsin)}
            target="_blank"
            rel="noopener noreferrer sponsored"
            className="inline-flex items-center gap-1 text-[10px] font-medium text-[var(--accent)] hover:text-[var(--accent-hover)] transition-colors"
          >
            View on Amazon
            <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" />
            </svg>
          </a>
        )}
      </span>
    );
  }
  return <span className="font-mono text-xs text-[var(--text-muted)]">&mdash;</span>;
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

export function BomTable({
  items,
  missingCost,
}: {
  items: KitItem[];
  missingCost: number;
}) {
  const missingItems = items.filter((item) => !item.isIncluded);
  const includedItems = items.filter((item) => item.isIncluded);
  const [showIncluded, setShowIncluded] = useState(includedItems.length <= 4);

  return (
    <>
      {/* Desktop table */}
      <div className="hidden lg:block rounded border border-[var(--border)] bg-[var(--bg-surface)] overflow-hidden">
        {/* Table header */}
        <div className="grid grid-cols-12 gap-2 px-4 py-3 bg-[var(--bg-secondary)] border-b border-[var(--border)] text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">
          <div className="col-span-1">Status</div>
          <div className="col-span-2">Role</div>
          <div className="col-span-3">Component</div>
          <div className="col-span-3">Specs</div>
          <div className="col-span-1 text-center">Qty</div>
          <div className="col-span-2 text-right">Est. Cost</div>
        </div>

        {/* Missing items first — always visible */}
        {missingItems.length > 0 && (
          <>
            {missingItems.map((item, i) => (
              <DesktopRow key={`missing-${i}`} item={item} />
            ))}
          </>
        )}

        {/* Included items — collapsible */}
        {includedItems.length > 0 && (
          <>
            <button
              onClick={() => setShowIncluded(!showIncluded)}
              className="w-full grid grid-cols-12 gap-2 px-4 py-2.5 items-center border-y border-[var(--border)] bg-[var(--bg-primary)] hover:bg-[var(--bg-elevated)] transition-colors cursor-pointer"
            >
              <div className="col-span-12 flex items-center gap-2">
                <ChevronIcon open={showIncluded} />
                <span className="text-xs font-medium text-[var(--text-muted)]">
                  {showIncluded ? "Hide" : "Show"} {includedItems.length} included component{includedItems.length !== 1 ? "s" : ""}
                </span>
              </div>
            </button>

            {showIncluded &&
              includedItems.map((item, i) => (
                <DesktopRow key={`included-${i}`} item={item} />
              ))}
          </>
        )}

        {/* Missing cost total */}
        {missingCost > 0 && (
          <div className="grid grid-cols-12 gap-2 px-4 py-3 bg-[var(--bg-secondary)] border-t-2 border-[var(--danger)]/20">
            <div className="col-span-10">
              <span className="font-mono text-xs font-bold text-[var(--danger)]">
                Total estimated cost to complete this kit
              </span>
            </div>
            <div className="col-span-2 text-right">
              <span className="font-mono text-sm font-bold text-[var(--danger)]">
                ~${missingCost.toLocaleString()}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Mobile card layout */}
      <div className="lg:hidden space-y-2">
        {/* Missing items first */}
        {missingItems.map((item, i) => (
          <MobileCard key={`missing-${i}`} item={item} />
        ))}

        {/* Included items — collapsible */}
        {includedItems.length > 0 && (
          <>
            <button
              onClick={() => setShowIncluded(!showIncluded)}
              className="w-full rounded border border-[var(--border)] bg-[var(--bg-primary)] p-3 flex items-center gap-2 hover:bg-[var(--bg-elevated)] transition-colors"
            >
              <ChevronIcon open={showIncluded} />
              <span className="text-xs font-medium text-[var(--text-muted)]">
                {showIncluded ? "Hide" : "Show"} {includedItems.length} included component{includedItems.length !== 1 ? "s" : ""}
              </span>
            </button>

            {showIncluded &&
              includedItems.map((item, i) => (
                <MobileCard key={`included-${i}`} item={item} />
              ))}
          </>
        )}

        {/* Missing cost total */}
        {missingCost > 0 && (
          <div className="rounded bg-[var(--bg-secondary)] border border-[var(--danger)]/20 p-3 flex items-center justify-between">
            <span className="font-mono text-xs font-bold text-[var(--danger)]">Total to complete</span>
            <span className="font-mono text-sm font-bold text-[var(--danger)]">~${missingCost.toLocaleString()}</span>
          </div>
        )}
      </div>
    </>
  );
}

function DesktopRow({ item }: { item: KitItem }) {
  return (
    <div
      className={`grid grid-cols-12 gap-2 px-4 py-3.5 items-center border-b border-[var(--border)] last:border-b-0 ${
        !item.isIncluded ? "bg-[var(--danger)]/[0.03]" : ""
      }`}
    >
      <div className="col-span-1">
        <StatusIcon included={item.isIncluded} />
      </div>
      <div className="col-span-2">
        <span className="text-sm font-medium text-[var(--text-secondary)]">{item.role}</span>
      </div>
      <div className="col-span-3">
        <span className={`text-sm ${item.isIncluded ? "text-[var(--success)]" : "text-[var(--danger)]/70 italic"}`}>
          {item.name}
        </span>
        {!item.isIncluded && item.recommendedAsin && (
          <span className="block text-[10px] font-medium text-[var(--text-muted)] mt-0.5">recommended</span>
        )}
      </div>
      <div className="col-span-3">
        <span className="text-xs text-[var(--text-muted)]">{item.specs}</span>
        {item.notes && (
          <span className="block text-xs text-[var(--warning)] mt-0.5">&#9888; {item.notes}</span>
        )}
      </div>
      <div className="col-span-1 text-center">
        <span className="font-mono text-xs text-[var(--text-secondary)]">
          {item.quantity > 0 ? `${item.quantity}\u00d7` : "\u2014"}
        </span>
      </div>
      <div className="col-span-2 text-right">
        <CostCell item={item} />
      </div>
    </div>
  );
}

function MobileCard({ item }: { item: KitItem }) {
  return (
    <div
      className={`rounded border p-3 ${
        item.isIncluded
          ? "border-[var(--border)] bg-[var(--bg-surface)]"
          : "border-[var(--danger)]/20 bg-[var(--danger)]/[0.03]"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <StatusIcon included={item.isIncluded} />
          <div>
            <span className="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">
              {item.role}
            </span>
            <p className={`text-sm font-medium ${item.isIncluded ? "text-[var(--success)]" : "text-[var(--danger)]/70 italic"}`}>
              {item.name}
            </p>
            {!item.isIncluded && item.recommendedAsin && (
              <span className="text-[10px] font-medium text-[var(--text-muted)]">recommended</span>
            )}
          </div>
        </div>
        <div className="text-right shrink-0">
          <CostCell item={item} />
          {item.quantity > 0 && (
            <p className="font-mono text-xs text-[var(--text-muted)]">{item.quantity}&times;</p>
          )}
        </div>
      </div>
      <p className="text-xs text-[var(--text-muted)] mt-1 ml-7">{item.specs}</p>
      {item.notes && <p className="text-xs text-[var(--warning)] mt-1 ml-7">&#9888; {item.notes}</p>}
    </div>
  );
}
