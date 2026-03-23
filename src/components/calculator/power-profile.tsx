"use client";

import { useState, useCallback } from "react";
import type { SystemAssumptions, SizingResult, KitMatch } from "@/lib/calculator/types";
import { SUN_TIERS } from "@/lib/calculator/sun-hours";

interface PowerProfileProps {
  sizing: SizingResult;
  assumptions: SystemAssumptions;
  topMatch: KitMatch | null;
  shareUrl: string;
}

// ── Text builder ────────────────────────────────────────────────────────────

function buildProfileText(
  sizing: SizingResult,
  assumptions: SystemAssumptions,
  topMatch: KitMatch | null,
  shareUrl: string
): string {
  const tierInfo = SUN_TIERS[assumptions.sunTier];
  let text = `⚡ My Off-Grid Power Profile\n\n`;
  text += `Daily energy: ${sizing.totalDailyWh.toLocaleString()} Wh/day\n`;
  text += `Solar needed: ${sizing.requiredPanelWatts.toLocaleString()}W\n`;
  text += `Storage needed: ${sizing.requiredStorageWh.toLocaleString()} Wh\n`;
  text += `Inverter needed: ${sizing.requiredInverterWatts.toLocaleString()}W\n\n`;
  text += `📍 ${tierInfo.label} (${assumptions.sunHoursPerDay} peak sun hours)`;
  if (assumptions.zipCode) text += ` · ZIP ${assumptions.zipCode}`;
  text += `\n`;
  text += `🔋 ${assumptions.batteryChemistry === "lifepo4" ? "LiFePO4" : "AGM"} · ${assumptions.controllerType.toUpperCase()} · ${assumptions.autonomyDays} day${assumptions.autonomyDays > 1 ? "s" : ""} autonomy\n`;

  if (topMatch) {
    const fitPct = Math.round(topMatch.score);
    text += `\nClosest kit: ${topMatch.kit.name} (${fitPct}% fit)\n`;
    if (topMatch.gaps.length > 0) {
      text += `  ↳ ${topMatch.gaps[0]}\n`;
    }
  } else {
    text += `\nNo tracked kit fully matches this load.\n`;
  }

  text += `\nvia ${shareUrl}`;
  return text;
}

// ── Canvas renderer ─────────────────────────────────────────────────────────

function drawProfileToCanvas(
  sizing: SizingResult,
  assumptions: SystemAssumptions,
  topMatch: KitMatch | null,
  shareUrl: string,
  canvas: HTMLCanvasElement
): void {
  const W = 600;
  const PAD = 32;
  const ctx = canvas.getContext("2d")!;

  const lineH = 28;
  const sectionGap = 16;

  // Compute height
  let contentH = PAD; // top padding
  contentH += 48; // header
  contentH += sectionGap;
  contentH += lineH * 4; // 4 metric rows
  contentH += sectionGap + 2; // dashed separator
  contentH += lineH * 2; // location + assumptions
  contentH += sectionGap + 2; // dashed separator
  contentH += lineH * (topMatch ? 2 : 1); // kit match or "no match"
  contentH += sectionGap;
  contentH += lineH; // footer
  contentH += PAD; // bottom padding

  const H = contentH;
  const DPR = 2;
  canvas.width = W * DPR;
  canvas.height = H * DPR;
  canvas.style.width = `${W}px`;
  canvas.style.height = `${H}px`;
  ctx.scale(DPR, DPR);

  // Background
  ctx.fillStyle = "#0f1419";
  ctx.fillRect(0, 0, W, H);

  // Subtle border
  ctx.strokeStyle = "#1e2830";
  ctx.lineWidth = 1;
  ctx.strokeRect(0.5, 0.5, W - 1, H - 1);

  let y = PAD;

  // ── Header bar ──────────────────────────────────────────────────────────
  ctx.fillStyle = "#f59e0b";
  ctx.fillRect(PAD, y, W - PAD * 2, 3);
  y += 12;

  ctx.font = "bold 20px 'JetBrains Mono', monospace";
  ctx.fillStyle = "#f59e0b";
  ctx.fillText("⚡ POWER PROFILE", PAD, y + 20);

  ctx.font = "12px 'JetBrains Mono', monospace";
  ctx.fillStyle = "#6b7280";
  ctx.textAlign = "right";
  ctx.fillText("offgridempire.com", W - PAD, y + 20);
  ctx.textAlign = "left";

  y += 48 + sectionGap;

  // ── Sizing metrics ──────────────────────────────────────────────────────
  const metrics = [
    { label: "Daily Energy", value: `${sizing.totalDailyWh.toLocaleString()} Wh/day` },
    { label: "Solar Needed", value: `${sizing.requiredPanelWatts.toLocaleString()}W` },
    { label: "Storage Needed", value: `${sizing.requiredStorageWh.toLocaleString()} Wh` },
    { label: "Inverter Needed", value: `${sizing.requiredInverterWatts.toLocaleString()}W` },
  ];

  for (const m of metrics) {
    ctx.font = "13px 'Inter', 'DM Sans', sans-serif";
    ctx.fillStyle = "#9ca3af";
    ctx.fillText(m.label, PAD, y);

    ctx.font = "bold 15px 'JetBrains Mono', monospace";
    ctx.fillStyle = "#f59e0b";
    ctx.textAlign = "right";
    ctx.fillText(m.value, W - PAD, y);
    ctx.textAlign = "left";

    y += lineH;
  }

  // ── Dashed separator ────────────────────────────────────────────────────
  y += sectionGap / 2;
  ctx.setLineDash([4, 4]);
  ctx.strokeStyle = "#374151";
  ctx.beginPath();
  ctx.moveTo(PAD, y);
  ctx.lineTo(W - PAD, y);
  ctx.stroke();
  ctx.setLineDash([]);
  y += sectionGap / 2 + 2;

  // ── Location + assumptions ──────────────────────────────────────────────
  const tierInfo = SUN_TIERS[assumptions.sunTier];
  let locationStr = `${tierInfo.label} · ${assumptions.sunHoursPerDay} peak sun hours`;
  if (assumptions.zipCode) locationStr = `ZIP ${assumptions.zipCode} · ${locationStr}`;

  ctx.font = "13px 'Inter', 'DM Sans', sans-serif";
  ctx.fillStyle = "#9ca3af";
  ctx.fillText("📍 " + locationStr, PAD, y);
  y += lineH;

  const chemLabel = assumptions.batteryChemistry === "lifepo4" ? "LiFePO4" : "AGM";
  const assumptionStr = `🔋 ${chemLabel} · ${assumptions.controllerType.toUpperCase()} · ${assumptions.autonomyDays}d autonomy`;
  ctx.fillText(assumptionStr, PAD, y);
  y += lineH;

  // ── Dashed separator ────────────────────────────────────────────────────
  y += sectionGap / 2;
  ctx.setLineDash([4, 4]);
  ctx.strokeStyle = "#374151";
  ctx.beginPath();
  ctx.moveTo(PAD, y);
  ctx.lineTo(W - PAD, y);
  ctx.stroke();
  ctx.setLineDash([]);
  y += sectionGap / 2 + 2;

  // ── Kit match ───────────────────────────────────────────────────────────
  if (topMatch) {
    const fitPct = Math.round(topMatch.score);
    ctx.font = "13px 'Inter', 'DM Sans', sans-serif";
    ctx.fillStyle = "#9ca3af";
    ctx.fillText("Closest tracked kit:", PAD, y);

    ctx.font = "bold 14px 'JetBrains Mono', monospace";
    ctx.fillStyle = fitPct >= 100 ? "#22c55e" : fitPct >= 80 ? "#f59e0b" : "#ef4444";
    ctx.textAlign = "right";
    ctx.fillText(`${fitPct}% fit`, W - PAD, y);
    ctx.textAlign = "left";
    y += lineH;

    ctx.font = "13px 'Inter', 'DM Sans', sans-serif";
    ctx.fillStyle = "#d1d5db";
    ctx.fillText(topMatch.kit.name, PAD + 12, y);
    if (topMatch.gaps.length > 0) {
      ctx.fillStyle = "#6b7280";
      ctx.font = "12px 'JetBrains Mono', monospace";
      const gapText = topMatch.gaps[0];
      if (ctx.measureText(topMatch.kit.name).width + ctx.measureText(" · " + gapText).width + 12 < W - PAD * 2) {
        ctx.fillText(" · " + gapText, PAD + 12 + ctx.measureText(topMatch.kit.name).width, y);
      }
    }
  } else {
    ctx.font = "13px 'Inter', 'DM Sans', sans-serif";
    ctx.fillStyle = "#ef4444";
    ctx.fillText("No tracked kit fully matches this load", PAD, y);
  }

  y += lineH + sectionGap;

  // ── Footer ──────────────────────────────────────────────────────────────
  ctx.fillStyle = "#f59e0b";
  ctx.fillRect(PAD, y - 8, W - PAD * 2, 1);

  ctx.font = "11px 'JetBrains Mono', monospace";
  ctx.fillStyle = "#6b7280";
  ctx.fillText("Generated at offgridempire.com/calculator", PAD, y + 10);

  ctx.textAlign = "right";
  ctx.fillText(new Date().toLocaleDateString(), W - PAD, y + 10);
  ctx.textAlign = "left";
}

// ── Component ───────────────────────────────────────────────────────────────

export function PowerProfile({ sizing, assumptions, topMatch, shareUrl }: PowerProfileProps) {
  const [shareState, setShareState] = useState<"idle" | "copied" | "downloaded" | "shared">("idle");

  const flashState = useCallback((state: "copied" | "downloaded" | "shared") => {
    setShareState(state);
    setTimeout(() => setShareState("idle"), 2000);
  }, []);

  const handleCopy = useCallback(async () => {
    const text = buildProfileText(sizing, assumptions, topMatch, shareUrl);
    await navigator.clipboard.writeText(text);
    flashState("copied");
  }, [sizing, assumptions, topMatch, shareUrl, flashState]);

  const handleDownload = useCallback(() => {
    const canvas = document.createElement("canvas");
    drawProfileToCanvas(sizing, assumptions, topMatch, shareUrl, canvas);
    const link = document.createElement("a");
    link.download = "power-profile.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
    flashState("downloaded");
  }, [sizing, assumptions, topMatch, shareUrl, flashState]);

  const handleShare = useCallback(async () => {
    const text = buildProfileText(sizing, assumptions, topMatch, shareUrl);

    if (navigator.share) {
      try {
        const canvas = document.createElement("canvas");
        drawProfileToCanvas(sizing, assumptions, topMatch, shareUrl, canvas);
        const blob = await new Promise<Blob | null>((resolve) =>
          canvas.toBlob(resolve, "image/png")
        );
        if (blob) {
          const file = new File([blob], "power-profile.png", { type: "image/png" });
          await navigator.share({
            title: "My Off-Grid Power Profile",
            text,
            files: [file],
          });
          flashState("shared");
          return;
        }
      } catch {
        // files not supported, fall through
      }

      try {
        await navigator.share({ title: "My Off-Grid Power Profile", text });
        flashState("shared");
        return;
      } catch {
        // user cancelled
      }
    }

    await handleCopy();
  }, [sizing, assumptions, topMatch, shareUrl, flashState, handleCopy]);

  const handleCopyLink = useCallback(async () => {
    await navigator.clipboard.writeText(shareUrl);
    flashState("copied");
  }, [shareUrl, flashState]);

  const feedbackLabel =
    shareState === "copied" ? "Copied!" :
    shareState === "downloaded" ? "Saved!" :
    shareState === "shared" ? "Shared!" : null;

  return (
    <div className="rounded border border-[var(--accent)]/20 bg-[var(--bg-surface)] p-4 mb-8">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">Share Your Power Profile</h3>

        {feedbackLabel ? (
          <span className="text-xs font-medium text-[var(--accent)] animate-pulse">
            {feedbackLabel}
          </span>
        ) : (
          <div className="flex items-center gap-1">
            {/* Copy text */}
            <button
              onClick={handleCopy}
              className="p-1.5 rounded text-[var(--text-muted)] hover:text-[var(--accent)] hover:bg-[var(--bg-primary)] transition-colors"
              title="Copy as text"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
              </svg>
            </button>

            {/* Download PNG */}
            <button
              onClick={handleDownload}
              className="p-1.5 rounded text-[var(--text-muted)] hover:text-[var(--accent)] hover:bg-[var(--bg-primary)] transition-colors"
              title="Download PNG"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
            </button>

            {/* Share */}
            <button
              onClick={handleShare}
              className="p-1.5 rounded text-[var(--text-muted)] hover:text-[var(--accent)] hover:bg-[var(--bg-primary)] transition-colors"
              title="Share"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="18" cy="5" r="3" />
                <circle cx="6" cy="12" r="3" />
                <circle cx="18" cy="19" r="3" />
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
              </svg>
            </button>

            {/* Copy link */}
            <button
              onClick={handleCopyLink}
              className="p-1.5 rounded text-[var(--text-muted)] hover:text-[var(--accent)] hover:bg-[var(--bg-primary)] transition-colors"
              title="Copy link"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
                <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* Mini preview of what gets shared */}
      <div className="rounded bg-[var(--bg-primary)] border border-[var(--border)] p-3 font-mono text-xs text-[var(--text-muted)] space-y-1">
        <div className="text-[var(--accent)] font-semibold">⚡ Power Profile</div>
        <div>
          {sizing.totalDailyWh.toLocaleString()} Wh/day · {sizing.requiredPanelWatts.toLocaleString()}W solar · {sizing.requiredStorageWh.toLocaleString()} Wh storage
        </div>
        {topMatch && (
          <div className="text-[var(--text-muted)]">
            Best match: {topMatch.kit.name} ({Math.round(topMatch.score)}% fit)
          </div>
        )}
      </div>
    </div>
  );
}
