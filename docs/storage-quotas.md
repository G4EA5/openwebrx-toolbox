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

## Related limits (not in Storage quotas)

- **Session log**, operator session, memory markers, etc. use smaller fixed caps in code.
- **Noise samples** and **Heat days** are configured in the same Settings box but behave differently (noise sample count vs heatmap window).

## Persistence overview

See [README → Persistence](../README.md#persistence) for Docker, bookmarks colours, and clearing site data.
