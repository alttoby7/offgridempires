# OffGrid Empire — R2 cache bloat cleanup (pickup 2026-05-31)

## TL;DR
The R2 bucket `offgridempire-cache` ballooned to **63.8 GB / 115,124 objects**. Root cause found,
permanent fix applied (lifecycle rule). The one-time manual purge **did not finish** — but it no longer
*needs* to: the lifecycle rule self-cleans the bucket within 72h. Pick up only if you want it instant.

## Why it was 63 GB (diagnosis — DONE)
- Bucket is the OpenNext **ISR incremental cache** (`NEXT_INC_CACHE_R2_BUCKET` binding in `wrangler.jsonc`).
- Every key is `incremental-cache/<BUILD_ID>/<hash>.cache`.
- **A scheduled job rebuilds + redeploys the site every 6 hours (4×/day).** Each rebuild stamps a NEW
  build ID and re-uploads the ENTIRE cache (~451 objects / 0.27 GB) under a fresh prefix. Old prefixes
  are never deleted. 270 prefixes accumulated since 2026-04-05 → 63.8 GB. Only the live build is ever read.
- Evidence: newest 5 prefixes were spaced exactly 6h apart, identical 451 obj / 0.27 GB each.
- Cost was only ~$0.81/mo but growing ~1.08 GB/day forever.

## Fixes
### DONE — permanent fix (the load-bearing one)
- **R2 lifecycle rule `expire-incremental-cache-3d`** added: deletes objects under prefix
  `incremental-cache/` older than **3 days** (maxAge 259200s). Verified live.
- Steady state now: 4 builds/day × 0.27 GB × 3 days ≈ **3.2 GB → inside 10 GB free tier → $0/mo**.
- This alone fixes the cost with no further action. Bucket should be ~3 GB by ~2026-06-03.

### NOT FINISHED — one-time instant purge (optional, cosmetic)
- Goal: delete the 269 stale prefixes now (114,673 obj / 63.5 GB), keep only live build
  **`oDT5tBcVTknjl3413YnCH`** (newest; the live worker writes ISR revalidations back under its own build id,
  so newest = live). Lifecycle rule will do this anyway over 3 days.
- Attempt 1 (2026-05-31) FAILED: used Cloudflare REST single-object `DELETE
  /accounts/{acc}/r2/buckets/offgridempire-cache/objects/{urlencoded-key}` with a 64-thread pool.
  **Cloudflare hard-rate-limits it (HTTP 429).** Only ~4k deleted, ~2k failed, then an unretried 429 on
  the LIST pagination crashed the script. Log: `/tmp/r2-purge.log`.

## To finish the instant purge tomorrow (only if impatient — else lifecycle handles it)
Don't repeat the REST single-delete approach. Use the **R2 S3-compatible `DeleteObjects` bulk API**
(1000 keys/call → ~115 calls instead of 114k). Steps:
1. Mint R2 S3 credentials (dashboard → R2 → Manage API Tokens → Object Read & Write on this bucket),
   or via API. Endpoint: `https://<accountid>.r2.cloudflarestorage.com`.
2. boto3 / aws-cli: list all objects, group by 2nd path segment (build id), keep the prefix with the
   newest `LastModified`, batch the rest into `delete_objects` calls of ≤1000.
3. If you stick with REST single-delete, drop concurrency to ~8–10 AND wrap the LIST loop in retry/backoff.

## Auth / how to talk to this bucket
- Token: central `.env` → `CLOUDFLARE_WORKERS_API_TOKEN` (has R2 read + lifecycle write + object delete).
  Export as `CLOUDFLARE_API_TOKEN` for wrangler. Account id: `CLOUDFLARE_ACCOUNT_ID` (4e99280d...).
- The `mcp__cloudflare__*` tool's own token gets `10000 Authentication error` on R2 — use the curl/REST
  path with the Workers token instead.
- Usage check: `GET /accounts/{acc}/r2/buckets/offgridempire-cache/usage` (note: metrics snapshot, lags ~hours).

## Worth considering (not urgent)
The **6-hourly auto-redeploy is the generator** of all this churn. The lifecycle rule caps the damage, but
if the solar-kit data doesn't actually change 4×/day, throttling that scheduled rebuild to **daily** would
cut build minutes + cache churn 4×. Find the scheduler: check `.github/workflows/` and any cron/n8n job.

## Verify tomorrow
```
cd ~/dev/offgridempires && set -a && source ~/google-drive/0-AI/.env && set +a
curl -s "https://api.cloudflare.com/client/v4/accounts/$CLOUDFLARE_ACCOUNT_ID/r2/buckets/offgridempire-cache/usage" \
  -H "Authorization: Bearer $CLOUDFLARE_WORKERS_API_TOKEN" | python3 -m json.tool
```
Expect payloadSize trending toward ~3 GB as the lifecycle rule fires.
