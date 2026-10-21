# First install — OpenWebRX Toolbox

Plain-language guide for **first-time** setup. Nothing here removes features — it only explains what to do on the **radio host** vs in the **browser**.

**Current build:** B era (e.g. **B169**). After install, the Help tab and **Settings → Check install** show your exact version.

---

## What you are installing

| Piece | Where it lives | What it does |
| --- | --- | --- |
| **One line in `init.js`** | Radio host (server) | Tells OpenWebRX+ to load Toolbox when someone opens the receiver page |
| **`toolbox.js` + `toolbox.css`** | CDN (automatic) **or** copied into `htdocs` (local) | The panel UI — loaded by the **browser**, not by bash |
| **Your data** | This browser only | Peaks, bookmarks, settings — not on the server unless you export or use optional sync URLs |

**Requirements**

- **[OpenWebRX+](https://github.com/luarvique/openwebrx)** with the plugins API (`Plugins.load`). Vanilla OpenWebRX cannot load Toolbox.
- SSH or file access to edit `plugins/receiver/init.js` on the host (first time only).
- A working SDR profile and waterfall in OpenWebRX already.

**There is no installer app** — you edit one JavaScript file on the server, then use the receiver in a browser.

---

## Do not paste the snippet into the terminal

The load line is **JavaScript for `init.js`**, not a shell command.

```js
(async () => {
  await Plugins.load("https://cdn.jsdelivr.net/gh/G4EA5/openwebrx-toolbox@main/toolbox.js");
})();
```

- Pasting that into **bash** → `syntax error near unexpected token`.
- `Plugins.load` does **not** download files into `~/Downloads` or `htdocs` by itself — the **browser** fetches JS/CSS when the page loads (CDN), or reads local files if you copied them (Option B).

---

## Path to `init.js`

Under OpenWebRX+ **htdocs** (same tree as `openwebrx.js`):

| Host type | Typical path |
| --- | --- |
| Debian / Ubuntu package | `/usr/lib/python3/dist-packages/htdocs/plugins/receiver/init.js` |
| Docker | Same path inside the container (or your volume mount) |
| Custom | Run `find / -name openwebrx.js 2>/dev/null` and open `plugins/receiver/init.js` beside it |

If the file is missing, create it. Keep the usual `(async () => { … })();` wrapper and put `await Plugins.load(…)` **inside** it.

**Remove any old Band Survey line** — do not load `band_survey` and `toolbox` together.

---

## Option A — CDN (easiest first install)

**On the radio host** (SSH, SFTP, or local editor):

1. Open `plugins/receiver/init.js`.
2. Add **one** line (full block above), or add `await Plugins.load("https://cdn.jsdelivr.net/gh/G4EA5/openwebrx-toolbox@main/toolbox.js");` inside the existing async function.
3. Save the file.

**In your browser** (any PC that opens the receiver):

4. Open the OpenWebRX receiver page.
5. **Hard-refresh:** **Ctrl+Shift+R** (Windows/Linux) or **Cmd+Shift+R** (Mac). A normal F5 is not enough after the first install.
6. Click **Toolbox** in the top bar (between **Help** and **Status**). If the bar is hidden, look for **TB** on the frequency strip.
7. Open **Settings** → click **Check install**. **Green / “looks good”** = ready.
8. Optional: **Simplify my panel** or the first-run **Light** layout if the panel feels busy.

**Production tip:** Pin a GitHub **tag** instead of `@main` in the CDN URL when you want a fixed version.

---

## Option B — Local copy on disk

Use when the host has no internet, you air-gap the radio, or you want exact files on the server.

**On the host (or copy from a PC):**

1. `git clone https://github.com/G4EA5/openwebrx-toolbox.git` (or download release zip).
2. Copy **`toolbox.js`** and **`toolbox.css`** to  
   `htdocs/plugins/receiver/toolbox/`
3. In `init.js` use the **short** id (not the full CDN URL):

   ```js
   (async () => {
     await Plugins.load("toolbox");
   })();
   ```

4. Hard-refresh the receiver → **Toolbox** → **Settings → Check install**.

Later updates: **Settings → Update Toolbox** (downloads a zip for you to copy) or replace the two files by hand.

---

## After install — first five minutes in the browser

| Step | Action |
| --- | --- |
| 1 | **Check install** (Settings) — fix anything red before scanning |
| 2 | **Help (?)** → **Start in 3 minutes** — pick Listen, Survey, or Public |
| 3 | **Hover** any button or label — one short tip at a time |
| 4 | **Bands** — tick profiles (or **Ham**), then **Scan bands** |
| 5 | **Peaks** — see what was busiest |

**Tips**

- **Find** (header search icon) — type `gain`, `record`, `visible tabs`, etc. (on by default on fresh installs).
- **Simplify my panel** — Settings → General — trims tabs without deleting data.
- **Advanced URLs** — collapsed at bottom of General; only for your own homelab scripts.

---

## Routine updates (already installed)

| How you installed | Easiest update |
| --- | --- |
| CDN `@main` | Settings → **Update Toolbox** → reload browser |
| Local or pinned CDN | **Update Toolbox** → copy zip’s `toolbox.js` + `toolbox.css` to `htdocs/.../toolbox/` → hard-refresh |

Package upgrades (apt upgrade OpenWebRX+) may **wipe** `init.js` or the `toolbox/` folder — put the load line and files back, then hard-refresh.

**Pi / Varnish images** after file changes on disk:

```bash
sudo systemctl restart varnish nginx
```

---

## Something wrong?

| Symptom | Try |
| --- | --- |
| No **Toolbox** button | Hard-refresh; confirm `Plugins.load` in `init.js`; **Check install** |
| Old version after update | Hard-refresh; restart varnish/nginx on Pi images |
| Yellow/red **Check install** | Read the fix on that screen; Help → **Copy diagnostic report** |
| Panel overwhelming | **Simplify my panel** or layout **Light** |

More detail: [README → Install](../README.md#install) · [What’s new since v965](WHATS-NEW-SINCE-V965.md) · in-panel **Help** tab.
