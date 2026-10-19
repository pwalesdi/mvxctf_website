# montevistaxc.com

Static site for Monte Vista High School cross country and track & field, hosted on GitHub Pages. Plain HTML, CSS and JavaScript. There is no build step and nothing to install.

## Run it locally

```sh
cd mvxctf_website
python3 -m http.server 8000
```

Open <http://localhost:8000/>. Use the server, not `file://`: the schedule is fetched with `fetch()`, and browsers block that from `file://` pages.

## Committing

**Never `git add` a directory in this repo** (`git add .`, `git add assets/img`, `git commit -a`…). Stage files by name. Working files pass through `assets/img/` all the time (crops, phone originals), and staging a folder publishes them: in October 2026 two in-progress crops (`coaches/wales-dinan-2.jpg`, 11 MB with a camera serial, and `coaches/wales-dinan-3.jpg`) were committed that way and served for about twenty minutes. They were removed, but **they remain in git history**, like the old Exif in earlier photos.

## Where things live

| Path | What it is |
| --- | --- |
| `assets/css/site.css` | **The design system.** Colors, type, spacing and every component. The top part is the approved mockup's `<style>` block copied unchanged; additions are below the marked line. Don't put inline `style=""` attributes in pages. Add a class here instead. |
| `assets/js/csv.js` | **The one CSV parser.** Also fetch-with-timeout and HTML escaping. Every data page loads it first; don't write another parser. A row whose first cell starts with `#` is a comment and is skipped, in every CSV. |
| `assets/js/schedule.js` | Renders `schedule.html` (Season selector, one season at a time) and the "Next" row on the home page from the current season. |
| `assets/js/records.js` | Renders `track-field-records.html` from `assets/data/records.csv`. |
| `assets/js/ebal-distance.js` | Renders `ebal-distance.html` (EBAL distance points) from `assets/data/ebal-distance.csv`. |
| `assets/js/ncs.js` | Renders the NCS Championships table on `cross-country-records.html` from `assets/data/ncs-championships.csv`. |
| `assets/js/nav.js` | The Records dropdown in the header. Loaded on every page. |
| `assets/js/news.js` | Renders the home page's "Latest" item from `assets/data/news.csv` (see "Home page"). |
| `assets/js/hero.js` | Picks the home page hero photo at random from `assets/data/hero.csv` on every load (see "Home page"). Works with a small inline script in `index.html`'s `<head>`. |
| `assets/js/archive.js` | Renders `results-archive.html` from `assets/data/results-archive.csv` (see "Results archive"). |
| `assets/js/photos.js` | Adds photographer credits from `assets/data/photo-credits.csv` to any photo on the page (see "Photos"). Loaded on the home page, `team/index.html` and every coach page. |
| `assets/js/letters.js` | Renders `varsity-letters.html` from `assets/data/letter-winners.csv`. |
| `assets/data/seasons.csv` | The season index for the schedule's Season selector (see "The schedule"). |
| `assets/data/schedule-<season>.csv` | One schedule per season, e.g. `schedule-2026-xc.csv`. Only the current season's file changes; past seasons are frozen. |
| `assets/data/news.csv` | The home page's "Latest" item. Headers only means no item. |
| `assets/data/hero.csv` | The home page hero photos, one row each, with focal point and caption (see "Home page"). |
| `assets/data/results-archive.csv` | One row per archived results file (see "Results archive"). |
| `archive/results/` | The archived results files themselves, one folder per season. |
| `assets/data/photo-credits.csv` | One row per credited photo: `file` (site path, e.g. `assets/img/carlson-alexys.jpg`) and `credit`. |
| `assets/data/records.csv`, `assets/data/letter-winners.csv`, `assets/data/varsity-standards.csv` | School records, varsity letter winners and letter standards (see "Records and letters"). |
| `assets/js/standards.js` | Renders `varsity-standards.html` from `assets/data/varsity-standards.csv`. |
| `assets/img/` | Logo, hero photo, and team photos (see "Photos"). |
| `assets/docs/clearance-guide.pdf` | Clearance step-by-step guide (downloaded from the old Wix site). Linked from `clearance.html`. It describes **AthleticClearance.com**, not Home Campus; see "Unfinished pages". |
| `source/data/` | The CSVs that `cross-country-records.html` is regenerated from (see "Cross Country Records"). Served publicly like everything else in the repo. |
| `.nojekyll` | Stops GitHub from running Jekyll over the site. |

**Light only.** The site has no dark mode; every colour is defined once on `:root`. Don't add a `prefers-color-scheme` block.

Tables that can be wider than the screen sit in `.table-scroll`, which shows a soft shadow on the right edge while there's more to scroll. It's CSS-only (`background-attachment: local` / `scroll`). Row tints in tables are translucent so the shadow shows through them.

Fonts load from Google Fonts: Archivo (display), Source Serif 4 (body) and Space Mono (numbers and times, as `var(--mono)` / `.mono`).

`site.css` sections, top to bottom: the mockup's styles; additions (numeric face, former inline styles, interior pages, the schedule table and its phone card layout); then the record-book components that came from the State history page (`.mast`, `.stats`, `.seg` pill controls, `.pill`, `.notes`, and `.ledger` for dense data tables). Only the State page's year strip, podium, qualifier groups and chips stay in that page's own `<style>` block.

## The header and footer are duplicated. Change them together.

Static HTML has no includes, so every page carries its own copy of the site header (logo + nav) and footer. The copies are identical except for which nav item is marked current: a top-level link gets `aria-current="page"`; on the four records pages, the Records button gets `class="nav-dd-btn is-current"` and the matching link inside its menu gets `aria-current="page"`.

**Any change to the header or footer must be made in every `.html` page, in the same commit.** That's **20 pages**: in the repo root index, schedule, cross-country, track-field, donate, clearance, 404, results-archive, summer-run, track-field-records, cross-country-records, varsity-letters, varsity-standards and ebal-distance; under `team/` the coaches index (`team/index.html`) and the five coach pages (`team/<first>-<last>/index.html`). Every path in them is root-absolute (`/assets/css/site.css`, `/schedule.html`, `/team/`), so the header and footer are the same at every depth. Afterwards, check with:

```sh
grep -c 'class="nav"' *.html team/index.html team/*/index.html   # every page reports 1, except the five redirect stubs (0)
```

The top nav is **seven items, and that's the limit**. It's measured to fit without scrolling from 1201px up. "Records" is a dropdown (`assets/js/nav.js`) holding Track & Field Records, Cross Country Records, Track & Field Letter Winners, Track & Field Letter Standards and EBAL distance points. Above 1200px it opens on hover or click; at 1200px and below, where the nav scrolls sideways, a tap opens it as a band under the nav that pushes the page down. Escape closes it. `summer-run.html` isn't in the nav and marks Cross Country as current. `clearance.html` isn't in the nav either and marks nothing current; the home page hero's "XC / T&F clearance" button links to it.

`404.html` (not in the nav, nothing current) is what GitHub Pages serves for any unmatched URL, including every old Wix link (`/24xc`, `/tf24`, `/2025-cross-country`…). It's served at the bad URL's own path, which is why its paths, like every page's, are root-absolute. It is `noindex`. The nav label for the schedule page is just "Schedule"; the page's own heading stays "Schedule & results".

## The schedule

`schedule.html` shows one season at a time, picked from a **Season** selector. The current season loads by default; any other is `schedule.html?season=<id>` (e.g. `?season=2024-xc`), so Back works and a season can be shared. An unknown id falls back to the current season. The current season is split into Upcoming, Completed and (if any) Date to be announced; a past season is one list, since every meet in it is done.

The **current season** is the constant at the top of `assets/js/schedule.js`:

```js
var CURRENT_SEASON = "2026-xc";
```

Change it at each season rollover, and mark the same season `yes` in the `current` column of `assets/data/seasons.csv` (the constant wins if they disagree).

**`assets/data/seasons.csv`** lists the seasons: `id, label, sport, year, sort, current, note`. `id` names the file (`schedule-<id>.csv`), `label` is what the selector shows, `sort` orders the selector (1 = top), and `note` is one line shown under the selector for that season (COVID, a partial season…). Season ids are `<year>-xc`, `<year>-track`, and `2021-xc-spring` for the COVID-displaced spring 2021 season.

**One file per season**, `assets/data/schedule-<id>.csv`, all with the columns below. Only the current season's file changes. Past seasons are frozen: they were rebuilt from the old site's season pages and the archive, keeping only results links (our archived copy where we hold one, with the original in `results_source_url`) and never the other links on those pages (Google Doc itineraries, race assignments, entries, tickets). Where a meet has no results, the Links cell is simply empty.

To run the current season from a Google Sheet instead of its file, publish the sheet (File → Share → Publish to web → the tab → Comma-separated values) and set `CURRENT_SHEET_URL` near the top of `schedule.js` to the published URL (`https://docs.google.com/spreadsheets/d/e/2PACX-.../pub?gid=0&single=true&output=csv`). Google caches published CSVs, so edits can take a few minutes to show up. Anyone with the link can read a published sheet, so keep phone numbers and addresses out of it.

**Sheet URL:** not published yet.

### Columns

Columns are matched by header name, so their order doesn't matter. Header names must match exactly (case is ignored).

| Column | Notes |
| --- | --- |
| `date` | `YYYY-MM-DD` (`M/D/YYYY` also accepted). Leave empty if not set: the row goes under "Date to be announced." |
| `meet` | Event name. Rows without one are skipped. Commas are fine. |
| `sport` | `XC` or `TF` |
| `level` | All Athletes, Select Athletes, Varsity Athletes, All Parents, All Athletes & Family |
| `location` | Plain text |
| `map_url` | Optional. Makes the location a link. |
| `time` | Free text, printed as-is ("7:30 AM", "Boys 7:40 AM, Girls 10:00 AM") |
| `results_url` | Optional. Shows a "Results" link. Where we hold the final results, point it at our copy (a relative path such as `results-archive.html#m-2026-09-19-woodbridge-invitational`). |
| `results_source_url` | Not shown. Where the results came from (the timing company's page), kept for provenance. Also the archivable copy when `results_url` points somewhere that blocks capture: Clovis 2026 links to athletic.net, but its source is `finishedresults.com/meets/14352`. |
| `extra_label` / `extra_url` | Optional second link (Tickets, Live video, Race video…). Shown only when both are filled. Keep a `&t=` timestamp on a race video so it opens at the race. |
| `notes` | Optional small text under the meet name |

A row whose `date` cell starts with `#` is a comment (the file ends with one, showing an undated row). Only `http`/`https` links are rendered, and every value is HTML-escaped. If a season's file can't be loaded, the page says so and links to the results archive and Athletic.net. Below 640px the table becomes one card per meet (meet name as the heading, empty fields hidden, short dates).

### Data to fix

`schedule.js` shows a Results link only for a meet dated today or earlier, whatever the file says; still leave `results_url` blank until the meet happens. Before adding a link, open it and check the meet name and date inside: Diablo Timing's addresses are date-based, so last year's page is one digit away.

The 2026-10-10 Wildcat Invitational (Dougherty Valley High School) has no `results_url` yet.

## Home page

Sections, top to bottom: hero, **Latest**, schedule & results (with the next meet), the program record band, practice times, sign-ups & volunteering, contacts. Clearance has its own page (`clearance.html`) and the donation has `donate.html`; the home page has a one-line pointer to each under practice times. They are deliberately not presented as steps: the donation is not required.

**Latest** comes from `assets/data/news.csv`, columns `date, headline, body, link_label, link_url, image, image_alt, image_credit`:

| Column | Notes |
| --- | --- |
| `date` | `YYYY-MM-DD`. The row with the latest date is shown; only one item ever shows. |
| `headline` | Required. Rows without one are ignored. |
| `body` | Two or three sentences, plain text. Wrap it in double quotes if it contains a comma. |
| `link_label` / `link_url` | Optional link, e.g. "See the results" and a results URL. Only `http`/`https` or site-relative links are rendered. With `link_url` empty nothing renders, not even the label. |
| `image` | Optional photo, e.g. `assets/img/2026-10-10-xc-clovis-girls.jpg` (processed to the photo rules first; never HEIC). Shown beside the text at 300px tall on wider screens, above it at 240px on phones, lazy-loaded. |
| `image_alt` | Describe the photo. Required whenever `image` is set. |
| `image_credit` | Optional photographer credit. Used only if the image isn't already listed in `assets/data/photo-credits.csv`, which wins. |

Everything is HTML-escaped. With no rows (headers only), a missing file or a load error, the section doesn't render at all: no box, no placeholder.

**The hero photo** changes on every load, picked at random from `assets/data/hero.csv`, columns `file, focus, caption, alt`:

| Column | Notes |
| --- | --- |
| `file` | The photo, e.g. `assets/img/2022-04-23-track-hurdles.jpg`. Relative path inside `assets/img/`; anything else is ignored. |
| `focus` | The point of the photo to keep in frame, as `<across>% <down>%`. `50% 0%` keeps the top edge, `65% 55%` keeps a spot right of centre and a little below the middle. The hero is a wide 480px band on computers (only the `down` number matters there) and a 4:5 portrait on phones (only `across` matters). Set it by trying the photo at 1280px and 1920px wide and on a phone: the wider the screen, the thinner the slice of a photo you see. |
| `caption` | The small line under the buttons. Names the athletes where known. |
| `alt` | Describe the photo for screen readers. |

Prefer landscape photos. A portrait shows as a thin horizontal slice on computers: the Clovis photo (1200 × 1600) works at `50% 34%` with every head in frame up to 1920px, but it's chest-up at that width and slightly soft, because it's stretched. A row whose first cell starts with `#` is switched off. The Woodbridge photo of O'Connell and Makarova is in the file that way, held until its photographer is confirmed (see "Photos"). If a hero photo is listed in `photo-credits.csv`, its credit is added to the caption line.

How it avoids showing the wrong photo first: an inline script in `index.html`'s `<head>` starts loading `hero.csv` before anything is drawn, and with JavaScript on, the hero has no photo until `hero.js` has picked one. The default hero (`hero-loughery-miller.jpg`, "Jack Loughery & Ethan Miller") sits in `<noscript class="hero-default">` blocks: it's what shows without JavaScript, and what the page falls back to if the list, the script or the chosen file fails to load, or if nothing has been picked three seconds after the page loads. The default isn't in the rotation; add a row for it if you want it there. The link preview (`og:image`) and the JSON-LD still use the default hero.

## Post-season checklist

Several parts of the site go stale on a fixed yearly cycle. Work through the relevant list after each season. Every change below is to a file in this repo. Afterwards, run the site locally (see the top of this file), click through the pages you touched, and check nothing says "couldn't load".

**Results archive, after every meet with final results:**

1. Download the final compiled results (Hy-Tek PDF or the meet's own file). Not live results.
2. Keep the original in `~/Developer/mvxctf_archive/`. For the repo copy, take the smaller of the original and a Ghostscript `/ebook` pass, and strip metadata.
3. Screen it: results only. No rosters, contact details, forms, or social events (see "Results archive").
4. Save it as `archive/results/<season>/<YYYY>-<track|xc>-<MM>-<DD>-<meet-slug>-results.pdf`. A meet published as many per-event pages gets a folder of that name, with the original filenames.
5. Add one row per file to `assets/data/results-archive.csv`. **Relative paths only**, no leading `/`.
6. In the season's `schedule-<id>.csv`, point `results_url` at the copy (the file, or `results-archive.html#m-<date>-<meet-slug>` for multi-file meets) and keep the original URL in `results_source_url`.
7. At season end, open `results-archive.html` and click every link for the season.

To find leftover years quickly: `grep -rn "2026" *.html assets/js assets/data` (use whichever year just ended).

### After each cross country season (late November / December)

1. **State results (Cross Country Records page)**: `cross-country-records.html`
   - Add the new State results to the source CSVs in `source/data/` (`mv_cif_state_xc_individuals_1987_2025.csv`, `mv_woodward_park_all_marks.csv`), then regenerate the page's `<script>` data block (`DATA`, `WP`, the team-times list `T` and the multi-year list `M`). See "Cross Country Records" below; the generator script isn't in the repo yet.
   - **Years at State strip: three places, change them together.** In the page's script, both `for (let y = 1987; y <= 2025; y++)` lines: bump `2025` to the new year. In the page's `<style>` block, `.strip{grid-template-columns:56px repeat(39, …)}`: add 1 to `39` for each year added. If they disagree, the strip misaligns.
   - **Headline numbers** at the top of "Monte Vista at State" are typed in: straight girls team trips ("2013 through 2025"), best finishes, team appearances ("18 girls, 7 boys"), State qualifiers ("75 girls, 45 boys · 7 went all four years"). Recount and edit.
   - **"Active" pills** on the multi-year qualifiers come from `active: true/false` in the `M` list in the page's script. Turn off graduates; turn on returning athletes.
   - **Footnotes** at the bottom of the page name year ranges ("Places marked * (2022–2025)", the Sources line, the Clovis years). Extend them.
   - **Woodward Park marks** (Clovis, State, Rough Rider) go into `WP` with the rest of the regenerated data.
2. **NCS championships**: `assets/data/ncs-championships.csv`. Add one Girls and one Boys row for the new year (`place`, `place_num`, `division`). If the division changed, rewrite the hand-written sentence under the NCS table in `cross-country-records.html`.
3. **Cross Country page**: `cross-country.html`
   - Top-line band: "14" NCS titles ("Girls 12, boys 2"), "22 of 37" girls top-three years, "25" State team trips ("18 girls, 7 boys"), "120" State qualifiers.
   - "Why Monte Vista": "1984 through 2025", "2022, 2024 and 2025", "since 2019" counts, "12 straight … 2013 through 2025", "5th" best State finish, boys "7" State trips.
   - **These go stale after every season. Replace them:** girls `1-5-6` ("…Padilla sixth. **All three return.**") and boys `4th` ("**Kotamraju returns** after placing fourth…").
   - Don't name years for the boys' two NCS team titles in prose (the source records conflict). The NCS table shows them as the CSV has them, 2007 and 2015, by decision.
4. **Home page accomplishments band**: `index.html`. "14" NCS team titles, "3" titles in four years ("2022, 2024 and 2025"), "21" section titles since 2019, "77" All-NCS honors ("31 different athletes"), and the four highlight lines with their year labels ("2025 · Cross country", "2019–2025 · Depth" and so on).
5. **Head coach bio**: `team/patrick-wales-dinan/index.html`. Running cross country totals: "42 different athletes … 72 State races", NCS and State results, Clovis marks.
6. **Roster highlights on the records board**: `assets/data/records.csv`, column `active`. Set `yes` for athletes now on the roster (relays: if any leg is current), clear graduates. Set it by hand.

### After each track season (late May / June)

1. **Varsity letter winners**: `assets/data/letter-winners.csv`. Add a row per athlete for the new year (`gender, year, athlete, honor`), in the order you want them listed. The page counts the rows itself.
2. **Athlete of the year honors**: same file, `honor` column ("Track Athlete of the Year", "Field Athlete of the Year"). They show as red pills.
3. **School records**: `assets/data/records.csv`. Insert new marks, re-number `rank` within each event, and keep `event_order` as is. Flags go in `flag` (`w` wind-aided, `c` converted), never in `mark`. Set `active` as above.
4. **EBAL distance points**: `assets/data/ebal-distance.csv`. Add one row per scoring place (top six) for the 800m, 1600m, 3200m and 4x800, girls and boys, with `points` 10-8-6-4-2-1. Use `program` "Carondelet / De La Salle" for those two schools, otherwise the school name. The page's year range and totals update themselves.
5. **Varsity standards for next year**: `assets/data/varsity-standards.csv`, plus the eyebrow "Track & Field · 2026" in `varsity-standards.html`. Once EBAL publishes the new qualifying marks: standard = (3 × average of the last three years' EBAL 7th-place marks + EBAL qualifying standard) / 4. That's the 3:1 weighting, used from the 2027 standards on; the published 2026 standards used 2:1 and stay as published. Field marks are rounded to the nearest half inch (`28' 6"`, `15' 6.5"`). Working files: `source/data/MV_Varsity_Standards.*`, `ebal-2026-seventh-place.csv`, `varsity-standards-2027-DRAFT.csv`. These are git-ignored and not published until final.
6. **Head coach bio, track section**: `team/patrick-wales-dinan/index.html`. Meet of Champions and Tri-Valley titles and counts ("19 … titles", the two title lists), EBAL and NCS team results, "77 All-NCS honors … 31 different athletes".

### Every year, before the new season

1. **Athletic.net links**: the year is in the path of both: `https://www.athletic.net/team/1027/cross-country/2026` and `https://www.athletic.net/team/1027/track-and-field-outdoor/2026`. They're in the footer of **every page** (change all pages in one commit, as with any header or footer change), the home page's schedule panel, the `<noscript>` line on `schedule.html`, and `assets/js/schedule.js` (`SPORTS`). Find them all with `grep -rn "athletic.net/team" .`
2. **Schedule**: add the new season to `assets/data/seasons.csv` (top of the `sort` order, `current` = `yes`, and clear `current` on last season), create `assets/data/schedule-<id>.csv` with the same columns, and set `CURRENT_SEASON` in `assets/js/schedule.js`. The finished season's file is then frozen: point its `results_url`s at archived copies first (see the results archive steps above). Check that every `results_url` is this season's, not last year's.
3. **Home page season text**: `index.html`. The hero "2026 Cross Country", the "2026 pre-season" practice line, "2026 cross country schedule & results", the "Printable season schedule" Google Doc link, and the "Past seasons & results archive 2020–2025" label.
4. **Coach bio year counts**: head coach "ninth season" (`team/patrick-wales-dinan/`), Spilker "8th year" (`team/logan-spilker/`), Graham "40th year" (`team/dan-graham/`), Williams "4th season" (`team/brittany-williams/`). Add 1 to each.

## Records and letters

Both pages render from CSVs, so updating them means editing a CSV. Neither page has a hand-written count or list.

**`assets/data/records.csv`**: `gender, event_group, event_order, event, rank, athlete, mark, year, flag, active`
- `event_group` is shown in the order Sprints, Hurdles, Distance, Relays, Field. Events within a group are sorted by `event_order`.
- `flag` is `w` (wind-aided), `c` (converted mark) or empty, and is shown as a small badge after the mark. Keep the letter out of `mark` itself.
- `active` is `yes` for athletes currently on the roster (for relays: if any leg is current). Those rows get the red tint. **It's set by hand.** Empty for every row until Patrick sends the roster.

**`assets/data/letter-winners.csv`**: `gender, year, athlete, honor`
- Years newest first. Names in file order. Each year's "N athletes" is counted from the rows. Patrick's 2022 girls source is headed "(17)" but lists 19 names, so the page says 19. That's intended.
- A non-empty `honor` shows as a red pill after the name.

**`assets/data/ebal-distance.csv`**: `gender, event, relay, year, place, school, program, points`
- One row per scoring place at the EBAL Championships (800m, 1600m, 3200m, 4x800), 2022 on. `points` is the score for that place (10-8-6-4-2-1). The page adds up `points` and never assumes the weights, so a change in scoring is a data change.
- `program` is the row the points count toward. Carondelet (girls) and De La Salle (boys) share "Carondelet / De La Salle"; every other school's `program` is its own name.
- Relays score once per team. Leave unfilled places out (there was no 4x800 in 2022). The page notes event-years with no rows automatically.
- Lives on its own page, `ebal-distance.html` (in the Records menu). Interactions: sort by girls, boys or combined total; show girls' or boys' points in the year columns; select a school to expand its points by event. The expanded breakdown is extra rows in the same table (separate Girls and Boys blocks, one number per cell, the selected gender first), so its year columns line up with the school's row.
- Monte Vista boys' 2026 EBAL total is 14. (24 is the NCS Tri-Valley figure; don't label it EBAL.)

**`assets/data/ncs-championships.csv`**: `gender, year, place, place_num, division, note`
- One row per team per year. The Cross Country Records page shows one row per year, newest first: Year, Division (shared by both teams), Girls, Boys. `place` is printed as-is (`1st`, `15th`); `place_num` of 1 gets the red tint.
- An empty `place` shows as an em dash, with the `note` available to screen readers. When both teams have no place and the same note (2020, "No championship held"), the note spans both columns.
- The sentence under the table about divisions is hand-written. Check it if the division column changes.

**`assets/data/varsity-standards.csv`**: `gender, event_group, event_order, event, standard`
- The **2026** standards, the most recent published set. `event_group` is `Track` or `Field`, shown in that order; rows within each are sorted by `event_order`. `standard` is printed as-is: track times to two decimals, field marks rounded to the nearest half inch (`28' 6"`, `15' 6.5"`, `85' 0"`).
- Formula (README only, deliberately not on the page): (3 × three-year average of EBAL 7th place + EBAL qualifying standard) / 4, from the 2027 standards on. The published 2026 numbers used the average weighted twice, and stay as published.
- The page also lists the three ways to earn a letter: meet the standard, qualify individually for the CIF NCS Tri-Valley Area Championships (normally through the league meet, so the copy deliberately doesn't name a qualifying mark), or run on a relay that finishes top three there.
- **To do: replace this file (and the "2026" eyebrow on the page) when the 2027 EBAL qualifying marks are published** and the 2027 standards are final.
- Not in the repo on purpose: `source/data/varsity-standards-2027-DRAFT.csv`, `ebal-2026-seventh-place.csv` and `MV_Varsity_Standards.csv`/`.xlsx`. Everything committed is publicly served, and the 2027 numbers aren't final.

The standards page isn't in the top nav (seven items is the limit). It's linked from Track & Field, Records, and the footer under "The program".

## Image folders

Photos live in three folders. Each folder holds one shape of picture, for one job.

| Folder | What it's for | Shape |
| --- | --- | --- |
| `assets/img/` | Photos shown on the pages themselves: the home page hero, the Latest item, photos inside coach bios. Also the two logos. | The photo's own shape, at most 1600px on the long side. Named with the date it was taken, e.g. `2024-05-03-track-ebal-discus.jpg`. |
| `assets/img/coaches/` | The portrait on each coach's card and page. Nothing else goes here. | Tall, 4:5 (about 710 × 887), one person, face in the top half. Named after the coach, e.g. `graham.jpg`. |
| `assets/img/share/` | The picture that shows when someone shares a link in a text message or on social media (`og:image`). | Wide, exactly 1200 × 630. Named after the photo in `assets/img/` it was cut from. Never a Lindsay Baloun photo: a preview can't show her credit. |

**Why the same photo can be in two or three folders.** A coach card needs a tall picture of one person; a link preview needs a wide one. Phones and social sites download the preview file as it is and can't crop it, so it has to be its own file, and a card portrait is cropped by hand so the face sits right. So one good photo can exist three times: the whole frame in `assets/img/`, a tall crop in `coaches/`, a wide crop in `share/`. For example, Coach Graham's card is cut from `dan-graham-high-five-2024.jpg`, and the Cross Country Records page's preview is cut from `2026-10-10-xc-clovis-girls.jpg`. Each copy is a separate small file; editing one doesn't change the others.

Two things to keep in mind:
- **Anything committed here can be downloaded by anyone** at `montevistaxc.com/assets/img/...`, even if no page shows it. Don't keep originals or work files in these folders; they get committed by accident (see "Committing").
- **Being in the folder doesn't mean being on the site.** Many photos are on file for later. The table under "Photos" says what each one shows.

## Coach photos

`team/index.html` (`/team/`) lists every coach; coaches with a bio have their own page at `team/<first>-<last>/index.html` (`/team/patrick-wales-dinan/`): first and last name, lowercase, hyphenated. The old addresses (`coaches.html`, `coach-wales-dinan.html`, `coach-graham.html`, `coach-spilker.html`, `coach-williams-brittany.html`) are redirect stubs in the repo root: a canonical link, a meta refresh and a visible link to the new address, with no header or footer. They're not in the sitemap; leave them in place, since the old addresses were shared. Each shows a photo slot that stays a neutral grey block until the file exists.

To add a photo, save it as:

| Coach | File |
| --- | --- |
| Patrick Wales-Dinan | `assets/img/coaches/wales-dinan.jpg` |
| Logan Spilker | `assets/img/coaches/spilker.jpg` |
| Dan Graham | `assets/img/coaches/graham.jpg` |
| Edd Williams | `assets/img/coaches/williams-edd.jpg` |
| Brittany Williams | `assets/img/coaches/williams-brittany.jpg` |
| Craig Rothstein | `assets/img/coaches/rothstein.jpg` |
| Kinsey Pogue | `assets/img/coaches/pogue.jpg` |

- **Aspect ratio 4:5 (portrait), at least 600px wide, never enlarged.** Crop at the source photo's own resolution; if a 4:5 crop can't reach 600px wide without upscaling, don't use the photo. JPEG, about quality 82, with metadata stripped (see "Photos" for how; don't use `sips` alone, it keeps GPS). Wales-Dinan (710 × 887), Edd Williams (710 × 887) and Graham (691 × 864) are about three times the 240px card.
- **Exception: `coaches/spilker.jpg` is 392 × 615**, below the minimum and not 4:5 (the slot crops it, anchored to the top of the photo, because the usual crop clipped his head; there's only about 14px of photo above his hair). The owner chose to use it as supplied, not enlarged. It's soft on 3× phone screens; replace it when the full-size file arrives. **Credit unconfirmed and pending**: probably Lindsay Baloun, with the credit stripped. Once confirmed, add it to `photo-credits.csv`.
- If the photographer needs credit, add the file to `assets/data/photo-credits.csv`; `photos.js` puts the credit on the photo wherever it appears.
- Every slot crops to fill (centred horizontally, weighted toward the top), so any 4:5 photo with the face in the upper half drops straight in. Other shapes still work but get cropped.
- One line to change: each slot is a CSS background (`.p-<name>` rules in `site.css`). Rules for coaches without a photo are commented out, so no page requests a missing file (a missing photo shows the grey block); when you add a photo, uncomment its rule.

## Photos

Every photo in `assets/img/` is at most 1600px on the long edge, JPEG quality 82, with **all metadata stripped**: no Exif, XMP or IPTC/Photoshop blocks. What remains is the JFIF header, the ICC colour profile and, on one file, Adobe's APP14 colour marker, none of which identify anyone. Two of the phone originals carried GPS coordinates; `sips` keeps those when it converts, and adds an Exif block of its own, so it isn't safe to use on its own. Strip losslessly afterwards (`exiftool -all= -tagsfromfile @ -icc_profile file.jpg`, or `jpegtran -copy icc`) rather than re-encoding. There are no full-size masters any more: photos are either processed into `assets/img/` or deleted, never kept in a third place.

**Photo decisions (October 2026).** Deleted: the ten full-size masters of photos already in `assets/img/` at the 1600px cap (two carried GPS), and one unidentified 1060px race photo. Processed: the sharper 5333px frame of the 2024 EBAL champions photo (replacing the 1536px one), the 2024 EBAL discus photo, two 2016/2025 team photos, the 2026 Clovis photo, and three crops of Coach Wales-Dinan. Held in `~/Developer/mvxctf_archive/photos/` and not to be touched: Lindsay Baloun's 2024 EBAL photo of the girls carrying a coach. A 4898 × 3265 copy of it, dated 2024-05-03, sits untracked as `coaches/walesd-dinan-4.jpg` (the misspelling is in the filename), not yet used. `spilker_edited.jpg` (392px; a full-size file has been requested from the photographer, probably Baloun) is now `coaches/spilker.jpg`. `assets/img/coaches/` holds card portraits only; photos that appear inside a bio go in `assets/img/` with dated names.

Stripping also removes photographer credit, so credit lives here. Lindsay Baloun (Lindsay Baloun Photography) took `2024-05-03-track-ebal-champions-team.jpg`, `2024-05-03-track-ebal-discus.jpg`, `carlson-alexys.jpg`, `dan-graham-high-five-2024.jpg` (and the `coaches/graham.jpg` crop of it) and `ethan-miller-2023-moc-3200m.jpg`. Credit her wherever one of these is shown. That's automatic: every credited file is listed in `assets/data/photo-credits.csv`, and `photos.js` adds "Photo: …" to coach-photo slots (along the bottom edge; below the thumbnail on phone cards) and to `<figure>` images (in the `figcaption`; an image not in the CSV can carry `data-credit`, which is how the news item's `image_credit` works). Scripts that add photos after load call `MVPhotos.apply(element)`. Add any new credited photo to that file, and load `csv.js` + `photos.js` on any page that shows photos.

**Credits pending** (shown uncredited until confirmed): `coaches/spilker.jpg` (probably Lindsay Baloun), `xc-wales-dinan-pointing-field.jpg` (photographer unknown), and Edd Williams's three photos (`coaches/williams-edd.jpg` and the two `*-williams-edd.jpg` bio photos; sent by text message, no credit in the files, photographer unknown).

**Known:** photos committed before October 2026 still carry their old Exif and Photoshop blocks in git history (no GPS). The current files are clean; the history was left alone on purpose.

Dates in a filename come from the camera's capture time (Pacific). Files with only a year had no camera data, so their date is unreliable. None of these are on a page yet. When one is placed, give its `<img>` `loading="lazy"` (every image except the hero and the header logo) plus `width`/`height` attributes, so the page only fetches what the visitor scrolls to.

| File | What it shows |
| --- | --- |
| `2022-ncs-xc-girls-champions.jpg` | Girls XC team with the 2022 NCS D2 championship plaque at the NCS backdrop |
| `2021-11-06-xc-girls-race-start.jpg` | Girls XC race start, Mustangs at the front |
| `2019-11-09-xc-girls.jpg` | Girls XC runners walking on a dirt course area |
| `2019-11-23-xc-team-photo.jpg` | XC team photo under the "Monte Vista Cross Country" tent banner |
| `2019-xc-girls-group.jpg` | Seven girls in team kit, arms crossed, in a park (iPhone export; date uncertain) |
| `2022-cif-state-xc-ethan-miller.jpg` | Boys XC race; Ethan Miller at CIF State 2022 |
| `2019-05-18-track-kelli-wilson.jpg` | Girls distance race on the track; Kelli Wilson |
| `2022-track-ebal-binder-pogue.jpg` | Girls distance race; Binder and Pogue at EBAL |
| `2022-track-ebal-finals-team.jpg` | Large track team photo on the infield, coaches at both ends; EBAL finals 2022. Candidate page banner (a group shot, not a coach-card portrait) |
| `2023-05-05-track-ebal-ethan-miller.jpg` | Boy on the track (portrait); Ethan Miller at EBAL |
| `2022-track-jack-loughery.jpg` | Boy running on the track (portrait); Jack Loughery |
| `2022-track-caden-honda.jpg` | Three boys sprinting; Caden Honda |
| `2022-04-23-track-hurdles.jpg` | Wide shot of a boys hurdles race with a full grandstand; Sacramento Meet of Champions (the hurdles read "American River"). In the home page hero rotation |
| `2022-04-08-track-arcadia-peters.jpg` | Girl finishing a race, "Finish on…" banner; Peters at Arcadia |
| `2022-04-23-track-shot-put-rosati.jpg` | Shot put throw; Rosati (first name not confirmed: Ash and Emilie Rosati were both on the 2022 team). In the home page hero rotation |
| `2022-track-pole-vault-wong.jpg` | Girl on a pole vault runway (portrait); Wong |
| `2022-05-28-cif-state-track-wright.jpg` | Hurdles finish, athlete flexing; Wright at CIF State |
| `2022-track-coach-graham.jpg` | Coach and athlete on the infield; Coach Graham |
| `2022-track-coach-graham-pole-vault.jpg` | Pole vault coaching on the infield; D. Graham. Candidate in-action photo for his bio (too little headroom for the portrait slot) |
| `2022-track-coach-wales-dinan.jpg` | Coach in a plaid shirt and cap trackside; Wales-Dinan |
| `ncs-logo.png` | CIF North Coast Section logo (PNG, transparent background) |
| `2024-05-03-track-ebal-champions-team.jpg` | Girls track team with coaches after winning the 2024 EBAL Championships, "Winning is a Habit" shirts. Lindsay Baloun. Replaced a 1536px frame of the same moment. On the head coach page |
| `2024-05-03-track-ebal-discus.jpg` | Discus throw at the 2024 EBAL Championships. Lindsay Baloun. **Caption by event and meet only, no athlete name**: the thrower isn't confirmed |
| `carlson-alexys.jpg` | Thrower in Monte Vista kit by the throws-ring fence; Alexys Carlson. Lindsay Baloun |
| `dan-graham-high-five-2024.jpg` | Coach Graham high-fiving relay runners, 2024. Lindsay Baloun. Source of `coaches/graham.jpg` |
| `ethan-miller-2023-moc-3200m.jpg` | Boys 3200m at the 2023 Meet of Champions; Ethan Miller. Lindsay Baloun |
| `oconnell-makarova-woodbridge-2026.jpg` | Girls race at Woodbridge 2026 (portrait); O'Connell and Makarova. **Photographer unknown**: shot on a Sony A7 V with a 70–200mm lens and edited in Lightroom, with no name in the file. Held out of the hero rotation (a switched-off row in `hero.csv`) until confirmed |
| `2026-08-22-xc-scrimmage-wales-dinan-cheering.jpg` | Coach Wales-Dinan cheering a boy on the track at the August 2026 XC scrimmage. Not on a page since October 2026 (replaced by the pointing photo below) |
| `xc-wales-dinan-pointing-field.jpg` | Coach Wales-Dinan in a red Monte Vista shirt, phone in hand, pointing across a dry-grass field beside a runner. **Undated** (no camera data) and **credit pending**. On the head coach page, Cross Country section |
| `2026-08-22-xc-scrimmage-wales-dinan-girls.jpg` | Coach Wales-Dinan talking with the girls at the August 2026 XC scrimmage. On the head coach page |
| `xc-wales-dinan-on-course.jpg` | Coach Wales-Dinan alone on a cross country course, pointing. **Undated** (no camera data). On the head coach page, Cross Country section |
| `2016-10-07-xc-girls-group.jpg` | Seven girls in red team shirts lying on the grass by an ASICS banner, 2016 (iPhone) |
| `2025-11-22-xc-ncs-kotamraju.jpg` | Boys race at the 2025 NCS Championships; Rohan Kotamraju (from the original filename and date) |
| `2026-10-10-xc-clovis-girls.jpg` | Seven girls in uniform after the 2026 Clovis Invitational (portrait; the home page's first Latest item). Converted from iPhone HEIC; no GPS in the original. In the home page hero rotation |
| `2025-05-21-track-tssaa-state-williams-edd.jpg` | Coach Edd Williams (left) and a fellow Millington coach with the 2025 TSSAA Division I Class AA boys state runner-up trophy (portrait, shown at most 400px wide). Converted from iPhone HEIC; the original carried GPS. On his coach page |
| `2024-07-28-track-junior-olympics-williams-edd.jpg` | Coach Edd Williams with four athletes wearing National Junior Olympic medals and All-American caps, July 2024. Converted from iPhone HEIC; the original carried GPS. On his coach page, and the source of its share image |
| `coaches/wales-dinan.jpg`, `coaches/graham.jpg`, `coaches/spilker.jpg`, `coaches/williams-edd.jpg` | Coach portraits, 4:5 crops at source resolution, except Spilker's (see "Coach photos"). Edd Williams's is a head-and-shoulders crop of a May 2024 photo of him beside a young Youth Memphis athlete, cut tight to leave the child out; converted from iPhone HEIC, the original carried GPS |
| `share/*.jpg` | Link-preview images (`og:image`): 1200 × 630 crops, named after the photo in `assets/img/` they're cut from. The hero crop is the default for pages without a fitting photo. **Never a Lindsay Baloun photo**: a preview card can't carry her credit. Portraits narrower than 1200px aren't enlarged for this, so the head coach page uses the scrimmage photo instead of his card portrait |

## Unfinished pages

| Page | Missing |
| --- | --- |
| `track-field.html` | Program overview, season and event-group information |
| `team/*/index.html` | **Year counts are hardcoded and need bumping every season:** head coach "ninth season", Spilker "8th year", Graham "40th year", Brittany Williams "4th season". |
| `team/index.html` | Coach bios still needed: Craig Rothstein, Kinsey Pogue. They're on the index as plain name and title, not linked, until a bio exists; then add `team/<first>-<last>/index.html` (copy an existing one; e.g. `team/kinsey-pogue/`), add it to `sitemap.xml`, and turn their index entry into a link. |
| `team/` pages | Coach photos: Wales-Dinan, Graham, Edd Williams and Spilker (low resolution) done; the other three not supplied yet. See "Coach photos". |
| `clearance.html` | **Check the steps.** They were reconstructed from the old Wix site and may be wrong. The linked PDF guide describes AthleticClearance.com, while the steps and links say Home Campus; one of them is out of date. |
| `team/index.html` | A contact method for the coaching staff is still undecided. No email addresses on the coach pages. |
| `donate.html` | Check drop-off, what the donation pays for, corporate matching details. The $600 / check / webstore / no-cash wording is done. |
| `summer-run.html` | Dates, meeting place, sign-up |
| `schedule.html` | Works. The home page's "Past seasons & results archive (2020–2025)" link also points here, and there is no archive yet. |

## Results archive

`results-archive.html` lists every archived file by season, from `assets/data/results-archive.csv` (`season, date, meet, group, label, path, source_url`, one row per file). The files live in `archive/results/<season>/` (seasons like `2024-track`, `2021-xc`, `2021-xc-spring`). Rows with a `group` (`events`, `races`) are a multi-file meet, listed under a collapsible "Event results" or "Race results"; those files keep their original names in the meet's own folder. Each meet has an id, `m-<date>-<meet-slug>`, that the schedule can link to. Every path is relative: the site moves from `pwalesdi.github.io/mvxctf_website/` to a domain root, and a leading `/` would break on one or the other.

**Rendered captures.** Some meets were published only as a web page, with no compiled file: Diablo Timing's MeetPro cross country pages (2019 Monte Vista Invitational; De La Salle, Scott Bauhs, EBAL and NCS 2024; De La Salle, EBAL and NCS 2025) and MileSplit's Monte Vista Invitational results (2008–2012 and 2014–2016; 2013 isn't on MileSplit). These were printed to PDF with headless Chrome from the live pages, so they keep the original formatting, then put through Ghostscript `/ebook` (the extracted text is identical). MileSplit pages were printed from their server-rendered HTML with scripts removed, which drops the ads and the cookie banner that would otherwise print over the results; each race is its own page there, so each year's races are merged into one PDF. The manifest marks all of these as rendered captures, not source files. Clovis 2026 is Finished Results' two "merge" files (every runner from every race, ranked together, with team scores); its 30 per-race PDFs weren't fetched.

**Not in the repo** (kept in `~/Developer/mvxctf_archive/`): Diablo Timing's newer results viewer (2026 Dublin Last Chance PR), which is their own app; other saved third-party web pages (CIF State, Sacramento MoC, TimerHub, xcstats, a MileSplit team page); and Wayback captures. Those meets keep their external links. The two EBAL 2022 track files from Wix are left out as duplicates of Diablo's compiled copy, and the misnamed Wix "Sacramento Meet of Champions" file is published under its real name, the Northern California Frosh/Soph Championships.

Archived results files are kept outside the repo, in `~/Developer/mvxctf_archive/`, until they're published. **The alumni-run spreadsheets (2006–2016) are never published.** They are a social event, not meet results, and they name children who were never on the team ("youth" and "sibling" divisions) and parents next to same-surname athletes. They stay in the archive only; `publication-manifest.csv` there records every file's publish decision and why.

## Cross Country Records

`cross-country-records.html` (formerly `state-history.html`) is the Woodward Park record book. "Monte Vista at State" is a section within it. The year strip numbers each "individuals only" cell with its qualifier count, computed from the page's CIF State rows (the Woodward Park data), not from `DATA.ind`, which only holds sub-20:00 runs. It is **regenerated from the CSVs in `source/data/`, not hand-edited**. Rebuild it after each CIF State meet and each Clovis Invitational. The data and table logic are the page's `<script>` block; the rest of the page is the shared header/footer and site styling.

The CSVs are `source/data/mv_cif_state_xc_individuals_1987_2025.csv` and `source/data/mv_woodward_park_all_marks.csv`. **Not in the repo yet:** the script that turns them into the page's `DATA` objects. Until that script is added, a rebuild means producing a new `<script>` block elsewhere and pasting it over the old one. Leave everything outside that block alone.

The pre-site originals, `montevistaxc-mockup.html` (the approved home page design) and `mv-state-history.html`, are in git history: `git show 5ce55d9:montevistaxc-mockup.html`, `git show 5ce55d9:mv-state-history.html`.

**Wording rule:** on this page, State and Woodward Park times are "fastest in school history," never "school record." A 5K course time isn't a ratified school record. The rule doesn't apply to the Records page, which is the school's actual record board, so "School records" in the nav and footer is correct.
