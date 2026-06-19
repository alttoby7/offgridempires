# Bot Mitigation — 2026-05-21

## Problem
Both offgridempire.com and peptidesnearby.com exhibited ~90% Singapore / direct /
desktop / ~5-second sessions in GA4 — textbook scraper/bot signature.

## What Was Done

### Cloudflare WAF Rules (both zones, ALREADY ACTIVE)
Both zones already had a managed_challenge rule applied on 2026-05-21 targeting
Singapore and China non-verified-bot traffic. Status confirmed active:

- **offgridempire.com** zone `2a0a3f8251be38032810b86157952536`
  - Rule id `7e9f2c1dc95c477d904cbb6e6ea520e5`
  - Expression: `(not cf.client.bot and ip.src.country in {"SG" "CN"})`
  - Action: `managed_challenge`
  - Description: "SG+CN non-verified managed challenge (bot mitigation 2026-05-21)"

- **peptidesnearby.com** zone `daa2faaa834b2f2b3eb6471c9817af3a`
  - Rule id `8fe3a35e88d74e4487731af151504fd1`
  - Expression: `(not cf.client.bot and ip.src.country in {"SG" "CN"})`
  - Action: `managed_challenge`
  - Description: "SG+CN non-verified managed challenge (bot mitigation 2026-05-21)"

The `not cf.client.bot` guard passes verified search/AI crawlers (Googlebot,
GPTBot, etc.) while challenging human-impersonating scrapers.

### Canonical Host — offgridempire.com (www → apex 301)
Apex has 727 sessions vs 27 www sessions; apex is canonical.

**Already implemented in `next.config.ts`** (pre-existing):
```ts
async redirects() {
  return [
    {
      source: "/:path*",
      has: [{ type: "host", value: "www.offgridempire.com" }],
      destination: "https://offgridempire.com/:path*",
      permanent: true,
    },
  ];
}
```
No additional Cloudflare redirect rule needed.

### GA4 Hostname Gating — offgridempire.com
Commit `b1b7c7c` (main, 2026-05-21): `src/app/layout.tsx`

Before: `gtag('config','G-PGP7GKZ3ZT')` fired unconditionally on every host
After: config call wrapped in `if(window.location.hostname==='offgridempire.com')`

This prevents GA4 data collection on `localhost`, `offgridempire.pages.dev`, or
`www.offgridempire.com` (before the 301 completes client-side).

### GA4 Hostname Gating — peptidesnearby.com
Commit `88e3601` (main, 2026-05-21): `src/app/layout.tsx`

Before: `gtag('config','G-JXV379RS99')` fired unconditionally
After: config call wrapped in `if(hostname==='peptidesnearby.com'||hostname==='www.peptidesnearby.com')`

Prevents collection on `peptides-nearby.pages.dev` and localhost.

## Verification Checklist (pull 7 days post-activation, ~2026-05-28)

1. GA4 → Reports → User Acquisition → set date range to last 7 days
2. Add secondary dimension: Country/Region
3. **Singapore share should collapse** from ~90% to <5%
4. **Direct channel share** should drop below 50% (was ~95%)
5. **Average engagement time** should rise from ~5 seconds to >30 seconds
6. Check offgridempire.com: Acquisition → Session source/medium — direct/none
   should no longer dominate
7. If Singapore is still >20% after 7 days, check CF firewall events in the
   Cloudflare dashboard (Security → Events) to verify the rule is triggering

## Token Used
`CLOUDFLARE_WAF_API_TOKEN_ALLZONES` — all-zones WAF Edit token.
DNS-only read used `CLOUDFLARE_DNS_API_TOKEN`.
