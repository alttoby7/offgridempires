# OffGrid Empire — Reinvention Pickup (2026-06-01)

**Read first:** strategy/build plan = `~/.claude/plans/rosy-beaming-ocean.md`. Memory =
`project-offgridempire-reinvention-2026-06.md`. This doc is the session pickup.

## ⏭️ TOMORROW'S PRIORITY (new chat): run the page pruning

**Why:** the domain was demoted as a thin programmatic affiliate catalog. The build generates
**452 HTML pages**, of which **197 are indexable (in sitemap): 107 `/kits/` + 90 non-kit**. The
other ~250 kit pages are already `noindex,follow` (May variant-consolidation). Even 197 — with 107
thin kit pages — is too many for the new "small, high-quality surface" model. HCU recovery = subtraction.

**Key distinction:** the kit **data** (439 kits w/ BOM in `src/lib/data/kits.json`) is the asset —
it powers the planner + recommended-system BOM. The kit **pages** are the liability. We can gut the
indexable page count WITHOUT losing any planner capability.

**Tier 1 — SAFE, reversible, do this first (no redirects, just `robots` meta):**
- Today indexability = `isPrimaryVariant(slug)` only (→ 107 indexed kit pages). Add a **quality
  gate** on top: only index a kit page if it's substantive — e.g. `completeness >= threshold`,
  has populated `panelWatts/storageWh/inverterWatts`, a real `items[]` BOM, and `listedPrice > 0`.
  Expected to cut indexable kit pages **107 → ~30–40**.
- Files: `src/lib/get-kits.ts` (`isPrimaryVariant`, `getPrimaryKitSlugs` ~L483–490),
  `src/app/kits/[slug]/page.tsx` (robots logic ~L49–57), `scripts/generate-sitemap.ts` (filters to
  primaries — apply the same gate so sitemap shrinks too).
- Also **audit the 31 brand pages + 14 learn pages** for thinness; noindex the weak ones.
- Verify: sitemap URL count drops; `npm run build` green; then resubmit sitemap via GSC MCP.

**Tier 2 — DEFER (riskier):** actual 301/delete of dead kit pages. Hold until the moat + verdict
pages prove out (codex's call). Bulk redirects on a ~0-traffic domain can make things worse.

**First step tomorrow:** quantify how many of the 107 primaries are thin (count by completeness /
populated specs / BOM) → pick the threshold → implement the gate → rebuild → resubmit sitemap.

## ✅ DONE TODAY (Steps 1–3) — ALL UNCOMMITTED in working tree

**Nothing is committed.** `git status` will show the changes below. Commit Steps 1–3 as a checkpoint
when ready (owner hasn't been asked yet).

- **Step 1 — measurement:** marked `affiliate_click`, `newsletter_subscribe`, `alert_subscribe`
  as **GA4 key events** (property `529479437`) via ga4-admin MCP. Events already fired; they just
  weren't conversions. Deliberately did NOT mark `calc_complete` (engagement, not conversion).
- **Step 2 — verdict engine (the moat):**
  - `src/lib/calculator/types.ts` — new `Verdict` type.
  - `src/lib/calculator/failure-notes.ts` — **14 curated real-world failure patterns** (well pump
    inrush, AC soft-start, fridge/freezer surge, microwave real draw, resistive-heat blowout,
    tankless, EV, Starlink-as-biggest-load, CPAP/oxygen, etc.).
  - `src/lib/calculator/verdicts.ts` — rules engine (surge headroom, low autonomy on critical
    loads, AGM penalty) blended w/ the notes; dedupes, sorts blocker→warning, "ok" fallback.
  - `src/components/calculator/verdict-list.tsx` — shared presentational `VerdictCard`/`VerdictList`.
  - `src/components/calculator/step-results.tsx` — "Will this actually work?" panel up top.
- **Step 3 — RV + Cabin verdict pages:** `src/app/best-for/[usecase]/page.tsx` rewritten — `rv` +
  `cabin` now render a `PlannedSystemLayout` (painful-load H1 → honest verdict → sized system +
  recommended kit + **BOM with affiliate buy CTA** → planner deep-link → honest shortlist). Other
  4 use-cases keep the legacy `KitListLayout`. Verified: cabin renders the well-pump blocker + BOM.
- **Tag-leak fixes (Step 1/5):** `src/lib/affiliate.ts` default tag was `fidohikes-20`; ALSO found
  a 2nd hardcoded `fidohikes-20` in `src/components/ui/bom-table.tsx` → both now route through the
  central `buildAffiliateUrl`. ⚠️ **STILL `fidohikes-20` until owner provides a real OGE tag.**

Build status: `npx tsc --noEmit` clean; full `npm run build` green (452 pages).

## 🚧 OWNER ACTION ITEMS
- **Create a dedicated Amazon Associates tracking ID** (e.g. `offgridempire-20`) — there is NO OGE
  tag today (`.env` OFFGRID_AMAZON_PARTNER_TAG + NEXT_PUBLIC_AMAZON_AFFILIATE_TAG both = fidohikes-20,
  and CI `deploy.yml` doesn't inject it → prod leaks to FidoHikes). Then wire into `.env` + CI.
- Apply to the 5–12% direct affiliate programs (EcoFlow/Jackery/Shop Solar Kits/Signature Solar/Renogy).

## REMAINING (after pruning)
- Step 4 — homepage reposition (copy-hygiene): lead with planner+verdict, demote "browse the kits
  we audit" framing in `src/app/page.tsx`.
- Step 5 — broader BOM/retailer affiliate wiring (retailer-listings.tsx uses raw sourceUrl, no tag);
  set the real OGE tag once owner provides it.
- Step 6 — distribution (Reddit r/SolarDIY etc. via `scripts/reddit-finder.py`).
- No go/no-go, no kill date — iterate until an angle works.
