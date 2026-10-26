# Storage quotas (browser limits)

Toolbox caps how much data it keeps **in this browser** (not on the OpenWebRX server). Change limits under **Settings → General → Storage quotas** (defaults: **999** for most lists, **30** heatmap days). Lowering a cap trims immediately.

Tab labels such as **Log 400** show the **current row count**, not the max setting.

## What happens when a list is full

| Setting | What it limits | When over the cap |
| --- | --- | --- |
| **Max logs** | Log tab traffic feed (`localStorage`) | **Unpinned** oldest lines drop; **★ pinned** lines stay (many pins can push total above the cap). |
| **Max peaks** | Survey peak list (`localStorage`) | **0 = unlimited.** Otherwise drops peaks with the **oldest `last` heard** time until at the cap. |
| **Max bookmarks** | Amber **`[load]`** / imported bookmarks only — not blue OpenWebRX locals | Oldest entries in that list drop (`slice` from the front). |
| **Max audio** | Clips in **IndexedDB** | **Oldest** clips drop (also a ~**48 MB** total byte cap regardless of count). |
| **Max skip** | Always-skip MHz list in settings | Oldest MHz entries drop. |
| **Max decoder log** | Log → Decoder archive saved lines | Oldest lines drop. |
| **Max QSO** | Log → QSO pad contacts | Oldest rows drop. |
| **Heat days** | Peaks heatmap **display window** (1–30 days) | Does not grow storage; raw occupancy log is capped at **4000** samples separately. |

## Backup and export

| Action | Where | What you get |
| --- | --- | --- |
| **Export settings** | Settings → Data & housekeeping | Settings JSON only (not peaks or audio). |
| **Import browser data** | Same | Restores a file from **Export browser data**: merges **settings**; replaces peaks, log, decoder, QSO, heat, watches, and loaded bookmarks in this browser. Optional blue-bookmark restore if the file includes them. No audio. |
| **Export browser data** | Same | One JSON file: settings, peaks, log, decoder, QSO, loaded bookmarks, occupancy heat, watches, Explore layout. **Audio clips excluded** (IndexedDB — use **Audio** tab export). Built **only when you click**; does not slow normal use. |
| **Backup kit** | Settings → Light features (when **Backup kit** is on) | Settings + Explore layout + bookmarks (smaller than browser data). |
| Per-tab export | Peaks, Log, Audio, Watch, … | CSV or JSON for that list only. |

Before **Factory reset** or clearing site data, export settings or **Export browser data** if you want a copy. See also [clear-toolbox-browser-data.md](clear-toolbox-browser-data.md).

## Related limits (not in Storage quotas)

- **Session log**, operator session, memory markers, etc. use smaller fixed caps in code.
- **Noise samples** and **Heat days** are configured in the same Settings box but behave differently (noise sample count vs heatmap window).

## Persistence overview

See [README → Persistence](../README.md#persistence) for Docker, bookmarks colours, and clearing site data.
