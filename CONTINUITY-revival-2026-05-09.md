# OGE Revival Sprint — Pickup 2026-05-10

**Status: Day 1–7 plan shipped in commit `b1b18cc`. CF Workers auto-deploy in flight.**

Plan file: `~/.claude/plans/lets-revive-offgridempire-launch-velvet-horizon.md`
Memory: `~/.claude/projects/-home-trisha-google-drive-0-AI/memory/offgridempires.md` ("Revival Sprint" section)

---

## What you're picking up

Yesterday's diagnosis found the cliff cause: 6 dynamic routes lacked `dynamicParams = false`, so unknown slugs (like old indexed `/kits/ecoflow-delta-2/`) returned **HTTP 200 + `index, follow` + "Not Found" content**. Textbook quality-signal demotion trigger. Fixed in commit `b1b18cc`.

Strategic reframe: OGE is now framed as a niche price-intelligence product (price observations + missing-parts gap receipt), not another affiliate SEO site. Codex pressure-tested and approved.

---

## Verify deploy first (5 min)

```bash
# 1. Confirm GitHub Actions finished
gh run list --repo alttoby7/offgridempires --workflow=deploy.yml --limit=1

# 2. Confirm the cliff fix landed — should now return 404
curl -s -o /dev/null -w "HTTP %{http_code}\n" https://offgridempire.com/kits/ecoflow-delta-2/

# 3. Confirm /this-week page is live
curl -sI https://offgridempire.com/this-week/ | head -3

# 4. Confirm sitemap shows real per-URL lastmod (not all today's date)
curl -s https://offgridempire.com/sitemap.xml | grep -A 1 '/kits/anker-' | head -10
```

Expected: 404 on the orphan kit URL, 200 on `/this-week/`, sitemap lastmod values vary by kit.

---

## Three things to do tomorrow

### 1. Resubmit sitemap to GSC (1 min)
Use `mcp__gsc__submit_sitemap` with `site_url=sc-domain:offgridempire.com` and `sitemap_url=https://offgridempire.com/sitemap.xml`. Then URL-inspect the homepage and `/this-week/` to request indexing.

### 2. Set up the Tuesday cron on the droplet (10 min)
SSH to the OGE droplet and add a weekly cron entry:
```cron
0 13 * * 2  /opt/offgridempire/repo/scripts/run-weekly.sh >> /var/log/offgridempire-weekly.log 2>&1
```
(13:00 UTC Tuesday = 6 AM Mountain — adjust for whatever time you want the digest to land in inboxes.)

The script auto-skips if `data/weekly-paragraph.md` is the placeholder, so it's safe to enable before the first paragraph is written.

### 3. Write the first weekly paragraph (5 min)
Edit `data/weekly-paragraph.md`. Replace the placeholder with one or two real human sentences — what stood out this week, what's unusual about the drops, anything to ignore. Keep it under 80 words. Examples of what works:

> "Anker's F3800 PLUS bundles dropped hard this week — likely cycling through pre-summer inventory before the new model. The 7,680Wh dual-kit hit 28% off, the deepest cut we've seen on that SKU since tracking began. Renogy's 600W premium kit also looks suspiciously good at 66% off — verify the retailer's checkout price before you act."

Commit and push. The Tuesday cron will pick it up.

---

## Kill criteria (14 days from `/this-week` going live)

The whole "price-intelligence wedge" thesis falls if:
- Email opt-in rate from `/this-week` qualified visits is **< 8%**, OR
- Zero per-kit alert signups attributable to the page, OR
- No replies / no engagement signals at all

If those flip, abandon the moat play and go back to a pure SEO content playbook (likely starting with KD<30 cluster pages from the 1,156-page topical map). Don't double down on this if the data isn't earning subscribers.

If the falsifier passes, next moves are listed in the plan file under "Open Questions Deferred":
- Reddit transparent bot (only if r/SolarDIY mods approve a mock post via modmail first)
- Watchlist primitive (deferred from Day 6)
- True-cost calculator (only after battery calc usage data justifies the assumption surface)
- B2B data licensing (needs ≥10x kit coverage and inbound asks)

---

## What's automated end-to-end

- **Every 6h:** pipeline ingests prices → exports to `kits.json` → `check-alerts.py` fires Resend transactional emails to per-kit subscribers → commits + pushes → CF Workers redeploys
- **Tuesday once cron is set:** `run-weekly.sh` generates snapshot → sends digest via Resend → commits archive snapshot → CF Workers redeploys (so the new `/this-week/archive/YYYY-MM-DD/` page goes live)

Nothing requires manual intervention except writing the weekly paragraph.

---

## Files to know

**The two surfaces:**
- `src/app/this-week/page.tsx` — falsifier
- `src/app/this-week/archive/[date]/page.tsx` — permanent issue URLs

**The data layer:**
- `src/lib/price-drops.ts` — `getTopPriceDrops()` is the single source of truth for what counts as a "drop"
- `src/lib/data/kits.json` — 435 kits, refreshed every 6h
- `public/data/weekly-archive/` — Tuesday snapshots, committed by `run-weekly.sh`

**The automation:**
- `scripts/check-alerts.py` — already wired in `run-pipeline.sh`
- `scripts/snapshot-weekly.ts` — generates Tuesday snapshot
- `scripts/send-weekly-index.py` — sends Tuesday digest, skips if paragraph is placeholder
- `scripts/run-weekly.sh` — Tuesday cron entry point
- `data/weekly-paragraph.md` — the human-paragraph file

**The audits (review-only):**
- `reports/kit-data-quality.json` — 97/435 flagged, 81 high-severity already excluded from static build. Don't auto-noindex anything; revisit after recrawl evidence comes back.

---

## Diagnostic facts to remember

- Pre-cliff peak was 133 impressions/day, position avg ~16 — site was ranking but not getting clicked. The 14-day SEO sprint shipped pre-cliff (KitProseBlocks on 419 kits, 4 demand-matched hubs, snippet hygiene) — it never got measured before the cliff cut it off.
- Pre-cliff queries were almost entirely branded SKU ("bluetti", "ecoflow", "anker"). Site has no proven non-branded organic traction.
- 81 kits have `listedPrice <= 0` and are excluded from `generateStaticParams` — so they don't have static pages. Day 1's `dynamicParams = false` ensures Google sees real 404s for any of them that were once indexed.
- `next.config.ts` has `output: "standalone"` — required for opennextjs-cloudflare per memory.
