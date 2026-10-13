# CLAUDE.md

Working rules for this repo. The long detail (columns, checklists, file lists) is in `README.md`; read the relevant section there before changing anything it covers.

## Status

The site is **live at montevistaxc.com** (GitHub Pages, served from `main`). A push to `main` is on the public web in about a minute. There is no staging, so test locally first: `python3 -m http.server` from the repo root, then load the pages you touched and check for 404s and console errors. Never delete or edit `CNAME`.

## Git

- **Never `git add` a directory** (`git add .`, `git add assets/img`, `git commit -a`). Stage files by name. Working files pass through `assets/img/` (crops, phone originals) and have been published by accident this way; they stay in git history.
- Commit only what the task asked for. Leave the owner's untracked files alone.

## Structure

- The header and footer are **duplicated across all 19 pages** (14 in the repo root, 5 under `team/`) and change together, in one commit. They are byte-identical except for the current-page markers (`aria-current`, `is-current`). Check with `grep -c 'class="nav"' *.html team/index.html team/*/index.html` (every page reports 1; the five redirect stubs report 0).
- Coach pages live at `team/<first>-<last>/index.html` (lowercase, hyphenated; `/team/patrick-wales-dinan/`), and the coaches index at `team/index.html`. The old `coaches.html` and `coach-*.html` in the root are redirect stubs for addresses already shared: leave them, keep them out of the sitemap, and don't give them the header and footer.
- `assets/css/site.css` is the only stylesheet. No inline `style=""`; add a class there.
- `assets/js/csv.js` is the only CSV parser. Never write a second one. Data pages load it first.

## Paths

- **Site pages use root-absolute paths**: `/assets/css/site.css`, `/schedule.html`, `/team/`, and the scripts' data files (`/assets/data/...`). Pages sit at different depths, and this keeps the header and footer identical at every one. No `pwalesdi.github.io` URLs.
- **Archived documents keep their captured relative paths and are never edited.** Nothing under `archive/` changes.
- Paths inside the data files stay relative (`archive/results/...`, `results-archive.html#...`): they're rendered on root-level pages, and `archive.js` accepts only relative paths.
- Full `https://montevistaxc.com/...` addresses only where the spec requires them: canonical links, Open Graph tags, JSON-LD, `sitemap.xml` and `robots.txt`.

## Data

Athlete names in the data files are intentional as they stand. Do not normalize, reconcile or flag name variations, and never add a note, comment or commit message about them.

## Wording

Woodward Park and CIF State times are "fastest in school history", never "school record". The Records pages are the actual record board, and this rule doesn't apply there.

## Schedule

- One file per season, `assets/data/schedule-<id>.csv`, indexed by `assets/data/seasons.csv`. The current season is `CURRENT_SEASON` in `assets/js/schedule.js`; only its file changes, and past seasons are frozen.
- **A meet whose date is in the future never shows a results link.** `schedule.js` enforces this: a Results link renders only for a meet dated today or earlier, whatever the file says. Still leave the cell blank until the meet happens.
- Results links only: no Google Docs or Drive links, itineraries or race assignments in past seasons.

## Photos

- `assets/img/`: at most 1600px on the long edge, JPEG about quality 82. Coach card portraits go in `assets/img/coaches/`: 4:5, at least 600px wide, **never enlarged**. Photos used inside a bio go in `assets/img/` with dated names.
- **All metadata stripped, losslessly** (no re-encode): no Exif, XMP or IPTC. `sips` alone keeps GPS and adds Exif. Check the rotation flag before stripping, or the photo turns sideways. Never commit HEIC.
- Photographer credits live in `assets/data/photo-credits.csv`; `photos.js` renders them wherever the file appears. Lindsay Baloun's photos must always be credited.

## Archive

- Published results are in `archive/results/<season>/`, indexed by `assets/data/results-archive.csv` and shown on `results-archive.html`. Every path is relative.
- `~/Developer/mvxctf_archive/` (outside the repo) holds the untouched originals and manifests. Never modify or delete originals there; repo copies are derivatives.
- Don't alter archived documents to tidy them (blank pages, ads and timing-company notes stay). Never publish the alumni-run spreadsheets.

## Working style

- Report judgment calls rather than deciding silently: what you chose, and why.
- If an instruction contradicts what is actually on disk (a folder said to be empty isn't, a file is in a different format, a link that should exist doesn't), stop and say so before acting. That has caught real mistakes here.
- Say plainly when something didn't work or wasn't done.
