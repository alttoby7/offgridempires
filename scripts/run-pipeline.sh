#!/bin/bash
# OffGridEmpire automated pipeline — runs every 6 hours via cron
# 1. Pull latest code
# 2. Run price ingestion (Amazon + Shop Solar)
# 3. Export DB → JSON
# 4. Commit + push if prices changed → triggers Cloudflare Pages deploy

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

# Run ingestion scripts
echo "${LOG_PREFIX} Running Amazon ingestion..."
python3 scripts/ingest-amazon.py || echo "${LOG_PREFIX} WARNING: Amazon ingestion had errors"

echo "${LOG_PREFIX} Running Shop Solar ingestion..."
python3 scripts/ingest-shopsolar.py || echo "${LOG_PREFIX} WARNING: Shop Solar ingestion had errors"

# Export DB → JSON files
echo "${LOG_PREFIX} Exporting data from DB..."
npx tsx scripts/export-data.ts || {
  echo "${LOG_PREFIX} ERROR: Export failed. Prices not updated."
  exit 1
}

# Check if anything changed
git add src/lib/data/kits.json public/data/history/
if git diff --cached --quiet; then
  echo "${LOG_PREFIX} No price changes detected. Skipping commit."
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
