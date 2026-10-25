#!/usr/bin/env bash
set -euo pipefail
root="$(cd "$(dirname "$0")/.." && pwd)"
hook="$root/.git/hooks/commit-msg"
cp "$root/.githooks/commit-msg" "$hook"
chmod +x "$hook"
echo "Installed $hook"
