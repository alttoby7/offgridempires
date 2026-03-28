/**
 * Calculator submission recording — fire-and-forget to Supabase.
 * Never blocks the user or surfaces errors.
 */

import { supabase } from "@/lib/supabase";
import type { LoadEntry, SystemAssumptions, SizingResult, KitMatch } from "./types";

// ── Session ID (persisted in localStorage) ──────────────────────────────────

const SESSION_KEY = "oge_session_id";

function getSessionId(): string {
  if (typeof window === "undefined") return "ssr";
  try {
    let id = localStorage.getItem(SESSION_KEY);
    if (!id) {
      id = crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      localStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return `anon-${Date.now()}`;
  }
}

// ── Attribution (captured once per page load) ───────────────────────────────

interface Attribution {
  referrer: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  user_agent: string;
  screen_width: number;
  screen_height: number;
  locale: string;
  timezone: string;
}

let _attribution: Attribution | null = null;

function getAttribution(): Attribution {
  if (_attribution) return _attribution;
  if (typeof window === "undefined") {
    return {
      referrer: null, utm_source: null, utm_medium: null, utm_campaign: null,
      user_agent: "", screen_width: 0, screen_height: 0, locale: "", timezone: "",
    };
  }

  const params = new URLSearchParams(window.location.search);

  _attribution = {
    referrer: document.referrer || null,
    utm_source: params.get("utm_source"),
    utm_medium: params.get("utm_medium"),
    utm_campaign: params.get("utm_campaign"),
    user_agent: navigator.userAgent,
    screen_width: screen.width,
    screen_height: screen.height,
    locale: navigator.language,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  };

  return _attribution;
}

// ── Step timing tracker ─────────────────────────────────────────────────────

const stepTimestamps = new Map<number, string>();

export function recordStepTransition(step: number): void {
  try {
    if (!supabase) return;

    const now = new Date().toISOString();
    stepTimestamps.set(step, now);

    const sessionId = getSessionId();
    const attr = getAttribution();

    supabase
      .from("calc_funnel_events")
      .insert({
        session_id: sessionId,
        step,
        referrer: attr.referrer,
      })
      .then(() => {});
  } catch {
    // silently fail
  }
}

// ── Full submission recording ───────────────────────────────────────────────

export function recordSubmission(
  loads: LoadEntry[],
  assumptions: SystemAssumptions,
  sizing: SizingResult,
  kitMatches: KitMatch[],
  shareUrl: string
): void {
  try {
  if (!supabase) return;

  const sessionId = getSessionId();
  const attr = getAttribution();

  // Strip client-side `id` from loads, keep everything else
  const cleanLoads = loads.map(({ id: _id, ...rest }) => rest);

  // Top 10 matches — only the fields we need (omit full kit object)
  const topMatches = kitMatches.slice(0, 10).map((m) => ({
    slug: m.kit.slug,
    solarCoverage: Math.round(m.solarCoverage * 10) / 10,
    storageCoverage: Math.round(m.storageCoverage * 10) / 10,
    inverterCoverage: Math.round(m.inverterCoverage * 10) / 10,
    bucket: m.bucket,
    score: Math.round(m.score * 10) / 10,
  }));

  const payload = {
    session_id: sessionId,

    // Attribution
    ...attr,

    // Loads
    loads: cleanLoads,
    load_count: loads.length,
    custom_load_count: loads.filter((l) => l.isCustom).length,

    // Assumptions
    sun_hours_per_day: assumptions.sunHoursPerDay,
    sun_source: assumptions.sunSource,
    zip_code: assumptions.zipCode || null,
    sun_tier: assumptions.sunTier,
    autonomy_days: assumptions.autonomyDays,
    controller_type: assumptions.controllerType,
    battery_chemistry: assumptions.batteryChemistry,

    // Sizing outputs
    total_daily_wh: Math.round(sizing.totalDailyWh),
    peak_continuous_watts: Math.round(sizing.peakContinuousWatts),
    peak_surge_watts: Math.round(sizing.peakSurgeWatts),
    required_panel_watts: Math.round(sizing.requiredPanelWatts),
    required_storage_wh: Math.round(sizing.requiredStorageWh),
    required_inverter_watts: Math.round(sizing.requiredInverterWatts),
    system_efficiency: sizing.systemEfficiency,

    // Kit matches
    kit_matches: topMatches,
    match_count: kitMatches.length,
    top_bucket: kitMatches[0]?.bucket ?? null,

    // Funnel timing
    step1_at: stepTimestamps.get(1) ?? null,
    step2_at: stepTimestamps.get(2) ?? null,
    step3_at: stepTimestamps.get(3) ?? null,

    // Debug
    share_url: shareUrl,
  };

  // Fire-and-forget
  supabase
    .from("calc_submissions")
    .insert(payload)
    .then(() => {});
  } catch {
    // silently fail
  }
}
