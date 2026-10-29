# Changelog

## [B304] — Explore Go MHz (all SDR types + docs)

- **Explore → Go** scopes profile pick to the **OpenWebRX device id** (two RTL sticks, HackRF vs Airspy, custom Soapy names) — not only SDR kind. Uses full **profileFreqRange** (labels + cached metadata). **Help** and **README** explain Go MHz for every supported radio type.

## [B303] — Explore Go: nearest band on same SDR (555 MHz HackRF)

- **Go MHz** on HackRF (or **SDR only**) switches to the **closest band on that radio** when no profile label includes the target (e.g. 555 MHz → HackRF 70cm), then tunes — same idea as RTL. Does not pick another stick’s profile when you are already on HackRF.

## [B302] — Explore Go respects SDR only (HackRF)

- **Explore → Go MHz** with **SDR only** set (e.g. HackRF) picks a profile on that radio only — no silent jump to another SDR’s band (e.g. MW ~1 MHz when you typed 555 MHz). Clear status when no HackRF/RTL profile covers the target MHz.

## [B301] — Import browser data

- **Settings → Data & housekeeping:** **Import browser data** restores JSON from **Export browser data** (settings merge; peaks, log, decoder, QSO, heat, watches, loaded bookmarks replace). Backup-kit files import settings, layout, and bookmarks only. Audio still not included.

## [B299] — Detach in this tab = floating box

- **Detach in this tab** opens a **movable, resizable** panel (like undocked Toolbox), not a fullscreen layer over the receiver. Main Toolbox stays clickable.

## [B298] — Two-file install only

- Detached **tab** pop-outs no longer need **`tab-popout.html`** — bootstrap shell is built from **`toolbox.js`** (blob URL + `toolbox.css`). Copy **`toolbox.js`** + **`toolbox.css`** only.

## [B297] — Export browser data

- **Settings → Data & housekeeping:** **Export browser data** builds one JSON backup on click (settings, peaks, log, decoder, QSO, bookmarks, heat, watches). Audio clips excluded; no extra work at load time.
- README, Help tab, and `docs/storage-quotas.md` / related pages document backup vs per-tab export.

## [B296] — Audit fixes

- **Max audio** quota trim drops oldest clips (same as recording), not newest.
- Deploy/archive scripts read **B###** `_version`; storage-quota docs added.

## [B295] — Heat days default 30

- Band × hour heatmap window defaults to **30 days** (max allowed; was 7). Saved **7** migrates once.

## [B294] — Storage quota default 999

- Settings storage caps default to **999** (was 400); saved **400** values migrate once on load.

## [B293] — Win row above util row

- **S · R · − · ×** on the top chrome row (with the version line); **Find · 100 · % · M** on the row with tabs.

## [B292] — Header chrome flush right

- Eight tool buttons pin to the far right (2×4); version text slightly larger with clearer `|` spacing.

## [B291] — Split header links

- **OWRX Toolbox vB…** → toolbox repo; **G4EA5 GitHub** → github.com/G4EA5.

## [B290] — Header 4+4 grid restored

- Right column: Find·100·%·M over S·R·−·×; version centred on the top row beside the upper four.

## [B289] — Header label → GitHub

- Centred **OWRX Toolbox vB… - G4EA5** opens [github.com/G4EA5](https://github.com/G4EA5) in a new tab.

## [B288] — Header build label

- Centred header shows **OWRX Toolbox vB… — G4EA5** (not bare `vB…`).

## [B287] — Version on Find row

- Build label is centred on the same line as Find · 100 · % · M; tabs align with S · R · − · ×.

## [B286] — Version centred on top

- Centred band above tabs (superseded by B287).

## [B285] — Version on tool row

- Build label beside header buttons (superseded by B286).

## [B284] — Uniform header tool buttons

- All eight top-right chrome buttons (Find, scale, %, M, S, R, −, ×) use the same square size.

## [B283] — Version above tabs

- Build label (**vB…**) centred on its own row **above** the main tab strip (tools stay top-right on the tab row).

## [B282] — Compact header chrome

- Build **version** sits left, vertically centred, slightly larger type.
- Header tools stack: **Find · scale · % · M** on top; **S · R · − · ×** underneath — frees tab strip width.

## [B281] — Mute scan beep

- **Mute beep** in Bands scan strip **Courtesy** and Range **Scan options → Courtesy** — silences the new-peak beep during scans (bookmark scans too). Synced with Range; independent of **Sound on new peak**.

## [B280] — Header chrome + Find / Minimal defaults

- Build version and all header tools (− × R S M % scale Find) sit on **one line** with main tabs, matched height.
- **Find** and **Minimal (M)** header buttons are **on by default** (existing installs migrate once).

## [B279] — Detach tabs in the dock browser tab

- Right-click a main tab → **Detach in this tab (dock page)** or **Detach together in this tab…** — fullscreen overlay on the receiver tab (same browser tab as the side dock), no extra window.

## [B278] — Help not detachable

- **Help** (and **Settings**) cannot be detached to a pop-out; any stray detached Help tab is reattached on sync.

## [B277] — Header + side dock defaults

- Removed **← / →** main-tab arrows from the panel header (use the tab strip).
- Default **side dock** width is **33%** (was 35%); **%** reset uses 33%.

## [B276] — Help (?) as main tab

- Help manual is a **?** tab after **Settings** in the main strip (header ? button removed).

## [B275] — Pop-ups follow detached tabs

- Shared overlay helpers; Find, Factory reset, tab context menu, detach pickers, colour picker, bookmark/band editors, Identify raw data, and S-meter cal mount in the detached window.

## [B274] — S-meter Calibrate when Settings detached

- Calibrate dialog and shade mount in the detached Settings pop-out window (not hidden on the main receiver tab).

## [B273] — Settings SDR devices typography

- SDR hardware cheat sheet in **Settings → SDR devices** uses normal settings text instead of large amber solar-grid styling.

## [B272] — Settings General + Public completeness

- **General** — restore **UX feel** and **Light features** settings boxes.
- **Public** — visitor allowlist for **header buttons** (Help/Find/Minimal), **extra sections**, and **network budget** cap; buttons **Sync tabs from Visible**, **Allow all extras**, **Safe More panes**, **Allow all extra sections**.

## [B271] — Public: allow all More panes

- **Settings → Public** — **Allow all More panes** ticks every More sub-tab in the visitor allowlist (and adds the More main tab if it was off).

## [B270] — Drop duplicate FM Jump settings box

- Remove the large **Jump tuning · experimental (FM broadcast)** box from Settings → General; enable **Jump · FM broadcast** and Grid / ±kHz / Detect live under **Settings → Extras** only.

## [B269] — Settings → Public: block Explore steal

- Settings → Public buttons no longer jump to Explore: programmatic `switchTab` is ignored while Settings/Public is engaged (UI lock + pane detection), and `currentPanelTab()` prefers the Settings pane when it is on.

## [B268] — Settings → Public: stay on Settings

- Fix Public sub-tab controls (public mode, allowlist, Allow all, …) jumping to Explore — pin Settings header/pane during public policy refresh and skip `applyHiddenTabs` tab switches while Settings is open.

## [B267] — One scan / analysis at a time

- Exclusive radio jobs: starting Analyzer Live, Identify Live, Scan bands/range/bookmarks, or Nest scan prompts to stop whatever else is running (including across Toolbox windows on the same browser).
- Blocks double-start of the same job; Analyzer “Live on open” asks before stopping an active scan.

## [B266] — Settings → System: other receiver plugins

- New **Other receiver plugins** panel lists every id on `window.Plugins` (besides the loader), version tags, script paths, Toolbox integration notes (notify, band_survey clash), and `owrx_receiver_plugins` in Nerd export.

## [B265] — Settings → System: Toolbox plugin files

- New **Toolbox plugin files** panel: build tag, local vs CDN install, host disk KB, combined line/char counts, per-file transfer vs decoded sizes (Performance API), URLs, Re-scan, and **toolbox_files** in Nerd vault export.

## [B264] — Settings → Public: no Explore steal

- Fix duplicate `bs-tab-on` on the header (Explore + Settings) so Public sub-tab and allowlist edits no longer retune to Explore.
- Public policy refresh uses header visibility sync only (not full `applyHiddenTabs` tab switch).
- Opening **Settings → Public** pins the Settings main tab.

## [B263] — Settings → Public: stay on Settings

- Ticking Public allowlist controls no longer jumps to Explore — `currentPanelTab()` respects the Settings header, and `applyHiddenTabs()` does not retune the main tab while Settings is open.

## [B262] — Fix Toolbox boot black screen (B261)

- Stop Settings → Public admin refresh from running during panel build / restore (could stall or blank the page after “Loading Toolbox…”).
- Reentrancy guards on public/extras UI refresh so nested apply calls cannot recurse.

## [B261] — Public settings clickable for owner/admin

- **toolbox_public_mode: false** from OpenWebRX (default on patched hosts) no longer locks the Toolbox **Public / shared receiver** tick or greys out the whole Public sub-tab — only **server ON** is read-only here.
- **Settings** stay usable while the admin probe is pending; **Public allowlist** edits work on personal installs (`TOOLBOX_ALLOW_OWNER_OVERRIDE` true) even when the `/settings` HTML probe is flaky behind a proxy.
- Opening **Settings → Public** re-runs the admin check and refreshes Public controls.

## [B260] — Public Allow all + Identify tab switch

- **Settings → Public → Allow all** updates the form again on hard-public installs (session edit + Copy policy) instead of snapping back to baked safe defaults; save no longer wipes the in-memory draft while you are logged in as admin.
- **Identify / Analyzer** tabs show in the header when enabled under Visible tabs even with **Lean chrome** or **Simple mode** on.
- **Allow all** turns on Identify and Analyzer in Visible tabs; **Identify** tab open works in detached pop-outs (correct document for pane + tab bar).

## [B259] — Nerd vault: more debug stats

- **FFT near VFO** (bins, min/max/mean dB, tune bin, Waterfall min/max), **Toolbox hooks & jobs**, **localStorage top keys**, **sessionStorage**, **footer bars**, **Live pulse JSON**, and **navigation timing** (TTFB/DOM/load) in Settings → System → Nerd vault and nerd export.

## [B258] — System Live pulse: decode, passes, ping

- **Last decode** — latest Log / decoder line with **Tune** button when MHz is known.
- **Space (LEO passes)** — selected satellite pass line + next birds (after More → Passes TLEs); **Following** badge when Doppler follow is on.
- **HTTP ping** chip — round-trip to **status.json** and **hoststats.json** (~12s while System is open).

## [B257] — Settings → System: Live pulse

- New **Live pulse** box: active Toolbox jobs, detached windows (with **Focus window**), panel layout, peaks/clips/log/storage quotas, browser network + viewport, **status.json** age, and quick links (**status.json**, **hoststats.json**, **Copy MHz**, **Copy build**). Included in System export JSON.

## [B256] — Identify detached: overview spectrum live

- **Overview spectrum** (and Live identify) keep updating in a detached Identify pop-out while you run scans on the main window — no longer frozen when the main panel is on another tab.

## [B255] — Detached tabs: drop duplicate title bar

- Pop-out windows no longer show the extra header row with the tab name — the tab strip (and window title) already identify the tab. **Reattach all** sits on the right of that strip; single-tab pop-outs show only **Reattach all**.

## [B254] — Audio: stop clip playback on tab / panel leave

- **Settings → Appearance:** **Stop clips when leaving Audio** (default on) — ends Play / Play all when you switch away from **Audio** or **Decode**.
- **Stop clips when closing panel** (default on) — stops playback when you close Toolbox with **×**.

## [B253] — Bookmarks options: Record busy on by default

- **Record busy** under **Bookmarks → Bookmarks options** defaults to **on** (matches factory settings). Older saves are upgraded once; checkboxes no longer flip off before the form is filled from saved settings.

## [B252] — Explore boxes: hide (×) next to ?

- Each hideable Explore box gets **×** to the right of **?** — confirms, then hides the box (same as unticking it under **Settings → Visible tabs → Explore boxes**). **Tune** stays always on.

## [B251] — Explore Tune: remove collapse chevron

- Tune header is no longer a collapse toggle (chevron removed); Mute/Vol/Shot stay on the right. Collapse did not hide the scope row because of pinned layout CSS.

## [B250] — Hide HTTP note on detached tabs

- **Settings → Appearance → Hide HTTP note on detached tabs** — suppresses the “Same receiver (HTTP) / Not secure” banner on tab pop-outs (HTTP only).
- **Hide** on the banner saves the same preference; loading line in `tab-popout.html` stays short when hidden.

## [B244] — More → News: more feeds + orange Refresh

- Added Southgate, SOTA, RAC, Hackaday (ham), DARC, Essex Ham, and ARRL Audio RSS chips (feed list built from `NEWS_FEEDS`).
- News **Refresh** uses standard orange `bs-btn-refresh` (matches header hard-refresh **R**).

## [B243] — News RSS proxy crash fix (OpenWebRX)

- `/owrx-toolbox-rss` no longer crashes on `query_arguments` (uses `request.query` like other OWRX controllers). News/Feeds load via the receiver proxy again instead of hanging on “Loading headlines…”.

## [B242] — More → Read → News: auth + switch feeds while loading

- RSS fetch sends **credentials** and copies **dash_auth** / **hub_auth** from the page URL for homelab auth-proxy.
- Clearer login error; 22s timeout per attempt; switching ARRL/RSGB/… cancels the stuck load and starts the new feed.

## [B241] — More → Read → News: bind + RSS fetch

- News Refresh and source chips wire reliably (delegated clicks, re-bind after More tab moves / rebuild).
- RSS fallback uses AllOrigins `/get` JSON; stale More panes without News controls force a panel rebuild.

## [B240] — More → Links: visible rules and full 20-word blurbs

- Double rule is a dedicated bar **above** each category title (brighter, not on the `h3` border).
- Descriptions are **20 words** each; nested per-category scroll removed so text is not clipped.
- Deploy live `htdocs` was stuck on B237 (20-character cap) — sync watchdog + htdocs together.

## [B239] — More → Links: rule above category title

- Double line sits **above** each category heading (was under the title).

## [B238] — More → Links: 20-word descriptions

- Site blurbs may use up to **20 words** each (restored full sentences; B237’s 20-character cap was a misunderstanding).

## [B237] — More → Links: 20-character blurbs (superseded by B238)

- Brief experiment; use B238 instead.

## [B236] — More → Links: larger category headings

- Section titles use bigger type and a double rule under each category name.

## [B235] — Header: − × on version row, R under ×

- Minimize and Close sit on the top row beside **vB…**; hard-refresh **R** stays on the row below, right-aligned under Close.

## [B234] — More → Links: ten categories × ten (100)

- **OpenWebRX & SDR**, **Remote receivers**, **DX & news**, **Logbooks**, **Propagation**, **Digital modes**, **Satellites**, **Beacons & time**, **Repeaters & scanners**, **Societies & contests**.

## [B233] — More → Links: six categories × ten

- **SDR & web receivers**, **DX spots & logbooks**, **Propagation & conditions**, **Satellites & tracking**, **Beacons, repeaters & scan**, **Societies & on-air programs**.

## [B232] — More → Links: 60 English sites

- Ham, satellites, beacons, scanning, US/UK/Europe societies; each row has a short English description (now up to 20 words in B238).

## [B231] — More → Read → Links: more ham staples

- ARRL, RSGB, SOTA/POTA/WWFF/IOTA, VOACAP, WSPRnet, band conditions, WSJT-X, DX Summit, eHam, RadioReference, HamStudy, Ofcom.

## [B230] — Range sub-tab: Scanner (was Scan)

- Inner Range bar label **Scanner** for the main sweep pane (id unchanged).

## [B229] — Detach together → new browser tab

- Main-tab menu: **Detach together to new browser tab…** (same multi-select picker as the pop-out window, opens one tab with the group).

## [B228] — Remove “Detach all tabs”

- Right-click main tab menu no longer offers bulk detach-all; per-tab detach, together, and **Reattach all** stay.

## [B227] — Header top-right sizing

- Tab **← / →** a bit smaller; **vB…** build label larger; Find / Help / scale / dock row buttons slightly larger.

## [B226] — More pane arrows: no horizontal jump

- Reserve scrollbar gutter on scrolling More sub-panes; ← / → / ? sit in a fixed-width header cluster so they stay put when some panes scroll and others do not.

## [B225] — More tab: ← / → beside each pane’s ?

- Step through every **visible** inner More pane in order (e.g. Spots DX → RBN → POTA → … → Read Chart), wrapping at the ends. Skips panes hidden in Settings.

## [B224] — Header: tab arrows beside build version

- **←** / **→** sit on the version row (left of **vB…**), larger than the chrome button row. Still step through visible main tabs with wrap.

## [B223] — Header: prev/next arrows before Help

- **←** / **→** beside **?** step through visible main tabs (including Help when shown), wrapping at the ends. Detached tabs still open in their pop-out.

## [B222] — More tab: clearer hover tips on groups and inner panes

- Rewrote `title` / float-tip text for every More group (Spots, Space, …) and sub-tab (DX, Prop, News, …) — live vs static, click-to-tune, and what you will see.

## [B221] — Docs: Docker persistence (README, Help, first install)

- Clarify what survives container restart vs browser vs OpenWebRX data volumes (`init.js`, local toolbox files, yellow bookmarks).

## [B220] — Explore audio scope after tab detach / reattach

- Re-pin the Explore **Tune** row (audio FFT + S-meter) in the tab’s document when a main tab moves to or from a pop-out.
- Restart the audio scope canvas loop using `tabPaneDocument("explore")` so the white empty scope box does not stick after **Reattach**.

## [B219] — Header: version above chrome buttons, uniform sizes

- Build tag (**vB219**, etc.) sits top-right above Find / Help / scale / dock / refresh / min / close.
- All header chrome buttons share the same rectangular size as the panel scale control.

## [B218] — Scan bookmarks works in detached Bookmarks pop-out

- Re-bind **Scan bookmarks** / **Stop** / **Hold** / **Skip** on the scan strip when `#bs-toolbar` moves into a tab pop-out; `$()` resolves those controls in the detach window. Passes prompt and job-conflict dialogs use the pop-out window.

## [B217] — Bookmark scan Stop clears “Stopping…” status

- **Stop** on bookmark scan clears hold/skip state, aborts in-progress recording waits, and always replaces **Stopping…** with a finished message (quiet-status filter no longer swallows “Pass … stopped” lines). If the loop does not exit within a few seconds, scan state is torn down anyway.

## [B216] — Detached Range scan: progress on Range, not Bands

- Main **Bands** scan strip (and progress) no longer appears while a **Range** scan is running (including when Range is in a pop-out). Bands **Scan bands** button label is not switched to “Scanning bands” during Range scans.

## [B215] — Explore Hop row: even button gaps

- **Jump loudest**, **Reject birdie**, and **ID** use the same **8px** gap between them (ID no longer pushed to the far edge).

## [B214] — Explore Hop row: roomier ID button

- **Jump loudest** and **Reject birdie** cap at ~38% width each; **ID** is larger at the end of the row.

## [B213] — Scan status on detached tab, not over Explore

- When **Range**, **Bands**, or **Bookmarks** is in a pop-out and a scan is running, **status + progress** show on that tab (inline under the section tabs / Range scan box), not on the main receiver tab over Explore.
- Main scan strip no longer uses the generic “busy” bands toolbar during a **Range** scan; toolbar follows detached **Bands** / **Bookmarks** scans even if another sub-tab is selected in the pop-out.

## [B212] — Dialogs on top in detached tab pop-outs

- **Load yellow**, bookmark/band edit, box **?** help, Find, Identify raw packets, factory reset, and S-meter cal dialogs mount on the **detach window’s** `document.body` (not the main receiver tab behind the pop-out).

## [B211] — Scan bookmarks strip on Bookmarks tab again

- **Scan bookmarks** (and Hold / Skip / …) live in the **scan strip** between the main tab bar and the tab body — not inside the Bookmarks sub-panes. Fixed toolbar logic that hid that strip on Bookmarks when another tab was open in a detach pop-out.

## [B210] — Reattach restores Bands scan strip without refresh

- **Reattach** / **Reattach all** moves `#bs-toolbar` back into the main panel with `adoptNode` before the pop-out closes (closing the window had been destroying the strip).

## [B209] — Detach pop-out: full Bands chrome + tab / same-window options

- **Bands / Bookmarks** pop-outs always show the **Scan** toolbar (even when “Show scan strip” is off on the main panel); strip is inserted above sub-tabs on mount.
- Right-click menu: **Detach to new browser tab**, **Add to open pop-out** (one window or picker), plus existing new-window / together / add-to-list items.
- Pop-out tab bar supports the same right-click detach menu as the main Toolbox.

## [B208] — Detached Bands / Bookmarks include scan strip

- When **Bands** or **Bookmarks** is in a tab pop-out, the shared **Scan bands** / **Scan bookmarks** toolbar (`#bs-toolbar`) moves into that window above the sub-tabs and band list — not left on the main receiver tab.

## [B207] — Fix plugin load (syntax error in HTTP detach note)

- Repaired a broken string in the detached-tab HTTP banner that prevented `toolbox.js` from parsing (no Toolbox button / auto-open).

## [B206] — Range scan in detached pop-out

- Full Range tab wiring when the pane is in a pop-out (Scan / Fresh / Stop, MHz inputs, mode, grid).
- Range scan confirm/prompt dialogs show on the detach window (coverage gaps, ask passes).
- `readRangeForm` reads scan mode from the detached pane; cold Range inject binds controls on build.

## [B205] — HTTP security note on detached tab pop-outs

- Expanded pop-out banner: same origin as main Toolbox, what “Not secure” means, cleartext traffic and logins on HTTP, LAN vs remote (HTTPS / VPN-only).

## [B204] — Detached Bands edit + reattach confirm on pop-out

- **Bands edit** in a detached window: sub-tabs and edit list are wired in the pop-out; the edit dialog opens on that window (not hidden on the main receiver).
- **Reattach all** in a pop-out uses `confirm()` on the pop-out window so the prompt is not stuck behind the detached window.

## [B203] — Reattach: tab panes refresh (Analyzer display)

- After **reattach**, duplicate tab panes in the main panel are removed so IDs like `#bs-sa-spec` resolve to the visible pane.
- **Analyzer** (and Range/Bands/Explore) re-bind layout, resize observers, and redraw spectrum/waterfall when a pane moves back from a pop-out.

## [B202] — Detached tabs: Range scan + DOM lookup

- Range **Scan range** works in detached pop-outs (correct MHz reads, SDR row, Stop button, handlers re-bound on detach).
- `$()` prefers controls inside detached tab panes; `currentPanelTab()` follows the active pop-out tab for paired Bands/Range options.

## [B201] — Reattach closes pop-out windows

- **Reattach all tabs** (and each window’s Reattach all) moves panes back and **closes** detached pop-outs, with a confirm dialog before bulk reattach.

## [B200] — Range MHz in detached pop-out

- Detached Range tab now syncs start/end MHz (e.g. 144–146) and scan options from settings into the pop-out pane.

## [B199] — F5 on detached tab window

- Pop-out URL carries `group=` so after **F5** the receiver re-mounts tabs into that window (keep the main receiver tab open).
- Rebuilds pane HTML when refresh destroyed the old pop-out document.

## [B198] — Tab detach menu always; HTTP note on pop-outs

- Right-click **any** main tab (Explore, Bands, …) always opens the menu — turn on **Detach main tabs** from the menu or Extras.
- Clearer labels: **Detach this tab to new window**, **Detach all tabs to new windows**.
- Pop-out URL locked to the same receiver address; brief note when the site is HTTP (browser “Not secure” is expected unless you use HTTPS).

## [B197] — Recover lost detached tabs

- Closed or missing pop-out windows no longer leave Explore/Bands/Range “gone”: reconcile rebuilds panes in the main Toolbox and clears detached tab styling.
- Right-click any tab for **Reattach all tabs** when tabs are lost (even if Detach extra was turned off); full detach menu when the extra is on.

## [B196] — Tab menu vs hover tip

- Right-click tab menu / Detach together picker dismisses the floating hover tip so it does not sit on top of menu items.

## [B195] — Detach pop-out boot fix + Reattach all on menu

- Tab pop-outs call back to the receiver (`tab-popout.html` handshake) so **Detach together** no longer sticks on “Loading tab…”. **Reattach all tabs** is always the first item on every main-tab right-click menu.

## [B194] — Detach tab groups (2–3+ per window)

- Each detached window has a **mini tab bar** for every pane in that group. **Detach together…** picks multiple tabs; **Add to window** merges into an existing pop-out. **Detach all** opens windows in **groups of 3**.

## [B193] — Detach all main tabs

- Right-click any main tab → **Detach all visible tabs** (up to every bar tab you have visible) or **Reattach all detached**. Per-tab cap removed; **Help** stays in the main Toolbox window.

## [B192] — Detach tab URL

- Tab pop-outs open `tab-popout.html?tab=…&label=…` under the Toolbox plugin path instead of `about:blank`.

## [B191] — Detach tab pop-out layout

- Detached tabs mount inside a mini `#bs-panel` / `#bs-body` shell so Explore and other panes keep normal Toolbox CSS (fixes overlapping controls in tab pop-outs).

## [B190] — Detach main tabs (optional Extra)

- **Settings → Extras → Detach main tabs** (off by default): right-click a main tab → **Detach to new window** for a second monitor; **Reattach** from the menu or the pop-out header. Full-panel **D** detach still works; individual tab detaches are cleared when you detach the whole Toolbox.

## [B189] — More: 12 panes × 7 groups, My feeds under Read

- Each More group (Spots, Space, Tune, Sky, Here, Sked, Read) has **12** inner panes; sub-tab bar uses a **6×2** grid.
- **Feeds** group removed — **Read → My feeds** (same RSS UI as before).
- **12** new lightweight panes (static notes, WSPR/RTTY/Pager dials, Here → DMS, etc.) — no extra background polling.

## [B188] — Revert B186 tab chrome

- Restored classic yellow main tabs and plain sub-tab bars (removed per-tab colours, glyphs, and gradient sub styling from B186). Coverage map fixes (B187) unchanged.

## [B187] — Bands Coverage map scale fix

- Fixed MHz vs Hz bug that squashed the bar to ~±0.05 MHz; axis and gaps use correct units; status.json spans preferred over name parsing.
- Zoom presets (All / HF / VHF / UHF / ≥1 GHz), grid background, centre axis label.

## [B186] — Tab and sub-tab chrome (CSS only)

- Main header tabs: per-tab accent colours, small glyphs, active tab uses that accent (not one flat yellow for every tab).
- Sub-tab bars: segmented “pill” look, pane-matched accent on the selected sub-tab, icons on common subs; More groups get matching glyphs.

## [B185] — Bands Coverage map size

- Taller MHz bar (full width, ~72px+), axis labels, and a scrollable profile chip list when spans are too narrow to read on the bar.

## [B184] — Coverage, Now, Session sub-panes

- **Bands → Coverage** — MHz map of OpenWebRX profile spans, gap hints, click-to-tune; respects **SDR only**.
- **More → Here → Now** — live profile, tune, DX on this band, armed watches (refreshes while open).
- **Log → Session** — this-browser timeline of profile switches, retunes, and band scans (click MHz to tune).

## [B183] — More → Spots → DX default filter

- **DX** scope chips default to **All** (was **This band**) — full 30-minute cache on first open.

## [B182] — Explore SDR only + multi-radio fixes

- **Explore → Profile → SDR only** — wired like Bands (`bs-band-sdr-select`); **All SDRs** and per-radio picks (RTL, HackRF, Airspy, …) now save on Explore; one-time class fix for cached panel DOM (**B182+** hard refresh).
- Multi-SDR — Explore/Bands filter no longer reverts when OpenWebRX rejects a profile switch; failed HackRF revert no longer forces filter back to RTL; stock profile sync uses Explore filter only (not Range / Analyzer / Identify choosers).
- **All SDRs** — live profile changes no longer auto-narrow the filter from “show everything”.
- HackRF — longer switch settle / revert detection; status hint when profile does not stick.
- **Settings → Visible tabs** — split **Main tabs** vs **Header buttons** (? Help, Find, Minimal **M**); Appearance copy points to the new section.
- Header chrome — minor alignment for version label and top-right buttons.

## [B174] — News / RSS feeds work again

- **rss2json** is often blocked (Cloudflare); News and **Feeds → Yours** now try **same-origin** `/owrx-toolbox-rss` (homelab proxy), then AllOrigins + XML parse, then rss2json.
- Homelab: `apply-owrx-toolbox-proxies.sh` registers `/owrx-toolbox-rss` on OpenWebRX.

## [B173] — Stale tab HTML migrations

- Upgrade cached **Memory** / **Log** panes when sub-tabs or buttons (Trace **Sample now**, Archive, Export, …) are missing — same fix pattern as B172 Trace.

## [B172] — Memory Trace works again

- **Trace sampling** extra is on by default; one-time migration for browsers that had it off.
- **Memory → Trace**: grid background, status hints, **Sample now** button; auto point when opening Trace (if sampling on).
- S-meter fallback uses raw OpenWebRX level when calibrated display is unavailable.

## [B171] — Fix Log tab scroll

- Log feed list scrolls inside the pane again (tools/header stay visible).

## [B170] — Install docs & friendlier Help / hovers

- **[docs/FIRST-INSTALL.md](docs/FIRST-INSTALL.md)** — first-install wiki (host vs browser, CDN/local, checklist).
- README install section expanded; links to the wiki.
- Help: **How tips work**, clearer first-install steps; **Check install** / layout hovers improved.

## [B169] — Easier for new users (nothing removed)

- **Simplify my panel** — Light layout + lean/simple UI + header **Find** (Settings → Layout profile).
- Fresh installs: **Find in Toolbox** on by default.
- **Advanced URLs (optional)** — collapsible block for sync / webhook / classifier / STT (same fields as before).
- Help **Start in 3 minutes** cards; Bands list **New?** hint.

## [B168] — Back to top on scrolling tabs

- Scrollable tab panes show an **↑ Back to top** control at the bottom when content overflows (Settings, Help, sub-tabs, Explore deck, …).

## [B167] — Layout profiles + Find keywords

- **Light** welcome preset hides **Settings → System** sub-tab (Public stays on). **Everything** shows System and Public again.
- Find-in-Toolbox keywords for settings sync and System/Public sub-tab toggles.

## [B166] — Homelab proxies + URL test buttons

- **Test** on Peak webhook, Settings sync, and Identify classifier URL fields; peak webhook gated on **Extras → Peak webhook**.
- Homelab: `tools/owrx_toolbox_http_proxy.py`, `apply-owrx-toolbox-proxies.sh`, same-origin `/owrx-toolbox-*` routes to local stubs.

## [B165] — Settings sub-tab visibility

- **Panel startup**: **Show System** / **Show Public** checkboxes (both on by default).

## [B164] — Settings sync stub

- `tools/owrx-settings-sync-stub.py` for homelab testing (`:8787`).

## [B163] — Peak webhook stub

- `tools/owrx-peak-webhook-stub.py` for homelab testing (`:5057`).

## [B162] — Fix Settings → Public pane

- Sub-tab switch resets scroll; `[hidden]` / CSS so Public content is visible.

## [B138] — Docs: full v965 → B era guide

- **[docs/WHATS-NEW-SINCE-V965.md](docs/WHATS-NEW-SINCE-V965.md)** — wiki-style summary of all B-era changes.
- README, Help tab **What’s new since v965**, and troubleshooting index updated to match.

## [B137] — Docs + Identify profile list

- Help tab, hover **?**, README/troubleshooting: per-tab **Choose SDR** vs Explore/Bands **SDR only** (Identify: **All SDRs** or one kind).
- Identify profile dropdown rebuilds when **Choose SDR** changes (not tied to Explore filter).

## [B136] — Identify: All SDRs on Choose SDR

- **Identify → Choose SDR** adds **All SDRs** (empty = every profile on ID tab). Range / Analyzer still pick one radio.

## [B135] — Fix Anz / Range Choose SDR reverting

- Stops background profile refresh from resetting the dropdown while you change RTL vs HackRF; per-tab values save reliably.

## [B132–B134] — Per-tab Choose SDR

- **Range**, **Analyzer**, and **Identify** each store their own SDR choice (`rangeSdrShowOnly`, `saSdrShowOnly`, `idSdrShowOnly`). **Explore** and **Bands** keep shared **SDR only** with **All SDRs**.

## [B129] — Analyzer: Main waterfall

- Wide **Start–End** spans: optional **Main waterfall** paints stitched full-span spectrum on the stock OpenWebRX waterfall while hopping tiles.

## [B123–B125] — Choose SDR bars (survey tabs)

- **Range → Scan**, **Analyzer**, and **Identify** get a top **Choose SDR** bar (DOM migration for older panels).

## [B118] — Settings layout cleanup

- **Pi & SDR** sub-tab removed; **SDR** settings stay at the **bottom of General**. **Raspberry Pi / low power** preset removed — use **Choose layout profile** (**Light** / **Band survey** / **Everything**).

## [B109] — Explore SDR only + profile hop

- ◀▶ / Alt+wheel / drag profile hop skips profiles outside **SDR only**. Choosing a filter (e.g. HackRF) switches the stock OpenWebRX profile to match when needed.

## [B108] — Explore Profile (deploy + stale DOM)

- **Hide all on this SDR** removed from shipped Explore HTML; strips legacy checkbox if an old panel was still open.

## [B107] — Explore Profile

- Removed **Hide all on this SDR** from Explore → Profile (use profile dropdown + **SDR only** filter; per-band hide stays on **Bands edit**).

## [B106] — Settings default on/off style

- Factory default **On/off style** is **Switches** (saved tick-box preference unchanged).

## [B105] — Explore Profile UI

- Removed **Hide this profile only** from Explore → Profile (use **Bands edit → Hide from list**).

## [B104] — News / Feeds URL display

- **Read → News** shows only the **selected** source’s RSS URL (not the full preset list).
- **Feeds → Yours** shows one RSS line for the **open** sub-tab only.

## [B103] — Feeds → Yours UX

- Empty headline hint names the **Refresh** button in the box (not browser F5). **Refresh**, **Remove**, **Export**, and **Import** sit on one row.

## [B102] — Fix Feeds → Yours RSS fetch

- Stops double-fetch on Add and lets a new sub-tab fetch while another feed is still loading; cache/errors keyed to the feed that was requested.

## [B101] — Feeds → Yours sub-tabs

- With **two or more** saved RSS feeds, each feed gets its own sub-tab (headlines + URL per pane). One feed stays a single pane with no extra bar.

## [B100] — Read → News shows RSS URLs

- Selected feed URL plus a list of all preset ham-news RSS links (for copy into **Feeds → Yours**).

## [B99] — More sections on **General**

- **More sections** checkboxes move from the Settings **More** sub-tab to the **bottom of General**. Sub-tabs are now General · Pi & SDR · Public.

## [B98] — Settings **Pi & SDR** sub-tab

- **Raspberry Pi / low power** and the **SDR** block (devices, profiles, hop budget, sync, …) move from General to **Settings → Pi & SDR**.

## [B97] — Hover: Settings More + main More tab

- Hover **Settings → More** explains ticking sections on that sub-tab; main **More** tab and group bars say how to add panes (Settings → More; guests → Public).

## [B96] — Deep scan follow-up

- Help install blurb + title-bar overview match **Settings → General / More / Public**; **Feeds → Yours** documented in Help.
- **Settings → More** shows a hint when public mode is on (live More panes follow **Public** allowlist).

## [B95] — Docs & help sync (Settings / Public / More)

- README, Help tab, hover **?** intros, and `docs/troubleshooting.md` updated for Settings **General · More · Public**, Public **More · …** allowlist, and current More group layout.

## [B94] — Public More: grouped boxes at bottom

- Visitor allowlist **More** panes sit at the **bottom** of Public settings — **one mini-box per More group** (Spots, Space, Tune, …), not one long list.

## [B93] — Public allowlist: More sections

- **Settings → Public** visitor allowlist includes **More sections** (grouped panes). Guests only see More panes you tick; policy exports in **Copy policy for install**.

## [B92] — Fix Settings → More sub-tab

- **More** under Settings (More sections) works again — B88 added the sub-tab but the switcher only allowed General/Public, so the pane never opened.

## [B91] — Settings: Pi box above SDR + spacing

- **Raspberry Pi / low power** sits directly above the SDR settings block. Settings boxes use a bit more gap (8px) between sections.

## [B90] — Settings: SDR block at bottom

- **SDR devices**, behaviour profiles, preferred stick, band-pack pins, network budget, hop master, storage quotas, keyboard remap, and settings sync URL move to the **bottom** of Settings → General (after Extras).

## [B89] — Fix Show scan strip setting

- **Show scan strip** now saves and applies immediately; drops legacy **Always hide scan strip** checkbox if still in the panel.

## [B88] — Settings: More sub-tab + grouped More sections

- **Settings → More** holds **More sections**, with checkboxes in bordered groups (Spots, Space, Tune, Sky, Here, Sked, Read, Feeds) matching the More tab bar.

## [B87] — Analyzer: fixed box widths

- **Anz** tab drops per-box **Wide/Half** resize; layout uses the factory widths (drag titles still reorders). **Reset Analyzer layout** restores order only.

## [B86] — Bands packs: Download all only

- Installed-pack backup is a single **Download all (SDR)** button — no per-pack download row.

## [B85] — Feeds: Remove feed / Del

- **More → Feeds → Yours** — **Remove feed** (selected) and per-row **Del** on the feed list.

## [B84] — More → Feeds: your own RSS URLs

- New **Feeds** group with **Yours** — add RSS/Atom URLs, read headlines (same fetch as News), Export/Import the list. Shift-click a feed chip to remove.

## [B83] — Settings: Show scan strip (positive toggle)

- **Appearance** uses **Show scan strip** (on by default) instead of **Always hide scan strip**. Stored preference is unchanged (`hideToolbar`); only the checkbox sense and label are flipped.

## [B82] — More: five sub-tabs per group by default

- Each **More** group shows **5** inner tabs by default (wider buttons); the other 5 are off until you enable them under **Settings → More sections**. **Top 5 per group** restores the factory set.

## [B81] — Bands: visible SDR bar; drop Beacons/Solar/Today sub-tabs

- **SDR only** is a full-width bar above Presets (list) and above the edit toolbar — injected on old DOM too. Synced with Explore / Identify / Range.
- **Beacons**, **Solar**, and **Today** removed from Bands (still under **More** → Space / Here).

## [B80] — Bands list / edit: SDR only filter

- **Bands list** and **Bands edit** add **SDR only** (same shared filter as Explore Profile and Identify). Count and empty states respect the chosen SDR.

## [B79] — Bands packs: rate in MHz

- **Rate** field and pack meta line show sample rate in **MHz** (was raw S/s).

## [B78] — Bands packs: PMR446 vs wide 70cm tile

- Pack “present” no longer treats a **wide** profile (e.g. HackRF Ham 70cm 420–450 MHz) as covering **PMR446**; PMR can be added with + / click. Remove/download use the same rule (won’t delete the whole 70cm tile).

## [B77] — Identify: SDR only profile filter (like Explore)

- **Identify → Profiles** adds **SDR only** — same shared filter as Explore (HackRF vs RTL, etc.) for the profile dropdown and ◀▶ hop.

## [B76] — Bands packs: SDR colours, backup downloads, remove

- Pack tiles are **colour-coded by SDR** (HackRF purple, RTL amber, Airspy teal, …). ✓ = installed on the selected SDR; **Shift+click** removes those profiles (admin).
- **Download** row only lists packs already on that SDR, labelled e.g. `Download Ham 20m (HackRF)`. Right-click a tile still downloads a merge template before add.

## [B75] — Bands packs: any SDR kind + device id matching

- Pack coverage / add uses normalized device kind (`smeterCalKindFromDeviceId`) so custom OpenWebRX device ids (e.g. `my-hackrf`) still match **hackrf** in the dropdown.
- **Auto** SDR uses the **active** profile’s device, not the first tile in the list. Explore **SDR only** filter uses the same matcher.

## [B74] — Bands packs: coverage per selected SDR (HackRF vs RTL)

- **Bands packs** “present / missing” and **Add all missing ham** now use only profiles for the SDR chosen in the pack dropdown (`#bs-pack-sdr`), not every RTL tile in the list.
- One-click add posts to the correct OpenWebRX device id for that SDR (e.g. `hackrf`), not the first profile in the listbox.

## [B73] — Explore: filter / hide whole SDR (RTL vs HackRF)

- **SDR only** dropdown — show just one device’s profiles (e.g. `hackrf`) in Explore hop, Bands list, and Range profile pick.
- **Hide all on this SDR** — one checkbox hides every profile for that device (e.g. all 87 `rtl_sdr` tiles) in Toolbox; local only. **Hide this profile only** = single tile (unchanged).
- Per-profile hide no longer conflated with whole-SDR hide.

## [B72] — Explore Profile: hide SDR (local)

- **Explore → Profile** adds **Hide this SDR profile** — same local flag as Bands edit → Hide from list (`bandMeta.hidden` in this browser). Hidden profiles are skipped by ◀▶ / Alt+wheel hop and omitted from the profile dropdown (current profile stays listed as “hidden” so you can uncheck). OpenWebRX profile unchanged.

## [B71] — More: ten sub-tabs per group (listener guides)

- Each **More** group now has **10** inner tabs. Added **Listen/Source/Hear/Data** style panes for SWLs: where to look, what you will hear, and **origin** of live data (NOAA SWPC, cluster feed, Open-Meteo, embedded JSON, etc.). All static or one-shot render — no extra files, no background timers; network only on panes that already fetched (unchanged).
- New examples: Spots → **Listen** / **Bands**, Space → **Wx sat** / **Track**, Tune → **NDB** / **Util**, Sky → **Source** / **Hear**, Here → **Data** / **UTC**, Sked → **BCast** / **Emcomm**, Read → **SWL** / **About**.

## [B70] — More: eight sub-tabs per group + static panes

- Every **More** group now has **8** inner tabs. New lightweight panes (no extra files, render on open only): **Spots → FT8**, **Space → SSTV**, **Tune → SWL**, **Sky → HF day**, **Here → Units**, **Sked → Field**. Static lists / notes — no background timers or network except where a pane already fetched.
- **Read → Keys** adds a compact **Q-signal** cheat block. Inner tab bar CSS fits eight buttons per row.

## [B69] — Calls filter: country abbreviations (UK, USA, DE, …)

- Filter accepts common abbrev and ISO-style codes (`uk`, `usa`, `de`, `fr`, …), plus extras (`england`, `ussr`, `uae`, `holland`, …). Multi-word queries still work (`uk foundation`). Continent shortcuts: `eu`, `namer`, `samer`, etc.

## [B68] — More → Read → Calls fills dock height

- Country callsigns list grows to the bottom of the More panel; scrolling stays inside the card list (removed fixed 520px cap).

## [B67] — Calls data embedded in toolbox.js (2-file deploy)

- Country/licence table ships inside `toolbox.js` (~65 KiB compact JSON, parsed once when you open **Calls**; embed string cleared after parse). No extra JSON on the receiver. Maintainer source: `tools/callsign-allocations.json` — regenerate with `tools/build-callsign-allocations.py` (runs `tools/embed_callsign_in_toolbox.py`).

## [B66] — Calls: licence classes (UK G1–G8, USA tiers, major EU)

- `callsign-allocations.json` **v2**: optional `licences`, `callsignSeries`, and `summary` per country. **United Kingdom** (Foundation / Intermediate / Full, M3/M6/M7, 2E0, G1–G8 regional blocks), **United States** (Technician / General / Extra / historical Novice & Advanced), plus Canada, Australia, Japan, Brazil, and major EU regulators (DE, FR, IT, ES, NL, PL, BE, AT, CH, CZ) and UK home nations.
- **Calls** UI renders licence-class and callsign-series tables; search includes class names and series; countries with detail sort to the top when unfiltered. Regenerate via `tools/build-callsign-allocations.py` + `tools/callsign_licence_patches.py`.

## [B65] — More → Read → Calls: worldwide country prefix history

- New **Calls** pane: bundled `callsign-allocations.json` (~170 countries/entities) with prefix blocks and **start/end years**, including historical entities (USSR, DDR, Yugoslavia, Netherlands Antilles, …). Filter by region, search, toggle Historical.
- **Prefix** adds **Browse countries** → jumps to Calls. Ship `callsign-allocations.json` beside `toolbox.js` (regenerate via `tools/build-callsign-allocations.py`).

## [B64] — More → Here → Prefix: online ham details

- **Prefix** still uses the local prefix → entity table, and when network is allowed fetches **Callook** (US FCC name, class, grid, address, expiry) and **QRZCQ callinfo** (country, continent, CQ, ITU, DXCC). **Full lookup** uses the same URL as Log / FT8.

## [B63] — More → Sky → Prop: sunspot number and active regions

- **Prop** (and **Bands → Solar**) now show NOAA **sunspot #** (latest monthly SWPC index) and **active sunspot regions** (today’s distinct regions), alongside SFI, K, A, and X-ray.

## [B62] — More → Space → Sats: lat/lon from OpenWebRX General GPS

- **Sats** (and **QTH**) auto-fill from OpenWebRX when you have already set receiver GPS in General settings (`Utils.getReceiverPos`, `/status.json` → `receiver.gps`, locator, or lat/lon fields). Toolbox-saved lat/lon still wins if you used Save / Sats onchange.

## [B61] — Section ? hover shows intro; click opens guide pop

- Hovering a boxed-section **?** shows that section’s short intro (same text as the pop-up lead). Click still opens the full control-tip list; **×** or outside click closes it.

## [B60] — More → Space: expanded amateur sat catalog + WX APT

- **Sats / Passes / LEO** catalog: AO-95, AO-73, RS-44 (FM + linear), XW-3, TEVEL-2-1…9, AO-123, QO-100 reference; fixed **IO-117** NORAD and removed incorrect PO-101 TLE id.
- **LEO** pane groups FM / linear / digital / geo and adds **weather-sat APT** rows (NOAA 18/19, Meteor-M) — receive-only, decode externally.
- **ISS** pane links the ARISS school-contact schedule.

## [B59] — Settings sub-tabs: General / Public

- Settings uses **General** and **Public** sub-tabs (same bar style as Log / Bands).
- **Public / shared receiver** and **Public visitor allowlist** move to the **Public** sub-tab so General is less crowded.
- Last Settings sub-tab is remembered when Extras → **Remember sub-tabs** is on.

## [B58] — Settings: no Add/Remove all on single-option boxes

- **Add all** / **Remove all** only appear when a Settings (or allowlist mini-) box has **two or more** tickable options — not on lone toggles (Public mode, network budget, Jump FM, …).
- Extras section still uses its own Add all / Remove all row at the top (not duplicated at the bottom).

## [B57] — More tab colours: yellow group / blue pane

- Selected More **group** (Spots / Space / Tune / …) is **yellow**.
- Selected **inner pane** (DX / Plan / …) is **sky blue** so both levels stay distinct.

## [B56] — More → Plan: full band lists per region

- Every Plan region (UK / EU / USA / Canada / Australia / Japan / S. Africa) now includes LF/MF through UHF where allocated: **2200 m**, **630 m**, HF, **6 / 4 / 2 m**, **1.25 m / 33 cm** (Americas), **70 cm**, **23 cm**.
- Japan 80 m shows the main fragmented windows; still check JARL. Still not legal advice.

## [B55] — More: wrap text, 7 panes/group, CB + extras

- More list rows (Plan, Call, Dial, …) wrap instead of clipping; Licence/IARU already used note cards.
- Each More group now has **seven** panes: QSL, LEO, **CB/PMR**, Es/tropo, Locator, Awards, Phonetic (all static / lazy — no extra polling).
- CB pane: US 40-ch, CEPT PR27 FM, UK midband FM, PMR446 — click to tune.

## [B54] — More Licence / IARU text wraps; Plan pointer

- **More → Read → License / IARU** use full-width note cards so long lines are not clipped by the DX row grid.
- Hints point to **More → Tune → Plan** for regional band plans.

## [B53] — Settings: multi-SDR control + network / storage / keys / sync

- New Settings boxes: **SDR devices** (switcher + hardware cheat sheet), **SDR behaviour profiles** (per kind Jump / settle / dwell), **Preferred stick by job**, **Role → SDR**, **Band packs pinned per stick**, **Network budget**, **Scan / hop master**, **Storage quotas**, **Keyboard remap**, **Settings sync URL**.
- Public allowlist: **Switch SDR device** (off by default for guests).
- More fetches honour network budget / pause-while-scanning. Hop settle and Jump can follow the active SDR-kind profile when enabled.

## [B52] — More: +14 panes (6 per group)

- Each More group now has **six** panes (was four): WWFF, Cluster filter, ISS, Meteor, Maritime, Air, MUF, Storm, WX, Noise, Special, Repeater, IARU, License.
- Still lazy — only the open pane fetches or runs timers. Hide any under Settings → More sections.

## [B51] — S-meter cal: Clear / Remove last point

- Clear this SDR and Remove now wipe the final remaining point (legacy migrate was resurrecting it from the flat cache).

## [B50] — S-meter cal: stay on selected SDR when tuning

- Cal Capture / Tune / auto-advance only switch profiles on the **selected** SDR (no more jumping to another stick whose cal list then replaces yours — that was the 3→2 points bug).
- SDR chips keep a stable order when selected (no jump to the left).

## [B49] — S-meter cal: keep all saved points (HackRF fix)

- Fixed points vanishing after Capture (esp. HackRF / UHF): dedupe no longer uses a %-of-MHz window that merged band points; over-cap trim keeps newest instead of lowest MHz; Capture locks + pins the SDR id so overlapping saves cannot clobber the list.
- Max points raised to **8**. Wild offsets are rejected with a message (not silently dropped).

## [B48] — S-meter cal: pick any SDR (chip chooser)

- Calibrate dialog leads with a clear **SDR chip chooser** listing every OpenWebRX device (full names from the Bands list), not only the one already selected.
- Tap a chip to switch OpenWebRX to that device and load its cal points. Remembers devices seen earlier if one is temporarily offline.

## [B47] — S-meter cal: SDR pick, jump buttons, auto-advance

- Calibrate dialog: choose which OpenWebRX SDR to calibrate (switches device); jump buttons match detected type (RTL / Airspy / HF+ / SDRplay / HackRF…).
- Optional **Auto-advance after Capture** (on by default) jumps to the next suggested MHz still missing a point. **Next suggested** button included.

## [B46] — S-meter cal frequency counter

- Calibrate dialog: enter MHz (with − / + step and Tune). Capture uses that frequency (tunes first if needed). Suggested chips fill the counter.

## [B45] — S-meter cal stored per SDR device

- Calibration points are keyed by the active OpenWebRX SDR id (`device|profile` → device). Switching SDR loads that device’s points; Clear only wipes the active SDR.
- Legacy single-SDR points migrate onto the current device on first use.

## [B44] — S-meter Calibrate button green

- Settings → S-meter calibrate → **Calibrate…** is green (factory shade + CSS).

## [B43] — S-meter cal: Toolbox-only (not OpenWebRX)

- Calibration applies only to Toolbox Explore / Identify meters — never rewrites OpenWebRX’s stock S-meter, `smeter_level`, or `getLogSmeterValue`.
- Squelch-open / recording gates / auto-SQL keep using the stock (uncalibrated) reading so they stay aligned with OpenWebRX.

## [B42] — Pi section: test scenarios + feedback

- Settings → Raspberry Pi / low power: ask users to try different tabs/scenarios and send feedback via GitHub issues or the OpenWebRX+ groups.io forum.

## [B41] — S-meter cal: OpenWebRX SDR guide

- Calibrate dialog: comprehensive guide to how OpenWebRX SDR types differ (RTL, Airspy, HF+, SDRplay, HackRF, Lime/Pluto/Soapy), why gain vs frequency matters, and example test frequencies per band.
- Suggested tune chips expanded (40 m / 20 m / 6 m / 2 m / 70 cm / 23 cm).

## [B40] — Multi-frequency S-meter calibration

- S-meter calibrate stores up to **5 frequency points** and interpolates offset by tune MHz (SDR gain varies by band / type).
- Popup explains RTL vs Airspy/SDRplay vs wideband TX SDRs, suggested bands (HF / 2 m / 70 cm / 23 cm), and live offset-at-tune.
- Legacy single offset still works until you capture points.

## [B39] — Add all / Remove all button colours

- Settings box **Add all** is light green; **Remove all** is orange.

## [B38] — Public allowlist preset button colours

- Settings → Public visitor allowlist: **Allow all** is teal green (distinct from the usual success green); **Safe defaults** is red.

## [B37] — Add all / Remove all on every Settings checkbox box

- Every Settings box that has tickable options (Visible tabs, More, Explore boxes, Appearance, Extras groups, Public allowlist mini-boxes, …) gets **Add all** / **Remove all** at the bottom.

## [B36] — Settings bulk buttons keep scroll

- Safe defaults / Allow all, Explore-band presets, Add/Clear extras, Show-all visibility buttons, Check install, and other Settings bulk actions preserve scroll (shared helper).
- applyHiddenTabs also restores Settings scroll when you stay on that tab.

## [B35] — Low-power preset keeps Settings scroll

- Settings → Apply / Undo low-power preset no longer jumps the panel (or page) to the top.

## [B34] — Public allowlist: Add all / Remove all per box

- Settings → Public visitor allowlist: each checkbox mini-box (Tabs, Explore bands, Scans, Extras · …) has **Add all** / **Remove all** at the bottom.

## [B33] — Explore boxes honour Settings untick / factory reset

- Fix: Explore CSS `display:flex` was overriding HTML `[hidden]`, so unticked Explore boxes (and post–factory-reset defaults) still appeared on Explore.
- Factory reset / Reset settings now re-apply Explore box (and related) visibility to the live panel.

## [B32] — Settings → Update Toolbox

- Settings → Install check → **Update Toolbox** (admin): CDN `@main` checks GitHub and reloads; local / pinned installs download a zip of the latest `toolbox.js` + `toolbox.css` to copy onto the host (browser cannot write radio files).
- Hard-refresh cache bust also covers cross-origin CDN script/CSS URLs.

## [B31] — CDN install: not a bash command

- README + Help: the `Plugins.load(…)` CDN snippet is **JavaScript for `init.js`**, not a terminal download; it loads JS+CSS in the browser and does not save files to disk. Point to `git clone` / `curl` for on-disk copies.

## [B30] — Raspberry Pi / low-power preset (experimental)

- Settings → **Raspberry Pi / low power**: one-click experimental preset that hides juicier tabs (Analyzer, Identify, More, Watch, Range) and trims Explore boxes for Pi / small PCs.
- Undo restores all main tabs; Explore boxes stay as-is (or use Show all Explore boxes).

## [B29] — More Tips scrolls

- Active **More** panes (Tips, Plan, News, …) scroll inside the panel so long
  cheat sheets are not clipped.

## [B28] — More Tips: Q-codes + Morse

- **More → Tips** — more operating tips; **most-used** Q-codes / CW shorthand
  first, then a larger Q-code list; Morse letters, numbers, and common
  prosigns / punctuation.

## [B27] — More Tips layout

- **More → Tips** no longer uses the DX spot row grid (text was crushed into a
  narrow column). Tips are full-width cards with separators; CW Q-codes sit in
  a wrapping grid.

## [B26] — More News feeds + regional band plans

- **More → News** — chips for AMSAT-UK, Amateur Radio Newsline, DX World,
  RTL-SDR Blog, and AmateurRadio.com (plus existing ARRL / RSGB / AMSAT).
- **More → Plan** — region chips (UK, EU/R1, USA, Canada, Australia, Japan,
  South Africa) with simplified edges and typical max power. Click a row to
  tune. Disclaimer: check your licence — not legal advice. Remembers last
  region; picks a default from QTH when possible.

## [B25] — Peaks / Skip sub-tabs match the rest

- Peaks and Skip use the same yellow sub-tab bar / active-pane scroll system as
  Bands, Bookmarks, Audio, Log, Watch, and Range (shared CSS + layout hooks).

## [B24] — New Explore boxes off by default

- **Listen** and the light Explore boxes added today (Clock / QTH, Band plan,
  Quick dials, Mode chips, Nearest BM, Share, Mute timer, Skip here, Profile
  edges, Step chips, Band hop, Squelch presets, Hold/Skip, Paste-tune, Session,
  Heard today, Repeater offset, APRS dials, Region / decl.) start **off**.
  Tick them under Settings → Explore boxes (or **Show all Explore boxes**).

## [B23] — Remove title-bar header chips

- Dropped UTC / local / QTH / MHz·mode / mute chips from the Toolbox title bar
  (too busy). Same info stays in Explore boxes (Clock, Mute timer, etc.).

## [B22] — Light features everywhere (Settings show/hide)

- **Explore slim boxes** — Step chips, Band hop, Squelch presets, Hold/Skip strip,
  Paste-tune, Session timer, Heard today, Repeater offset, APRS dials, Region /
  declination (all under Settings → Explore boxes).
- **Bands / Range / Peaks** — last 5 profiles, Scan this profile only, peak lock
  next to ign, empty-list tip.
- **Log / Bookmarks / More** — pin strip, RST 59/599/5NN pads, bookmark colour
  filter, CW Q-codes under Tips.
- **Settings → Light features** — add/remove every non-box helper; **Pi lean** and
  **Backup kit**; Help **What’s new** for this build. S-meter first-open Safe RF tip.


## [B21] — Click S-meter cal label to open popup

- Click **uncalibrated** / **calibrated** on the Explore S-meter to open the
  calibrate dialog.

## [B20] — S-meter calibrated / uncalibrated label

- Explore analogue S-meter shows small **uncalibrated** or **calibrated** text
  (from Settings → S-meter calibrate).

## [B19] — Larger S-meter calibrate guide

- Calibrate popup is bigger, with plain-English steps, a dimmed backdrop, and a
  list of common TX-capable SDRs (HackRF, PortaPack, bladeRF, LimeSDR family,
  Pluto, USRP…) plus receive-only sticks that cannot TX.

## [B18] — S-meter cal RF damage warning

- Clear warning on Settings → S-meter calibrate and in the popup: do not inject
  a hot signal into the SDR — use a strong attenuator / start very weak.

## [B17] — S-meter calibrate (Settings)

- Settings → **S-meter calibrate**: popup to align Explore’s meter with a known
  injection (sig gen / TX-capable SDR). Toolbox never transmits — stores a small
  dB offset in this browser only. Negligible CPU (capture averages a few samples).

## [B16] — Light Explore boxes (Pi-friendly)

- Nine low-cost Explore boxes (Settings → show/hide): **Clock / QTH**, **Band
  plan**, **Quick dials**, **Mode chips**, **Nearest BM**, **Share**, **Mute
  timer**, **Skip here**, **Profile edges**. Text and one-shot clicks only — no
  waterfall scan or FFT work.

## [B15] — Clearer Explore box explanations

- Every Explore box shows a plain-language subtitle (what it is for) under the
  title. Hover / **?** help uses the same wording.

## [B14] — Tune audio / S-meter fill freq LCD height

- Explore Tune row: audio scope and S-meter stretch to the frequency LCD
  height (no empty band under them).

## [B13] — Explore corner-resize keeps height

- Corner-dragging an Explore box (e.g. **Recent tunes**) now keeps the height
  you set. Previously content-hug snapped it straight back after release.

## [B12] — Listen QTH from /status.json

- **Listen** was stuck on “Waiting…” when `Utils.getReceiverPos` never filled
  (websocket GPS). Now also pulls **`/status.json` → receiver.gps** (same as
  your OpenWebRX General QTH), plus header locator fallback.
- Paints as soon as Explore binds; retries until GPS arrives.

## [B11] — Listen uses OpenWebRX receiver GPS

- **Listen** reads OpenWebRX General → receiver GPS (`Utils.getReceiverPos`) when
  Toolbox has no saved lat/lon — no need to re-enter QTH.
- Empty state has a clickable **open QTH** button (More → Here → QTH).
- Brief retry while the websocket config is still arriving.

## [B10] — Explore Listen advisor + box visibility

- **Explore → Listen** — light day / greyline / night band tips from your QTH
  sun angle (local calc). Uses cached SFI/K only if Prop/Bands already fetched;
  no background polling. Band chips tune on click.
- **Settings → Explore boxes** — show/hide any Explore box (Tune always on).
  Slim Explore on a Pi without losing Tune.

## [B9] — Every More group has four panes

- Fills each group to **4** light panes:
  - **Spots** + SOTA · **Space** + Moon · **Tune** + Call · **Here** + Prefix
  - **Sked** + GB2RS · Events · **Read** + Tips
- SOTA uses `api-db2.sota.org.uk` (fetch only while open). Moon / Call / Prefix /
  GB2RS / Events / Tips are local or static.

## [B8] — More grouped + Dial / Plan / Path / POTA / Keys / Today

- **More** outer bar is now **7 groups**: Spots · Space · Tune · Sky · Here · Sked · Read
  (inner chips per group — avoids a 20+ chip strip on Pis).
- New panes: **Dial** (FT8/FT4/WSPR/JS8), **Plan** (IARU R1 edges), **Path** (grid
  distance/bearing), **POTA** spots, **Keys** cheat sheet, **Today** (log/watch by band).
- Settings → More sections lists panes under those group headings.

## [B7] — News: RSGB chip

- **More → News** — RSGB chip (`rsgb.org/main/feed/`, GB2RS / HQ) alongside ARRL and AMSAT.

## [B6] — More: Beacons, Alerts, Aurora, QTH, News

- **Beacons** — NCDXF / IARU cycle in More (also expands Bands → Beacons to 20/17/15/12/10 m).
- **Alerts** — NOAA SWPC alerts / warnings (fetch while open).
- **Aurora** — OVATION probability at your lat/lon (Sats / QTH).
- **QTH** — Maidenhead grid, UTC/local clocks, sunrise & sunset; shared lat/lon with Sats.
- **News** — ARRL + AMSAT headlines (Southgate feed currently unavailable).

## [B5] — Light switches across Listening / Log / Peaks / Bookmarks / Audio

New Settings → Extras (on by default unless noted):

- **Mute while scanning** — auto-mute Bands / Range / bookmark scans; unmute on Stop  
- **Hold auto-clear** — clear Hold after N s (set beside Hold while busy)  
- **Click peak → Identify** — peak MHz also opens Identify  
- **Log auto-scroll** · **Log · Voice chip** · **UTC timestamps**  
- **Watch · quiet when focused** · **Watch · whole-word match**  
- **Compact peak rows** · **Auto-skip birdies** (Seen ≥ N) · **Hide always-skipped in Peaks**  
- **Bookmarks · scannable only** chip · **Record busy → auto-tag** · **Clips newest-first**  
- **Quieter status** · **Remember sub-tabs**
- **More → Links** — Toolbox GitHub, OpenWebRX+ groups.io / Telegram / GitHub /
  docs / site, ReceiverBook, HackRF sweep visualizer, KiwiSDR, WebSDR, LoTW, eQSL,
  DXHeat, APRS.fi, Space Weather Live, SatNOGS (plus existing ham utility links;
  OpenWebRX entries are + only, not vanilla)

## [B4] — Extra sections + Import/Export everywhere they store data

- Extra sections (on by default under Settings): Log Notes / Export / Dupes;
  Watch History / Quick add / Mute band; Bookmarks Recent / Stats / Share;
  Audio Meter / Tags; Skip Map / Import; Peaks Summary / Birdies;
  Range Presets / Last.
- **Import / Export** on every light pane that holds transferable data (Notes,
  Recent, Tags, Nets, Last, Map, …) — file download + Shift-click paste, same
  public-mode gate as other Import/Export.
- Range **Last** remembers the five most recent scans; sub-tabs wired for
  Range / Skip / Peaks extras.

## [B3] — More sections picker, Main tab Default, version eras, detach docs

- Settings → **More sections** — tick which More sub-tabs show (all on by default).
- **Main tab size** factory default is **Default** (100%), not +15%.
- Version scheme after **v965**: **vB1**, **vB2**, … then **vC1** after B999
  (Check install compares letter eras correctly). Formerly drafted as v966–v968;
  renumbered to B1–B3 so the B era starts immediately after v965.
- README + Help: undocked Toolbox (**D**) can be dragged to another monitor.

## [B2] — More tab: Passes, RBN, Time, Prop, Grey, Contest, Nets, Links

- Eight light sections under **More** (alongside DX / Sats). Each only fetches or
  redraws while that sub-tab is open — no background polling.
- **Passes** — next AOS/LOS for the sat catalog (Celestrak amateur TLE once).
- **RBN** — skimmer-style CW / digi filter on the shared DX cluster cache.
- **Time** — WWV / WWVH / CHU / BPM / LF time stations (static, click to tune).
- **Prop** — SFI / K / A / X-ray via existing NOAA Solar path + rough MUF hint.
- **Grey** — day/night greyline canvas; green dot from Sats lat/lon.
- **Contest** — built-in major HF contest calendar (no network).
- **Nets** — editable net schedule in localStorage.
- **Links** — curated ham sites (new tab).

## [B1] — Watch Groups Arm buttons respond again

- Arm HF / Digi / … are no longer `disabled` when empty (that swallowed clicks with no tip).
- Click still arms/disarms; empty group shows a status tip to tick a watch first.
- Direct click bind on Arm buttons; group label click toggles the tick reliably.
- First build of the **B** version era (after v965).

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
