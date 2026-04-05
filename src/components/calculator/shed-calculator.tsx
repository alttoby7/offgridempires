"use client";

import { useState, useMemo } from "react";
import Link from "next/link";

// ── Types ────────────────────────────────────────────────────────────────────

interface Appliance {
  id: string;
  name: string;
  watts: number;
  surgeWatts: number;
  group: "Lighting" | "Tools" | "Electronics";
  defaultHours: number;
}

interface LoadEntry extends Appliance {
  hours: number;
  enabled: boolean;
}

type SunTier = { label: string; hours: number };
type ShedPreset = { id: string; label: string; sub: string; icon: string; applianceIds: string[] };

// ── Data ─────────────────────────────────────────────────────────────────────

const APPLIANCES: Appliance[] = [
  // Lighting
  { id: "led-light",         name: "LED Light",           watts: 9,    surgeWatts: 0,    group: "Lighting",     defaultHours: 4   },
  { id: "led-strip",         name: "LED Strip",            watts: 15,   surgeWatts: 0,    group: "Lighting",     defaultHours: 3   },
  { id: "work-light",        name: "Work Light",           watts: 25,   surgeWatts: 0,    group: "Tools",        defaultHours: 3   },
  { id: "security-flood",    name: "Security Floodlight",  watts: 30,   surgeWatts: 0,    group: "Lighting",     defaultHours: 8   },
  // Tools
  { id: "drill-charger",     name: "Drill / Battery Charger", watts: 50, surgeWatts: 0,  group: "Tools",        defaultHours: 1.5 },
  { id: "circular-saw",      name: "Circular Saw",         watts: 1400, surgeWatts: 2200, group: "Tools",        defaultHours: 0.5 },
  { id: "miter-saw",         name: "Miter Saw",            watts: 1600, surgeWatts: 2700, group: "Tools",        defaultHours: 0.5 },
  { id: "angle-grinder",     name: "Angle Grinder",        watts: 900,  surgeWatts: 1800, group: "Tools",        defaultHours: 0.5 },
  { id: "air-compressor",    name: "Air Compressor",       watts: 1500, surgeWatts: 3000, group: "Tools",        defaultHours: 0.5 },
  { id: "shop-vac",          name: "Shop Vacuum",          watts: 1200, surgeWatts: 2000, group: "Tools",        defaultHours: 0.25},
  { id: "sewing-machine",    name: "Sewing Machine",       watts: 100,  surgeWatts: 0,    group: "Tools",        defaultHours: 2   },
  // Electronics
  { id: "phone-charger",     name: "Phone Charger",        watts: 10,   surgeWatts: 0,    group: "Electronics",  defaultHours: 2   },
  { id: "laptop",            name: "Laptop",               watts: 50,   surgeWatts: 0,    group: "Electronics",  defaultHours: 4   },
  { id: "box-fan",           name: "Box Fan",              watts: 55,   surgeWatts: 0,    group: "Electronics",  defaultHours: 4   },
  { id: "mini-fridge",       name: "Mini Fridge",          watts: 65,   surgeWatts: 600,  group: "Electronics",  defaultHours: 8.4 }, // 65W × 24h × 0.35 duty
  { id: "wifi-router",       name: "WiFi Router",          watts: 12,   surgeWatts: 0,    group: "Electronics",  defaultHours: 12  },
];

const APP_MAP = Object.fromEntries(APPLIANCES.map((a) => [a.id, a]));

const PRESETS: ShedPreset[] = [
  {
    id: "storage",
    label: "Storage / Garden",
    sub: "Lights + phone charging",
    icon: "📦",
    applianceIds: ["led-light", "led-light", "phone-charger"],
  },
  {
    id: "workshop",
    label: "Workshop",
    sub: "Lights + power tools",
    icon: "🔧",
    applianceIds: ["led-light", "led-light", "led-light", "led-light", "work-light", "drill-charger", "circular-saw", "angle-grinder"],
  },
  {
    id: "office",
    label: "She-Shed / Office",
    sub: "Lights + laptop + fan",
    icon: "🖥️",
    applianceIds: ["led-light", "led-light", "led-light", "phone-charger", "laptop", "box-fan"],
  },
  {
    id: "cabin",
    label: "Tiny House / Cabin",
    sub: "Lights + fridge + appliances",
    icon: "🏠",
    applianceIds: ["led-light", "led-light", "led-light", "led-light", "phone-charger", "mini-fridge", "laptop", "wifi-router"],
  },
];

const SUN_TIERS: SunTier[] = [
  { label: "Poor",    hours: 3   },
  { label: "Average", hours: 4   },
  { label: "Good",    hours: 5   },
  { label: "Desert",  hours: 6.5 },
];

// ── Helpers ──────────────────────────────────────────────────────────────────

function buildLoadsFromPreset(preset: ShedPreset): LoadEntry[] {
  // Count duplicates (some presets have "led-light" multiple times)
  const counts: Record<string, number> = {};
  for (const id of preset.applianceIds) counts[id] = (counts[id] ?? 0) + 1;

  return Object.entries(counts).map(([id, qty]) => {
    const a = APP_MAP[id];
    return { ...a, hours: a.defaultHours * qty, enabled: true };
  });
}

function computeResults(loads: LoadEntry[], sunHours: number) {
  const activeLoads = loads.filter((l) => l.enabled);
  const dailyWh = activeLoads.reduce((sum, l) => sum + l.watts * l.hours, 0);
  const peakWatts = activeLoads.reduce((sum, l) => sum + l.watts, 0);
  const maxSurge = activeLoads.length > 0 ? Math.max(...activeLoads.map((l) => l.surgeWatts || l.watts)) : 0;

  const MPPT_EFF = 0.94;
  const MISC_EFF = 0.95;
  const INV_EFF = 0.90;
  const DOD = 0.80; // LiFePO4

  const panelWatts = sunHours > 0 ? Math.ceil(dailyWh / (sunHours * MPPT_EFF * MISC_EFF)) : 0;
  const storageWh = Math.ceil((dailyWh * 1.25) / DOD); // 1.25 days autonomy
  const inverterWatts = Math.ceil(Math.max(peakWatts, maxSurge) / INV_EFF);

  let tier: 1 | 2 | 3 = 1;
  if (panelWatts >= 600) tier = 3;
  else if (panelWatts >= 250) tier = 2;

  return { dailyWh, panelWatts, storageWh, inverterWatts, tier };
}

function fmtWh(n: number): string {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}kWh` : `${n}Wh`;
}

function fmtW(n: number): string {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}kW` : `${n}W`;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function ShedCalculator() {
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [loads, setLoads] = useState<LoadEntry[]>([]);
  const [sunTierIdx, setSunTierIdx] = useState(1); // "Average" default

  const sunHours = SUN_TIERS[sunTierIdx].hours;

  const results = useMemo(
    () => (loads.length > 0 ? computeResults(loads, sunHours) : null),
    [loads, sunHours]
  );

  const hasActiveLoads = loads.some((l) => l.enabled);

  function selectPreset(preset: ShedPreset) {
    setSelectedPreset(preset.id);
    setLoads(buildLoadsFromPreset(preset));
  }

  function toggleLoad(id: string) {
    setLoads((prev) => prev.map((l) => (l.id === id ? { ...l, enabled: !l.enabled } : l)));
  }

  function setHours(id: string, hours: number) {
    setLoads((prev) => prev.map((l) => (l.id === id ? { ...l, hours } : l)));
  }

  const groupOrder: Array<"Lighting" | "Tools" | "Electronics"> = ["Lighting", "Tools", "Electronics"];
  const grouped = groupOrder
    .map((g) => ({ group: g, items: loads.filter((l) => l.group === g) }))
    .filter((g) => g.items.length > 0);

  const TIER_LABELS: Record<1 | 2 | 3, { label: string; color: string; bg: string }> = {
    1: { label: "TIER 1 — LIGHTING",  color: "#22d3ee", bg: "rgba(34,211,238,0.10)" },
    2: { label: "TIER 2 — TOOLS",     color: "#f59e0b", bg: "rgba(245,158,11,0.10)" },
    3: { label: "TIER 3 — WORKSHOP",  color: "#f97316", bg: "rgba(249,115,22,0.10)" },
  };

  return (
    <div
      style={{
        "--bg":      "#0a0f14",
        "--surface": "#111820",
        "--border":  "#1e2a38",
        "--accent":  "#f59e0b",
        "--text":    "#e2e8f0",
        "--muted":   "#64748b",
        "--mono":    "'JetBrains Mono', 'Fira Mono', monospace",
        fontFamily:  "var(--font-sans, -apple-system, sans-serif)",
        background:  "var(--bg)",
        color:       "var(--text)",
        minHeight:   "100%",
      } as React.CSSProperties}
    >
      {/* ── Section 1: Preset selector ───────────────────────────────────── */}
      <div style={{ marginBottom: "2rem" }}>
        <SectionLabel step="01" title="What's in your shed?" />
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "0.75rem",
          }}
        >
          {PRESETS.map((p) => {
            const active = selectedPreset === p.id;
            return (
              <button
                key={p.id}
                onClick={() => selectPreset(p)}
                style={{
                  display:        "flex",
                  flexDirection:  "column",
                  alignItems:     "flex-start",
                  gap:            "0.5rem",
                  padding:        "1rem 1.25rem",
                  background:     active ? "rgba(245,158,11,0.06)" : "var(--surface)",
                  border:         `1px solid ${active ? "var(--accent)" : "var(--border)"}`,
                  borderRadius:   "8px",
                  cursor:         "pointer",
                  transition:     "border-color 0.15s, background 0.15s",
                  textAlign:      "left",
                  color:          "inherit",
                }}
              >
                <span style={{ fontSize: "1.5rem", lineHeight: 1 }}>{p.icon}</span>
                <span style={{ fontWeight: 600, fontSize: "0.875rem", color: active ? "var(--accent)" : "var(--text)" }}>
                  {p.label}
                </span>
                <span style={{ fontSize: "0.75rem", color: "var(--muted)", lineHeight: 1.4 }}>{p.sub}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Section 2: Load checklist ────────────────────────────────────── */}
      {loads.length > 0 && (
        <div style={{ marginBottom: "2rem" }}>
          <SectionLabel step="02" title="What do you need to power?" />

          {grouped.map(({ group, items }) => (
            <div key={group} style={{ marginBottom: "1.25rem" }}>
              <div
                style={{
                  fontSize:      "0.65rem",
                  fontFamily:    "var(--mono)",
                  color:         "var(--muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  marginBottom:  "0.5rem",
                  paddingLeft:   "0.25rem",
                }}
              >
                {group}
              </div>
              <div
                style={{
                  background:   "var(--surface)",
                  border:       "1px solid var(--border)",
                  borderRadius: "8px",
                  overflow:     "hidden",
                }}
              >
                {items.map((load, i) => {
                  const dailyWh = load.watts * load.hours;
                  return (
                    <div
                      key={load.id + i}
                      style={{
                        display:       "grid",
                        gridTemplateColumns: "auto 1fr auto auto",
                        alignItems:    "center",
                        gap:           "0.75rem",
                        padding:       "0.75rem 1rem",
                        borderTop:     i > 0 ? "1px solid var(--border)" : "none",
                        opacity:       load.enabled ? 1 : 0.4,
                        transition:    "opacity 0.15s",
                      }}
                    >
                      {/* Checkbox */}
                      <input
                        type="checkbox"
                        checked={load.enabled}
                        onChange={() => toggleLoad(load.id)}
                        style={{ accentColor: "var(--accent)", width: "16px", height: "16px", cursor: "pointer", flexShrink: 0 }}
                      />

                      {/* Name + watts */}
                      <div>
                        <div style={{ fontSize: "0.875rem", fontWeight: 500, marginBottom: "0.1rem" }}>
                          {load.name}
                        </div>
                        <div style={{ fontFamily: "var(--mono)", fontSize: "0.7rem", color: "var(--muted)" }}>
                          {load.watts}W
                          {load.surgeWatts > 0 && (
                            <span style={{ color: "#f97316", marginLeft: "0.4rem" }}>↑{load.surgeWatts}W surge</span>
                          )}
                        </div>
                      </div>

                      {/* Hours slider */}
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.2rem", minWidth: "90px" }}>
                        <input
                          type="range"
                          min={0.25}
                          max={12}
                          step={0.25}
                          value={load.hours}
                          disabled={!load.enabled}
                          onChange={(e) => setHours(load.id, parseFloat(e.target.value))}
                          style={{ width: "100%", accentColor: "var(--accent)", cursor: "pointer" }}
                        />
                        <span style={{ fontFamily: "var(--mono)", fontSize: "0.7rem", color: "var(--muted)" }}>
                          {load.hours}h/day
                        </span>
                      </div>

                      {/* Daily Wh */}
                      <div
                        style={{
                          fontFamily:  "var(--mono)",
                          fontSize:    "0.8rem",
                          color:       load.enabled ? "var(--accent)" : "var(--muted)",
                          minWidth:    "58px",
                          textAlign:   "right",
                        }}
                      >
                        {fmtWh(Math.round(dailyWh))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Daily total */}
          {results && (
            <div
              style={{
                display:        "flex",
                justifyContent: "space-between",
                alignItems:     "center",
                padding:        "0.6rem 1rem",
                background:     "rgba(245,158,11,0.05)",
                border:         "1px solid rgba(245,158,11,0.2)",
                borderRadius:   "6px",
                fontSize:       "0.8rem",
              }}
            >
              <span style={{ color: "var(--muted)" }}>Total daily consumption</span>
              <span style={{ fontFamily: "var(--mono)", color: "var(--accent)", fontSize: "1rem", fontWeight: 700 }}>
                {fmtWh(Math.round(results.dailyWh))}
              </span>
            </div>
          )}
        </div>
      )}

      {/* ── Section 3: Results ───────────────────────────────────────────── */}
      {hasActiveLoads && results && (
        <div>
          <SectionLabel step="03" title="System requirements" />

          {/* Sun hours selector */}
          <div style={{ marginBottom: "1.25rem" }}>
            <div
              style={{
                fontSize:      "0.7rem",
                fontFamily:    "var(--mono)",
                color:         "var(--muted)",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                marginBottom:  "0.5rem",
              }}
            >
              Peak sun hours / day (your location)
            </div>
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              {SUN_TIERS.map((t, i) => (
                <button
                  key={t.label}
                  onClick={() => setSunTierIdx(i)}
                  style={{
                    padding:      "0.35rem 0.75rem",
                    borderRadius: "4px",
                    border:       `1px solid ${sunTierIdx === i ? "var(--accent)" : "var(--border)"}`,
                    background:   sunTierIdx === i ? "rgba(245,158,11,0.1)" : "var(--surface)",
                    color:        sunTierIdx === i ? "var(--accent)" : "var(--muted)",
                    fontSize:     "0.75rem",
                    fontFamily:   "var(--mono)",
                    cursor:       "pointer",
                    transition:   "all 0.15s",
                  }}
                >
                  {t.label} {t.hours}h
                </button>
              ))}
            </div>
          </div>

          {/* Tier badge */}
          {(() => {
            const t = TIER_LABELS[results.tier];
            return (
              <div
                style={{
                  display:        "inline-flex",
                  alignItems:     "center",
                  gap:            "0.5rem",
                  padding:        "0.35rem 0.875rem",
                  background:     t.bg,
                  border:         `1px solid ${t.color}`,
                  borderRadius:   "4px",
                  marginBottom:   "1rem",
                }}
              >
                <span
                  style={{
                    width:        "6px",
                    height:       "6px",
                    borderRadius: "50%",
                    background:   t.color,
                    flexShrink:   0,
                  }}
                />
                <span style={{ fontFamily: "var(--mono)", fontSize: "0.7rem", color: t.color, letterSpacing: "0.08em" }}>
                  {t.label}
                </span>
              </div>
            );
          })()}

          {/* Spec cards */}
          <div
            style={{
              display:               "grid",
              gridTemplateColumns:   "repeat(auto-fit, minmax(160px, 1fr))",
              gap:                   "0.75rem",
              marginBottom:          "1.25rem",
            }}
          >
            <SpecCard label="Panel capacity" value={fmtW(results.panelWatts)} sub="minimum" />
            <SpecCard label="Battery storage" value={fmtWh(results.storageWh)} sub="LiFePO4 at 80% DoD" />
            <SpecCard label="Inverter minimum" value={fmtW(results.inverterWatts)} sub="pure sine wave" />
          </div>

          {/* Note on voltage */}
          {results.panelWatts > 400 && (
            <div
              style={{
                padding:      "0.6rem 0.875rem",
                background:   "rgba(249,115,22,0.06)",
                border:       "1px solid rgba(249,115,22,0.2)",
                borderRadius: "6px",
                fontSize:     "0.75rem",
                color:        "#f97316",
                marginBottom: "1rem",
                fontFamily:   "var(--mono)",
              }}
            >
              System size exceeds 400W -- consider a 24V system to halve current draw and reduce wire cost.
            </div>
          )}

          {/* CTA */}
          <Link
            href="/best-for/shed"
            style={{
              display:        "inline-flex",
              alignItems:     "center",
              gap:            "0.5rem",
              padding:        "0.75rem 1.5rem",
              background:     "var(--accent)",
              color:          "#0a0f14",
              fontWeight:     700,
              fontSize:       "0.875rem",
              borderRadius:   "6px",
              textDecoration: "none",
              transition:     "opacity 0.15s",
            }}
          >
            See matching shed kits
            <span style={{ fontSize: "1rem" }}>→</span>
          </Link>

          {/* Methodology note */}
          <p
            style={{
              fontSize:     "0.7rem",
              color:        "var(--muted)",
              marginTop:    "0.875rem",
              lineHeight:   1.6,
              fontFamily:   "var(--mono)",
            }}
          >
            Calculated using MPPT efficiency (94%), system losses (5%), inverter losses (10%), LiFePO4 80% DoD, 1.25 days autonomy.
            Prices and availability at{" "}
            <Link href="/methodology" style={{ color: "var(--accent)", textDecoration: "none" }}>
              offgridempire.com/methodology
            </Link>
            .
          </p>
        </div>
      )}
    </div>
  );
}

// ── Sub-components ───────────────────────────────────────────────────────────

function SectionLabel({ step, title }: { step: string; title: string }) {
  return (
    <div style={{ display: "flex", alignItems: "baseline", gap: "0.75rem", marginBottom: "0.875rem" }}>
      <span
        style={{
          fontFamily:    "'JetBrains Mono', monospace",
          fontSize:      "0.65rem",
          color:         "var(--accent)",
          letterSpacing: "0.1em",
          opacity:       0.7,
        }}
      >
        {step}
      </span>
      <h2
        style={{
          margin:     0,
          fontSize:   "0.95rem",
          fontWeight: 600,
          color:      "var(--text)",
        }}
      >
        {title}
      </h2>
      <div style={{ flex: 1, height: "1px", background: "var(--border)" }} />
    </div>
  );
}

function SpecCard({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div
      style={{
        padding:      "1rem 1.25rem",
        background:   "var(--surface)",
        border:       "1px solid var(--border)",
        borderRadius: "8px",
      }}
    >
      <div
        style={{
          fontSize:      "0.65rem",
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          color:         "var(--muted)",
          marginBottom:  "0.5rem",
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily:  "'JetBrains Mono', 'Fira Mono', monospace",
          fontSize:    "1.75rem",
          fontWeight:  700,
          color:       "var(--accent)",
          lineHeight:  1,
          marginBottom: "0.35rem",
        }}
      >
        {value}
      </div>
      <div style={{ fontSize: "0.7rem", color: "var(--muted)" }}>{sub}</div>
    </div>
  );
}
