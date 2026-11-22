#!/usr/bin/env python3
"""Build the data block of cross-country-records.html from the CSVs in source/data/.

The page's <script> holds four generated lines: `const DATA = ...;`, `const M = ...;`,
`const T = ...;` and `const WP = ...;`. This script rebuilds them from the CSVs.

    python3 source/build_xc_records.py --check   compare with the page; exit 0 if identical, 1 if not
    python3 source/build_xc_records.py --write   replace the four lines in the page
    python3 source/build_xc_records.py           print the four lines

Standard library only. Run it from anywhere. The inputs, the rules and the errors are
described in source/data/README.md. A data problem stops it with exit status 2 and a
message naming the file and line; it never fills in a missing value.
"""
import argparse
import collections
import csv
import difflib
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = ROOT / "source" / "data"
PAGE = ROOT / "cross-country-records.html"
STATE_CSV = DATA_DIR / "mv_cif_state_xc_individuals.csv"
WOODWARD_CSV = DATA_DIR / "mv_woodward_park_all_marks.csv"
TEAM_PLACES_CSV = DATA_DIR / "mv_cif_state_xc_team_places.csv"

STATE_MEET = "CIF State"            # meet_short of the CIF State rows in the Woodward Park file
DIVISIONS = {"Division I": 1, "Division II": 2, "Division III": 3, "Division IV": 4, "Division V": 5}
COMPUTED = "(div place computed)"   # in the State file's `source`: the place is calculated, shown with *
SUB_20 = 1200.0                     # DATA.ind holds the State runs faster than 20:00
TEAM_MIN = 5                        # five finishers in one race make a team score
GENDERS = ("Boys", "Girls")
INDENT = {"DATA": "", "M": "  ", "T": "  ", "WP": "  "}  # each line's indentation in the page
LINE = re.compile(r"^(\s*)const (DATA|M|T|WP) = (.*);$")


class DataError(Exception):
    pass


def read_csv(path, columns):
    """Rows of a CSV as (line number, dict), after checking the columns are there."""
    if not path.exists():
        raise DataError(f"{path.relative_to(ROOT)} is missing")
    with path.open(newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        missing = [c for c in columns if c not in (reader.fieldnames or [])]
        if missing:
            raise DataError(f"{path.name}: missing column(s) {', '.join(missing)}")
        return [(n, row) for n, row in enumerate(reader, start=2)]


def whole(value, what, where):
    """A whole number written as "12" or "12.0" (the CSVs use both)."""
    try:
        f = float(value)
    except ValueError:
        raise DataError(f"{where}: {what} is {value!r}, not a number") from None
    if not f.is_integer():
        raise DataError(f"{where}: {what} is {value!r}, not a whole number")
    return int(f)


def seconds(value, where):
    try:
        return float(value)
    except ValueError:
        raise DataError(f"{where}: time_seconds is {value!r}, not a number") from None


def gender(value, where):
    if value not in GENDERS:
        raise DataError(f"{where}: gender is {value!r}, expected Boys or Girls")
    return value


def boys_first(g):
    return g != "Boys"


def clock(total):
    """Whole seconds as h:mm:ss (an hour or more) or m:ss."""
    if total >= 3600:
        return f"{total // 3600}:{total % 3600 // 60:02d}:{total % 60:02d}"
    return f"{total // 60}:{total % 60:02d}"


def team_score(times):
    """The five fastest times (already in time order): total rounded half-to-even, and the average.

    round() is Python's, which rounds .5 to the even number: the 2016 Clovis boys' 4914.5 is 4914.
    """
    total = round(sum(times[:TEAM_MIN]))
    return total, clock(total), clock(round(total / TEAM_MIN))


def state_runs(state_rows, wood_rows):
    """Every CIF State run, built from the Woodward Park file's State row, paired with its State-file row.

    The page shows the Woodward Park row's name, grade, time, race and place. The State file adds
    `source`, which marks a calculated place. Each run must be in both files, and the two must agree.
    """
    pool = collections.defaultdict(list)
    for n, w in wood_rows:
        if w["meet_short"] == STATE_MEET:
            where = f"{WOODWARD_CSV.name} line {n}"
            key = (gender(w["gender"], where), whole(w["year"], "year", where), seconds(w["time_seconds"], where))
            pool[key].append((n, w))
    used, runs, problems = set(), [], []
    for n, s in state_rows:
        where = f"{STATE_CSV.name} line {n}"
        g, y = gender(s["gender"], where), whole(s["year"], "year", where)
        grade = whole(s["grade"], "grade", where) if s["grade"].strip() else None
        cands = [c for c in pool[(g, y, seconds(s["time_seconds"], where))] if c[0] not in used]
        if len(cands) > 1:
            cands = [c for c in cands if c[1]["grade"].strip() and grade is not None
                     and whole(c[1]["grade"], "grade", f"{WOODWARD_CSV.name} line {c[0]}") == grade] or cands
        if len(cands) > 1:
            cands = [c for c in cands if c[1]["name"] == s["name"]]
        if len(cands) != 1:
            raise DataError(f"{where}: {s['year']} {g} {s['time']} has {'no' if not cands else 'more than one'} "
                            f"matching CIF State row in {WOODWARD_CSV.name} (paired by gender, year and time)")
        wn, w = cands[0]
        used.add(wn)
        wwhere = f"{WOODWARD_CSV.name} line {wn}"
        if w["race"] not in DIVISIONS:
            raise DataError(f"{wwhere}: race {w['race']!r} isn't a CIF State division ({', '.join(DIVISIONS)})")
        if not w["place"].strip():
            raise DataError(f"{wwhere}: place is empty")
        run = {
            "g": g, "y": y, "n": w["name"],
            "gr": whole(w["grade"], "grade", wwhere) if w["grade"].strip() else None,
            "t": w["time"], "ts": seconds(w["time_seconds"], wwhere),
            "div": DIVISIONS[w["race"]], "pl": whole(w["place"], "place", wwhere),
            "calc": COMPUTED in s["source"], "where": wwhere,
        }
        if s["time"] != w["time"]:
            problems.append(f"{where} and {wwhere}: time {s['time']!r} vs {w['time']!r}")
        if grade is not None and run["gr"] is not None and grade != run["gr"]:
            problems.append(f"{where} and {wwhere}: grade {grade} vs {run['gr']}")
        if s["division"].strip() and whole(s["division"], "division", where) != run["div"]:
            problems.append(f"{where} and {wwhere}: division {s['division']} vs race {w['race']!r}")
        if s["place_div"].strip() and whole(s["place_div"], "place_div", where) != run["pl"]:
            problems.append(f"{where} and {wwhere}: place {s['place_div']} vs {w['place']}")
        runs.append(run)
    if problems:
        raise DataError("the State and Woodward Park files disagree:\n  " + "\n  ".join(problems))
    extra = [n for rows in pool.values() for n, _ in rows if n not in used]
    if extra:
        raise DataError(f"{WOODWARD_CSV.name} line(s) {', '.join(map(str, sorted(extra)))}: CIF State row(s) "
                        f"with no matching row in {STATE_CSV.name}")
    # Boys first, then year, then time. Equal times in one year keep the State file's order.
    runs.sort(key=lambda r: (boys_first(r["g"]), r["y"], r["ts"]))
    return runs


def build(state_rows, wood_rows, place_rows):
    runs = state_runs(state_rows, wood_rows)
    first, last = min(r["y"] for r in runs), max(r["y"] for r in runs)

    # DATA.ind: every State run under 20:00.
    ind = []
    for r in runs:
        if r["ts"] < SUB_20:
            if r["gr"] is None:
                raise DataError(f"{r['where']}: {r['n']}'s {r['y']} State run has no grade (needed for the times list)")
            ind.append({"g": r["g"], "y": r["y"], "n": r["n"], "gr": r["gr"], "t": r["t"], "ts": r["ts"],
                        "div": r["div"], "pl": r["pl"], "calc": r["calc"]})

    # DATA.teams: five or more Mustangs in one division race at one State meet. A runner in a
    # different division's race that year is an individual, not part of the team.
    places = {}
    for n, p in place_rows:
        where = f"{TEAM_PLACES_CSV.name} line {n}"
        key = (gender(p["gender"], where), whole(p["year"], "year", where), whole(p["division"], "division", where))
        if key in places:
            raise DataError(f"{where}: a second place for {key[1]} {key[0]} division {key[2]}")
        places[key] = (whole(p["place"], "place", where), n)
    groups = collections.OrderedDict()
    for r in runs:
        groups.setdefault((r["g"], r["y"], r["div"]), []).append(r)
    teams, matched = [], set()
    for (g, y, div), rows in groups.items():
        if len(rows) < TEAM_MIN:
            continue
        if any(t["g"] == g and t["y"] == y for t in teams):
            raise DataError(f"{y} {g}: teams in two division races at one State meet; the page allows one")
        if (g, y, div) not in places:
            raise DataError(f"{TEAM_PLACES_CSV.name}: no place for the {y} {g} team (division {div}, "
                            f"{len(rows)} runners)")
        matched.add((g, y, div))
        total, tt, avg = team_score([r["ts"] for r in rows])
        teams.append({"g": g, "y": y, "div": div, "place": places[(g, y, div)][0],
                      "calc": any(r["calc"] for r in rows), "tt": tt, "ts": total, "avg": avg,
                      "top": [r["n"] for r in rows[:TEAM_MIN]]})
    for key in places:
        if key not in matched:
            raise DataError(f"{TEAM_PLACES_CSV.name} line {places[key][1]}: no {key[1]} {key[0]} team in "
                            f"division {key[2]} (fewer than {TEAM_MIN} runners in that race)")
    teams.sort(key=lambda t: (boys_first(t["g"]), t["y"]))

    # DATA.app: one entry per gender per year, first to last State year in the data.
    team_years = {(t["g"], t["y"]) for t in teams}
    run_years = {(r["g"], r["y"]) for r in runs}
    app = {f"{g}{y}": "team" if (g, y) in team_years else "ind" if (g, y) in run_years else ""
           for g in ("Girls", "Boys") for y in range(first, last + 1)}

    # M: State runs (any time) in two or more seasons. Active: still in school next season.
    athletes = collections.OrderedDict()
    for r in runs:
        athletes.setdefault((r["n"], r["g"]), []).append(r)
    multi = []
    for (name, g), rows in athletes.items():
        years = sorted({r["y"] for r in rows})
        if len(years) < 2:
            continue
        latest = max(rows, key=lambda r: r["y"])
        if latest["gr"] is None:
            raise DataError(f"{latest['where']}: can't work out whether {name} is active: their last State "
                            f"year, {latest['y']}, has no grade")
        multi.append({"n": name, "g": g, "ys": years, "active": latest["gr"] + (last + 1 - latest["y"]) <= 12})
    multi.sort(key=lambda m: (-len(m["ys"]), m["ys"][0], m["n"]))

    # T: every Woodward Park race with five or more Mustangs (State included).
    races = collections.OrderedDict()
    for n, w in wood_rows:
        where = f"{WOODWARD_CSV.name} line {n}"
        races.setdefault((whole(w["year"], "year", where), w["meet_short"], w["race"],
                          gender(w["gender"], where)), []).append((seconds(w["time_seconds"], where), w))
    team_times = []
    for (y, meet, race, g), rows in races.items():
        if len(rows) < TEAM_MIN:
            continue
        rows = sorted(rows, key=lambda x: x[0])
        total, tt, avg = team_score([ts for ts, _ in rows])
        team_times.append({"y": y, "m": meet, "race": race, "g": g, "tt": tt, "ts": total, "avg": avg,
                           "n": len(rows), "top": [w["name"] for _, w in rows[:TEAM_MIN]]})
    team_times.sort(key=lambda t: (t["ts"], t["y"]))

    # WP: every Woodward Park mark. Boys first, then time; equal times keep the file's row order.
    marks = []
    for n, w in wood_rows:
        where = f"{WOODWARD_CSV.name} line {n}"
        if not w["place"].strip():
            raise DataError(f"{where}: place is empty")
        marks.append({"g": gender(w["gender"], where), "y": whole(w["year"], "year", where), "n": w["name"],
                      "gr": whole(w["grade"], "grade", where) if w["grade"].strip() else None,
                      "t": w["time"], "ts": seconds(w["time_seconds"], where), "m": w["meet_short"],
                      "race": w["race"], "pl": whole(w["place"], "place", where)})
    marks.sort(key=lambda m: (boys_first(m["g"]), m["ts"]))

    return {"DATA": {"teams": teams, "ind": ind, "app": app}, "M": multi, "T": team_times, "WP": marks}


def generate():
    state = read_csv(STATE_CSV, ["year", "gender", "division", "place_div", "grade", "time", "time_seconds",
                                 "name", "source"])
    wood = read_csv(WOODWARD_CSV, ["year", "meet_short", "race", "gender", "name", "grade", "time",
                                   "time_seconds", "place"])
    places = read_csv(TEAM_PLACES_CSV, ["year", "gender", "division", "place"])
    data = build(state, wood, places)
    return {k: f"{INDENT[k]}const {k} = {json.dumps(v)};" for k, v in data.items()}


def page_lines():
    text = PAGE.read_text(encoding="utf-8")
    lines = text.split("\n")
    where = {}
    for i, line in enumerate(lines):
        m = LINE.match(line)
        if m:
            if m.group(2) in where:
                raise DataError(f"{PAGE.name}: two `const {m.group(2)} =` lines ({where[m.group(2)] + 1} and {i + 1})")
            where[m.group(2)] = i
    missing = [k for k in INDENT if k not in where]
    if missing:
        raise DataError(f"{PAGE.name}: no `const {missing[0]} = ...;` line to compare or replace")
    return lines, where


def pretty(line):
    """One array per record, for a readable diff when a line differs."""
    m = LINE.match(line)
    try:
        return json.dumps(json.loads(m.group(3)), indent=1).split("\n")
    except (AttributeError, ValueError):
        return [line]


def main(argv=None):
    ap = argparse.ArgumentParser(description="Build the data block of cross-country-records.html from source/data/.")
    mode = ap.add_mutually_exclusive_group()
    mode.add_argument("--check", action="store_true", help="compare with the page; exit 1 if anything differs")
    mode.add_argument("--write", action="store_true", help="replace the four lines in the page")
    args = ap.parse_args(argv)
    try:
        new = generate()
        if not (args.check or args.write):
            print("\n".join(new[k] for k in INDENT))
            return 0
        lines, where = page_lines()
    except DataError as e:
        print(f"error: {e}", file=sys.stderr)
        return 2
    changed = [k for k in INDENT if lines[where[k]] != new[k]]
    if args.check:
        if not changed:
            print(f"OK: {PAGE.name} matches the CSVs (DATA, M, T and WP are identical).")
            return 0
        for k in changed:
            old, cur = pretty(lines[where[k]]), pretty(new[k])
            if old == cur:
                print(f"{k} (line {where[k] + 1}): same values, different formatting")
            else:
                sys.stdout.writelines(line + "\n" for line in difflib.unified_diff(
                    old, cur, f"{k} in {PAGE.name} (line {where[k] + 1})", f"{k} from the CSVs", lineterm=""))
        print(f"DIFFERENT: {', '.join(changed)} in {PAGE.name} don't match the CSVs.")
        return 1
    if not changed:
        print(f"{PAGE.name} is already up to date.")
        return 0
    for k in changed:
        lines[where[k]] = new[k]
    PAGE.write_text("\n".join(lines), encoding="utf-8")
    print(f"Rewrote {', '.join(changed)} in {PAGE.name}.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
