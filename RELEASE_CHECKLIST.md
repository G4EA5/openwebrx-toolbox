# Release checklist — OpenWebRX Toolbox

Publish on the **same** GitHub repo (`G4EA5/openwebrx-toolbox`).

## Every Toolbox release

1. Bump `Plugins.toolbox._version` and Help/README version strings.
2. Commit on `main`, push.
3. Tag **`toolbox-vNNN`** (e.g. `toolbox-v405`) on that commit and push the tag.
4. Create a GitHub **Release** for that tag — attach a zip of
   `toolbox.js` + `toolbox.css` + `install.sh` + `README.md`.
5. Older tags/releases stay on the Releases page forever (v405 still downloadable at v500).

## Band Survey archive tags (one-time / as needed)

- `band-survey-v110` → commit that shipped Band Survey v110
- `band-survey-v127` → last Band Survey before Toolbox

## Repo display (optional)

- Description: `OpenWebRX Toolbox — band/range survey plugin for OpenWebRX+ (formerly Band Survey)`
- Topics: `openwebrx`, `sdr`, `hackrf`, `rtl-sdr`, `plugin`
