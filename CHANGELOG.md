# Changelog

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
