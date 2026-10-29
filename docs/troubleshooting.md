# Troubleshooting — OpenWebRX Toolbox

Portable notes for any OpenWebRX+ install. Toolbox is a **browser plugin**; most
“receiver went away” messages come from **OpenWebRX itself**, not from Toolbox.

## Manual install (no installer)

There is **no installer**. Edit `plugins/receiver/init.js` on the radio host:

- **CDN:** `await Plugins.load("https://cdn.jsdelivr.net/gh/G4EA5/openwebrx-toolbox@main/toolbox.js");`
- **Local:** copy `toolbox.js` + `toolbox.css` into `htdocs/plugins/receiver/toolbox/`, then `await Plugins.load("toolbox");`

**Not a bash command.** The `(async () => { … Plugins.load(…) })();` block is
**JavaScript for `init.js`**. Pasting it into a terminal will fail with a syntax
error, and it does **not** download files into a folder — the browser loads JS +
CSS from the CDN. To save files on disk, use `git clone` or `curl` (see README
Option B).

Full steps: [README → Install](../README.md#install). Then hard-refresh and **Settings → Check install**.

## WebSocket closed / “Attempting to reconnect…”

OpenWebRX shows this when the browser **loses its live WebSocket** to the receiver
process (audio, waterfall, tune commands). The page will retry with increasing delays
(e.g. 16 seconds, then longer).

**Toolbox does not open or own that socket.** Updating `toolbox.js` in the browser
does not restart the server unless **your** install or admin workflow also restarts
OpenWebRX.

### Common causes (any site)

| Cause | What to try |
| --- | --- |
| **OpenWebRX or SDR backend restarted** | Wait for reconnect; check server logs; avoid restarting during use |
| **Network blip** | Wi‑Fi, VPN, mobile, mesh; try a stable link |
| **Reverse proxy / idle timeout** | nginx, Caddy, Cloudflare — raise WebSocket read timeout if drops are regular |
| **Browser tab sleep** | Laptop sleep or background tab throttling — wake tab, hard refresh |
| **Server crash or overload** | CPU/RAM, USB dongle reset, demod/decoder errors — host logs |
| **Bad profile or tune** | Profile `start_freq` out of range for the dongle; hop to a valid band |

### What to do

1. Let the page **reconnect** once.
2. **Hard refresh** (Ctrl+Shift+R / Cmd+Shift+R) if the UI looks stale after reconnect.
3. On the **radio host**, check OpenWebRX / `rtl_connector` (or your SDR source) logs
   around the time of the drop.
4. **Settings → Check install** (Toolbox) and **Help → Copy diagnostic report** for
   browser-side clues (wrong page, cache, plugin version).

If disconnects repeat every few minutes, the fix is on the **server or network** side,
not in Toolbox settings.

## Toolbox button missing

Hard-refresh; confirm `Plugins.load("toolbox")` (or your CDN pin) in
`plugins/receiver/init.js`. Settings → **Check install**.

## Band Survey and Toolbox both loaded

Edit `init.js` to load **only** `toolbox`. Never both — they clash.

## No waterfall / no profiles

Open the main **receiver** page (not map-only). Wait for OpenWebRX to finish loading.
Confirm the SDR is running on the host.

## Explore layout issues

Hard-refresh; **Settings → Reset Explore layout**; use box header **Wide** / **Half**
(v413+).

## SDR only vs Choose SDR (RTL / HackRF / …)

Toolbox has **two patterns**:

| Where | Control | All SDRs? |
| --- | --- | --- |
| **Explore → Profile**, **Bands** list/edit | **SDR only** | Yes — empty = all kinds |
| **Range → Scan**, **Analyzer** | **Choose SDR** | No — pick one kind per tab |
| **Identify** (top bar) | **Choose SDR** | Yes — **All SDRs** or one kind |

They are **not linked**. If **Explore → SDR only** will not stay on **All SDRs** or RTL
(jumps back to the current radio), hard-refresh (**B182+**). If Anz snaps back after
picking RTL, hard-refresh (**B135+**). If Identify still follows Explore’s filter,
hard-refresh (**B136+**).

In-panel **Help** tab has the full guide; hover any control for a short tip.

## Explore Go MHz lands on the wrong frequency (HackRF / SDR only)

Hard-refresh (**B304+**). **Go** picks a profile on the scoped **OpenWebRX device**
(live profile’s `device|band`, or **SDR only** when set) — not another stick. Band
choice: narrowest profile whose **name/metadata range includes** your MHz; else
**nearest band on that device** (status **nearest band**), then tune. Same for RTL,
HackRF, Airspy, SDRplay, Lime, Soapy, and custom device ids. If names are UUIDs,
**B304+** also uses cached profile frequency metadata when OpenWebRX provides it.
OpenWebRX may still clamp MHz outside what that profile allows — add a wider profile
in server settings if needed. **Help (?) → Explore tab → Go MHz** · README **Explore Go MHz**.

## Settings → More or Public looks wrong

Hard-refresh (**Ctrl+Shift+R**). Toolbox rebuilds the panel when markup is stale
(e.g. after an update): open **Settings** once.

- **More sections** for *your* browser: **Settings → General** (scroll to **More sections** at the bottom).
- **Guest More panes**: **Settings → Public** — grouped **More · Spots / …** boxes
  at the **bottom** of the visitor allowlist (separate from your **General → More sections** ticks).

## More

- In-panel **Help** tab (full guide; hover any control for a short tip).
- [README troubleshooting](../README.md#troubleshooting)
- [Clear Toolbox browser data](clear-toolbox-browser-data.md) if settings/cache look wrong.
- [Storage quotas](storage-quotas.md) — caps, trim behaviour, **Export browser data** backup.

There is no separate GitHub wiki — docs live in this repo:

- **[What’s new since v965 (B era)](WHATS-NEW-SINCE-V965.md)** — operator guide after `toolbox-v965`
- **[README](../README.md)** — install, SDR hardware, troubleshooting table
- **[CHANGELOG.md](../CHANGELOG.md)** — every build note (B1…B304)
- **In-panel Help** tab — full UI guide + **What’s new since v965** (same era as above)
