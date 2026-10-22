# Release checklist — OpenWebRX Toolbox

Publish on the **same** GitHub repo (`G4EA5/openwebrx-toolbox`).

## Every Toolbox release

1. Bump **`Plugins.toolbox._version`** in `toolbox.js`, then update **all** published version
   strings in the same commit (do not ship code without docs):
   - **`CHANGELOG.md`** — new `## [Bnnn]` section at the top (operator-facing bullets).
   - **`README.md`** — title line `# OpenWebRX Toolbox (vBnnn)`.
   - **`docs/WHATS-NEW-SINCE-V965.md`** — intro, version table, CDN pin, **Recent** bullet.
   - **`docs/troubleshooting.md`** — when the fix changes behaviour users hit (SDR, Settings, …).
   - Grep the repo for the **previous** build id (`B174`, `vB174`, `toolbox-vB174`, …) and fix stragglers.
   - In-panel **Help** uses `_version` from JS automatically; no separate Help file.
   - Optional: `docs/CHANGES-v440-to-v671.md` only for historical milestones (see that file).
2. Smoke-test: every header tab opens; section **?** buttons pop help; hover tips on a few controls per tab; Scan skips on Skip + Range; More visible by default.
3. Commit on `main`. Before push, run **`./verify-publish-tree.sh`** (or **`./publish-main.sh`**, which runs it).  
   **Belongs on GitHub:** `toolbox.js`, `toolbox.css`, `README.md`, `CHANGELOG.md`, `LICENSE`, `docs/`, `tools/` (stubs + callsign build + proxy), `legacy/`, `v440/`, screenshots.  
   **Never commit:** `install.sh`, `.toolbox-versions/`, `scripts/` (homelab deploy), root `callsign-allocations.json`, `.cursor/`, homelab paths, marketplace/personal exports — see `.gitignore`.
4. Push (`./publish-main.sh` or `git push origin main`).
5. Tag **`toolbox-vNNN`** or letter-era **`toolbox-vB5`** (numeric through **v965**, then
   **vB1**…) on that commit and push the tag.
6. Create a GitHub **Release** for that tag — attach a zip of
   `toolbox.js` + `toolbox.css` + `README.md` (+ `LICENSE` if you like).
   Ship only those files. **Manual install only** (edit `init.js` — CDN or local copy).
7. Older tags/releases stay on the Releases page forever. **v440** also lives in [`v440/`](v440/) on `main`.

## Band Survey archive tags (one-time / as needed)

- `band-survey-v110` → commit that shipped Band Survey v110
- `band-survey-v127` → last Band Survey before Toolbox

## Repo display (optional)

- Description: `OpenWebRX Toolbox — band/range survey plugin for OpenWebRX+ (formerly Band Survey)`
- Topics: `openwebrx`, `sdr`, `hackrf`, `rtl-sdr`, `plugin`
