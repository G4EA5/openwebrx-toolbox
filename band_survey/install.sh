#!/usr/bin/env bash
# Band survey installer for OpenWebRX+
#
#   ./install.sh                 install (personal, backs up first)
#   ./install.sh --public        install for shared/public receivers
#   ./install.sh --check           verify install + write diagnostic report
#   ./install.sh --report          diagnostic report only (no install)
#   ./install.sh --profile TYPE    pi | debian | docker | mac-browser | auto
#
# Reports: ~/owrx-band-survey-reports/band-survey-report-*.txt
# Override: OWRX_HTDOCS=...  OWRX_REPORT_DIR=...  OWRX_BACKUP_DIR=...
set -uo pipefail

SRC="$(cd "$(dirname "$0")" && pwd)"
STAMP="$(date +%Y%m%d-%H%M%S)"
BACKUP_ROOT="${OWRX_BACKUP_DIR:-$HOME/owrx-band-survey-backups}"
REPORT_ROOT="${OWRX_REPORT_DIR:-$HOME/owrx-band-survey-reports}"
BACKUP="$BACKUP_ROOT/$STAMP"
REPORT_FILE="$REPORT_ROOT/band-survey-report-$STAMP.txt"

PUBLIC=0
MODE="install"
PROFILE="${OWRX_PROFILE:-auto}"
WRITE_REPORT=1

# Counters (report)
R_PASS=0
R_WARN=0
R_FAIL=0

say()  { printf '%s\n' "$*"; }
warn() { printf 'NOTE: %s\n' "$*" >&2; }
die()  { printf 'ERROR: %s\n' "$*" >&2; exit 1; }

log_line() {
  printf '%s\n' "$*" >>"$REPORT_FILE"
}

r_ok() {
  R_PASS=$((R_PASS + 1))
  say "OK   $*"
  log_line "OK   $*"
}

r_warn() {
  R_WARN=$((R_WARN + 1))
  say "WARN $*"
  log_line "WARN $*"
}

r_fail() {
  R_FAIL=$((R_FAIL + 1))
  say "FAIL $*"
  log_line "FAIL $*"
}

r_info() {
  say "     $*"
  log_line "     $*"
}

need_src() {
  [[ -f "$SRC/band_survey.js" && -f "$SRC/band_survey.css" ]] || \
    die "Run this from the owrx-band-survey folder (need band_survey.js and band_survey.css next to install.sh)."
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
    /opt/openwebrx/htdocs \
    /var/www/openwebrx/htdocs
  do
    if [[ -f "$cand/openwebrx.js" ]]; then
      printf '%s\n' "$cand"
      return 0
    fi
  done
  local found
  found="$(find /usr /opt /home /var/www -name openwebrx.js -type f 2>/dev/null | head -n 1 || true)"
  if [[ -n "$found" ]]; then
    dirname "$found"
    return 0
  fi
  return 1
}

detect_os_kind() {
  case "$(uname -s 2>/dev/null || echo unknown)" in
    Darwin) printf 'macos\n' ;;
    Linux)  printf 'linux\n' ;;
    *)      printf 'other\n' ;;
  esac
}

detect_pi() {
  if [[ -r /proc/device-tree/model ]] && grep -qi raspberry /proc/device-tree/model 2>/dev/null; then
    return 0
  fi
  if grep -qi raspberry /proc/cpuinfo 2>/dev/null; then
    return 0
  fi
  return 1
}

detect_docker() {
  [[ -f /.dockerenv ]] && return 0
  grep -q docker /proc/1/cgroup 2>/dev/null && return 0
  return 1
}

auto_profile() {
  if detect_docker; then
    printf 'docker\n'
  elif detect_pi; then
    printf 'pi\n'
  elif [[ -f /usr/lib/python3/dist-packages/htdocs/openwebrx.js ]]; then
    printf 'debian\n'
  else
    printf 'auto\n'
  fi
}

profile_label() {
  case "$1" in
    pi)          printf 'Raspberry Pi image\n' ;;
    debian)      printf 'Linux package (Debian/Ubuntu)\n' ;;
    docker)      printf 'Docker / container\n' ;;
    mac-browser) printf 'Browse from Mac/iPad (OpenWebRX on another machine)\n' ;;
    auto)        printf 'Auto-detected\n' ;;
    *)           printf '%s\n' "$1" ;;
  esac
}

pick_profile_interactive() {
  [[ -t 0 ]] || return 0
  say ""
  say "What kind of setup is this? (helps tailor the report and next steps)"
  say "  1) Raspberry Pi SD image"
  say "  2) Linux server (Debian/Ubuntu OpenWebRX+ package)"
  say "  3) Docker container"
  say "  4) I use Safari/Chrome on a Mac (radio is on a Pi or server)"
  say "  5) Not sure — auto-detect"
  say ""
  printf 'Choose [1-5, Enter=5]: '
  read -r choice || choice=""
  case "${choice:-5}" in
    1) PROFILE=pi ;;
    2) PROFILE=debian ;;
    3) PROFILE=docker ;;
    4) PROFILE=mac-browser ;;
    *) PROFILE=auto ;;
  esac
}

plugin_version() {
  local js="$1"
  [[ -f "$js" ]] || return 0
  grep -o '_version = [0-9][0-9]*' "$js" 2>/dev/null | head -n1 | grep -o '[0-9][0-9]*' || true
}

file_digest() {
  local f="$1"
  if command -v md5sum >/dev/null 2>&1; then
    md5sum "$f" 2>/dev/null | awk '{print $1}'
  elif command -v md5 >/dev/null 2>&1; then
    md5 -q "$f" 2>/dev/null || true
  else
    printf 'n/a\n'
  fi
}

readable_file() {
  local f="$1"
  [[ -r "$f" ]]
}

init_loads_band_survey() {
  local init="$1"
  [[ -f "$init" ]] || return 1
  grep -qE 'Plugins\.load\(["'"'"']band_survey["'"'"']\)|Plugins\.load\(["'"'"'][^"'"'"']*band_survey' "$init"
}

svc_state() {
  local u="$1"
  if ! command -v systemctl >/dev/null 2>&1; then
    printf 'systemctl not available\n'
    return
  fi
  systemctl is-active "$u" 2>/dev/null || printf 'inactive\n'
}

guess_openwebrx_url() {
  local port=""
  if [[ -r /var/lib/openwebrx/settings.json ]]; then
    port="$(grep -o '"web_port"[[:space:]]*:[[:space:]]*[0-9]*' /var/lib/openwebrx/settings.json 2>/dev/null | grep -o '[0-9]*$' || true)"
  fi
  [[ -z "$port" ]] && port=8073
  printf 'http://127.0.0.1:%s/\n' "$port"
}

http_probe() {
  local url="$1"
  command -v curl >/dev/null 2>&1 || return 1
  curl -fsS -m 8 -o /dev/null "$url" 2>/dev/null
}

browser_steps() {
  local prof="$1"
  log_line ""
  log_line "=== Browser steps (on the computer that shows the waterfall) ==="
  if [[ "$prof" == "mac-browser" ]] || [[ "$(detect_os_kind)" == "macos" ]]; then
    log_line "You are (or also) on macOS. install.sh only fixes the SERVER copy."
    log_line "On your Mac:"
    log_line "  1. Open the receiver URL (waterfall page), not map-only or admin."
    log_line "  2. Hard refresh: Cmd+Shift+R (Safari: hold Shift, click Reload)."
    log_line "  3. If still no orange SV: try Chrome, or Safari Empty Caches."
    log_line "  4. Private window test rules out extensions blocking scripts."
    log_line "  5. In SV → Help → Copy diagnostic report — paste that if stuck."
  else
    log_line "  1. Open the receiver page (waterfall + band picker)."
    log_line "  2. Hard refresh: Ctrl+Shift+R (Windows/Linux) or Cmd+Shift+R (Mac)."
    log_line "  3. Click orange SV on the right panel → Check install."
    log_line "  4. Help tab → Copy diagnostic report if you need to ask for help."
  fi
}

say_browser_steps() {
  local prof="$1"
  say "On the browser machine:"
  if [[ "$prof" == "mac-browser" ]] || [[ "$(detect_os_kind)" == "macos" ]]; then
    say "  1. Receiver waterfall page (not map-only)"
    say "  2. Cmd+Shift+R hard refresh"
    say "  3. Orange SV → Check install"
    say "  4. Help → Copy diagnostic report if still stuck"
  else
    say "  1. Receiver waterfall page"
    say "  2. Ctrl+Shift+R or Cmd+Shift+R"
    say "  3. Orange SV → Check install"
  fi
}

profile_hints() {
  local prof="$1"
  log_line ""
  log_line "=== Tips for your setup ($(profile_label "$prof")) ==="
  case "$prof" in
    pi)
      log_line "- Pi images often use Varnish. After install or update:"
      log_line "    sudo systemctl restart varnish nginx"
      log_line "- Run install.sh ON the Pi (SSH), not on your Mac."
      log_line "- If Check install is green on server but Mac shows no SV: browser cache (Cmd+Shift+R)."
      ;;
    docker)
      log_line "- Set OWRX_HTDOCS to the htdocs path INSIDE the container or bind-mount."
      log_line "- Example: docker exec -it openwebrx bash, then run install.sh there."
      log_line "- Restart the container after copying files if the image caches static files."
      ;;
    debian)
      log_line "- Typical htdocs: /usr/lib/python3/dist-packages/htdocs"
      log_line "- Restart openwebrx if the package provides a service:"
      log_line "    sudo systemctl restart openwebrx"
      ;;
    mac-browser)
      log_line "- install.sh must succeed on the Pi/server (SSH in first)."
      log_line "- Your Mac never runs OpenWebRX files locally unless you built a dev setup."
      log_line "- ./install.sh --check on the server can still be OK while Mac browser is cached."
      ;;
    *)
      log_line "- Server check OK but no SV button = almost always browser cache or wrong page."
      log_line "- Run ./install.sh --report on the server and send the .txt file when asking for help."
      ;;
  esac
}

write_report_header() {
  mkdir -p "$REPORT_ROOT"
  : >"$REPORT_FILE"
  log_line "Band survey — diagnostic report"
  log_line "Generated: $(date -Iseconds 2>/dev/null || date)"
  log_line "Hostname: $(hostname 2>/dev/null || echo unknown)"
  log_line "User: $(whoami 2>/dev/null || echo unknown)"
  log_line "Install script: $SRC/install.sh"
  log_line "Plugin source: $SRC"
  log_line "Profile: $(profile_label "$PROFILE")"
  log_line ""
}

collect_environment() {
  log_line "=== Environment ==="
  log_line "uname: $(uname -a 2>/dev/null || echo unknown)"
  if [[ -r /etc/os-release ]]; then
    log_line "--- /etc/os-release ---"
    while IFS= read -r line; do log_line "$line"; done < /etc/os-release
  fi
  if detect_pi; then
    r_ok "Hardware looks like Raspberry Pi"
    if [[ -r /proc/device-tree/model ]]; then
      r_info "Model: $(tr -d '\0' </proc/device-tree/model 2>/dev/null)"
    fi
  fi
  if detect_docker; then
    r_warn "Running inside Docker/container — confirm htdocs path is the live mount"
  fi
  if [[ "$(detect_os_kind)" == "macos" ]]; then
    r_warn "This shell is macOS — OpenWebRX+ usually runs on Linux/Pi, not on the Mac"
    r_info "Unless OWRX_HTDOCS points at a real install, run install.sh over SSH on the radio host"
  fi
  log_line ""
}

collect_openwebrx() {
  local htdocs="$1"
  local dest="$htdocs/plugins/receiver/band_survey"
  local init="$htdocs/plugins/receiver/init.js"

  log_line "=== OpenWebRX+ paths ==="
  log_line "htdocs: $htdocs"

  if [[ -f "$htdocs/openwebrx.js" ]]; then
    r_ok "openwebrx.js present ($(wc -c <"$htdocs/openwebrx.js" | tr -d ' ') bytes)"
  else
    r_fail "openwebrx.js missing in htdocs"
  fi

  if [[ -f "$htdocs/plugins.js" ]]; then
    r_ok "plugins.js present — OpenWebRX+ plugin loader"
  else
    r_fail "plugins.js missing — vanilla OpenWebRX cannot load Band survey"
    r_info "Install OpenWebRX+ (luarvique fork), not stock OpenWebRX"
  fi

  if [[ -f "$dest/band_survey.js" && -f "$dest/band_survey.css" ]]; then
    local ver
    ver="$(plugin_version "$dest/band_survey.js")"
    r_ok "Plugin files in $dest (JS v${ver:-unknown})"
    r_info "band_survey.js $(wc -c <"$dest/band_survey.js" | tr -d ' ') bytes md5=$(file_digest "$dest/band_survey.js")"
    r_info "band_survey.css $(wc -c <"$dest/band_survey.css" | tr -d ' ') bytes"
  else
    r_fail "Plugin files missing in $dest — run ./install.sh"
  fi

  local src_ver
  src_ver="$(plugin_version "$SRC/band_survey.js")"
  if [[ -f "$dest/band_survey.js" && -f "$SRC/band_survey.js" ]]; then
    local live_ver
    live_ver="$(plugin_version "$dest/band_survey.js")"
    if [[ -n "$src_ver" && -n "$live_ver" && "$src_ver" != "$live_ver" ]]; then
      r_warn "Installed plugin v$live_ver but this folder has v$src_ver — re-run ./install.sh to update"
    fi
  fi

  if init_loads_band_survey "$init"; then
    r_ok "init.js loads band_survey"
  else
    r_fail "init.js does not load band_survey — run ./install.sh or add: await Plugins.load(\"band_survey\");"
  fi

  if [[ -f "$init" ]]; then
    log_line "--- init.js (first 40 lines) ---"
    head -n 40 "$init" 2>/dev/null | while IFS= read -r line; do log_line "$line"; done || true
  fi

  if [[ -f "$dest/band_survey.js" ]] && grep -q 'BAND_SURVEY_ALLOW_OWNER_OVERRIDE = false' "$dest/band_survey.js"; then
    r_ok "Public mode: Own radio — fast hops locked for visitors"
  elif [[ -f "$dest/band_survey.js" ]]; then
    r_info "Personal mode: owner can tick Own radio — fast hops (use ./install.sh --public on shared sites)"
  fi

  log_line ""
  log_line "=== Services ==="
  if command -v systemctl >/dev/null 2>&1; then
    for u in openwebrx openwebrx-decoder nginx varnish; do
      if systemctl list-unit-files "$u.service" &>/dev/null 2>&1 || systemctl cat "$u.service" &>/dev/null 2>&1; then
        log_line "$u.service: $(svc_state "$u")"
      fi
    done
    if systemctl is-active --quiet varnish 2>/dev/null; then
      r_warn "Varnish is active — restart after updates: sudo systemctl restart varnish nginx"
    fi
  else
    r_info "systemctl not available"
  fi

  log_line ""
  log_line "=== HTTP probe (from this machine) ==="
  local base url
  base="$(guess_openwebrx_url)"
  url="${base}plugins/receiver/band_survey/band_survey.js"
  log_line "Trying: $url"
  if http_probe "$url"; then
    r_ok "HTTP can fetch band_survey.js from local OpenWebRX"
  else
    r_warn "Could not fetch band_survey.js via HTTP (service down, different port, or firewalled)"
    r_info "This does not always mean install failed — browser may still work on LAN"
  fi

  log_line ""
  log_line "=== Permissions ==="
  if [[ -d "$dest" ]]; then
    ls -la "$dest" 2>/dev/null | while IFS= read -r line; do log_line "$line"; done || true
  fi
}

run_diagnostics() {
  write_report_header

  if [[ "$PROFILE" == "auto" ]]; then
    PROFILE="$(auto_profile)"
    r_info "Auto-selected profile: $(profile_label "$PROFILE")"
  fi

  collect_environment

  local htdocs=""
  if htdocs="$(find_htdocs)"; then
    collect_openwebrx "$htdocs"
  else
    r_fail "Could not find OpenWebRX+ htdocs (no openwebrx.js)"
    r_info "Set: export OWRX_HTDOCS=/path/to/htdocs"
    r_info "Docker: run this script inside the container or point OWRX_HTDOCS at the bind mount"
  fi

  profile_hints "$PROFILE"
  browser_steps "$PROFILE"

  log_line ""
  log_line "=== Summary ==="
  log_line "PASS: $R_PASS   WARN: $R_WARN   FAIL: $R_FAIL"
  if [[ "$R_FAIL" -gt 0 ]]; then
    log_line "Result: FIX NEEDED on server — address FAIL lines above, then re-run ./install.sh --check"
  elif [[ "$R_WARN" -gt 0 ]]; then
    log_line "Result: Server install probably OK — if browser still broken, follow Browser steps (cache / wrong page)"
  else
    log_line "Result: Server install looks good — if no SV button, hard-refresh the receiver page on your Mac/PC"
  fi
  log_line ""
  log_line "Send this file when asking for help: $REPORT_FILE"
}

show_report_path() {
  say ""
  say "Full diagnostic report written to:"
  say "  $REPORT_FILE"
  say ""
  say "Email or paste that file if you need help. PASS=$R_PASS WARN=$R_WARN FAIL=$R_FAIL"
}

run_check() {
  say "Band survey — install check (no files changed)"
  say ""
  run_diagnostics
  show_report_path
  if [[ "$R_FAIL" -gt 0 ]]; then
    exit 1
  fi
  exit 0
}

run_report_only() {
  say "Band survey — diagnostic report only"
  say ""
  run_diagnostics
  show_report_path
  exit $([[ "$R_FAIL" -gt 0 ]] && echo 1 || echo 0)
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
    if init_loads_band_survey "$init"; then
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

Diagnostic report from this run (if any):
  $REPORT_FILE

To restore plugin loading:
  sudo cp init.js $init

To restore a previous Band survey copy (if band_survey.prev exists):
  sudo rm -rf $htdocs/plugins/receiver/band_survey
  sudo cp -a band_survey.prev $htdocs/plugins/receiver/band_survey

After restoring files, hard-refresh the receiver (Ctrl+Shift+R / Cmd+Shift+R).
Raspberry Pi images: sudo systemctl restart varnish nginx
EOF
}

run_install() {
  need_src

  if [[ "$PROFILE" == "auto" && -t 0 ]]; then
    pick_profile_interactive
  fi
  if [[ "$PROFILE" == "auto" ]]; then
    PROFILE="$(auto_profile)"
  fi

  say "Band survey installer"
  say "Setup profile: $(profile_label "$PROFILE")"
  if [[ "$PUBLIC" == 1 ]]; then
    say "Mode: public (visitors cannot tick Own radio — fast hops)"
  fi
  say "Plugin source: $SRC"
  say ""

  if [[ "$(detect_os_kind)" == "macos" && -z "${OWRX_HTDOCS:-}" ]]; then
    die "You are on macOS without OWRX_HTDOCS set.
Band survey installs onto the machine that RUNS OpenWebRX+ (usually a Pi or Linux server).

  1. SSH to the Pi/server:  ssh user@your-radio-host
  2. git clone … && cd owrx-band-survey && ./install.sh
  3. On your Mac browser: open the receiver page, Cmd+Shift+R, click orange SV

If you really have OpenWebRX htdocs on this Mac:
  export OWRX_HTDOCS=/path/to/htdocs
  ./install.sh"
  fi

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
  copy_if "$INIT" "$BACKUP/init.js" || say "  (no init.js yet — OK on first plugin install)"
  if [[ -d "$DEST" ]]; then
    copy_if "$DEST" "$BACKUP/band_survey.prev" || true
  fi
  copy_if /var/lib/openwebrx/bookmarks.json "$BACKUP/bookmarks.json" || \
    warn "Could not read /var/lib/openwebrx/bookmarks.json (permissions)."
  copy_if /var/lib/openwebrx/settings.json "$BACKUP/settings.json" || \
    warn "Could not read settings.json (OK — plugin does not rewrite it)."
  write_restore "$HTDOCS" "$INIT"
  say "Wrote $BACKUP/RESTORE.txt"

  sudo_mkdir "$RX"
  sudo_mkdir "$DEST"
  JS_FROM="$SRC/band_survey.js"
  JS_TMP=""
  if [[ "$PUBLIC" == 1 ]]; then
    JS_TMP="$(mktemp)"
    sed 's/var BAND_SURVEY_ALLOW_OWNER_OVERRIDE = true;/var BAND_SURVEY_ALLOW_OWNER_OVERRIDE = false;/' \
      "$SRC/band_survey.js" >"$JS_TMP"
    JS_FROM="$JS_TMP"
  fi
  sudo_cp "$JS_FROM" "$DEST/band_survey.js"
  rm -f "$JS_TMP"
  sudo_cp "$SRC/band_survey.css" "$DEST/band_survey.css"
  [[ -f "$SRC/README.md" ]] && sudo_cp "$SRC/README.md" "$DEST/README.md" || true
  [[ -f "$SRC/LICENSE" ]] && sudo_cp "$SRC/LICENSE" "$DEST/LICENSE" || true
  [[ -f "$SRC/install.sh" ]] && sudo_cp "$SRC/install.sh" "$DEST/install.sh" || true
  chmod +x "$DEST/install.sh" 2>/dev/null || sudo chmod +x "$DEST/install.sh" 2>/dev/null || true
  say "Copied plugin into $DEST"

  append_load_line "$INIT"

  if [[ "$PROFILE" == "pi" ]] || systemctl is-active --quiet varnish 2>/dev/null; then
    if command -v systemctl >/dev/null 2>&1; then
      say "Restarting varnish/nginx (Pi image cache)…"
      sudo systemctl restart varnish nginx 2>/dev/null || warn "Could not restart varnish/nginx — run manually if SV missing in browser"
    fi
  fi

  if [[ "$WRITE_REPORT" == 1 ]]; then
    say ""
    say "Running post-install diagnostics…"
    run_diagnostics
    cp -a "$REPORT_FILE" "$BACKUP/diagnostic-report.txt" 2>/dev/null || true
  fi

  say ""
  say "Install finished."
  say "  Backup:  $BACKUP"
  say "  Plugin:  $DEST"
  say "  Loader:  $INIT"
  show_report_path
  say "Next steps:"
  say_browser_steps "$PROFILE"
  say ""
  say "Verify later:  ./install.sh --check"
  say "Report only:   ./install.sh --report"
}

usage() {
  say "Band survey installer for OpenWebRX+"
  say ""
  say "  ./install.sh                    Install (backs up first)"
  say "  ./install.sh --public           Public shared receiver (lock fast hops)"
  say "  ./install.sh --check            Verify + write diagnostic report"
  say "  ./install.sh --report           Diagnostic report only"
  say "  ./install.sh --profile TYPE     pi | debian | docker | mac-browser | auto"
  say ""
  say "Reports: $REPORT_ROOT/band-survey-report-*.txt"
  say "Env:     OWRX_HTDOCS  OWRX_REPORT_DIR  OWRX_BACKUP_DIR  OWRX_PROFILE"
}

# --- parse args ---
ARGS=("$@")
idx=0
while [[ $idx -lt ${#ARGS[@]} ]]; do
  arg="${ARGS[$idx]}"
  case "$arg" in
    --check|check) MODE="check" ;;
    --report|report) MODE="report" ;;
    --public|public) PUBLIC=1 ;;
    --no-report) WRITE_REPORT=0 ;;
    -h|--help|help) usage; exit 0 ;;
    --profile)
      idx=$((idx + 1))
      PROFILE="${ARGS[$idx]:-auto}"
      ;;
    --profile=*) PROFILE="${arg#*=}" ;;
    pi|debian|docker|mac-browser|auto) PROFILE="$arg" ;;
    *)
      [[ "$arg" == -* ]] && warn "Unknown option: $arg (try --help)"
      ;;
  esac
  idx=$((idx + 1))
done

case "$MODE" in
  check)  run_check ;;
  report) run_report_only ;;
  *)      run_install ;;
esac
