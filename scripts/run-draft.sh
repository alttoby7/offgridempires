#!/bin/bash
# OffGridEmpire — auto-draft the weekly paragraph (runs Monday via cron).
# Drafts from real drops, commits + pushes the file, and emails the owner for
# review. The Tuesday run-weekly.sh send uses whatever is in the file by then,
# so an owner edit before Tuesday overrides the draft.

set -euo pipefail

REPO_DIR="${REPO_DIR:-/opt/offgridempire/repo}"
ENV_FILE="${ENV_FILE:-/opt/offgridempire/.env}"
LOG_PREFIX="[$(date -u +%Y-%m-%dT%H:%M:%SZ)]"

echo "${LOG_PREFIX} OGE weekly-paragraph auto-draft start"
[ -f "$ENV_FILE" ] && { set -a; source "$ENV_FILE"; set +a; }
cd "$REPO_DIR"
git pull --ff-only || { echo "${LOG_PREFIX} git pull failed; skipping"; exit 1; }

npx tsx scripts/draft-weekly-paragraph.ts

git add data/weekly-paragraph.md 2>/dev/null || true
if git diff --cached --quiet; then
  echo "${LOG_PREFIX} paragraph unchanged."
else
  git commit -m "weekly: auto-drafted paragraph $(date -u +%Y-%m-%d)" || true
  git push || echo "${LOG_PREFIX} WARNING: git push failed"
fi
echo "${LOG_PREFIX} auto-draft complete"
