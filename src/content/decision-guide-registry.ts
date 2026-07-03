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
      "Yes — a solar generator will run a refrigerator if two things are true: its inverter clears the compressor's startup surge (≥2,000W pure-sine), and its battery is sized for all-day cycling, not the fridge's ~150W nameplate. Of the 160 solar-generator kits OffGridEmpire tested against that bar, 78 (49%) ship with their own panels and clear it. Below are the three that win on cost, plus the surge math — a compressor's locked-rotor draw is 3–5× its running watts — behind the rule.",
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
          "The literal answer to the question. The 2,400W pure-sine inverter clears a fridge's ~1,200–1,800W startup surge with margin, the 2,048Wh battery runs a typical 150W-cycling fridge roughly 24–36 hours with no sun, and at {p1.listedPrice} it's the lowest-priced complete, panel-included pick that clears the surge bar — nothing left to buy. The #2 pick stores more per dollar, but if you want a covered fridge at the lowest sticker price, start here.",
        cta: true,
      },
      {
        kitSlug: "bluetti-1800w-bluetti-rv-rv5-power-hub-unit-only",
        label: "Most autonomy per dollar",
        rationale:
          "Wins on runtime per dollar — {p2.costPerWh}, 5,120Wh of storage, and 1,800W of panels to refill it. This is the pick for \"fridge plus a freezer plus a couple of cloudy days.\" Its 5,000W inverter is overkill-safe for any fridge surge you'll throw at it.",
      },
      {
        kitSlug: "anker-2400w-anker-solix-f3000-main-unit-only",
        label: "Surge-headroom pick",
        rationale:
          "The choice if you'll stack loads. Its 3,600W inverter leaves headroom for a microwave, a well pump, or an older fridge with a stiff compressor running on top of the fridge — without nudging the inverter toward its limit on every compressor start.",
      },
      {
        kitSlug: "anker-4kw-anker-solix-c2000-gen-2-main-unit-only",
        label: "Budget pick",
        rationale:
          "An entry-level path onto the podium at {kit:anker-4kw-anker-solix-c2000-gen-2-main-unit-only.listedPrice}: {kit:anker-4kw-anker-solix-c2000-gen-2-main-unit-only.storageKwh} of {kit:anker-4kw-anker-solix-c2000-gen-2-main-unit-only.chemistry} behind a {kit:anker-4kw-anker-solix-c2000-gen-2-main-unit-only.inverterWatts} pure-sine inverter, with {kit:anker-4kw-anker-solix-c2000-gen-2-main-unit-only.missingCost} in hidden parts. At {kit:anker-4kw-anker-solix-c2000-gen-2-main-unit-only.costPerWh} it runs a single modern fridge cleanly — buy it when the goal is a covered fridge for the lowest outlay, not the longest runtime. It's the main unit only, so add panels separately to recharge off-grid.",
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
      "Here's the honest part: every kit in this cohort is an integrated power-station-plus-panel bundle, so **missing-parts cost is [[const:$0]] — there's nothing left to buy to make it run a fridge**. The real receipt for this class isn't hidden parts, it's **runtime**: what your money actually buys is fridge-hours. (About 29 of our 439 catalog kits *do* hide required parts — component kits like a panel-and-controller starter that ships with no battery — those carry a real Completion Gap Receipt. These don't.)",
    sections: [
      {
        heading: "The load profile: what a fridge actually pulls",
        body: `A refrigerator lies to you twice. First, the ~150W on the nameplate is its *running* draw — but a compressor pulls **3–5× that to start** (its *locked-rotor amperage*, or LRA), a ~1,200–1,800W spike for a fraction of a second every time it kicks on. Second, it never really turns off: it cycles roughly a third of the day, 24/7.

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
    claims: [
      { pick: "p1", metric: "listedPrice", direction: "lowest", among: ["p1", "p2", "p5"], note: "#1 lowest-priced complete, panel-included pick" },
      { pick: "p2", metric: "costPerWh", direction: "lowest", note: "#2 most autonomy per dollar (lowest $/Wh)" },
      { pick: "p2", metric: "storageWh", direction: "highest", note: "#2 most storage (5,120Wh)" },
      { pick: "p2", metric: "inverterWatts", direction: "highest", note: "#2 autonomy pick at 5,000W" },
    ],
    publishedAt: "2026-06-19T00:00:00Z",
    updatedAt: "2026-06-19T00:00:00Z",
    indexable: true, // ✅ FLIPPED 2026-06-21 — pilot money page; tokenized + claim-verified, audited GO
  },

  // ── #2 (Tier 1) — solar generator for a well pump ───────────────────────────
  {
    slug: "solar-generator-for-well-pump",
    h1: "Solar Generator for a Well Pump: Why Most Trip on Startup (and the 123 That Don't)",
    metaTitle: "Solar Generator for a Well Pump: 5 That Won't Trip",
    metaDescription:
      "Most solar generators trip a well pump on startup (2,000–3,500W inrush). We ranked 123 LiFePO4 kits to the 5 with real surge headroom — specs, price, BOM.",
    intent:
      "transactional / high-stakes pre-purchase — solar generator for well pump (will it run / won't trip)",
    answer:
      "Most \"3,000W\" solar generators trip a well pump because the running watts look fine but the startup hits a 2,000–3,500W locked-rotor spike. To run a pump you need a pure-sine, LiFePO4 unit with real surge headroom — and, for a 240V submersible, a 120/240V split-phase inverter, not a 120V power station. We filtered 439 kits to the 123 that clear the LiFePO4 + ≥3,000W bar, then narrowed to the 5 with enough surge reserve to swallow the inrush. Here they are, with specs, price, and the pump-tie-in BOM the kit doesn't include.",
    loadIds: ["well-pump", "mini-fridge", "chest-freezer", "sump-pump", "starlink"],
    assumptions: {
      sunHoursPerDay: 4.5,
      sunSource: "tier",
      zipCode: "",
      sunTier: "average",
      autonomyDays: 2,
      controllerType: "mppt",
      batteryChemistry: "lifepo4",
    },
    cohortLabel: "LiFePO4 chemistry and inverter ≥ 3,000W pure-sine (the surge-clearing floor)",
    cohortHeadlineCount: 123,
    cohortShortlistCount: 40,
    picks: [
      {
        kitSlug: "core-3.2kw-core-pro",
        label: "Best surge headroom",
        rationale:
          "The cleanest answer to a well pump's startup problem. Its 7,500W continuous inverter swallows a 3,500W locked-rotor spike with more than 2× headroom — the pump never even nudges the inverter's ceiling on a start. 10,000Wh of LiFePO4 rides a pump's daily duty cycle plus the fridge and freezer that almost always run alongside it, and at {p1.costPerWh} it lands mid-pack on price for far more inverter than the field. If you want one box that just won't trip, this is it.",
        cta: true,
      },
      {
        kitSlug: "prime-4.4kw-prime-plus-eg4-wallmount-indoor-14-3kwh-budget-frie",
        label: "Best value / native 240V",
        rationale:
          "Built on the EG4 6000XP, a 6,000W 120/240V split-phase inverter — so it runs a 240V deep submersible directly, no hub or workaround. At {p2.costPerWh} it is the best value on the board and ships the biggest bank in the group at 14,300Wh, enough for a homestead where the pump is one load among many. If your pump is 240V and hardwired, start here.",
      },
      {
        kitSlug: "anker-3200w-plus-1-x-f3800p-main-unit",
        label: "Cheapest that clears the inrush",
        rationale:
          "The lowest-priced kit here that still beats the startup spike: the F3800's 6,000W surge clears a 3,500W locked-rotor inrush with room to spare, and it puts out both 120V and 240V. At {p3.listedPrice} it's the entry point for grid-down well backup. The trade-off is the 3,840Wh bank — it's a backup unit for outages, not whole-house autonomy, and a single F3800 needs the Double Voltage Hub for a true 240V well.",
      },
      {
        kitSlug: "anker-6400w-plus-2-x-f3800p-double-voltage-hub",
        label: "Portable 240V, bigger bank",
        rationale:
          "Two F3800 units on the Double Voltage Hub give you true split-phase 240V plus 7,680Wh — a plug-and-play 240V well backup with no electrician for the unit itself. The 6,000W inverter clears the inrush, and at {p4.costPerWh} it's the practical pick when you want 240V capability without hardwiring a wall-mount. Skip the single F3800 (#3) for a 240V submersible and buy this instead.",
      },
      {
        kitSlug: "prime-4.4kw-prime-plus-alpha-5-pro-10-2kwh-budget-friendly-open",
        label: "Hardwire, mid bank",
        rationale:
          "The same EG4 6000XP split-phase platform as #2 with a 10,200Wh bank — a 6,000W native-240V inverter that runs a submersible directly, sized for a household that doesn't need the full 14kWh. At {p5.costPerWh} it's a fair alternate to the WallMount when you want a different battery format. One caveat: it's currently sitting near its 6-month high, so watch the buy/wait note before pulling the trigger.",
      },
    ],
    receiptMode: "autonomy",
    effectiveLoadWatts: 750,
    receiptNote:
      "Here's the honest part: all five picks are component-complete integrated systems — **missing-parts cost is [[const:$0]], there's no hidden BOM surcharge to make the kit itself work**. So the receipt here isn't about padding the price; it's about **runtime** (how many pump-and-fridge hours your money buys) and the one thing the kit doesn't include: the **pump tie-in**. For a hardwired 240V submersible that's a manual transfer switch or generator interlock (≈[[const:$150–$400]], electrician install) plus appropriately-rated cable — see the gap-closing BOM below. The kit price is real and complete; the pump-connection parts are the gap.",
    sections: [
      {
        heading: "The load profile: what a well pump actually pulls",
        body: `A well pump lies the same way a fridge does — only the stakes are your water. A ½ HP submersible runs at about **750W**, but its motor draws **3–5× that for a split second on every start**: a **2,000–3,500W locked-rotor inrush**. Plenty of 2,000W inverters that handle the 750W running number just fine will **shut down on that spike**. (Our [load calculator](/calculator) lists the pump conservatively at 750W run / 1,500W surge — that's a running-surge figure; the locked-rotor inrush our verdict engine defends against is the bigger 2,000–3,500W number.)

There are three real buyers here. **(a) Grid-down well backup** — pump plus a fridge for outages. **(b) Off-grid homestead** — the pump is one of many all-day loads. **(c) 240V deep submersible** — a 1–1.5 HP pump that needs a **120/240V split-phase** inverter, not just a 120V power station.

The sizing rule follows from the duty cycle: a well pump cycles in **1–3 minute bursts**, so it's the **surge that sizes the inverter** and the **cycling (plus everything running alongside it) that sizes the battery**. Size your exact setup — pump, fridge, freezer, Starlink — with the [load calculator](/calculator), and read the low-frequency vs high-frequency inverter explainer in [inverters & power conversion](/learn/inverters-and-power-conversion).`,
      },
      {
        heading: "The verdict: a pump can trip an inverter sized for its running watts",
        body: `Our 14-pattern failure engine fires a **blocker** on this load:

> **A ½ HP pump runs at ~750W but its motor draws 3–5× that for a split second on every start (locked-rotor inrush) — a 2,000–3,500W spike. Plenty of 2,000W inverters shut down on it even though the running number looks fine.**

The fix, verbatim from the engine: **use a low-frequency (transformer-based) inverter rated 3,000W+, or fit the pump with a soft starter / CSCR control box. Pure sine only.** That is the whole thesis of this page — and it's a sourced engine fact a generic "yes, with enough watts" blog can't fabricate. See [how the methodology works](/methodology) and [how real build cost is calculated](/how-real-build-cost-is-calculated).

**And it rarely runs alone.** Three secondary warnings shape the storage sizing:
- **Fridge + freezer** — they surge 3–5× too and cycle 24/7, dominating daily watt-hours.
- **Sump pump** — its inrush roughly doubles the running watts, and the storms when you need it are exactly when there's no sun to recharge. Give it real surge headroom and 2–3 days of autonomy.
- **Starlink** — a rural well usually means rural internet: ~1.8–2.4 kWh/day, continuous. That's why the bigger banks (#2/#4) earn their place.`,
      },
      {
        heading: "The 5 kits that win",
        body: `All five picks are **LiFePO4 and pure-sine** integrated systems that clear the surge bar with margin — the #1 at **7,500W continuous**, the rest at **6,000W**, every one of them well past a 3,500W inrush. The podium ranks by surge headroom, then cost-per-watt-hour; the single buy link on this page sits on the #1 pick. Each kit name links to its full audit.

Be opinionated about voltage: if you have a **240V deep submersible**, **skip the single Anker F3800 (#3)** — it's 120V unless you hub it — and buy the **split-phase EG4 WallMount (#2)** or the **dual-hub Anker (#4)**. For a 120V jet/shallow pump or grid-down backup, the F3800 is the cheapest unit that clears the inrush. Compare any of these [head-to-head](/compare), or browse more 240V-capable [whole-home systems](/whole-home).`,
      },
      {
        heading: "Gap-closing BOM: what you still need to actually run your well",
        body: `These kits are component-complete — panel, battery, inverter, controller and cabling are in the box, so there's no missing-parts surcharge ([how we calculate that](/how-real-build-cost-is-calculated)). The real "still need to buy" is the **pump tie-in**, which no power station includes:

- **120V power station path** — if your pump and its pressure-control are 120V, nothing extra. **Verify the pump voltage first.**
- **240V submersible path** — confirm the inverter is **120/240V split-phase** (#2 and #4 are; a single F3800 is 120V unless hubbed), then add a **manual transfer switch or generator interlock kit** (~[[const:$150–$400]], electrician install) and appropriately-rated cable (e.g. an L14-30 path for portables).
- **Soft-start option** — if you keep a smaller inverter, a **CSCR control box / soft starter** on the pump (~[[const:$80–$250]]) cuts the inrush — straight from the verdict note's fix.

Walk the wiring in [solar installation & DIY](/learn/solar-installation-diy), and re-check your numbers in the [calculator](/calculator) after you add the pump and its companions. Prices on the kits come from multi-retailer tracking — see [data sources](/data-sources).`,
      },
    ],
    whyWon: [
      "Every podium kit clears a 3,500W locked-rotor inrush with real reserve — #1 at 7,500W continuous, the rest at 6,000W — and all are pure-sine LiFePO4, so the motor runs clean, not hot.",
      "Of the 123 in the cohort, 102 carry inverters ≥4,000W and 81 ≥6,000W — there's plenty of surge headroom in the data; we picked the residential sweet spot rather than oversized whole-home stacks.",
      "Two picks deliver native 120/240V split-phase, so they run a deep submersible directly — and every spec and price is pulled from live data, not a single-brand blog recommending its own box.",
    ],
    whyFailed: [
      "Sub-3,000W power stations trip on the 2,000–3,500W locked-rotor inrush even when the 750W running watts look fine — the #1 buyer mistake.",
      "Modified-sine inverters make pump and compressor motors buzz, run hot, and fail early — pure sine is non-negotiable for a well.",
      "120V-only power stations simply won't run a 240V submersible at all; we also cut mis-parsed whole-home records (fused inverter kW) and 20kW+ stacks as overkill for a well.",
    ],
    faqs: [
      {
        question: "Can a solar generator power a well pump?",
        answer:
          "Yes — but only if its inverter clears the pump's startup surge, not just the running watts. A ½ HP submersible runs at ~750W yet spikes 2,000–3,500W on every start, so you need a pure-sine, LiFePO4 unit rated 3,000W+ (a low-frequency inverter or a pump soft-starter helps). A 240V pump also needs a 120/240V split-phase inverter, not a 120V power station.",
      },
      {
        question: "How many watts do I need to run a well pump on a solar generator?",
        answer:
          "Size for the surge, not the run. A ½ HP submersible runs near 750W but draws a 2,000–3,500W locked-rotor inrush on startup, so target a pure-sine inverter rated at least 3,000W continuous — our podium picks run 6,000–7,500W to clear it with margin. Larger 1–1.5 HP pumps need both more surge headroom and a 240V split-phase inverter.",
      },
      {
        question: "Will a portable power station run my 240V submersible well pump?",
        answer:
          "Only if it outputs true 120/240V split-phase. A single Anker F3800 is 120V unless you pair two on a Double Voltage Hub; the EG4 6000XP-based kits are natively 240V. For a hardwired 240V pump you'll also need a manual transfer switch or generator interlock (about [[const:$150–$400]] installed) — that's the one part the kit itself doesn't include.",
      },
    ],
    claims: [
      { pick: "p1", metric: "inverterWatts", direction: "highest", note: "#1 at 7,500W vs 6,000W rest" },
      { pick: "p2", metric: "costPerWh", direction: "lowest", note: "#2 best value on the board" },
      { pick: "p2", metric: "storageWh", direction: "highest", note: "#2 biggest bank (14,300Wh)" },
      { pick: "p3", metric: "listedPrice", direction: "lowest", note: "#3 cheapest / lowest-priced kit here" },
    ],
    publishedAt: "2026-06-19T00:00:00Z",
    updatedAt: "2026-07-03T00:00:00Z",
    indexable: true, // ✅ FLIPPED 2026-07-03 — 2nd money page; audited clean, claim-verified, owner-approved (1/wk cadence)
  },

  // ── #3 (Tier 2) — off-grid solar kit for a cabin ───────────────────────────
  {
    slug: "off-grid-solar-kit-for-cabin",
    h1: "Off-Grid Solar Kits for a Cabin: Real Build Cost After the Missing Parts",
    metaTitle: "Off-Grid Solar Kits for a Cabin: Real Build Cost (2026)",
    metaDescription:
      "We compared 56 cabin-rated solar kits on true build cost, hidden missing parts, and 6-month price trends. The honest shortlist — plus when to buy vs. wait.",
    intent: "decision / shortlist — off grid solar system for a cabin (high commercial intent)",
    answer:
      "For a cabin, the kit that works is whatever clears your well pump's startup surge and stores enough for a fridge that never sleeps — not whatever has the biggest panel number. We filtered to 143 cabin-rated kits with a 2,000W+ inverter, then ranked the 56 clean, paneled primaries. The honest surprise: the best cabin kits are near-complete integrated LiFePO4 stations (missing-parts cost ~[[const:$0]]), so the real receipt isn't a hidden battery — it's panel mounts, monitoring, and a soft starter for the well. The five below win on cost-per-watt-hour, surge headroom, and a verifiable 6-month price signal.",
    loadIds: ["mini-fridge", "well-pump", "led-light", "wifi-router"],
    assumptions: {
      sunHoursPerDay: 4.5,
      sunSource: "tier",
      zipCode: "",
      sunTier: "average",
      autonomyDays: 2,
      controllerType: "mppt",
      batteryChemistry: "lifepo4",
    },
    cohortLabel: "cabin-rated (top-two fit) and inverter ≥ 2,000W",
    cohortHeadlineCount: 143,
    cohortShortlistCount: 56,
    picks: [
      {
        kitSlug: "bluetti-1800w-bluetti-rv-rv5-power-hub-unit-only",
        label: "Best $/Wh — most battery per dollar",
        rationale:
          "The most storage you can buy per dollar in this cohort: 5,120Wh of LiFePO4 at {p1.costPerWh}, with a 5,000W inverter that won't flinch at a ½-HP well pump's 2,000–3,500W startup spike — the single biggest reason cabin kits fail. That surge headroom plus 1,800W of panels to refill it makes this the pick for a fridge, a pump, and a couple of cloudy days. One caveat to confirm on the retailer page: the \"unit only\" listing is an integrated bundle in our data (panels, battery, inverter, controller, wiring, and mounting all flagged included) — verify the panel array before you buy. Flat at {p1.listedPrice} across its full 37-point history, so buy when you need it.",
        cta: true,
      },
      {
        kitSlug: "jackery-2000plus-4085wh-2x200w",
        label: "Best balanced cabin pick — and best buy-now story",
        rationale:
          "The most balanced cabin system here: 4,085Wh of LiFePO4, a 3,000W inverter with real surge margin for a well pump, and app monitoring built in — at {p2.costPerWh}. It's also the strongest buy-now signal in the whole cohort: {p2.listedPrice} today, down from a {p2.high6mo} peak across 167 price observations, a steep drop, and it has not been cheaper. If you want one box that handles a full cabin load and you're buying this month, this is it.",
      },
      {
        kitSlug: "renogy-400w-complete-lifepo4",
        label: "Best true component kit — most \"cabin-real\"",
        rationale:
          "The only kit on the list that itemizes a real wired build: 400W of panels, a 40A MPPT controller, a 200Ah (2,560Wh) LiFePO4 battery, a 2,000W pure-sine inverter, and Bluetooth monitoring — completeness 100, the highest in the cohort. At {p3.costPerWh} it's the priciest per watt-hour here, and that's the honest tradeoff: you're paying for a mountable, expandable, rack-style system instead of a sealed box. The 2,000W inverter sits right at the floor, so pair it with a soft starter if you're on a submersible well. Price history is a single observation, so we won't fake a trend — treat list price as current.",
      },
      {
        kitSlug: "anker-2400w-anker-solix-f3000-main-unit-only",
        label: "Best value all-in-one",
        rationale:
          "A big-inverter all-in-one at its 6-month low: 3,072Wh of LiFePO4, a 3,600W inverter with plenty of room to stack a microwave or pump on top of the fridge, and 2,400W of panels — at {p4.costPerWh}. Currently {p4.listedPrice}, the bottom of its {p4.low6mo}–{p4.high6mo} range over the last six months (at the floor of that range), so the price signal says buy now. The integrated unit ships near-complete (completeness 86, missing-parts cost {p4.missingCost}).",
      },
      {
        kitSlug: "anker-4kw-anker-solix-c2000-gen-2-main-unit-only",
        label: "Cheapest path into a cabin build",
        rationale:
          "The budget entry: {kit:anker-4kw-anker-solix-c2000-gen-2-main-unit-only.storageKwh} of {kit:anker-4kw-anker-solix-c2000-gen-2-main-unit-only.chemistry} at {kit:anker-4kw-anker-solix-c2000-gen-2-main-unit-only.costPerWh} behind a {kit:anker-4kw-anker-solix-c2000-gen-2-main-unit-only.inverterWatts} pure-sine inverter, {kit:anker-4kw-anker-solix-c2000-gen-2-main-unit-only.missingCost} hidden. At {kit:anker-4kw-anker-solix-c2000-gen-2-main-unit-only.listedPrice} it's the lowest outlay on the podium — enough for a weekend cabin's lights, fridge, and electronics. It's the main unit only, so add panels to recharge between visits, and step up if you want more than a couple of cloudy days of autonomy.",
      },
    ],
    receiptMode: "autonomy",
    effectiveLoadWatts: 220,
    receiptNote:
      "Here's the receipt most cabin solar pages won't show you — and the honest surprise is good news. Unlike most brand catalog kits, these five are **near-complete** (completeness 86–100, missing-parts cost [[const:$0]]): you are *not* getting nickel-and-dimed into a second [[const:$800]] order for the battery. So the real cabin \"build cost\" isn't a hidden component — it's the **surge-and-cold tax** the brand pages bury: panel mounts (~[[const:$60–$150]], omitted by several cohort kits), remote monitoring (~[[const:$30–$80]], a common omission), a soft starter for a well pump (~[[const:$50–$70]]), and an optional transfer switch (~[[const:$150–$300]]) if you're backfeeding the cabin panel. What your money actually buys here is autonomy: roughly two days of a real cabin load before you need sun.",
    sections: [
      {
        heading: "The cabin load profile: why inverter watts decide it",
        body: `A cabin isn't an RV and it isn't a house — it's a handful of stubborn loads that punish undersized kits. The realistic numbers: a fridge at roughly **1.2–1.5 kWh/day** (add ~30% in summer), LED lighting, a Wi-Fi router or Starlink (~1.8–2.4 kWh/day if you run satellite), intermittent microwave, and — the one that breaks budgets — **water pumping**.

There's a hard line between a *weekend cabin* you visit and a *full-time off-grid residence*: the second needs **2–3 days of autonomy** so a cloudy stretch doesn't leave you dark. That's the assumption behind the shortlist below.

But the number that actually decides whether your cabin works isn't panel watts — it's **inverter surge**. A ½-HP submersible well pump runs at ~750W but spikes **2,000–3,500W** on every start, and plenty of "2,000W" inverters shut down on it even though the running figure looks fine. Size your real loads with the [load calculator](/calculator) before you shop — but know that the surge bar is what the podium is built around.`,
      },
      {
        heading: "The verdict: a cabin's three killers",
        body: `Three failure patterns fire for a typical cabin load, and two of them are **blockers** — they don't just shrink runtime, they shut the inverter off or blow the budget:

- 🔴 **The well pump (blocker).** A ½-HP pump runs ~750W but inrush spikes 2,000–3,500W on every start. The fix is a low-frequency 3,000W+ pure-sine inverter or a soft starter / CSCR control box. This is why we steer cabin buyers on a submersible well toward the 3,000W–5,000W kits (the Bluetti, Jackery, and Anker), not the 2,000W ones.
- 🟡 **The fridge that never sleeps (warning).** Compressors pull 3–5× running watts to start and cycle 24/7, so they quietly dominate your daily watt-hours — especially in summer heat. Size the battery for all-day cycling and add ~30% in hot climates; modified-sine shortens compressor life, so every kit here is pure-sine.
- 🔴 **Electric resistance heat (blocker).** This is the #1 way off-grid systems get blown out: a 1,500W space heater a few hours a day can need more panel and battery than the rest of your loads combined. Heat with propane or wood and keep electric as spot backup only.

That's why this page filters to **≥2,000W inverters** and recommends 3,000W+ pure-sine for anyone on a well. Why we trust these notes: see [how we calculate real build cost](/how-real-build-cost-is-calculated) and our [methodology](/methodology).`,
      },
      {
        heading: "The shortlist: five cabin kits that win",
        body: `All five picks are **LiFePO4 and pure-sine**, clear the 2,000W inverter floor, and carry a real 6-month price history. The podium below ranks on what matters for a cabin — battery per dollar, surge headroom, and how "cabin-real" the build is — with the single buy link on the #1 value pick. Each kit name links to its full audit.

The honest split: the **Bluetti, Jackery, and Anker F3000** are integrated stations with big inverters (3,000–5,000W) that survive a well pump; the **Renogy and Anker C2000** are smaller 2,000–2,400W systems better suited to a pump-free cabin or one running a soft starter. The Renogy is the only true wired, mountable, expandable component build — completeness 100 — which is the right shape if you plan to grow the system. Compare any two [head-to-head](/compare), or step up to the [2,000W solar kit](/2000-watt-solar-kit) class.`,
      },
      {
        heading: "The receipt and the gap-closing BOM: what brand pages hide",
        body: `Here's the receipt cabin solar pages won't show you, and for this cohort the good news is real: these five list for what they actually cost to *run* — completeness 86–100, **missing-parts cost [[const:$0]]**. You are not getting nickel-and-dimed into a second order for the battery, which is rare; most brand catalog kits are not this complete.

But "complete enough to run" isn't "complete for a cabin." The small, real gaps the brand pages bury — and a realistic dollar band for each:

- **Panel mounts** ([[const:$60–$150]]) — ground racks or roof Z-brackets, omitted by several cohort kits (confirm inclusion on each kit page).
- **Soft starter** ([[const:$50–$70]]) — the blocker fix if you have a well pump or an AC compressor on a 2,000W inverter.
- **Remote monitoring / shunt** ([[const:$30–$80]]) — a common omission on budget kits.
- **Transfer switch + inlet** ([[const:$150–$300]]) — only if you're backfeeding cabin circuits rather than plugging loads in directly.
- **Extra LiFePO4** — for 2–3 days of winter autonomy if the cabin is a full-time residence.

We flag exactly which line items each kit includes versus omits from its own BOM — see the per-kit breakdown on each [kit page](/compare). The point of the receipt isn't that the gap is huge; it's that it's **small and finally visible**.`,
      },
    ],
    whyWon: [
      "Every podium kit is LiFePO4 and pure-sine, clears the 2,000W inverter floor, and ships with its own panels — so it can actually recharge off-grid at a cabin.",
      "The three big-inverter picks (5,000W / 3,000W / 3,600W) carry real surge headroom for a ½-HP well pump, the load that quietly kills undersized cabin kits.",
      "Each is priced, spec'd, and ranked from live data against the other 55 cabin kits — cost-per-watt-hour and a verifiable 6-month price history, not a single brand recommending its own box.",
    ],
    whyFailed: [
      "AGM and generic Li-ion chemistries were cut for shorter cycle life — at a cabin you want LiFePO4 that holds charge for months and deep-cycles daily.",
      "Kits under ~2 kWh of storage are too small for a real cabin's fridge-plus-pump load and a cloudy stretch, so they didn't make the shortlist.",
      "Modified-sine and sub-2,000W \"solar generators\" trip on the well pump's startup surge and cook compressors — they look rated on paper and die in practice.",
    ],
    faqs: [
      {
        question: "How much should an off-grid solar system cost for a small cabin?",
        answer:
          "For a near-complete LiFePO4 station that clears a cabin's surge loads, plan roughly [[const:$1,300–$2,000]] — our five cabin picks list from {p5.listedPrice} to {p2.listedPrice}. Because these ship with panels, battery, and inverter integrated, the real build cost is close to the sticker; budget another ~[[const:$100–$300]] for panel mounts, monitoring, and a soft starter if you're on a well.",
      },
      {
        question: "How much solar power do I need for an off-grid cabin?",
        answer:
          "Size to your loads, not a round number. A typical cabin (fridge, lights, router, intermittent pump) runs ~2–4 kWh/day, so target at least 2 kWh of LiFePO4 storage and 400W+ of panels for a weekend cabin, and 4–5 kWh with 2–3 days of autonomy for a full-time residence. The inverter must clear your biggest surge — a well pump needs 3,000W+.",
      },
      {
        question: "Will a 400W solar panel run a fridge?",
        answer:
          "It can keep a fridge topped up over a full day, but not on the panel alone — you need a battery to ride through cycling and the night. A 400W array generates roughly 1.5–2 kWh on a good day, which covers a typical fridge's ~1.2–1.8 kWh/day, but only if it's paired with 2 kWh+ of storage and a 2,000W+ pure-sine inverter to clear the compressor's startup surge. Three of our five cabin picks are exactly 400W-panel systems.",
      },
    ],
    claims: [
      { pick: "p1", metric: "costPerWh", direction: "lowest", note: "#1 most battery per dollar (lowest $/Wh)" },
      { pick: "p3", metric: "completeness", direction: "highest", note: "#3 completeness 100, highest in cohort" },
      { pick: "p3", metric: "costPerWh", direction: "highest", note: "#3 priciest per watt-hour here" },
      { pick: "p5", metric: "listedPrice", direction: "lowest", note: "#5 cheapest path / lowest outlay" },
      { pick: "p2", metric: "listedPrice", direction: "highest", note: "FAQ price-range top end" },
    ],
    publishedAt: "2026-06-19T00:00:00Z",
    updatedAt: "2026-06-19T00:00:00Z",
    indexable: false, // 🔴 human flip required to index
  },

  // ── #4 (Tier 2) — off-grid / boondocking RV solar kit ──────────────────────
  {
    slug: "off-grid-solar-kit-for-rv",
    h1: "Off-Grid / Boondocking RV Solar Kits: What's Actually in the Box vs What You Still Buy",
    metaTitle: "Off-Grid RV Solar Kits: In the Box vs What You Buy",
    metaDescription:
      "We evaluated 65 RV-rated solar kits (1–3kWh). The 5 that actually power a boondocking coach — plus the mounts, fuses & transfer switch nobody itemizes.",
    intent: "decision / shortlist — off grid rv solar kit / solar power for rv",
    answer:
      "A boondocking RV solar kit is panels + a LiFePO4 battery + a pure-sine inverter + a charge controller — and for most coaches a 1,000–2,560Wh, 1,800–2,400W pick is the right band. There are two real paths: a plug-and-play power station (complete out of the box, nothing left to buy) or a hardwired component kit (permanent coach integration, but it adds install-side parts the kit doesn't carry). We screened 65 RV-rated kits in that storage band; 91% run LiFePO4 and the median lists around [[const:$1,299]]. Below are the 5 that actually power a coach — and the honest line on air conditioning.",
    loadIds: [
      "led-light",
      "phone-charger",
      "laptop",
      "12v-fan",
      "mini-fridge",
      "rv-water-pump",
      "microwave",
      "starlink",
      "window-ac",
    ],
    assumptions: {
      sunHoursPerDay: 5.0,
      sunSource: "tier",
      zipCode: "",
      sunTier: "good",
      autonomyDays: 1,
      controllerType: "mppt",
      batteryChemistry: "lifepo4",
    },
    cohortLabel: "RV-rated (good or better) and storage 1,000–3,000Wh — the viable boondocking band",
    cohortHeadlineCount: 65,
    cohortShortlistCount: 5,
    picks: [
      {
        kitSlug: "renogy-400w-complete-lifepo4",
        label: "Best for true off-grid (hardwired)",
        rationale:
          "The only complete *hardwired* LiFePO4 kit in the cohort, and the real answer if you want power permanently integrated into the coach. Its BOM fills every role — 400W panels, a Rover 40A MPPT controller, a 200Ah 12V LiFePO4 battery, a 2,000W pure-sine inverter, MC4 + battery cables, Z-bracket mounts, and a BT-2 Bluetooth monitor — which is why it scores 100/100 completeness at {p1.listedPrice} ({p1.costPerWh}). The catch isn't missing kit parts; it's the install-side receipt below (mounts, a Class-T fuse, a transfer switch) that a real coach hardwire still needs.",
        cta: true,
      },
      {
        kitSlug: "ecoflow-delta2max-400w",
        label: "Best plug-and-play value",
        rationale:
          "The value anchor: at {p2.costPerWh} it's the lowest cost-per-Wh in the excellent, complete cohort. The 2,400W pure-sine inverter clears a microwave's startup draw in bursts, and the 2,048Wh LiFePO4 battery carries a full boondock day of 12V loads. It ships complete — missing-parts cost is {p2.missingCost} — so you trade permanent integration for plug-in simplicity. Price sits in fair territory; it has discounted hard before, so watch for a drop.",
      },
      {
        kitSlug: "bluetti-500w-ac180p-double-kit-2-x-200w-rigid-panels",
        label: "Mid-coach plug-and-play",
        rationale:
          "A balanced mid-coach pick: 500W of rigid panels feeding a 1,440Wh LiFePO4 station with an 1,800W pure-sine inverter, complete out of the box at {p3.listedPrice} ({p3.costPerWh}). The extra panel wattage refills faster than the storage tier implies, which suits a coach that parks in part shade. Good for lights, fans, DC fridge, devices, and microwave bursts — not air conditioning.",
      },
      {
        kitSlug: "anker-600w-anker-solix-c1000-gen-2-main-unit-only",
        label: "Cheapest door in (weekender)",
        rationale:
          "The honest budget entry at {p4.listedPrice}. The C1000 main unit ships WITHOUT a panel — its '600W' is solar-input capacity, not an included array — so you add panels to make it off-grid. Its 2,000W pure-sine inverter will run a microwave in bursts, but the 1,024Wh battery won't sustain much else while it does. Good for a weekender who wants the cheapest viable station and will buy panels separately. Note: it's at its 6-month price high right now — it has sold for less.",
      },
      {
        kitSlug: "anker-4kw-anker-solix-c2000-gen-2-400w-solar-panel",
        label: "Big-coach plug-and-play",
        rationale:
          "The most headroom of the plug-and-play picks: a 2,400W pure-sine inverter and 2,048Wh of LiFePO4 with a 400W panel, complete at {p5.listedPrice} ({p5.costPerWh}). The bigger inverter and expandable platform suit a larger coach stacking a microwave on top of the usual DC loads. Complete out of the box, nothing left to buy; price currently sits in a fair, narrow range.",
      },
    ],
    receiptMode: "missing-parts",
    receiptNote:
      "Two truths here. The plug-and-play picks (EcoFlow, Bluetti, Anker) are genuinely complete — **missing-parts cost is [[const:$0]]**, the panel, battery, inverter, and cables are in the box, and that's their whole appeal. The hardwired #1 scores 100/100 on *kit* completeness, but a permanent coach install still needs install-side parts the kit BOM doesn't carry: roof mounts/tilt brackets (~[[const:$30–$120]]), a Class-T or ANL fuse + holder on the inverter cable (~[[const:$25–$60]]), a DC fuse block / bus bars (~[[const:$40–$90]]), a battery shunt if not included (~[[const:$30–$200]]), a transfer switch or shore-power inlet (~[[const:$60–$200]]), and cable upgrades/lugs/gland (~[[const:$30–$80]]) — roughly [[const:$250–$600]] of integration parts on top of the kit. Two in-cohort kits also carry a *modeled* gap: WindyNation 400W ([[const:+$170]]) and Eco-Worthy 200W ([[const:+$125]]) look cheap but aren't complete.",
    sections: [
      {
        heading: "What you're actually powering on a boondock day",
        body: `A boondocking RV solar kit answers a 12V coach, not a house. The realistic daily load is lights, roof and cabin fans, a DC fridge cycling all day, a water pump, [Starlink](/calculator) and devices, and a microwave in bursts off the inverter. That maps cleanly to the three storage tiers in this cohort:

- **~1,024Wh** (Anker C1000) — a weekender's loads: lights, fans, charging, microwave bursts, but not much sustained AC draw.
- **~1,440–2,048Wh** (Bluetti, EcoFlow, big Anker) — a full boondock day of the loads above with margin.
- **2,560Wh** (Renogy hardwired) — the most all-day headroom and a permanent coach integration.

Size it to *your* coach with the [load calculator](/calculator), and read the category background in [RV & camper solar](/learn/rv-and-camper-solar). The hard line: every pick here runs the coach, but none of them run rooftop air conditioning off-grid — that's the next section.`,
      },
      {
        heading: "Before you buy: the microwave and A/C verdict",
        body: `Two field realities the watt math misses, both fired by this load profile:

- **The microwave draws more than its label.** A "1,000W" microwave actually pulls ~1,500–1,700W from the battery — door wattage is cooking output, not input draw, and it hits instantly. Every shortlist pick is 1,800W+ pure-sine, so the microwave is fine **in bursts**. The catch is the budget Anker (1,024Wh): it'll *run* a microwave but won't *sustain* much else while it does.
- **Air conditioning is not an off-grid load on this cohort.** A compressor surges ~3× on startup — a 500W window unit spikes near 1,500W every cycle — and even the 2,560Wh Renogy won't carry a rooftop A/C through an afternoon without a soft-start kit *and* a much bigger bank. The honest call: **for A/C, plug into shore power or run the generator.** These kits power the coach (lights, fans, DC fridge, devices, water pump, microwave bursts).

See how we derive these verdicts in our [methodology](/methodology).`,
      },
      {
        heading: "The 5 kits — and which buyer each is for",
        body: `The podium leads with the **hardwired** pick (true off-grid coach power) and then ranks the **plug-and-play** stations. They're different buyers, so the table says so out loud:

- **#1 Renogy 400W** — the only complete hardwired LiFePO4 kit in the cohort. Buy this if you want power permanently wired into the coach.
- **#2 EcoFlow Delta 2 Max** — lowest cost-per-Wh of the complete picks ({p2.costPerWh}). The plug-and-play value anchor.
- **#3 Bluetti AC180P double-kit** — mid-coach, extra panel wattage for shaded parking.
- **#4 Anker C1000 (main unit only)** — cheapest door in; ships without a panel, so you add the array.
- **#5 Anker C2000** — most inverter headroom of the plug-and-play picks for a bigger coach.

Each kit name links to its full [audit](/kits). The single buy link on this page sits on the #1 pick. Want the broader set? Browse [RV-rated solar kits](/best-for/rv).`,
      },
      {
        heading: "The receipt: what's complete vs what you still buy",
        body: `This is the part competitors never print. For the **plug-and-play picks**, real build cost = listed price: missing-parts cost is **[[const:$0]]**, and that's genuinely their appeal — the panel, battery, inverter, and cables are in the box.

For the **hardwired path**, the Renogy kit is complete on paper (100/100 — it carries the panels, MPPT controller, battery, pure-sine inverter, cables, mounts, and a BT-2 monitor), but a real permanent install adds install-side parts the kit BOM doesn't model:

- Roof mounts / tilt brackets: ~[[const:$30–$120]]
- Class-T or ANL fuse + holder on the inverter cable (safety-critical): ~[[const:$25–$60]]
- DC fuse block / bus bars: ~[[const:$40–$90]]
- Battery monitor / shunt if not bundled: ~[[const:$30–$200]]
- Transfer switch or shore-power inlet to tie into the coach AC panel: ~[[const:$60–$200]]
- Cable upgrades / lugs / entry gland: ~[[const:$30–$80]]

Budget roughly **[[const:$250–$600]]** of integration parts on top of a hardwired kit. As proof our engine already tracks gaps: in-cohort, WindyNation 400W carries a modeled **[[const:+$170]]** and Eco-Worthy 200W **[[const:+$125]]** — kits that look cheap but aren't complete. See [how real build cost is calculated](/how-real-build-cost-is-calculated) and the [DIY install guide](/learn/solar-installation-diy).`,
      },
    ],
    whyWon: [
      "Every podium pick runs a 1,800W+ pure-sine inverter, so a microwave fires in bursts without tripping or buzzing a compressor.",
      "All five are LiFePO4 — 91% of the viable RV cohort runs it — so they deep-cycle daily and hold charge between trips, unlike the 2 legacy AGM kits we left off.",
      "Each is ranked on real specs and cost-per-Wh ({p2.costPerWh}–{p1.costPerWh}), splitting the honest plug-and-play vs hardwired choice instead of pushing one brand's box.",
    ],
    whyFailed: [
      "The 2 AGM kits in the cohort were excluded for ~50% usable depth and shorter life — a worse buy per real watt-hour than the LiFePO4 picks.",
      "PWM-controller, modified-sine kits like WindyNation 400W ([[const:+$170]] modeled gap) buzz compressors on microwave and A/C surges and lose charge-controller efficiency.",
      "No kit in this 1–3kWh band runs rooftop air conditioning off-grid — even the 2,560Wh Renogy needs a soft-start kit and a far bigger bank, so we say so instead of implying it.",
    ],
    faqs: [
      {
        question: "Can I run my RV air conditioner off a solar kit?",
        answer:
          "Not off any kit in this 1,000–3,000Wh cohort. A rooftop A/C compressor surges ~3× on startup (a 500W unit spikes near 1,500W every cycle), and even the 2,560Wh Renogy won't carry it through an afternoon without a soft-start kit and a much larger battery bank. For A/C, use shore power or a generator; these kits power the coach — lights, fans, DC fridge, devices, water pump, and a microwave in bursts.",
      },
      {
        question: "What do I still need to buy beyond the kit?",
        answer:
          "For the plug-and-play stations (EcoFlow, Bluetti, Anker), essentially nothing — they ship complete, with [[const:$0]] in missing parts. For a hardwired install like the Renogy 400W, the kit covers every component but a permanent coach integration still adds install-side parts: roof mounts, a Class-T or ANL fuse on the inverter cable, a DC fuse block/bus bars, a battery shunt if not bundled, a transfer switch or shore-power inlet, and cable upgrades — roughly [[const:$250–$600]] total.",
      },
      {
        question: "How big a solar kit do I need for boondocking?",
        answer:
          "For most coaches, target 1,000–2,560Wh of LiFePO4 storage and an 1,800–2,400W pure-sine inverter. Around 1,024Wh suits a weekender running lights, fans, charging, and microwave bursts; 1,440–2,048Wh covers a full boondock day with margin; 2,560Wh gives the most headroom and supports a permanent hardwired install. Size it to your actual loads with the load calculator.",
      },
    ],
    claims: [
      { pick: "p2", metric: "costPerWh", direction: "lowest", among: ["p1", "p2", "p3", "p5"], note: "#2 lowest $/Wh of the complete (panel-included) picks" },
      { pick: "p1", metric: "costPerWh", direction: "highest", note: "whyWon $/Wh range ceiling ($0.74/Wh)" },
      { pick: "p1", metric: "completeness", direction: "highest", note: "#1 only complete hardwired kit, 100/100" },
      { pick: "p1", metric: "storageWh", direction: "highest", note: "#1 2,560Wh most all-day headroom" },
    ],
    publishedAt: "2026-06-19T00:00:00Z",
    updatedAt: "2026-06-19T00:00:00Z",
    indexable: false, // 🔴 human flip required to index
  },

  // ── #5 (Tier 2) — solar kit for a shed or workshop ─────────────────────────
  {
    slug: "solar-kit-for-shed-or-workshop",
    h1: "Solar Kits for a Shed or Workshop: Cheapest Complete Setup After Hidden Costs",
    metaTitle: "Solar Kit for a Shed: Cheapest Complete Setup",
    metaDescription:
      "We ranked 26 shed solar kits under [[const:$1,500]] by real build cost, not sticker price. The cheapest complete setup, hidden-cost receipts, and buy-now-vs-wait.",
    intent: "transactional / budget-led — which solar kit to buy for a shed or workshop under $1,500",
    answer:
      "For most sheds, the cheapest complete setup that survives shop-tool surges is the Anker SOLIX C1000 bundle at {p1.listedPrice} — a 2,000W pure-sine inverter, 1,024Wh of LiFePO4, and 600W of panels, with {p1.missingCost} in hidden parts. We ranked 26 shed-rated kits under [[const:$1,500]] ([[const:$269–$1,499]] band) by real build cost, not sticker price, because many \"kits\" quote a number that excludes mounting and monitoring. A {p4.listedPrice} panel kit can become a {p4.trueCost} working system once you add the parts it left out.",
    loadIds: ["led-light", "work-light", "drill-charger", "laptop", "mini-fridge", "air-compressor"],
    assumptions: {
      sunHoursPerDay: 4.5,
      sunSource: "tier",
      zipCode: "",
      sunTier: "good",
      autonomyDays: 1,
      controllerType: "mppt",
      batteryChemistry: "lifepo4",
    },
    cohortLabel: "shed-rated, complete, and under [[const:$1,500]] (panel + battery + inverter, real build cost)",
    cohortHeadlineCount: 26,
    cohortShortlistCount: 5,
    picks: [
      {
        kitSlug: "anker-600w-anker-solix-c1000-gen-2-main-unit-only",
        label: "Best value",
        rationale:
          "The default shed pick. Its 2,000W pure-sine inverter clears real shop tools, the 1,024Wh LiFePO4 battery runs lights, a laptop, and intermittent power tools through a work day, and the 600W of solar input refills it. At {p1.listedPrice} with {p1.missingCost} in hidden parts it's the cheapest complete, surge-ready setup in the cohort — {p1.costPerWh}, plug-and-play, nothing left to buy. If you want lights, electronics, and occasional tools in a shed, start here.",
        cta: true,
      },
      {
        kitSlug: "bluetti-500w-ac180p-bluetti-ac180p-main-unit-only",
        label: "More storage per dollar",
        rationale:
          "The step-up when a shop fridge or longer tool sessions are in play. At {p2.costPerWh} — a hair above the Anker's {p1.costPerWh} — it packs 1,440Wh of LiFePO4, about 40% more battery, behind an 1,800W pure-sine inverter, all for {p2.listedPrice} with no hidden parts. Buy this if your shed has a beer fridge cycling 24/7 or you run power tools for hours, not minutes.",
      },
      {
        kitSlug: "ecoflow-delta2max-400w",
        label: "Workshop-grade inverter",
        rationale:
          "The pick when the \"workshop\" half of the question is real. The 2,400W pure-sine inverter gives the surge headroom a table saw or a pancake compressor needs, the 2,048Wh battery covers a full shop session, and at {p3.costPerWh} it's strong value for a workshop-grade inverter. {p3.listedPrice} today sits within ~{p3.pctAboveLow} of its 6-month low — a fair price to lock in.",
      },
      {
        kitSlug: "eco-worthy-200w-complete",
        label: "DIY budget — read the receipt",
        rationale:
          "The lowest entry for a 12V hard-wired shed, and the kit that teaches the hidden-cost lesson. Advertised at {p4.listedPrice}, its real build cost is {p4.trueCost}: the mounting hardware is \"Not included\" and there's no battery monitor (the data names a Victron SmartShunt as the gap, ~+{p4.missingCost}). You get 1,280Wh of LiFePO4, but the {p4.listedPrice} sticker is a {p4.trueCost} working system — which is exactly why a {p1.listedPrice} integrated unit can beat it.",
      },
      {
        kitSlug: "bluetti-1800w-bluetti-rv-rv5-power-hub-unit-only",
        label: "Big-bank ceiling pick",
        rationale:
          "The \"run a fridge and tools all day\" ceiling under [[const:$1,500]]. Its 5,120Wh of LiFePO4 is the cheapest real storage in the cohort at {p5.costPerWh}, behind a 5,000W pure-sine inverter — the most surge headroom on the shortlist — with the panels, mounting, and monitoring already in the box ({p5.missingCost} hidden). At {p5.listedPrice} it has held flat for six months with no dip to wait for, so buy it when you need the runtime — no other kit here gives you this much battery, or this much inverter, for the money.",
      },
    ],
    receiptMode: "autonomy",
    effectiveLoadWatts: 130,
    receiptNote:
      "Here's the honest part: the top three picks are integrated power-station bundles, so their **missing-parts cost is [[const:$0]] — there's nothing left to buy to power a shed**. For this class the real receipt isn't hidden parts, it's **runtime** — what your money buys is hours of lights, tools, and a fridge before the battery needs sun. The hidden-cost trap shows up on the DIY \"kits\": the Eco-Worthy 200W advertises **{p4.listedPrice} but builds to {p4.trueCost}** once you add the mounting and the battery monitor it ships without. That {p4.missingCost} gap is the whole reason a {p1.listedPrice} integrated unit can beat a {p4.listedPrice} kit.",
    sections: [
      {
        heading: "The load profile: what a shed or workshop actually pulls",
        body: `A shed splits into three load tiers, and the tier decides the price band:

- **Tier 1 — lights + electronics + the odd tool.** LED work lights, a phone or laptop charger, a drill on the charger. This is a few hundred watt-hours a day; a ~[[const:$500]] unit covers it.
- **Tier 2 — add a shop fridge or long tool sessions.** A beer fridge cycles 24/7 and quietly dominates the daily watt-hours, and an hour of power tools adds up. Step the battery up — this is the [[const:$700]] tier.
- **Tier 3 — a real workshop.** A table saw, a pancake compressor, or a window AC. Now the **surge** matters more than the running watts, and you're in the [[const:$900+]] tier.

Two loads change everything: an **air compressor** (it spikes on every restart) and any **electric heat** (a space heater alone can outdraw your whole system). Size your exact loads first with the [shed solar calculator](/tools/shed-solar-calculator), then come back to the shortlist.`,
      },
      {
        heading: "The verdict: two loads will break a cheap kit",
        body: `Before you buy, the verdict block below fires on the two loads that decide whether a budget kit survives a workshop:

- **Air compressor (the blocker).** A 1,500W compressor spikes **past 3,000W** on restart and stalls small inverters mid-cut. That's why this shortlist floors the inverter at 2,000W (the Anker) and pushes 2,400W (the EcoFlow) for true shop use. A [[const:$300]] pancake compressor needs the DELTA 2 Max tier, not the entry unit.
- **Electric heat (don't size for it).** Resistance heat is the number-one way off-grid systems get blown out. A shop heater can exceed every other load combined — heat with propane and keep an electric heater as spot backup, never a sized load.

A shop fridge is a milder version of the same lesson: pure-sine only, and size for the 24/7 cycling, not the nameplate. For the inverter detail, see [inverters and power conversion](/learn/inverters-and-power-conversion).`,
      },
      {
        heading: "The shortlist: five kits that clear the bar",
        body: `Every pick below is **LiFePO4 and pure-sine**, shed-rated, and under [[const:$1,500]]. The podium runs from the cheapest complete setup up to the biggest battery; the single buy link on the page sits on the #1 value pick.

- **#1 Anker SOLIX C1000 — {p1.listedPrice}.** Cheapest complete, surge-ready floor. 2,000W inverter, 1,024Wh, {p1.missingCost} hidden.
- **#2 Bluetti AC180P — {p2.listedPrice}.** {p2.costPerWh}, 1,440Wh — the storage step-up for a shop fridge.
- **#3 EcoFlow DELTA 2 Max — {p3.listedPrice}.** 2,400W inverter, {p3.costPerWh} — the workshop-grade pick.
- **#4 Eco-Worthy 200W Complete — {p4.listedPrice} sticker / {p4.trueCost} real.** The DIY budget entry; read the receipt below.
- **#5 Bluetti RV5 Power Hub — {p5.listedPrice}.** 5,120Wh at {p5.costPerWh} behind a 5,000W inverter — the all-day ceiling.

Each name links to its full audit. To see the whole shed-rated pool, browse [best solar kits for a shed](/best-for/shed) or run a [side-by-side compare](/compare).`,
      },
      {
        heading: "The receipt and the gap: sticker price vs real build cost",
        body: `The top three picks are integrated power stations — the panel, battery, inverter, and cables are in the box, so the gap to power a shed is **nothing**. That [[const:$0]] hidden cost is the real reason a {p1.listedPrice} unit can beat a {p4.listedPrice} "kit."

The DIY picks tell the other story. The **Eco-Worthy 200W advertises {p4.listedPrice} but builds to {p4.trueCost}**: the mounting hardware is "Not included," and there's no battery monitor (a Victron SmartShunt, ~+{p4.missingCost}). If you go DIY, budget the gap list up front — Z-bracket roof or wall mounts (~[[const:$25–40]]), a battery monitor, and a properly rated breaker or fuse if you're hard-wiring into shed lights. Watch out for "main unit only" listings too: a cheap-looking per-watt-hour price often means there's no panel in the box at all.

See exactly [how real build cost is calculated](/how-real-build-cost-is-calculated) and our full [methodology](/methodology).`,
      },
    ],
    whyWon: [
      "Every podium kit is LiFePO4 and pure-sine, with an inverter at or above 2,000W — enough to clear real shop-tool surges, not just the running watts.",
      "The top three are integrated stations with [[const:$0]] in hidden parts, so a {p1.listedPrice} unit is genuinely a {p1.listedPrice} working system — nothing left to buy.",
      "All five are priced and ranked from live data by real build cost and cost-per-watt-hour, from the {p1.listedPrice} floor to the {p5.costPerWh} storage ceiling.",
    ],
    whyFailed: [
      "Sub-2,000W kits and a [[const:$300]] pancake compressor don't mix — the inrush spike past 3,000W on restart trips small inverters mid-task.",
      "Modified-sine \"kits\" make compressors and shop fridges buzz, run hot, and fail early — we kept the shortlist pure-sine only.",
      "Panel-only or \"main unit only\" listings look cheap per watt-hour but ship with no battery or no panel, so you'd pay again to make them a working shed system.",
    ],
    faqs: [
      {
        question: "Can a {p1.listedPrice} solar kit run shop tools?",
        answer:
          "Yes, within limits. The {p1.listedPrice} Anker SOLIX C1000 has a 2,000W pure-sine inverter that runs a drill, a circular saw, lights, and a laptop. What it won't do is a 1,500W air compressor, which spikes past 3,000W on restart — for that step up to a 2,400W kit like the EcoFlow DELTA 2 Max or add a soft-start.",
      },
      {
        question: "Why is the \"kit\" more expensive than the advertised price?",
        answer:
          "Many DIY kits quote a sticker that excludes mounting hardware and a battery monitor. The Eco-Worthy 200W advertises {p4.listedPrice} but its real build cost is {p4.trueCost} once you add the parts it ships without. Integrated power stations (Anker, Bluetti, EcoFlow) carry [[const:$0]] hidden cost because mounting is N/A and monitoring is built in.",
      },
      {
        question: "LiFePO4 or AGM for a shed?",
        answer:
          "LiFePO4. It lasts roughly twice as many cycles as AGM at a similar price, holds charge for months between visits, and handles deep daily discharge without damage. Every pick on this shortlist is LiFePO4 — we skipped AGM kits like the WindyNation 400W because the cycle-life math doesn't favor them for a shed.",
      },
    ],
    claims: [
      { pick: "p1", metric: "costPerWh", direction: "lowest", among: ["p1", "p2"], note: "#2 'a hair above the Anker' — p1 < p2 $/Wh" },
      { pick: "p1", metric: "listedPrice", direction: "lowest", among: ["p1", "p2", "p3", "p5"], note: "#1 cheapest complete setup" },
      { pick: "p5", metric: "costPerWh", direction: "lowest", note: "#5 cheapest real storage in the cohort" },
      { pick: "p5", metric: "inverterWatts", direction: "highest", note: "#5 most surge headroom on the shortlist" },
      { pick: "p5", metric: "storageWh", direction: "highest", note: "#5 most battery — no other kit here" },
    ],
    publishedAt: "2026-06-19T00:00:00Z",
    updatedAt: "2026-06-19T00:00:00Z",
    indexable: false, // 🔴 human flip required to index
  },

  // ── #6 (Tier 5) — portable power station for home backup ───────────────────
  {
    slug: "portable-power-station-for-home-backup",
    h1: "Portable Power Stations for Home Backup: What Actually Carries Your Fridge + Furnace Fan",
    metaTitle: "Best Portable Power Station for Home Backup (2026 Picks)",
    metaDescription:
      "We screened 108 all-in-one power stations for the loads that matter — fridge, furnace fan, sump pump. Real specs, true cost, and buy-now-vs-wait pricing.",
    intent: "decision / commercial-investigation — portable power station for home backup",
    answer:
      "For home backup, the spec that decides it isn't running watts — it's surge and autonomy. Your fridge and sump pump both spike 2–5× on every start, and the storms that flood a basement are the same storms with no sun to recharge. So you need a real pure-sine inverter around 3,000W and at least ~2.7 kWh of LiFePO4 to ride out two days. We screened 108 all-in-one power stations for exactly that load profile; below are the 5 that clear both bars, ranked on real specs and true cost.",
    loadIds: ["mini-fridge", "furnace-blower", "sump-pump", "led-light", "wifi-router"],
    assumptions: {
      sunHoursPerDay: 5.0,
      sunSource: "tier",
      zipCode: "",
      sunTier: "good",
      autonomyDays: 2,
      controllerType: "mppt",
      batteryChemistry: "lifepo4",
    },
    cohortLabel:
      "all-in-one stations: storage > 0, inverter > 0, panels < 600W (108 screened); home-backup-fit subset is LiFePO4 with a 1,500–4,000W inverter and 1–6 kWh of storage (47)",
    cohortHeadlineCount: 108,
    cohortShortlistCount: 47,
    picks: [
      {
        kitSlug: "bluetti-ac300-b300k-pv350",
        label: "Best all-round",
        rationale:
          "The editor's pick because it clears every load on this page with margin. A true 3,000W pure-sine inverter swallows the fridge, furnace-blower, and sump-pump surges without flinching, and 2,764Wh of LiFePO4 carries the cycling load through a long outage. It's modular too — add a B300 expansion battery later for multi-day storm autonomy. You pay a premium at {p1.costPerWh}, but you're buying surge headroom plus the option to grow.",
        cta: true,
      },
      {
        kitSlug: "jackery-2000plus-4085wh-2x200w",
        label: "Best for runtime",
        rationale:
          "The value buy for long fridge runtime in a complete, panel-included unit. At 4,085Wh and {p2.costPerWh} it carries the most raw storage of the three complete picks, and its 3,000W pure-sine inverter clears the surge gate. It's also sitting at its 6-month-low price right now — the strongest buy-now signal on the board if you want proven runtime in a unit that ships ready to recharge. (The unit-only #5 packs more watt-hours per dollar, but arrives without panels.)",
      },
      {
        kitSlug: "ecoflow-delta-pro-400w",
        label: "Best for surge stacking",
        rationale:
          "The surge pick if your well, sump, and furnace blower can stack-start at the same instant. Its 3,600W inverter is the largest of the three complete picks, and at {p3.costPerW} it's the cheapest watt among them. 3,600Wh of LiFePO4 keeps the fridge cold while leaving inverter overhead for a simultaneous motor inrush.",
      },
      {
        kitSlug: "ecoflow-11kw-ecoflow-delta-delta-3-ultra-plus-main-unit-only",
        label: "Most expandable",
        rationale:
          "The future-proof pick: a 3,600W inverter and 3,072Wh base unit that expands toward 11kWh as your storm-autonomy needs grow. At {p4.listedPrice} it's the cheapest 3,600W entry on the podium ({p4.costPerWh}). One catch — this is the main-unit-only configuration, so it ships without panels; you'll add solar separately if you want to recharge off-grid between storms.",
      },
      {
        kitSlug: "bluetti-1800w-bluetti-rv-rv5-power-hub-unit-only",
        label: "Budget / most Wh per dollar",
        rationale:
          "The most backup capacity per dollar on the podium: {kit:bluetti-1800w-bluetti-rv-rv5-power-hub-unit-only.storageKwh} of {kit:bluetti-1800w-bluetti-rv-rv5-power-hub-unit-only.chemistry} at {kit:bluetti-1800w-bluetti-rv-rv5-power-hub-unit-only.costPerWh}, the lowest cost-per-watt-hour here. Unlike a 12V budget build, its {kit:bluetti-1800w-bluetti-rv-rv5-power-hub-unit-only.inverterWatts} pure-sine inverter carries a sump pump's start-up surge under storm load, not just a fridge and a furnace fan. At {kit:bluetti-1800w-bluetti-rv-rv5-power-hub-unit-only.listedPrice} ({kit:bluetti-1800w-bluetti-rv-rv5-power-hub-unit-only.missingCost} hidden) it has held flat for six months — buy it when you want the capacity.",
      },
    ],
    receiptMode: "autonomy",
    effectiveLoadWatts: 175,
    receiptNote:
      "Here's the core honesty hook for this class: **the receipt is the price**. Every all-in-one station in this cohort has a missing-parts cost of **[[const:$0]]** — the inverter, battery, charge controller, and outlets are already in the box, so true cost equals the listed price. The trap here isn't hidden parts the way it is with DIY component kits (where the advertised price can hide [[const:$300–$1,000]] of still-to-buy BOM). The trap is **sizing**: buying too little inverter or too little battery for the loads that actually decide an outage. So the real receipt for this class is **runtime** — what your money buys is fridge-hours and surge headroom, not a parts shortfall.",
    sections: [
      {
        heading: "The load profile: fridge, furnace fan, and a sump pump in a storm",
        body: `Home backup comes down to three loads, and none of them behaves like its nameplate. A fridge runs around ~150W but **surges 3–5×** to start its compressor, and it never really turns off — it cycles 24/7. A furnace blower is an inductive ~½ HP motor: ~400–800W running, but **2–3× inrush** every time the burner calls for heat. A sump pump runs ~800–1,050W with **~2× inrush** — and you need it most during multi-day storms, exactly when there's no sun to recharge.

Add the trio up and you're looking at roughly **2–4 kWh per day** depending on cycling, which is why ~2.7 kWh of LiFePO4 is the floor, not the ceiling. The running-watt numbers look trivial; the surge and the all-day total are what actually decide the purchase.

Size it to *your* exact loads with the [load calculator](/calculator) before you buy — and if you're weighing a power station against a gas generator, that's a real fork worth thinking through first.`,
      },
      {
        heading: "The verdict: surge and autonomy, not running watts",
        body: `The verdict block below fires two field-tested failure notes the raw watt math misses — the **fridge-and-freezer** note (compressors surge hard and never turn off) and the **sump-pump** note (a critical motor that surges, needed exactly when there's no sun). Together they set two hard gates:

- **Surge gate** — a real pure-sine inverter around **3,000W**. Modified-sine units make motors buzz, run hot, and fail early; anything well under 3,000W trips on a stacked motor start.
- **Autonomy gate** — at least **~2.7 kWh of LiFePO4**, sized for 2–3 days because the flood storm is the no-sun storm.

That kills two popular choices outright: anything modified-sine, and anything under ~3,000W / ~2.7 kWh. Our podium is filtered to clear both. For the why behind pure-sine and LiFePO4, see [how we calculate real build cost](/how-real-build-cost-is-calculated) and our [methodology](/methodology).`,
      },
      {
        heading: "The 5 that clear both bars",
        body: `Nearly every serious home-backup power station today is LiFePO4 — the cohort confirms it (**103 of 108**). All five picks below are LiFePO4 and pure-sine integrated stations, ranked by how cleanly they clear the surge and autonomy gates. The single buy link on this page sits on the **#1 Bluetti AC300** — 2,764Wh and a true 3,000W inverter that carries the fridge, furnace fan, and sump pump with margin.

Each kit name links to its full audit on [portable power](/portable-power), and you can run any two head-to-head on [compare](/compare). Need more than a single station? Whole-home systems are a different class — start at [portable power](/portable-power) and step up from there.`,
      },
      {
        heading: "The receipt and what's actually left to buy",
        body: `For all-in-one stations, **listed price = true cost** — missing-parts cost is [[const:$0]] across this entire cohort, unlike DIY kits where the advertised price can hide [[const:$300–$1,000]] of BOM. See [how real build cost is calculated](/how-real-build-cost-is-calculated) for the full method.

So the "gap" here isn't parts — it's **operational add-ons**, all optional:

- A **transfer switch or interlock** only if you're hard-wiring the furnace blower into your panel rather than plugging in.
- An **expansion battery** (Bluetti B300, or Jackery/Anker stackable packs) if you want 2–3 days of storm autonomy.
- A **heavy-gauge extension or inlet** to reach the loads without voltage drop.

None of that is a price-hiding trick — it's the difference between "rides out one night" and "rides out a three-day storm." Compare the full receipts on [compare](/compare), and check our [data sources](/data-sources) for how every price is sourced.`,
      },
    ],
    whyWon: [
      "Each podium kit clears the surge gate with a real pure-sine inverter at or near 3,000W — enough to absorb a fridge, furnace-blower, and sump-pump inrush stacking at once.",
      "All five are LiFePO4 and meet the ~2.7 kWh autonomy floor, so they carry the all-day cycling load through a multi-day, no-sun storm instead of dying overnight.",
      "Every spec and price is pulled from live data and ranked on cost-per-watt-hour — not a single-brand roundup recommending its own box by affiliate payout.",
    ],
    whyFailed: [
      "Undersized inverters (well under 3,000W) trip when the furnace blower or sump pump inrush stacks on top of a fridge compressor start — the running watts look fine right up until the motor kicks.",
      "Modified-sine units make compressors and blower motors buzz, run hot, and fail early — disqualifying for a unit that has to run 24/7 through an outage.",
      "Half the broader cohort is too small to matter: the cohort median is only ~1,440Wh, not enough to carry a fridge overnight, and main-unit-only listings that ship with no panel can't recharge off-grid between storms.",
    ],
    faqs: [
      {
        question: "What size power station do I need for a fridge?",
        answer:
          "For a single refrigerator, you want a pure-sine inverter of at least 2,000W to clear the compressor's 3–5× startup surge, and roughly 2 kWh of LiFePO4 for about a day of cycling with no sun. For a fridge plus a furnace fan and sump pump together, step up to a ~3,000W inverter and ~2.7 kWh or more.",
      },
      {
        question: "Will a portable power station run a furnace blower?",
        answer:
          "Yes, if it's pure-sine and has the surge headroom. A furnace blower is a ~½ HP inductive motor that draws 400–800W running but spikes 2–3× on startup, so a 3,000W pure-sine inverter handles it comfortably. Modified-sine units can run hot and damage the motor and should be avoided.",
      },
      {
        question: "Can a portable power station run a sump pump in a storm?",
        answer:
          "Yes, but size for the worst case. A sump pump pulls ~800–1,050W running with ~2× inrush, and you need it most during multi-day storms when there's no sun to recharge — so you want real inverter surge headroom and 2–3 days of LiFePO4 autonomy. That autonomy gate is exactly what our podium is filtered to clear.",
      },
    ],
    claims: [
      { pick: "p1", metric: "costPerWh", direction: "highest", note: "#1 'you pay a premium' (highest $/Wh)" },
      { pick: "p2", metric: "storageWh", direction: "highest", among: ["p1", "p2", "p3"], note: "#2 most storage of the three complete picks" },
      { pick: "p3", metric: "inverterWatts", direction: "highest", among: ["p1", "p2", "p3"], note: "#3 largest inverter of the complete picks" },
      { pick: "p3", metric: "costPerW", direction: "lowest", among: ["p1", "p2", "p3"], note: "#3 cheapest watt of the complete picks" },
      { pick: "p4", metric: "listedPrice", direction: "lowest", among: ["p3", "p4"], note: "#4 cheapest 3,600W entry" },
      { pick: "p5", metric: "costPerWh", direction: "lowest", note: "#5 lowest $/Wh here / most capacity per dollar" },
    ],
    publishedAt: "2026-06-19T00:00:00Z",
    updatedAt: "2026-06-19T00:00:00Z",
    indexable: false, // 🔴 human flip required to index
  },

  // ── #9 (Tier 1) — solar power for a CPAP ───────────────────────────────────
  {
    slug: "solar-power-for-cpap",
    h1: "Best Portable Power for a CPAP Off-Grid: Nights of Runtime, Not Just Watts",
    metaTitle: "Best Portable Power for a CPAP Off-Grid: 5 by Nights of Runtime",
    metaDescription:
      "A CPAP only pulls ~60W — the real question is how many nights it runs. We ranked 38 LiFePO4 power stations by runtime, with the humidifier-off math and prices.",
    intent:
      "transactional / recurring-medical — portable power for a CPAP off-grid (how many nights of runtime)",
    answer:
      "A CPAP is not a watts problem — the machine pulls only ~30–60W, well under any of these inverters. It is a RUNTIME problem: how many nights you can sleep through before the battery is flat. Budget ~400–500Wh a night with the heated humidifier on (it roughly doubles the draw) or ~250Wh with it off, then divide your battery's watt-hours by that. We filtered 81 LiFePO4 power stations with real storage down to the 38 rated for emergency use, and ranked the 5 with the best runtime-per-dollar — plus the one trick (run it on 12V DC, drop the humidifier) that turns two nights into three.",
    loadIds: ["cpap"],
    assumptions: {
      sunHoursPerDay: 4.5,
      sunSource: "tier",
      zipCode: "",
      sunTier: "average",
      autonomyDays: 2,
      controllerType: "mppt",
      batteryChemistry: "lifepo4",
    },
    cohortLabel:
      "LiFePO4 power stations with an AC inverter and 1–5 kWh of storage (the CPAP runtime band)",
    cohortHeadlineCount: 81,
    cohortShortlistCount: 38,
    picks: [
      {
        kitSlug: "anker-2400w-anker-solix-f3000-main-unit-only",
        label: "Best runtime per dollar",
        rationale:
          "The cleanest value on the board. {p1.storageWh} of LiFePO4 at {p1.costPerWh} — the lowest cost-per-watt-hour of any pick here — runs a humidified CPAP about six nights on a full charge, or past a week with the humidifier off. It has a 12V DC output so you can skip the inverter entirely (see below), expands past 12kWh if your needs grow, and carries a 5-year warranty. For most people this is the one to buy.",
        cta: true,
      },
      {
        kitSlug: "jackery-2000plus-4085wh-2x200w",
        label: "Most nights + solar included",
        rationale:
          "The longest runtime in the group: {p2.storageWh} rides roughly eight humidified nights, and it ships with two 200W panels so a sunny afternoon tops it back up during a multi-day outage. At {p2.costPerWh} it isn't the cheapest per watt-hour, but the bundled solar and the biggest bank make it the pick when a single cloudy stretch can't be allowed to interrupt therapy.",
      },
      {
        kitSlug: "ecoflow-delta2max-400w",
        label: "Cheapest way in (solar included)",
        rationale:
          "At {p3.listedPrice} this is the lowest entry price here and it still ships with a 400W panel. {p3.storageWh} covers about four humidified nights — or six-plus with the humidifier off — enough for weekend trips and short outages. If you don't need a week of autonomy, don't pay for it; start here.",
      },
      {
        kitSlug: "ecoflow-delta-pro-400w",
        label: "Best for humidifier-on / heavy use",
        rationale:
          "{p4.storageWh} at {p4.costPerWh}, bundled with a 400W panel, gives roughly seven humidified nights with headroom to spare — the pick if you refuse to turn the heated humidifier off. It has a 12V car output for DC-direct running and enough inverter to carry a CPAP plus a medication fridge on the same unit.",
      },
      {
        kitSlug: "anker-2400w-anker-solix-nomad-kit-2-x-200w-folding-solar-panels",
        label: "Portable / camping CPAP",
        rationale:
          "The same {p5.storageWh} F3000 as the value pick, but bundled with two folding 200W panels that pack flat for a truck bed or a tent vestibule. At {p5.costPerWh} you pay a premium over the main-unit-only build for the portability of folding solar — worth it if your CPAP travels with you rather than living in a closet.",
      },
    ],
    receiptMode: "autonomy",
    effectiveLoadWatts: 55,
    receiptNote:
      "There's no missing-parts surcharge here — these are integrated power stations, **required missing-parts cost is [[const:$0]]**. The only thing worth buying that the box may not include is a **12V DC output cable** for your CPAP (≈[[const:$15–$30]]): running the machine on DC skips the inverter's AC-conversion overhead and can stretch runtime 10–20%. The receipt below is about **nights of autonomy**, not hidden cost — how many nights of therapy your money actually buys.",
    sections: [
      {
        heading: "The load profile: a CPAP is a runtime problem, not a watts problem",
        body: `A CPAP is the rare off-grid load where **watts barely matter**. The machine itself pulls **30–60W** running — every power station here inverts that without noticing. What matters is **how many nights** it keeps going, and the biggest variable is the **heated humidifier**: turn it on and the draw roughly **doubles**, from ~250Wh a night to **~400–500Wh** for a typical 8-hour sleep. (Our [load calculator](/calculator) lists the CPAP at 60W with the humidifier; drop it and you're closer to 30W.)

The math is simple and it's the whole decision: **battery watt-hours ÷ nightly watt-hours = nights of runtime.** A {p3.storageWh} unit is about four humidified nights; a {p2.storageWh} unit is about eight. Size for the **cloudiest stretch you expect between recharges**, not the average — for medical equipment, that's the number that matters.`,
      },
      {
        heading: "The verdict: plan a CPAP conservatively, and run it on DC if you can",
        body: `Our failure-note engine flags a CPAP as a **plan-conservatively** load — not because it's hard to power, but because the stakes are:

> **Running a CPAP through an AC inverter wastes power on overhead, and the heated humidifier roughly doubles the draw. A single cloudy night can't be allowed to cut therapy.**

The fix, verbatim from the engine: **power it from 12V DC where possible, turn off the heated humidifier to cut draw ~50%, and size 2+ days of autonomy.** Three of the picks below (both F3000-based Anker kits and the EcoFlow DELTA Pro) have a **12V DC output**, so a DC-compatible CPAP runs without the inverter conversion loss at all. See [how the methodology works](/methodology) and the [inverters & power conversion](/learn/inverters-and-power-conversion) explainer for why DC-direct saves watt-hours.`,
      },
      {
        heading: "The 5 that win, ranked by runtime per dollar",
        body: `All five are **LiFePO4 and pure sine** — non-negotiable for the sensitive electronics in a CPAP — and every one is rated for emergency use in our data. The podium ranks by **nights of runtime against price**: the {p1.costPerWh} value pick leads, the {p2.storageWh} Jackery carries the most nights, and the {p3.listedPrice} EcoFlow is the cheapest way in. The single buy link sits on the #1 value pick. Each kit name links to its full audit with the real build cost and 6-month price history.

Be honest about how many nights you actually need: a weekend camper is over-served by a week of autonomy, and a homebound medical user shouldn't skimp on it. Compare any of these [head-to-head](/compare), or browse the full [portable power](/portable-power) pool.`,
      },
      {
        heading: "Stretching a charge: the humidifier and the DC cable",
        body: `Two levers decide whether a given battery is two nights or three:

- **The heated humidifier** is the biggest single draw. Turning it off (or using a heat-and-moisture-exchange filter instead) cuts nightly watt-hours **~50%** — the fastest way to add nights in an outage. Keep it on when you have sun to spare; drop it when you don't.
- **Run on 12V DC.** A CPAP powered from a power station's DC output skips the **inverter's AC-conversion overhead** (typically 10–20% loss), so the same battery lasts noticeably longer. You'll need the right **12V DC cable** for your machine (≈[[const:$15–$30]]) — the one accessory worth buying up front. Confirm your CPAP model supports DC input first.

Re-check your exact runtime with the [load calculator](/calculator) after you set your pressure, humidifier, and nightly hours, and see [data sources](/data-sources) for where the kit prices come from.`,
      },
    ],
    whyWon: [
      "Every pick is pure-sine LiFePO4 rated for emergency use, and each clears at least four humidified nights of CPAP runtime on a full charge — the metric that actually matters for medical backup.",
      "Three of the five (both F3000 kits and the DELTA Pro) offer a 12V DC output, so a DC-compatible CPAP runs without inverter conversion loss — real watt-hours saved, straight from the verdict engine's fix.",
      "Runtime, price, and 6-month price history are all pulled from live data — not a single-brand blog quoting its own spec sheet.",
    ],
    whyFailed: [
      "Undersized power stations under ~1kWh look fine on watts but flatten before a second night — the #1 CPAP mistake is buying for the running number, not the nights.",
      "Modified-sine inverters can make sensitive CPAP electronics buzz or misread — pure sine is non-negotiable for medical equipment.",
      "We cut DC-only battery boxes with no AC inverter, and oversized whole-home stacks whose surge headroom a 60W machine will never use — both are the wrong tool for a bedside CPAP.",
    ],
    faqs: [
      {
        question: "How many watt-hours does a CPAP use per night?",
        answer:
          "Roughly 250Wh a night with the heated humidifier off, and 400–500Wh with it on, for a typical 8-hour sleep at mid-range pressure. Divide your battery's watt-hours by that to get nights of runtime: a 2,000Wh unit is about four humidified nights, a 4,000Wh unit about eight.",
      },
      {
        question: "Can I run my CPAP off a solar generator all night?",
        answer:
          "Yes — a CPAP only draws 30–60W, which any LiFePO4 power station here inverts easily. The real question is how many nights it lasts between recharges. Run it off the unit's 12V DC output if your machine supports it (skips inverter loss) and turn off the heated humidifier to roughly double your runtime.",
      },
      {
        question: "Do I need a pure sine wave inverter for a CPAP?",
        answer:
          "Yes. CPAP machines have sensitive electronics and a blower motor that can buzz, run hot, or misread on a modified-sine inverter. Every pick on this page is pure sine and LiFePO4 — the safe combination for nightly medical use.",
      },
    ],
    claims: [
      { pick: "p1", metric: "costPerWh", direction: "lowest", note: "#1 lowest $/Wh in the podium" },
      { pick: "p2", metric: "storageWh", direction: "highest", note: "#2 biggest bank / most nights" },
      { pick: "p3", metric: "listedPrice", direction: "lowest", note: "#3 cheapest entry price" },
    ],
    publishedAt: "2026-07-03T00:00:00Z",
    updatedAt: "2026-07-03T00:00:00Z",
    indexable: false, // 🔴 human flip required to index
  },

  // ── #7 (Tier 2) — off-grid solar system for a homestead ────────────────────
  {
    slug: "off-grid-solar-system-for-homestead",
    h1: "Off-Grid Homestead Solar Systems: Sizing for the Well, the Freezer, and Winter",
    metaTitle: "Off-Grid Homestead Solar: Sizing for Well, Freezer & Winter",
    metaDescription:
      "A homestead's three killers are the well pump's surge, the freezer's 24/7 cycle, and winter's short sun. We ranked 65 LiFePO4 systems (5kWh+) by what actually carries them.",
    intent:
      "decision, high-ticket — off-grid solar system for a homestead (well + freezer + winter autonomy)",
    answer:
      "A homestead isn't one load, it's three that break undersized systems: the well pump's 2,000–3,500W startup surge, the chest freezer's 24/7 compressor cycle, and winter — when the days that need the most power deliver the least sun. That means you size for a 120/240V split-phase inverter (for the well), real surge headroom (for the pump and freezer), and 2–3 days of storage autonomy (for the cloudy winter stretch), not a sunny-day average. We took the 70 homestead-rated LiFePO4 systems with 5kWh or more of storage — 65 of them 240V-capable — and ranked the 5 that carry the whole property, by real value per watt-hour.",
    loadIds: ["well-pump", "chest-freezer", "space-heater"],
    assumptions: {
      sunHoursPerDay: 4.5,
      sunSource: "tier",
      zipCode: "",
      sunTier: "average",
      autonomyDays: 3,
      controllerType: "mppt",
      batteryChemistry: "lifepo4",
    },
    cohortLabel:
      "homestead-rated LiFePO4 systems with 5 kWh+ of storage; 65 of 70 are 120/240V split-phase capable",
    cohortHeadlineCount: 70,
    cohortShortlistCount: 65,
    picks: [
      {
        kitSlug: "prime-4.4kw-prime-plus-eg4-wallmount-indoor-14-3kwh-budget-frie",
        label: "Best value / native 240V",
        rationale:
          "The homestead sweet spot. Built on the EG4 6000XP — a {p1.inverterWatts} 120/240V split-phase inverter that runs a deep well pump directly, no hub — with {p1.storageWh} of LiFePO4 at {p1.costPerWh}, the lowest cost-per-watt-hour on this board. That's enough bank to ride the well, the freezer, and lights through a two-to-three-day cloudy stretch, at a price a serious homestead can actually justify. If your well is 240V and hardwired, start here.",
        cta: true,
      },
      {
        kitSlug: "elite-7.92kw-elite-plus-renon-xc-plus-32kwh-premium-closed-loop",
        label: "Winter autonomy / no compromise",
        rationale:
          "The biggest bank here at {p2.storageWh}, on a {p2.inverterWatts} inverter, with a premium closed-loop battery that talks to the inverter for tighter charge management. At {p2.costPerWh} it's the pick when winter autonomy is non-negotiable — a homestead where a week of overcast can't be allowed to drain the freezer or stop the pump. This is whole-property, run-everything capacity.",
      },
      {
        kitSlug: "anker-6400w-plus-2-x-f3800p-double-voltage-hub",
        label: "Cheapest true-240V entry",
        rationale:
          "The lowest-priced way onto a homestead-grade 240V system: two Anker F3800 units on a Double Voltage Hub give real split-phase 240V plus {p3.storageWh}, plug-and-play, no electrician for the unit itself. At {p3.listedPrice} it clears the well-pump inrush and carries a freezer, and it expands later. The trade-off is the smaller bank — it's a starter homestead or a critical-loads backup, not full winter autonomy.",
      },
      {
        kitSlug: "core-3.2kw-core-pro",
        label: "Most surge headroom",
        rationale:
          "A {p4.inverterWatts} continuous inverter — the most surge headroom in the group — swallows a well pump's locked-rotor spike and a freezer's compressor kick at the same time without flinching. {p4.storageWh} at {p4.costPerWh} makes it a strong all-in-one for a mid-size homestead whose worry is startup surges stacking, not multi-day autonomy.",
      },
      {
        kitSlug: "select-10.6kw-select-max-eg4-wallmount-indoor-28-6kwh-budget-frie",
        label: "Serious homestead, best big-bank value",
        rationale:
          "{p5.storageWh} on a {p5.inverterWatts} split-phase inverter at {p5.costPerWh} — nearly the capacity of the no-compromise pick for less money. The best value once you cross into true whole-homestead storage: well, freezer, winter heat, and everyday loads with days of reserve. The alternate to the Elite when you want the bank without the closed-loop premium.",
      },
    ],
    receiptMode: "autonomy",
    effectiveLoadWatts: 500,
    receiptNote:
      "These are component-complete systems — panels, batteries, inverter, and controller are in the box, so the **required missing-parts cost is [[const:$0]]**. The real spend a homestead adds is **installation**: a 120/240V whole-property system means a **manual transfer switch or main-panel interlock, rated cable, and — for a hardwired well — a licensed electrician and likely a permit** (budget [[const:$500–$2,000]] installed, depending on your panel and run). The kit price is real and complete; the tie-in to your house and well is the line item nobody itemizes. The receipt below is about **days of autonomy**, not hidden hardware.",
    sections: [
      {
        heading: "The three loads that break a homestead system",
        body: `A homestead isn't a single appliance, it's a **stack of the hardest off-grid loads at once** — and undersized systems fail on the combination, not any one of them.

- **The well pump** draws a **2,000–3,500W locked-rotor surge** on every start (a ½ HP submersible runs at ~750W but spikes 3–5× that). A 240V deep submersible needs a **120/240V split-phase inverter**, not a 120V unit. See the full breakdown in the [solar generator for a well pump](/guides/solar-generator-for-well-pump) guide.
- **The freezer (and fridge)** surge 3–5× on their compressors too and **cycle 24/7**, quietly dominating daily watt-hours — worse in a hot summer outbuilding.
- **Winter.** The days that demand the most power (heat, longer lighting, a pump working a cold line) deliver the **least sun**. This is why a homestead sizes for **autonomy** — days of stored energy — not a sunny-day average.

Our load calculator and verdict engine model all three together; size your exact stack with the [load calculator](/calculator).`,
      },
      {
        heading: "The verdict: size for surge, split-phase, and days — not for a sunny afternoon",
        body: `Our failure engine fires **three separate blockers** on a homestead stack:

> **Well pump:** the locked-rotor inrush trips inverters sized for the running watts — use a low-frequency 3,000W+ or split-phase inverter, pure sine only.
> **Fridge/freezer:** compressors surge 3–5× and run around the clock; add ~30% in heat.
> **Resistive heat:** space and water heat are brutal, near-constant draws — the fastest way to flatten a bank in winter.

The synthesis those three force: a **120/240V split-phase inverter** (65 of the 70 kits here qualify), **real surge headroom** for the pump-plus-freezer overlap, and **2–3 days of storage** for the winter cloudy stretch. A "3,000W" 120V power station that looks fine in July won't run a 240V well in January — that's the whole reason this cohort filters the way it does. See [how the methodology works](/methodology) and [how real build cost is calculated](/how-real-build-cost-is-calculated).`,
      },
      {
        heading: "The 5 that carry the property",
        body: `All five are **LiFePO4 and pure sine**, homestead-rated, and — except the entry Anker's smaller bank — sized for real winter autonomy. The podium ranks by **value per watt-hour at homestead scale**: the {p1.costPerWh} EG4-based value pick leads, the {p2.storageWh} Elite carries the most winter reserve, and the {p3.listedPrice} Anker is the cheapest way onto true 240V. The single buy link sits on the #1 value pick. Each kit name links to its full audit with real build cost and 6-month price history.

Match the bank to your winter, not your July: a mild-climate homestead with a shallow pump is well-served by the value or surge picks; a cold-climate property running heat and a deep submersible should size up to the 28–32kWh tier. Compare any [head-to-head](/compare) or browse the full [whole-home](/whole-home) pool.`,
      },
      {
        heading: "What you still add: the house-and-well tie-in",
        body: `The kits are complete; connecting them to a homestead is the part the product pages skip:

- **240V well / whole-house** — confirm the inverter is **120/240V split-phase** (all five here can be; the two EG4 WallMount kits natively), then add a **manual transfer switch or main-panel interlock** and rated cable. A hardwired well means a **licensed electrician and likely a permit** — budget [[const:$500–$2,000]] installed.
- **Freezer placement** — keep chest freezers out of hot outbuildings where the compressor runs ~30% harder; every watt-hour you don't spend cooling a hot shed is autonomy you keep.
- **Winter margin** — if you heat with resistive electric at all, size the bank for the worst week you actually see, or plan a generator / wood backup for the deepest cold. The [inverters & power conversion](/learn/inverters-and-power-conversion) explainer covers the split-phase wiring.

Re-run your exact numbers in the [calculator](/calculator) with your real pump, freezer, and heat loads, and see [data sources](/data-sources) for where kit prices come from.`,
      },
    ],
    whyWon: [
      "Every pick is pure-sine LiFePO4 and (except the entry unit) sized for 2–3 days of winter autonomy — and 65 of the 70-kit cohort are 120/240V split-phase capable, so they run a deep well directly.",
      "The podium spans the real homestead range — from a cheapest-true-240V entry to a 32kWh no-compromise bank — so the recommendation matches the property, not a one-size number.",
      "Every spec, price, and 6-month price trend is pulled from live data, and the verdict stacks three sourced failure notes (well, freezer, resistive heat) that a single-brand blog can't assemble.",
    ],
    whyFailed: [
      "120V-only power stations can't run a 240V submersible at all — the single most common homestead mismatch, no matter how many watts they claim.",
      "Systems sized for a sunny-day average flatten in the first multi-day winter overcast, exactly when the well and heat are working hardest.",
      "We cut sub-5kWh units (too little for whole-property autonomy) and mis-parsed inverter-only / fused-kW records that can't actually carry the stack.",
    ],
    faqs: [
      {
        question: "How big a solar system do I need for an off-grid homestead?",
        answer:
          "Size for three things at once: a 120/240V split-phase inverter for the well (2,000–3,500W surge headroom), enough continuous inverter for the freezer and pump to start together, and 2–3 days of battery autonomy for winter overcast. In practice that's a 10–32kWh LiFePO4 system with a 6,000W+ split-phase inverter — the range this page's picks cover.",
      },
      {
        question: "Can an off-grid solar system run a well pump and freezer together?",
        answer:
          "Yes, if the inverter has the surge headroom for both to start at once and outputs 120/240V split-phase for a deep submersible. A well pump spikes 2,000–3,500W on startup and a freezer compressor surges 3–5×; the picks here run 6,000–19,500W continuous specifically so overlapping startups don't trip the system.",
      },
      {
        question: "How much battery do I need for winter on a homestead?",
        answer:
          "Enough to ride your longest realistic cloudy stretch, not the average. Winter delivers the least sun exactly when heat, lighting, and a hard-working pump demand the most, so homesteads size for 2–3 days of autonomy — commonly 20–32kWh for a cold-climate property running a freezer and any resistive heat.",
      },
    ],
    claims: [
      { pick: "p1", metric: "costPerWh", direction: "lowest", note: "#1 lowest $/Wh in the podium" },
      { pick: "p2", metric: "storageWh", direction: "highest", note: "#2 biggest bank / winter autonomy" },
      { pick: "p3", metric: "listedPrice", direction: "lowest", note: "#3 cheapest true-240V entry" },
    ],
    publishedAt: "2026-07-03T00:00:00Z",
    updatedAt: "2026-07-03T00:00:00Z",
    indexable: false, // 🔴 human flip required to index
  },

  // ── #8 (Tier 2) — marine solar kit for a boat ──────────────────────────────
  {
    slug: "marine-solar-kit-for-boat",
    h1: "Marine Solar for a Boat: Sizing for the Fridge and Starlink That Run All Night",
    metaTitle: "Marine Solar Kits for a Boat: Sizing for Fridge + Starlink",
    metaDescription:
      "On a boat the killers aren't peak watts — they're the fridge and Starlink that draw 24/7 at anchor. We ranked 79 LiFePO4 systems by what rides a night on the hook.",
    intent:
      "decision — marine solar kit / portable power for a boat (24/7 fridge + Starlink at anchor)",
    answer:
      "A boat's power problem isn't peak watts — it's the loads that never turn off. The marine fridge cycles 24/7, and Starlink at anchor pulls a steady 75–100W around the clock, together eating 2.5–3.5kWh on a quiet night on the hook, with only deck solar and the odd engine run to put it back. So you size for storage that rides the night plus panels that refill it by afternoon, in LiFePO4 (for the depth-of-discharge and the weight), not for a big inverter you'll rarely load. We took the 246 boat-rated LiFePO4 systems, narrowed to the 79 cruiser-band units (1–5kWh with an inverter), and ranked the 5 that actually carry a boat's overnight draw.",
    loadIds: ["mini-fridge", "starlink"],
    assumptions: {
      sunHoursPerDay: 5,
      sunSource: "tier",
      zipCode: "",
      sunTier: "average",
      autonomyDays: 1,
      controllerType: "mppt",
      batteryChemistry: "lifepo4",
    },
    cohortLabel:
      "boat-rated LiFePO4 power stations in the 1–5 kWh cruiser band (with an AC inverter)",
    cohortHeadlineCount: 246,
    cohortShortlistCount: 79,
    picks: [
      {
        kitSlug: "ecoflow-delta2max-400w",
        label: "Best all-round for a cruiser",
        rationale:
          "The balanced pick for coastal cruising: {p1.storageWh} rides a night of fridge-plus-Starlink with margin, and the bundled 400W panel refills it on a sunny afternoon at anchor. At {p1.costPerWh} it's honest value, and the flat form factor stows in a lazarette without a marine-electrician install. For most weekend-to-coastal boats, this is the one.",
        cta: true,
      },
      {
        kitSlug: "jackery-2000plus-4085wh-2x200w",
        label: "Liveaboard / biggest bank",
        rationale:
          "The most storage in the group at {p2.storageWh}, with two 200W panels included — enough to carry a fridge, Starlink, and nav electronics through a cloudy night and still have reserve. At {p2.costPerWh} it's the pick for a liveaboard or a longer passage where you can't count on daily sun, and it expands if your loads grow.",
      },
      {
        kitSlug: "ecoflow-delta2-220w",
        label: "Cheapest way in (weekender)",
        rationale:
          "At {p3.listedPrice} — the lowest entry price here — {p3.storageWh} and a 220W panel cover a weekender's fridge and lights with a phone-and-Starlink top-up. It won't ride a 24/7 Starlink liveaboard load, but for coastal hops where you run the engine daily anyway, it's the cheapest honest start.",
      },
      {
        kitSlug: "anker-4kw-anker-solix-c2000-gen-2-main-unit-only",
        label: "Best value if you already have marine panels",
        rationale:
          "{p4.storageWh} at {p4.costPerWh} — the lowest cost-per-watt-hour on the board — as a main-unit-only bank. If your boat already has deck or arch solar with its own controller, this is the cheapest way to add real LiFePO4 storage; pair it with your existing marine panels rather than paying for a bundled one.",
      },
      {
        kitSlug: "anker-2400w-anker-solix-f3000-main-unit-only",
        label: "Room to grow / expandable",
        rationale:
          "{p5.storageWh} at {p5.costPerWh} on a bank that expands past 12kWh — the pick if you're outfitting a boat you'll add loads to (watermaker, more refrigeration, induction). Main-unit-only, so add marine-rated panels to taste. More headroom than the cruiser picks without jumping to a liveaboard price.",
      },
    ],
    receiptMode: "autonomy",
    effectiveLoadWatts: 130,
    receiptNote:
      "These are complete power stations — **required missing-parts cost is [[const:$0]]** — but a boat adds a few marine realities the box doesn't: **secure mounting** for a seaway (a power station that slides in a knockdown is a hazard), **corrosion-aware placement** away from salt spray and bilge damp, and, if you want to charge underway, a **DC-DC or shore-charge path** (≈[[const:$100–$300]]). The receipt below is about **hours on the hook**, not hidden cost — how long your bank rides the overnight draw before the sun or the engine puts it back.",
    sections: [
      {
        heading: "The load profile: a boat is beaten by what never turns off",
        body: `On a boat, **peak watts barely matter** — few marine loads are big. What drains you is the **24/7 draw at anchor**:

- **The fridge/freezer** is the classic boat killer: it **cycles around the clock**, surges 3–5× on the compressor, and works harder in a hot cabin or warm water — quietly the biggest single consumer on most boats.
- **Starlink at anchor** changed the math. A steady **75–100W, all night**, is ~1.8–2.4kWh a day that older boats never had to plan for. Add the fridge and a quiet night on the hook is **2.5–3.5kWh** with no shore power and limited deck solar.

The rule that follows: size the **battery to ride the night** and the **panels to refill it by afternoon**, and use LiFePO4 for the deep discharge and the weight savings over lead. Size your exact boat with the [load calculator](/calculator).`,
      },
      {
        heading: "The verdict: storage that rides the night, panels that refill by day",
        body: `Our failure engine flags two loads that decide a boat's system:

> **Fridge/freezer:** compressors surge 3–5× and cycle 24/7; add ~30% in heat — the dominant daily draw on most boats.
> **Starlink (always-on):** a continuous 75–100W that runs ~1.8–2.4kWh/day whether you're using it or not — plan for it as a base load, not an accessory.

Together they mean the number that matters is **overnight watt-hours**, not inverter size. A boat rarely needs more than a 2,000–3,000W inverter, but it always needs enough **storage** to get from sunset to a productive solar afternoon — and enough **panel** to actually refill the bank before the next night. That's why this cohort filters on the 1–5kWh cruiser band and rewards bundled solar. See [how the methodology works](/methodology) and the [inverters & power conversion](/learn/inverters-and-power-conversion) explainer.`,
      },
      {
        heading: "The 5 that carry a boat",
        body: `All five are **LiFePO4 and pure sine** and boat-rated in our data. The podium ranks by **overnight capacity against value**: the {p1.storageWh} EcoFlow leads as the balanced cruiser pick, the {p2.storageWh} Jackery carries the most for a liveaboard, and the {p3.listedPrice} EcoFlow is the cheapest way in. The single buy link sits on the #1 pick. Each kit name links to its full audit with real build cost and 6-month price history.

Match the bank to how you cruise: coastal hoppers who run the engine daily can size down; liveaboards running Starlink and refrigeration 24/7 should size up to the biggest bank. Compare any [head-to-head](/compare) or browse the full [portable power](/portable-power) pool.`,
      },
      {
        heading: "Marine reality: mounting, charging, and salt",
        body: `A power station on a boat isn't a power station in a garage:

- **Mount it for a seaway.** Anything that can slide across the cabin in a knockdown is a hazard — strap or bracket it low and central. This is the step the product photos never show.
- **Plan the recharge, not just the discharge.** Deck or arch solar refills the bank by day; add a **DC-DC charger or a shore-power path** (≈[[const:$100–$300]]) if you want to top up from the engine alternator or a marina.
- **Respect salt and damp.** Keep the unit out of direct spray and away from bilge humidity; corrosion is the quiet killer of marine electronics.

Re-check your overnight numbers in the [calculator](/calculator) with your real fridge and Starlink hours, and see [data sources](/data-sources) for where kit prices come from.`,
      },
    ],
    whyWon: [
      "Every pick is pure-sine LiFePO4, boat-rated, and sized to ride a real overnight fridge-plus-Starlink draw — the metric that actually decides a marine system, not peak inverter watts.",
      "The podium spans how people actually cruise — a cheapest weekender, a balanced coastal all-rounder, a liveaboard bank, and two main-unit-only options for boats that already have deck solar.",
      "Specs, prices, and 6-month price trends are pulled from live data, and the verdict is anchored to the two sourced 24/7 loads (fridge cycling, always-on Starlink) a generic marine blog hand-waves.",
    ],
    whyFailed: [
      "Sizing for peak watts instead of overnight watt-hours — a boat's fridge and Starlink drain the bank between sunset and a good solar afternoon, and undersized storage dies in the dark.",
      "Forgetting Starlink is a 24/7 base load, not an accessory — it silently adds ~1.8–2.4kWh a day that older boat systems never planned for.",
      "We cut sub-1kWh units (too little to ride a night) and lead-acid or DC-only records that either weigh too much or can't run AC marine loads.",
    ],
    faqs: [
      {
        question: "What size solar system do I need for a boat with a fridge and Starlink?",
        answer:
          "Plan for the overnight draw, not peak watts. A marine fridge plus Starlink at anchor runs about 2.5–3.5kWh a day, so most cruisers want 2–4kWh of LiFePO4 storage and enough deck solar (300–600W) to refill it by afternoon. Liveaboards running both 24/7 should size to the top of that range or beyond.",
      },
      {
        question: "How much power does Starlink use on a boat?",
        answer:
          "A steady 75–100W whenever it's on — roughly 1.8–2.4kWh a day if you leave it running at anchor. That makes it a base load to plan around, not an accessory: on many boats Starlink and the fridge together are the two biggest consumers of the house bank.",
      },
      {
        question: "Do I need a special marine solar kit for a boat?",
        answer:
          "The battery and inverter don't have to be marine-specific — a quality LiFePO4 power station works well — but the installation does: mount it securely for a seaway, keep it away from salt spray and bilge damp, and plan a recharge path (deck solar plus an optional DC-DC or shore charger). Marine-rated flexible panels are worth it for curved decks.",
      },
    ],
    claims: [
      { pick: "p2", metric: "storageWh", direction: "highest", note: "#2 biggest bank / liveaboard" },
      { pick: "p3", metric: "listedPrice", direction: "lowest", note: "#3 cheapest entry" },
      { pick: "p4", metric: "costPerWh", direction: "lowest", note: "#4 lowest $/Wh in the podium" },
    ],
    publishedAt: "2026-07-03T00:00:00Z",
    updatedAt: "2026-07-03T00:00:00Z",
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
