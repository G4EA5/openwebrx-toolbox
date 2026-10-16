# Changelog

## [965] — v440 folder on GitHub; scrub installer mentions

- Frozen **v440** snapshot in [`v440/`](v440/) (`toolbox.js` + `toolbox.css` + README) so people can download that build from `main`.
- Removed remaining installer-script wording from README, Help, docs, CHANGELOG history notes, and legacy Band Survey strings.
- CDN pin: `…@main/v440/toolbox.js` (also still via tag `toolbox-v440`).

## [964] — Manual install docs front and centre

- README leads with **Manual install — there is no installer** (CDN one-liner + local copy link).
- Install section: checklist, where to find `init.js`, full `(async () => …)()` snippets for CDN and local.
- In-panel Help → Install matches (no installer, no zip; link to README).

## [963] — Help follow-up from pre-release audit

- Explore **?** intros for Hop, Tuner gain, Layout, On this frequency, Recent tunes; Audio **Filters** in Help; Scan skips copy covers bookmark-scan MHz blocks; Find Search gets a hover title.

Complete **per-version** notes from **v440** through **v963**. Sources: Cursor local history of this file, live/staging `CHANGELOG.md`, [`docs/CHANGES-v440-to-v671.md`](docs/CHANGES-v440-to-v671.md), `/* vNNN */` migration comments in `toolbox.js`, and archived builds in `.toolbox-versions/`. Gaps with no surviving note are marked honestly rather than inventing features.

Thematic overview: [`docs/CHANGES-v440-to-v960.md`](docs/CHANGES-v440-to-v960.md).

## [962] — Last pre-release help intros

- Box ? intros for Presets, Record, and Scan options (were falling back to a generic line).

## [961] — Pre-release docs + help pass

- README and Help updated for post-v440 features (Log / Watch / More, Skip scan skips, free Explore layout, tab order).
- New docs/CHANGES-v440-to-v960.md; more box ? intros.

## [960] — More tab on by default

- More (DX, Satellites) shows in the header like the other main tabs; untick under Settings → Visible tabs to hide.

## [959] — Watch Groups arm buttons flip on / off

- Arm HF / Digi / … toggles that group only (no longer forces every other watch off).
- Label switches on ↔ off each press.

## [958] — More tab sits between Skip and Set

- Header order is now … Audio · Skip · More · Set.

## [957] — Watch: space under the add row

- Gap between the callsign / flight input and Pause / Sound / Desktop alert.

## [956] — Bands list is just the bands list

- Bands list is presets + tick list only.
- Scan skips moved to the Skip tab (still also on Range).

## [955] — Explore blank band was a DOM structure bug

- `#bs-ex-deck` must stay inside `.bs-ex-console` under Tune.
- `ensureExploreConsoleStructure()` re-parents Tune + deck every pack.

## [954] — Explore free boxes hug content

- Free boxes use content height with a hard max (~340px).
- 2-column content reflow on pack; wipe bloated layouts; content-hug column reseed.

## [953] — Close Explore blank band under Tune (for real)

- Free canvas is content-sized again (`min-height: 0`).
- Safe top-compact only (shift Y up; no pixel-snap resize). One-time layout wipe + dense factory reseed.

## [952] — Repair Explore free layout (undo gap-fix mess)

- Wipes corrupted Explore layouts from the v949–v951 gap experiments and reseeds a dense factory pack.
- Removes the aggressive pixel-shift / compact logic that overlapped and bloated boxes.

## [951] — Close blank band under PROFILE stats (free boxes)

- Free-layout boxes are pulled flush under Tune (%-compact + pixel snap).
- Free canvas no longer uses `min-height: 100%`, which mapped small Y% into a tall empty strip.

## [950] — Analogue S-meter labels in the corners

- **dB** sits bottom-left; **S9+…** sits bottom-right (was dB top-left, S centred).

## [949] — Close blank band under Tune (free-layout top gap)

- Free-layout boxes that sat below a blank strip are pulled up so PROFILE / HOP start under Tune.
- Canvas height no longer grows from a %→px feedback loop.

## [948] — Explore PROFILE row cannot leave a blank band

- PROFILE / SPAN / STEP / LOCK wrap inside the same tune grid as the meters.

## [947] — Explore free-layout / meter polish

- Explore free-layout and meter polish.

## [946] — Explore free-layout / meter polish

- Explore free-layout and meter polish.

## [945] — Explore free-layout / meter polish

- Explore free-layout and meter polish.

## [944] — Explore free-layout / meter polish

- Explore free-layout and meter polish.

## [943] — Explore free-layout / meter polish

- Explore free-layout and meter polish.

## [942] — Explore free-layout / meter polish

- Explore free-layout and meter polish.

## [941] — Explore free-layout / meter polish

- Explore free-layout and meter polish.

## [940] — Factory panel scale is 100%

- Factory panel scale is **100%** (90% was the old default, not a chosen size).

## [939] — Explore free-layout polish

- Explore free-layout / meter placement polish.

## [938] — Explore S-meter no longer shows NaN

- Bad / missing level samples are treated as empty (`—`) instead of printing **NaN** in the top-left dB readout.

## [937] — Step chip on its own row

- −/+ step chip on its own static row (not inside wrapping lcd-meta).

## [936] — S under the dial

- S under the dial; peak text removed (yellow needle only).

## [935] — Explore S-meter labels on the dial

- dB sits **top-left** on the gauge; **S** and **pk** sit in the **middle** of the face so they stay visible at the default 35% dock (no longer a strip under the meter that clips off).

## [934] — Explore S-meter readout stays on one line

- dB / S / pk no longer wrap when the peak hits **S9+10**, so the Tune box (and Explore) stop jumping up and down.

## [933] — ? help on every tab section and sub-tab

- Every sub-tab bar (Bands, Bookmarks, Audio, Log, Watch, More, …) gets a **?** for the active section.
- Log, Watch, DX, and Satellites panes are boxed with the same section **?** as Bands / Explore.

## [932] — Watch arm on/off + group ticks stick

- **Arm all** / **Arm HF…** labels toggle **on** ↔ **off** and the second press turns watches off.
- Group ticks use the checkbox **change** event so HF/Digi/… ticks actually save; arming a group with nothing ticked no longer silently turns everything off.

## [931] — Watch arm buttons toggle on / off

- **Arm all** and **Arm HF / Digi / …** now switch between **on** and **off** labels and actually turn watches off on the second press (they used to only arm).

## [930] — Blocked-range shading stuck empty

- First paint with a zero-width waterfall no longer caches forever; shades redraw when the canvas has a real size, and Scan skips forces a refresh after Add / Remove.

## [929] — More / Follow / blocks / Solar polish

- **More** drops the redundant intro line. Sats shows when Follow is live.
- **Follow** remembers the radio as soon as you press it, ignores late profile hops after Stop, and restores secondary demod after the mode comes back.
- **Blocked ranges** redraw when you retune, show a tip on the shade, and hide when the list is empty.
- **Solar** keeps the last reading while refreshing, and updates again while that section is open.

## [928] — Watch groups: Digi, VHF, UHF as well

- Groups were only HF, Air, and Marine. Digi, VHF, and UHF arm the same way.

## [927] — Scan skips is a thin full-width strip

- On Range (and Bands) it no longer sits in the Scan column. One short full-width row under the top boxes.

## [926] — Solar, waterfall shot, S-meter peak, audio filters, scan skips

- **Bands → Solar** sits next to Beacons. Solar flux, K, A, and the X-ray class.
- **Shot** on the Explore tune header saves a PNG of the waterfall.
- The Explore S-meter keeps a peak needle.
- **Audio → Filters** is a noise blanker, a notch, and bass / mid / treble. Off leaves the receiver audio path alone.
- **Scan skips** on Bands and Range: skip digital bookmarks, and block MHz stretches. Blocks are shaded on the waterfall and skipped by the range scan.

## [925] — More tab: DX and Satellites, off until you turn it on

- **More** is one header tab for extras, so later sections can sit underneath it. It stays hidden until Settings → Visible tabs → **More**.
- **DX** is the cluster list, now a section on that tab.
- **Sats** picks a ham satellite and can follow the Doppler shift. Follow is its own session: the radio tracks the corrected downlink while the satellite is up, and goes back when you stop or the satellite sets.

## [924] — DX cluster tab, off until you turn it on

- **DX** lists recent cluster spots. This band, all HF, or the whole cache. Click a spot to tune. Click the call for the same lookup as the FT8 window.
- The tab is hidden. Settings → Visible tabs → **DX** shows it.

## [923] — Logbook, callsigns, watch groups, snooze, known peaks

- **Log → QSO pad** is the logbook: call, RST, grid, mode, time, and MHz. Export writes ADIF. The traffic log stays the decoder feed.
- **Log → Callsigns** lists calls taken from decoder lines. Click one for the QRZCQ lookup. Click it again to tune the frequency it was heard on.
- **Watch → Groups** ticks watches into HF, Air, or Marine. Arming a group turns that set on and the others off. Pause still pauses every watch.
- **Watch → Snooze** sleeps one watch until a time. The others keep alerting.
- **Peaks → Already known** hides peaks that already match a bookmark or an always-skip.

## [922] — Beacons and Today are their own Bands sections

- They no longer sit on the band list. **Beacons** and **Today** are separate sections next to Bands list, so the tick list is not covered.

## [921] — Recent tunes list fills the box

- Stretching **Recent tunes** grows the list. The scrollbar is no longer stuck in a short strip at the top. Clear stays along the bottom.

## [920] — Bands: NCDXF beacons and today’s activity

- **Beacons** on the Bands list shows the NCDXF cycle for 20 m, 15 m, and 10 m. The callsign that should be transmitting is highlighted. Click it to open that band on CW.
- **Today** counts Log lines and Watch hits per band since local midnight, busiest first.

## [919] — Band mode keeps known data dials

- **Band mode** on a known data frequency sets that decoder (FT8, FT4, WSPR, JS8, JT65, JT9, RTTY, PSK31, SSTV, NAVTEX, fax, APRS) instead of the voice mode for the whole band.
- If that mode is already selected, Band mode leaves it alone.
- 14.074 is FT8. The wide 20 m voice choice still applies everywhere else on the band.

## [918] — Explore: on this frequency and recent tunes

- **On this frequency** sits under the other Explore boxes: bookmark, band-plan service, latest Log line here, and matching watches. Callsigns use the same lookup as the FT8 window.
- **Recent tunes** keeps the last frequencies you stayed on. Click one to go back. Separate from the twelve memory slots.

## [917] — Minimal button off until you turn it on

- The header **M** button is hidden. Settings → Appearance → **Minimal button** shows it.

## [916] — Watch export and import

- **CSV**, **JSON**, and **Import** on the Watch tab. Export saves the watches and their hits. Import merges them. Shift-click Import to paste.

## [915] — Callsign lookup from Log and Watch

- Click a callsign, flight, aircraft, ship, sonde, or locator in the Log or Watch list to open the same lookup the FT8 window uses. The rest of the line still tunes.

## [914] — Watch hit list filter

- **Only** sits between **On** and **Remove**. It limits the hit list to that watch. Click it again, or **All hits**, to show every watch.

## [913] — Watch hits no longer overlap

- Watch cards keep their full height, so hits sit under the watches instead of painting through them.
- **On** and **Remove** sit on one line.

## [912] — Bands list column sort

- Click **Id**, **Name**, **Freq**, or **Mode** on the Band list to sort. Click the same heading again to reverse. Name order is numeric (2m before 10m).

## [911] — Bands list: double-click opens the band

- Double-click a row in the Bands list to switch the radio to that band. A single click still only ticks it for Scan bands.

## [910] — Watch tab

- New **Watch** tab alerts when a callsign, flight, ship, or talkgroup shows up in the Log. Sound and an optional desktop notification. Click a hit to tune.

## [909] — Find off by default; factory reset can clear the log

- **Find in Toolbox** (header search) is off until you tick it under Settings.
- Factory reset can clear the **Log**. It is ticked with the other clear options.

## [908] — Log: import

- **Import** on the Log tab merges a previous CSV or JSON export. Times and pins are kept. Lines already in the log are skipped. Shift-click to paste.
- Log lines stay in this browser after a refresh.

## [907] — Homelab UI polish (v907)

- Small CSS/UI deploy between named features — no separate note captured for **v907**.

## [906] — Log tab

- New **Log** tab records decoder lines (FT8, APRS, AIS, ADS-B, ACARS, HFDL, paging, and other OpenWebRX message panels), strong Identify guesses, new peaks, and busy bookmark-scan stops. Search, kind filters, pin, pause, notes, CSV/JSON export, and click-to-tune.

## [905] — Range: any chosen profile can be scanned

- **Choose profile** no longer stops when Start/End is on another band. A single-frequency profile (such as 433 MHz) is scanned across its own coverage, and Start/End moves to that span.

## [904] — Bands packs: Add all missing ham is blue

- **Add all missing ham** uses the blue primary button colour.

## [903] — Bands packs: download every pack

- Bands packs **Download** lists every pack (FM, air, marine, PMR, CB, MW, and each ham band), plus **Download all** as one JSON file.

## [902] — Range: Choose profile under Jump loudest

- Range **Scan mode** lists **Choose profile** (and its profile picker) under **Jump loudest**.

## [901] — Bands edit: Up/Down works from every field

- With the edit popup open, **Arrow Up** and **Arrow Down** move to the previous or next band even when Centre MHz, sample rate, step, mode, or the note is focused. **Shift+arrow** still changes the number in that box.

## [900] — Range: Limits and Courtesy side by side

- Range tab **Limits** and **Courtesy** share one row, each half the width.

## [899] — Bands edit: Up/Down moves to the next band

- With the edit popup open, **Arrow Up** and **Arrow Down** open the previous or next band. No second click on edit. Number, step, and note fields still use those keys for themselves.

## [898] — Bands edit popup: initial, sample rate, step

- Edit popup always shows **Initial MHz**, **Sample rate**, and **Step** (they were only in the hidden full-admin block). Filled from the profile; Save writes them.
- The popup opens only from the **edit** button. Clicking the name or the rest of the row does not.

## [897] — Bands edit: profile name without the SDR prefix

- Name box uses the real profile name (ACARS), not the listbox text “- ACARS” from a device named “-”.

## [896] — Bands edit: pack profile frequency + sort

- Edit popup and the freq column use the real centre for pack profiles whose name has no MHz (list shows “- ACARS”, status.json stores “ACARS”).
- Edit bands sort buttons: **Freq**, **Name**, **Number** (OpenWebRX list order). Shown in minimal view too.

## [895] — Pi wording: browser on the same Pi

- README / Help: “browser also runs on that same Pi” (not “Pi too”, which read like Pi 2).

## [894] — Factory float Explore layout (Documents)

- Re-baked floating factory from `/home/u/Documents/owrx-explore-layout-float.json` (Radio/Find tweak).

## [893] — Factory Explore layouts from Documents exports only

- Re-baked docked factory from `/home/u/Documents/owrx-explore-layout-docked.json`; float from Documents float export.

## [892] — Factory Explore layouts from current docked/float exports

- Built-in side-docked and floating Explore box positions updated from the 2026-10-14 exports (includes Gain). Used on first install and Factory reset Explore layout.

## [891] — Revert free-box content-fit (v890)

- Removed auto-grow / max-height changes that broke the side-docked Explore layout. Docked behaviour matches pre-v890 again.

## [890] — Range scan / Nest / Explore free-box polish (v890 content-fit later reverted in v891)

- Range scan / Nest / Explore free-box polish (v890 content-fit later reverted in v891) (homelab iterate; no separate note captured for v890).

## [889] — Range scan / Nest / Explore free-box polish (v890 content-fit later reverted in v891)

- Range scan / Nest / Explore free-box polish (v890 content-fit later reverted in v891) (homelab iterate; no separate note captured for v889).

## [888] — Range scan / Nest / Explore free-box polish (v890 content-fit later reverted in v891)

- Range scan / Nest / Explore free-box polish (v890 content-fit later reverted in v891) (homelab iterate; no separate note captured for v888).

## [887] — Range scan / Nest / Explore free-box polish (v890 content-fit later reverted in v891)

- Range scan / Nest / Explore free-box polish (v890 content-fit later reverted in v891) (homelab iterate; no separate note captured for v887).

## [886] — Range scan / Nest / Explore free-box polish (v890 content-fit later reverted in v891)

- Range scan / Nest / Explore free-box polish (v890 content-fit later reverted in v891) (homelab iterate; no separate note captured for v886).

## [885] — Range scan / Nest / Explore free-box polish (v890 content-fit later reverted in v891)

- Range scan / Nest / Explore free-box polish (v890 content-fit later reverted in v891) (homelab iterate; no separate note captured for v885).

## [884] — Range scan / Nest / Explore free-box polish (v890 content-fit later reverted in v891)

- Range scan / Nest / Explore free-box polish (v890 content-fit later reverted in v891) (homelab iterate; no separate note captured for v884).

## [883] — Range scan / Nest / Explore free-box polish (v890 content-fit later reverted in v891)

- Range scan / Nest / Explore free-box polish (v890 content-fit later reverted in v891) (homelab iterate; no separate note captured for v883).

## [882] — Nest on

- Control label: Nest on.

## [881] — Nest scan on

- Control label: Nest scan on.

## [880] — Save side-docked Explore layout as default

- Turn side dock on (S), open Explore, arrange boxes, then Save as default.
- Saving Explore layout is not allowed on public receivers for guests.

## [879] — Explore layout export / side-dock defaults polish toward v880

- Explore layout export / side-dock defaults polish toward v880 (homelab iterate; no separate note captured for v879).

## [878] — Explore layout export / side-dock defaults polish toward v880

- Explore layout export / side-dock defaults polish toward v880 (homelab iterate; no separate note captured for v878).

## [877] — Explore layout export / side-dock defaults polish toward v880

- Explore layout export / side-dock defaults polish toward v880 (homelab iterate; no separate note captured for v877).

## [876] — Explore layout export / side-dock defaults polish toward v880

- Explore layout export / side-dock defaults polish toward v880 (homelab iterate; no separate note captured for v876).

## [875] — Explore layout export / side-dock defaults polish toward v880

- Explore layout export / side-dock defaults polish toward v880 (homelab iterate; no separate note captured for v875).

## [874] — Explore layout export / side-dock defaults polish toward v880

- Explore layout export / side-dock defaults polish toward v880 (homelab iterate; no separate note captured for v874).

## [873] — Explore layout export / side-dock defaults polish toward v880

- Explore layout export / side-dock defaults polish toward v880 (homelab iterate; no separate note captured for v873).

## [872] — Explore layout dock/float storage

- One-shot storage for dock-split / float Explore layout keys.

## [871] — Explore layout export / side-dock defaults polish toward v880

- Explore layout export / side-dock defaults polish toward v880 (homelab iterate; no separate note captured for v871).

## [870] — REC primary blue

- REC primary blue (was util slate in old DOM).

## [869] — REC + Explore on one row

- REC + Explore on one row; Nest / Spectrum under them.

## [868] — Explore layout reset uses personal defaults

- Explore layout reset — personal defaults if saved, else factory layout.

## [867] — Public-mode / Peaks / Explore free-layout polish toward REC row (v869)

- Public-mode / Peaks / Explore free-layout polish toward REC row (v869) (homelab iterate; no separate note captured for v867).

## [866] — Public-mode / Peaks / Explore free-layout polish toward REC row (v869)

- Public-mode / Peaks / Explore free-layout polish toward REC row (v869) (homelab iterate; no separate note captured for v866).

## [865] — Public-mode / Peaks / Explore free-layout polish toward REC row (v869)

- Public-mode / Peaks / Explore free-layout polish toward REC row (v869) (homelab iterate; no separate note captured for v865).

## [864] — Public-mode / Peaks / Explore free-layout polish toward REC row (v869)

- Public-mode / Peaks / Explore free-layout polish toward REC row (v869) (homelab iterate; no separate note captured for v864).

## [863] — Public-mode / Peaks / Explore free-layout polish toward REC row (v869)

- Public-mode / Peaks / Explore free-layout polish toward REC row (v869) (homelab iterate; no separate note captured for v863).

## [862] — Public-mode / Peaks / Explore free-layout polish toward REC row (v869)

- Public-mode / Peaks / Explore free-layout polish toward REC row (v869) (homelab iterate; no separate note captured for v862).

## [861] — Public-mode / Peaks / Explore free-layout polish toward REC row (v869)

- Public-mode / Peaks / Explore free-layout polish toward REC row (v869) (homelab iterate; no separate note captured for v861).

## [860] — Public-mode / Peaks / Explore free-layout polish toward REC row (v869)

- Public-mode / Peaks / Explore free-layout polish toward REC row (v869) (homelab iterate; no separate note captured for v860).

## [859] — Jump loudest label

- Control label: Jump loudest.

## [858] — Homelab UI polish (v858)

- Small CSS/UI deploy between named features — no separate note captured for **v858**.

## [857] — Saved as my defaults

- Saved as my defaults — settings and Explore layout.

## [856] — Settings / defaults polish toward “Saved as my defaults” (v857)

- Settings / defaults polish toward “Saved as my defaults” (v857) (homelab iterate; no separate note captured for v856).

## [855] — Settings / defaults polish toward “Saved as my defaults” (v857)

- Settings / defaults polish toward “Saved as my defaults” (v857) (homelab iterate; no separate note captured for v855).

## [854] — Explore layout import blocked on public

- Explore layout import is not allowed on this public receiver.

## [853] — Public-mode / Peaks / Explore free-layout polish toward REC row (v869)

- Public-mode / Peaks / Explore free-layout polish toward REC row (v869) (homelab iterate; no separate note captured for v853).

## [852] — Public-mode / Peaks / Explore free-layout polish toward REC row (v869)

- Public-mode / Peaks / Explore free-layout polish toward REC row (v869) (homelab iterate; no separate note captured for v852).

## [851] — Public-mode / Peaks / Explore free-layout polish toward REC row (v869)

- Public-mode / Peaks / Explore free-layout polish toward REC row (v869) (homelab iterate; no separate note captured for v851).

## [850] — Public-mode / Peaks / Explore free-layout polish toward REC row (v869)

- Public-mode / Peaks / Explore free-layout polish toward REC row (v869) (homelab iterate; no separate note captured for v850).

## [849] — Public-mode / Peaks / Explore free-layout polish toward REC row (v869)

- Public-mode / Peaks / Explore free-layout polish toward REC row (v869) (homelab iterate; no separate note captured for v849).

## [848] — Public-mode / Peaks / Explore free-layout polish toward REC row (v869)

- Public-mode / Peaks / Explore free-layout polish toward REC row (v869) (homelab iterate; no separate note captured for v848).

## [847] — Public-mode / Peaks / Explore free-layout polish toward REC row (v869)

- Public-mode / Peaks / Explore free-layout polish toward REC row (v869) (homelab iterate; no separate note captured for v847).

## [846] — Public-mode / Peaks / Explore free-layout polish toward REC row (v869)

- Public-mode / Peaks / Explore free-layout polish toward REC row (v869) (homelab iterate; no separate note captured for v846).

## [845] — Public-mode / Peaks / Explore free-layout polish toward REC row (v869)

- Public-mode / Peaks / Explore free-layout polish toward REC row (v869) (homelab iterate; no separate note captured for v845).

## [844] — Public-mode / Peaks / Explore free-layout polish toward REC row (v869)

- Public-mode / Peaks / Explore free-layout polish toward REC row (v869) (homelab iterate; no separate note captured for v844).

## [843] — Public-mode / Peaks / Explore free-layout polish toward REC row (v869)

- Public-mode / Peaks / Explore free-layout polish toward REC row (v869) (homelab iterate; no separate note captured for v843).

## [842] — Public-mode / Peaks / Explore free-layout polish toward REC row (v869)

- Public-mode / Peaks / Explore free-layout polish toward REC row (v869) (homelab iterate; no separate note captured for v842).

## [841] — Public-mode / Peaks / Explore free-layout polish toward REC row (v869)

- Public-mode / Peaks / Explore free-layout polish toward REC row (v869) (homelab iterate; no separate note captured for v841).

## [840] — Public-mode / Peaks / Explore free-layout polish toward REC row (v869)

- Public-mode / Peaks / Explore free-layout polish toward REC row (v869) (homelab iterate; no separate note captured for v840).

## [839] — Explore free-layout % frames / collapse polish

- Explore free-layout % frames / collapse polish (homelab iterate; no separate note captured for v839).

## [838] — Explore free-layout % frames / collapse polish

- Explore free-layout % frames / collapse polish (homelab iterate; no separate note captured for v838).

## [837] — Explore free-layout % frames / collapse polish

- Explore free-layout % frames / collapse polish (homelab iterate; no separate note captured for v837).

## [836] — Explore free-layout % frames / collapse polish

- Explore free-layout % frames / collapse polish (homelab iterate; no separate note captured for v836).

## [835] — Side dock default width 35%

- Side dock width — click to reset to 35% (was 30%).

## [834] — Explore free-layout canvas polish after v830

- Explore free-layout canvas polish after v830 (homelab iterate; no separate note captured for v834).

## [833] — Explore free-layout canvas polish after v830

- Explore free-layout canvas polish after v830 (homelab iterate; no separate note captured for v833).

## [832] — Explore free-layout canvas polish after v830

- Explore free-layout canvas polish after v830 (homelab iterate; no separate note captured for v832).

## [831] — Explore free-layout canvas polish after v830

- Explore free-layout canvas polish after v830 (homelab iterate; no separate note captured for v831).

## [830] — Explore free-layout canvas

- Free-placed Explore boxes on a canvas; drag/resize frames.

## [829] — Explore Profile box must exist

- Explore Profile box must exist (stack/masonry repair needs it).

## [828] — Panel boot / heavy-UI wiring polish

- Panel boot / heavy-UI wiring polish (homelab iterate; no separate note captured for v828).

## [827] — Panel boot / heavy-UI wiring polish

- Panel boot / heavy-UI wiring polish (homelab iterate; no separate note captured for v827).

## [826] — Never auto-open on page load

- Never auto-open or auto-build on page load — Toolbox button only.

## [825] — Open panel on startup stays off until re-ticked

- Off until Settings → Open panel on startup is ticked again.

## [824] — Bands import/export / header tab-size polish

- Bands import/export / header tab-size polish (homelab iterate; no separate note captured for v824).

## [823] — Bands import/export / header tab-size polish

- Bands import/export / header tab-size polish (homelab iterate; no separate note captured for v823).

## [822] — Main header tab size in Appearance

- Main header tab size control in Settings → Appearance.

## [821] — Bands edit · Sort menu

- Bands edit · Sort menu.

## [820] — Bands import/export / edit-sort polish toward v821–v822

- Bands import/export / edit-sort polish toward v821–v822 (homelab iterate; no separate note captured for v820).

## [819] — Bands import/export / edit-sort polish toward v821–v822

- Bands import/export / edit-sort polish toward v821–v822 (homelab iterate; no separate note captured for v819).

## [818] — Import/export bands beside Digi

- Import/export bands box beside Digi in scan options.

## [817] — Explore profile / zoom layout polish

- Explore profile / zoom layout polish (homelab iterate; no separate note captured for v817).

## [816] — Zoom lives under Profile

- Zoom lives under Profile — rebuild if still a separate box.

## [815] — Explore profile / zoom layout polish

- Explore profile / zoom layout polish (homelab iterate; no separate note captured for v815).

## [814] — Public mode box grouped above visitor allowlist

- Public mode box grouped above visitor allowlist.

## [813] — Bookmarks / Peaks share / public-mode polish toward v814

- Bookmarks / Peaks share / public-mode polish toward v814 (homelab iterate; no separate note captured for v813).

## [812] — Bookmarks / Peaks share / public-mode polish toward v814

- Bookmarks / Peaks share / public-mode polish toward v814 (homelab iterate; no separate note captured for v812).

## [811] — Public / shared receiver — own box below Panel startup

- Public / shared receiver — own box below Panel startup.

## [810] — Record Import + Export on one row

- Record Import + Export on one row.

## [809] — Record Play box wider; Each s beside Play all

- Record Play box wider; Each s beside Play all.

## [808] — Bookmarks / Peaks share / public-mode polish

- Bookmarks / Peaks share / public-mode polish (homelab iterate; no separate note captured for v808).

## [807] — Peaks Share — Share report beside Send to scanner (own row)

- Peaks Share — Share report beside Send to scanner (own row).

## [806] — Bookmarks legend / Find / panel scale / Peaks share polish

- Bookmarks legend / Find / panel scale / Peaks share polish (homelab iterate; no separate note captured for v806).

## [805] — Bookmarks legend / Find / panel scale / Peaks share polish

- Bookmarks legend / Find / panel scale / Peaks share polish (homelab iterate; no separate note captured for v805).

## [804] — Bookmarks legend / Find / panel scale / Peaks share polish

- Bookmarks legend / Find / panel scale / Peaks share polish (homelab iterate; no separate note captured for v804).

## [803] — Bookmarks legend / Find / panel scale / Peaks share polish

- Bookmarks legend / Find / panel scale / Peaks share polish (homelab iterate; no separate note captured for v803).

## [802] — Bookmarks legend / Find / panel scale / Peaks share polish

- Bookmarks legend / Find / panel scale / Peaks share polish (homelab iterate; no separate note captured for v802).

## [801] — Bookmarks legend / Find / panel scale / Peaks share polish

- Bookmarks legend / Find / panel scale / Peaks share polish (homelab iterate; no separate note captured for v801).

## [800] — Bookmarks legend / Find / panel scale / Peaks share polish

- Bookmarks legend / Find / panel scale / Peaks share polish (homelab iterate; no separate note captured for v800).

## [799] — Bookmarks legend / Find / panel scale / Peaks share polish

- Bookmarks legend / Find / panel scale / Peaks share polish (homelab iterate; no separate note captured for v799).

## [798] — Bookmarks legend / Find / panel scale / Peaks share polish

- Bookmarks legend / Find / panel scale / Peaks share polish (homelab iterate; no separate note captured for v798).

## [797] — Bookmarks legend / Find / panel scale / Peaks share polish

- Bookmarks legend / Find / panel scale / Peaks share polish (homelab iterate; no separate note captured for v797).

## [796] — Receiver box must contain mode / squelch / REC (not nested gain / empty grid)

- Receiver box must contain mode / squelch / REC (not nested gain / empty grid).

## [795] — Receiver box must contain mode / squelch / REC (not nested gain / empty grid)

- Receiver box must contain mode / squelch / REC (not nested gain / empty grid).

## [794] — Bookmarks / Find / panel-scale polish

- Bookmarks / Find / panel-scale polish (homelab iterate; no separate note captured for v794).

## [793] — Bookmarks / Find / panel-scale polish

- Bookmarks / Find / panel-scale polish (homelab iterate; no separate note captured for v793).

## [792] — Bookmarks / Find / panel-scale polish

- Bookmarks / Find / panel-scale polish (homelab iterate; no separate note captured for v792).

## [791] — Header scale cycle button (all tabs)

- header scale cycle button (all tabs).

## [790] — Bookmarks / Find / panel-scale polish

- Bookmarks / Find / panel-scale polish (homelab iterate; no separate note captured for v790).

## [789] — Flat panel DOM (no scale wrapper); rebuild if header/content nested wrong

- flat panel DOM (no scale wrapper); rebuild if header/content nested wrong.

## [788] — Bookmarks / Find / panel-scale polish

- Bookmarks / Find / panel-scale polish (homelab iterate; no separate note captured for v788).

## [787] — Bookmarks / Find / panel-scale polish

- Bookmarks / Find / panel-scale polish (homelab iterate; no separate note captured for v787).

## [786] — Bookmarks / Find / panel-scale polish

- Bookmarks / Find / panel-scale polish (homelab iterate; no separate note captured for v786).

## [785] — Panel scale presets only (dropdown); range slider removed

- Panel scale presets only (dropdown); range slider removed.

## [784] — Bookmarks / Find / panel-scale polish

- Bookmarks / Find / panel-scale polish (homelab iterate; no separate note captured for v784).

## [783] — Bookmarks / Find / panel-scale polish

- Bookmarks / Find / panel-scale polish (homelab iterate; no separate note captured for v783).

## [782] — Bookmarks / Find / panel-scale polish

- Bookmarks / Find / panel-scale polish (homelab iterate; no separate note captured for v782).

## [781] — Live search in Find results popup

- live search in Find results popup.

## [780] — Panel scale (whole UI zoom) replaces UI text size only

- Panel scale (whole UI zoom) replaces UI text size only.

## [779] — Bookmarks / Find / panel-scale scaffolding

- Bookmarks / Find / panel-scale scaffolding (homelab iterate; no separate note captured for v779).

## [778] — Find in Toolbox (header search)

- Find in Toolbox (header search).

## [777] — Bookmarks / Find / panel-scale scaffolding

- Bookmarks / Find / panel-scale scaffolding (homelab iterate; no separate note captured for v777).

## [776] — Bookmarks tab legend (yellow / green / blue vs Local / [load])

- Bookmarks tab legend (yellow / green / blue vs Local / [load]).

## [775] — Preset-only recording; optional Custom timing & gates

- preset-only recording; optional Custom timing & gates.

## [774] — Range hop-grid / spectrum / Audio STT placement toward preset recording (v775)

- Range hop-grid / spectrum / Audio STT placement toward preset recording (v775) (homelab iterate; no separate note captured for v774).

## [773] — Range hop-grid / spectrum / Audio STT placement toward preset recording (v775)

- Range hop-grid / spectrum / Audio STT placement toward preset recording (v775) (homelab iterate; no separate note captured for v773).

## [772] — Range hop-grid / spectrum / Audio STT placement toward preset recording (v775)

- Range hop-grid / spectrum / Audio STT placement toward preset recording (v775) (homelab iterate; no separate note captured for v772).

## [771] — Range hop-grid / spectrum / Audio STT placement toward preset recording (v775)

- Range hop-grid / spectrum / Audio STT placement toward preset recording (v775) (homelab iterate; no separate note captured for v771).

## [770] — Range hop-grid / spectrum / Audio STT placement toward preset recording (v775)

- Range hop-grid / spectrum / Audio STT placement toward preset recording (v775) (homelab iterate; no separate note captured for v770).

## [769] — Range hop-grid / spectrum / Audio STT placement toward preset recording (v775)

- Range hop-grid / spectrum / Audio STT placement toward preset recording (v775) (homelab iterate; no separate note captured for v769).

## [768] — Range hop-grid / spectrum / Audio STT placement toward preset recording (v775)

- Range hop-grid / spectrum / Audio STT placement toward preset recording (v775) (homelab iterate; no separate note captured for v768).

## [767] — Range hop-grid / spectrum / Audio STT placement toward preset recording (v775)

- Range hop-grid / spectrum / Audio STT placement toward preset recording (v775) (homelab iterate; no separate note captured for v767).

## [766] — Range hop-grid / spectrum / Audio STT placement toward preset recording (v775)

- Range hop-grid / spectrum / Audio STT placement toward preset recording (v775) (homelab iterate; no separate note captured for v766).

## [765] — Range hop-grid / spectrum / Audio STT placement toward preset recording (v775)

- Range hop-grid / spectrum / Audio STT placement toward preset recording (v775) (homelab iterate; no separate note captured for v765).

## [764] — Range hop-grid / spectrum / Audio STT placement toward preset recording (v775)

- Range hop-grid / spectrum / Audio STT placement toward preset recording (v775) (homelab iterate; no separate note captured for v764).

## [763] — Range hop-grid / spectrum / Audio STT placement toward preset recording (v775)

- Range hop-grid / spectrum / Audio STT placement toward preset recording (v775) (homelab iterate; no separate note captured for v763).

## [762] — Range hop-grid / spectrum / Audio STT placement toward preset recording (v775)

- Range hop-grid / spectrum / Audio STT placement toward preset recording (v775) (homelab iterate; no separate note captured for v762).

## [761] — Range hop-grid / spectrum / Audio STT placement toward preset recording (v775)

- Range hop-grid / spectrum / Audio STT placement toward preset recording (v775) (homelab iterate; no separate note captured for v761).

## [760] — Range hop-grid / spectrum / Audio STT placement toward preset recording (v775)

- Range hop-grid / spectrum / Audio STT placement toward preset recording (v775) (homelab iterate; no separate note captured for v760).

## [759] — Range hop-grid / spectrum / Audio STT placement toward preset recording (v775)

- Range hop-grid / spectrum / Audio STT placement toward preset recording (v775) (homelab iterate; no separate note captured for v759).

## [758] — Range hop-grid / spectrum / Audio STT placement toward preset recording (v775)

- Range hop-grid / spectrum / Audio STT placement toward preset recording (v775) (homelab iterate; no separate note captured for v758).

## [757] — Range hop-grid / spectrum / Audio STT placement toward preset recording (v775)

- Range hop-grid / spectrum / Audio STT placement toward preset recording (v775) (homelab iterate; no separate note captured for v757).

## [756] — Range hop-grid / spectrum / Audio STT placement toward preset recording (v775)

- Range hop-grid / spectrum / Audio STT placement toward preset recording (v775) (homelab iterate; no separate note captured for v756).

## [755] — Range hop-grid / spectrum / Audio STT placement toward preset recording (v775)

- Range hop-grid / spectrum / Audio STT placement toward preset recording (v775) (homelab iterate; no separate note captured for v755).

## [754] — Range hop-grid / spectrum / Audio STT placement toward preset recording (v775)

- Range hop-grid / spectrum / Audio STT placement toward preset recording (v775) (homelab iterate; no separate note captured for v754).

## [753] — Range hop-grid / spectrum / Audio STT placement toward preset recording (v775)

- Range hop-grid / spectrum / Audio STT placement toward preset recording (v775) (homelab iterate; no separate note captured for v753).

## [752] — Range hop-grid / spectrum / Audio STT placement toward preset recording (v775)

- Range hop-grid / spectrum / Audio STT placement toward preset recording (v775) (homelab iterate; no separate note captured for v752).

## [751] — Range hop-grid / spectrum / Audio STT placement toward preset recording (v775)

- Range hop-grid / spectrum / Audio STT placement toward preset recording (v775) (homelab iterate; no separate note captured for v751).

## [750] — Range hop-grid / spectrum / Audio STT placement toward preset recording (v775)

- Range hop-grid / spectrum / Audio STT placement toward preset recording (v775) (homelab iterate; no separate note captured for v750).

## [749] — Range hop-grid / spectrum / Audio STT placement toward preset recording (v775)

- Range hop-grid / spectrum / Audio STT placement toward preset recording (v775) (homelab iterate; no separate note captured for v749).

## [748] — Range hop-grid / spectrum / Audio STT placement toward preset recording (v775)

- Range hop-grid / spectrum / Audio STT placement toward preset recording (v775) (homelab iterate; no separate note captured for v748).

## [747] — Range hop-grid / spectrum / Audio STT placement toward preset recording (v775)

- Range hop-grid / spectrum / Audio STT placement toward preset recording (v775) (homelab iterate; no separate note captured for v747).

## [746] — STT webhook pinned at bottom of Audio tab (outside list/record subpanes)

- STT webhook pinned at bottom of Audio tab (outside list/record subpanes).

## [745] — Hop/grid on Scan row; Range / STT placement

- Hop/grid on Scan row; Range / STT placement (homelab iterate; no separate note captured for v745).

## [744] — Hop/grid on Scan row; Range / STT placement

- Hop/grid on Scan row; Range / STT placement (homelab iterate; no separate note captured for v744).

## [743] — Hop/grid controls on Scan row (not under Frequency)

- hop/grid controls on Scan row (not under Frequency).

## [742] — Hop/grid controls on Scan row (not under Frequency)

- hop/grid controls on Scan row (not under Frequency).

## [741] — Hop/grid controls on Scan row (not under Frequency)

- hop/grid controls on Scan row (not under Frequency).

## [740] — Hop/grid controls on Scan row (not under Frequency)

- hop/grid controls on Scan row (not under Frequency).

## [739] — Range hop-grid / spectrum placement

- Range hop-grid / spectrum placement (homelab iterate; no separate note captured for v739).

## [738] — Range spectrum is a bottom set-box, not off-screen / sub-tab

- Range spectrum is a bottom set-box, not off-screen / sub-tab.

## [737] — Homelab UI polish (v737)

- Small CSS/UI deploy between named features — no separate note captured for **v737**.

## [736] — Range is one pane — drop Spectrum sub-tab markup

- Range is one pane — drop Spectrum sub-tab markup.

## [735] — Identify profile row — select beside ◀▶ inside green Tuning box

- Identify profile row — select beside ◀▶ inside green Tuning box.

## [734] — Identify / Analyzer strip layout

- Identify / Analyzer strip layout (homelab iterate; no separate note captured for v734).

## [733] — Identify profile select full width (Tune ± in footer)

- Identify profile select full width (Tune ± in footer).

## [732] — Identify / Analyzer strip layout

- Identify / Analyzer strip layout (homelab iterate; no separate note captured for v732).

## [731] — Identify — Band mode under Mode; taller profile select

- Identify — Band mode under Mode; taller profile select.

## [730] — Identify / Analyzer strip layout

- Identify / Analyzer strip layout (homelab iterate; no separate note captured for v730).

## [729] — Hop dwell moved from Span · Live to Analyzer settings

- Hop dwell moved from Span · Live to Analyzer settings.

## [728] — Identify Tuning / Analyzer / Audio record strip layout

- Identify Tuning / Analyzer / Audio record strip layout (homelab iterate; no separate note captured for v728).

## [727] — Identify Tuning / Analyzer / Audio record strip layout

- Identify Tuning / Analyzer / Audio record strip layout (homelab iterate; no separate note captured for v727).

## [726] — Identify Tuning / Analyzer / Audio record strip layout

- Identify Tuning / Analyzer / Audio record strip layout (homelab iterate; no separate note captured for v726).

## [725] — HF preset box only — 4 bands per row (bs-sa-preset-group-hf)

- HF preset box only — 4 bands per row (bs-sa-preset-group-hf).

## [724] — Identify / Analyzer strip layout

- Identify / Analyzer strip layout (homelab iterate; no separate note captured for v724).

## [723] — Display at bottom; compact Clr/1×/Mid/Lo (bs-tiny)

- Display at bottom; compact Clr/1×/Mid/Lo (bs-tiny).

## [722] — Play voice gated under Settings → Extras (experimental)

- Play voice gated under Settings → Extras (experimental).

## [721] — Identify Tuning / Analyzer / Audio record strip layout

- Identify Tuning / Analyzer / Audio record strip layout (homelab iterate; no separate note captured for v721).

## [720] — Identify Tuning / Analyzer / Audio record strip layout

- Identify Tuning / Analyzer / Audio record strip layout (homelab iterate; no separate note captured for v720).

## [719] — Identify Tuning / Analyzer / Audio record strip layout

- Identify Tuning / Analyzer / Audio record strip layout (homelab iterate; no separate note captured for v719).

## [718] — Identify Tuning / Analyzer / Audio record strip layout

- Identify Tuning / Analyzer / Audio record strip layout (homelab iterate; no separate note captured for v718).

## [717] — Analyzer span — 3 dp + hero digits (was 6 dp number inputs)

- Analyzer span — 3 dp + hero digits (was 6 dp number inputs).

## [716] — Identify / Analyzer / Audio strip layout

- Identify / Analyzer / Audio strip layout (homelab iterate; no separate note captured for v716).

## [715] — LLM URL box under Signal metadata gate

- LLM URL box under Signal metadata gate.

## [714] — Step + Snap bottom-right of Tuning box; larger profile select

- Step + Snap bottom-right of Tuning box; larger profile select.

## [713] — Explore off/on in Capture; Spectrum under Nest scan

- Explore off/on in Capture; Spectrum under Nest scan.

## [712] — Identify Tuning / Analyzer / Audio record strip layout

- Identify Tuning / Analyzer / Audio record strip layout (homelab iterate; no separate note captured for v712).

## [711] — Band mode chip in Receiver mode row (beside HDR)

- Band mode chip in Receiver mode row (beside HDR).

## [710] — Clip rows scroll in the Audio list subpane

- clip rows scroll in the Audio list subpane (no nested Audio clips box).

## [709] — Identify Tuning / Analyzer / Audio record strip layout

- Identify Tuning / Analyzer / Audio record strip layout (homelab iterate; no separate note captured for v709).

## [708] — Record demod full-width strip — Record · bookmark · limits one line

- Record demod full-width strip — Record · bookmark · limits one line.

## [707] — Record · bookmark scan · clip limits on one row

- Record · bookmark scan · clip limits on one row.

## [706] — Clip limits beside Bookmark scan inside Record demod

- Clip limits beside Bookmark scan inside Record demod.

## [705] — Profile dropdown beside Profiles ◀/▶ (not after Tune ±)

- profile dropdown beside Profiles ◀/▶ (not after Tune ±).

## [704] — Identify Overview Run box layout

- Wider left column; **Live on** and **Reset Identify** in a 2-column grid with matching size, padding, and height.

## [703] — Analyzer scan span: 6 decimal places

- **Start** / **End** MHz fields show six digits after the decimal (1 Hz steps); presets and Apply keep the same formatting.

## [702] — Identify Overview: Live + Reset under Status

- **Live on** and **Reset Identify** sit in a small **Run** box under the Overview **Status** column (left); **Known bookmark** row sits lower. **Identify now** stays in Identify actions.

## [701] — Identify Tuning: Mode dropdown

- Analog mode chips replaced with a **Mode** `<select>` next to DIGI (same mode list as Explore / Range).

## [700] — Analyzer Tune (Mute/Vol + LCD) removed — do not rebuild when those nodes are absent

- Span · Live no longer shows the Mute/Vol + frequency LCD Tune group — use Explore or the receiver to tune.

## [699] — Explore VFO: Step dropdown under label

- **OWRX step** and **Channel** mini-boxes: Step dropdown sits under the Step label (same stack as Identify).

## [698] — Explore Actions: name bookmark first

- **Bookmark** in Explore → Actions prompts for a name before saving (Cancel aborts).

## [697] — Waterfall: drop Continuous tip line

- Removed the “Continuous auto: off/on …” tip under Waterfall Max — Continuous button hover (and on-state label) is enough.

## [696] — Look: drop panel-tint colour swatch

- Removed the small colour preview box beside the Toolbox panel tint dropdown (tint name + live panel already show the choice).

## [695] — Bands: drop Jump loudest

- Jump loudest (and its Jump dB / Cluster / Center row) removed from the Bands scan strip — still on Explore and Identify.

## [694] — Peaks: drop Jump loud

- Jump loudest (and its Jump dB / Cluster / Center row) removed from the Peaks tab — still on Bands, Explore, and Identify.

## [693] — Identify Tuning compact layout

- Profile selector sits beside the Tune −/+ buttons.
- Mode chips + DIGI are smaller and stay on one line (scroll if needed) at 35% side dock.

## [692] — Identify Tuning: profile + mode selectors

- Tuning box gains an SDR **profile** dropdown and **mode** chips + DIGI select (same lists as Explore).

## [691] — Identify Tuning: Profiles + current band

- Identify group formerly labelled **Step** is now **Tuning**.
- ◀ / ▶ hop controls labelled **Profiles**, with the current SDR profile name under the buttons.

## [690] — Explore layout menu only on Exp tab

- Right-click box layout / Close tab opens only on the **Exp** header tab.
- Buttons inside Explore (Reject birdie, Jump, …) right-click → colour picker only.

## [689] — Jump FM broadcast enable off by default

- **Enable Jump loudest on FM broadcast** is forced off once for existing installs (older “all extras on” migrations had turned it on).
- **Add all extras** no longer enables opt-in extras (`defaultOn: false`), including FM Jump experimental.

## [688] — Identify Loudest: side-by-side tune controls

- Jump dB / Cluster kHz / Center screen sit beside Jump loudest · Reject · Skipped (shorter Loudest box).

## [687] — Installer off the public repo

- Public installer removed from the repo. Install is copy + edit `init.js` (or CDN).
- README, Help, and Settings public-mode notes no longer point at a host installer script.

## [686] — Explore profile list: stop masonry reparent

- Root cause: HUD tick called tuner-gain hide every 500ms, which force-repacked Explore masonry and closed the open Profile dropdown.
- Gain hide is idempotent; masonry pack is skipped while the profile list is open.

## [685] — Explore profile list stays open

- Profile dropdown is no longer refreshed by the HUD timer (that closed the list ~0.5s after click).
- Opening the list no longer clears the “busy” lock on blur (native selects often blur when the popup opens).

## [684] — Fix Explore profile list closing on click

- Profile dropdown no longer rebuilds while open (timer was snapping the list shut before you could pick).

## [683] — Analyzer tab label: Anz

- Header tab shortened from **Anlz** to **Anz**.

## [682] — Analyzer & Identify on by default

- **Analyzer** and **Identify** are normal Visible tabs (on by default) — no separate Experimental box.
- “Experimental” wording removed for those tabs; Show all tabs turns them on too.
- One-time migrate older installs to show both tabs.

## [681] — Settings tab label: Set

- Header tab shortened from **Settings** to **Set** (tooltip unchanged).

## [680] — Explore tab label: Exp

- Header tab shortened from **Explore** to **Exp** (tooltip unchanged).

## [679] — Bookmarks tab label: Book

- Header tab shortened to **Book** (counts still show when present; tooltip stays Bookmarks).

## [678] — No colour picker on tabs

- Header tabs and sub-tabs cannot be recoloured via right-click (buttons still can).
- Tab hover tips no longer mention colour / Shift+right-click.

## [677] — Identify tab label: ID

- Header tab shortened from **Ident·exp** to **ID** (full name stays in the tooltip).

## [676] — Hop / Identify Jump button layout

- Explore · Hop: **Skipped** sits to the right of the Jump dB row (not in the Jump / Reject / ID row), with clear spacing.
- Identify: **Reject birdie** sits beside **Jump loudest**.

## [675] — Off extras hidden (not greyed)

- Unticked Extras no longer show as greyed placeholders — the UI is hidden until you tick that Extra again under Settings → Extras.
- Explore · tuner gain box also hides when that Extra is off.

## [674] — Explore default: snap to fit · no gaps

- Right-click Explore → default layout is **Snap to fit · no gaps** (boxes hug content, packed tight).
- **Reset order & sizes** / Reset Explore layout restore that snap-to-fit default.
- Column / same-width choices still available from the same menu.

## [673] — Drop Jump tuning box from Settings

- Settings no longer duplicates Jump dB / Cluster / Center — those stay under Jump loudest on Explore, Bands, Peaks, and Identify.
- Settings still has **Jump tuning · experimental (FM broadcast)** (enable switch + Grid / ±kHz / Detect).

## [672] — Jump loudest on FM: enable switch

- Settings → **Jump tuning · experimental (FM broadcast)** now has **Enable Jump loudest on FM broadcast** (off by default).
- Same Extra under Settings → Extras → **Jump · FM broadcast (experimental)**. When on, Jump loudest appears on WFM and uses Grid / ±kHz / Detect.

## [671] — Raspberry Pi / small-PC notes in README + Help

- New **Raspberry Pi / small PCs** section: fine as radio host; be careful with on-device Chromium; light vs heavy features; Extras tips.
- Help tab + slow-panel troubleshooting cross-link the same guidance.
- Full list of changes since GitHub **v440**: [`docs/CHANGES-v440-to-v671.md`](docs/CHANGES-v440-to-v671.md).

## [670] — Band ◀/▶ wraps around

- Explore / Identify profile hop: last band → first, first → last (skips locked / public-disallowed profiles).

## [669] — Reject birdie buttons default purple

- Explore Hop + Identify **Reject birdie** use the same purple as LCD −/+ (no longer amber).

## [668] — OWRX/Ch chip shows step; OWRX step box seeded

- Chip shows active step size (not only “OWRX”/“Ch”); click no longer highlights the MHz field.
- VFO **OWRX step** select seeded with stock presets + current `tuning_step` on startup.

## [667] — FM Jump extras experimental; Jump off on WFM

- FM Grid / ±kHz / Detect row moved to Settings experimental; **Jump loudest** hidden/unsupported on FM broadcast (WFM).

## [666] — FM Jump loudest polish toward v667

- FM Jump loudest polish toward v667 (homelab iterate; no separate note captured for v666).

## [665] — FM Jump loudest polish toward v667

- FM Jump loudest polish toward v667 (homelab iterate; no separate note captured for v665).

## [664] — FM Jump loudest polish toward v667

- FM Jump loudest polish toward v667 (homelab iterate; no separate note captured for v664).

## [663] — FM Jump loudest polish toward v667

- FM Jump loudest polish toward v667 (homelab iterate; no separate note captured for v663).

## [662] — FM Jump lands on channel centre, not carrier shoulder

- Jump loudest on FM broadcast tunes to the **100 kHz grid centre** (89.3, 90.2, …) instead of the spectral peak on the side of a wide carrier.
- One wide FM station no longer produces three neighbour-grid hits — local-max filter keeps a single peak per carrier.

## [661] — FM Jump row (FM broadcast only) + cluster UI + hop fix

- **FM broadcast Jump row** (Grid kHz / ±kHz / Detect) appears only on FM broadcast profiles — hidden on airband, AM, NFM, etc.
- **Cluster kHz** uses band-aware steps: whole numbers on FM (100, 200) with a wider box — no 106.1-style decimals on broadcast.
- **Jump loudest on FM** — separate “on this station” vs “hop to next channel” windows so adjacent 100 kHz stations are not treated as the same tune.

## [660] — Fix FM broadcast Jump loudest; drop FM-only UI row

- **Jump loudest on FM broadcast** — channel scan uses tighter integration + non-maximum suppression so one station is not counted as three grid hits; peak pick skips your current tune; blob fallback no longer rejects carriers at tile centre.
- Removed the extra FM grid / ±kHz / Detect row (Jump dB + Cluster kHz only, same on all bands).

## [659] — FM broadcast Jump loudest tuning row

- **Jump tuning** (Explore, Bands, Peaks, Identify, Settings): on FM / wideband profiles, a second row under Jump dB / Cluster offers **FM grid kHz** (Auto / 100 / 200), **FM ±kHz** integration width, and **Detect** (Both / Channel / Blob).
- Jump loudest on FM broadcast respects those settings; status hint when no peak is found.

## [658]

- duplicate hover help was caused by stacked tooltips:

## [657] — Homelab UI polish (v657)

- Small CSS/UI deploy between named features — no separate note captured for **v657**.

## [656]

- two changes:

## [655]

- **Layout — same height as before** - Removed the stacked column that pushed **center** onto its own row and grew the Tune box. - Meta line is flat again: **center · Δ · mouse · − + · readout** on one row. - **−/+** are tiny inline buttons (10px) in the meta gap before the readout — no extra row.

## [654] — Explore Tune −/+ / LCD meta layout toward v655

- Explore Tune −/+ / LCD meta layout toward v655 (homelab iterate; no separate note captured for v654).

## [653] — Explore Tune −/+ / LCD meta layout toward v655

- Explore Tune −/+ / LCD meta layout toward v655 (homelab iterate; no separate note captured for v653).

## [652]

- to the live receiver and laptop staging.

## [651] — Explore Tune −/+ / LCD meta layout toward v655

- Explore Tune −/+ / LCD meta layout toward v655 (homelab iterate; no separate note captured for v651).

## [650] — Explore Tune −/+ / LCD meta layout toward v655

- Explore Tune −/+ / LCD meta layout toward v655 (homelab iterate; no separate note captured for v650).

## [649] — Explore Tune −/+ / LCD meta layout toward v655

- Explore Tune −/+ / LCD meta layout toward v655 (homelab iterate; no separate note captured for v649).

## [648] — Explore Tune −/+ / LCD meta layout toward v655

- Explore Tune −/+ / LCD meta layout toward v655 (homelab iterate; no separate note captured for v648).

## [647] — Explore Tune −/+ / LCD meta layout toward v655

- Explore Tune −/+ / LCD meta layout toward v655 (homelab iterate; no separate note captured for v647).

## [646] — Explore Tune −/+ / LCD meta layout toward v655

- Explore Tune −/+ / LCD meta layout toward v655 (homelab iterate; no separate note captured for v646).

## [645] — Explore Tune −/+ / LCD meta layout toward v655

- Explore Tune −/+ / LCD meta layout toward v655 (homelab iterate; no separate note captured for v645).

## [644] — Explore Tune −/+ / LCD meta layout toward v655

- Explore Tune −/+ / LCD meta layout toward v655 (homelab iterate; no separate note captured for v644).

## [643] — Explore Tune −/+ / LCD meta layout toward v655

- Explore Tune −/+ / LCD meta layout toward v655 (homelab iterate; no separate note captured for v643).

## [642] — Identify LLM URL grows like Audio STT URL

- **Identify → LLM URL** uses the same flex width as **Audio → STT URL** (`24rem` basis, fills the row).

## [641] — Identify LLM URL width restored

- **Identify → LLM URL** input back to full-row width (reverts v639 shorten).

## [640] — Explore Find refreshes after loading bookmarks

- **Explore → Find** re-runs when you switch back to Explore (and after Load file / Load user).
- Shows “N bookmark(s) loaded” when the list is ready but the search box is empty.

## [639] — STT / Identify URL field widths

- **Audio → Voice-to-text webhook:** wider STT URL input (monospace, full row).
- **Identify → LLM URL:** slightly shorter cap so it does not dominate the Guesses block.
- **Audio → Voice-to-text webhook:** wider STT URL input (monospace, full row). - **Identify → LLM URL:** slightly shorter cap so it does not dominate the Guesses block.

## [638] — Public mode tick: explain why it is locked

- **Public / shared receiver mode** extra shows the **effective** on/off state and a clear tooltip when locked (`--public` bake or OpenWebRX General switch).
- Stops the tick looking clickable when host public bake or Settings → General owns public mode.

## [637] — Extras on by default (again)

- **Settings → Extras** defaults back to **all on** (except Public mode and Audio · STT webhook).
- Public `--public` safe allowlist again **permits all extras**; v634 had wrongly emptied the list and forced every tick off.
- One-time restore for browsers that ended up with every extra off after v634.

## [636] — Explore-only layout menu + snap to fit

- **Right-click layout** is **Explore tab only** (other tabs no longer open the layout menu).
- Layout options unlock for **OpenWebRX admin** on public receivers (no longer greyed when logged in).
- New **Snap to fit · no gaps** — small boxes stay narrow; **All same width** unchanged but renamed for clarity.

## [635] — Explore tuner gain box + stable locked hint

- **Tuner gain** is its own collapsible Explore box (no longer inside Receiver).
- Settings → Extras → **Explore · tuner gain** (default **on**).
- Locked admin-login hint uses fixed height — stops the Explore controls jumping every 500 ms.
- **Tuner gain** is its own collapsible Explore box (no longer inside Receiver). - Settings → Extras → **Explore · tuner gain** (default **on**). - Locked admin-login hint uses fixed height — stops the Explore controls jumping every 500 ms.

## [634] — Public mode hardening (no guest bypass)

- - **host public bake** now applies a **safe visitor allowlist** to every browser; `localStorage` and Settings edits cannot widen guest permissions on baked installs. - **Guests** on any public receiver always get safe defaults unless the host bakes `TOOLBOX_PUBLIC_POLICY` in `toolbox.js` (admin → Copy policy for install). - **Handler checks** mirror UI gates: retune, record, clear, import/export, layout. - **Alone / courtesy**: fail-closed when listener count is unknown on public receivers. - Removed one-time migration that promoted empty public allowlists to “allow all extras”.
- > **v441–v633:** Homelab-only builds between GitHub tag **v440** and **v634**. Entries below are recovered from session notes + `toolbox.js` migration markers; versions with no captured note are summarised by era. Full thematic write-up: [`docs/CHANGES-v440-to-v671.md`](docs/CHANGES-v440-to-v671.md).

## [633] — Tab box layout menu item

- Added a new item to the tab right-click **Box layout** menu.

## [632] — Box layout handler order

- Fixed box-layout handler wiring (was too late / wrong order).

## [631] — Box layout / shade fix

- Fixed blockers that prevented the intended box-layout behaviour.

## [630] — No colour-picker tip on header tabs

- . Header tabs were still treated as shadeable buttons, so the hover tip was appending “Right-click to change this button's colour” on top of the box-layout line.

## [629] — Tab right-click + box spacing

- Tab right-click and box spacing updated.

## [628] — Section ? help popup blank

- . The section **?** help popup was rendering as a blank white box for two reasons:

## [627] — Tooltip / STT polish

- Tooltip / STT polish (homelab iterate; no separate note captured for v627).

## [626] — Stacked floating help tips

- the “two floating help” issue came from a few places stacking tooltip UIs on top of each other.

## [625] — Tooltip / STT polish

- Tooltip / STT polish (homelab iterate; no separate note captured for v625).

## [624] — STT webhook scrolls with Audio pane

- . The webhook box was sitting **outside** the scrollable sub-pane (sibling to Audio list / Record), so it stayed pinned at the bottom of the tab while only the sub-pane content scrolled.
- STT webhook scrolls inside list/record subpane (not pinned below).

## [623] — Audio STT webhook box at bottom of Audio tab

- Audio **STT webhook** box at the bottom of the Audio tab.

## [622] — Jump-tuning / STT polish toward Audio STT webhook (v623)

- Jump-tuning / STT polish toward Audio STT webhook (v623) (homelab iterate; no separate note captured for v622).

## [621] — Jump-tuning / STT polish toward Audio STT webhook (v623)

- Jump-tuning / STT polish toward Audio STT webhook (v623) (homelab iterate; no separate note captured for v621).

## [620] — Jump-tuning / STT polish toward Audio STT webhook (v623)

- Jump-tuning / STT polish toward Audio STT webhook (v623) (homelab iterate; no separate note captured for v620).

## [619] — Jump-tuning / STT polish toward Audio STT webhook (v623)

- Jump-tuning / STT polish toward Audio STT webhook (v623) (homelab iterate; no separate note captured for v619).

## [618] — Center screen under Jump tuning

- **Center screen** tick under Jump tuning.

## [617] — Jump Cluster kHz max raised for DAB / FM auto defaults

- Jump **Cluster kHz** max raised for DAB / FM auto defaults.

## [616] — Deferred Identify build must include LLM URL between Guesses and meta gate

- deferred Identify build must include LLM URL between Guesses and meta gate.

## [615] — LLM URL always visible between Guesses and Signal metadata (not collapsed)

- LLM URL always visible between Guesses and Signal metadata (not collapsed).

## [614] — Jump-tuning / LLM URL placement toward v615

- Jump-tuning / LLM URL placement toward v615 (homelab iterate; no separate note captured for v614).

## [613] — Jump-tuning / LLM URL placement toward v615

- Jump-tuning / LLM URL placement toward v615 (homelab iterate; no separate note captured for v613).

## [612] — Jump tuning sliders under Jump loudest

- Jump tuning sliders under Jump loudest + Settings box.

## [611] — Jump-tuning / classifier polish

- Jump-tuning / classifier polish (homelab iterate; no separate note captured for v611).

## [610] — External classifier under Guesses, closed by default

- External classifier under Guesses, closed by default.

## [609] — External classifier own box (was buried in “Identify tips”)

- External classifier gets its own box (was buried in Identify tips).

## [608] — Analyzer Alone / Identify classifier scaffolding toward v609

- Analyzer Alone / Identify classifier scaffolding toward v609 (homelab iterate; no separate note captured for v608).

## [607] — Analyzer Alone / Identify classifier scaffolding toward v609

- Analyzer Alone / Identify classifier scaffolding toward v609 (homelab iterate; no separate note captured for v607).

## [606] — Extras all-on migration

- One-time extras all-on restore migration (`owrx_toolbox_extras_all_on_v606`).

## [605] — Analyzer Alone / Identify classifier scaffolding toward v609

- Analyzer Alone / Identify classifier scaffolding toward v609 (homelab iterate; no separate note captured for v605).

## [604] — Alone off migration

- One-time Alone courtesy default migration (`owrx_toolbox_alone_off_v604`).

## [603] — Analyzer Alone / Identify classifier scaffolding toward v609

- Analyzer Alone / Identify classifier scaffolding toward v609 (homelab iterate; no separate note captured for v603).

## [602] — Analyzer Alone / Identify classifier scaffolding toward v609

- Analyzer Alone / Identify classifier scaffolding toward v609 (homelab iterate; no separate note captured for v602).

## [601] — Analyzer Alone (only if alone) courtesy tick

- Analyzer **Alone** (only if alone) courtesy tick.

## [600] — Analyzer tools / Alone scaffolding toward v601

- Analyzer tools / Alone scaffolding toward v601 (homelab iterate; no separate note captured for v600).

## [599] — Analyzer tools / Alone scaffolding toward v601

- Analyzer tools / Alone scaffolding toward v601 (homelab iterate; no separate note captured for v599).

## [598] — Analyzer tools / Alone scaffolding toward v601

- Analyzer tools / Alone scaffolding toward v601 (homelab iterate; no separate note captured for v598).

## [597] — Analyzer tools / Alone scaffolding toward v601

- Analyzer tools / Alone scaffolding toward v601 (homelab iterate; no separate note captured for v597).

## [596] — Analyzer tools / Alone scaffolding toward v601

- Analyzer tools / Alone scaffolding toward v601 (homelab iterate; no separate note captured for v596).

## [595] — Analyzer tools / Alone scaffolding toward v601

- Analyzer tools / Alone scaffolding toward v601 (homelab iterate; no separate note captured for v595).

## [594] — Analyzer Display before Presets

- Analyzer **Display** section placed before Presets.

## [593] — Analyzer LCD / tools polish

- Analyzer LCD / tools polish (homelab iterate; no separate note captured for v593).

## [592] — Proper Scan span MHz fields (not tiny number boxes)

- proper Scan span MHz fields (not tiny number boxes).

## [591] — Analyzer movable boxes + Reset

- Reset Analyzer layout beside Reset Explore; movable Analyzer boxes (Wide/Half + drag).

## [590] — Analyzer Run | Mute | Scan span

- Analyzer Run | Mute+freq | Scan span strip; rebuild if mute strip missing.

## [589] — Analyzer tools polish

- Analyzer tools polish (homelab iterate; no separate note captured for v589).

## [588] — Analyzer Span · Live tools

- Analyzer Span · Live tools + dwell presets row.

## [587] — Narrow Analyzer spans slow down

- Narrow Analyzer spans slow down automatically.

## [586] — Analyzer frequency LCD

- Analyzer now has the same frequency LCD as Explore (MHz digits, wheel nudge, Go, mode tag, digi S-meter) at the top of **Span · Live**.
- Analyzer frequency counter (same LCD as Explore).

## [585] — Compact preset boxes in a row (Broadcast / Aviation / HF / VHF / UHF / ISM)

- compact preset boxes in a row (Broadcast / Aviation / HF / VHF / UHF / ISM).

## [584] — Analyzer overview instrument panel

- Overview spectrum becomes a small instrument panel instead of grey bars.

## [583] — Analyzer presets box

- Analyzer presets are in their own box, grouped and tidy:
- Analyzer presets box + grouped default spans.

## [582] — Analyzer presets scaffolding toward v583

- Analyzer presets scaffolding toward v583 (homelab iterate; no separate note captured for v582).

## [581] — Analyzer presets scaffolding toward v583

- Analyzer presets scaffolding toward v583 (homelab iterate; no separate note captured for v581).

## [580] — Analyzer presets scaffolding toward v583

- Analyzer presets scaffolding toward v583 (homelab iterate; no separate note captured for v580).

## [579] — Analyzer presets scaffolding toward v583

- Analyzer presets scaffolding toward v583 (homelab iterate; no separate note captured for v579).

## [578] — Analyzer presets scaffolding toward v583

- Analyzer presets scaffolding toward v583 (homelab iterate; no separate note captured for v578).

## [577] — Identify Hop 4-column grid

- . Identify Hop is now a 4-column grid — **Band · Step · Snap · Tune** equally spaced — with **Band mode** on its own row underneath.

## [576] — Identify Hop / layout scaffolding toward v577

- Identify Hop / layout scaffolding toward v577 (homelab iterate; no separate note captured for v576).

## [575] — Identify Hop / layout scaffolding toward v577

- Identify Hop / layout scaffolding toward v577 (homelab iterate; no separate note captured for v575).

## [574] — Identify Hop / layout scaffolding toward v577

- Identify Hop / layout scaffolding toward v577 (homelab iterate; no separate note captured for v574).

## [573] — Identify Hop / layout scaffolding toward v577

- Identify Hop / layout scaffolding toward v577 (homelab iterate; no separate note captured for v573).

## [572] — Identify Hop / layout scaffolding toward v577

- Identify Hop / layout scaffolding toward v577 (homelab iterate; no separate note captured for v572).

## [571] — Identify Hop / layout scaffolding toward v577

- Identify Hop / layout scaffolding toward v577 (homelab iterate; no separate note captured for v571).

## [570] — Identify Hop / layout scaffolding toward v577

- Identify Hop / layout scaffolding toward v577 (homelab iterate; no separate note captured for v570).

## [569] — Homelab UI polish (v569)

- Small CSS/UI deploy between named features — no separate note captured for **v569**.

## [568] — Play voice heuristic

- Voice-vs-noise / Play voice path refined (heuristic, not STT).

## [567] — Audio scroll while playing

- Scroll-to-top while a clip or Play-all is running.

## [566] — Range Spectrum after scan

- Range → Spectrum after a scan.

## [565] — Homelab UI polish (v565)

- Small CSS/UI deploy between named features — no separate note captured for **v565**.

## [564] — Audio / Range / Identify polish after cold-defer (v555)

- Audio / Range / Identify polish after cold-defer (v555) (homelab iterate; no separate note captured for v564).

## [563] — Audio / Range / Identify polish after cold-defer (v555)

- Audio / Range / Identify polish after cold-defer (v555) (homelab iterate; no separate note captured for v563).

## [562] — Audio / Range / Identify polish after cold-defer (v555)

- Audio / Range / Identify polish after cold-defer (v555) (homelab iterate; no separate note captured for v562).

## [561] — Audio / Range / Identify polish after cold-defer (v555)

- Audio / Range / Identify polish after cold-defer (v555) (homelab iterate; no separate note captured for v561).

## [560] — Audio / Range / Identify polish after cold-defer (v555)

- Audio / Range / Identify polish after cold-defer (v555) (homelab iterate; no separate note captured for v560).

## [559] — Audio / Range / Identify polish after cold-defer (v555)

- Audio / Range / Identify polish after cold-defer (v555) (homelab iterate; no separate note captured for v559).

## [558] — Audio / Range / Identify polish after cold-defer (v555)

- Audio / Range / Identify polish after cold-defer (v555) (homelab iterate; no separate note captured for v558).

## [557] — Audio / Range / Identify polish after cold-defer (v555)

- Audio / Range / Identify polish after cold-defer (v555) (homelab iterate; no separate note captured for v557).

## [556] — Audio / Range / Identify polish after cold-defer (v555)

- Audio / Range / Identify polish after cold-defer (v555) (homelab iterate; no separate note captured for v556).

## [555] — Fewer boot retries — button usually mounts on first/second try

- Fewer boot retries for top-bar mount; defer experimental + cold tabs until first open.

## [554] — Homelab UI polish (v554)

- Small CSS/UI deploy between named features — no separate note captured for **v554**.

## [553] — Homelab UI polish (v553)

- Small CSS/UI deploy between named features — no separate note captured for **v553**.

## [552] — Homelab UI polish (v552)

- Small CSS/UI deploy between named features — no separate note captured for **v552**.

## [551] — Homelab UI polish (v551)

- Small CSS/UI deploy between named features — no separate note captured for **v551**.

## [550] — Homelab UI polish (v550)

- Small CSS/UI deploy between named features — no separate note captured for **v550**.

## [549] — Jump stays on same profile

- Jump only moves the VFO — same waterfall / same profile.

## [548] — Homelab UI polish (v548)

- Small CSS/UI deploy between named features — no separate note captured for **v548**.

## [547] — Panel / Identify polish

- Panel / Identify polish (homelab iterate; no separate note captured for v547).

## [546] — Panel / Identify polish

- Panel / Identify polish (homelab iterate; no separate note captured for v546).

## [545] — Homelab UI polish (v545)

- Small CSS/UI deploy between named features — no separate note captured for **v545**.

## [544] — Startup / Default tab fixes

- 1. **Open panel on startup** — Toolbox only loaded after a click, so the setting never ran. It now loads and opens after the receiver paints. 2. **Auto-click Start OpenWebRX+** — same boot skip; it now retries the Start overlay early (and with a few more click targets). 3. **Always Identify** — Identify was blocked as “experimental,” so it always fell back to Explore. Explicit Default tab is honored now.

## [543] — Homelab UI polish (v543)

- Small CSS/UI deploy between named features — no separate note captured for **v543**.

## [542] — Homelab UI polish (v542)

- Small CSS/UI deploy between named features — no separate note captured for **v542**.

## [541] — Homelab UI polish (v541)

- Small CSS/UI deploy between named features — no separate note captured for **v541**.

## [540] — Homelab UI polish (v540)

- Small CSS/UI deploy between named features — no separate note captured for **v540**.

## [539] — Homelab UI polish (v539)

- Small CSS/UI deploy between named features — no separate note captured for **v539**.

## [538] — Homelab UI polish (v538)

- Small CSS/UI deploy between named features — no separate note captured for **v538**.

## [537] — Homelab UI polish (v537)

- Small CSS/UI deploy between named features — no separate note captured for **v537**.

## [536] — Homelab UI polish (v536)

- Small CSS/UI deploy between named features — no separate note captured for **v536**.

## [535] — Jump loudest polish

- Jump loudest polish (homelab iterate; no separate note captured for v535).

## [534] — Homelab UI polish (v534)

- Small CSS/UI deploy between named features — no separate note captured for **v534**.

## [533] — Homelab UI polish (v533)

- Small CSS/UI deploy between named features — no separate note captured for **v533**.

## [532] — Homelab UI polish (v532)

- Small CSS/UI deploy between named features — no separate note captured for **v532**.

## [531] — Homelab UI polish (v531)

- Small CSS/UI deploy between named features — no separate note captured for **v531**.

## [530] — Homelab UI polish (v530)

- Small CSS/UI deploy between named features — no separate note captured for **v530**.

## [529] — Jump loudest polish

- Jump loudest polish (homelab iterate; no separate note captured for v529).

## [528] — Jump loudest polish

- Jump loudest polish (homelab iterate; no separate note captured for v528).

## [527] — Jump loudest polish

- Jump loudest polish (homelab iterate; no separate note captured for v527).

## [526] — Jump loudest polish

- Jump loudest polish (homelab iterate; no separate note captured for v526).

## [525] — Homelab UI polish (v525)

- Small CSS/UI deploy between named features — no separate note captured for **v525**.

## [524] — Homelab UI polish (v524)

- Small CSS/UI deploy between named features — no separate note captured for **v524**.

## [523] — Identify / Analyzer / Jump scaffolding

- Identify / Analyzer / Jump scaffolding (homelab iterate; no separate note captured for v523).

## [522] — Identify / Analyzer / Jump scaffolding

- Identify / Analyzer / Jump scaffolding (homelab iterate; no separate note captured for v522).

## [521] — Identify / Analyzer / Jump scaffolding

- Identify / Analyzer / Jump scaffolding (homelab iterate; no separate note captured for v521).

## [520] — Identify / Analyzer / Jump scaffolding

- Identify / Analyzer / Jump scaffolding (homelab iterate; no separate note captured for v520).

## [519] — Identify / Analyzer / Jump scaffolding

- Identify / Analyzer / Jump scaffolding (homelab iterate; no separate note captured for v519).

## [518] — Identify / Analyzer / Jump scaffolding

- Identify / Analyzer / Jump scaffolding (homelab iterate; no separate note captured for v518).

## [517] — Identify / Analyzer / Jump scaffolding

- Identify / Analyzer / Jump scaffolding (homelab iterate; no separate note captured for v517).

## [516] — Identify / Analyzer / Jump scaffolding

- Identify / Analyzer / Jump scaffolding (homelab iterate; no separate note captured for v516).

## [515] — Identify / Analyzer / Jump scaffolding

- Identify / Analyzer / Jump scaffolding (homelab iterate; no separate note captured for v515).

## [514] — Identify / Analyzer / Jump scaffolding

- Identify / Analyzer / Jump scaffolding (homelab iterate; no separate note captured for v514).

## [513] — Identify / Analyzer / Jump scaffolding

- Identify / Analyzer / Jump scaffolding (homelab iterate; no separate note captured for v513).

## [512] — Homelab UI polish (v512)

- Small CSS/UI deploy between named features — no separate note captured for **v512**.

## [511] — Identify / Analyzer experimental scaffolding

- Identify / Analyzer experimental scaffolding (homelab iterate; no separate note captured for v511).

## [510] — Identify / Analyzer experimental scaffolding

- Identify / Analyzer experimental scaffolding (homelab iterate; no separate note captured for v510).

## [509] — Identify / Analyzer experimental scaffolding

- Identify / Analyzer experimental scaffolding (homelab iterate; no separate note captured for v509).

## [508] — Hop button green default

- Explore Hop button default shade green (`owrx_toolbox_ex_hop_green_v508`).

## [507] — Ident button green default

- Explore Ident button default shade green.

## [506] — Identify / Analyzer experimental scaffolding

- Identify / Analyzer experimental scaffolding (homelab iterate; no separate note captured for v506).

## [505] — Jump loudest green default

- Explore Jump loudest button default shade green.

## [504] — Identify / Analyzer experimental scaffolding

- Identify / Analyzer experimental scaffolding (homelab iterate; no separate note captured for v504).

## [503] — Homelab UI polish (v503)

- Small CSS/UI deploy between named features — no separate note captured for **v503**.

## [502] — Identify / Analyzer experimental scaffolding

- Identify / Analyzer experimental scaffolding (homelab iterate; no separate note captured for v502).

## [501] — Identify / Analyzer experimental scaffolding

- Identify / Analyzer experimental scaffolding (homelab iterate; no separate note captured for v501).

## [500] — Identify / Analyzer experimental scaffolding

- Identify / Analyzer experimental scaffolding (homelab iterate; no separate note captured for v500).

## [499] — Identify / Analyzer experimental scaffolding

- Identify / Analyzer experimental scaffolding (homelab iterate; no separate note captured for v499).

## [498] — Identify / Analyzer experimental scaffolding

- Identify / Analyzer experimental scaffolding (homelab iterate; no separate note captured for v498).

## [497] — Identify / Analyzer experimental scaffolding

- Identify / Analyzer experimental scaffolding (homelab iterate; no separate note captured for v497).

## [496] — Identify / Analyzer experimental scaffolding

- Identify / Analyzer experimental scaffolding (homelab iterate; no separate note captured for v496).

## [495] — Identify / Analyzer experimental scaffolding

- Identify / Analyzer experimental scaffolding (homelab iterate; no separate note captured for v495).

## [494] — Identify / Analyzer experimental scaffolding

- Identify / Analyzer experimental scaffolding (homelab iterate; no separate note captured for v494).

## [493] — Identify / Analyzer experimental scaffolding

- Identify / Analyzer experimental scaffolding (homelab iterate; no separate note captured for v493).

## [492] — Identify / Analyzer experimental scaffolding

- Identify / Analyzer experimental scaffolding (homelab iterate; no separate note captured for v492).

## [491] — Identify light open path

- Ident open is a dedicated light path — never runs full switchTab work.
- Ident build via openIdentifyTabSafe only — no chunked fill / full wire on open.

## [490] — Cold-tab deferral / Ident open scaffolding (v486–v491)

- Cold-tab deferral / Ident open scaffolding (v486–v491) (homelab iterate; no separate note captured for v490).

## [489] — Identify chunked inject

- Identify HTML inject is chunked to reduce freezes.

## [488] — Cold-tab deferral / Ident open scaffolding (v486–v491)

- Cold-tab deferral / Ident open scaffolding (v486–v491) (homelab iterate; no separate note captured for v488).

## [487] — Cold-tab deferral / Ident open scaffolding (v486–v491)

- Cold-tab deferral / Ident open scaffolding (v486–v491) (homelab iterate; no separate note captured for v487).

## [486] — Defer experimental tabs

- Defer experimental + cold tabs until first open.

## [485] — Experimental: Identify + Analyzer

- Settings → **Experimental** with Identify + Analyzer.

## [484] — Build chrome first, then one tab per turn

- build chrome first, then one tab per turn — avoids "Page Unresponsive".

## [483] — Boot / panel-build scaffolding toward chunked chrome (v484)

- Boot / panel-build scaffolding toward chunked chrome (v484) (homelab iterate; no separate note captured for v483).

## [482] — Boot / panel-build scaffolding toward chunked chrome (v484)

- Boot / panel-build scaffolding toward chunked chrome (v484) (homelab iterate; no separate note captured for v482).

## [481] — Boot / panel-build scaffolding toward chunked chrome (v484)

- Boot / panel-build scaffolding toward chunked chrome (v484) (homelab iterate; no separate note captured for v481).

## [480] — Open panel on startup off once

- Forced **Open panel on startup** off once so the receiver can paint first (`owrx_toolbox_autoopen_off_v480`).

## [479] — Boot / panel-build scaffolding toward chunked chrome (v484)

- Boot / panel-build scaffolding toward chunked chrome (v484) (homelab iterate; no separate note captured for v479).

## [478] — Boot / panel-build scaffolding toward chunked chrome (v484)

- Boot / panel-build scaffolding toward chunked chrome (v484) (homelab iterate; no separate note captured for v478).

## [477] — Boot / panel-build scaffolding toward chunked chrome (v484)

- Boot / panel-build scaffolding toward chunked chrome (v484) (homelab iterate; no separate note captured for v477).

## [476] — Boot / panel-build scaffolding toward chunked chrome (v484)

- Boot / panel-build scaffolding toward chunked chrome (v484) (homelab iterate; no separate note captured for v476).

## [475] — Boot / panel-build scaffolding toward chunked chrome (v484)

- Boot / panel-build scaffolding toward chunked chrome (v484) (homelab iterate; no separate note captured for v475).

## [474] — Boot / panel-build scaffolding toward chunked chrome (v484)

- Boot / panel-build scaffolding toward chunked chrome (v484) (homelab iterate; no separate note captured for v474).

## [473] — Boot / panel-build scaffolding toward chunked chrome (v484)

- Boot / panel-build scaffolding toward chunked chrome (v484) (homelab iterate; no separate note captured for v473).

## [472] — Boot / panel-build scaffolding toward chunked chrome (v484)

- Boot / panel-build scaffolding toward chunked chrome (v484) (homelab iterate; no separate note captured for v472).

## [471] — Boot / panel-build scaffolding toward chunked chrome (v484)

- Boot / panel-build scaffolding toward chunked chrome (v484) (homelab iterate; no separate note captured for v471).

## [470] — Boot / panel-build scaffolding toward chunked chrome (v484)

- Boot / panel-build scaffolding toward chunked chrome (v484) (homelab iterate; no separate note captured for v470).

## [469] — Boot / panel-build scaffolding toward chunked chrome (v484)

- Boot / panel-build scaffolding toward chunked chrome (v484) (homelab iterate; no separate note captured for v469).

## [468] — Boot / panel-build scaffolding toward chunked chrome (v484)

- Boot / panel-build scaffolding toward chunked chrome (v484) (homelab iterate; no separate note captured for v468).

## [467] — Homelab UI polish (v467)

- Small CSS/UI deploy between named features — no separate note captured for **v467**.

## [466] — Homelab UI polish (v466)

- Small CSS/UI deploy between named features — no separate note captured for **v466**.

## [465] — Homelab UI polish (v465)

- Small CSS/UI deploy between named features — no separate note captured for **v465**.

## [464] — Homelab UI polish (v464)

- Small CSS/UI deploy between named features — no separate note captured for **v464**.

## [463] — UI polish

- UI polish (homelab iterate; no separate note captured for v463).

## [462] — Help popup height clip

- the earlier fixed heights were clipping the text, and a leftover CSS block was still forcing the short sizes.

## [461] — UI polish

- UI polish (homelab iterate; no separate note captured for v461).

## [460] — Homelab UI polish (v460)

- Small CSS/UI deploy between named features — no separate note captured for **v460**.

## [459] — UI height / Help polish

- UI height / Help polish (homelab iterate; no separate note captured for v459).

## [458] — UI height / Help polish

- UI height / Help polish (homelab iterate; no separate note captured for v458).

## [457] — Homelab UI polish (v457)

- Small CSS/UI deploy between named features — no separate note captured for **v457**.

## [456] — Waterfall / lock polish after v451

- Waterfall / lock polish after v451 (homelab iterate; no separate note captured for v456).

## [455] — Waterfall / lock polish after v451

- Waterfall / lock polish after v451 (homelab iterate; no separate note captured for v455).

## [454] — Waterfall / lock polish after v451

- Waterfall / lock polish after v451 (homelab iterate; no separate note captured for v454).

## [453] — Waterfall / lock polish after v451

- Waterfall / lock polish after v451 (homelab iterate; no separate note captured for v453).

## [452] — Waterfall / lock polish after v451

- Waterfall / lock polish after v451 (homelab iterate; no separate note captured for v452).

## [451] — Waterfall lock regression

- Fix from waterfall lock work that day.

## [450] — Post-v440 scan/stop and public-mode docs polish

- Post-v440 scan/stop and public-mode docs polish (homelab iterate; no separate note captured for v450).

## [449] — Post-v440 scan/stop and public-mode docs polish

- Post-v440 scan/stop and public-mode docs polish (homelab iterate; no separate note captured for v449).

## [448] — Post-v440 scan/stop and public-mode docs polish

- Post-v440 scan/stop and public-mode docs polish (homelab iterate; no separate note captured for v448).

## [447] — Post-v440 scan/stop and public-mode docs polish

- Post-v440 scan/stop and public-mode docs polish (homelab iterate; no separate note captured for v447).

## [446] — Post-v440 scan/stop and public-mode docs polish

- Post-v440 scan/stop and public-mode docs polish (homelab iterate; no separate note captured for v446).

## [445] — Post-v440 scan/stop and public-mode docs polish

- Post-v440 scan/stop and public-mode docs polish (homelab iterate; no separate note captured for v445).

## [444] — Post-v440 scan/stop and public-mode docs polish

- Post-v440 scan/stop and public-mode docs polish (homelab iterate; no separate note captured for v444).

## [443] — Post-v440 scan/stop and public-mode docs polish

- Post-v440 scan/stop and public-mode docs polish (homelab iterate; no separate note captured for v443).

## [442] — Post-v440 scan/stop and public-mode docs polish

- Post-v440 scan/stop and public-mode docs polish (homelab iterate; no separate note captured for v442).

## [441] — Post-v440 scan/stop and public-mode docs polish

- Post-v440 scan/stop and public-mode docs polish (homelab iterate; no separate note captured for v441).

## [440] — Scan Stop works during waits; strip stays visible while busy

- Stop was easy to miss (Always hide scan strip hid it mid-scan) and could sit ignored through the ~11s profile-gap sleep or profile-switch wait. Gap/switch now abort on Stop, the strip stays up while scanning, status shows band i/n, and keyboard **S** always calls Stop when a scan is running.

## [439] — Public mode docs match stock OpenWebRX+

- Most installs have no Settings → General Toolbox checkbox. README, Help, installer messages, and Settings notes now lead with host public bake / `--personal` and the Toolbox Public tick. Behaviour unchanged for existing installs.

## [438] — Restore prior gain if Auto save fails mid-step

- Two-step gain writes (mid → target / manual-0 → Auto) now keep the pre-save profile and restore it if the second POST fails, so a stick is not left at 0 dB. README and in-panel Help document Explore hardware gain + Settings admin login.

## [437] — Default hardware gain to Auto

- Explore gain mode falls back to **Auto** (AGC) for every SDR family when a profile has no explicit mode. Preview UI also starts on Auto. Homelab `settings.json` / `reporting-ready` / `ft8-ready` profiles are all `rf_gain: "auto"`.

## [436] — No waterfall jump on gain change

- Stopped hopping to another band profile after gain save (that was retuning the waterfall). Live apply still uses the mid→target gain write on the active profile.

## [435] — Gain save rejected: Hz × kHz exponent

- Profile POSTs sent absolute Hz with a non-zero unit exponent (e.g. `samp_rate=2400000` + `samp_rate-exponent=3`), so OpenWebRX rejected the form and never stored gain. Sanitize exponents to `0` (and drop literal `None`) before every profile save.

## [434] — Hide dead RTL RF slider; stop fake gain saves

- CSS `display:flex` on fader labels overrode HTML `hidden`, so an RF slider stayed visible on RTL even though it does nothing. Gain POSTs now follow redirects and treat a bounce to `/login` as failure (settings were never updating).

## [433] — Gain “save” was a fake success

- POST redirects to `/login` were treated as OK, so Explore looked fine while `settings.json` never changed and `rtl_connector` stayed at `-g 29`. Now login redirects fail loudly, stored gain is verified after save, then a profile hop applies it live.

## [432] — Explore gain controls were HTML-disabled

- Admin probe used `redirect:manual` (opaque-redirect → always “not admin”) and gated before loading the profile form, so Tuner / dB / RF controls never accepted clicks. Now the profile form is the unlock check; Settings scrape follows redirects; Open Settings + Retry sit under the gain status. Page/Basic auth alone is not Settings admin.

## [431] — RTL gain: discrete steps + forced live apply

- RTL sticks only accept specific dB steps. Explore now uses that list, verifies admin via real Settings HTML, and writes an intermediate gain then the target so `rtl_connector` always gets an `rf_gain` control update.

## [430] — RTL Explore gain actually applies

- RTL has one tuner gain (not RF+IF). Preview sliders stay locked without admin. Saves verify redirect/errors, then hop profile away/back so `rtl_connector` picks up `-g`.

## [429] — Closed panel leaves stock dial alone

- Explore readout / gain sync only runs while the Toolbox panel is open.

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
- host public / personal bake also write `toolbox_public_mode` into `settings.json` when writable.
- Settings → Check install reports the stock `toolbox_public_mode` value.

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

- Major growth after Band Survey: Explore, Audio archive, Extras, public allowlist, side dock, Bands edit/packs, Analyzer, UX feel, personal defaults, and many UX fixes. See git history and in-panel Help for detail.

## [127] — Last Band Survey (`band_survey`)

- Digi/FT8, day/night, heatmap, share/scanner extras on existing tabs.
- Frozen in this repo under `legacy/band_survey/` for people who still want it.

## [110] — Band Survey

- Channel grid step/offset presets.

## [97] — Band Survey

- Fix init crash (`TAB_IDS`) that hid the Survey button in v91–v96.
