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
| `montevistaxc-mockup.html` | The approved single-page design. Reference only; nothing links to it. |
| `CNAME` | Custom domain for GitHub Pages. |
| `.nojekyll` | Stops GitHub from running Jekyll over the site. |

Fonts load from Google Fonts: Archivo (display), Source Serif 4 (body) and Space Mono (numbers and times, as `var(--mono)` / `.mono`).

## The header and footer are duplicated. Change them together.

Static HTML has no includes, so every page carries its own copy of the site header (logo + nav) and footer. The copies are identical except for which nav link has `aria-current="page"`.

**Any change to the header or footer must be made in every `.html` page, in the same commit.** That covers: index, schedule, state-history, cross-country, track-field, coaches, records, donate and summer-run. Afterwards, check with:

```sh
grep -c 'class="nav"' *.html      # every page should report 1
```

`state-history.html` marks **Cross Country** as current, not itself.

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

Only `http`/`https` links are rendered, and every value is HTML-escaped. If the CSV can't be loaded, the page says so and links to Athletic.net.

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
| `state-history.html` | **Placeholder.** The finished record book (`mv-state-history.html`) wasn't in the repo when this was built. See "State history" below. |
| `cross-country.html` | Program overview and season information |
| `track-field.html` | Program overview, season and event-group information |
| `coaches.html` | Coach names, bios, emails (currently points at the team parent) |
| `records.html` | School records and the varsity letter winners list (the old site had a separate `/varsity-letter-winners` page; links to it now go here) |
| `donate.html` | Check drop-off, what the donation pays for, corporate matching details. The $600 / check / webstore / no-cash wording is done. |
| `summer-run.html` | Dates, meeting place, sign-up |
| `schedule.html` | Works. The home page's "Past seasons & results archive (2020–2025)" link also points here, and there is no archive yet. |

## State history

`state-history.html` is supposed to be the "Monte Vista at State" record book, built from `mv-state-history.html`. When it arrives:

1. Keep its data and table logic untouched.
2. Wrap it in the shared header and footer (nav: Cross Country current), keep `<html data-theme="light">` (the page is light-only), and link `assets/css/site.css`.
3. Map its tokens to the site's: `--red` → `#C0102A`, `--red-ink` → `#A20D23`, `--paper` → the site surface `#F6F3F1`, `--ink` → `#16110F`. Anton headings → Archivo 800 at ~76% width, uppercase, same sizes. Space Mono stays (already in `site.css` as `--mono`).
4. Move shared rules into `site.css`. Leave only the year strip, podium list, qualifier groups and chips in a page `<style>` block.

Wording rule: that page says "fastest in school history," never "school record." Keep it that way in anything added to the site.
