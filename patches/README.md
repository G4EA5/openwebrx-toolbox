# Try patches (not part of the normal release)

## Device-level Explore gain (issue #9 / RSP1b)

File: [`toolbox-v440-device-gain.js`](toolbox-v440-device-gain.js) — Toolbox **v440** plus a try-patch so Explore Hardware gain can load/save from **Device** settings when the profile form has no gain fields.

### Install

```bash
cd /path/to/htdocs/plugins/receiver/toolbox
cp toolbox.js toolbox.js.bak-before-device-gain
# download toolbox-v440-device-gain.js from this folder, then:
cp /path/to/toolbox-v440-device-gain.js toolbox.js
```

Hard refresh the receiver → Settings admin login → Explore → Hardware gain → Retry.

Success: status mentions saves into this **DEVICE**.  
Revert: restore `toolbox.js.bak-before-device-gain`.
