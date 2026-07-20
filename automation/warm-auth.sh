#!/usr/bin/env bash
# ===========================================================================
# MdS Websites — auth warm-up
# ---------------------------------------------------------------------------
# Runs a few minutes before generate-draft.sh. Sends a trivial prompt through
# the Claude Code CLI so any stale OAuth session token gets refreshed ahead of
# time, instead of the real content-generation run hitting a cold/expired
# token and failing outright (this is what happened on 2026-07-17).
# ===========================================================================
set -uo pipefail

export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:$HOME/.npm-global/bin:$HOME/.claude/local:$PATH"

REPO="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO" || { echo "Repo not found: $REPO"; exit 1; }

mkdir -p automation/logs
STAMP="$(date +%Y-%m-%d_%H%M)"
LOGFILE="automation/logs/${STAMP}_warmup.log"
exec > >(tee -a "$LOGFILE") 2>&1

echo "================ warmup $STAMP ================"

for attempt in 1 2 3; do
  OUTPUT="$(claude -p "Reply with the single word OK." --dangerously-skip-permissions 2>&1)"
  echo "$OUTPUT"
  if ! echo "$OUTPUT" | grep -q "authentication_error"; then
    echo "Auth warm and working."
    break
  fi
  echo "Attempt $attempt still cold — waiting 60s and retrying..."
  sleep 60
done

echo "================ done $STAMP ================"
