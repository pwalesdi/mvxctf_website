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

**Any change to the header or footer must be made in every `.html` page, in the same commit.** That covers: index, schedule, cross-country, track-field, coaches, donate, summer-run, track-field-records, cross-country-records, varsity-letters and varsity-standards. Afterwards, check with:

```sh
grep -c 'class="nav"' *.html      # every page should report 1
```

The top nav is **seven items, and that's the limit**. It's measured to fit without scrolling from 1201px up. "Records" is a dropdown (`assets/js/nav.js`) holding Track & Field Records, Cross Country Records, Track & Field Letter Winners and Track & Field Letter Standards. Above 1200px it opens on hover or click; at 1200px and below, where the nav scrolls sideways, a tap opens it as a band under the nav that pushes the page down. Escape closes it. `summer-run.html` isn't in the nav and marks Cross Country as current. The nav label for the schedule page is just "Schedule"; the page's own heading stays "Schedule & results".

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

## Every season

The Athletic.net links have the year in the path. Bump `2026` in both of them each season:

- `https://www.athletic.net/team/1027/cross-country/2026`
- `https://www.athletic.net/team/1027/track-and-field-outdoor/2026`

They appear in `assets/js/schedule.js` (the `SPORTS` list), in the footer of every page, in the home page's schedule panel, and in the `<noscript>` line on `schedule.html`. To find them all: `grep -rn "athletic.net/team" .`

### Cross Country page (`cross-country.html`)

- **These go stale after the 2026 season.** Update or replace them:
  - Girls, `1-5-6`: "…Makarova fifth, Padilla sixth. **All three return.**"
  - Boys, `4th`: "**Kotamraju returns** after placing fourth in the section as a junior."
- The other figures are tied to seasons ("since 2019", "2013 through 2025", "1984 through 2025", "22 of 37", the State counts) and should be checked each season too. Both the top-line band and "Why Monte Vista" are cross country only.
- **Don't name years for the boys' two NCS team titles in prose.** The source records conflict on the year. (The NCS Championships table on Cross Country Records shows them as the CSV has them, 2007 and 2015; that was a deliberate decision.)

## Records and letters

Both pages render from CSVs, so updating them means editing a CSV. Neither page has a hand-written count or list.

**`assets/data/records.csv`**: `gender, event_group, event_order, event, rank, athlete, mark, year, flag, active`
- `event_group` is shown in the order Sprints, Hurdles, Distance, Relays, Field. Events within a group are sorted by `event_order`.
- `flag` is `w` (wind-aided), `c` (converted mark) or empty, and is shown as a small badge after the mark. Keep the letter out of `mark` itself.
- `active` is `yes` for athletes currently on the roster (for relays: if any leg is current). Those rows get the red tint. **It's set by hand. The page never guesses from names**: the board uses initials and has same-surname athletes (two Rosatis on the girls board; two Daltons, Turners and Wilsons on the boys). Empty for every row until Patrick sends the roster.

**`assets/data/letter-winners.csv`**: `gender, year, athlete, honor`
- Years newest first. Names in file order. Each year's "N athletes" is counted from the rows. Patrick's 2022 girls source is headed "(17)" but lists 19 names, so the page says 19. That's intended.
- A non-empty `honor` shows as a red pill after the name.

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

### Open questions for Patrick

The data is rendered exactly as the CSVs have it. None of this has been changed:

- Girls pole vault "Synder" and boys 1987 4x100 "Martidale". Probably Snyder and Martindale.
- Girls 2006 4x400: "Randall, Zorich Anderson, Stringer". Three names for four runners; a comma is missing.
- 2025 girls letters: "Powell, Arthur", where 2024 has "Powell, Alexandra".
- The `c` flag is assumed to mean "converted mark". Unconfirmed.
- Also spotted while building (not changed): "Giren" (boys 1999 4x400) vs "Giron" elsewhere; "Wily" (boys 300H 2005) vs "Wiley" (110H 2005); "Gebhardt" (girls 2015 DMR) vs "Gebhart"; "De Maio" (boys 2014 4x100) vs "DeMaio"; girls 2016 DMR "Fuhriman, Cervantes, Coney, A, Coney, M" mixes the two name formats.

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
| `coaches.html` | Coach names, bios, emails (currently points at the team parent) |
| `donate.html` | Check drop-off, what the donation pays for, corporate matching details. The $600 / check / webstore / no-cash wording is done. |
| `summer-run.html` | Dates, meeting place, sign-up |
| `schedule.html` | Works. The home page's "Past seasons & results archive (2020–2025)" link also points here, and there is no archive yet. |

## Cross Country Records

`cross-country-records.html` (formerly `state-history.html`) is the Woodward Park record book. "Monte Vista at State" is a section within it. The year strip numbers each "individuals only" cell with its qualifier count, computed from the page's CIF State rows (the Woodward Park data), not from `DATA.ind`, which only holds sub-20:00 runs. It is **regenerated from the CSVs in `source/data/`, not hand-edited**. Rebuild it after each CIF State meet and each Clovis Invitational. The data and table logic are the page's `<script>` block; the rest of the page is the shared header/footer and site styling.

The CSVs are `source/data/mv_cif_state_xc_individuals_1987_2025.csv` and `source/data/mv_woodward_park_all_marks.csv`. **Not in the repo yet:** the script that turns them into the page's `DATA` objects. Until that script is added, a rebuild means producing a new `<script>` block elsewhere and pasting it over the old one. Leave everything outside that block alone.

The pre-site originals, `montevistaxc-mockup.html` (the approved home page design) and `mv-state-history.html`, are in git history: `git show 5ce55d9:montevistaxc-mockup.html`, `git show 5ce55d9:mv-state-history.html`.

**Wording rule:** on this page, State and Woodward Park times are "fastest in school history," never "school record." A 5K course time isn't a ratified school record. The rule doesn't apply to the Records page, which is the school's actual record board, so "School records" in the nav and footer is correct.
