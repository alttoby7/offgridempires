#!/bin/bash
# OffGridEmpire weekly digest — runs Tuesday morning via cron on droplet.
# 1. Pull latest code
# 2. Generate this week's snapshot (writes public/data/weekly-archive/YYYY-MM-DD.json)
# 3. Send the digest email to subscribers (skips if paragraph is empty/placeholder)
# 4. Commit + push the archive snapshot (so the public archive page picks it up)

set -euo pipefail

REPO_DIR="${REPO_DIR:-/opt/offgridempire/repo}"
ENV_FILE="${ENV_FILE:-/opt/offgridempire/.env}"
LOG_PREFIX="[$(date -u +%Y-%m-%dT%H:%M:%SZ)]"

echo "============================================================"
echo "${LOG_PREFIX} OffGridEmpire Weekly Digest Start"
echo "============================================================"

if [ -f "$ENV_FILE" ]; then
  set -a
  source "$ENV_FILE"
  set +a
fi

cd "$REPO_DIR"

echo "${LOG_PREFIX} Pulling latest code..."
git pull --ff-only || {
  echo "${LOG_PREFIX} ERROR: git pull failed (diverged?). Skipping this run."
  exit 1
}

echo "${LOG_PREFIX} Generating weekly snapshot..."
npx tsx scripts/snapshot-weekly.ts

echo "${LOG_PREFIX} Sending weekly digest..."
python3 scripts/send-weekly-index.py

# Commit the snapshot so the public archive page picks it up
git add public/data/weekly-archive/ data/weekly-paragraph.md 2>/dev/null || true
if git diff --cached --quiet; then
  echo "${LOG_PREFIX} No archive changes to commit."
else
  TODAY=$(date -u +%Y-%m-%d)
  git commit -m "weekly: archive snapshot $TODAY" || true
  git push || echo "${LOG_PREFIX} WARNING: git push failed"
fi

echo "============================================================"
echo "${LOG_PREFIX} Weekly Digest Complete"
echo "============================================================"
