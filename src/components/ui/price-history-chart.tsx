"use client";

import { useRef, useEffect, useState, useCallback, useMemo } from "react";
import type { KitPriceHistory } from "@/lib/demo-data";

// ── Types ───────────────────────────────────────────────────────────────────

export interface PricePoint {
  date: string;
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
  yearBoundary: "rgba(101, 109, 118, 0.2)",
};

// Colors for secondary retailer series
const SERIES_COLORS = ["#22d3ee", "#86efac", "#fb923c", "#94a3b8"];

const PADDING = { top: 24, right: 16, bottom: 40, left: 56 };

// ── Date Helpers (UTC-safe) ────────────────────────────────────────────────

/** Parse a YYYY-MM-DD string as UTC to avoid timezone shifts */
function parseUTC(iso: string): Date {
  return new Date(iso + "T00:00:00Z");
}

const utcFmt = { timeZone: "UTC" as const };

function formatPrice(cents: number): string {
  return `$${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function formatPriceExact(cents: number): string {
  return `$${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDateFull(iso: string): string {
  const d = parseUTC(iso);
  return d.toLocaleDateString("en-US", { ...utcFmt, month: "short", day: "numeric", year: "numeric" });
}

// ── Calendar-Aware Tick Generation ─────────────────────────────────────────

interface TickInfo {
  index: number;
  label: string;
  isYearBoundary: boolean;
}

function generateTicks(
  dates: string[],
  chartWidth: number,
  range: TimeRange,
): TickInfo[] {
  const n = dates.length;
  if (n < 2) return [];

  const minTickSpacing = 72;
  const maxTicks = Math.max(3, Math.floor(chartWidth / minTickSpacing));

  const firstDate = parseUTC(dates[0]);
  const lastDate = parseUTC(dates[n - 1]);
  const spanDays = (lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24);

  // Build a date→index map for snapping ticks to actual data points
  const dateToIdx = new Map(dates.map((d, i) => [d, i]));

  // Determine tick strategy based on time span
  const ticks: TickInfo[] = [];

  if (spanDays <= 45) {
    // Short range: weekly ticks, format "Mar 28"
    const step = Math.max(1, Math.ceil(n / maxTicks));
    for (let i = 0; i < n; i += step) {
      const d = parseUTC(dates[i]);
      ticks.push({
        index: i,
        label: d.toLocaleDateString("en-US", { ...utcFmt, month: "short", day: "numeric" }),
        isYearBoundary: false,
      });
    }
  } else if (spanDays <= 200) {
    // Medium range (6mo): monthly ticks, format "Mar" with year on first tick or January
    generateMonthlyTicks(dates, dateToIdx, ticks, maxTicks, false);
  } else if (spanDays <= 400) {
    // 1yr range: every 1-2 months, format "Mar '25"
    generateMonthlyTicks(dates, dateToIdx, ticks, maxTicks, true);
  } else {
    // Multi-year: yearly ticks at January boundaries
    generateYearlyTicks(dates, dateToIdx, ticks, maxTicks);
  }

  // Always ensure first and last dates are represented
  ensureEndpoints(ticks, dates, n, minTickSpacing, chartWidth);

  return ticks;
}

function generateMonthlyTicks(
  dates: string[],
  dateToIdx: Map<string, number>,
  ticks: TickInfo[],
  maxTicks: number,
  alwaysShowYear: boolean,
): void {
  const firstDate = parseUTC(dates[0]);
  const lastDate = parseUTC(dates[dates.length - 1]);
  const n = dates.length;

  // Step through months
  const monthStep = Math.max(1, Math.ceil(
    ((lastDate.getFullYear() - firstDate.getFullYear()) * 12 +
      lastDate.getUTCMonth() - firstDate.getUTCMonth()) / maxTicks
  ));

  let year = firstDate.getUTCFullYear();
  let month = firstDate.getUTCMonth();
  let isFirst = true;

  while (true) {
    const targetStr = `${year}-${String(month + 1).padStart(2, "0")}-01`;
    // Find closest date in our data
    const idx = findClosestDateIndex(dates, targetStr);
    if (idx >= n) break;

    const d = parseUTC(dates[idx]);
    const isJan = d.getUTCMonth() === 0;

    let label: string;
    if (alwaysShowYear) {
      label = d.toLocaleDateString("en-US", { ...utcFmt, month: "short" }) +
        " \u2019" + String(d.getUTCFullYear()).slice(2);
    } else if (isFirst || isJan) {
      label = d.toLocaleDateString("en-US", { ...utcFmt, month: "short" }) +
        " \u2019" + String(d.getUTCFullYear()).slice(2);
    } else {
      label = d.toLocaleDateString("en-US", { ...utcFmt, month: "short" });
    }

    // Avoid duplicate indexes
    if (!ticks.some((t) => t.index === idx)) {
      ticks.push({ index: idx, label, isYearBoundary: isJan && !isFirst });
    }

    isFirst = false;
    month += monthStep;
    while (month >= 12) { month -= 12; year++; }
    if (year > lastDate.getUTCFullYear() + 1) break;
  }
}

function generateYearlyTicks(
  dates: string[],
  dateToIdx: Map<string, number>,
  ticks: TickInfo[],
  maxTicks: number,
): void {
  const firstDate = parseUTC(dates[0]);
  const lastDate = parseUTC(dates[dates.length - 1]);
  const n = dates.length;

  const yearSpan = lastDate.getUTCFullYear() - firstDate.getUTCFullYear() + 1;
  const yearStep = Math.max(1, Math.ceil(yearSpan / maxTicks));

  for (let y = firstDate.getUTCFullYear(); y <= lastDate.getUTCFullYear(); y += yearStep) {
    const targetStr = `${y}-01-01`;
    const idx = findClosestDateIndex(dates, targetStr);
    if (idx < n && !ticks.some((t) => t.index === idx)) {
      ticks.push({
        index: idx,
        label: String(y),
        isYearBoundary: y > firstDate.getUTCFullYear(),
      });
    }
  }
}

function findClosestDateIndex(dates: string[], target: string): number {
  // Binary search for closest date
  let lo = 0, hi = dates.length - 1;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (dates[mid] < target) lo = mid + 1;
    else hi = mid;
  }
  // Check neighbors for closest
  if (lo > 0 && lo < dates.length) {
    const dLo = Math.abs(parseUTC(dates[lo]).getTime() - parseUTC(target).getTime());
    const dPrev = Math.abs(parseUTC(dates[lo - 1]).getTime() - parseUTC(target).getTime());
    if (dPrev < dLo) return lo - 1;
  }
  return Math.min(lo, dates.length - 1);
}

function ensureEndpoints(
  ticks: TickInfo[],
  dates: string[],
  n: number,
  minSpacing: number,
  chartWidth: number,
): void {
  if (ticks.length === 0 || n < 2) return;

  ticks.sort((a, b) => a.index - b.index);

  // Pixel position of an index
  const toPixel = (idx: number) => (idx / (n - 1)) * chartWidth;

  // Ensure first point
  if (ticks[0].index > 0) {
    const firstPixel = toPixel(0);
    const nearestPixel = toPixel(ticks[0].index);
    if (nearestPixel - firstPixel > minSpacing * 0.6) {
      const d = parseUTC(dates[0]);
      ticks.unshift({
        index: 0,
        label: d.toLocaleDateString("en-US", { ...utcFmt, month: "short", day: "numeric" }),
        isYearBoundary: false,
      });
    }
  }

  // Ensure last point
  const lastTick = ticks[ticks.length - 1];
  if (lastTick.index < n - 1) {
    const lastPixel = toPixel(n - 1);
    const nearestPixel = toPixel(lastTick.index);
    if (lastPixel - nearestPixel > minSpacing * 0.6) {
      const d = parseUTC(dates[n - 1]);
      ticks.push({
        index: n - 1,
        label: d.toLocaleDateString("en-US", { ...utcFmt, month: "short", day: "numeric" }),
        isYearBoundary: false,
      });
    }
  }
}

/** Find all January 1st boundaries in a date range for drawing vertical markers */
function findYearBoundaries(dates: string[]): number[] {
  const boundaries: number[] = [];
  for (let i = 1; i < dates.length; i++) {
    const prevYear = dates[i - 1].slice(0, 4);
    const curYear = dates[i].slice(0, 4);
    if (curYear !== prevYear) {
      boundaries.push(i);
    }
  }
  return boundaries;
}

// ── Range Filtering (anchored to latest datapoint) ─────────────────────────

function filterByRange(history: PricePoint[], range: TimeRange): PricePoint[] {
  const days = RANGE_DAYS[range];
  if (!days || history.length === 0) return history;
  const latest = history[history.length - 1].date;
  const cutoff = parseUTC(latest);
  cutoff.setUTCDate(cutoff.getUTCDate() - days);
  const cutoffStr = cutoff.toISOString().split("T")[0];
  return history.filter((p) => p.date.slice(0, 10) >= cutoffStr);
}

function filterLowestByRange(
  points: Array<{ date: string; priceCents: number | null }>,
  range: TimeRange,
): Array<{ date: string; priceCents: number | null }> {
  const days = RANGE_DAYS[range];
  if (!days || points.length === 0) return points;
  const latest = points[points.length - 1].date;
  const cutoff = parseUTC(latest);
  cutoff.setUTCDate(cutoff.getUTCDate() - days);
  const cutoffStr = cutoff.toISOString().split("T")[0];
  return points.filter((p) => p.date.slice(0, 10) >= cutoffStr);
}

// ── Shared Axis Drawing ────────────────────────────────────────────────────

function drawXAxis(
  ctx: CanvasRenderingContext2D,
  dates: string[],
  chartLeft: number,
  chartRight: number,
  chartTop: number,
  chartBottom: number,
  range: TimeRange,
) {
  const n = dates.length;
  if (n < 2) return;

  const chartW = chartRight - chartLeft;
  const toX = (i: number) => chartLeft + (i / (n - 1)) * chartW;

  // Draw year boundary lines
  const yearBounds = findYearBoundaries(dates);
  if (yearBounds.length > 0) {
    ctx.strokeStyle = COLORS.yearBoundary;
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 4]);
    for (const idx of yearBounds) {
      const x = toX(idx);
      ctx.beginPath();
      ctx.moveTo(x, chartTop);
      ctx.lineTo(x, chartBottom);
      ctx.stroke();
    }
    ctx.setLineDash([]);
  }

  // Generate and draw tick labels
  const ticks = generateTicks(dates, chartW, range);

  ctx.fillStyle = COLORS.textMuted;
  ctx.font = `9px "JetBrains Mono", monospace`;
  ctx.textAlign = "center";
  ctx.textBaseline = "top";

  for (const tick of ticks) {
    const x = toX(tick.index);
    // Clamp label position so it doesn't overflow
    const textWidth = ctx.measureText(tick.label).width;
    const clampedX = Math.max(chartLeft + textWidth / 2, Math.min(chartRight - textWidth / 2, x));
    ctx.fillText(tick.label, clampedX, chartBottom + 6);
  }
}

// ── Single-Series Canvas Drawing ────────────────────────────────────────────

function drawChart(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  dpr: number,
  points: PricePoint[],
  data: PriceHistoryData,
  hoverIndex: number | null,
  range: TimeRange,
) {
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, width, height);

  if (points.length < 2) return;

  const chartLeft = PADDING.left;
  const chartRight = width - PADDING.right;
  const chartTop = PADDING.top;
  const chartBottom = height - PADDING.bottom;
  const chartW = chartRight - chartLeft;
  const chartH = chartBottom - chartTop;

  const prices = points.map((p) => p.priceCents);
  const minP = Math.min(...prices, data.allTimeLowCents);
  const maxP = Math.max(...prices, data.allTimeHighCents);
  const rangePad = (maxP - minP) * 0.08 || 100;
  const yMin = minP - rangePad;
  const yMax = maxP + rangePad;

  const toX = (i: number) => chartLeft + (i / (points.length - 1)) * chartW;
  const toY = (cents: number) => chartTop + (1 - (cents - yMin) / (yMax - yMin)) * chartH;

  // Y-axis grid lines
  ctx.strokeStyle = COLORS.gridLine;
  ctx.lineWidth = 0.5;
  const ySteps = 5;
  for (let i = 0; i <= ySteps; i++) {
    const cents = yMin + (i / ySteps) * (yMax - yMin);
    const y = toY(cents);
    ctx.beginPath();
    ctx.moveTo(chartLeft, y);
    ctx.lineTo(chartRight, y);
    ctx.stroke();
    ctx.fillStyle = COLORS.textMuted;
    ctx.font = `10px "JetBrains Mono", monospace`;
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    ctx.fillText(formatPrice(cents), chartLeft - 8, y);
  }

  // X-axis (shared calendar-aware ticks)
  const dateStrings = points.map((p) => p.date);
  drawXAxis(ctx, dateStrings, chartLeft, chartRight, chartTop, chartBottom, range);

  // Reference lines
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

  // Area fill
  const gradient = ctx.createLinearGradient(0, chartTop, 0, chartBottom);
  gradient.addColorStop(0, "rgba(245, 158, 11, 0.18)");
  gradient.addColorStop(0.6, "rgba(245, 158, 11, 0.06)");
  gradient.addColorStop(1, "rgba(245, 158, 11, 0.0)");
  ctx.beginPath();
  ctx.moveTo(toX(0), chartBottom);
  for (let i = 0; i < points.length; i++) ctx.lineTo(toX(i), toY(points[i].priceCents));
  ctx.lineTo(toX(points.length - 1), chartBottom);
  ctx.closePath();
  ctx.fillStyle = gradient;
  ctx.fill();

  // Glow line
  ctx.save();
  ctx.strokeStyle = "rgba(245, 158, 11, 0.2)";
  ctx.lineWidth = 6;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.beginPath();
  for (let i = 0; i < points.length; i++) {
    const x = toX(i);
    const y = toY(points[i].priceCents);
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.stroke();
  ctx.restore();

  // Crisp line
  ctx.strokeStyle = COLORS.amber;
  ctx.lineWidth = 1.5;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.beginPath();
  for (let i = 0; i < points.length; i++) {
    const x = toX(i);
    const y = toY(points[i].priceCents);
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.stroke();

  // Crosshair + tooltip
  if (hoverIndex !== null && hoverIndex >= 0 && hoverIndex < points.length) {
    const hx = toX(hoverIndex);
    const hy = toY(points[hoverIndex].priceCents);

    ctx.strokeStyle = COLORS.crosshair;
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 3]);
    ctx.beginPath();
    ctx.moveTo(hx, chartTop);
    ctx.lineTo(hx, chartBottom);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(chartLeft, hy);
    ctx.lineTo(chartRight, hy);
    ctx.stroke();
    ctx.setLineDash([]);

    const bs = 8, bg = 4;
    ctx.strokeStyle = COLORS.amber;
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(hx-bg-bs,hy-bg); ctx.lineTo(hx-bg,hy-bg); ctx.lineTo(hx-bg,hy-bg-bs); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(hx+bg+bs,hy-bg); ctx.lineTo(hx+bg,hy-bg); ctx.lineTo(hx+bg,hy-bg-bs); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(hx-bg-bs,hy+bg); ctx.lineTo(hx-bg,hy+bg); ctx.lineTo(hx-bg,hy+bg+bs); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(hx+bg+bs,hy+bg); ctx.lineTo(hx+bg,hy+bg); ctx.lineTo(hx+bg,hy+bg+bs); ctx.stroke();

    ctx.beginPath();
    ctx.arc(hx, hy, 3, 0, Math.PI * 2);
    ctx.fillStyle = COLORS.amber;
    ctx.fill();

    const tooltipPrice = formatPriceExact(points[hoverIndex].priceCents);
    const tooltipDate = formatDateFull(points[hoverIndex].date);
    const tooltipW = 130, tooltipH = 38;
    let tx = hx + 12, ty = hy - tooltipH - 8;
    if (tx + tooltipW > chartRight) tx = hx - tooltipW - 12;
    if (ty < chartTop) ty = hy + 12;

    ctx.fillStyle = "rgba(22, 27, 34, 0.95)";
    ctx.strokeStyle = COLORS.border;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(tx, ty, tooltipW, tooltipH, 3);
    ctx.fill();
    ctx.stroke();

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

// ── Multi-Series Canvas Drawing ──────────────────────────────────────────────

interface SeriesDrawData {
  name: string;
  color: string;
  points: Array<{ date: string; priceCents: number | null }>;
}

function drawMultiSeriesChart(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  dpr: number,
  lowestAvailable: Array<{ date: string; priceCents: number | null }>,
  activeSeries: SeriesDrawData[],
  stats: { low: number; high: number; avg: number },
  hoverDate: string | null,
  range: TimeRange,
) {
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, width, height);

  if (lowestAvailable.length < 2) return;

  const chartLeft = PADDING.left;
  const chartRight = width - PADDING.right;
  const chartTop = PADDING.top;
  const chartBottom = height - PADDING.bottom;
  const chartW = chartRight - chartLeft;
  const chartH = chartBottom - chartTop;

  // Build unified date array from lowestAvailable (primary x-axis)
  const dates = lowestAvailable.map((p) => p.date);
  const n = dates.length;

  // Y range from all visible data
  const allPrices: number[] = [];
  for (const p of lowestAvailable) if (p.priceCents != null) allPrices.push(p.priceCents);
  for (const s of activeSeries) for (const p of s.points) if (p.priceCents != null) allPrices.push(p.priceCents);
  if (allPrices.length === 0) return;

  const minP = Math.min(...allPrices, stats.low);
  const maxP = Math.max(...allPrices, stats.high);
  const rangePad = (maxP - minP) * 0.1 || 500;
  const yMin = minP - rangePad;
  const yMax = maxP + rangePad;

  const toX = (i: number) => chartLeft + (i / (n - 1)) * chartW;
  const toY = (cents: number) => chartTop + (1 - (cents - yMin) / (yMax - yMin)) * chartH;

  // Build date→index map for x lookup
  const dateToIdx = new Map(dates.map((d, i) => [d, i]));

  // Y-axis grid lines
  ctx.strokeStyle = COLORS.gridLine;
  ctx.lineWidth = 0.5;
  const ySteps = 5;
  for (let i = 0; i <= ySteps; i++) {
    const cents = yMin + (i / ySteps) * (yMax - yMin);
    const y = toY(cents);
    ctx.beginPath();
    ctx.moveTo(chartLeft, y);
    ctx.lineTo(chartRight, y);
    ctx.stroke();
    ctx.fillStyle = COLORS.textMuted;
    ctx.font = `10px "JetBrains Mono", monospace`;
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    ctx.fillText(formatPrice(cents), chartLeft - 8, y);
  }

  // X-axis (shared calendar-aware ticks)
  drawXAxis(ctx, dates, chartLeft, chartRight, chartTop, chartBottom, range);

  // Reference: all-time low
  const yLow = toY(stats.low);
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
    ctx.fillText(`LOW ${formatPrice(stats.low)}`, chartLeft + 4, yLow - 3);
  }

  // Reference: average
  const yAvg = toY(stats.avg);
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
    ctx.fillText(`AVG ${formatPrice(stats.avg)}`, chartRight - 4, yAvg - 3);
  }

  // Draw secondary series (dashed colored lines)
  for (const series of activeSeries) {
    const ptMap = new Map(series.points.map((p) => [p.date, p.priceCents]));
    ctx.strokeStyle = series.color;
    ctx.lineWidth = 1;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.setLineDash([4, 3]);
    ctx.globalAlpha = 0.65;
    ctx.beginPath();
    let drawing = false;
    for (let i = 0; i < n; i++) {
      const priceCents = ptMap.get(dates[i]);
      if (priceCents != null) {
        const x = toX(i);
        const y = toY(priceCents);
        if (!drawing) { ctx.moveTo(x, y); drawing = true; }
        else ctx.lineTo(x, y);
      } else {
        drawing = false;
      }
    }
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.globalAlpha = 1;
  }

  // Draw lowest-available area fill (amber)
  const lowestPts = lowestAvailable.filter((p) => p.priceCents != null) as Array<{ date: string; priceCents: number }>;
  if (lowestPts.length >= 2) {
    const gradient = ctx.createLinearGradient(0, chartTop, 0, chartBottom);
    gradient.addColorStop(0, "rgba(245, 158, 11, 0.14)");
    gradient.addColorStop(0.7, "rgba(245, 158, 11, 0.04)");
    gradient.addColorStop(1, "rgba(245, 158, 11, 0.0)");
    ctx.beginPath();
    const firstIdx = dateToIdx.get(lowestPts[0].date) ?? 0;
    const lastIdx = dateToIdx.get(lowestPts[lowestPts.length - 1].date) ?? n - 1;
    ctx.moveTo(toX(firstIdx), chartBottom);
    for (const pt of lowestPts) {
      const idx = dateToIdx.get(pt.date);
      if (idx != null) ctx.lineTo(toX(idx), toY(pt.priceCents));
    }
    ctx.lineTo(toX(lastIdx), chartBottom);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

    // Glow
    ctx.save();
    ctx.strokeStyle = "rgba(245, 158, 11, 0.18)";
    ctx.lineWidth = 5;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.beginPath();
    let first = true;
    for (const pt of lowestPts) {
      const idx = dateToIdx.get(pt.date);
      if (idx != null) {
        if (first) { ctx.moveTo(toX(idx), toY(pt.priceCents)); first = false; }
        else ctx.lineTo(toX(idx), toY(pt.priceCents));
      }
    }
    ctx.stroke();
    ctx.restore();

    // Crisp amber line
    ctx.strokeStyle = COLORS.amber;
    ctx.lineWidth = 1.5;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.beginPath();
    first = true;
    for (const pt of lowestPts) {
      const idx = dateToIdx.get(pt.date);
      if (idx != null) {
        if (first) { ctx.moveTo(toX(idx), toY(pt.priceCents)); first = false; }
        else ctx.lineTo(toX(idx), toY(pt.priceCents));
      }
    }
    ctx.stroke();
  }

  // Hover crosshair
  if (hoverDate !== null) {
    const hIdx = dateToIdx.get(hoverDate);
    if (hIdx != null) {
      const lowestPt = lowestAvailable[hIdx];
      const amberPriceCents = lowestPt?.priceCents;
      const hx = toX(hIdx);
      const hy = amberPriceCents != null ? toY(amberPriceCents) : (chartTop + chartBottom) / 2;

      ctx.strokeStyle = COLORS.crosshair;
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 3]);
      ctx.beginPath();
      ctx.moveTo(hx, chartTop);
      ctx.lineTo(hx, chartBottom);
      ctx.stroke();
      ctx.setLineDash([]);

      if (amberPriceCents != null) {
        ctx.beginPath();
        ctx.arc(hx, hy, 3, 0, Math.PI * 2);
        ctx.fillStyle = COLORS.amber;
        ctx.fill();
      }

      // Multi-series tooltip (sorted by price, lowest first)
      const tooltipLines: Array<{ label: string; price: number; color: string }> = [];
      if (amberPriceCents != null) {
        tooltipLines.push({ label: "Lowest", price: amberPriceCents, color: COLORS.amber });
      }
      for (const series of activeSeries) {
        const ptMap = new Map(series.points.map((p) => [p.date, p.priceCents]));
        const pc = ptMap.get(hoverDate);
        if (pc != null) tooltipLines.push({ label: series.name.split(" ")[0], price: pc, color: series.color });
      }

      // Sort by price (lowest first), but keep "Lowest" at top
      const lowestEntry = tooltipLines.find((t) => t.label === "Lowest");
      const rest = tooltipLines.filter((t) => t.label !== "Lowest").sort((a, b) => a.price - b.price);
      const sortedLines = lowestEntry ? [lowestEntry, ...rest] : rest;

      if (sortedLines.length > 0) {
        const lineH = 16;
        const tooltipW = 150;
        const tooltipH = 12 + sortedLines.length * lineH + 4;
        let tx = hx + 14, ty = hy - tooltipH / 2;
        if (tx + tooltipW > chartRight) tx = hx - tooltipW - 14;
        if (ty < chartTop) ty = chartTop + 4;
        if (ty + tooltipH > chartBottom) ty = chartBottom - tooltipH - 4;

        ctx.fillStyle = "rgba(22, 27, 34, 0.95)";
        ctx.strokeStyle = COLORS.border;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(tx, ty, tooltipW, tooltipH, 3);
        ctx.fill();
        ctx.stroke();

        ctx.font = `9px "JetBrains Mono", monospace`;
        ctx.textBaseline = "top";
        ctx.fillStyle = COLORS.textMuted;
        ctx.textAlign = "left";
        ctx.fillText(formatDateFull(hoverDate), tx + 8, ty + 6);

        for (let li = 0; li < sortedLines.length; li++) {
          const line = sortedLines[li];
          const ly = ty + 18 + li * lineH;
          ctx.fillStyle = line.color;
          ctx.beginPath();
          ctx.arc(tx + 12, ly + 5, 3, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = COLORS.textSecondary;
          ctx.textAlign = "left";
          ctx.fillText(line.label, tx + 20, ly);
          ctx.fillStyle = line.color;
          ctx.textAlign = "right";
          ctx.fillText(formatPrice(line.price), tx + tooltipW - 8, ly);
        }
      }
    }
  }
}

// ── Component ───────────────────────────────────────────────────────────────

export function PriceHistoryChart({
  data,
  multiHistory,
  kitName,
}: {
  data: PriceHistoryData | null;
  multiHistory?: KitPriceHistory;
  kitName: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [range, setRange] = useState<TimeRange>("90d");
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [hoverDate, setHoverDate] = useState<string | null>(null);
  const [dims, setDims] = useState({ width: 0, height: 0 });

  // Active series toggle (offerId → boolean)
  const [activeSeries, setActiveSeries] = useState<Record<string, boolean>>({});

  // Init active series when multiHistory changes
  useEffect(() => {
    if (!multiHistory) return;
    const init: Record<string, boolean> = {};
    for (const s of multiHistory.series) {
      init[s.offerId] = true;
    }
    setActiveSeries(init);
  }, [multiHistory]);

  const isMulti = !!multiHistory && multiHistory.lowestAvailable.length >= 2;

  // Single-series filtered points
  const filteredPoints = useMemo(() => {
    if (!data || isMulti) return [];
    return filterByRange(data.history, range);
  }, [data, isMulti, range]);

  // Multi-series filtered data
  const filteredLowest = useMemo(() => {
    if (!isMulti) return [];
    return filterLowestByRange(multiHistory!.lowestAvailable, range);
  }, [isMulti, multiHistory, range]);

  const filteredSeriesData = useMemo((): SeriesDrawData[] => {
    if (!isMulti) return [];
    return multiHistory!.series
      .filter((s) => activeSeries[s.offerId] !== false)
      .map((s, i) => ({
        name: s.retailerName,
        color: SERIES_COLORS[i % SERIES_COLORS.length],
        points: filterLowestByRange(
          s.points.map((p) => ({ date: p.date, priceCents: p.priceCents })),
          range,
        ),
      }));
  }, [isMulti, multiHistory, activeSeries, range]);

  // Multi-series stats (from lowestAvailable)
  const multiStats = useMemo(() => {
    if (!isMulti) return null;
    const prices = filteredLowest.filter((p) => p.priceCents != null).map((p) => p.priceCents as number);
    if (prices.length === 0) return null;
    return {
      low: Math.min(...prices),
      high: Math.max(...prices),
      avg: Math.round(prices.reduce((a, b) => a + b, 0) / prices.length),
      current: prices[prices.length - 1],
    };
  }, [isMulti, filteredLowest]);

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
    if (!canvas || dims.width === 0) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = dims.width * dpr;
    canvas.height = dims.height * dpr;

    if (isMulti && multiStats) {
      drawMultiSeriesChart(
        ctx, dims.width, dims.height, dpr,
        filteredLowest, filteredSeriesData, multiStats, hoverDate, range,
      );
    } else if (data && filteredPoints.length >= 2) {
      drawChart(ctx, dims.width, dims.height, dpr, filteredPoints, data, hoverIndex, range);
    }
  }, [dims, filteredPoints, filteredLowest, filteredSeriesData, data, hoverIndex, hoverDate, isMulti, multiStats, range]);

  // Mouse/touch interaction
  const handlePointerSingle = useCallback(
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
    [filteredPoints, dims],
  );

  const handlePointerMulti = useCallback(
    (clientX: number) => {
      const canvas = canvasRef.current;
      if (!canvas || filteredLowest.length < 2) return;
      const rect = canvas.getBoundingClientRect();
      const x = clientX - rect.left;
      const chartW = dims.width - PADDING.left - PADDING.right;
      const relX = (x - PADDING.left) / chartW;
      const idx = Math.round(relX * (filteredLowest.length - 1));
      const clamped = Math.max(0, Math.min(filteredLowest.length - 1, idx));
      setHoverDate(filteredLowest[clamped]?.date ?? null);
    },
    [filteredLowest, dims],
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (isMulti) handlePointerMulti(e.clientX);
      else handlePointerSingle(e.clientX);
    },
    [isMulti, handlePointerMulti, handlePointerSingle],
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (e.touches.length > 0) {
        if (isMulti) handlePointerMulti(e.touches[0].clientX);
        else handlePointerSingle(e.touches[0].clientX);
      }
    },
    [isMulti, handlePointerMulti, handlePointerSingle],
  );

  const handleLeave = useCallback(() => {
    setHoverIndex(null);
    setHoverDate(null);
  }, []);

  // Deal indicator
  const dealIndicator = useMemo(() => {
    const current = isMulti ? multiStats?.current : data?.currentPriceCents;
    const avg = isMulti ? multiStats?.avg : data?.averageCents;
    if (current == null || avg == null) return null;
    const diff = current - avg;
    const pct = Math.abs(diff / avg) * 100;
    if (pct < 2) return { label: "AT AVERAGE", color: COLORS.textSecondary, icon: "—" };
    if (diff < 0) return { label: `${pct.toFixed(0)}% BELOW AVG`, color: COLORS.green, icon: "▼" };
    return { label: `${pct.toFixed(0)}% ABOVE AVG`, color: COLORS.red, icon: "▲" };
  }, [isMulti, multiStats, data]);

  // ── Loading skeleton ─────────────────────────────────────────────────────
  if (!data && !isMulti) {
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
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-3 w-24 rounded bg-[var(--bg-elevated)] animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  // ── Empty state ──────────────────────────────────────────────────────────
  const isEmpty = isMulti
    ? filteredLowest.length < 2
    : !data || data.history.length < 2;

  if (isEmpty) {
    return (
      <div className="rounded border border-[var(--border)] bg-[var(--bg-surface)] p-6">
        <h2 className="text-lg font-bold text-[var(--text-primary)] mb-4">Price History</h2>
        <div className="flex flex-col items-center justify-center h-40 rounded bg-[var(--bg-primary)] border border-dashed border-[var(--border)]">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--text-muted)] mb-2">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
          </svg>
          <p className="text-sm text-[var(--text-muted)]">Price tracking starts when we first see this kit</p>
          <p className="text-xs text-[var(--text-muted)] mt-1">Check back for historical data</p>
        </div>
      </div>
    );
  }

  const currentCents = isMulti ? (multiStats?.current ?? 0) : (data?.currentPriceCents ?? 0);
  const avgCents = isMulti ? (multiStats?.avg ?? 0) : (data?.averageCents ?? 0);
  const lowCents = isMulti ? (multiStats?.low ?? 0) : (data?.allTimeLowCents ?? 0);
  const highCents = isMulti ? (multiStats?.high ?? 0) : (data?.allTimeHighCents ?? 0);
  const dataPointCount = isMulti ? filteredLowest.length : filteredPoints.length;

  return (
    <div className="rounded border border-[var(--border)] bg-[var(--bg-surface)] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 sm:px-6 pt-4 sm:pt-5 pb-3">
        <div className="flex items-center gap-3 flex-wrap">
          <h2 className="text-lg font-bold text-[var(--text-primary)]">Price History</h2>
          {dealIndicator && (
            <span
              className="font-mono text-xs font-semibold uppercase tracking-wide px-2 py-0.5 rounded border"
              style={{ color: dealIndicator.color, borderColor: `${dealIndicator.color}33`, backgroundColor: `${dealIndicator.color}0d` }}
            >
              {dealIndicator.icon} {dealIndicator.label}
            </span>
          )}
        </div>
        <div className="flex gap-1">
          {(Object.keys(RANGE_DAYS) as TimeRange[]).map((r) => (
            <button
              key={r}
              onClick={() => { setRange(r); setHoverIndex(null); setHoverDate(null); }}
              aria-pressed={range === r}
              className={`rounded px-2.5 py-1 font-mono text-xs font-medium uppercase transition-all ${
                range === r
                  ? "bg-[var(--accent)]/15 text-[var(--accent)] border border-[var(--accent)]/30"
                  : "border border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--border-accent)] hover:text-[var(--accent)]"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Retailer series toggles (multi-series only) */}
      {isMulti && multiHistory!.series.length > 1 && (
        <div className="flex flex-wrap gap-1.5 px-4 sm:px-6 pb-3">
          <span className="text-[10px] font-medium uppercase tracking-widest text-[var(--text-muted)] self-center mr-1">
            Show:
          </span>
          {/* Lowest available — always on, not toggleable */}
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-sm border border-[var(--accent)]/40 bg-[var(--accent)]/10 text-[10px] font-medium text-[var(--accent)]">
            <span className="w-2 h-0.5 bg-[var(--accent)] inline-block rounded" />
            Lowest price
          </span>
          {multiHistory!.series.map((s, i) => {
            const color = SERIES_COLORS[i % SERIES_COLORS.length];
            const isActive = activeSeries[s.offerId] !== false;
            return (
              <button
                key={s.offerId}
                onClick={() => setActiveSeries((prev) => ({ ...prev, [s.offerId]: !isActive }))}
                className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-sm border text-[10px] font-medium transition-all ${
                  isActive ? "opacity-100" : "opacity-40"
                }`}
                style={{
                  borderColor: isActive ? `${color}50` : "var(--border)",
                  backgroundColor: isActive ? `${color}12` : "transparent",
                  color: isActive ? color : "var(--text-muted)",
                }}
              >
                <span className="w-2 h-0.5 inline-block rounded" style={{ backgroundColor: color, borderTop: `1px dashed ${color}` }} />
                {s.retailerName.split(" ")[0]}
              </button>
            );
          })}
        </div>
      )}

      {/* Chart canvas */}
      <div ref={containerRef} className="relative px-2 sm:px-4" style={{ touchAction: "pan-y" }}>
        <canvas
          ref={canvasRef}
          style={{ width: dims.width, height: dims.height, display: "block" }}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleLeave}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleLeave}
          role="img"
          aria-label={`Price history chart for ${kitName}`}
        />
      </div>

      {/* Stats footer */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-1 px-4 sm:px-6 py-3 border-t border-[var(--border)] bg-[var(--bg-primary)]/30">
        <span className="text-xs text-[var(--text-muted)]">
          All-time low: <span className="font-mono text-[var(--success)] font-semibold">{formatPrice(lowCents)}</span>
        </span>
        <span className="text-xs text-[var(--text-muted)]">
          Average: <span className="font-mono text-[var(--text-secondary)] font-semibold">{formatPrice(avgCents)}</span>
        </span>
        <span className="text-xs text-[var(--text-muted)]">
          Current: <span className="font-mono text-[var(--accent)] font-semibold">{formatPrice(currentCents)}</span>
        </span>
        <span className="text-xs text-[var(--text-muted)]">
          High: <span className="font-mono text-[var(--text-secondary)]">{formatPrice(highCents)}</span>
        </span>
        <span className="ml-auto text-xs text-[var(--text-muted)]">{dataPointCount} data points</span>
      </div>
    </div>
  );
}
