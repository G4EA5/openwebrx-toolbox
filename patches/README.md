# Try patches (not part of the normal release)

## issue-9 — RSP1b / device-level gain

File: [`issue-9-toolbox.js`](issue-9-toolbox.js) — Toolbox **v440** plus a try-patch so Explore Hardware gain can load/save from **Device** settings when the profile form has no gain fields.

### Install

```bash
cd /path/to/htdocs/plugins/receiver/toolbox
cp toolbox.js toolbox.js.bak-before-issue-9
# download issue-9-toolbox.js from this folder, then:
cp /path/to/issue-9-toolbox.js toolbox.js
```

Hard refresh the receiver → Settings admin login → Explore → Hardware gain → Retry.

Success: status mentions saves into this **DEVICE**.  
Revert: restore `toolbox.js.bak-before-issue-9`.
