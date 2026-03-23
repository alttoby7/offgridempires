"use client";

import { useRef, useEffect, useState, useCallback, useMemo } from "react";

// ── Types ───────────────────────────────────────────────────────────────────

export interface PricePoint {
  date: string; // ISO date string
  priceCents: number;
}

export interface PriceHistoryData {
  history: PricePoint[];
  currentPriceCents: number;
  allTimeLowCents: number;
  allTimeHighCents: number;
  averageCents: number;
}

type TimeRange = "30d" | "90d" | "6mo" | "1yr" | "all";

const RANGE_DAYS: Record<TimeRange, number | null> = {
  "30d": 30,
  "90d": 90,
  "6mo": 183,
  "1yr": 365,
  all: null,
};

// ── Theme Constants ─────────────────────────────────────────────────────────

const COLORS = {
  bg: "#0f1419",
  surface: "#161b22",
  border: "#21262d",
  amber: "#f59e0b",
  amberGlow: "rgba(245, 158, 11, 0.15)",
  amberLine: "rgba(245, 158, 11, 0.6)",
  green: "#22c55e",
  greenMuted: "rgba(34, 197, 94, 0.4)",
  red: "#ef4444",
  textMuted: "#656d76",
  textSecondary: "#8b949e",
  gridLine: "rgba(48, 54, 61, 0.6)",
  crosshair: "rgba(245, 158, 11, 0.3)",
};

const PADDING = { top: 24, right: 16, bottom: 32, left: 56 };

// ── Helpers ─────────────────────────────────────────────────────────────────

function formatPrice(cents: number): string {
  return `$${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function formatPriceExact(cents: number): string {
  return `$${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDateShort(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatDateFull(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function filterByRange(history: PricePoint[], range: TimeRange): PricePoint[] {
  const days = RANGE_DAYS[range];
  if (!days) return history;
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  // Normalize to YYYY-MM-DD for consistent comparison with date-only strings
  const cutoffStr = cutoff.toISOString().split("T")[0];
  return history.filter((p) => p.date.slice(0, 10) >= cutoffStr);
}

// ── Canvas Drawing ──────────────────────────────────────────────────────────

function drawChart(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  dpr: number,
  points: PricePoint[],
  data: PriceHistoryData,
  hoverIndex: number | null
) {
  const w = width * dpr;
  const h = height * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, width, height);

  if (points.length < 2) return;

  const chartLeft = PADDING.left;
  const chartRight = width - PADDING.right;
  const chartTop = PADDING.top;
  const chartBottom = height - PADDING.bottom;
  const chartW = chartRight - chartLeft;
  const chartH = chartBottom - chartTop;

  // Price range with 8% padding
  const prices = points.map((p) => p.priceCents);
  const minP = Math.min(...prices, data.allTimeLowCents);
  const maxP = Math.max(...prices, data.allTimeHighCents);
  const rangePad = (maxP - minP) * 0.08 || 100;
  const yMin = minP - rangePad;
  const yMax = maxP + rangePad;

  const toX = (i: number) => chartLeft + (i / (points.length - 1)) * chartW;
  const toY = (cents: number) => chartTop + (1 - (cents - yMin) / (yMax - yMin)) * chartH;

  // ── Grid lines ──────────────────────────────────────────────────────────
  ctx.strokeStyle = COLORS.gridLine;
  ctx.lineWidth = 0.5;

  // Horizontal grid (5 divisions)
  const ySteps = 5;
  for (let i = 0; i <= ySteps; i++) {
    const cents = yMin + (i / ySteps) * (yMax - yMin);
    const y = toY(cents);
    ctx.beginPath();
    ctx.moveTo(chartLeft, y);
    ctx.lineTo(chartRight, y);
    ctx.stroke();

    // Y-axis labels
    ctx.fillStyle = COLORS.textMuted;
    ctx.font = `10px "JetBrains Mono", monospace`;
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    ctx.fillText(formatPrice(cents), chartLeft - 8, y);
  }

  // X-axis date labels (max ~6 labels)
  const labelCount = Math.min(6, points.length);
  ctx.fillStyle = COLORS.textMuted;
  ctx.font = `9px "JetBrains Mono", monospace`;
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  for (let i = 0; i < labelCount; i++) {
    const idx = Math.round((i / (labelCount - 1)) * (points.length - 1));
    const x = toX(idx);
    ctx.fillText(formatDateShort(points[idx].date), x, chartBottom + 6);
  }

  // ── Reference lines ─────────────────────────────────────────────────────

  // All-time low (green dashed)
  const yLow = toY(data.allTimeLowCents);
  if (yLow >= chartTop && yLow <= chartBottom) {
    ctx.strokeStyle = COLORS.greenMuted;
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(chartLeft, yLow);
    ctx.lineTo(chartRight, yLow);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = COLORS.greenMuted;
    ctx.font = `9px "JetBrains Mono", monospace`;
    ctx.textAlign = "left";
    ctx.textBaseline = "bottom";
    ctx.fillText(`LOW ${formatPrice(data.allTimeLowCents)}`, chartLeft + 4, yLow - 3);
  }

  // Average (muted dashed)
  const yAvg = toY(data.averageCents);
  if (yAvg >= chartTop && yAvg <= chartBottom) {
    ctx.strokeStyle = "rgba(139, 148, 158, 0.25)";
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 6]);
    ctx.beginPath();
    ctx.moveTo(chartLeft, yAvg);
    ctx.lineTo(chartRight, yAvg);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = COLORS.textMuted;
    ctx.font = `9px "JetBrains Mono", monospace`;
    ctx.textAlign = "right";
    ctx.textBaseline = "bottom";
    ctx.fillText(`AVG ${formatPrice(data.averageCents)}`, chartRight - 4, yAvg - 3);
  }

  // ── Area fill (amber gradient) ──────────────────────────────────────────
  const gradient = ctx.createLinearGradient(0, chartTop, 0, chartBottom);
  gradient.addColorStop(0, "rgba(245, 158, 11, 0.18)");
  gradient.addColorStop(0.6, "rgba(245, 158, 11, 0.06)");
  gradient.addColorStop(1, "rgba(245, 158, 11, 0.0)");

  ctx.beginPath();
  ctx.moveTo(toX(0), chartBottom);
  for (let i = 0; i < points.length; i++) {
    ctx.lineTo(toX(i), toY(points[i].priceCents));
  }
  ctx.lineTo(toX(points.length - 1), chartBottom);
  ctx.closePath();
  ctx.fillStyle = gradient;
  ctx.fill();

  // ── Glow line (wide, blurred) ───────────────────────────────────────────
  ctx.save();
  ctx.strokeStyle = "rgba(245, 158, 11, 0.2)";
  ctx.lineWidth = 6;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.beginPath();
  for (let i = 0; i < points.length; i++) {
    const x = toX(i);
    const y = toY(points[i].priceCents);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();
  ctx.restore();

  // ── Crisp line ──────────────────────────────────────────────────────────
  ctx.strokeStyle = COLORS.amber;
  ctx.lineWidth = 1.5;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.beginPath();
  for (let i = 0; i < points.length; i++) {
    const x = toX(i);
    const y = toY(points[i].priceCents);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();

  // ── Crosshair + tooltip ─────────────────────────────────────────────────
  if (hoverIndex !== null && hoverIndex >= 0 && hoverIndex < points.length) {
    const hx = toX(hoverIndex);
    const hy = toY(points[hoverIndex].priceCents);

    // Vertical crosshair line
    ctx.strokeStyle = COLORS.crosshair;
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 3]);
    ctx.beginPath();
    ctx.moveTo(hx, chartTop);
    ctx.lineTo(hx, chartBottom);
    ctx.stroke();

    // Horizontal crosshair line
    ctx.beginPath();
    ctx.moveTo(chartLeft, hy);
    ctx.lineTo(chartRight, hy);
    ctx.stroke();
    ctx.setLineDash([]);

    // Reticle brackets at intersection
    const bracketSize = 8;
    const bracketGap = 4;
    ctx.strokeStyle = COLORS.amber;
    ctx.lineWidth = 1.5;

    // Top-left bracket
    ctx.beginPath();
    ctx.moveTo(hx - bracketGap - bracketSize, hy - bracketGap);
    ctx.lineTo(hx - bracketGap, hy - bracketGap);
    ctx.lineTo(hx - bracketGap, hy - bracketGap - bracketSize);
    ctx.stroke();

    // Top-right bracket
    ctx.beginPath();
    ctx.moveTo(hx + bracketGap + bracketSize, hy - bracketGap);
    ctx.lineTo(hx + bracketGap, hy - bracketGap);
    ctx.lineTo(hx + bracketGap, hy - bracketGap - bracketSize);
    ctx.stroke();

    // Bottom-left bracket
    ctx.beginPath();
    ctx.moveTo(hx - bracketGap - bracketSize, hy + bracketGap);
    ctx.lineTo(hx - bracketGap, hy + bracketGap);
    ctx.lineTo(hx - bracketGap, hy + bracketGap + bracketSize);
    ctx.stroke();

    // Bottom-right bracket
    ctx.beginPath();
    ctx.moveTo(hx + bracketGap + bracketSize, hy + bracketGap);
    ctx.lineTo(hx + bracketGap, hy + bracketGap);
    ctx.lineTo(hx + bracketGap, hy + bracketGap + bracketSize);
    ctx.stroke();

    // Data point dot
    ctx.beginPath();
    ctx.arc(hx, hy, 3, 0, Math.PI * 2);
    ctx.fillStyle = COLORS.amber;
    ctx.fill();

    // Tooltip
    const tooltipPrice = formatPriceExact(points[hoverIndex].priceCents);
    const tooltipDate = formatDateFull(points[hoverIndex].date);
    const tooltipW = 130;
    const tooltipH = 38;
    let tx = hx + 12;
    let ty = hy - tooltipH - 8;

    // Keep tooltip in bounds
    if (tx + tooltipW > chartRight) tx = hx - tooltipW - 12;
    if (ty < chartTop) ty = hy + 12;

    // Tooltip background
    ctx.fillStyle = "rgba(22, 27, 34, 0.95)";
    ctx.strokeStyle = COLORS.border;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(tx, ty, tooltipW, tooltipH, 3);
    ctx.fill();
    ctx.stroke();

    // Tooltip text
    ctx.fillStyle = COLORS.amber;
    ctx.font = `bold 12px "JetBrains Mono", monospace`;
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText(tooltipPrice, tx + 8, ty + 6);

    ctx.fillStyle = COLORS.textMuted;
    ctx.font = `9px "JetBrains Mono", monospace`;
    ctx.fillText(tooltipDate, tx + 8, ty + 22);
  }
}

// ── Component ───────────────────────────────────────────────────────────────

export function PriceHistoryChart({
  data,
  kitName,
}: {
  data: PriceHistoryData | null;
  kitName: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [range, setRange] = useState<TimeRange>("90d");
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [dims, setDims] = useState({ width: 0, height: 0 });

  const filteredPoints = useMemo(() => {
    if (!data) return [];
    return filterByRange(data.history, range);
  }, [data, range]);

  // Responsive resize
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentRect.width;
        const h = Math.max(180, Math.min(280, w * 0.45));
        setDims({ width: w, height: h });
      }
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // Draw
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !data || dims.width === 0) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = dims.width * dpr;
    canvas.height = dims.height * dpr;

    drawChart(ctx, dims.width, dims.height, dpr, filteredPoints, data, hoverIndex);
  }, [dims, filteredPoints, data, hoverIndex]);

  // Mouse/touch interaction
  const handlePointer = useCallback(
    (clientX: number) => {
      const canvas = canvasRef.current;
      if (!canvas || filteredPoints.length < 2) return;

      const rect = canvas.getBoundingClientRect();
      const x = clientX - rect.left;
      const chartW = dims.width - PADDING.left - PADDING.right;
      const relX = (x - PADDING.left) / chartW;
      const idx = Math.round(relX * (filteredPoints.length - 1));
      setHoverIndex(Math.max(0, Math.min(filteredPoints.length - 1, idx)));
    },
    [filteredPoints, dims]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => handlePointer(e.clientX),
    [handlePointer]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (e.touches.length > 0) {
        handlePointer(e.touches[0].clientX);
      }
    },
    [handlePointer]
  );

  const handleLeave = useCallback(() => setHoverIndex(null), []);

  // Deal indicator
  const dealIndicator = useMemo(() => {
    if (!data) return null;
    const diff = data.currentPriceCents - data.averageCents;
    const pct = Math.abs(diff / data.averageCents) * 100;
    if (pct < 2) return { label: "AT AVERAGE", color: COLORS.textSecondary, icon: "—" };
    if (diff < 0) return { label: `${pct.toFixed(0)}% BELOW AVG`, color: COLORS.green, icon: "▼" };
    return { label: `${pct.toFixed(0)}% ABOVE AVG`, color: COLORS.red, icon: "▲" };
  }, [data]);

  // ── Loading skeleton ────────────────────────────────────────────────────
  if (!data) {
    return (
      <div className="rounded border border-[var(--border)] bg-[var(--bg-surface)] p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="h-4 w-28 rounded bg-[var(--bg-elevated)] animate-pulse" />
          <div className="flex gap-1.5">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-6 w-9 rounded bg-[var(--bg-elevated)] animate-pulse" />
            ))}
          </div>
        </div>
        <div className="h-48 rounded bg-[var(--bg-primary)] animate-pulse" />
        <div className="flex gap-6 mt-4">
          <div className="h-3 w-24 rounded bg-[var(--bg-elevated)] animate-pulse" />
          <div className="h-3 w-24 rounded bg-[var(--bg-elevated)] animate-pulse" />
          <div className="h-3 w-24 rounded bg-[var(--bg-elevated)] animate-pulse" />
        </div>
      </div>
    );
  }

  // ── Empty state ─────────────────────────────────────────────────────────
  if (data.history.length < 2) {
    return (
      <div className="rounded border border-[var(--border)] bg-[var(--bg-surface)] p-6">
        <h2 className="text-lg font-bold text-[var(--text-primary)] mb-4">Price History</h2>
        <div className="flex flex-col items-center justify-center h-40 rounded bg-[var(--bg-primary)] border border-dashed border-[var(--border)]">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-[var(--text-muted)] mb-2"
          >
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
          </svg>
          <p className="text-sm text-[var(--text-muted)]">
            Price tracking starts when we first see this kit
          </p>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Check back for historical data
          </p>
        </div>
      </div>
    );
  }

  // ── Screen reader summary ───────────────────────────────────────────────
  const priceTrend =
    data.currentPriceCents < data.averageCents ? "below" : "above";
  const srSummary = `Price history for ${kitName}. Current price ${formatPriceExact(data.currentPriceCents)}, ${priceTrend} the average of ${formatPriceExact(data.averageCents)}. All-time low ${formatPriceExact(data.allTimeLowCents)}. ${data.history.length} data points tracked.`;

  return (
    <div className="rounded border border-[var(--border)] bg-[var(--bg-surface)] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 sm:px-6 pt-4 sm:pt-5 pb-3">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-bold text-[var(--text-primary)]">Price History</h2>
          {dealIndicator && (
            <span
              className="font-mono text-xs font-semibold uppercase tracking-wide px-2 py-0.5 rounded border"
              style={{
                color: dealIndicator.color,
                borderColor: `${dealIndicator.color}33`,
                backgroundColor: `${dealIndicator.color}0d`,
              }}
            >
              {dealIndicator.icon} {dealIndicator.label}
            </span>
          )}
        </div>

        {/* Range selector */}
        <div className="flex gap-1">
          {(Object.keys(RANGE_DAYS) as TimeRange[]).map((r) => (
            <button
              key={r}
              onClick={() => {
                setRange(r);
                setHoverIndex(null);
              }}
              aria-pressed={range === r}
              className={`rounded px-2.5 py-1 font-mono text-xs font-medium uppercase transition-all ${
                range === r
                  ? "bg-[var(--accent)]/15 text-[var(--accent)] border border-[var(--accent)]/30 shadow-[inset_0_1px_2px_rgba(0,0,0,0.3)]"
                  : "border border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--border-accent)] hover:text-[var(--accent)]"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Chart canvas */}
      <div
        ref={containerRef}
        className="relative px-2 sm:px-4"
        style={{ touchAction: "pan-y" }}
      >
        <span className="sr-only">{srSummary}</span>
        <canvas
          ref={canvasRef}
          style={{ width: dims.width, height: dims.height, display: "block" }}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleLeave}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleLeave}
          role="img"
          aria-label={srSummary}
        />
      </div>

      {/* Stats footer */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-1 px-4 sm:px-6 py-3 border-t border-[var(--border)] bg-[var(--bg-primary)]/30">
        <span className="text-xs text-[var(--text-muted)]">
          All-time low:{" "}
          <span className="font-mono text-[var(--success)] font-semibold">
            {formatPrice(data.allTimeLowCents)}
          </span>
        </span>
        <span className="text-xs text-[var(--text-muted)]">
          Average:{" "}
          <span className="font-mono text-[var(--text-secondary)] font-semibold">
            {formatPrice(data.averageCents)}
          </span>
        </span>
        <span className="text-xs text-[var(--text-muted)]">
          Current:{" "}
          <span className="font-mono text-[var(--accent)] font-semibold">
            {formatPrice(data.currentPriceCents)}
          </span>
        </span>
        <span className="text-xs text-[var(--text-muted)]">
          High:{" "}
          <span className="font-mono text-[var(--text-secondary)]">
            {formatPrice(data.allTimeHighCents)}
          </span>
        </span>
        <span className="ml-auto text-xs text-[var(--text-muted)]">
          {data.history.length} data points
        </span>
      </div>
    </div>
  );
}
