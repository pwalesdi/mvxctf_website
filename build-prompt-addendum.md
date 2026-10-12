# Addendum — paste into Claude Code after the main prompt

Four corrections and additions to what I gave you earlier.

## 1. Athletic.net links

Use these exact URLs wherever the site links to results elsewhere:

- Cross country: `https://www.athletic.net/team/1027/cross-country/2026`
- Track & field: `https://www.athletic.net/team/1027/track-and-field-outdoor/2026`

The year is in the path, so note in README.md that both links need the year bumped each season.

## 2. Remove MileSplit entirely

Drop it from the footer and from the schedule panel on the home page. Athletic.net is the only external results source.

## 3. Build the schedule from a local file first

Don't wire up Google Sheets yet. There's a file in the repo root called `mv-schedule-2026.csv` with the real 2026 cross country schedule in it. Move it to `assets/data/schedule.csv` and have `schedule.js` fetch that path.

Write the fetch so the source is **one constant at the top of the file**, so swapping the local path for a published Google Sheet URL later is a one-line change and nothing else has to move.

### Columns

| Column | Notes |
| --- | --- |
| `date` | YYYY-MM-DD. May be empty — those rows are undated |
| `meet` | Event name |
| `sport` | `XC` or `TF` |
| `level` | All Athletes, Select Athletes, Varsity Athletes, All Parents, All Athletes & Family |
| `location` | Plain text |
| `map_url` | Optional. Makes the location a link |
| `time` | Free text — "7:30 AM", "Boys 7:40 AM, Girls 10:00 AM", "Doors open 3:30 PM" |
| `results_url` | Optional |
| `extra_label` / `extra_url` | An optional second link, e.g. Tickets, Live video, Athletes / heats |
| `notes` | Optional small text under the meet name |

### Rendering

- Split into **Upcoming** and **Completed** against today's date. Rows with an empty `date` go in a third group at the bottom headed "Date to be announced."
- `time` is free text, not a parsed time. Print it as-is.
- Show the results link only when `results_url` is non-empty, and the extra link only when both `extra_label` and `extra_url` are filled.
- Everything else from the main prompt still applies: your own quote-aware CSV parser, escape every value, graceful failure message pointing at Athletic.net.

## 4. Two data problems to leave alone but surface

Three results links point at 2025 dates even though the meets are 2026 — De La Salle, EBAL, and NCS all link to last season's diablotiming pages. The CIF link is also a 2025 URL. Don't try to guess the 2026 URLs. Render them as given and add a line to README.md listing the four rows that need their results links updated.

Picture Day has no date yet. That's the row that exercises the undated group — make sure it renders sensibly rather than at the top of the list or with "Invalid Date" in it.
