#!/usr/bin/env bash
# Fail if the git tree contains paths that must not ship on GitHub (run before push).
set -euo pipefail
cd "$(dirname "$0")"

fail() { echo "verify-publish-tree: $*" >&2; exit 1; }
warn() { echo "verify-publish-tree: warning: $*" >&2; }

tracked="$(git ls-files)"

if [[ -z "$tracked" ]]; then
  fail "no tracked files (not a git checkout?)"
fi

# Never publish these if they appear in the index (also listed in .gitignore).
forbidden_patterns=(
  '^install\.sh$'
  '^\.cursor/'
  '^\.toolbox-versions/'
  '^scripts/'
  '^callsign-allocations\.json$'
  'todocoleccion'
  'importamatic'
  'laptop_homelab'
  'server_homelab'
  'server_deploy'
  '^\.env'
)

while IFS= read -r path; do
  [[ -z "$path" ]] && continue
  for pat in "${forbidden_patterns[@]}"; do
    if [[ "$path" =~ $pat ]]; then
      fail "forbidden tracked path: $path (matches /$pat/)"
    fi
  done
done <<< "$tracked"

# Root should only carry plugin + project meta (not random exports).
allowed_root_re='^(\.gitignore|CHANGELOG\.md|LICENSE|README\.md|RELEASE_CHECKLIST\.md|publish-main\.sh|verify-publish-tree\.sh|toolbox\.js|toolbox\.css)$'
while IFS= read -r path; do
  [[ "$path" == */* ]] && continue
  if [[ ! "$path" =~ $allowed_root_re ]]; then
    fail "unexpected file at repo root (move under docs/ or tools/): $path"
  fi
done <<< "$tracked"

# Python/shell helpers belong under tools/, not repo root.
while IFS= read -r path; do
  case "$path" in
    *.py|*.sh)
      case "$path" in
        publish-main.sh|verify-publish-tree.sh) ;;
        tools/*) ;;
        *) fail "script at repo root belongs under tools/: $path" ;;
      esac
      ;;
  esac
done <<< "$tracked"

# Staged secrets (obvious patterns only; skip this script’s own pattern text).
if git rev-parse --git-dir >/dev/null 2>&1; then
  secret_hits="$(git diff --cached -G '(password|api[_-]?key|secret|BEGIN (RSA |OPENSSH )PRIVATE)' --name-only 2>/dev/null \
    | grep -v '^verify-publish-tree\.sh$' || true)"
  if [[ -n "$secret_hits" ]]; then
    fail "staged diff may contain secrets — review: $secret_hits"
  fi
fi

echo "verify-publish-tree: OK ($(echo "$tracked" | wc -l) tracked paths)"
