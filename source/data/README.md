# Cross Country Records source data

Four lines in the `<script>` of `cross-country-records.html` hold the page's data: `const DATA = …;`, `const M = …;`, `const T = …;` and `const WP = …;`. They are generated from the CSVs in this folder by `source/build_xc_records.py`. Don't hand-edit those four lines: change the CSVs and regenerate. The rest of the page (the headline numbers, the footnotes, the table code) is ordinary hand-written HTML and JavaScript.

| File | What it holds |
| --- | --- |
| `mv_cif_state_xc_individuals.csv` | Every Monte Vista individual run at CIF State, 1987–2025, with `source`: where each result came from |
| `mv_woodward_park_all_marks.csv` | Every Monte Vista 5K mark at Woodward Park (CIF State, Clovis, Rough Rider, NXR), the State runs included |
| `mv_cif_state_xc_team_places.csv` | Monte Vista's team place at each CIF State meet where it scored as a team (`year, gender, division, place`) |
| `mv_cif_state_xc_qualifiers.csv` | Every Monte Vista CIF State qualifier, one row per athlete per year (`year, gender, name, grade`). The Years at State strip and the multiple-year qualifiers come from this file, not from the results. Through 2025 it is exactly the athletes who ran at State (it was generated from the Woodward Park file's State rows, and the page didn't change); 2026 holds the fourteen who qualified at NCS, before the State meet |

These are public race results. GitHub Pages serves this folder, so they are publicly downloadable.

## Running the generator

From the repo root, with Python 3 (standard library only; nothing to install):

    python3 source/build_xc_records.py --check   # do the page's four lines match the CSVs?
    python3 source/build_xc_records.py --write   # rewrite the four lines in cross-country-records.html
    python3 source/build_xc_records.py           # print the four lines

`--check` says OK and exits 0 when the page matches, or prints a record-by-record diff and exits 1. `--write` changes only those four lines. After any change to these CSVs, run `--write`, then `--check`, then look at the page locally (see the top of the main README).

A data problem stops the generator with exit status 2 and a message naming the file and line. It never fills in a missing value. It stops when:

- a CIF State run is in one of the first two files but not the other, or the two disagree on its time, grade, division or place;
- a State row's `race` isn't "Division I" to "Division V", or a mark has no place;
- a State team has no row in the team places file, or a team places row matches no team;
- a grade it needs is missing: for a State run under 20:00, or for the last qualifying year of an athlete in the multiple-year list (the "Active" rule below needs it);
- a State run is by someone with no qualifier row for that year (same name and gender), or the two rows give different grades;
- an athlete is in the qualifiers file twice for one year;
- a year that has results disagrees with its qualifiers about a team: five or more qualifiers but no team in the results, or a team in the results with fewer than five qualifiers.

## Adding a season

- **A CIF State run goes in both of the first two files.** In the individuals file, one row with its `source`. In the Woodward Park file, one row with `meet_short` "CIF State" and `race` "Division I", "Division II" and so on. The generator pairs the two rows by gender, year and time (then grade).
- **Qualifiers go in when qualifying is settled, at the NCS meet, a week before State**: one row per athlete in `mv_cif_state_xc_qualifiers.csv`, with the name spelled exactly as the results rows will spell it, and the grade. That alone updates the Years at State strip and the multiple-year qualifiers. The results go in after State, and every State run must match a qualifier row. Someone who qualified but didn't run keeps their row: they qualified.
- **Everything the page shows about a State run comes from the Woodward Park row**: name, grade, time, division (from `race`) and place. The individuals file adds `source`: when it contains "(div place computed)", the place was calculated from finish times rather than published, and the page marks it with an asterisk.
- **A State team needs a row in `mv_cif_state_xc_team_places.csv`.** The team place isn't in the other two files.
- **Clovis, Rough Rider and NXR marks go only in the Woodward Park file.**
- **Add new rows at the end of the Woodward Park file.** See the next section.

## The row order of mv_woodward_park_all_marks.csv is load-bearing

Don't re-sort this file. The page lists marks fastest first, and marks with the same time (69 rows in 32 ties today) appear in the same order as their rows in this file. The generator sorts by gender and time only and keeps the file's order for ties; no other column reproduces the order the page has now. Re-sorting the file by year, meet or name silently changes the order of tied marks on the page (sorting it by year moves 24 of them) even though no value changes. `--check` reports it if it happens. Add new rows at the end.

Row order in the individuals file would matter the same way only for two runs in the same year by the same gender with identical times. There are none.

## The rules

What the generator does, in full, so that its output matches the page exactly:

- **State runs under 20:00** (`DATA.ind`): every State run faster than 1200 seconds, boys first, then year, then time.
- **Team or individuals only**: five or more Mustangs in the same division race at one State meet are a team. A runner in a different division's race that year counts as an individual (2015: seven boys in Division I and one in Division III).
- **Team time**: the five fastest times in that race, added and rounded to the second, with a half second going to the even number (Python's `round`: the 2016 Clovis boys' 4914.5 is 4914). The average is that total divided by five, rounded the same way.
- **Years at State** (`DATA.app`), **from the qualifiers file**: every year from the first to the last qualifying year in the data. A gender's year is a team when it has five or more qualifiers, individuals only with one to four, and empty with none. In the data so far, individuals-only years have had at most two qualifiers and team years at least six. The page's strip takes its columns from these years, so a new season needs no edit to the page.
- **Multiple-year qualifiers** (`M`), **from the qualifiers file**: athletes who qualified in two or more seasons, ordered by number of seasons, then first season, then name. **Active** means still in school next season: in grade 12 or below in the season after the latest qualifying year in the data.
- **Everything else comes from the results**: the team table and individual times (`DATA.teams`, `DATA.ind`), the Woodward Park team times (`T`) and marks (`WP`). So in the week between NCS and State the strip and the multiple-year list already include the new season, and the results tables don't yet.
- **Woodward Park team times** (`T`): every Woodward Park race (year, meet, race and gender) with five or more Mustangs, State included, fastest first; equal times in year order.
- **Woodward Park marks** (`WP`): every row of the Woodward Park file, boys first, then time, ties in file order. The page shows the fastest 100.
