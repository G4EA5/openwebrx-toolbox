# Toolbox changes: GitHub v440 → v960

**From:** GitHub tag [`toolbox-v440`](https://github.com/G4EA5/openwebrx-toolbox/releases/tag/toolbox-v440)  
**To:** **v962** (homelab / working tree; publish as `toolbox-v962` when ready — docs pass after feature freeze at ~v960)

Per-version notes for **every** build **v440–v962** live in root [`CHANGELOG.md`](../CHANGELOG.md) (recovered from migration comments, archives, and prior notes).  
Earlier draft covering only through v671: [`CHANGES-v440-to-v671.md`](CHANGES-v440-to-v671.md) (kept for history).

## Size (approx.)

| | v440 | v960 |
| --- | ---: | ---: |
| `toolbox.js` | ~26k lines / ~1.1 MB | ~50k lines / ~2 MB |
| `toolbox.css` | ~142 KB | ~220 KB+ |
| Header tabs | Explore…Settings (no Log/Watch/More/Identify as first-class on by default) | Full strip including Log, Watch, More (on by default), Analyzer & Identify on by default |

## Thematic summary

### New tabs & sections

- **Identify** — heuristic signal-type guesses (not callsigns); Live / Identify now; optional DIY LLM URL Extra; on by default under Visible tabs.
- **Log** — decoder feed, QSO pad (ADIF), callsign list with lookup.
- **Watch** — alert on callsign / flight / ship / talkgroup in new Log lines; Groups (HF/Digi/Air/Marine/VHF/UHF arm on↔off); Snooze.
- **More** — DX cluster + Satellites (Doppler follow); on by default; sits between Skip and Set.

### Explore

- Free-layout boxes (drag title / resize edges); Tune pinned with frequency, audio FFT scope, analogue S-meter (corner dB / S9 labels).
- Nest scan, Jump loudest (off on WFM unless experimental Extra), Reject birdie, OWRX/Ch step chip, hardware gain, Shot waterfall PNG.
- Content-hug free boxes (no blank band under PROFILE/SPAN).

### Bands

- Sub-tabs: list · beacons · solar · today · edit · schedule · packs.
- Band list is presets + tick list only (scroll for every profile); double-click opens band; column sort.
- Scan options (dwell / Jump loudest per band span); import/export profiles; packs with Direct Sampling rules for RTL.
- **Scan skips** moved off the list → **Skip** tab (and Range).

### Range

- One pane (no Spectrum sub-tab): Frequency, scan modes (full / ticked bands / Jump loudest / choose profile), hop & grid, scan skips, spectrum chart at bottom + optional history.

### Analyzer / Identify / Jump

- Analyzer & Identify on by default; movable boxes; Jump tuning Extra; FM Jump experimental (off by default).

### Bookmarks / Audio / Skip / Peaks

- Bookmark colours documented (yellow/green/blue vs Local/`[load]`).
- Audio list / record / filters; optional STT webhook Extra.
- Skip: always-skip, lockouts, **Scan skips** (digital bookmarks + block MHz).
- Peaks table, heatmap Extra, exports.

### Settings / public / UX

- Visible tabs (More/Analyzer/Identify on by default); Public / shared receiver + visitor allowlist; panel scale (default 100%); UX feel overlays; Factory reset; Check install → GitHub (no zip).
- Help `?` on every boxed section + sub-tab bar; hover tips on controls.

### Docs & install

- Manual install only (no public installer). README + in-panel Help kept in sync with this build.
- Raspberry Pi / small-PC guidance; legal notice for Identify LLM / Audio STT DIY hooks.

## Ready to publish checklist

See [`RELEASE_CHECKLIST.md`](../RELEASE_CHECKLIST.md). Tag **`toolbox-v960`** (or the bumped build you ship) after a hard-refresh smoke test on a live OpenWebRX+ receiver.
