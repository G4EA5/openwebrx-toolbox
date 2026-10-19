# Release checklist — OpenWebRX Toolbox

Publish on the **same** GitHub repo (`G4EA5/openwebrx-toolbox`).

## Every Toolbox release

1. Bump `Plugins.toolbox._version` and Help/README version strings (see `docs/CHANGES-v440-to-v960.md`).
2. Smoke-test: every header tab opens; section **?** buttons pop help; hover tips on a few controls per tab; Scan skips on Skip + Range; More visible by default.
3. Commit on `main`, push.
4. Tag **`toolbox-vNNN`** or letter-era **`toolbox-vB5`** (numeric through **v965**, then
   **vB1**…) on that commit and push the tag.
5. Create a GitHub **Release** for that tag — attach a zip of
   `toolbox.js` + `toolbox.css` + `README.md` (+ `LICENSE` if you like).
   Ship only those files. **Manual install only** (edit `init.js` — CDN or local copy).
6. Older tags/releases stay on the Releases page forever. **v440** also lives in [`v440/`](v440/) on `main`.

## Band Survey archive tags (one-time / as needed)

- `band-survey-v110` → commit that shipped Band Survey v110
- `band-survey-v127` → last Band Survey before Toolbox

## Repo display (optional)

- Description: `OpenWebRX Toolbox — band/range survey plugin for OpenWebRX+ (formerly Band Survey)`
- Topics: `openwebrx`, `sdr`, `hackrf`, `rtl-sdr`, `plugin`
