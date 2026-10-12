# montevistaxc.com

Static site for Monte Vista High School cross country and track & field, hosted on GitHub Pages. Plain HTML, CSS and JavaScript. There is no build step and nothing to install.

## Run it locally

```sh
cd mvxctf_website
python3 -m http.server 8000
```

Open <http://localhost:8000/>. Use the server, not `file://`: the schedule is fetched with `fetch()`, and browsers block that from `file://` pages.

## Where things live

| Path | What it is |
| --- | --- |
| `assets/css/site.css` | **The design system.** Colors, type, spacing and every component. The top part is the approved mockup's `<style>` block copied unchanged; additions are below the marked line. Don't put inline `style=""` attributes in pages. Add a class here instead. |
| `assets/js/csv.js` | **The one CSV parser.** Also fetch-with-timeout and HTML escaping. Every data page loads it first; don't write another parser. |
| `assets/js/schedule.js` | Renders `schedule.html` and the "Next" row on the home page from the schedule CSV. |
| `assets/js/records.js` | Renders `track-field-records.html` from `assets/data/records.csv`. |
| `assets/js/ebal-distance.js` | Renders `ebal-distance.html` (EBAL distance points) from `assets/data/ebal-distance.csv`. |
| `assets/js/ncs.js` | Renders the NCS Championships table on `cross-country-records.html` from `assets/data/ncs-championships.csv`. |
| `assets/js/nav.js` | The Records dropdown in the header. Loaded on every page. |
| `assets/js/letters.js` | Renders `varsity-letters.html` from `assets/data/letter-winners.csv`. |
| `assets/data/schedule.csv` | The 2026 schedule while it lives in the repo (see below). |
| `assets/data/records.csv`, `assets/data/letter-winners.csv`, `assets/data/varsity-standards.csv` | School records, varsity letter winners and letter standards (see "Records and letters"). |
| `assets/js/standards.js` | Renders `varsity-standards.html` from `assets/data/varsity-standards.csv`. |
| `assets/img/` | Logo, hero photo, and team photos (see "Photos"). |
| `assets/docs/clearance-guide.pdf` | Home Campus step-by-step guide (downloaded from the old Wix site). |
| `source/data/` | The CSVs that `cross-country-records.html` is regenerated from (see "Cross Country Records"). Served publicly like everything else in the repo. |
| `.nojekyll` | Stops GitHub from running Jekyll over the site. |

**Light only.** The site has no dark mode; every colour is defined once on `:root`. Don't add a `prefers-color-scheme` block.

Tables that can be wider than the screen sit in `.table-scroll`, which shows a soft shadow on the right edge while there's more to scroll. It's CSS-only (`background-attachment: local` / `scroll`). Row tints in tables are translucent so the shadow shows through them.

Fonts load from Google Fonts: Archivo (display), Source Serif 4 (body) and Space Mono (numbers and times, as `var(--mono)` / `.mono`).

`site.css` sections, top to bottom: the mockup's styles; additions (numeric face, former inline styles, interior pages, the schedule table and its phone card layout); then the record-book components that came from the State history page (`.mast`, `.stats`, `.seg` pill controls, `.pill`, `.notes`, and `.ledger` for dense data tables). Only the State page's year strip, podium, qualifier groups and chips stay in that page's own `<style>` block.

## The header and footer are duplicated. Change them together.

Static HTML has no includes, so every page carries its own copy of the site header (logo + nav) and footer. The copies are identical except for which nav item is marked current: a top-level link gets `aria-current="page"`; on the four records pages, the Records button gets `class="nav-dd-btn is-current"` and the matching link inside its menu gets `aria-current="page"`.

**Any change to the header or footer must be made in every `.html` page, in the same commit.** That covers: index, schedule, cross-country, track-field, coaches, donate, summer-run, track-field-records, cross-country-records, varsity-letters, varsity-standards and ebal-distance. Afterwards, check with:

```sh
grep -c 'class="nav"' *.html      # every page should report 1
```

The top nav is **seven items, and that's the limit**. It's measured to fit without scrolling from 1201px up. "Records" is a dropdown (`assets/js/nav.js`) holding Track & Field Records, Cross Country Records, Track & Field Letter Winners, Track & Field Letter Standards and EBAL distance points. Above 1200px it opens on hover or click; at 1200px and below, where the nav scrolls sideways, a tap opens it as a band under the nav that pushes the page down. Escape closes it. `summer-run.html` isn't in the nav and marks Cross Country as current. The nav label for the schedule page is just "Schedule"; the page's own heading stays "Schedule & results".

## The schedule

`schedule.js` fetches one CSV from the URL in the constant at the top of the file:

```js
var SHEET_CSV_URL = "assets/data/schedule.csv";
```

To move to Google Sheets, publish the sheet (File → Share → Publish to web → the tab → Comma-separated values) and replace that one string with the published URL, which looks like `https://docs.google.com/spreadsheets/d/e/2PACX-.../pub?gid=0&single=true&output=csv`. Nothing else changes. Google caches published CSVs, so edits can take a few minutes to show up. Anyone with the link can read a published sheet, so keep phone numbers and addresses out of it.

**Sheet URL:** not published yet.

### Columns

Columns are matched by header name, so their order doesn't matter. Header names must match exactly (case is ignored).

| Column | Notes |
| --- | --- |
| `date` | `YYYY-MM-DD` (`M/D/YYYY` also accepted). Leave empty if not set: the row goes under "Date to be announced." |
| `meet` | Event name. Rows without one are skipped. Commas are fine. |
| `sport` | `XC` or `TF` (drives the sport toggle) |
| `level` | All Athletes, Select Athletes, Varsity Athletes, All Parents, All Athletes & Family |
| `location` | Plain text |
| `map_url` | Optional. Makes the location a link. |
| `time` | Free text, printed as-is ("7:30 AM", "Boys 7:40 AM, Girls 10:00 AM") |
| `results_url` | Optional. Shows a "Results" link. |
| `extra_label` / `extra_url` | Optional second link (Tickets, Live video…). Shown only when both are filled. |
| `notes` | Optional small text under the meet name |

Only `http`/`https` links are rendered, and every value is HTML-escaped. If the CSV can't be loaded, the page says so and links to Athletic.net. Below 640px the table becomes one card per meet (meet name as the heading, empty fields hidden, short dates).

### Data to fix

These rows link to **2025** results pages even though the meets are 2026. They are rendered as given; update `results_url` when the 2026 pages exist:

- 2026-09-19 Nike De La Salle Invitational: `diablotiming.com/results/2025-09-20/`
- 2026-11-07 EBAL Championships: `diablotiming.com/results/2025-11-08/`
- 2026-11-21 NCS Championships: `diablotiming.com/results/2025-11-22/`
- 2026-11-28 CIF State Championships: `rtspt.com/events/cif/xc2025/`

Picture Day has no date yet.

## Post-season checklist

Several parts of the site go stale on a fixed yearly cycle. Work through the relevant list after each season. Every change below is to a file in this repo. Afterwards, run the site locally (see the top of this file), click through the pages you touched, and check nothing says "couldn't load".

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
5. **Head coach bio**: `coaches.html`. Running cross country totals: "42 different athletes … 72 State races", NCS and State results, Clovis marks.
6. **Roster highlights on the records board**: `assets/data/records.csv`, column `active`. Set `yes` for athletes now on the roster (relays: if any leg is current), clear graduates. Set it by hand. The page never matches names, because the board uses initials and has same-surname athletes.

### After each track season (late May / June)

1. **Varsity letter winners**: `assets/data/letter-winners.csv`. Add a row per athlete for the new year (`gender, year, athlete, honor`), in the order you want them listed. The page counts the rows itself.
2. **Athlete of the year honors**: same file, `honor` column ("Track Athlete of the Year", "Field Athlete of the Year"). They show as red pills.
3. **School records**: `assets/data/records.csv`. Insert new marks, re-number `rank` within each event, and keep `event_order` as is. Flags go in `flag` (`w` wind-aided, `c` converted), never in `mark`. Set `active` as above.
4. **EBAL distance points**: `assets/data/ebal-distance.csv`. Add one row per scoring place (top six) for the 800m, 1600m, 3200m and 4x800, girls and boys, with `points` 10-8-6-4-2-1. Use `program` "Carondelet / De La Salle" for those two schools, otherwise the school name. The page's year range and totals update themselves.
5. **Varsity standards for next year**: `assets/data/varsity-standards.csv`, plus the eyebrow "Track & Field · 2026" in `varsity-standards.html`. Once EBAL publishes the new qualifying marks: standard = (3 × average of the last three years' EBAL 7th-place marks + EBAL qualifying standard) / 4. That's the 3:1 weighting, used from the 2027 standards on; the published 2026 standards used 2:1 and stay as published. Field marks are rounded to the nearest half inch (`28' 6"`, `15' 6.5"`). Working files: `source/data/MV_Varsity_Standards.*`, `ebal-2026-seventh-place.csv`, `varsity-standards-2027-DRAFT.csv`. These are git-ignored and not published until final.
6. **Head coach bio, track section**: `coaches.html`. Meet of Champions and Tri-Valley titles and counts ("19 … titles", the two title lists), EBAL and NCS team results, "77 All-NCS honors … 31 different athletes".

### Every year, before the new season

1. **Athletic.net links**: the year is in the path of both: `https://www.athletic.net/team/1027/cross-country/2026` and `https://www.athletic.net/team/1027/track-and-field-outdoor/2026`. They're in the footer of **every page** (change all pages in one commit, as with any header or footer change), the home page's schedule panel, the `<noscript>` line on `schedule.html`, and `assets/js/schedule.js` (`SPORTS`). Find them all with `grep -rn "athletic.net/team" .`
2. **Schedule**: replace `assets/data/schedule.csv` with the new season (same columns), or point `SHEET_CSV_URL` in `assets/js/schedule.js` at the published Google Sheet. Check that every `results_url` points at the new season's results.
3. **Home page season text**: `index.html`. The hero "2026 Cross Country", the "2026 pre-season" practice line, "2026 cross country schedule & results", the "Printable season schedule" Google Doc link, and the "Past seasons & results archive 2020–2025" label.
4. **Coach bio year counts**: `coaches.html`. Head coach "ninth season", Spilker "8th year", Graham "40th year", Williams "4th season". Add 1 to each.

## Records and letters

Both pages render from CSVs, so updating them means editing a CSV. Neither page has a hand-written count or list.

**`assets/data/records.csv`**: `gender, event_group, event_order, event, rank, athlete, mark, year, flag, active`
- `event_group` is shown in the order Sprints, Hurdles, Distance, Relays, Field. Events within a group are sorted by `event_order`.
- `flag` is `w` (wind-aided), `c` (converted mark) or empty, and is shown as a small badge after the mark. Keep the letter out of `mark` itself.
- `active` is `yes` for athletes currently on the roster (for relays: if any leg is current). Those rows get the red tint. **It's set by hand. The page never guesses from names**: the board uses initials and has same-surname athletes (two Rosatis on the girls board; two Daltons, Turners and Wilsons on the boys). Empty for every row until Patrick sends the roster.

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

## Photos

Every photo in `assets/img/` is at most 1600px on the long edge, JPEG quality 82, with **all metadata stripped**. Two of the phone originals carried GPS coordinates; `sips` keeps those when it converts, so it isn't safe to use on its own. The full-size originals are outside the repo, in `~/Developer/mvxctf_website_photo_originals/`.

Dates in a filename come from the camera's capture time (Pacific). Files with only a year had no camera data, so their date is unreliable. Names come from the original filenames plus what's visible; nobody has been identified beyond what the original filename said. None of these are on a page yet. When one is placed, give its `<img>` `loading="lazy"` (every image except the hero and the header logo) plus `width`/`height` attributes, so the page only fetches what the visitor scrolls to.

| File | What it shows |
| --- | --- |
| `2022-ncs-xc-girls-champions.jpg` | Girls XC team with the 2022 NCS D2 championship plaque at the NCS backdrop |
| `2021-11-06-xc-girls-race-start.jpg` | Girls XC race start, Mustangs at the front |
| `2019-11-09-xc-girls.jpg` | Girls XC runners walking on a dirt course area |
| `2019-11-23-xc-team-photo.jpg` | XC team photo under the "Monte Vista Cross Country" tent banner |
| `2019-xc-girls-group.jpg` | Seven girls in team kit, arms crossed, in a park (iPhone export; date uncertain) |
| `2022-cif-state-xc-ethan-miller.jpg` | Boys XC race; filename says Ethan Miller at CIF State 2022 |
| `2019-05-18-track-kelli-wilson.jpg` | Girls distance race on the track; filename says Kelli Wilson |
| `2022-track-ebal-binder-pogue.jpg` | Girls distance race; filename says Binder and Pogue at EBAL |
| `2022-track-ebal-finals-team.jpg` | Large track team photo in the stands area; filename says EBAL finals 2022 |
| `2023-05-05-track-ebal-ethan-miller.jpg` | Boy on the track (portrait); filename says Ethan Miller at EBAL |
| `2022-track-jack-loughery.jpg` | Boy running on the track (portrait); filename says Jack Loughery |
| `2022-track-caden-honda.jpg` | Three boys sprinting; Caden Honda |
| `2022-04-23-track-hurdles.jpg` | Wide shot of a hurdles race with a full grandstand |
| `2022-04-08-track-arcadia-peters.jpg` | Girl finishing a race, "Finish on…" banner; filename says Peters at Arcadia |
| `2022-04-23-track-shot-put-rosati.jpg` | Shot put throw; filename says Rosati |
| `2022-track-pole-vault-wong.jpg` | Girl on a pole vault runway (portrait); filename says Wong |
| `2022-05-28-cif-state-track-wright.jpg` | Hurdles finish, athlete flexing; filename says Wright at CIF State |
| `2022-track-coach-graham.jpg` | Coach and athlete on the infield; filename says Coach Graham |
| `2022-track-coach-graham-pole-vault.jpg` | Pole vault coaching on the infield; filename says D. Graham |
| `2022-track-coach-wales-dinan.jpg` | Coach in a plaid shirt and cap trackside; filename says Wales-Dinan |
| `ncs-logo.png` | CIF North Coast Section logo (PNG, transparent background) |

## Unfinished pages

| Page | Missing |
| --- | --- |
| `track-field.html` | Program overview, season and event-group information |
| `coaches.html` | **Year counts are hardcoded and need bumping every season:** head coach "ninth season", Spilker "8th year", Graham "40th year", Williams "4th season". |
| `coaches.html` | Coach bios still needed: Edd Williams, Craig Rothstein, Kinsey Pogue (they show name and title only, by design, until then). |
| `coaches.html` | A contact method for the coaching staff is still undecided. No email addresses on the page. |
| `donate.html` | Check drop-off, what the donation pays for, corporate matching details. The $600 / check / webstore / no-cash wording is done. |
| `summer-run.html` | Dates, meeting place, sign-up |
| `schedule.html` | Works. The home page's "Past seasons & results archive (2020–2025)" link also points here, and there is no archive yet. |

## Cross Country Records

`cross-country-records.html` (formerly `state-history.html`) is the Woodward Park record book. "Monte Vista at State" is a section within it. The year strip numbers each "individuals only" cell with its qualifier count, computed from the page's CIF State rows (the Woodward Park data), not from `DATA.ind`, which only holds sub-20:00 runs. It is **regenerated from the CSVs in `source/data/`, not hand-edited**. Rebuild it after each CIF State meet and each Clovis Invitational. The data and table logic are the page's `<script>` block; the rest of the page is the shared header/footer and site styling.

The CSVs are `source/data/mv_cif_state_xc_individuals_1987_2025.csv` and `source/data/mv_woodward_park_all_marks.csv`. **Not in the repo yet:** the script that turns them into the page's `DATA` objects. Until that script is added, a rebuild means producing a new `<script>` block elsewhere and pasting it over the old one. Leave everything outside that block alone.

The pre-site originals, `montevistaxc-mockup.html` (the approved home page design) and `mv-state-history.html`, are in git history: `git show 5ce55d9:montevistaxc-mockup.html`, `git show 5ce55d9:mv-state-history.html`.

**Wording rule:** on this page, State and Woodward Park times are "fastest in school history," never "school record." A 5K course time isn't a ratified school record. The rule doesn't apply to the Records page, which is the school's actual record board, so "School records" in the nav and footer is correct.
