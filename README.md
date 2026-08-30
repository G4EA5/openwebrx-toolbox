# Band survey — OpenWebRX+ plugin

Standalone receiver plugin. Walks the bands you tick, counts real waterfall
peaks, ranks the busiest, and can bookmark them.

<p>
  <img src="screenshot.png" alt="Band survey panel" width="640">
</p>

<p><em>Band survey panel</em></p>

**It does not need** `freq_scanner`, `scan_hunt`, `uikit`, `utils`, or `notify`.
Those are optional extras if you already load them.

Orange **SV** button appears on the right-hand receiver panel. **Help** is
inside the panel and also opens once on first run.

## Tester install (two ways)

**A — local copy (recommended, correct file types, works offline)**

On the radio host:

```bash
git clone https://github.com/G4EA5/owrx-band-survey.git
cd owrx-band-survey
chmod +x install.sh
./install.sh
```

Then hard-refresh the receiver: **Ctrl+Shift+R** (Mac: **Cmd+Shift+R**).
Click orange **SV** → **Check install**.

**B — load from URL** (if you already have `htdocs/plugins/receiver/init.js`)

Add one line inside your existing `async` block (do not delete other plugins):

```js
await Plugins.load("https://cdn.jsdelivr.net/gh/G4EA5/owrx-band-survey@main/band_survey.js");
```

GitHub Pages (same files, once Pages is live):

```js
await Plugins.load("https://g4ea5.github.io/owrx-band-survey/band_survey.js");
```

Then hard-refresh. Raspberry Pi images that use Varnish:

```bash
sudo systemctl restart varnish nginx
```

## First 30 seconds (after install)

1. Hard-refresh the receiver page: **Ctrl+Shift+R** (Mac: **Cmd+Shift+R**).
   A normal refresh can keep an old plugin file, so SV or Help look missing.
2. Click orange **SV**.
3. Click **Check install**. Green means ready. Red or yellow includes the fix
   on screen — not only in the browser console.
4. Tick bands (or **Air** / **VHF voice** / **Ham**) and press **Continue**.

To verify files on the radio without writing anything:

```bash
./install.sh --check
```

## What you need

- [OpenWebRX+](https://github.com/luarvique/openwebrx) (the `+` fork). Vanilla
  OpenWebRX has no plugin loader.
- SSH or a file copy onto the radio host (for method A).
- A **hard** refresh after install (see above).

## Install details (method A)

The script BACKS UP your files first, then copies the plugin and adds one
line to `plugins/receiver/init.js` if it is missing.

It writes a timestamped folder:

`~/owrx-band-survey-backups/YYYYMMDD-HHMMSS/`

That copy includes (when readable):

| File | Why |
| --- | --- |
| `init.js` | Your previous plugin list |
| `band_survey.prev/` | Any older Band survey files |
| `bookmarks.json` | Yellow **server** bookmarks |
| `settings.json` | Receiver settings (profiles, reporting) |
| `RESTORE.txt` | How to put them back |

If `install.sh` cannot find OpenWebRX+:

```bash
export OWRX_HTDOCS=/path/to/htdocs
./install.sh
```

Typical `htdocs` paths:

- `/usr/lib/python3/dist-packages/htdocs` (Debian / Ubuntu package)
- `/opt/openwebrx/htdocs`

## Install (manual)

1. Find `htdocs` (folder that contains `openwebrx.js`):

   ```bash
   find /usr /opt -name openwebrx.js 2>/dev/null
   ```

2. **Back up first** (do not skip this):

   ```bash
   HTDOCS=/usr/lib/python3/dist-packages/htdocs
   mkdir -p ~/owrx-band-survey-backups/manual
   cp -a "$HTDOCS/plugins/receiver/init.js" ~/owrx-band-survey-backups/manual/ 2>/dev/null || true
   cp -a "$HTDOCS/plugins/receiver/band_survey" ~/owrx-band-survey-backups/manual/ 2>/dev/null || true
   cp -a /var/lib/openwebrx/bookmarks.json ~/owrx-band-survey-backups/manual/ 2>/dev/null || true
   cp -a /var/lib/openwebrx/settings.json ~/owrx-band-survey-backups/manual/ 2>/dev/null || true
   ```

3. Copy this folder:

   ```bash
   sudo mkdir -p "$HTDOCS/plugins/receiver"
   sudo cp -a . "$HTDOCS/plugins/receiver/band_survey"
   ```

4. Load it. Create or edit `$HTDOCS/plugins/receiver/init.js` and add:

   ```js
   (async () => {
     await Plugins.load("band_survey");
   })();
   ```

   If you already have an `init.js` (for example from
   [0xAF plugins](https://github.com/0xAF/openwebrxplus-plugins)), add only
   that `await Plugins.load("band_survey");` line inside your existing
   `async` block. Do not delete your other plugins.

5. Hard-refresh the receiver.

## After install — 30 second check

| You see | Meaning |
| --- | --- |
| Orange **SV** | Plugin loaded |
| Band checkboxes | Profiles are visible |
| **Check install** says “looks good” | Ready to survey |
| Red / yellow box with a fix | Follow that sentence, then Check install again |
| Banner at the top of the page | You are on the map/settings page, or the receiver UI never appeared |

## Usage (short)

1. Tick bands, or tap **Air** / **VHF voice** / **Ham**.
2. **Continue** adds to Seen totals. **Fresh** starts at zero.
3. Click a frequency to tune, click a name to rename, **ign** to ignore a birdie.
4. **Scan bookmarks** walks the busy ones. While listening: **Hold** / **Skip** / **Lockout**.
5. **Export CSV** / **Export JSON** for a log or to merge yellow server bookmarks
   (there is no regular-user API to write those).

Blue (local) bookmarks live in **this browser**. The plugin copies them before
it writes, and on first run. Restore from **Help**.

**Only if alone** refuses to retune when another listener is connected. Untick
it if you are sure you may hop profiles.

## Restore backups

**Browser (blue bookmarks):** SV → Help → Restore first-run / last backup.

**Server files:**

```bash
ls ~/owrx-band-survey-backups
# pick a stamp, then for example:
sudo cp ~/owrx-band-survey-backups/STAMP/init.js /usr/lib/python3/dist-packages/htdocs/plugins/receiver/init.js
sudo cp ~/owrx-band-survey-backups/STAMP/bookmarks.json /var/lib/openwebrx/bookmarks.json
```

Read `RESTORE.txt` in that stamp folder — paths are written for *your* install.

## Docker

Bind-mount `htdocs/plugins/receiver` (or the whole `htdocs/plugins` tree) and
run `install.sh` with `OWRX_HTDOCS` set to that mounted path:

```bash
export OWRX_HTDOCS=/path/on/host/that/is/htdocs
./install.sh
```

## Uninstall

```bash
# keep the backup folder
sudo rm -rf "$HTDOCS/plugins/receiver/band_survey"
# remove the Plugins.load("band_survey") line from init.js
```

Or copy `init.js` back from `~/owrx-band-survey-backups/…`.

## Upstream

This is a standalone tester repo. A later step can be a pull request into
[0xAF/openwebrxplus-plugins](https://github.com/0xAF/openwebrxplus-plugins)
(the community collection). Until then, clone or load from this repository.

## License

MIT — see `LICENSE`.
