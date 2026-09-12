# Legacy Band Survey (`band_survey`)

This folder holds the **last Band Survey release** before the project became
**OpenWebRX Toolbox** (`toolbox`).

| | |
| --- | --- |
| **Plugin id** | `band_survey` |
| **Version** | **127** |
| **Files** | `band_survey.js`, `band_survey.css` |

The same frozen files are also kept at the **repo root** (`band_survey.js` /
`band_survey.css`) so older download / CDN links keep working.

## You almost certainly want Toolbox instead

**Toolbox** includes every Band Survey feature and a lot more (Explore, Audio,
Extras, public allowlist, side dock, …). Install from the repo root:

```bash
./install.sh
```

**Do not load Band Survey and Toolbox together** — they share the same UI hooks
and will clash.

## Install Band Survey only (not recommended)

```bash
# On the radio host, into OpenWebRX+ htdocs:
HTDOCS=/usr/lib/python3/dist-packages/htdocs   # adjust if needed
sudo mkdir -p "$HTDOCS/plugins/receiver/band_survey"
sudo cp -a band_survey.js band_survey.css \
  "$HTDOCS/plugins/receiver/band_survey/"
```

In `plugins/receiver/init.js`, load **only** Band Survey (never both):

```js
await Plugins.load("band_survey");
```

## Older versions

After GitHub **Releases** / **tags** are published for this repo, download a
specific version from the Releases page, or:

```bash
git clone https://github.com/G4EA5/owrx-band-survey.git
cd owrx-band-survey
git checkout <tag-or-commit>   # e.g. a band-survey-v* tag when available
```

jsDelivr (pin a commit or tag — do not rely on `@main` for Band Survey after
Toolbox becomes the default on `main`):

```text
https://cdn.jsdelivr.net/gh/G4EA5/owrx-band-survey@<tag>/band_survey.js
```
