# Vice Coast Cover Studio

[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/lbs16st/gta6-cover-art-01/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/lbs16st/gta6-cover-art-01/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

An offline web app that turns any photo and a caption into GTA 6-style cover art —
the multi-panel poster look with bold lettering and a Vice City sunset or neon
grade — exported as a PNG to share. Built for the
[make.fun bounty "Make GTA 6 Cover Art"](https://make.fun/bounty/gta6-cover-art-01)
($250, 50 paid places).

Photos never leave the machine: everything runs in the browser from static files,
with no network request at all.

## What it does

- **Six panel layouts** — Hero + 3, Four Square, Full Bleed, Nine Grid, tilted
  Snapshots, and Duo Split — so one photo or several can fill the poster.
- **Any photo, any panel** — add your own photos, click a photo then a panel to
  place it, drag to pan, scroll to zoom, fit per panel.
- **Five colour grades** — Vice Sunset, Neon Nights, Palm Gold, Teal Noir, Hot
  Pink — each a photo filter plus a gradient wash, with grain and vignette.
- **Poster lettering** — a big Anton title with a sunset gradient and black
  outline, a Pacifico script subtitle, and a badge ribbon, over a halftone-edged
  title band.
- **One-click export** — PNG in 1080 × 1080, 1080 × 1350 and 1920 × 1080, one at
  a time or all three at once.
- **Undo / redo, Surprise me, Reset** — the editor keeps a history of every
  change.

## Try it

```sh
node serve.ts
# open http://localhost:8080
```

No build step, no install, no network. Open `app/index.html` in desktop Chrome
from any static server and it works.

## Original work

Everything here is original: the layouts, grades, lettering and code were made
for this entry. No Rockstar Games logo, artwork, character or font is used.
The two fonts are open-licensed — Anton and Pacifico under the SIL Open Font
License 1.1 (see `app/fonts/ATTRIBUTION.txt`). The two sample photos in
`app/samples/` were made for make.fun with an image model and are free to use.

## Entry program

`main.ts` (Node 22, standard library only) copies `app/` and `screenshots/` to
`/output` and writes `/output/dossier.json` with the vendored make.fun library
in `vendor/makefun-app.ts` (unchanged from the kit).

## License

SPDX-License-Identifier: MIT — see [LICENSE](LICENSE).
