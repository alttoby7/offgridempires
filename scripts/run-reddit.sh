#!/bin/bash
# OffGridEmpire — Reddit opportunity-finder (runs daily via cron).
# Read-only: searches solar/off-grid subreddits and emails a digest of threads
# worth a manual reply. Never posts. No repo writes (seen-state lives outside repo).

set -euo pipefail

REPO_DIR="${REPO_DIR:-/opt/offgridempire/repo}"
ENV_FILE="${ENV_FILE:-/opt/offgridempire/.env}"
LOG_PREFIX="[$(date -u +%Y-%m-%dT%H:%M:%SZ)]"

echo "${LOG_PREFIX} OGE Reddit finder start"
[ -f "$ENV_FILE" ] && { set -a; source "$ENV_FILE"; set +a; }
cd "$REPO_DIR"
python3 scripts/reddit-finder.py
echo "${LOG_PREFIX} Reddit finder complete"
