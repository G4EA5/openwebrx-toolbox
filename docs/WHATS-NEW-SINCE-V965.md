# What’s new since v965 (B era)

OpenWebRX Toolbox **v965** was the last **numeric** build tag (`toolbox-v965`). Everything after that uses the **B** era: **B1**, **B2**, … **B184** (current). Check install and the Help tab show the running build (e.g. `B184`).

Full line-by-line history: [`CHANGELOG.md`](../CHANGELOG.md). This page is the **operator guide** — what changed for day-to-day use.

**First time installing?** Use **[FIRST-INSTALL.md](FIRST-INSTALL.md)** — plain steps for `init.js`, hard-refresh, and **Check install** (CDN and local copy). The in-panel **Help** tab repeats the same story with **Start in 3 minutes** and hover tips on every control.

---

## Version labels

| Label | Meaning |
| --- | --- |
| **v965** | Last numeric release before the B era |
| **B1…B184** | Current era (`toolbox-vB184` tag on GitHub when published) |
| **v440** | Older frozen snapshot in [`v440/`](../v440/) — not the same as v965 |

CDN pin example: `…@toolbox-vB184/toolbox.js` (or `@main` for latest).

---

## Recent (B146–B184)

- **B146+** — **Settings → System** sub-tab: host CPU/RAM, listeners, session, OpenWebRX internals (`hoststats.json` when present).
- **B162** — Fix **Settings → Public** sub-tab (scroll + pane visibility).
- **B163–B164** — Homelab test stubs: peak webhook (`:5057`), settings sync (`:8787`); repo `tools/owrx-*-stub.py`.
- **B165** — **Panel startup**: optional **Show System / Public** sub-tabs (on by default).
- **B166** — **Test** on Peak webhook, Settings sync, and Classifier URL boxes; peak webhook respects **Extras → Peak webhook**; homelab same-origin proxies `/owrx-toolbox-{classify,transcribe,settings-sync,peak-webhook}`.
- **B167** — **Light** layout profile hides **System** settings sub-tab; **Everything** shows System + Public again.
- **B168** — **↑ Back to top** on scrollable tab panes when content overflows.
- **B169** — **Simplify my panel**, Help quickstart, **Advanced URLs** collapsed section; **Find** on for new installs.
- **B170** — Install wiki + clearer Help / hover text (see link at top of this page).
- **B171** — **Log** tab feed scrolls inside the pane again.
- **B172** — **Memory → Trace** draws a grid, explains status, **Sample now**; trace sampling on by default.
- **B173** — Cached **Memory** / **Log** panes upgrade when sub-tabs or buttons are missing.
- **B174** — **More → News** / **Feeds** RSS works again (`/owrx-toolbox-rss` on hosts with the proxy).
- **B182** — **Explore → SDR only** saves **All SDRs** / per-radio filter (was broken on Explore only); multi-SDR filter no longer snaps back on failed switches; **Settings → Visible tabs** splits main tabs vs header **?** / Find / **M**.
- **B183** — **More → Spots → DX** opens with **All** spots (not **This band** only).
- **B184** — **Bands → Coverage** MHz map; **More → Here → Now** live snapshot; **Log → Session** your retunes/scans.

---

## Settings & install

- **B170** — **[FIRST-INSTALL.md](FIRST-INSTALL.md)** wiki + README install refresh; Help and hover copy tuned for new users.
- **B1** — Watch **Groups → Arm** buttons work when a group is empty (status tip instead of dead click).
- **B3** — Version eras (B after v965); **Main tab size** default **Default**; detach (**D**) documented for second monitor.
- **B32** — **Settings → Update Toolbox** (CDN `@main` reload or zip for local copies).
- **B31** — Docs: `Plugins.load` is **init.js JavaScript**, not a shell download.
- **B30 / B118** — Old **Raspberry Pi / low power** preset removed → use **Settings → General → Choose layout profile** (**Light** / **Band survey** / **Everything**).
- **B59** — Settings sub-tabs: **General** · **Public** (visitor allowlist on Public).
- **B88–B99** — **More sections** checkboxes; moved to **bottom of General** (B99). Brief **Pi & SDR** sub-tab (B98) later **removed** — SDR block back at **bottom of General** (B118).
- **B53** — Multi-SDR Settings: device switcher, behaviour profiles, preferred stick by job, Role→SDR, pack pins, network budget, hop master, storage quotas, key remap, settings sync URL.
- **B37–B39, B58** — **Add all / Remove all** on Settings checkbox boxes (sensible rules for single-option boxes).
- **B106** — Factory default **On/off style** = **Switches**.

---

## Public / shared receivers

- **B93–B94** — **Settings → Public**: visitor allowlist includes **More** panes (grouped boxes at bottom).
- **B38** — **Allow all** / **Safe defaults** button colours on Public allowlist.

---

## More tab (Spots, Space, Tune, …)

- **B2** — Passes, RBN, Time, Prop, Grey, Contest, Nets, Links panes (lazy fetch).
- **B5–B7** — Light switches; Beacons, Alerts, Aurora, QTH, News, RSGB feed.
- **B8–B9** — WWFF, POTA, SOTA, expanded groups.
- **B52, B55, B70–B71** — More inner panes per group (up to **10**; **5 on by default** per group since B82).
- **B26** — Regional **Plan** chips (UK, EU, USA, …) with typical max power (not legal advice).
- **B28** — **Tips**: Q-codes, Morse, operating notes.
- **B57** — Yellow group bar / blue inner pane colours.
- **B84–B104** — **Feeds → Yours** (your RSS URLs); sub-tab per feed when 2+; fetch/UX fixes; **Read → News** shows selected feed URL only.

---

## Explore

- **B10–B12** — **Listen** advisor; QTH from receiver GPS / `/status.json`.
- **B13–B16** — Layout resize; light **Explore boxes** (Clock, Band plan, Paste-tune, …) — most **off by default** (B24).
- **B17–B51** — **S-meter calibrate** (per-SDR, multi-point, chip chooser, RF warning) — Toolbox meters only, not stock OWRX S-meter.
- **B72–B109** — **Explore → Profile → SDR only** (All SDRs or one kind); profile hop respects filter; **removed** “Hide this profile” / “Hide all on this SDR” checkboxes (use **Bands edit → Hide** + **SDR only**).
- **Profile hop** — ◀/▶, Alt+wheel, drag hop skip profiles outside **SDR only**; can sync stock OpenWebRX profile to match.

---

## Bands

- **B74–B86** — **Bands packs**: per-SDR coverage, colours, PMR vs wide 70 cm, rate in MHz, **Download all (SDR)** backup.
- **B80–B81** — **SDR only** bar on list + edit (**shared with Explore** — All SDRs or one kind). **Beacons / Solar / Today** removed from Bands (still under **More**).
- **B86** — Pack backup: single **Download all** button.

---

## Range, Analyzer, Identify — SDR choosers (B123–B137)

These are **separate** from Explore/Bands **SDR only**:

| Tab | Control | All SDRs? |
| --- | --- | --- |
| **Range → Scan** | **Choose SDR** | No — one kind per tab |
| **Analyzer** | **Choose SDR** | No |
| **Identify** (top bar) | **Choose SDR** | **Yes** — All SDRs or one kind |

- **B129** — Analyzer **Main waterfall**: wide span stitched on the stock OpenWebRX waterfall while hopping.
- **B87** — Analyzer: fixed box widths (no per-box Wide/Half); drag titles to reorder.
- **B135** — Fix dropdown reverting while picking RTL vs HackRF on Anz/Range.
- **B136–B137** — Identify **All SDRs**; profile list follows Identify chooser, not Explore filter.
- **B182** — **Explore → SDR only** finally saves like Bands (**All SDRs** / any radio); filter no longer snaps back when OpenWebRX rejects a profile switch.

---

## Log, Watch, Peaks, Bookmarks, Audio, Skip

- **B4–B5** — Extra sections; Import/Export on light data panes; many **Extras** toggles (mute while scanning, log chips, watch quiet, peaks birdies, …).
- **B25** — Peaks / Skip sub-tabs match other tabs.
- **B85** — Feeds **Remove feed** / **Del**.

---

## Calls & prefix (More → Read)

- **B64–B69** — **Prefix** online lookup; **Calls** worldwide allocations + licence classes; data **embedded in toolbox.js** (B67) — no extra JSON file on the host.

---

## Docs & help

- **B95–B96, B137** — README, Help tab, hover **?**, and [`troubleshooting.md`](troubleshooting.md) synced with Settings layout and SDR choosers.

---

## After updating from v965

1. Hard-refresh the receiver (**Ctrl+Shift+R**).
2. **Settings → Check install** — should show a **B** build ≥ **B138**.
3. If **Choose SDR** or **SDR only** behaves oddly, read [SDR only vs Choose SDR](troubleshooting.md#sdr-only-vs-choose-sdr-rtl--hackrf--).
