# OpenWebRX Toolbox v440 (frozen snapshot)

This folder is a **downloadable copy** of Toolbox **v440** — the last public
GitHub release before later homelab builds. Files here match tag
[`toolbox-v440`](https://github.com/G4EA5/openwebrx-toolbox/releases/tag/toolbox-v440)
(`Plugins.toolbox._version = 440`).

There is **no installer**. Install by editing `plugins/receiver/init.js` on the
radio host (same as current Toolbox).

## CDN (pin this folder)

```js
(async () => {
  await Plugins.load("https://cdn.jsdelivr.net/gh/G4EA5/openwebrx-toolbox@main/v440/toolbox.js");
})();
```

Or pin the release tag (same files):

```js
(async () => {
  await Plugins.load("https://cdn.jsdelivr.net/gh/G4EA5/openwebrx-toolbox@toolbox-v440/toolbox.js");
})();
```

## Local copy

1. Download `toolbox.js` and `toolbox.css` from this folder (or clone the repo).
2. Copy both into `htdocs/plugins/receiver/toolbox/` on the radio host.
3. In `plugins/receiver/init.js`:

   ```js
   (async () => {
     await Plugins.load("toolbox");
   })();
   ```

4. Hard-refresh (**Ctrl+Shift+R** / **Cmd+Shift+R**).
5. **Toolbox → Settings → Check install**.

## Notes

- Do **not** load Band Survey (`band_survey`) and Toolbox together.
- Current Toolbox lives at the repo root (`toolbox.js` / `toolbox.css` on `main`).
- Full manual-install guide: [../README.md#install](../README.md#install).

MIT — see [LICENSE](LICENSE).
