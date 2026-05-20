# OGE Revival v2 — Continuity (2026-05-20)

**Session goal:** decide revive-or-park for OffGridEmpire after the 04/28 GSC cliff; owner chose
**fix it, all fronts**. This session diagnosed, shipped the core fixes, turned the price wedge on,
and built the distribution automation. Plan: `~/.claude/plans/lexical-cooking-ocean.md`.

---

## Diagnosis (CORRECTED — important)

The 04/28 cliff is **NOT a fixable technical regression.** The 2026-05-09 soft-404 fix (`b1b18cc`,
`dynamicParams=false`) is confirmed live (orphan slugs 404) yet impressions stayed flat 1–10/day for
the 11 days after → that theory is **falsified in production**. Real cause = **algorithmic quality
demotion of thin/duplicate programmatic affiliate pages + end of new-site honeymoon.** The site
never earned real clicks (4 in 90 days, 0 at the 133-imp peak) and ranked only for branded SKUs
(ecoflow/anker/bluetti) it can't beat manufacturer + Amazon for. Codex (gpt-5.4) pressure-tested the
fix plan; its calls are baked in.

---

## What shipped THIS session (all pushed to `main`, CI auto-deployed, verified live)

### Phase 1 — Hygiene + the core SEO fix (`280d669`)
- **Variant consolidation:** 354 indexed kit pages → **103 primaries**; the other **251 near-dups
  are `noindex,follow`** and dropped from the sitemap (still rendered/crawlable via VariantPicker).
  - New helpers in `src/lib/get-kits.ts`: `isPrimaryVariant`, `getPrimaryKitSlugs`, `getPrimaryVariantSlug`.
    Primary = base-representative rule (base-config name hint > fewest modifier words > lowest price > slug).
  - `src/app/kits/[slug]/page.tsx` sets `robots:{index:false,follow:true}` when not primary.
  - `scripts/generate-sitemap.ts` filters to primaries.
  - VERIFIED LIVE: primary=`index,follow`, non-primary=`noindex,follow`, sitemap=107 kit URLs.
- **Host canonicalization:** `next.config.ts` 308 www→non-www; **Cloudflare "Always Use HTTPS" ON**
  (set via API with `CLOUDFLARE_DNS_API_TOKEN`). VERIFIED: www→308, http→301.
- Sitemap resubmitted to GSC.

### Phase 2 — Price wedge turned ON
- `data/weekly-paragraph.md` written with a real human paragraph (passes the send gate).
- **Added the missing Tuesday cron** on droplet `n8n-basecamp`: `0 13 * * 2 ...run-weekly.sh`
  (the 05/09 TODO that was never done).
- Subscriber baseline = **1 total, 0 weekly** (effectively zero). Subscribers live in **Supabase**
  `price_alert_subscribers`; droplet env at `/opt/offgridempire/.env` (NOT local pg, which is localhost).

### Phase 3 — `/learn` funnel (`95bb812`, live)
- `src/components/article-renderer.tsx` now ends every article with a NewsletterForm wedge CTA
  ("Track the prices, not the hype" → `__weekly_drops__`, GA4 `newsletter_subscribe`). One change
  covers all 14 + future articles.

### Phase 5 — Distribution (drafts delivered; on-site funnel live via Phase 3)
- Reddit assets (modmail + post) at `Personal/offgridempire/offgridempire.com/DISTRIBUTION-DRAFTS.md`.
- Email-seed to portfolio lists = N/A (no on-topic audience).

### Distribution automation (`499837d`, `e4d68e0`) — full doc: `Personal/offgridempire/offgridempire.com/AUTOMATION.md`
- **RSS feed LIVE:** `scripts/generate-feed.ts` → `offgridempire.com/this-week/feed.xml`. Wired into
  `deploy.yml` (after sitemap) + npm `build`; refreshes every ~6h deploy.
- **Auto-draft paragraph:** `scripts/draft-weekly-paragraph.ts` + `run-draft.sh`, **Mon cron `0 13 * * 1`**.
  Drafts from real drops via Claude (`claude-haiku-4-5`, template fallback), commits/pushes, emails owner.
  `ANTHROPIC_API_KEY` added to droplet .env.
- **Reddit finder:** `scripts/reddit-finder.py` + `run-reddit.sh`, **daily cron `0 14 * * *`**. Read-only
  OAuth search → emails threads + drafted replies for MANUAL posting (no autopost). Smoke-tested (Resend 200).
- **Social fan-out: STAGED** — needs a Bluesky account + n8n workflow (spec in AUTOMATION.md).
- Droplet crons now: pipeline `0 */6 * * *`, weekly `0 13 * * 2`, draft `0 13 * * 1`, reddit `0 14 * * *`.

---

## Go/No-Go: 42-day falsifier (clock from 2026-05-20)

Pass = ANY of:
- **Content:** `/learn` + hubs reach ≥20 non-branded organic clicks OR ≥300 non-branded impressions (trailing 14d).
- **Product:** ≥25 total subscribers OR ≥8% `/this-week` opt-in + ≥10 kit-alert signups (GA4 `newsletter_subscribe`/`alert_subscribe`).
- **Hygiene:** indexed kit URLs trend toward ~103–130 (not 354).

**Day-21 check 2026-06-10** (index contraction — GSC Pages report + sitemap coverage).
**Day-42 go/no-go 2026-07-01.** Miss all three → park. Use sitewide impressions only as context, not the metric.

---

## OWNER ACTION ITEMS

1. **Post the Reddit content** (I can't post; modmail approval FIRST) — drafts in DISTRIBUTION-DRAFTS.md.
2. **Activate Reddit finder:** create a "script" app at reddit.com/prefs/apps → add
   `REDDIT_CLIENT_ID` / `REDDIT_CLIENT_SECRET` / `REDDIT_USER_AGENT` to `/opt/offgridempire/.env`.
   (You'll have a "needs setup" email from the smoke test.)
3. **For social fan-out:** create a free Bluesky account + app password → ping me to wire the n8n workflow.
4. **Weekly:** the Monday auto-draft emails you a paragraph; tweak or let it ride before the Tue 13:00 UTC send.

---

## Remaining work (next sessions)

- **Phase 4 (ongoing 70–80%):** publish KD<30 informational articles via `/offgrid-writer`. **218
  candidates** in `Personal/offgridempire/offgridempire.com/page-plan.csv` (filter `published=false`,
  `avg_difficulty<30`, funnel awareness/consideration). Favor specific `s_*` keywords over broad
  pillars (their low avg_difficulty is cluster-diluted). Hydrate briefs by `page_id`. Start with 3–5,
  cross-linked to the wedge + primary kits.
- **n8n social fan-out** once Bluesky exists.
- **Optional refinement:** point article kit-embeds / `similar-kits` / `kit-article-handoffs` at PRIMARY
  slugs (some currently link to noindexed variants — wastes internal links).

## How to verify / operate
- Redirects: `curl -sIL -A Googlebot http://offgridempire.com/` and `https://www.offgridempire.com/` → 30x to https non-www.
- noindex: fetch a non-primary kit page → `<meta name="robots" content="noindex, follow">`.
- Feed: `curl https://offgridempire.com/this-week/feed.xml`.
- Subscriber count (on droplet): `set -a; source /opt/offgridempire/.env; set +a;` then curl the Supabase
  REST `price_alert_subscribers?select=email&unsubscribed_at=is.null` with `Prefer: count=exact`.
- Logs on droplet: `/var/log/offgridempire-{ingestion,weekly,draft,reddit}.log`.

**Commits this session:** `280d669` (variant+host), `b1ae949` (paragraph), `95bb812` (learn funnel),
`499837d` (automation), `e4d68e0` (gitignore). Memory: `offgridempires.md` "Revival v2" + "automation" sections.
