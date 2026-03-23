"use client";

import { useRef, useState, useCallback } from "react";
import type { Kit } from "@/lib/demo-data";

interface GapReceiptProps {
  kit: Kit;
}

const MAX_VISIBLE_ITEMS = 3;

function buildShareText(kit: Kit): string {
  const missing = kit.items.filter(
    (item) => !item.isIncluded && item.estimatedCost && item.estimatedCost > 0
  );
  const multiplier =
    kit.listedPrice > 0 ? (kit.trueCost / kit.listedPrice).toFixed(1) : null;

  let text = `🧾 Completion Gap Receipt: ${kit.name}\n\n`;
  text += `Advertised price: $${kit.listedPrice.toLocaleString()}\n`;
  text += `─────────────────\n`;
  text += `Required missing parts:\n`;
  missing.forEach((item) => {
    text += `  + ${item.role}: ~$${item.estimatedCost?.toLocaleString()}\n`;
  });
  text += `─────────────────\n`;
  text += `Hidden cost to finish: +$${kit.missingCost.toLocaleString()}\n`;
  text += `═════════════════\n`;
  text += `Real build cost: $${kit.trueCost.toLocaleString()}`;
  if (multiplier) text += ` (${multiplier}x advertised)`;
  text += `\n\nvia offgridempire.com/kits/${kit.slug}`;
  return text;
}

function drawReceiptToCanvas(
  kit: Kit,
  canvas: HTMLCanvasElement
): void {
  const missing = kit.items.filter(
    (item) => !item.isIncluded && item.estimatedCost && item.estimatedCost > 0
  );
  const multiplier =
    kit.listedPrice > 0 ? (kit.trueCost / kit.listedPrice).toFixed(1) : null;

  const W = 600;
  const PAD = 32;
  const ctx = canvas.getContext("2d")!;

  // Measure height dynamically
  const lineH = 28;
  const sectionGap = 16;
  const headerH = 60;
  const footerH = 48;
  const itemsH = missing.length * lineH;
  const contentH =
    headerH +
    sectionGap +
    lineH + // advertised price
    sectionGap +
    20 + // "Required missing parts" label
    itemsH +
    sectionGap +
    lineH + // hidden cost
    sectionGap +
    lineH + // real build cost
    sectionGap +
    (multiplier ? lineH + sectionGap : 0) +
    lineH + // scope note
    footerH;

  const H = contentH + PAD * 2;
  canvas.width = W * 2;
  canvas.height = H * 2;
  canvas.style.width = `${W}px`;
  canvas.style.height = `${H}px`;
  ctx.scale(2, 2);

  // Background
  ctx.fillStyle = "#0f1419";
  ctx.fillRect(0, 0, W, H);

  // Header bar
  ctx.fillStyle = "#1a0505";
  ctx.fillRect(0, 0, W, headerH);
  ctx.fillStyle = "#ef4444";
  ctx.font = "bold 11px monospace";
  ctx.textBaseline = "middle";
  ctx.fillText("⚠  COMPLETION GAP RECEIPT", PAD, headerH / 2);

  let y = headerH + PAD;

  // Kit name
  ctx.fillStyle = "#e5e5e5";
  ctx.font = "bold 16px sans-serif";
  ctx.fillText(kit.name, PAD, y);
  y += lineH + sectionGap;

  // Advertised price
  ctx.fillStyle = "#a3a3a3";
  ctx.font = "14px monospace";
  ctx.fillText("Advertised price", PAD, y);
  ctx.fillStyle = "#e5e5e5";
  ctx.font = "bold 14px monospace";
  ctx.textAlign = "right";
  ctx.fillText(`$${kit.listedPrice.toLocaleString()}`, W - PAD, y);
  ctx.textAlign = "left";
  y += lineH;

  // Dashed line
  ctx.strokeStyle = "#333";
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(PAD, y);
  ctx.lineTo(W - PAD, y);
  ctx.stroke();
  ctx.setLineDash([]);
  y += sectionGap;

  // Missing parts label
  ctx.fillStyle = "#ef4444";
  ctx.font = "bold 10px monospace";
  ctx.fillText("REQUIRED MISSING PARTS", PAD, y);
  y += 20;

  // Missing items
  missing.forEach((item) => {
    ctx.fillStyle = "#a3a3a3";
    ctx.font = "13px monospace";
    ctx.textAlign = "left";
    ctx.fillText(`+ ${item.role}`, PAD + 12, y);
    ctx.fillStyle = "#ef4444";
    ctx.font = "13px monospace";
    ctx.textAlign = "right";
    ctx.fillText(`~$${item.estimatedCost?.toLocaleString()}`, W - PAD, y);
    ctx.textAlign = "left";
    y += lineH;
  });

  // Dashed line
  ctx.strokeStyle = "#333";
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(PAD, y);
  ctx.lineTo(W - PAD, y);
  ctx.stroke();
  ctx.setLineDash([]);
  y += sectionGap;

  // Hidden cost
  ctx.fillStyle = "#ef4444";
  ctx.font = "bold 14px monospace";
  ctx.fillText("Hidden cost to finish", PAD, y);
  ctx.textAlign = "right";
  ctx.fillText(`+$${kit.missingCost.toLocaleString()}`, W - PAD, y);
  ctx.textAlign = "left";
  y += lineH;

  // Solid line
  ctx.strokeStyle = "#555";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(PAD, y);
  ctx.lineTo(W - PAD, y);
  ctx.stroke();
  ctx.lineWidth = 1;
  y += sectionGap;

  // Real build cost
  ctx.fillStyle = "#e5e5e5";
  ctx.font = "bold 16px monospace";
  ctx.fillText("Real build cost", PAD, y);
  ctx.fillStyle = "#f59e0b";
  ctx.font = "bold 22px monospace";
  ctx.textAlign = "right";
  ctx.fillText(`$${kit.trueCost.toLocaleString()}`, W - PAD, y);
  ctx.textAlign = "left";
  y += lineH + sectionGap;

  // Multiplier callout
  if (multiplier) {
    const calloutText = `+$${kit.missingCost.toLocaleString()} hidden cost · ${multiplier}x the advertised price`;
    const calloutW = W - PAD * 2;
    ctx.fillStyle = "#1a0505";
    ctx.strokeStyle = "#ef444440";
    ctx.lineWidth = 1;
    const calloutH = 32;
    const calloutX = PAD;
    const calloutY = y - 10;
    ctx.beginPath();
    ctx.roundRect(calloutX, calloutY, calloutW, calloutH, 4);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#ef4444";
    ctx.font = "bold 12px monospace";
    ctx.textAlign = "center";
    ctx.fillText(calloutText, W / 2, y + 6);
    ctx.textAlign = "left";
    y += lineH + sectionGap;
  }

  // Scope note
  ctx.fillStyle = "#666";
  ctx.font = "10px monospace";
  ctx.fillText(
    "Real build cost = advertised kit + required missing parts only.",
    PAD,
    y
  );
  y += 16;
  ctx.fillText("Optional accessories and tools are not included.", PAD, y);
  y += sectionGap;

  // Footer
  const footerY = H - footerH;
  ctx.fillStyle = "#0a0f14";
  ctx.fillRect(0, footerY, W, footerH);
  ctx.fillStyle = "#666";
  ctx.font = "10px monospace";
  ctx.fillText("offgridempire.com", PAD, footerY + footerH / 2);
  const priceDate = new Date(kit.priceObservedAt);
  const dateStr = priceDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  ctx.textAlign = "right";
  ctx.fillText(`Price checked ${dateStr}`, W - PAD, footerY + footerH / 2);
  ctx.textAlign = "left";
}

export function GapReceipt({ kit }: GapReceiptProps) {
  const receiptRef = useRef<HTMLDivElement>(null);
  const [shareState, setShareState] = useState<
    "idle" | "copied" | "downloaded" | "shared"
  >("idle");

  const hasMissing = kit.missingCost > 0;
  const requiredMissing = kit.items.filter(
    (item) => !item.isIncluded && item.estimatedCost && item.estimatedCost > 0
  );
  const multiplier =
    kit.listedPrice > 0
      ? (kit.trueCost / kit.listedPrice).toFixed(1)
      : null;
  const priceDate = new Date(kit.priceObservedAt);

  const flashState = useCallback(
    (state: "copied" | "downloaded" | "shared") => {
      setShareState(state);
      setTimeout(() => setShareState("idle"), 2000);
    },
    []
  );

  const handleCopy = useCallback(async () => {
    const text = buildShareText(kit);
    await navigator.clipboard.writeText(text);
    flashState("copied");
  }, [kit, flashState]);

  const handleDownload = useCallback(() => {
    const canvas = document.createElement("canvas");
    drawReceiptToCanvas(kit, canvas);
    const link = document.createElement("a");
    link.download = `gap-receipt-${kit.slug}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
    flashState("downloaded");
  }, [kit, flashState]);

  const handleShare = useCallback(async () => {
    const text = buildShareText(kit);
    const url = `https://offgridempire.com/kits/${kit.slug}`;

    if (navigator.share) {
      // Try sharing image if supported
      try {
        const canvas = document.createElement("canvas");
        drawReceiptToCanvas(kit, canvas);
        const blob = await new Promise<Blob | null>((resolve) =>
          canvas.toBlob(resolve, "image/png")
        );
        if (blob) {
          const file = new File([blob], `gap-receipt-${kit.slug}.png`, {
            type: "image/png",
          });
          await navigator.share({
            title: `${kit.name} — Real Cost Breakdown`,
            text,
            url,
            files: [file],
          });
          flashState("shared");
          return;
        }
      } catch {
        // files not supported, fall through to text share
      }

      try {
        await navigator.share({ title: `${kit.name} — Real Cost Breakdown`, text, url });
        flashState("shared");
        return;
      } catch {
        // user cancelled or error
      }
    }

    // Fallback: copy to clipboard
    await handleCopy();
  }, [kit, flashState, handleCopy]);

  if (!hasMissing) {
    return (
      <div className="rounded border border-[var(--success)]/30 bg-[var(--success)]/5 p-5">
        <div className="flex items-center gap-2 mb-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--success)]/20">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--success)]">
              <path d="M20 6L9 17l-5-5" />
            </svg>
          </span>
          <span className="font-mono text-sm font-bold text-[var(--success)]">
            Complete Kit — Advertised Price Is the Real Price
          </span>
        </div>
        <p className="text-xs text-[var(--text-secondary)] ml-8">
          All required components for a working system are included.
          No additional purchases needed.
        </p>
        <div className="mt-3 ml-8 flex items-center gap-3">
          <span className="font-mono text-[10px] text-[var(--text-muted)]">
            Verified {priceDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
          </span>
          <a href="/methodology" className="inline-flex items-center gap-1 text-[10px] text-[var(--accent)] hover:text-[var(--accent-hover)]">
            Methodology
            <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" /></svg>
          </a>
        </div>
      </div>
    );
  }

  const visibleItems = requiredMissing.slice(0, MAX_VISIBLE_ITEMS);
  const hiddenCount = requiredMissing.length - MAX_VISIBLE_ITEMS;

  const shareLabel =
    shareState === "copied"
      ? "Copied!"
      : shareState === "downloaded"
        ? "Saved!"
        : shareState === "shared"
          ? "Shared!"
          : null;

  return (
    <div
      ref={receiptRef}
      className="rounded border border-[var(--border)] bg-[var(--bg-surface)] overflow-hidden"
    >
      {/* Header */}
      <div className="bg-[var(--danger)]/10 border-b border-[var(--danger)]/20 px-5 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--danger)]">
            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          <span className="font-mono text-xs font-bold text-[var(--danger)] uppercase tracking-wider">
            Completion Gap Receipt
          </span>
        </div>

        {/* Share actions */}
        <div className="flex items-center gap-1.5">
          {shareState !== "idle" ? (
            <span className="inline-flex items-center gap-1 rounded border border-[var(--success)]/40 bg-[var(--success)]/10 px-2 py-1 text-[10px] font-mono text-[var(--success)] transition-all">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6L9 17l-5-5" />
              </svg>
              {shareLabel}
            </span>
          ) : (
            <>
              {/* Copy text */}
              <button
                onClick={handleCopy}
                title="Copy as text"
                className="inline-flex items-center justify-center rounded border border-[var(--border)] bg-[var(--bg-primary)] w-7 h-7 text-[var(--text-muted)] hover:text-[var(--accent)] hover:border-[var(--border-accent)] transition-colors"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                </svg>
              </button>

              {/* Download image */}
              <button
                onClick={handleDownload}
                title="Download as image"
                className="inline-flex items-center justify-center rounded border border-[var(--border)] bg-[var(--bg-primary)] w-7 h-7 text-[var(--text-muted)] hover:text-[var(--accent)] hover:border-[var(--border-accent)] transition-colors"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
                </svg>
              </button>

              {/* Share (native or fallback) */}
              <button
                onClick={handleShare}
                title="Share"
                className="inline-flex items-center gap-1 rounded border border-[var(--border)] bg-[var(--bg-primary)] px-2 py-1 text-[10px] font-mono text-[var(--text-muted)] hover:text-[var(--accent)] hover:border-[var(--border-accent)] transition-colors"
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13" />
                </svg>
                Share
              </button>
            </>
          )}
        </div>
      </div>

      {/* Receipt body */}
      <div className="p-5 space-y-3 font-mono text-sm">
        {/* Advertised price */}
        <div className="flex items-center justify-between">
          <span className="text-[var(--text-secondary)]">Advertised price</span>
          <span className="text-[var(--text-primary)] font-semibold">
            ${kit.listedPrice.toLocaleString()}
          </span>
        </div>

        <div className="border-t border-dashed border-[var(--border)]" />

        {/* Required missing items */}
        <div className="space-y-2">
          <span className="text-[10px] uppercase tracking-wider text-[var(--danger)]">
            Required missing parts
          </span>
          {visibleItems.map((item, i) => (
            <div key={i} className="flex items-center justify-between pl-3">
              <span className="text-xs text-[var(--text-secondary)]">
                + {item.role}
              </span>
              <span className="text-xs text-[var(--danger)] font-medium">
                ~${item.estimatedCost?.toLocaleString()}
              </span>
            </div>
          ))}
          {hiddenCount > 0 && (
            <div className="pl-3">
              <span className="text-xs text-[var(--text-muted)]">
                + {hiddenCount} more required item{hiddenCount > 1 ? "s" : ""}
              </span>
            </div>
          )}
        </div>

        <div className="border-t border-dashed border-[var(--border)]" />

        {/* Hidden cost subtotal */}
        <div className="flex items-center justify-between">
          <span className="text-[var(--danger)] font-semibold">Hidden cost to finish</span>
          <span className="text-[var(--danger)] font-bold text-base">
            +${kit.missingCost.toLocaleString()}
          </span>
        </div>

        <div className="border-t-2 border-[var(--border)]" />

        {/* Real build cost — THE hero line */}
        <div className="flex items-center justify-between py-1">
          <span className="text-[var(--text-primary)] font-bold text-base">
            Real build cost
          </span>
          <span className="text-[var(--accent)] font-bold text-2xl">
            ${kit.trueCost.toLocaleString()}
          </span>
        </div>

        {/* Gap callout — using absolute dollar amount, not percentage */}
        <div className="rounded bg-[var(--danger)]/10 border border-[var(--danger)]/20 px-3 py-2 text-center">
          <span className="text-xs text-[var(--danger)] font-semibold">
            +${kit.missingCost.toLocaleString()} hidden cost
          </span>
          {multiplier && (
            <span className="text-xs text-[var(--danger)]">
              {" "}&middot; {multiplier}x the advertised price
            </span>
          )}
        </div>

        {/* Scope note */}
        <p className="text-[10px] text-[var(--text-muted)] leading-relaxed">
          Real build cost = advertised kit + required missing parts only.
          Optional accessories and tools are not included in this total.
        </p>
      </div>

      {/* Footer — defensible when screenshotted */}
      <div className="bg-[var(--bg-primary)] border-t border-[var(--border)] px-5 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-[var(--text-muted)]">
            offgridempire.com
          </span>
          <span className="text-[10px] text-[var(--text-muted)]">
            Price checked {priceDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
          </span>
        </div>
        <a
          href="/methodology"
          className="inline-flex items-center gap-1 text-[10px] text-[var(--accent)] hover:text-[var(--accent-hover)]"
        >
          Methodology
          <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" />
          </svg>
        </a>
      </div>
    </div>
  );
}
