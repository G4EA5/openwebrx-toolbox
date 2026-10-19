# What’s new since v965 (B era)

OpenWebRX Toolbox **v965** was the last **numeric** build tag (`toolbox-v965`). Everything after that uses the **B** era: **B1**, **B2**, … **B138** (current). Check install and the Help tab show the running build (e.g. `B138`).

Full line-by-line history: [`CHANGELOG.md`](../CHANGELOG.md). This page is the **operator guide** — what changed for day-to-day use.

---

## Version labels

| Label | Meaning |
| --- | --- |
| **v965** | Last numeric release before the B era |
| **B1…B138** | Current era (`toolbox-vB138` tag on GitHub) |
| **v440** | Older frozen snapshot in [`v440/`](../v440/) — not the same as v965 |

CDN pin example: `…@toolbox-vB138/toolbox.js` (or `@main` for latest).

---

## Settings & install

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
