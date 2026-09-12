#!/usr/bin/env bash
# OpenWebRX Toolbox installer
#
#   ./install.sh                 install (personal, backs up first)
#   ./install.sh --public        install for shared/public receivers
#   ./install.sh --personal        personal / owner-only (non-interactive default)
#   ./install.sh --no-tui          plain-text prompts (no dialog/whiptail)
#   ./install.sh --check           verify install + write diagnostic report
#   ./install.sh --report          diagnostic report only (no install)
#   ./install.sh --purge-legacy    remove old Band Survey only (no Toolbox copy)
#   ./install.sh --remove-legacy   on install: delete old band_survey (default if non-interactive)
#   ./install.sh --keep-legacy     on install: keep band_survey on disk; only Toolbox loads
#   ./install.sh --profile TYPE    pi | debian | docker | mac-browser | auto
#
# Band Survey (band_survey) and Toolbox (toolbox) must never load together in the
# browser - same UI hooks / DOM ids. You may keep both folders on disk for rollback;
# init.js will only load Toolbox.
#
# Reports: ~/owrx-toolbox-reports/toolbox-report-*.txt
# Override: OWRX_HTDOCS=...  OWRX_REPORT_DIR=...  OWRX_BACKUP_DIR=...
#           OWRX_LEGACY=ask|remove|keep
set -uo pipefail

SRC="$(cd "$(dirname "$0")" && pwd)"
STAMP="$(date +%Y%m%d-%H%M%S)"
BACKUP_ROOT="${OWRX_BACKUP_DIR:-$HOME/owrx-toolbox-backups}"
REPORT_ROOT="${OWRX_REPORT_DIR:-$HOME/owrx-toolbox-reports}"
BACKUP="$BACKUP_ROOT/$STAMP"
REPORT_FILE="$REPORT_ROOT/toolbox-report-$STAMP.txt"

PUBLIC=0
PUBLIC_SET=0
MODE="install"
PROFILE="${OWRX_PROFILE:-auto}"
WRITE_REPORT=1
# ask | remove | keep - how to treat an existing Band Survey install
LEGACY_POLICY="${OWRX_LEGACY:-ask}"

# Optional env: OWRX_PUBLIC=0|1|personal|public
case "${OWRX_PUBLIC:-}" in
  1|true|yes|public) PUBLIC=1; PUBLIC_SET=1 ;;
  0|false|no|personal|private|user) PUBLIC=0; PUBLIC_SET=1 ;;
esac

# Counters (report)
R_PASS=0
R_WARN=0
R_FAIL=0

say()  { printf '%s\n' "$*"; }
warn() { printf 'NOTE: %s\n' "$*" >&2; }
die()  { printf 'ERROR: %s\n' "$*" >&2; exit 1; }

fail_install() {
  INSTALL_FAILED=1
  INSTALL_FAIL_MSG="$*"
  printf 'ERROR: %s\n' "$*" >&2
}

# -- Step banners (TUI + plain text) --
step_banner() {
  local step="$1" total="$2" title="$3"
  local use_tui=0
  if [[ "$INTERACTIVE_WIZARD" -eq 1 ]] && detect_ui; then
    use_tui=1
  fi
  if [[ "$use_tui" -eq 1 && "${4:-}" == "msgbox" ]]; then
    ui_msgbox "Step $step/$total" "$title" 8 72
  else
    say ""
    say "════════════════════════════════════════════════════════"
    say " Step $step/$total - $title"
    say "════════════════════════════════════════════════════════"
    say ""
  fi
}

step_say() {
  local step="$1" total="$2" title="$3"
  if [[ "$INTERACTIVE_WIZARD" -eq 0 ]]; then
    say "Step $step/$total - $title"
  fi
}

# -- Permissions: detect sudo need before copies --
need_write_path() {
  local path="$1" dir parent
  [[ -n "$path" ]] || return 1
  if [[ -e "$path" ]]; then
    [[ -w "$path" ]] && return 0
    dir="$(dirname "$path")"
    [[ -d "$dir" && -w "$dir" ]] && return 0
    return 1
  fi
  dir="$(dirname "$path")"
  if [[ -d "$dir" && -w "$dir" ]]; then
    return 0
  fi
  parent="$dir"
  while [[ "$parent" != "/" && ! -d "$parent" ]]; do
    parent="$(dirname "$parent")"
  done
  [[ -d "$parent" && -w "$parent" ]] && return 0
  return 1
}

path_needs_sudo() {
  need_write_path "$1" && return 1
  return 0
}

ensure_sudo() {
  local reason="${1:-OpenWebRX htdocs is often owned by root - sudo is needed to install plugin files.}"
  if ! command -v sudo >/dev/null 2>&1; then
    die "Need sudo to write to protected paths, but sudo is not installed.

$reason

Fix: run as root, or:
  sudo chown -R \$(whoami) \"\$OWRX_HTDOCS/plugins/receiver\""
  fi
  if [[ -t 0 && "$INTERACTIVE_WIZARD" -eq 1 ]]; then
    if detect_ui; then
      ui_msgbox "Administrator access" \
"$reason

The installer will ask for your password once (sudo)." 10 72 || true
    else
      say ""
      say "$reason"
      say "Caching sudo credentials..."
    fi
  fi
  if ! sudo -v 2>/dev/null; then
    die "sudo failed - cannot install without write access.

$reason

Try:
  export OWRX_HTDOCS=/path/you/can/write
  sudo chown -R \$(whoami) /usr/lib/python3/dist-packages/htdocs/plugins/receiver"
  fi
}

ensure_can_write() {
  local path="$1"
  need_write_path "$path" && return 0
  ensure_sudo "Need write access to: $path"
}

preflight_install() {
  local htdocs="$1" dest="$2" init="$3"
  local need_sudo=0 errors=0

  need_src || { fail_install "Missing toolbox.js / toolbox.css next to install.sh"; errors=1; }

  if [[ ! -d "$htdocs" ]]; then
    fail_install "htdocs not found: $htdocs"
    errors=1
  elif [[ ! -f "$htdocs/openwebrx.js" ]]; then
    fail_install "$htdocs does not look like OpenWebRX+ (no openwebrx.js).
Set: export OWRX_HTDOCS=/path/to/htdocs"
    errors=1
  fi

  if [[ ! -f "$htdocs/plugins.js" ]]; then
    warn "plugins.js missing - vanilla OpenWebRX cannot load Toolbox (OpenWebRX+ required)."
  fi

  local check_path
  for check_path in "$dest" "$dest/toolbox.js" "$init" "$(dirname "$dest")"; do
    if path_needs_sudo "$check_path"; then
      need_sudo=1
    fi
  done

  if [[ "$need_sudo" -eq 1 ]]; then
    ensure_can_write "$dest/toolbox.js"
  elif ! need_write_path "$dest" && ! need_write_path "$(dirname "$dest")"; then
    fail_install "Cannot write to $dest (permission denied).
Try: export OWRX_HTDOCS=...  or run with sudo access."
    errors=1
  fi

  if command -v df >/dev/null 2>&1; then
    local free_kb
    free_kb="$(df -Pk "$(dirname "$dest")" 2>/dev/null | awk 'NR==2 {print $4}' || true)"
    if [[ -n "$free_kb" && "$free_kb" -lt 512 ]]; then
      warn "Low disk space on $(dirname "$dest") (${free_kb} KB free)."
    fi
  fi

  [[ "$errors" -eq 0 ]] || return 1
  say "OK   Preflight: source files, htdocs, write access"
  return 0
}

verify_plugin_world_readable() {
  local dest="$1" init="$2"
  local f mode other ok=1

  for f in "$dest/toolbox.js" "$dest/toolbox.css" "$init"; do
    [[ -f "$f" ]] || continue
    if ! readable_file "$f"; then
      warn "Not readable: $f - fixing permissions"
      chmod_world_readable "$f" || ok=0
    fi
    mode="$(stat -c '%a' "$f" 2>/dev/null || true)"
    if [[ -n "$mode" ]]; then
      other=$((10#${mode} % 10))
      if [[ "$other" -lt 4 ]]; then
        warn "$f mode $mode - www-data may not read it; setting 644"
        chmod_world_readable "$f" || ok=0
      fi
    fi
  done

  if [[ "$ok" -eq 0 ]]; then
    warn "Could not fix all file permissions - re-run install.sh or: sudo chmod 644 $dest/*"
    return 1
  fi
  say "Verified plugin files are world-readable (www-data / nginx)."
  return 0
}

show_install_success() {
  local dest="$1" prof="$2"
  local refresh="Ctrl+Shift+R"
  [[ "$prof" == "mac-browser" || "$(detect_os_kind)" == "macos" ]] && refresh="Cmd+Shift+R"

  if detect_ui; then
    ui_msgbox "Install complete!" \
"OpenWebRX Toolbox is installed.

Next steps:
  1. Open the receiver waterfall page
  2. Hard refresh: $refresh
  3. Click Toolbox in the top bar
  4. Settings -> Check install

Backup saved under:
  $BACKUP

Verify later: ./install.sh --check" 18 72
  else
    say ""
    say "╔══════════════════════════════════════════════════════════╗"
    say "║  Install complete!                                       ║"
    say "╚══════════════════════════════════════════════════════════╝"
    say ""
    say_browser_steps "$prof"
  fi
}

show_install_failure() {
  local msg="${1:-Install failed.}"
  if detect_ui; then
    ui_msgbox "Install failed" \
"$msg

Common fixes:
  - export OWRX_HTDOCS=/path/to/htdocs
  - sudo chown -R \$(whoami) .../htdocs/plugins/receiver
  - Re-run: ./install.sh

Diagnostic: ./install.sh --report" 18 72
  else
    say ""
    say "Install failed: $msg"
    say ""
    say "Common fixes:"
    say "  export OWRX_HTDOCS=/path/to/htdocs"
    say "  Ensure sudo works, or fix ownership of htdocs/plugins/receiver"
    say "  ./install.sh --report  (full diagnostic log)"
  fi
}

show_confirm_summary() {
  local htdocs="$1" rx="$2"
  local aud prof_txt leg_txt

  if [[ "$PUBLIC" -eq 1 ]]; then
    aud="Public / shared site (Own radio locked for visitors)"
  else
    aud="Personal / owner-only"
  fi
  prof_txt="$(profile_label "$PROFILE")"

  if legacy_band_survey_present "$rx"; then
    case "$LEGACY_POLICY" in
      remove) leg_txt="Remove old Band Survey (recommended)" ;;
      keep)   leg_txt="Keep Band Survey on disk - Toolbox loads only" ;;
      ask)    leg_txt="Ask during install (next step)" ;;
      *)      leg_txt="Handle older Band Survey if found" ;;
    esac
  else
    leg_txt=""
  fi

  local summary
  summary="Ready to install OpenWebRX Toolbox

Setup:     $prof_txt
Audience:  $aud
htdocs:    $htdocs"
  if [[ -n "$leg_txt" ]]; then
    summary="$summary
Older plugin: $leg_txt

WARNING: do not load Band Survey and Toolbox together."
  fi
  summary="$summary

A backup will be saved first.
Continue?"

  if [[ "$INTERACTIVE_WIZARD" -eq 0 ]]; then
    say "$summary"
    return 0
  fi

  if detect_ui; then
    # Install = Yes, Back = No
    ui_yesno_nav "Step 5/$WIZARD_STEPS - Confirm" "$summary" "Install" "Back" 18 72
    return $?
  fi

  say ""
  say "=== Step 5/$WIZARD_STEPS - Confirm ==="
  say "$summary"
  say ""
  printf 'Install now? [Y=install / b=back / n=quit]: '
  local ans=""
  read -r ans || ans=""
  case "${ans:-Y}" in
    y|Y|yes|YES|"") return 0 ;;
    b|B|back) return 2 ;;
    *) return 1 ;;
  esac
}

# -- Blue-screen TUI (dialog / whiptail); falls back to plain text --
UI_TOOL=""
UI_DIALOGRC=""
case "${NO_TUI:-0}" in 1|true|yes) NO_TUI=1 ;; *) NO_TUI=0 ;; esac
WIZARD_STEPS=6
INTERACTIVE_WIZARD=0
INSTALL_FAILED=0
INSTALL_FAIL_MSG=""

cleanup_ui() {
  [[ -n "$UI_DIALOGRC" && -f "$UI_DIALOGRC" ]] && rm -f "$UI_DIALOGRC"
}
trap cleanup_ui EXIT

detect_ui() {
  UI_TOOL=""
  [[ "$NO_TUI" -eq 1 ]] && return 1
  [[ -t 0 && -t 1 ]] || return 1
  if command -v dialog >/dev/null 2>&1; then
    UI_TOOL="dialog"
    UI_DIALOGRC="$(mktemp)"
    # Classic blue installer look
    cat >"$UI_DIALOGRC" <<'EOF'
# OpenWebRX Toolbox installer - blue screen theme
use_shadow = ON
use_colors = ON
screen_color = (WHITE,BLUE,ON)
shadow_color = (BLACK,BLACK,ON)
dialog_color = (BLACK,WHITE,OFF)
title_color = (YELLOW,WHITE,ON)
border_color = (WHITE,WHITE,ON)
button_active_color = (WHITE,BLUE,ON)
button_inactive_color = (BLACK,WHITE,OFF)
button_key_active_color = (WHITE,BLUE,ON)
button_key_inactive_color = (RED,WHITE,OFF)
button_label_active_color = (YELLOW,BLUE,ON)
button_label_inactive_color = (BLACK,WHITE,ON)
inputbox_color = (BLACK,WHITE,OFF)
inputbox_border_color = (BLACK,WHITE,OFF)
searchbox_color = (BLACK,WHITE,OFF)
searchbox_title_color = (YELLOW,WHITE,ON)
searchbox_border_color = (WHITE,WHITE,ON)
position_indicator_color = (BLUE,WHITE,ON)
menubox_color = (BLACK,WHITE,OFF)
menubox_border_color = (WHITE,WHITE,ON)
item_color = (BLACK,WHITE,OFF)
item_selected_color = (WHITE,BLUE,ON)
tag_color = (BLUE,WHITE,OFF)
tag_selected_color = (YELLOW,BLUE,ON)
tag_key_color = (RED,WHITE,OFF)
tag_key_selected_color = (RED,BLUE,ON)
check_color = (BLACK,WHITE,OFF)
check_selected_color = (WHITE,BLUE,ON)
uarrow_color = (GREEN,WHITE,ON)
darrow_color = (GREEN,WHITE,ON)
EOF
    export DIALOGRC="$UI_DIALOGRC"
    return 0
  fi
  if command -v whiptail >/dev/null 2>&1; then
    UI_TOOL="whiptail"
    return 0
  fi
  return 1
}

ui_backtitle() {
  printf 'OpenWebRX Toolbox installer'
}

# Status: 0=ok/next, 1=quit/abort, 2=back (Cancel)
# ui_menu prints selected tag on stdout when status=0
ui_menu() {
  local title="$1" text="$2"
  shift 2
  local sel st=0
  if [[ "$UI_TOOL" == "dialog" ]]; then
    sel="$(dialog --backtitle "$(ui_backtitle)" --title "$title" \
      --ok-label "Next" --cancel-label "Back" \
      --menu "$text" 20 72 8 "$@" 2>&1 >/dev/tty)" || st=$?
  elif [[ "$UI_TOOL" == "whiptail" ]]; then
    sel="$(whiptail --backtitle "$(ui_backtitle)" --title "$title" \
      --ok-button "Next" --cancel-button "Back" \
      --menu "$text" 20 72 8 "$@" 3>&1 1>&2 2>&3)" || st=$?
  else
    return 2
  fi
  if [[ "$st" -eq 0 ]]; then
    printf '%s\n' "$sel"
    return 0
  fi
  # dialog/whiptail: 1 = Cancel (Back), ESC often 255
  if [[ "$st" -eq 1 || "$st" -eq 255 ]]; then
    return 2
  fi
  return 1
}

ui_msgbox() {
  local title="$1" text="$2" h="${3:-14}" w="${4:-72}"
  if [[ "$UI_TOOL" == "dialog" ]]; then
    dialog --backtitle "$(ui_backtitle)" --title "$title" --msgbox "$text" "$h" "$w"
  elif [[ "$UI_TOOL" == "whiptail" ]]; then
    whiptail --backtitle "$(ui_backtitle)" --title "$title" --msgbox "$text" "$h" "$w"
  else
    say ""
    say "=== $title ==="
    say "$text"
    say ""
  fi
}

# Yes/No with custom labels. 0=yes, 1=no/quit, 2=back (if no means back)
# Usage: ui_yesno_nav title text yes_label no_label [h] [w]
# Returns: 0=yes, 2=no (treated as Back), 1=ESC/abort
ui_yesno_nav() {
  local title="$1" text="$2" yes_l="${3:-Next}" no_l="${4:-Back}" h="${5:-14}" w="${6:-72}"
  local st=0
  if [[ "$UI_TOOL" == "dialog" ]]; then
    dialog --backtitle "$(ui_backtitle)" --title "$title" \
      --yes-label "$yes_l" --no-label "$no_l" \
      --yesno "$text" "$h" "$w" || st=$?
  elif [[ "$UI_TOOL" == "whiptail" ]]; then
    whiptail --backtitle "$(ui_backtitle)" --title "$title" \
      --yes-button "$yes_l" --no-button "$no_l" \
      --yesno "$text" "$h" "$w" || st=$?
  else
    return 2
  fi
  case "$st" in
    0) return 0 ;;
    1) return 2 ;;   # No / Back
    *) return 1 ;;   # ESC
  esac
}

ui_yesno() {
  local title="$1" text="$2" h="${3:-12}" w="${4:-72}"
  if [[ "$UI_TOOL" == "dialog" ]]; then
    dialog --backtitle "$(ui_backtitle)" --title "$title" --yesno "$text" "$h" "$w"
  elif [[ "$UI_TOOL" == "whiptail" ]]; then
    whiptail --backtitle "$(ui_backtitle)" --title "$title" --yesno "$text" "$h" "$w"
  else
    return 2
  fi
}

ui_welcome() {
  detect_ui || return 0
  # Next / Quit (no Back on first screen)
  ui_yesno_nav "Step 1/$WIZARD_STEPS - Welcome" \
"OpenWebRX Toolbox installer

Installs the Toolbox plugin for OpenWebRX+.

Includes Explore, band/range scans, peaks, bookmarks,
Audio clips, Extras, and a public visitor allowlist.

Tip: use Back on later screens to change earlier choices." \
    "Next" "Quit" 16 72
  local st=$?
  case "$st" in
    0) return 0 ;;
    2) return 1 ;;  # Quit
    *) return 1 ;;
  esac
}

# Only shown when an older Band Survey install is actually present.
ui_legacy_warning() {
  detect_ui || return 0
  ui_msgbox "Older plugin found" \
"An older Band Survey (band_survey) install was found.

Running Band Survey AND Toolbox together WILL cause
issues: duplicate panels, fighting controls, broken UI.

Recommended: remove Band Survey and use Toolbox only
(Toolbox includes every Band Survey feature and more)." 14 72
}

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
  [[ -f "$SRC/toolbox.js" && -f "$SRC/toolbox.css" ]] || \
    die "Run this from the Toolbox plugin folder (need toolbox.js and toolbox.css next to install.sh)."
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
  if detect_ui; then
    local sel st=0
    local menu_title="Setup type"
    [[ "$INTERACTIVE_WIZARD" -eq 1 ]] && menu_title="Step 2/$WIZARD_STEPS - Setup type"
    sel="$(ui_menu "$menu_title" \
"What kind of setup is this?

(Back returns to the previous screen.)" \
      1 "Raspberry Pi SD image" \
      2 "Linux server (Debian/Ubuntu package)" \
      3 "Docker / container" \
      4 "I browse from a Mac (radio on Pi/server)" \
      5 "Not sure - auto-detect")" || st=$?
    case "$st" in
      0)
        case "$sel" in
          1) PROFILE=pi ;;
          2) PROFILE=debian ;;
          3) PROFILE=docker ;;
          4) PROFILE=mac-browser ;;
          *) PROFILE=auto ;;
        esac
        return 0
        ;;
      2) return 2 ;;
      *) return 1 ;;
    esac
  fi
  say ""
  say "What kind of setup is this? (helps tailor the report and next steps)"
  say "  1) Raspberry Pi SD image"
  say "  2) Linux server (Debian/Ubuntu OpenWebRX+ package)"
  say "  3) Docker container"
  say "  4) I use Safari/Chrome on a Mac (radio is on a Pi or server)"
  say "  5) Not sure - auto-detect"
  say "  b) Back"
  say ""
  printf 'Choose [1-5 / b, Enter=5]: '
  read -r choice || choice=""
  case "${choice:-5}" in
    b|B|back) return 2 ;;
    1) PROFILE=pi ;;
    2) PROFILE=debian ;;
    3) PROFILE=docker ;;
    4) PROFILE=mac-browser ;;
    *) PROFILE=auto ;;
  esac
  return 0
}

# Public shared receiver vs personal / owner-only.
# Returns 0=next, 1=quit, 2=back. Skips UI only when locked from CLI (--personal/--public).
pick_audience_interactive() {
  if [[ "${PUBLIC_FROM_CLI:-0}" -eq 1 ]]; then
    return 0
  fi
  if [[ ! -t 0 ]]; then
    PUBLIC=0
    say "Non-interactive: defaulting to personal / owner-only (use --public on shared sites)."
    return 0
  fi
  if detect_ui; then
    local sel st=0
    local menu_title="Who uses this receiver?"
    [[ "$INTERACTIVE_WIZARD" -eq 1 ]] && menu_title="Step 3/$WIZARD_STEPS - Who uses this receiver?"
    sel="$(ui_menu "$menu_title" \
"Personal = you / trusted LAN (Own radio available).
Public = shared internet site (locks fast hops).

(Back returns to the previous screen.)" \
      1 "Personal / owner only  (recommended for home SDR)" \
      2 "Public / shared site  (visitors on the internet)")" || st=$?
    case "$st" in
      0)
        case "$sel" in
          2) PUBLIC=1 ;;
          *) PUBLIC=0 ;;
        esac
        PUBLIC_SET=1
        return 0
        ;;
      2) return 2 ;;
      *) return 1 ;;
    esac
  fi
  say ""
  say "Who will use this receiver?"
  say ""
  say "  [1] Personal / owner only  * typical home SDR"
  say "      You (or trusted LAN users) run Toolbox. Own radio / fast hops available."
  say "  [2] Public / shared site"
  say "      Visitors on the internet. Locks Own radio - fast hops; use Public allowlist in Settings."
  say "  [b] Back"
  say ""
  local choice=""
  while true; do
    printf "Choose 1 / 2 / b [1]: "
    read -r choice || choice="1"
    choice="${choice:-1}"
    case "$choice" in
      b|B|back) return 2 ;;
      1|p|P|personal|private|user|owner) PUBLIC=0; break ;;
      2|u|U|public|shared) PUBLIC=1; break ;;
      *) say "Enter 1, 2, or b." ;;
    esac
  done
  PUBLIC_SET=1
  if [[ "$PUBLIC" -eq 1 ]]; then
    say "Audience: public / shared (Own radio locked for visitors)."
  else
    say "Audience: personal / owner-only."
  fi
  return 0
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

init_loads_toolbox() {
  local init="$1"
  [[ -f "$init" ]] || return 1
  grep -qE 'Plugins\.load\(["'"'"'][^"'"'"']*toolbox|loadPlugin\(["'"'"']toolbox["'"'"']\)|load\(["'"'"']toolbox["'"'"']\)' "$init"
}

# Old plugin id before rename to toolbox (v90s-early 100s and CDN installs).
init_loads_band_survey() {
  local init="$1"
  [[ -f "$init" ]] || return 1
  grep -qE 'Plugins\.load\([^)]*band_survey|loadPlugin\(["'"'"']band_survey["'"'"']\)|band_survey\.js|Plugins\.band_survey' "$init" 2>/dev/null
}

legacy_band_survey_js() {
  local rx="$1"
  local cand
  for cand in \
    "$rx/band_survey/band_survey.js" \
    "$rx/band_survey/toolbox.js" \
    "$rx/toolbox/band_survey.js" \
    "$rx/band_survey.js"
  do
    if [[ -f "$cand" ]]; then
      printf '%s\n' "$cand"
      return 0
    fi
  done
  return 1
}

# Files/folders on disk (not init.js loaders).
legacy_band_survey_files_present() {
  local rx="$1"
  [[ -d "$rx/band_survey" ]] && return 0
  [[ -f "$rx/band_survey.js" || -f "$rx/band_survey.css" ]] && return 0
  [[ -f "$rx/toolbox/band_survey.js" || -f "$rx/toolbox/band_survey.css" ]] && return 0
  return 1
}

legacy_band_survey_present() {
  local rx="$1"
  local init="$rx/init.js"
  legacy_band_survey_files_present "$rx" && return 0
  init_loads_band_survey "$init" && return 0
  return 1
}

# Interactive / flag resolution when Band Survey is still around.
resolve_legacy_policy() {
  local rx="$1"
  if ! legacy_band_survey_present "$rx"; then
    LEGACY_POLICY="none"
    return 0
  fi
  case "$LEGACY_POLICY" in
    remove|keep) return 0 ;;
    ask) ;;
    *)
      warn "Unknown OWRX_LEGACY/LEGACY_POLICY='$LEGACY_POLICY' - using ask"
      LEGACY_POLICY="ask"
      ;;
  esac
  if [[ ! -t 0 ]]; then
    LEGACY_POLICY="remove"
    say "Non-interactive: defaulting to --remove-legacy (recommended - Toolbox replaces Band Survey)."
    say "  Toolbox has all Band Survey features and more. Use --keep-legacy only to keep files for rollback."
    return 0
  fi

  local legacy_menu_text
  legacy_menu_text="Older Band Survey (band_survey) was found.

Running both plugins at once WILL cause issues:
  - duplicate panels
  - fighting controls
  - broken receiver UI

Toolbox includes everything Band Survey did and more.
Choose how to handle the old install:"

  if detect_ui; then
    ui_legacy_warning
    local sel st=0
    sel="$(ui_menu "Older Band Survey found" "$legacy_menu_text

(Back returns to the previous screen.)" \
      remove "Remove Band Survey - Toolbox only  * recommended" \
      keep "Keep on disk - Toolbox loads only (rollback)" \
      abort "Abort - no changes")" || st=$?
    case "$st" in
      0)
        case "$sel" in
          remove) LEGACY_POLICY="remove" ;;
          keep)   LEGACY_POLICY="keep" ;;
          abort)  return 1 ;;
          *)      LEGACY_POLICY="remove" ;;
        esac
        say "Legacy policy: $LEGACY_POLICY"
        return 0
        ;;
      2) return 2 ;;
      *) return 1 ;;
    esac
  fi

  say ""
  say "=== Older Band Survey found ==="
  say "Older Band Survey (band_survey) is installed beside where Toolbox will live."
  say ""
  say "  WARNING: Running both plugins at once WILL cause issues"
  say "  (duplicate panels, fighting controls, broken UI)."
  say ""
  say "  Recommended: use OpenWebRX Toolbox only."
  say "  Toolbox includes everything Band Survey did, plus Explore, Audio, Extras,"
  say "  public allowlist, and many more features. Keeping both is only for rollback."
  say ""
  say "  [1] Remove Band Survey - Toolbox only  * recommended"
  say "  [2] Keep Band Survey on disk - install Toolbox beside it; only Toolbox loads"
  say "      (rollback-friendly; init.js will not load band_survey)"
  say "  [3] Abort"
  say "  [b] Back"
  say ""
  local choice=""
  while true; do
    printf "Choose 1 / 2 / 3 / b [1]: "
    read -r choice || choice="1"
    choice="${choice:-1}"
    case "$choice" in
      b|B|back) return 2 ;;
      1|r|R|remove) LEGACY_POLICY="remove"; break ;;
      2|k|K|keep) LEGACY_POLICY="keep"; break ;;
      3|a|A|abort|q|Q) return 1 ;;
      *) say "Enter 1, 2, 3, or b." ;;
    esac
  done
  say "Legacy policy: $LEGACY_POLICY"
  return 0
}

# Always strip band_survey from init.js when installing Toolbox.
# Optionally delete files (remove) or leave them for rollback (keep).
handle_legacy_band_survey() {
  local rx="$1"
  local init="$rx/init.js"
  local found=0
  local leg_js="" leg_ver=""

  say ""
  say "Checking for older Band Survey (band_survey)..."

  if [[ -d "$rx/band_survey" ]]; then
    found=1
    say "  - found folder: $rx/band_survey"
  fi
  leg_js="$(legacy_band_survey_js "$rx" || true)"
  if [[ -n "$leg_js" ]]; then
    found=1
    leg_ver="$(plugin_version "$leg_js")"
    say "  - found JS: $leg_js${leg_ver:+ (v$leg_ver)}"
  fi
  if [[ -f "$rx/band_survey.js" || -f "$rx/toolbox/band_survey.js" ]]; then
    found=1
    say "  - found leftover band_survey.js beside the plugin tree"
  fi
  if init_loads_band_survey "$init"; then
    found=1
    say "  - init.js still loads band_survey (local and/or CDN)"
  fi

  if [[ "$found" -eq 0 ]]; then
    say "  No legacy Band Survey found - clean slate for Toolbox."
    return 0
  fi

  resolve_legacy_policy "$rx"
  if [[ "$LEGACY_POLICY" == "none" ]]; then
    return 0
  fi

  # Critical: never leave band_survey loaders active next to Toolbox.
  say "  Ensuring init.js does not load band_survey (Toolbox only)..."
  strip_legacy_band_survey_loads "$init"

  # Always clear mixed files inside the toolbox/ package folder.
  local stray
  for stray in \
    "$rx/toolbox/band_survey.js" \
    "$rx/toolbox/band_survey.css" \
    "$rx/toolbox/band_survey.js.tmp"
  do
    [[ -e "$stray" ]] || continue
    force_rm_path "$stray" "mixed band_survey file inside toolbox/"
  done

  if [[ "$LEGACY_POLICY" == "keep" ]]; then
    say "  Keeping Band Survey files on disk (not loaded)."
    if [[ -d "$rx/band_survey" ]]; then
      write_kept_legacy_note "$rx/band_survey"
    fi
    if init_loads_band_survey "$init"; then
      warn "init.js still mentions band_survey after strip - edit $init manually"
      return 1
    fi
    say "  Coexist mode: folders may both exist; only Plugins.load(\"toolbox\") runs."
    return 0
  fi

  say "  Removing Band Survey files..."
  remove_legacy_band_survey_files "$rx"

  if legacy_band_survey_files_present "$rx" || init_loads_band_survey "$init"; then
    warn "Legacy Band Survey may still be partially present - check permissions / sudo"
    return 1
  fi
  say "  Legacy Band Survey removed."
  return 0
}

write_kept_legacy_note() {
  local dir="$1"
  local note="$dir/KEPT_BESIDE_TOOLBOX.txt"
  local tmp
  tmp="$(mktemp)"
  cat >"$tmp" <<EOF
Band Survey kept beside OpenWebRX Toolbox
====================================

This folder was left on purpose (--keep-legacy / installer choice 2).

Recommended long-term: use OpenWebRX Toolbox only and remove this folder.
Toolbox includes every Band Survey feature, plus Explore, Audio, Extras,
public allowlist, and more.

- OpenWebRX must load ONLY toolbox (see plugins/receiver/init.js).
- Do NOT add Plugins.load("band_survey") while Toolbox is installed.
- Loading both breaks the receiver UI (duplicate panels / DOM ids).

To remove this folder later (recommended):
  ./install.sh --purge-legacy
  # or: ./install.sh --remove-legacy

To roll back to Band Survey only (not recommended):
  1. Remove or comment out Plugins.load("toolbox") in init.js
  2. Add Plugins.load("band_survey")
  3. Hard-refresh the receiver page
EOF
  if [[ -w "$dir" ]]; then
    cp "$tmp" "$note" 2>/dev/null || true
  else
    sudo cp "$tmp" "$note" 2>/dev/null || true
  fi
  rm -f "$tmp"
}

# Back-compat name used by --purge-legacy path.
purge_legacy_band_survey() {
  LEGACY_POLICY="remove"
  handle_legacy_band_survey "$1"
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

# 200 = served; 401/403 = auth proxy in front (still means the path exists).
http_probe_status() {
  local url="$1" code
  command -v curl >/dev/null 2>&1 || return 1
  code="$(curl -sS -m 8 -o /dev/null -w '%{http_code}' "$url" 2>/dev/null || true)"
  case "$code" in
    200|304) return 0 ;;
    401|403) return 2 ;;  # reachable behind auth
    *) return 1 ;;
  esac
}

guess_openwebrx_urls() {
  # Prefer loopback upstream (often :18073) then public/auth port (:8073).
  local ports=()
  local p
  if [[ -r /var/lib/openwebrx/settings.json ]]; then
    p="$(grep -o '"web_port"[[:space:]]*:[[:space:]]*[0-9]*' /var/lib/openwebrx/settings.json 2>/dev/null | grep -o '[0-9]*$' || true)"
    [[ -n "$p" ]] && ports+=("$p")
  fi
  ports+=(18073 8073 8080 80)
  local seen="|" out=()
  for p in "${ports[@]}"; do
    [[ "$seen" == *"|$p|"* ]] && continue
    seen+="$p|"
    out+=("http://127.0.0.1:${p}/")
  done
  printf '%s\n' "${out[@]}"
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
    log_line "  3. If still no Toolbox: try Chrome, or Safari Empty Caches."
    log_line "  4. Private window test rules out extensions blocking scripts."
    log_line "  5. In Toolbox -> Help -> Copy diagnostic report - paste that if stuck."
  else
    log_line "  1. Open the receiver page (waterfall + band picker)."
    log_line "  2. Hard refresh: Ctrl+Shift+R (Windows/Linux) or Cmd+Shift+R (Mac)."
    log_line "  3. Click Toolbox on the right panel -> Check install."
    log_line "  4. Help tab -> Copy diagnostic report if you need to ask for help."
  fi
}

say_browser_steps() {
  local prof="$1"
  say "On the browser machine:"
  if [[ "$prof" == "mac-browser" ]] || [[ "$(detect_os_kind)" == "macos" ]]; then
    say "  1. Receiver waterfall page (not map-only)"
    say "  2. Cmd+Shift+R hard refresh"
    say "  3. Toolbox -> Check install"
    say "  4. Help -> Copy diagnostic report if still stuck"
  else
    say "  1. Receiver waterfall page"
    say "  2. Ctrl+Shift+R or Cmd+Shift+R"
    say "  3. Toolbox -> Check install"
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
      log_line "- If Check install is green on server but Mac shows no Toolbox button: browser cache (Cmd+Shift+R)."
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
      log_line "- Server check OK but no Toolbox button = almost always browser cache or wrong page."
      log_line "- Run ./install.sh --report on the server and send the .txt file when asking for help."
      ;;
  esac
}

write_report_header() {
  mkdir -p "$REPORT_ROOT"
  : >"$REPORT_FILE"
  log_line "Toolbox - diagnostic report"
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
    r_warn "Running inside Docker/container - confirm htdocs path is the live mount"
  fi
  if [[ "$(detect_os_kind)" == "macos" ]]; then
    r_warn "This shell is macOS - OpenWebRX+ usually runs on Linux/Pi, not on the Mac"
    r_info "Unless OWRX_HTDOCS points at a real install, run install.sh over SSH on the radio host"
  fi
  log_line ""
}

collect_openwebrx() {
  local htdocs="$1"
  local dest="$htdocs/plugins/receiver/toolbox"
  local init="$htdocs/plugins/receiver/init.js"

  log_line "=== OpenWebRX+ paths ==="
  log_line "htdocs: $htdocs"

  if [[ -f "$htdocs/openwebrx.js" ]]; then
    r_ok "openwebrx.js present ($(wc -c <"$htdocs/openwebrx.js" | tr -d ' ') bytes)"
  else
    r_fail "openwebrx.js missing in htdocs"
  fi

  if [[ -f "$htdocs/plugins.js" ]]; then
    r_ok "plugins.js present - OpenWebRX+ plugin loader"
  else
    r_fail "plugins.js missing - vanilla OpenWebRX cannot load Toolbox"
    r_info "Install OpenWebRX+ (luarvique fork), not stock OpenWebRX"
  fi

  if [[ -f "$dest/toolbox.js" && -f "$dest/toolbox.css" ]]; then
    local ver
    ver="$(plugin_version "$dest/toolbox.js")"
    r_ok "Plugin files in $dest (JS v${ver:-unknown})"
    r_info "toolbox.js $(wc -c <"$dest/toolbox.js" | tr -d ' ') bytes md5=$(file_digest "$dest/toolbox.js")"
    r_info "toolbox.css $(wc -c <"$dest/toolbox.css" | tr -d ' ') bytes"
  else
    r_fail "Plugin files missing in $dest - run ./install.sh"
  fi

  local src_ver
  src_ver="$(plugin_version "$SRC/toolbox.js")"
  if [[ -f "$dest/toolbox.js" && -f "$SRC/toolbox.js" ]]; then
    local live_ver
    live_ver="$(plugin_version "$dest/toolbox.js")"
    if [[ -n "$src_ver" && -n "$live_ver" && "$src_ver" != "$live_ver" ]]; then
      r_warn "Installed plugin v$live_ver but this folder has v$src_ver - re-run ./install.sh to update"
    fi
  fi

  if init_loads_toolbox "$init"; then
    r_ok "init.js loads toolbox"
  else
    r_fail "init.js does not load toolbox - run ./install.sh or add: await Plugins.load(\"toolbox\");"
  fi

  # Band Survey may sit on disk for rollback, but must NEVER load beside Toolbox.
  local rx="$htdocs/plugins/receiver"
  local both_loading=0
  if init_loads_toolbox "$init" && init_loads_band_survey "$init"; then
    both_loading=1
    r_fail "init.js loads BOTH toolbox and band_survey - they clash. Fix: ./install.sh --keep-legacy (or --remove-legacy)"
  fi
  if legacy_band_survey_files_present "$rx"; then
    if init_loads_band_survey "$init"; then
      [[ "$both_loading" -eq 1 ]] || r_fail "init.js still loads band_survey - strip it or run ./install.sh"
      local leg_js leg_ver
      leg_js="$(legacy_band_survey_js "$rx" || true)"
      if [[ -n "${leg_js:-}" ]]; then
        leg_ver="$(plugin_version "$leg_js")"
        r_info "Legacy JS: $leg_js${leg_ver:+ (v$leg_ver)}"
      fi
    else
      r_ok "Band Survey files kept on disk (not loaded) - rollback-friendly beside Toolbox"
      r_info "Folder/files: $rx/band_survey (or stray band_survey.js). Only toolbox should load."
    fi
  elif init_loads_band_survey "$init"; then
    r_fail "init.js references band_survey but files are missing - strip dead loaders with ./install.sh"
  else
    r_ok "No Band Survey loaders; no clash with Toolbox"
  fi

  if [[ -f "$init" ]]; then
    log_line "--- init.js (first 40 lines) ---"
    head -n 40 "$init" 2>/dev/null | while IFS= read -r line; do log_line "$line"; done || true
  fi

  if [[ -f "$dest/toolbox.js" ]] && grep -q 'TOOLBOX_ALLOW_OWNER_OVERRIDE = false' "$dest/toolbox.js"; then
    r_ok "Public mode: Own radio - fast hops locked for visitors"
  elif [[ -f "$dest/toolbox.js" ]]; then
    r_info "Personal mode: owner can tick Own radio - fast hops (use ./install.sh --public on shared sites)"
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
      r_warn "Varnish is active - restart after updates: sudo systemctl restart varnish nginx"
    fi
  else
    r_info "systemctl not available"
  fi

  log_line ""
  log_line "=== HTTP probe (from this machine) ==="
  local base url st any=0
  while IFS= read -r base; do
    [[ -z "$base" ]] && continue
    url="${base}static/plugins/receiver/toolbox/toolbox.js"
    log_line "Trying: $url"
    http_probe_status "$url"
    st=$?
    if [[ "$st" -eq 0 ]]; then
      r_ok "HTTP can fetch toolbox.js ($base)"
      any=1
      break
    elif [[ "$st" -eq 2 ]]; then
      r_ok "OpenWebRX reachable at $base (HTTP auth required - normal for LAN auth proxy)"
      r_info "Plugin file itself is on disk; browser after login can load it."
      any=1
      break
    fi
  done < <(guess_openwebrx_urls)
  if [[ "$any" -eq 0 ]]; then
    # Fallback without /static/ prefix (some setups)
    base="$(guess_openwebrx_url)"
    url="${base}plugins/receiver/toolbox/toolbox.js"
    log_line "Trying: $url"
    if http_probe "$url"; then
      r_ok "HTTP can fetch toolbox.js from local OpenWebRX"
    else
      r_warn "Could not fetch toolbox.js via HTTP (service down, different port, or firewalled)"
      r_info "This does not always mean install failed - browser may still work on LAN"
    fi
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
    log_line "Result: FIX NEEDED on server - address FAIL lines above, then re-run ./install.sh --check"
  elif [[ "$R_WARN" -gt 0 ]]; then
    log_line "Result: Server install probably OK - if browser still broken, follow Browser steps (cache / wrong page)"
  else
    log_line "Result: Server install looks good - if no Toolbox button, hard-refresh the receiver page on your Mac/PC"
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
  say "Toolbox - install check (no files changed)"
  say ""
  run_diagnostics
  show_report_path
  if [[ "$R_FAIL" -gt 0 ]]; then
    exit 1
  fi
  exit 0
}

run_report_only() {
  say "Toolbox - diagnostic report only"
  say ""
  run_diagnostics
  show_report_path
  exit $([[ "$R_FAIL" -gt 0 ]] && echo 1 || echo 0)
}

copy_if() {
  local from="$1" dest="$2"
  if [[ -e "$from" ]]; then
    mkdir -p "$(dirname "$dest")"
    if [[ -d "$from" ]]; then
      backup_plugin_dir "$from" "$dest" && say "  backed up $from" && return 0
      warn "Backup of $from had permission issues - continued with readable files only."
      return 0
    fi
    if cp -a "$from" "$dest" 2>/dev/null; then
      say "  backed up $from"
      return 0
    fi
    if command -v sudo >/dev/null 2>&1 && sudo cp -a "$from" "$dest" 2>/dev/null; then
      say "  backed up $from (via sudo)"
      return 0
    fi
    warn "Could not back up $from (permission denied) - install continues."
    return 0
  fi
  return 1
}

# Copy a plugin dir without dying on root-owned junk (.tmp, unreadable files).
backup_plugin_dir() {
  local from="$1" dest="$2"
  mkdir -p "$dest"
  if command -v rsync >/dev/null 2>&1; then
    if rsync -a --ignore-errors --exclude '*.tmp' --exclude '*.tmp/**' "$from"/ "$dest"/ 2>/dev/null; then
      return 0
    fi
  fi
  # Fallback: copy what we can read; skip permission noise.
  if cp -a "$from"/. "$dest"/ 2>/tmp/owrx-toolbox-backup.err; then
    return 0
  fi
  # Partial copy is OK if essentials landed (toolbox or legacy band_survey).
  if [[ -f "$dest/toolbox.js" || -f "$dest/band_survey.js" || -f "$from/toolbox.js" || -f "$from/band_survey.js" ]]; then
    while IFS= read -r line; do
      [[ "$line" == *"Permission denied"* ]] || [[ "$line" == *"cannot stat"* ]] || continue
      warn "  skip during backup: ${line##*: }"
    done < /tmp/owrx-toolbox-backup.err 2>/dev/null || true
    rm -f /tmp/owrx-toolbox-backup.err
    return 0
  fi
  rm -f /tmp/owrx-toolbox-backup.err
  return 1
}

cleanup_plugin_junk() {
  local dest="$1"
  [[ -d "$dest" ]] || return 0
  # Leftover from interrupted edits / bad deploys - often root-owned and break backups.
  local junk
  shopt -s nullglob
  for junk in "$dest"/*.tmp "$dest"/*.js.tmp "$dest"/*/*.tmp; do
    [[ -e "$junk" ]] || continue
    force_rm_path "$junk" "leftover junk"
  done
  shopt -u nullglob
  # Also find nested *.tmp (e.g. band_survey.js.tmp/ from bad edits).
  if command -v find >/dev/null 2>&1; then
    while IFS= read -r junk; do
      [[ -n "$junk" ]] || continue
      force_rm_path "$junk" "leftover junk"
    done < <(find "$dest" \( -name '*.tmp' -o -name '*.tmp.*' \) 2>/dev/null || true)
  fi
}

force_rm_path() {
  local path="$1"
  local label="${2:-path}"
  [[ -e "$path" ]] || return 0
  if rm -rf "$path" 2>/dev/null; then
    say "  removed $label: $path"
    return 0
  fi
  if command -v sudo >/dev/null 2>&1; then
    ensure_can_write "$path" 2>/dev/null || true
    if sudo rm -rf "$path" 2>/dev/null; then
      say "  removed $label: $path (via sudo)"
      return 0
    fi
  fi
  warn "Could not remove $path (permission denied)
  Hint: sudo rm -rf \"$path\"  or  sudo chown -R \$(whoami) \"$(dirname "$path")\""
  return 1
}

fix_plugin_readable() {
  local dest="$1"
  [[ -d "$dest" ]] || return 0
  # Ensure the web server / browsers can read the plugin (fixes mode 600 after sudo cp).
  if [[ -w "$dest" ]]; then
    chmod 755 "$dest" 2>/dev/null || true
    chmod 644 "$dest"/* 2>/dev/null || true
    chmod +x "$dest/install.sh" 2>/dev/null || true
  else
    sudo chmod 755 "$dest" 2>/dev/null || true
    sudo chmod 644 "$dest"/* 2>/dev/null || true
    sudo chmod +x "$dest/install.sh" 2>/dev/null || true
  fi
}

chmod_world_readable() {
  # Prefer 644 so www-data / nginx / browsers can read plugin + init.js
  # (cp -a can leave root-owned 600 files that break the receiver).
  local f="$1"
  [[ -e "$f" ]] || return 0
  if [[ -w "$f" ]]; then
    chmod 644 "$f" 2>/dev/null && return 0
  fi
  if command -v sudo >/dev/null 2>&1 && sudo chmod 644 "$f" 2>/dev/null; then
    return 0
  fi
  warn "Could not chmod 644 $f - www-data may not read the plugin"
  return 1
}

sudo_cp() {
  local from="$1" dest="$2"
  local dest_dir hint
  dest_dir="$(dirname "$dest")"
  hint="Path: $dest
Hint: export OWRX_HTDOCS=...  or  sudo chown -R \$(whoami) \"$dest_dir\""

  # Re-running install.sh from the live plugin folder - nothing to copy.
  if [[ -e "$from" && -e "$dest" ]] && [[ "$(readlink -f "$from" 2>/dev/null || realpath "$from" 2>/dev/null || echo "$from")" == "$(readlink -f "$dest" 2>/dev/null || realpath "$dest" 2>/dev/null || echo "$dest")" ]]; then
    return 0
  fi

  if need_write_path "$dest"; then
    mkdir -p "$dest_dir" 2>/dev/null || true
    if cp -a "$from" "$dest" 2>/dev/null; then
      chmod_world_readable "$dest"
      return 0
    fi
  fi

  if command -v sudo >/dev/null 2>&1; then
    ensure_can_write "$dest"
    sudo mkdir -p "$dest_dir" 2>/dev/null || true
    if sudo cp -a "$from" "$dest" 2>/dev/null; then
      chmod_world_readable "$dest"
      return 0
    fi
  fi

  die "Could not copy $from -> $dest

$hint"
}

sudo_mkdir() {
  local d="$1"
  if [[ -d "$d" && -w "$d" ]]; then
    return 0
  fi
  if mkdir -p "$d" 2>/dev/null && [[ -w "$d" ]]; then
    return 0
  fi
  if command -v sudo >/dev/null 2>&1; then
    ensure_can_write "$d"
    if sudo mkdir -p "$d" 2>/dev/null; then
      return 0
    fi
  fi
  die "Could not create directory: $d
Hint: sudo mkdir -p \"$d\"  or fix ownership of $(dirname "$d")"
}

# Rewrite init.js: drop every Band Survey loader (folder id, CDN URL, install stubs).
strip_legacy_band_survey_loads() {
  local init="$1"
  [[ -f "$init" ]] || return 0
  local tmp before after
  tmp="$(mktemp)"
  if [[ -w "$init" ]]; then
    cat "$init" >"$tmp"
  else
    sudo cat "$init" >"$tmp" 2>/dev/null || cat "$init" >"$tmp"
  fi
  before="$(wc -c <"$tmp" | tr -d ' ')"

  if command -v python3 >/dev/null 2>&1; then
    python3 - "$tmp" <<'PY'
import re, sys
path = sys.argv[1]
text = open(path, encoding="utf-8", errors="replace").read()
orig = text

def strip_try_catch_containing(s, needle):
    """Remove try {...} catch (...) {...} blocks whose try-body mentions needle."""
    out = []
    i = 0
    low = s.lower()
    needle = needle.lower()
    while i < len(s):
        m = re.search(r"\btry\s*\{", s[i:], flags=re.I)
        if not m:
            out.append(s[i:])
            break
        start = i + m.start()
        out.append(s[i:start])
        brace = i + m.end() - 1  # position of '{'
        # match try body
        depth = 0
        j = brace
        while j < len(s):
            if s[j] == "{":
                depth += 1
            elif s[j] == "}":
                depth -= 1
                if depth == 0:
                    j += 1
                    break
            j += 1
        try_end = j
        try_body = s[brace:try_end]
        cm = re.match(r"\s*catch\s*\([^)]*\)\s*\{", s[try_end:], flags=re.I)
        if not cm:
            out.append(s[start:try_end])
            i = try_end
            continue
        cbrace = try_end + cm.end() - 1
        depth = 0
        k = cbrace
        while k < len(s):
            if s[k] == "{":
                depth += 1
            elif s[k] == "}":
                depth -= 1
                if depth == 0:
                    k += 1
                    break
            k += 1
        block = s[start:k]
        if needle in try_body.lower() or needle in block.lower():
            # drop whole try/catch
            i = k
            # also drop a following lone })(); if this emptied an async IIFE - handled later
            continue
        out.append(block)
        i = k
    return "".join(out)

text = strip_try_catch_containing(text, "band_survey")
# Any remaining line that still mentions band_survey
text = re.sub(r"(?m)^[^\n]*band_survey[^\n]*\n?", "", text, flags=re.I)
# Empty async IIFEs: (async () => { })();
text = re.sub(r"\(async\s*\(\)\s*=>\s*\{\s*\}\)\s*\(\)\s*;?\s*", "", text)
# Orphan catch-only leftovers (should not happen after brace strip)
text = re.sub(r"(?m)^\s*catch\s*\([^)]*\)\s*\{[^{}]*\}\s*\n?", "", text)
text = re.sub(r"\n{3,}", "\n\n", text)
text = text.strip()
if text:
    text += "\n"
if text != orig:
    open(path, "w", encoding="utf-8").write(text)
PY
  else
    # Fallback: line deletes (may leave empty async stubs - python3 preferred).
    sed -i \
      -e '/Plugins\.load([^)]*band_survey/d' \
      -e '/loadPlugin(["'"'"']band_survey["'"'"']/d' \
      -e '/band_survey\.js/d' \
      -e '/Plugins\.band_survey/d' \
      -e '/band_survey - added by install\.sh/,/^})();$/d' \
      -e '/band_survey load failed/d' \
      "$tmp" 2>/dev/null || true
  fi

  after="$(wc -c <"$tmp" | tr -d ' ')"
  if [[ "$before" != "$after" ]]; then
    sudo_cp "$tmp" "$init"
    say "  stripped band_survey loaders from init.js"
  fi
  rm -f "$tmp"
}

remove_legacy_band_survey_files() {
  local rx="$1"
  local old="$rx/band_survey"
  if [[ -d "$old" ]]; then
    cleanup_plugin_junk "$old"
    force_rm_path "$old" "legacy Band Survey folder" || \
      warn "Could not remove $old - remove it manually"
  fi
  # Stray flat copies / half-migrated leftovers beside or inside toolbox/
  local stray
  for stray in \
    "$rx/band_survey.js" \
    "$rx/band_survey.css" \
    "$rx/toolbox/band_survey.js" \
    "$rx/toolbox/band_survey.css" \
    "$rx/toolbox/band_survey.js.tmp"
  do
    [[ -e "$stray" ]] || continue
    force_rm_path "$stray" "legacy Band Survey file"
  done
}

append_load_line() {
  local init="$1"
  local tmp
  tmp="$(mktemp)"
  if [[ -f "$init" ]]; then
    if init_loads_toolbox "$init"; then
      say "init.js already loads toolbox - left as-is."
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
// OpenWebRX+ receiver plugins - created by toolbox/install.sh
// Toolbox is standalone (no freq_scanner / uikit / notify required).
(async () => {
  try { await Plugins.load("toolbox"); }
  catch (err) { try { console.warn("toolbox load failed", err); } catch (e) {} }
})();
EOF
    sudo_cp "$tmp" "$init"
    rm -f "$tmp"
    say "Created $init with Toolbox only."
    return 0
  fi
  cat >>"$tmp" <<'EOF'

// toolbox - added by install.sh (safe extra loader; does not remove your other plugins)
// Standalone: works with or without freq_scanner / CDN plugins.
(async () => {
  try { await Plugins.load("toolbox"); }
  catch (err) { try { console.warn("toolbox load failed", err); } catch (e) {} }
})();
EOF
  sudo_cp "$tmp" "$init"
  rm -f "$tmp"
  say "Appended Plugins.load(\"toolbox\") to init.js."
}

write_restore() {
  local htdocs="$1" init="$2"
  cat >"$BACKUP/RESTORE.txt" <<EOF
Toolbox backup - $STAMP
=============================

This folder is a copy of YOUR files from just before Toolbox was installed
or updated. The plugin never overwrites this folder.

If band_survey/ or band_survey.legacy/ is present, that is older Band Survey
kept for rollback (or a backup). Do not load it while Toolbox is active.

Diagnostic report from this run (if any):
  $REPORT_FILE

To restore plugin loading:
  sudo cp init.js $init

To restore a previous Toolbox copy (if toolbox.prev exists):
  sudo rm -rf $htdocs/plugins/receiver/toolbox
  sudo cp -a toolbox.prev $htdocs/plugins/receiver/toolbox

Recommended: use Toolbox only - it includes every Band Survey feature and more.
To remove a kept Band Survey folder later:
  ./install.sh --purge-legacy

To roll back to Band Survey only (not recommended):
  sudo cp -a band_survey.legacy $htdocs/plugins/receiver/band_survey
  (then edit init.js: load band_survey, remove toolbox)

After restoring files, hard-refresh the receiver (Ctrl+Shift+R / Cmd+Shift+R).
Raspberry Pi images: sudo systemctl restart varnish nginx
EOF
}

resolve_htdocs_or_die() {
  if [[ "$(detect_os_kind)" == "macos" && -z "${OWRX_HTDOCS:-}" ]]; then
    die "You are on macOS without OWRX_HTDOCS set.
Toolbox installs onto the machine that RUNS OpenWebRX+ (usually a Pi or Linux server).

  1. SSH to the Pi/server:  ssh user@your-radio-host
  2. git clone ... && cd owrx-band-survey && ./install.sh
  3. On your Mac browser: open the receiver page, Cmd+Shift+R, click Toolbox

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
}

# Backup + purge old Band Survey only (no Toolbox file copy). Useful mid-upgrade.
run_purge_legacy() {
  resolve_htdocs_or_die
  RX="$HTDOCS/plugins/receiver"
  INIT="$RX/init.js"

  mkdir -p "$BACKUP"
  say "Backup folder: $BACKUP"
  copy_if "$INIT" "$BACKUP/init.js" || say "  (no init.js yet)"
  if [[ -d "$RX/band_survey" ]]; then
    cleanup_plugin_junk "$RX/band_survey"
    copy_if "$RX/band_survey" "$BACKUP/band_survey.legacy" || true
  fi
  write_restore "$HTDOCS" "$INIT"
  purge_legacy_band_survey "$RX" || true
  # If Toolbox files already exist, keep/ensure loader; do not invent a half install.
  if [[ -f "$RX/toolbox/toolbox.js" ]]; then
    append_load_line "$INIT"
    chmod_world_readable "$INIT"
  fi
  say ""
  if legacy_band_survey_present "$RX"; then
    die "Legacy Band Survey still present after purge - fix permissions and re-run."
  fi
  say "Legacy purge finished. Backup: $BACKUP"
  say "Next: ./install.sh   (fresh Toolbox)   or   ./install.sh --check"
}

run_install() {
  need_src

  INTERACTIVE_WIZARD=0
  if [[ -t 0 ]]; then
    INTERACTIVE_WIZARD=1
  fi

  # Remember CLI locks so Back does not override --personal / --public / --*-legacy
  PUBLIC_FROM_CLI=0
  [[ "$PUBLIC_SET" -eq 1 ]] && PUBLIC_FROM_CLI=1
  PROFILE_FROM_CLI=0
  [[ "$PROFILE" != "auto" ]] && PROFILE_FROM_CLI=1
  LEGACY_FROM_CLI=0
  case "$LEGACY_POLICY" in remove|keep) LEGACY_FROM_CLI=1 ;; esac

  # Resolve htdocs early so legacy detection works in the wizard
  resolve_htdocs_or_die
  RX="$HTDOCS/plugins/receiver"
  INIT="$RX/init.js"
  DEST="$RX/toolbox"

  local step=1
  local st=0
  local need_legacy=0
  if legacy_band_survey_present "$RX"; then
    need_legacy=1
  fi

  if [[ "$INTERACTIVE_WIZARD" -eq 1 ]]; then
    while true; do
      case "$step" in
        1)
          step_banner 1 "$WIZARD_STEPS" "Welcome"
          if detect_ui; then
            ui_welcome; st=$?
          else
            say "OpenWebRX Toolbox installer - press Enter to continue (q to quit)."
            read -r _ans || _ans=""
            case "${_ans}" in q|Q) st=1 ;; *) st=0 ;; esac
          fi
          case "$st" in
            0) step=2 ;;
            *) die "Aborted - no changes made." ;;
          esac
          ;;
        2)
          step_banner 2 "$WIZARD_STEPS" "Setup type"
          if [[ "$PROFILE_FROM_CLI" -eq 1 ]]; then
            say "Setup type locked from command line: $(profile_label "$PROFILE")"
            step=3
            continue
          fi
          pick_profile_interactive; st=$?
          case "$st" in
            0)
              [[ "$PROFILE" == "auto" ]] && PROFILE="$(auto_profile)"
              step=3
              ;;
            2) step=1 ;;
            *) die "Aborted - no changes made." ;;
          esac
          ;;
        3)
          step_banner 3 "$WIZARD_STEPS" "Who uses this receiver?"
          if [[ "$PUBLIC_FROM_CLI" -eq 1 ]]; then
            say "Audience locked from command line: $([[ "$PUBLIC" == 1 ]] && echo public || echo personal)"
            if [[ "$need_legacy" -eq 1 && "$LEGACY_FROM_CLI" -eq 0 ]]; then
              step=4
            else
              step=5
            fi
            continue
          fi
          pick_audience_interactive; st=$?
          case "$st" in
            0)
              if [[ "$need_legacy" -eq 1 && "$LEGACY_FROM_CLI" -eq 0 ]]; then
                step=4
              else
                step=5
              fi
              ;;
            2)
              if [[ "$PROFILE_FROM_CLI" -eq 1 ]]; then
                step=1
              else
                step=2
              fi
              ;;
            *) die "Aborted - no changes made." ;;
          esac
          ;;
        4)
          step_banner 4 "$WIZARD_STEPS" "Older plugin"
          if [[ "$need_legacy" -eq 0 || "$LEGACY_FROM_CLI" -eq 1 ]]; then
            [[ "$LEGACY_FROM_CLI" -eq 1 ]] && say "Legacy policy locked from command line: $LEGACY_POLICY"
            step=5
            continue
          fi
          LEGACY_POLICY="ask"
          resolve_legacy_policy "$RX"; st=$?
          case "$st" in
            0) step=5 ;;
            2)
              if [[ "$PUBLIC_FROM_CLI" -eq 1 ]]; then
                if [[ "$PROFILE_FROM_CLI" -eq 1 ]]; then
                  step=1
                else
                  step=2
                fi
              else
                step=3
              fi
              ;;
            *) die "Aborted - no changes made." ;;
          esac
          ;;
        5)
          step_banner 5 "$WIZARD_STEPS" "Confirm"
          show_confirm_summary "$HTDOCS" "$RX"; st=$?
          case "$st" in
            0) break ;;
            2)
              if [[ "$need_legacy" -eq 1 && "$LEGACY_FROM_CLI" -eq 0 ]]; then
                step=4
              elif [[ "$PUBLIC_FROM_CLI" -eq 0 ]]; then
                step=3
              elif [[ "$PROFILE_FROM_CLI" -eq 0 ]]; then
                step=2
              else
                step=1
              fi
              ;;
            *) die "Aborted - no changes made." ;;
          esac
          ;;
        *) die "Internal wizard error (step=$step)" ;;
      esac
    done
  else
    if [[ "$PROFILE" == "auto" ]]; then
      PROFILE="$(auto_profile)"
    fi
    pick_audience_interactive
    if [[ "$LEGACY_POLICY" == "ask" ]] && legacy_band_survey_present "$RX"; then
      resolve_legacy_policy "$RX" || true
    fi
    show_confirm_summary "$HTDOCS" "$RX" || true
  fi

  say "OpenWebRX Toolbox installer"
  say "Setup profile: $(profile_label "$PROFILE")"
  if [[ "$PUBLIC" == 1 ]]; then
    say "Mode: public / shared (visitors cannot tick Own radio - fast hops)"
  else
    say "Mode: personal / owner-only"
  fi
  say "Plugin source: $SRC"
  say ""

  step_banner 6 "$WIZARD_STEPS" "Installing..."
  if ! preflight_install "$HTDOCS" "$DEST" "$INIT"; then
    show_install_failure "${INSTALL_FAIL_MSG:-Preflight checks failed.}"
    exit 1
  fi

  mkdir -p "$BACKUP"
  say "Backup folder: $BACKUP"
  copy_if "$INIT" "$BACKUP/init.js" || say "  (no init.js yet - OK on first plugin install)"
  if [[ -d "$DEST" ]]; then
    cleanup_plugin_junk "$DEST"
    copy_if "$DEST" "$BACKUP/toolbox.prev" || true
  fi
  if [[ -d "$RX/band_survey" ]] || legacy_band_survey_present "$RX"; then
    say "Older Band Survey detected - backing up first..."
    if [[ -d "$RX/band_survey" ]]; then
      cleanup_plugin_junk "$RX/band_survey"
      copy_if "$RX/band_survey" "$BACKUP/band_survey.legacy" || true
    fi
  fi
  copy_if /var/lib/openwebrx/bookmarks.json "$BACKUP/bookmarks.json" || \
    warn "Could not read /var/lib/openwebrx/bookmarks.json (permissions)."
  copy_if /var/lib/openwebrx/settings.json "$BACKUP/settings.json" || \
    warn "Could not read settings.json (OK - plugin does not rewrite it)."
  write_restore "$HTDOCS" "$INIT"
  say "Wrote $BACKUP/RESTORE.txt"

  if ! handle_legacy_band_survey "$RX"; then
    show_install_failure "Legacy Band Survey cleanup failed - check permissions on $RX"
    exit 1
  fi

  sudo_mkdir "$RX"
  sudo_mkdir "$DEST"
  cleanup_plugin_junk "$DEST"

  SRC_ABS="$(readlink -f "$SRC" 2>/dev/null || realpath "$SRC" 2>/dev/null || echo "$SRC")"
  DEST_ABS="$(readlink -f "$DEST" 2>/dev/null || realpath "$DEST" 2>/dev/null || echo "$DEST")"
  if [[ "$SRC_ABS" == "$DEST_ABS" ]]; then
    say "Already running from the live plugin folder - skipping file copy (re-verify / legacy handle only)."
    if [[ "$PUBLIC" == 1 ]]; then
      JS_TMP="$(mktemp)"
      sed 's/var TOOLBOX_ALLOW_OWNER_OVERRIDE = true;/var TOOLBOX_ALLOW_OWNER_OVERRIDE = false;/' \
        "$SRC/toolbox.js" >"$JS_TMP"
      sudo_cp "$JS_TMP" "$DEST/toolbox.js"
      rm -f "$JS_TMP"
      say "Applied --public lock to toolbox.js"
    fi
  else
    JS_FROM="$SRC/toolbox.js"
    JS_TMP=""
    if [[ "$PUBLIC" == 1 ]]; then
      JS_TMP="$(mktemp)"
      sed 's/var TOOLBOX_ALLOW_OWNER_OVERRIDE = true;/var TOOLBOX_ALLOW_OWNER_OVERRIDE = false;/' \
        "$SRC/toolbox.js" >"$JS_TMP"
      JS_FROM="$JS_TMP"
    fi
    sudo_cp "$JS_FROM" "$DEST/toolbox.js"
    rm -f "$JS_TMP"
    sudo_cp "$SRC/toolbox.css" "$DEST/toolbox.css"
    [[ -f "$SRC/README.md" ]] && sudo_cp "$SRC/README.md" "$DEST/README.md" || true
    [[ -f "$SRC/LICENSE" ]] && sudo_cp "$SRC/LICENSE" "$DEST/LICENSE" || true
    [[ -f "$SRC/install.sh" ]] && sudo_cp "$SRC/install.sh" "$DEST/install.sh" || true
    say "Copied plugin into $DEST"
  fi
  chmod +x "$DEST/install.sh" 2>/dev/null || sudo chmod +x "$DEST/install.sh" 2>/dev/null || true
  fix_plugin_readable "$DEST"
  cleanup_plugin_junk "$DEST"

  strip_legacy_band_survey_loads "$INIT"
  for stray in \
    "$RX/toolbox/band_survey.js" \
    "$RX/toolbox/band_survey.css" \
    "$RX/toolbox/band_survey.js.tmp"
  do
    [[ -e "$stray" ]] || continue
    force_rm_path "$stray" "mixed band_survey file inside toolbox/"
  done
  if [[ "$LEGACY_POLICY" == "remove" ]]; then
    remove_legacy_band_survey_files "$RX"
  fi
  append_load_line "$INIT"
  chmod_world_readable "$INIT"
  verify_plugin_world_readable "$DEST" "$INIT" || true

  if init_loads_band_survey "$INIT"; then
    warn "init.js still loads band_survey - edit $INIT so only toolbox loads"
  elif legacy_band_survey_files_present "$RX"; then
    say "Band Survey files kept on disk; only Toolbox loads (recommended long-term: --purge-legacy)."
  else
    say "Clean install: Toolbox only (recommended)."
  fi

  if [[ "$PROFILE" == "pi" ]] || systemctl is-active --quiet varnish 2>/dev/null; then
    if command -v systemctl >/dev/null 2>&1; then
      say "Restarting varnish/nginx (Pi image cache)..."
      sudo systemctl restart varnish nginx 2>/dev/null || warn "Could not restart varnish/nginx - run manually if Toolbox missing in browser"
    fi
  fi

  if [[ "$WRITE_REPORT" == 1 ]]; then
    say ""
    say "Running post-install diagnostics..."
    run_diagnostics
    cp -a "$REPORT_FILE" "$BACKUP/diagnostic-report.txt" 2>/dev/null || true
  fi

  step_banner 6 "$WIZARD_STEPS" "Done!"
  say ""
  say "Install finished."
  say "  Backup:  $BACKUP"
  say "  Plugin:  $DEST"
  say "  Loader:  $INIT"
  show_report_path
  show_install_success "$DEST" "$PROFILE"
  say ""
  say "Verify later:  ./install.sh --check"
  say "Report only:   ./install.sh --report"
}

usage() {
  say "OpenWebRX Toolbox installer"
  say ""
  say "  ./install.sh                    Install Toolbox (blue-screen wizard when interactive)"
  say "  ./install.sh --personal         Personal / owner-only (default if non-interactive)"
  say "  ./install.sh --public           Public shared receiver (lock fast hops)"
  say "  ./install.sh --no-tui           Plain-text prompts (no dialog/whiptail)"
  say "  ./install.sh --check            Verify + write diagnostic report"
  say "  ./install.sh --report           Diagnostic report only"
  say "  ./install.sh --remove-legacy    Delete old band_survey on install  * recommended"
  say "  ./install.sh --keep-legacy      Keep band_survey on disk; only Toolbox loads"
  say "  ./install.sh --purge-legacy     Remove old band_survey only (backup first)"
  say "  ./install.sh --profile TYPE     pi | debian | docker | mac-browser | auto"
  say ""
  say "Recommended: Toolbox only. It includes every Band Survey feature and many more."
  say "Do not load band_survey and toolbox together - they clash in the browser."
  say "Keeping Band Survey on disk is optional (rollback); init.js still loads Toolbox only."
  say ""
  say "Reports: $REPORT_ROOT/toolbox-report-*.txt"
  say "Env:     OWRX_HTDOCS  OWRX_REPORT_DIR  OWRX_BACKUP_DIR  OWRX_PROFILE"
  say "         OWRX_LEGACY=ask|remove|keep  OWRX_PUBLIC=0|1"
}

# --- parse args ---
ARGS=("$@")
idx=0
while [[ $idx -lt ${#ARGS[@]} ]]; do
  arg="${ARGS[$idx]}"
  case "$arg" in
    --check|check) MODE="check" ;;
    --report|report) MODE="report" ;;
    --purge-legacy|purge-legacy|purge) MODE="purge"; LEGACY_POLICY="remove" ;;
    --remove-legacy|remove-legacy|replace-legacy) LEGACY_POLICY="remove" ;;
    --keep-legacy|keep-legacy|coexist) LEGACY_POLICY="keep" ;;
    --public|public) PUBLIC=1; PUBLIC_SET=1 ;;
    --personal|personal|private) PUBLIC=0; PUBLIC_SET=1 ;;
    --no-tui|no-tui) NO_TUI=1 ;;
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
  purge)  run_purge_legacy ;;
  *)      run_install ;;
esac
