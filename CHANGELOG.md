# Changelog

## [428] — Hardware gain Extra on by default

- Settings → Extras → **Explore · hardware gain (always show)** defaults **on** (and one-time promote for existing installs).

## [427] — Hardware gain auto for all SDRs

- Explore → Receiver **hardware gain** auto-shows for any detected SDR (RTL, SDRplay/RSP, HackRF, Airspy, Lime, Soapy, …), not only RTL/RSP.
- HackRF / Airspy / Lime: **Manual** overall gain plus **Stages** (LNA/VGA/…) when OpenWebRX exposes them.
- Extra **Explore · hardware gain (always show)** only forces a preview when no device/profile is detected.

## [426] — RTL hardware gain in Explore (same as RSP)

- **RTL-SDR** (and RTL Soapy / rtl_tcp): **RTL gain** Auto/Manual appears automatically in Explore → Receiver.
- Extra renamed to **Explore · hardware gain (always show)** (old RSP tick still migrates). Force-shows preview on other SDRs.
- SDRplay still auto-shows **RSP gain** (RF + IF).

## [425] — Auto-show RSP gain on SDRplay

- **Explore → Receiver → RSP gain** appears automatically when the active SDR is detected as SDRplay / RSP.
- Settings Extra **Explore · RSP gain (always show)** (default off) forces the block on other SDRs for preview.

## [424] — RSP gain preview: RF slider + IF Auto

- Preview mode (non‑SDRplay) lets you move **RF** and switch IF **Auto / Manual**; changes are not saved.
- IF mode label is **Auto** (hardware AGC). RF has no Auto — OpenWebRX only exposes RF gain reduction.
- Fixed a bug where preview disabled RF while still enabling the IF slider for admins.

## [423] — Settings toggle for Explore RSP gain

- New Extra **Explore · RSP gain** (default **off**) under Settings → Extras → Listening.
- When on, **Explore → Receiver** shows the **RSP gain** block (RF / IF). On non‑SDRplay SDRs it is a preview; on RSP + admin it loads/saves the profile.

## [422] — Explore: RSP RF / IF gain (SDRplay)

- **Explore → Receiver** shows **RSP gain** when the active SDR is SDRplay / RSP (device id or ~8 MHz+ span heuristic).
- **RF gain reduction** and **IF gain** (AGC or manual) load from the OpenWebRX profile admin form and save back on change (admin login required).
- Matches OpenWebRX field names (`rfgain_sel`, `rf_gain-select` / `rf_gain-manual`, or `RFGR=` / `IFGR=` Soapy strings).

## [421] — Settings tab always visible (admin unlock hint)

- **Settings** stays in the Toolbox header for everyone (no more “missing tab”).
- Without an OpenWebRX admin session, the pane shows how to log in and unlock; editing stays admin-only.

## [420] — Wider Passes field

- Bands / Range **Passes** input is wider so values like **1000** are fully visible.

## [419] — Band / Range Passes up to 1000

- **Passes** on Bands and Range accept **1–1000** (was capped at 100).
- Saved Passes value reloads fine; long runs can add more peaks — use **Max peaks** / **Keep peaks between sessions** if the Peaks tab gets heavy.

## [418] — Check install: only Toolbox / OpenWebRX

- Settings → Check install no longer reports other plugins as missing optional extras.
- Help / README no longer list third-party plugins by name.

## [417] — Version badge left of Help

- Header order: **vNNN** · **?** · **%** · **M** …

## [416] — Install check shows latest available version

- Settings → Install check compares **This install** to **Latest available** (GitHub / radio).
- Download button label includes the latest version (e.g. Download latest (v416)).

## [415] — Show Toolbox version in header and Install check

- Header: **vNNN** next to Help (**?**), before **%** / **M**.
- Settings → Install check: shows the running build (e.g. This install: **v415**).

## [414] — Forward setFrequency snap flag

- Toolbox `UI.setFrequency` wrap now passes `snap` through to OpenWebRX (Band Tune ± / exact dial were being force-snapped).

## [413] — Explore layout: no overlap + Wide/Half

- Restored shortest-column packing so Explore boxes no longer overlap.
- Replaced the tiny corner grip with a clear **Wide** / **Half** button on each box header.
- Wide boxes take a full-width row; half boxes snap under neighbours in columns.

## [412] — Explore drag, resize, and snap

- Explore boxes (except pinned Tune) can be drag-reordered and resized by column span (1 / 2 / full).
- Layout snaps into a dense grid so neighbours fill gaps; prefs persist (`owrx_toolbox_ex_layout_v1`).
- Wider / full-span boxes grow faders; panel side-% and undock dens still scale content.
- Settings → Panel layout: **Reset Explore layout**.

## [411] — Wider Explore slider boxes

- Explore layout keeps fewer, wider columns (side dock never 3-up) so boxes with range sliders stay usable.
- SQL / NR / waterfall / opacity faders use the full box width instead of a squashed inline track.

## [410] — Honor Open panel on startup

- **Open panel on startup** now controls whether Toolbox opens on load, including when side dock is on (side dock is layout-only).
- Closed + side dock no longer leaves a blank dock column or force-reopens the panel on boot.

## [409] — Side-dock reopen fix

- Closing Toolbox with × then reopening from the top-bar icon no longer leaves an empty light column when side dock is on (toggle no longer races `makePanel()` auto-open).
- Repo layout: Band Survey files live only under `legacy/band_survey/` (removed duplicate root `band_survey.*` and root `screenshot.png`).

## [408] — Admin probe after first paint

- Probe OpenWebRX `/settings` only after the panel exists so first paint is not blocked or blanked.

## [407] — Public mode via stock admin Settings

- README + Help: turn public on/off in OpenWebRX **Settings → General → Toolbox: public / shared receiver mode** (admin password).
- Toolbox **Settings** tab is admin-only; guests never see it.
- `install.sh --public` / `--personal` also write `toolbox_public_mode` into `settings.json` when writable.
- `./install.sh --check` reports the stock `toolbox_public_mode` value.

## [406] — Admin-gated Settings + stock General switch (server)

- OpenWebRX General checkbox `toolbox_public_mode` (when host is patched) drives public mode for all visitors.
- Toolbox Settings / visitor allowlist require an OpenWebRX admin session.

## [405] — OpenWebRX Toolbox (public release)

- First public **OpenWebRX Toolbox** release on this repo (plugin id `toolbox`).
- Explore side-% pack fix; mute-when-changing-tab setting; Help/README aligned.
- Band Survey **v127** kept under `legacy/band_survey/`; older builds via GitHub tags/Releases.

## [404] — OpenWebRX Toolbox (prep)

- README + in-panel Help aligned for public GitHub (Toolbox naming, mute-when-tab setting, versions).
- Band Survey **v127** kept for download under `legacy/band_survey/`.
- Softened `magic_key` comment (optional OpenWebRX+ override, not homelab-only).

## [403] — Mute when changing tab

- Settings → Appearance → **Mute when changing tab** (default **on**, stock hush behaviour).
- Works with `owrx_hush` / `owrx_quiet` v5 preference flag.

## [~173–402] — Toolbox era (local / homelab)

Major growth after Band Survey: Explore, Audio archive, Extras, public allowlist, side dock,
Bands edit/packs, Analyzer, UX feel, personal defaults, and many UX fixes. See git history
and in-panel Help for detail.

## [127] — Last Band Survey (`band_survey`)

- Digi/FT8, day/night, heatmap, share/scanner extras on existing tabs.
- Frozen in this repo under `legacy/band_survey/` for people who still want it.

## [110] — Band Survey

- Channel grid step/offset presets.

## [97] — Band Survey

- Fix init crash (`TAB_IDS`) that hid the Survey button in v91–v96.
