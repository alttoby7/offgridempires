/**
 * Decision-guide registry — the `/guides/[slug]` money pages.
 *
 * These are the Index Governor's most expensive assets: each indexable guide is
 * one of the lean recovery surface's URLs. Every guide ships `indexable: false`
 * (noindex,follow) and renders fully + is internally linked; flipping a guide to
 * indexable is a 🔴 human-approval action (see decision-page-template.md §5 and
 * index-manifest.ts). The offgrid-writer skill drafts new guides here; a human
 * reviews the PR and sets `indexable: true`.
 *
 * Sitemap inclusion + the governor count are both gated on `indexable === true`.
 */

import type { DecisionGuideMeta } from "@/lib/decision/types";

export const decisionGuides: DecisionGuideMeta[] = [
  // ── #1 (Tier 1, highest moat) — refrigerator run-test ──────────────────────
  {
    slug: "will-a-solar-generator-run-a-refrigerator",
    h1: "Will a Solar Generator Run a Refrigerator? (We Ran the Surge Math on 160 Kits)",
    metaTitle: "Will a Solar Generator Run a Refrigerator? (Surge Math)",
    metaDescription:
      "Yes—if it clears the fridge's startup surge and sizes the battery for all-day cycling. We ran the math on 160 kits and ranked the 3 that actually win.",
    intent: "transactional / pre-purchase validation — will a solar generator run a refrigerator",
    answer:
      "Yes — a solar generator will run a refrigerator if two things are true: its inverter clears the compressor's startup surge (≥2,000W pure-sine), and its battery is sized for all-day cycling, not the fridge's ~150W nameplate. We checked 160 kits against that bar; 78 ship with their own panels and clear it. Below are the three that win on cost, plus the surge math behind the rule.",
    loadIds: ["mini-fridge", "chest-freezer"],
    assumptions: {
      sunHoursPerDay: 5.0,
      sunSource: "tier",
      zipCode: "",
      sunTier: "good",
      autonomyDays: 1,
      controllerType: "mppt",
      batteryChemistry: "lifepo4",
    },
    cohortLabel: "inverter ≥ 2,000W and storage ≥ 2 kWh (the surge-clearing floor)",
    cohortHeadlineCount: 160,
    cohortShortlistCount: 78,
    picks: [
      {
        kitSlug: "ecoflow-delta2max-400w",
        label: "Best value",
        rationale:
          "The literal answer to the question. The 2,400W pure-sine inverter clears a fridge's ~1,200–1,800W startup surge with margin, the 2,048Wh battery runs a typical 150W-cycling fridge roughly 24–36 hours with no sun, and at $0.44/Wh it's the cheapest complete, surge-clearing kit in the pool. If you want full access at the lowest price, start here.",
        cta: true,
      },
      {
        kitSlug: "bluetti-1800w-bluetti-rv-rv5-power-hub-unit-only",
        label: "Most autonomy per dollar",
        rationale:
          "Wins on runtime per dollar — $0.25/Wh, 5,120Wh of storage, and 1,800W of panels to refill it. This is the pick for \"fridge plus a freezer plus a couple of cloudy days.\" Its 5,000W inverter is overkill-safe for any fridge surge you'll throw at it.",
      },
      {
        kitSlug: "anker-2400w-anker-solix-f3000-main-unit-only",
        label: "Surge-headroom pick",
        rationale:
          "The choice if you'll stack loads. Its 3,600W inverter leaves headroom for a microwave, a well pump, or an older fridge with a stiff compressor running on top of the fridge — without nudging the inverter toward its limit on every compressor start.",
      },
      {
        kitSlug: "eco-worthy-400w-ultra-280ah",
        label: "Alt — Amazon buyers",
        rationale:
          "A strong Amazon-native option with the most raw storage of the group (3,584Wh) at $0.36/Wh. Its 2,000W inverter sits right at the floor, so it's fine for a single modern fridge but leave the second big surge load off it. Note the price: it's currently above its 6-month low (see the buy/wait table).",
      },
      {
        kitSlug: "anker-4kw-anker-solix-c2000-gen-2-200w-solar-panel",
        label: "Alt — smallest viable",
        rationale:
          "The smallest kit we'd still call a yes: 2,048Wh and a 2,400W pure-sine inverter clear the bar, with just a single 200W panel for slow off-grid top-ups. Good for one fridge in a cabin you visit, not a homestead freezer farm.",
      },
    ],
    receiptMode: "autonomy",
    effectiveLoadWatts: 75,
    receiptNote:
      "Here's the honest part: every kit in this cohort is an integrated power-station-plus-panel bundle, so **missing-parts cost is $0 — there's nothing left to buy to make it run a fridge**. The real receipt for this class isn't hidden parts, it's **runtime**: what your money actually buys is fridge-hours. (About 29 of our 439 catalog kits *do* hide required parts — component kits like a panel-and-controller starter that ships with no battery — those carry a real Completion Gap Receipt. These don't.)",
    sections: [
      {
        heading: "The load profile: what a fridge actually pulls",
        body: `A refrigerator lies to you twice. First, the ~150W on the nameplate is its *running* draw — but a compressor pulls **3–5× that to start**, a ~1,200–1,800W spike for a fraction of a second every time it kicks on. Second, it never really turns off: it cycles roughly a third of the day, 24/7.

Do the real math. A 150W fridge cycling ~⅓ of the day is about **1.2–1.5 kWh per day**. In summer heat, add ~30% — call it **1.8 kWh/day**. That is why a "1000W solar generator" with a 1,000W inverter so often fails on a fridge it's supposedly "rated" for: the inverter trips on the surge, or the battery is sized for the nameplate and dies overnight.

Size it for *your* fridge with the [load calculator](/calculator) and the [battery sizing calculator](/tools/battery-sizing-calculator) — but the floor is the same for everyone: clear the surge, and store for the cycling, not the nameplate.`,
      },
      {
        heading: "The verdict: yes, if it clears two bars",
        body: `The verdict block below fires the **fridge-and-freezer failure note** — the field reality the raw watt math misses. The two bars a kit must clear:

- **Surge-clearing inverter** — at least 2,000W, pure-sine. Modified-sine units make compressors buzz, run hot, and fail early; undersized 1,000–1,500W inverters simply trip on the startup spike.
- **Cycling-sized battery** — sized for the all-day watt-hours (≈1.5–1.8 kWh/day for a fridge), not the 150W running figure.

That two-part gate is exactly why we filtered to **inverter ≥ 2,000W and storage ≥ 2 kWh**. Anything below it is a "looks rated, dies in practice" trap. Why we trust the failure note: see [how we calculate real build cost](/how-real-build-cost-is-calculated) and our [methodology](/methodology).`,
      },
      {
        heading: "The 3 kits that win",
        body: `All five picks below are **LiFePO4 and pure-sine** integrated stations — they pass the chemistry and surge-headroom rules cleanly. The podium ranks by cost-per-watt-hour; the single buy link on the page sits on the #1 value pick. Each kit name links to its full audit.`,
      },
      {
        heading: "Gap-closing BOM: what you still need",
        body: `For these integrated stations, the gap to *run a fridge* is essentially zero — the panel, battery, inverter, and cables are in the box. The honest upgrades people actually reach for are **optional, not required**:

- A **second panel or expansion battery** if you want multi-day autonomy through a cloudy stretch.
- A **heavy-gauge outdoor extension cord** to reach the fridge without voltage drop.
- A **manual transfer switch** only if you're hard-wiring into a panel rather than plugging in.

Need the next size up, or want to compare side by side? See the [2,000W solar kits](/2000-watt-solar-kit) or run a [head-to-head compare](/compare).`,
      },
    ],
    whyWon: [
      "Every podium kit clears the 2,000W pure-sine surge bar with real headroom — the #1 at 2,400W, the autonomy pick at 5,000W.",
      "All are LiFePO4 (holds charge for months, deep-cycles daily) and ship with their own panels, so they can actually recharge off-grid.",
      "Each is priced and spec'd from live data, ranked by cost-per-watt-hour — not a single-brand blog recommending its own box.",
    ],
    whyFailed: [
      "Sub-2,000W \"solar generators\" trip on the compressor's startup surge even when the running watts look fine.",
      "Modified-sine units cook compressors — they buzz, run hot, and shorten fridge life.",
      "Main-unit-only listings look cheap per Wh but ship with no panel, so they can't charge off-grid at all — we excluded them from the paneled shortlist.",
    ],
    faqs: [
      {
        question: "Will a solar generator run a refrigerator?",
        answer:
          "Yes, if its inverter clears the compressor's startup surge (at least 2,000W, pure-sine) and its battery is sized for all-day cycling — roughly 1.5–1.8 kWh/day for a typical fridge — rather than the ~150W running nameplate. Units below that bar often trip on the surge or die overnight.",
      },
      {
        question: "What size solar generator do I need for a fridge?",
        answer:
          "For a single modern refrigerator, target a 2,000W+ pure-sine inverter and at least 2 kWh of LiFePO4 storage for about a day of runtime with no sun. For a fridge plus a freezer or a couple of cloudy days, step up to 5 kWh of storage and add panels to refill it.",
      },
      {
        question: "Can a solar generator run a fridge and a freezer together?",
        answer:
          "Yes — but plan for the combined cycling load (often 2.5–3.5 kWh/day) and the simultaneous surges. A kit with ~5 kWh of storage, a 3,000W+ inverter, and 1,000W+ of panels (like our autonomy pick) handles both comfortably; a 2,000W single-fridge unit will be marginal.",
      },
    ],
    publishedAt: "2026-06-19T00:00:00Z",
    updatedAt: "2026-06-19T00:00:00Z",
    indexable: false, // 🔴 human flip required to index
  },
];

export function getDecisionGuideSlugs(): string[] {
  return decisionGuides.map((g) => g.slug);
}

export function getDecisionGuide(slug: string): DecisionGuideMeta | undefined {
  return decisionGuides.find((g) => g.slug === slug);
}

/** Slugs of guides a human has approved for indexing (drives sitemap + governor). */
export function getIndexableDecisionGuideSlugs(): string[] {
  return decisionGuides.filter((g) => g.indexable).map((g) => g.slug);
}
