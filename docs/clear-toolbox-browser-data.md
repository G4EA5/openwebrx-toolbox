# Clear Toolbox data in the browser (fix freeze / stuck “Loading Toolbox…”)

Use this when OpenWebRX freezes on load or Toolbox settings seem stuck.

## Quick: clear only Toolbox keys (keeps OpenWebRX login if any)

1. Open your receiver page (e.g. `http://100.112.195.169:8073/`).
2. Press **F12** → **Application** (Chrome) or **Storage** (Firefox).
3. **Local Storage** → your site origin → delete keys starting with `owrx_toolbox`.
4. **Session Storage** → same → delete `owrx_toolbox` keys if present.
5. **Hard refresh**: **Ctrl+Shift+R** (Windows/Linux) or **Cmd+Shift+R** (Mac).

Important keys: `owrx_toolbox_v1`, `owrx_toolbox_panel_layout_v1`, `owrx_toolbox_autoopen_off_v480`.

## Full site reset (recommended if still stuck)

### Chrome / Edge

1. Open the receiver URL.
2. Click the **lock** icon (or tune icon) left of the address bar → **Site settings**.
3. **Clear data** / **Delete data** for this site.
4. Or: **Settings → Privacy → Delete browsing data** → tick **Cached images and files** and **Site settings** → time range **All time** → Clear.
5. Close the tab, open a **new** tab to the receiver, hard refresh.

### Firefox

1. Open the receiver URL.
2. **Ctrl+Shift+I** → **Storage** → right-click the site → **Delete All**.
3. Or: **Settings → Privacy → Cookies and Site Data → Manage Data** → search your host → Remove.
4. Hard refresh.

## Console one-liner (Local Storage only)

On the receiver page, **F12 → Console**, paste:

```javascript
Object.keys(localStorage).filter(function (k) { return k.indexOf("owrx_toolbox") >= 0; }).forEach(function (k) { localStorage.removeItem(k); });
location.reload(true);
```

## Before a full clear (optional)

**Settings → Data & housekeeping → Export browser data** saves one JSON file (settings, peaks, log, and related lists — **not** audio). **Export settings** is smaller (settings only). Audio clips: export from the **Audio** tab if you need them.

## After clearing

- OpenWebRX should load **without** “Loading Toolbox…”.
- Click **Toolbox** in the top bar when you want the panel (first open may take a few seconds).
- Check the panel header shows the current build (e.g. **B304** or newer) after deploy.
