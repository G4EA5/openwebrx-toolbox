# Toolbox changes: GitHub v440 → local v671 (archive)

> **Superseded for release notes:** see [`CHANGES-v440-to-v960.md`](CHANGES-v440-to-v960.md) for the full v440→v960 thematic overview. This file is kept as the detailed mid-era archive through v671.

**From:** GitHub tag [`toolbox-v440`](https://github.com/G4EA5/openwebrx-toolbox/releases/tag/toolbox-v440) (`Plugins.toolbox._version = 440`)

**To:** local/homelab **v671** (working tree at the time this draft was written)


> **Important:** Releases on GitHub still end at **v440** until you publish a newer tag. Versions **441–960** were built and deployed on the live receiver. Per-version notes are in root [`CHANGELOG.md`](../CHANGELOG.md).


## Size

| | v440 | v671 |
| --- | ---: | ---: |
| `toolbox.js` lines | ~26 026 | ~36 808 |
| `toolbox.js` size | ~1.09 MB | ~1.53 MB |
| `toolbox.css` size | ~142 KB | ~217 KB |
| Settings Extras | 94 | 107 |
| Tabs | 10 (no Identify) | 11 (+ Identify) |


## Thematic summary (all changes)


### Identify (new tab, experimental)

- New **Identify** tab in the header (off by default under Settings → Experimental).
- Heuristic signal-type guesses from waterfall shape (not callsigns).
- **Identify now** / **Live** continuous classify.
- Guess cards with confidence; apply suggested mode; bookmark / note / skip signal.
- Extras: bandplan priors, digi panel hint, profile name hint, current mode prior, stable Live vote.
- Optional **external classifier** Extra + **LLM URL** (DIY webhook).
- Learn-from-bookmarks store (`owrx_toolbox_id_learn_v1`).
- Identify box layout (drag / Wide / Half) like Explore (`owrx_toolbox_id_layout_v1`).
- Band ◀/▶ on Identify uses the same profile hop as Explore.
- Reject birdie + Jump loudest + Jump tuning controls mirrored from Explore/Peaks.
- Deferred/chunked Identify build so opening the tab does not freeze the page.

### Analyzer (experimental) growth

- Analyzer remains experimental / off by default; much more UI since v440.
- Movable Analyzer boxes (Wide/Half + drag); layout saved (`owrx_toolbox_sa_layout_v2`).
- Frequency counter LCD (same pattern as Explore).
- Preset spans grouped (Broadcast / Aviation / HF / VHF / UHF / ISM).
- Dwell presets + tools row; Mute + freq strip; Scan span MHz fields.
- **Alone** (only if alone) courtesy tick.
- Hide birdies / DC; Live on / Follow tile; Reset Analyzer layout.

### Jump loudest & birdies

- **Jump tuning** Extra: Jump dB + Cluster kHz under Jump buttons (Explore / Bands / Peaks / Identify / Settings).
- Band-aware auto defaults (FM / air / NFM / …).
- **Center screen** tick — centre waterfall on jumped station (default on).
- Round-robin hop among peaks on the tile (not always re-pick #1).
- FM broadcast: dedicated channel scoring, local-max filter, grid-centre tune (v659–v662); later FM extras moved to Settings experimental and Jump loudest disabled on WFM (v667).
- **Reject birdie** — mark current tune as always-skip and jump again (Explore Hop + Identify); purple styling (v669).
- Skip-list button sync / empty-state styling near Reject.

### Explore / VFO / Tune LCD

- **OWRX vs Channel** step chip next to LCD −/+ (saved preference); chip shows active step size (v656–v668).
- **OWRX step** select in VFO box synced to stock tuning-step listbox (watcher + presets seed so it is not empty on start).
- −/+ flash/select frequency digits on nudge; OWRX/Ch click no longer steals freq focus.
- Duplicate hover tips cleaned up (single float tip).
- Audio FFT scope between LCD and S-meter.
- **Tuner gain** moved to its own Explore box (Extras → Explore · tuner gain).
- Explore layout: snap-to-fit · no gaps; right-click layout menu Explore-only; admin unlock on public.
- Band / profile ◀/▶ **wraps** last→first (v670).
- Find refreshes after loading bookmarks (v640).
- Hardware gain path continued from v422–v438 era (already in v440) with later UX stability for locked hint.

### Audio

- **Audio · STT webhook** Extra (off by default) — POST clips to your own voice-to-text / LLM URL.
- STT URL field layout polish; webhook box placement on Audio tab.
- Clip scroll panes / record subpane layout fixes.
- Voice-vs-noise scoring / Play voice path continued and refined.

### Public / shared receivers & Settings

- **v634** public hardening: `--public` safe allowlist cannot be widened via localStorage; handler checks; alone fail-closed.
- **v637** Extras all-on restored after v634 emptied guest extras; one-time restore migration.
- **v638** Public tick shows effective locked state + tooltip.
- Public policy bake (`TOOLBOX_PUBLIC_POLICY` / Copy policy for install).
- Settings Extras set grew (+Identify family, Jump tuning, STT webhook, after-scan, filters, …).
- Tab box span / equal-width prefs (`owrx_toolbox_tab_box_span_v1`, `…_equal_v1`).

### Performance / boot / small PCs

- Chunked panel build / deferred cold tabs (Identify, Analyzer) to avoid “Page Unresponsive”.
- Fewer boot retries for top-bar button mount.
- **Raspberry Pi / small PCs** section in README + Help (v671): host vs on-device browser, light vs heavy features.
- Peaks slow-panel guidance cross-linked to Pi tips.

### Docs & packaging

- README expanded (SDR notes, Pi, Help alignment).
- In-panel Help sections for Analyzer + Raspberry Pi / small PCs.
- Varnish notes retained for Pi images.
- Homelab deploy path continued; GitHub tag still `toolbox-v440` until a new release is published.

## New Settings → Extras (since v440)

- `afterScan` — **After scan actions**
- `askPasses` — **Ask passes when starting**
- `audioSttWebhook` — **Audio · STT webhook**
- `filterBookmarked` — **Filter · Bookmarked**
- `filterWideband` — **Filter · Wideband**
- `idBandplan` — **Identify · bandplan priors**
- `idDigiHint` — **Identify · digi panel hint**
- `idExternal` — **Identify · external classifier**
- `idModePrior` — **Identify · current mode prior**
- `idProfileHint` — **Identify · profile name hint**
- `idStable` — **Identify · stable Live vote**
- `identify` — **Identify**
- `jumpTuning` — **Jump tuning**

## New localStorage keys

- `owrx_toolbox_id_features_v1`
- `owrx_toolbox_id_layout_v1`
- `owrx_toolbox_id_learn_v1`
- `owrx_toolbox_sa_layout_v2`
- `owrx_toolbox_tab_box_equal_v1`
- `owrx_toolbox_tab_box_span_v1`

---

## Per-version detail (where recorded)

Combined from `CHANGELOG.md`, session summaries, and `/* vNNN */` migration comments in `toolbox.js`.


### [670]

- hard-refresh (**Ctrl+Shift+R**).

### [669]

- ; hard-refresh (**Ctrl+Shift+R**).

### [668]

- (deployed).
- seed empty OWRX step box with stock presets + current tuning_step.

### [667]

- FM Jump extras → Settings experimental only; Jump loudest off on WFM.

### [666]

- | Fix | Effect | |-----|--------| | **Jump dB = noise floor + margin** | “At least 3 dB above noise” per station, not “within 7 dB of loudest” | | **Carrier locate → grid centre** | Wide search finds the station, tune target is always the **100 kHz centre** | | **Pick global loudest** | First press → loudest station you’re **not** on; if already on loudest → #2 | | **FM default Jump dB → 3** | When the band profile switches to FM (saved value may still be 7 until then) | | **Status on Explore too** | Messages show in Explore’s status line, not

### [662] — FM Jump lands on channel centre, not carrier shoulder

- Jump loudest on FM broadcast tunes to the **100 kHz grid centre** (89.3, 90.2, …) instead of the spectral peak on the side of a wide carrier.
- One wide FM station no longer produces three neighbour-grid hits — local-max filter keeps a single peak per carrier.
- - Jump loudest on FM broadcast tunes to the **100 kHz grid centre** (89.3, 90.2, …) instead of the spectral peak on the side of a wide carrier. - One wide FM station no longer produces three neighbour-grid hits — local-max filter keeps a single peak per carrier.

### [661] — FM Jump row (FM broadcast only) + cluster UI + hop fix

- **FM broadcast Jump row** (Grid kHz / ±kHz / Detect) appears only on FM broadcast profiles — hidden on airband, AM, NFM, etc.
- **Cluster kHz** uses band-aware steps: whole numbers on FM (100, 200) with a wider box — no 106.1-style decimals on broadcast.
- **Jump loudest on FM** — separate “on this station” vs “hop to next channel” windows so adjacent 100 kHz stations are not treated as the same tune.
- - **FM broadcast Jump row** (Grid kHz / ±kHz / Detect) appears only on FM broadcast profiles — hidden on airband, AM, NFM, etc. - **Cluster kHz** uses band-aware steps: whole numbers on FM (100, 200) with a wider box — no 106.1-style decimals on broadcast. - **Jump loudest on FM** — separate “on this station” vs “hop to next channel” windows so adjacent 100 kHz stations are not treated as the same tune.

### [660] — Fix FM broadcast Jump loudest; drop FM-only UI row

- **Jump loudest on FM broadcast** — channel scan uses tighter integration + non-maximum suppression so one station is not counted as three grid hits; peak pick skips your current tune; blob fallback no longer rejects carriers at tile centre.
- Removed the extra FM grid / ±kHz / Detect row (Jump dB + Cluster kHz only, same on all bands).
- - **Jump loudest on FM broadcast** — channel scan uses tighter integration + non-maximum suppression so one station is not counted as three grid hits; peak pick skips your current tune; blob fallback no longer rejects carriers at tile centre. - Removed the extra FM grid / ±kHz / Detect row (Jump dB + Cluster kHz only, same on all bands).

### [659] — FM broadcast Jump loudest tuning row

- **Jump tuning** (Explore, Bands, Peaks, Identify, Settings): on FM / wideband profiles, a second row under Jump dB / Cluster offers **FM grid kHz** (Auto / 100 / 200), **FM ±kHz** integration width, and **Detect** (Both / Channel / Blob).
- Jump loudest on FM broadcast respects those settings; status hint when no peak is found.
- - **Jump tuning** (Explore, Bands, Peaks, Identify, Settings): on FM / wideband profiles, a second row under Jump dB / Cluster offers **FM grid kHz** (Auto / 100 / 200), **FM ±kHz** integration width, and **Detect** (Both / Channel / Blob). - Jump loudest on FM broadcast respects those settings; status hint when no peak is found.

### [658]

- duplicate hover help was caused by stacked tooltips:

### [657]

- four fixes:

### [656]

- two changes:

### [655]

- **Layout — same height as before** - Removed the stacked column that pushed **center** onto its own row and grew the Tune box. - Meta line is flat again: **center · Δ · mouse · − + · readout** on one row. - **−/+** are tiny inline buttons (10px) in the meta gap before the readout — no extra row.

### [652]

- to the live receiver and laptop staging.

### [642] — Identify LLM URL grows like Audio STT URL

- **Identify → LLM URL** uses the same flex width as **Audio → STT URL** (`24rem` basis, fills the row).
- - **Identify → LLM URL** uses the same flex width as **Audio → STT URL** (`24rem` basis, fills the row).

### [641] — Identify LLM URL width restored

- **Identify → LLM URL** input back to full-row width (reverts v639 shorten).
- - **Identify → LLM URL** input back to full-row width (reverts v639 shorten).

### [640] — Explore Find refreshes after loading bookmarks

- **Explore → Find** re-runs when you switch back to Explore (and after Load file / Load user).
- Shows “N bookmark(s) loaded” when the list is ready but the search box is empty.
- - **Explore → Find** re-runs when you switch back to Explore (and after Load file / Load user). - Shows “N bookmark(s) loaded” when the list is ready but the search box is empty.

### [639] — STT / Identify URL field widths

- **Audio → Voice-to-text webhook:** wider STT URL input (monospace, full row).
- **Identify → LLM URL:** slightly shorter cap so it does not dominate the Guesses block.
- - **Audio → Voice-to-text webhook:** wider STT URL input (monospace, full row). - **Identify → LLM URL:** slightly shorter cap so it does not dominate the Guesses block.

### [638] — Public mode tick: explain why it is locked

- **Public / shared receiver mode** extra shows the **effective** on/off state and a clear tooltip when locked (`--public` bake or OpenWebRX General switch).
- Stops the tick looking clickable when host public bake or Settings → General owns public mode.
- - **Public / shared receiver mode** extra shows the **effective** on/off state and a clear tooltip when locked (`--public` bake or OpenWebRX General switch). - Stops the tick looking clickable when host public bake or Settings → General owns public mode.

### [637] — Extras on by default (again)

- **Settings → Extras** defaults back to **all on** (except Public mode and Audio · STT webhook).
- Public `--public` safe allowlist again **permits all extras**; v634 had wrongly emptied the list and forced every tick off.
- One-time restore for browsers that ended up with every extra off after v634.
- - **Settings → Extras** defaults back to **all on** (except Public mode and Audio · STT webhook). - Public `--public` safe allowlist again **permits all extras**; v634 had wrongly emptied the list and forced every tick off. - One-time restore for browsers that ended up with every extra off after v634.

### [636] — Explore-only layout menu + snap to fit

- **Right-click layout** is **Explore tab only** (other tabs no longer open the layout menu).
- Layout options unlock for **OpenWebRX admin** on public receivers (no longer greyed when logged in).
- New **Snap to fit · no gaps** — small boxes stay narrow; **All same width** unchanged but renamed for clarity.
- - **Right-click layout** is **Explore tab only** (other tabs no longer open the layout menu). - Layout options unlock for **OpenWebRX admin** on public receivers (no longer greyed when logged in). - New **Snap to fit · no gaps** — small boxes stay narrow; **All same width** unchanged but renamed for clarity.

### [635] — Explore tuner gain box + stable locked hint

- **Tuner gain** is its own collapsible Explore box (no longer inside Receiver).
- Settings → Extras → **Explore · tuner gain** (default **on**).
- Locked admin-login hint uses fixed height — stops the Explore controls jumping every 500 ms.
- - **Tuner gain** is its own collapsible Explore box (no longer inside Receiver). - Settings → Extras → **Explore · tuner gain** (default **on**). - Locked admin-login hint uses fixed height — stops the Explore controls jumping every 500 ms.

### [634] — Public mode hardening (no guest bypass)

- **Host public bake** now applies a **safe visitor allowlist** to every browser;
- **Guests** on any public receiver always get safe defaults unless the host bakes
- **Handler checks** mirror UI gates: retune, record, clear, import/export, layout.
- **Alone / courtesy**: fail-closed when listener count is unknown on public receivers.
- Removed one-time migration that promoted empty public allowlists to “allow all extras”.
- - **Host public bake** now applies a **safe visitor allowlist** to every browser; `localStorage` and Settings edits cannot widen guest permissions on baked installs. - **Guests** on any public receiver always get safe defaults unless the host bakes `TOOLBOX_PUBLIC_POLICY` in `toolbox.js` (admin → Copy policy for install). - **Handler checks** mirror UI gates: retune, record, clear, import/export, layout. - **Alone / courtesy**: fail-closed when listener count is unknown on public receivers. - Removed one-time migration that promoted empt

### [633]

- a new item in the tab right-click **Box layout** menu:

### [632]

- the handler was wired too late and in the wrong order.

### [631]

- . Two things were blocking it:

### [630]

- . Header tabs were still treated as shadeable buttons, so the hover tip was appending “Right-click to change this button's colour” on top of the box-layout line.

### [629]

- tab right-click and box spacing are updated.

### [628]

- . The section **?** help popup was rendering as a blank white box for two reasons:

### [626]

- the “two floating help” issue came from a few places stacking tooltip UIs on top of each other.

### [624]

- . The webhook box was sitting **outside** the scrollable sub-pane (sibling to Audio list / Record), so it stayed pinned at the bottom of the tab while only the sub-pane content scrolled.
- STT webhook scrolls inside list/record subpane (not pinned below).

### [623]

- Audio STT webhook box at bottom of Audio tab.

### [620]

- (hard-refresh).

### [618]

- hard-refresh the receiver.
- Center screen tick under Jump tuning.

### [617]

- Jump Cluster kHz max raised for DAB / FM auto defaults.

### [616]

- (deployed live).
- deferred Identify build must include LLM URL between Guesses and meta gate.

### [615]

- LLM URL always visible between Guesses and Signal metadata (not collapsed).

### [612]

- Jump tuning sliders under Jump loudest + Settings box.

### [610]

- External classifier under Guesses, closed by default.

### [609]

- External classifier own box (was buried in “Identify tips”).

### [601]

- Analyzer Alone (only if alone) courtesy tick.

### [594]

- Display before Presets.

### [592]

- proper Scan span MHz fields (not tiny number boxes).

### [591]

- Reset Analyzer layout button beside Reset Explore.
- Analyzer movable boxes (Wide/Half + drag) need bs-sa-root.

### [590]

- Run | Mute+freq | Scan span — rebuild if mute strip missing.

### [588]

- Analyzer **Span · Live** now has:
- Analyzer dwell presets + tools row.

### [587]

- narrow Analyzer spans slow down automatically.

### [586]

- Analyzer now has the same frequency LCD as Explore (MHz digits, wheel nudge, Go, mode tag, digi S-meter) at the top of **Span · Live**.
- Analyzer frequency counter (same LCD as Explore).

### [585]

- compact preset boxes in a row (Broadcast / Aviation / HF / VHF / UHF / ISM).

### [584]

- overview spectrum is now a small instrument panel instead of grey bars:

### [583]

- Analyzer presets are in their own box, grouped and tidy:
- Analyzer presets box + grouped default spans.

### [577]

- . Identify Hop is now a 4-column grid — **Band · Step · Snap · Tune** equally spaced — with **Band mode** on its own row underneath.

### [569]

- hard-refresh to see it.

### [568]

- hard-refresh, open Audio, wait a few seconds for scoring to finish, then try **Play voice**. It’s a heuristic, not perfect STT; tighten Record gates if you still get too much junk.

### [567]

- hard-refresh and try scrolling to the top while a clip or Play-all is running.

### [566]

- hard-refresh, then open Range → Spectrum after a scan.

### [565]

- hard-refresh the receiver page.

### [555]

- fewer boot retries — button usually mounts on first/second try.

### [554]

- hard-refresh.

### [553]

- hard-refresh.

### [552]

- hard-refresh.

### [551]

- hard-refresh (Ctrl+Shift+R) so the old stylesheet isn’t cached.

### [550]

- hard-refresh.

### [549]

- Jump only moves the VFO. Same waterfall / same profile.

### [548]

- hard-refresh.

### [545]

- hard-refresh.

### [544]

- 1. **Open panel on startup** — Toolbox only loaded after a click, so the setting never ran. It now loads and opens after the receiver paints. 2. **Auto-click Start OpenWebRX+** — same boot skip; it now retries the Start overlay early (and with a few more click targets). 3. **Always Identify** — Identify was blocked as “experimental,” so it always fell back to Explore. Explicit Default tab is honored now.

### [543]

- hard-refresh.

### [542]

- hard-refresh.

### [541]

- hard-refresh.

### [540]

- hard-refresh, then try Half and a drag.

### [539]

- hard-refresh.

### [538]

- hard-refresh.

### [537]

- hard-refresh.

### [536]

- hard-refresh and try it on a few bands.

### [534]

- hard-refresh and try Jump again.

### [533]

- hard-refresh.

### [532]

- hard-refresh.

### [531]

- hard-refresh the receiver.

### [530]

- hard-refresh, then try Jump loudest again. If it still won’t move, check Explore → VFO that **Lock tune** is off.

### [528]

- hard-refresh, then try Jump loudest again on FM.

### [527]

- hard-refresh.

### [525]

- hard-refresh.

### [524]

- hard-refresh.

### [512]

- hard-refresh the receiver.

### [503]

- hard-refresh the receiver.

### [491]

- Ident open is a dedicated light path — never runs full switchTab work.
- Ident build is openIdentifyTabSafe only — no chunked fill, no full wire.

### [485]

- has Settings → **Experimental** with Identify + Analyzer.

### [484]

- build chrome first, then one tab per turn — avoids "Page Unresponsive".

### [467]

- hard-refresh.

### [466]

- hard-refresh):

### [465]

- hard-refresh.

### [464]

- hard-refresh.

### [462]

- the earlier fixed heights were clipping the text, and a leftover CSS block was still forcing the short sizes.

### [460]

- hard-refresh to see it.

### [459]

- hard-refresh to pick it up.

### [457]

- hard-refresh the receiver page to pick it up

### [451]

- this was us, from today’s waterfall lock.

---

## Version bumps without a captured note


441–450, 452–456, 458, 461, 463, 468–483, 486–490, 492–502, 504–511, 513–523, 526, 529, 535, 546–547, 556–564, 570–576, 578–582, 589, 593, 595–600, 602–608, 611, 613–614, 619, 621–622, 625, 627, 643–651, 653–654, 663–665, 671


These were typically small CSS/UI deploys, panel migration hooks, or Help syncs between larger features.


## Recent unlogged builds (this session / late series)

- **v663** — Post-662 FM Jump polish (homelab iterates).
- **v664** — Homelab iterate.
- **v665** — Homelab iterate.
- **v666** — Homelab iterate.
- **v667** — FM Jump extras → Settings experimental only; Jump loudest off on WFM broadcast.
- **v668** — OWRX/Ch chip shows step; no freq highlight on chip click; OWRX step box seeded on startup.
- **v669** — Reject birdie buttons default purple (match LCD −/+).
- **v670** — Band ◀/▶ wraps last→first / first→last.
- **v671** — README + Help: Raspberry Pi / small PCs performance guidance.
