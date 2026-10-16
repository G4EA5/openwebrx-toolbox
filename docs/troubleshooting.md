# Troubleshooting — OpenWebRX Toolbox

Portable notes for any OpenWebRX+ install. Toolbox is a **browser plugin**; most
“receiver went away” messages come from **OpenWebRX itself**, not from Toolbox.

## Manual install (no installer)

There is **no installer**. Edit `plugins/receiver/init.js` on the radio host:

- **CDN:** `await Plugins.load("https://cdn.jsdelivr.net/gh/G4EA5/openwebrx-toolbox@main/toolbox.js");`
- **Local:** copy `toolbox.js` + `toolbox.css` into `htdocs/plugins/receiver/toolbox/`, then `await Plugins.load("toolbox");`

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

## More

- In-panel **Help** tab (same project, richer list).
- [README troubleshooting](../README.md#troubleshooting)
- [Clear Toolbox browser data](clear-toolbox-browser-data.md) if settings/cache look wrong.
