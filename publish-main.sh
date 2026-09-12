#!/usr/bin/env bash
# Publish local main to GitHub (run from repo root).
set -euo pipefail
cd "$(dirname "$0")"
branch="$(git rev-parse --abbrev-ref HEAD)"
if [[ "$branch" != "main" ]]; then
  echo "On $branch — checkout main first or push that branch and open a PR." >&2
  exit 1
fi
git push origin main
echo "Pushed main. Verify: git log -1 --oneline origin/main"
