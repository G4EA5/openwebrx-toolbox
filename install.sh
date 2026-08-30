#!/usr/bin/env bash
# Install Band survey into OpenWebRX+ and back up the user's files first.
set -euo pipefail

SRC="$(cd "$(dirname "$0")" && pwd)"
STAMP="$(date +%Y%m%d-%H%M%S)"
BACKUP_ROOT="${OWRX_BACKUP_DIR:-$HOME/owrx-band-survey-backups}"
BACKUP="$BACKUP_ROOT/$STAMP"

say() { printf '%s\n' "$*"; }
warn() { printf 'NOTE: %s\n' "$*" >&2; }
die() { printf 'ERROR: %s\n' "$*" >&2; exit 1; }

need() {
  [[ -f "$SRC/band_survey.js" && -f "$SRC/band_survey.css" ]] || \
    die "Run this from the band_survey folder (missing band_survey.js or .css)."
}

find_htdocs() {
  if [[ -n "${OWRX_HTDOCS:-}" && -d "$OWRX_HTDOCS" ]]; then
    printf '%s\n' "$OWRX_HTDOCS"
    return 0
  fi
  local cand
  for cand in \
    /usr/lib/python3/dist-packages/htdocs \
    /usr/local/lib/python3/dist-packages/htdocs \
    /opt/openwebrx/htdocs
  do
    if [[ -f "$cand/openwebrx.js" ]]; then
      printf '%s\n' "$cand"
      return 0
    fi
  done
  local found
  found="$(find /usr /opt /home -name openwebrx.js -type f 2>/dev/null | head -n 1 || true)"
  if [[ -n "$found" ]]; then
    dirname "$found"
    return 0
  fi
  return 1
}

copy_if() {
  local from="$1" dest="$2"
  if [[ -e "$from" ]]; then
    mkdir -p "$(dirname "$dest")"
    cp -a "$from" "$dest"
    say "  backed up $from"
    return 0
  fi
  return 1
}

sudo_cp() {
  local from="$1" dest="$2"
  if [[ -w "$(dirname "$dest")" ]] && { [[ ! -e "$dest" ]] || [[ -w "$dest" ]]; }; then
    mkdir -p "$(dirname "$dest")"
    cp -a "$from" "$dest"
  else
    command -v sudo >/dev/null 2>&1 || die "Need write access to $dest (or install sudo)."
    sudo mkdir -p "$(dirname "$dest")"
    sudo cp -a "$from" "$dest"
  fi
}

sudo_mkdir() {
  local d="$1"
  if [[ -d "$d" && -w "$d" ]]; then
    return 0
  fi
  if mkdir -p "$d" 2>/dev/null && [[ -w "$d" ]]; then
    return 0
  fi
  command -v sudo >/dev/null 2>&1 || die "Need write access to $d."
  sudo mkdir -p "$d"
}

append_load_line() {
  local init="$1"
  local tmp
  tmp="$(mktemp)"
  if [[ -f "$init" ]]; then
    if grep -q 'Plugins.load(["'"'"']band_survey["'"'"'])' "$init" || \
       grep -q 'Plugins.load(["'"'"'].*band_survey/band_survey.js["'"'"'])' "$init"; then
      say "init.js already loads band_survey — left as-is."
      rm -f "$tmp"
      return 0
    fi
    if [[ -w "$init" ]]; then
      cat "$init" >"$tmp"
    else
      sudo cat "$init" >"$tmp"
    fi
  else
    cat >"$tmp" <<'EOF'
// OpenWebRX+ receiver plugins — created by band_survey/install.sh
(async () => {
  await Plugins.load("band_survey");
})();
EOF
    sudo_cp "$tmp" "$init"
    rm -f "$tmp"
    say "Created $init with Band survey only."
    return 0
  fi
  cat >>"$tmp" <<'EOF'

// band_survey — added by install.sh (safe extra loader; does not remove your other plugins)
(async () => {
  await Plugins.load("band_survey");
})();
EOF
  sudo_cp "$tmp" "$init"
  rm -f "$tmp"
  say "Appended Plugins.load(\"band_survey\") to init.js."
}

write_restore() {
  local htdocs="$1" init="$2"
  cat >"$BACKUP/RESTORE.txt" <<EOF
Band survey backup — $STAMP
=============================

This folder is a copy of YOUR files from just before Band survey was installed
or updated. The plugin never overwrites this folder.

To restore plugin loading:
  sudo cp init.js $init

To restore a previous Band survey copy (if band_survey.prev exists):
  sudo rm -rf $htdocs/plugins/receiver/band_survey
  sudo cp -a band_survey.prev $htdocs/plugins/receiver/band_survey

To restore yellow server bookmarks (if bookmarks.json exists here):
  sudo cp bookmarks.json /var/lib/openwebrx/bookmarks.json
  sudo chown openwebrx:openwebrx /var/lib/openwebrx/bookmarks.json

To restore settings.json (if present — only if you are sure):
  sudo cp settings.json /var/lib/openwebrx/settings.json
  sudo chown openwebrx:openwebrx /var/lib/openwebrx/settings.json

Blue (browser) bookmarks are not in this folder. Restore those from the
plugin: orange SV → Help → Restore first-run / last backup.

After restoring files, hard-refresh the receiver (Ctrl+Shift+R).
Raspberry Pi images: sudo systemctl restart varnish nginx
EOF
}

check_only() {
  say "Band survey — install check (no files written)"
  local htdocs init dest
  htdocs="$(find_htdocs)" || die "Could not find OpenWebRX+ htdocs (no openwebrx.js).
Set it yourself:
  export OWRX_HTDOCS=/path/to/htdocs
  ./install.sh --check"
  say "htdocs: $htdocs"
  [[ -f "$htdocs/openwebrx.js" ]] || die "$htdocs has no openwebrx.js"
  if [[ -f "$htdocs/plugins.js" ]]; then
    say "OK  plugins.js — this looks like OpenWebRX+"
  else
    warn "plugins.js missing — vanilla OpenWebRX cannot load plugins."
  fi
  dest="$htdocs/plugins/receiver/band_survey"
  init="$htdocs/plugins/receiver/init.js"
  if [[ -f "$dest/band_survey.js" && -f "$dest/band_survey.css" ]]; then
    say "OK  plugin files in $dest"
  else
    die "Plugin files missing in $dest — run ./install.sh from this folder."
  fi
  if [[ -f "$init" ]] && grep -q 'Plugins.load(["'"'"']band_survey["'"'"'])' "$init"; then
    say "OK  init.js loads band_survey"
  else
    die "init.js does not load band_survey. Run ./install.sh (it appends one line and does not remove your other plugins)."
  fi
  if command -v systemctl >/dev/null 2>&1 && systemctl is-active --quiet varnish 2>/dev/null; then
    warn "Varnish is running. After install: sudo systemctl restart varnish nginx"
  fi
  say ""
  say "Next: open the receiver page, hard-refresh (Ctrl+Shift+R), click orange SV, then Check install."
  exit 0
}

need
if [[ "${1:-}" == "--check" || "${1:-}" == "check" ]]; then
  check_only
fi
say "Band survey installer"
say "Plugin source: $SRC"

HTDOCS="$(find_htdocs)" || die "Could not find OpenWebRX+ htdocs (no openwebrx.js).
Set it yourself and re-run:
  export OWRX_HTDOCS=/path/to/htdocs
  ./install.sh
Typical paths:
  /usr/lib/python3/dist-packages/htdocs
  /opt/openwebrx/htdocs"
say "Found htdocs: $HTDOCS"

[[ -f "$HTDOCS/openwebrx.js" ]] || die "$HTDOCS does not look like OpenWebRX+ (no openwebrx.js)."
if [[ ! -f "$HTDOCS/plugins.js" ]]; then
  warn "plugins.js is missing. This may be vanilla OpenWebRX, which cannot load plugins."
  warn "Continue only if you know this is OpenWebRX+."
fi

RX="$HTDOCS/plugins/receiver"
INIT="$RX/init.js"
DEST="$RX/band_survey"

mkdir -p "$BACKUP"
say "Backup folder: $BACKUP"
copy_if "$INIT" "$BACKUP/init.js" || say "  (no init.js yet — that is OK on a first plugin install)"
if [[ -d "$DEST" ]]; then
  copy_if "$DEST" "$BACKUP/band_survey.prev" || true
fi
copy_if /var/lib/openwebrx/bookmarks.json "$BACKUP/bookmarks.json" || \
  warn "Could not read /var/lib/openwebrx/bookmarks.json (permissions). Yellow server bookmarks were not copied. Blue browser bookmarks are still backed up inside the plugin after you open SV."
copy_if /var/lib/openwebrx/settings.json "$BACKUP/settings.json" || \
  warn "Could not read settings.json. Profiles were not copied. That is OK — the plugin does not rewrite settings."
write_restore "$HTDOCS" "$INIT"
say "Wrote $BACKUP/RESTORE.txt"

sudo_mkdir "$RX"
sudo_mkdir "$DEST"
sudo_cp "$SRC/band_survey.js" "$DEST/band_survey.js"
sudo_cp "$SRC/band_survey.css" "$DEST/band_survey.css"
[[ -f "$SRC/README.md" ]] && sudo_cp "$SRC/README.md" "$DEST/README.md" || true
[[ -f "$SRC/LICENSE" ]] && sudo_cp "$SRC/LICENSE" "$DEST/LICENSE" || true
[[ -f "$SRC/install.sh" ]] && sudo_cp "$SRC/install.sh" "$DEST/install.sh" || true
say "Copied plugin into $DEST"

append_load_line "$INIT"

say ""
if [[ -f "$DEST/band_survey.js" && -f "$DEST/band_survey.css" ]]; then
  say "OK  plugin files copied"
else
  die "Copy failed — $DEST is missing band_survey.js or .css"
fi
if grep -q 'Plugins.load(["'"'"']band_survey["'"'"'])' "$INIT"; then
  say "OK  init.js loads band_survey"
else
  warn "init.js may not load band_survey — open $INIT and add: await Plugins.load(\"band_survey\");"
fi
if command -v systemctl >/dev/null 2>&1 && systemctl is-active --quiet varnish 2>/dev/null; then
  warn "Varnish is running. Restart it so browsers see the new files:"
  warn "  sudo systemctl restart varnish nginx"
fi
say ""
say "Install finished."
say "  Backup:  $BACKUP"
say "  Plugin:  $DEST"
say "  Loader:  $INIT"
say ""
say "Next steps:"
say "  1. Hard-refresh the receiver page (Ctrl+Shift+R / Cmd+Shift+R)."
say "     A normal refresh can keep an old plugin file — then SV or Help look missing."
say "  2. Click the orange SV button on the right-hand panel."
say "  3. Click Check install. Green = ready. Red/yellow includes the fix on screen."
say "  Raspberry Pi images: sudo systemctl restart varnish nginx"
say ""
say "To verify later without writing files:  ./install.sh --check"
say "To undo this install, read $BACKUP/RESTORE.txt"
