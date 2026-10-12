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
| `assets/js/schedule.js` | Loads the meet schedule CSV and renders `schedule.html` and the "Next" row on the home page. One parser, used by both. |
| `assets/data/schedule.csv` | The 2026 schedule while it lives in the repo (see below). |
| `assets/img/` | Logo and hero photo (downloaded from Wix). |
| `assets/docs/clearance-guide.pdf` | Home Campus step-by-step guide (downloaded from the old Wix site). |
| `source/montevistaxc-mockup.html` | The approved single-page design. Reference only; nothing links to it. Note that GitHub Pages serves everything in the repo, so it is publicly reachable at `/source/montevistaxc-mockup.html`. |
| `.nojekyll` | Stops GitHub from running Jekyll over the site. |

Fonts load from Google Fonts: Archivo (display), Source Serif 4 (body) and Space Mono (numbers and times, as `var(--mono)` / `.mono`).

`site.css` sections, top to bottom: the mockup's styles; additions (numeric face, former inline styles, interior pages, the schedule table and its phone card layout); then the record-book components that came from the State history page (`.mast`, `.stats`, `.seg` pill controls, `.pill`, `.notes`, and `.ledger` for dense data tables). Only the State page's year strip, podium, qualifier groups and chips stay in that page's own `<style>` block.

## The header and footer are duplicated. Change them together.

Static HTML has no includes, so every page carries its own copy of the site header (logo + nav) and footer. The copies are identical except for which nav link has `aria-current="page"`.

**Any change to the header or footer must be made in every `.html` page, in the same commit.** That covers: index, schedule, state-history, cross-country, track-field, coaches, records, donate and summer-run. Afterwards, check with:

```sh
grep -c 'class="nav"' *.html      # every page should report 1
```

`state-history.html` marks **Cross Country** as current, not itself. The nav label for the schedule page is just "Schedule"; the page's own heading stays "Schedule & results".

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

## Unfinished pages

| Page | Missing |
| --- | --- |
| `cross-country.html` | Program overview and season information |
| `track-field.html` | Program overview, season and event-group information |
| `coaches.html` | Coach names, bios, emails (currently points at the team parent) |
| `records.html` | School records and the varsity letter winners list (the old site had a separate `/varsity-letter-winners` page; links to it now go here) |
| `donate.html` | Check drop-off, what the donation pays for, corporate matching details. The $600 / check / webstore / no-cash wording is done. |
| `summer-run.html` | Dates, meeting place, sign-up |
| `schedule.html` | Works. The home page's "Past seasons & results archive (2020–2025)" link also points here, and there is no archive yet. |

## State history

`state-history.html` is the "Monte Vista at State" record book (originally `mv-state-history.html`). Its data and table logic are the original `<script>` block, unchanged. Edit data there, not in the markup. The page is light-only (`<html data-theme="light">`).

**Wording rule:** on this page, State and Woodward Park times are "fastest in school history," never "school record." A 5K course time isn't a ratified school record. The rule doesn't apply to the Records page, which is the school's actual record board, so "School records" in the nav and footer is correct.
