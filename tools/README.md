# Maintainer tools (not shipped to receivers)

Receivers only need **`toolbox.js`** and **`toolbox.css`** from the repo root. Everything here is for building, testing, or homelab stubs.

| Path | Purpose |
| --- | --- |
| `callsign-allocations.json` | Source data for **More → Calls**; embedded into `toolbox.js` by `embed_callsign_in_toolbox.py` |
| `build-callsign-allocations.py` | Regenerate JSON + re-embed |
| `callsign_licence_patches.py` | Licence-class rows merged by the build script |
| `embed_callsign_in_toolbox.py` | Inject JSON into `toolbox.js` embed markers |
| `owrx_*-stub.py` | Local test services for classifier, STT, peak webhook, settings sync |
| `owrx_toolbox_http_proxy.py` | OpenWebRX same-origin routes (install via homelab `apply-owrx-toolbox-proxies.sh`) |
| `owrx-toolbox-hoststats.py` | Optional cron → `hoststats.json` for Settings → System |
| `test-pack-sdr-scope.js` | `node tools/test-pack-sdr-scope.js` — unit checks for pack/SDR scoping logic |

Do not add unrelated personal scripts here; keep marketplace or one-off exports outside this repo.

Before `git push`, run **`../verify-publish-tree.sh`** from the repo root (also runs automatically from `publish-main.sh`).
