#!/bin/bash
# OffGridEmpire automated pipeline — runs every 6 hours via cron
# 1. Pull latest code
# 2. Run price ingestion (Amazon + Shop Solar)
# 3. Export DB → JSON
# 4. Commit + push if prices changed → triggers Cloudflare Workers deploy via GitHub Actions

set -euo pipefail

REPO_DIR="/opt/offgridempire/repo"
ENV_FILE="/opt/offgridempire/.env"
LOG_PREFIX="[$(date -u +%Y-%m-%dT%H:%M:%SZ)]"

echo "============================================================"
echo "${LOG_PREFIX} OffGridEmpire Pipeline Start"
echo "============================================================"

# Load env vars (DB URL, Amazon credentials, etc.)
if [ -f "$ENV_FILE" ]; then
  set -a
  source "$ENV_FILE"
  set +a
fi

cd "$REPO_DIR"

# Pull latest code (fast-forward only, no merge commits)
echo "${LOG_PREFIX} Pulling latest code..."
git pull --ff-only || {
  echo "${LOG_PREFIX} ERROR: git pull failed (diverged?). Skipping this run."
  exit 1
}

# Health record (public/data/health.json, served at /data/health.json). One
# object per run: ingester exit codes + "Done! N succeeded, M failed" counts,
# export result, commit. Committed with the prices so a fresh record on the
# live site proves the whole source-to-live cycle; .github/workflows/
# health-watchdog.yml fails when it goes stale or red.
HEALTH_FILE="public/data/health.json"
HEALTH_INGESTERS=""

# run_ingester <name> <cmd...>: run, log, and record exit + counts.
run_ingester() {
  local name="$1"; shift
  local out; out=$(mktemp)
  local code=0
  "$@" 2>&1 | tee "$out" || code=${PIPESTATUS[0]}
  local ok fail
  ok=$(grep -oE '[Dd]one[!:] [0-9]+ succeeded' "$out" | tail -1 | grep -oE '[0-9]+' || echo 0)
  fail=$(grep -oE '[0-9]+ failed' "$out" | tail -1 | grep -oE '[0-9]+' || echo 0)
  rm -f "$out"
  [ "$code" = "0" ] || echo "${LOG_PREFIX} WARNING: ${name} ingestion exited ${code}"
  HEALTH_INGESTERS="${HEALTH_INGESTERS}${HEALTH_INGESTERS:+,}\"${name}\":{\"exit\":${code},\"succeeded\":${ok:-0},\"failed\":${fail:-0}}"
}

# Run ingestion scripts
echo "${LOG_PREFIX} Running Amazon ingestion..."
run_ingester amazon python3 scripts/ingest-amazon.py

echo "${LOG_PREFIX} Running Shop Solar ingestion..."
run_ingester shopsolar python3 scripts/ingest-shopsolar.py --new-kits

echo "${LOG_PREFIX} Running Brand Direct ingestion..."
run_ingester brand_direct python3 scripts/ingest-brand-direct.py --all

write_health() {
  local export_ok="$1"
  mkdir -p "$(dirname "$HEALTH_FILE")"
  printf '{"generated_at":"%s","export_ok":%s,"ingesters":{%s},"code_commit":"%s"}\n' \
    "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$export_ok" "$HEALTH_INGESTERS" "$(git rev-parse --short HEAD)" > "$HEALTH_FILE"
}

# Export DB → JSON files
echo "${LOG_PREFIX} Exporting data from DB..."
npx tsx scripts/export-data.ts || {
  echo "${LOG_PREFIX} ERROR: Export failed. Prices not updated."
  write_health false
  git add "$HEALTH_FILE" && git commit -q -m "chore: health record $(date -u +%Y-%m-%d) (export failed)" && git push || true
  exit 1
}
write_health true

# Check for price drops and send alerts
echo "${LOG_PREFIX} Checking price drop alerts..."
python3 scripts/check-alerts.py || echo "${LOG_PREFIX} WARNING: Alert check had errors"

# Check if anything changed
git add src/lib/data/kits.json public/data/history/ "$HEALTH_FILE"
if git diff --cached --quiet; then
  echo "${LOG_PREFIX} Nothing to commit (health record unchanged?). Skipping commit."
  echo "============================================================"
  echo "${LOG_PREFIX} Pipeline Complete (no changes)"
  echo "============================================================"
  exit 0
fi

# Commit and push
DATESTAMP=$(date -u +%Y-%m-%d)
git commit -m "chore: update prices ${DATESTAMP}"
git push

echo "============================================================"
echo "${LOG_PREFIX} Pipeline Complete — prices pushed, deploy triggered"
echo "============================================================"
