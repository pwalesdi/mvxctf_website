/* Monte Vista schedule, season by season.
   schedule.html: a Season selector over assets/data/seasons.csv; each season's
   meets come from assets/data/schedule-<season id>.csv. The page URL carries the
   season (schedule.html?season=2024-xc), so Back works and a season can be
   shared; no parameter means the current season.
   index.html: the "Next" row (#next-meet), from the current season, and under
   it the latest "New" update among upcoming meets (#next-update), if any.
   Needs assets/js/csv.js loaded first. */
(function () {
  "use strict";

  /* ===================================================================
     CURRENT SEASON — the one line to change each season.
     Its file is the only schedule that changes; past seasons are frozen.
     Also mark it "yes" in the current column of assets/data/seasons.csv.
     =================================================================== */
  var CURRENT_SEASON = "2026-xc";

  /* The season the home page shows (hero photos and headline), shared with the
     hero as window.MVSeason = { id, sport: "xc" | "track", year, fromDate }.
     Normally it's CURRENT_SEASON's own sport and year, so the front page follows
     the schedule's switch. Backstop for a constant nobody updated: once today is
     more than STALE_AFTER_DAYS past the end of the season it names (November 30
     for cross country, July 31 for track), the front page goes by the date
     instead: August to November is cross country, December to July is track
     (named for the year it ends in), and the console says so. The schedule page
     itself always uses CURRENT_SEASON, since its file is the data that exists. */
  var STALE_AFTER_DAYS = 30; // a month's grace after a season ends, for the rollover
  window.MVSeason = frontPageSeason(CURRENT_SEASON, new Date());

  function frontPageSeason(id, now) {
    var mo = now.getMonth() + 1, y = now.getFullYear();
    var byDate = { id: id, sport: mo >= 8 && mo <= 11 ? "xc" : "track", year: mo === 12 ? y + 1 : y, fromDate: true };
    var m = /^(\d{4})-(xc|track)(-|$)/.exec(id); // "2026-xc", "2027-track", "2021-xc-spring"
    if (!m) return byDate;
    var year = +m[1], sport = m[2];
    // Stale from the first day more than STALE_AFTER_DAYS after the season's last day
    // (with 30: from December 31 for cross country, from August 31 for track).
    var staleFrom = sport === "xc" ? new Date(year, 11, 1 + STALE_AFTER_DAYS) : new Date(year, 7, 1 + STALE_AFTER_DAYS);
    if (now >= staleFrom) {
      console.warn("CURRENT_SEASON \"" + id + "\" ended more than " + STALE_AFTER_DAYS + " days ago, so the home page follows the date (" +
        byDate.year + " " + (byDate.sport === "xc" ? "cross country" : "track") + ") until it's updated.");
      return byDate;
    }
    return { id: id, sport: sport, year: year, fromDate: false };
  }

  /* "Just updated" flag: a current-season row with both update_note and
     update_date shows a red "New" pill and the note for this many days,
     counting update_date as day 1, then drops off by itself. */
  var UPDATE_DAYS = 7;

  // Optional: the current season from a published Google Sheet CSV instead of
  // its file (File → Share → Publish to web → the tab → CSV). Empty = the file.
  var CURRENT_SHEET_URL = "";

  function seasonUrl(id) {
    return id === CURRENT_SEASON && CURRENT_SHEET_URL ? CURRENT_SHEET_URL : "/assets/data/schedule-" + id + ".csv";
  }
  var SEASONS_URL = "/assets/data/seasons.csv";
  var CANONICAL_BASE = "https://montevistaxc.com/schedule.html";

  // Athletic.net team pages, used only as the fallback when a file can't load.
  var ATHLETIC = {
    XC: "https://www.athletic.net/team/1027/cross-country/2026",
    TF: "https://www.athletic.net/team/1027/track-and-field-outdoor/2026"
  };

  var app0 = document.getElementById("schedule-app"), next0 = document.getElementById("next-meet");
  if (!window.MVCSV) {
    if (app0) app0.innerHTML = '<p class="sched-status">The schedule couldn’t load. See the full schedule on <a href="' + ATHLETIC.XC + '">Athletic.net</a>.</p>';
    if (next0) next0.parentNode.removeChild(next0);
    return;
  }
  var esc = window.MVCSV.esc;

  /* ---------- values ---------- */

  // Only http(s) links from the files are rendered (relative paths resolve
  // against the page, so archived copies work at any base path).
  function safeUrl(u) {
    if (!u) return null;
    try {
      var url = new URL(u, window.location.href);
      return url.protocol === "http:" || url.protocol === "https:" ? url.href : null;
    } catch (e) { return null; }
  }

  function link(href, text) {
    var u = safeUrl(href);
    return u ? '<a href="' + esc(u) + '">' + esc(text) + "</a>" : esc(text);
  }

  // Accepts YYYY-MM-DD and M/D/YYYY (Sheets sometimes reformats dates).
  // Returns a sortable "YYYY-MM-DD" key, or "" if missing/unreadable.
  function dateKey(s) {
    var m = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(s), y, mo, d;
    if (m) { y = m[1]; mo = m[2]; d = m[3]; }
    else if ((m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(s))) { y = m[3]; mo = m[1]; d = m[2]; }
    else return "";
    return y + "-" + ("0" + mo).slice(-2) + "-" + ("0" + d).slice(-2);
  }

  function todayKey() {
    var t = new Date();
    return t.getFullYear() + "-" + ("0" + (t.getMonth() + 1)).slice(-2) + "-" + ("0" + t.getDate()).slice(-2);
  }

  // Whole days from a "YYYY-MM-DD" key to today: 0 = today, negative = future.
  function daysAgo(key) {
    var a = key.split("-"), b = todayKey().split("-");
    return Math.round((Date.UTC(+b[0], +b[1] - 1, +b[2]) - Date.UTC(+a[0], +a[1] - 1, +a[2])) / 864e5);
  }

  // The one rule for the "New" flag, used by the schedule page and the home
  // page alike: a current-season row's update counts while update_note is set
  // and update_date is 0 to UPDATE_DAYS - 1 days ago. Returns its date key, or
  // "" if it doesn't count. A future or unreadable update_date is a data
  // error: never shown, and reported in the browser console.
  function activeUpdate(r) {
    if (!r.update_date) return "";
    var key = dateKey(r.update_date), age = key ? daysAgo(key) : NaN;
    if (!(age >= 0)) {
      console.warn("schedule-" + CURRENT_SEASON + ".csv: update_date \"" + r.update_date + "\" for \"" + r.meet + "\" is " +
        (key ? "in the future" : "not a date") + ", so its update isn't shown.");
      return "";
    }
    return r.update_note && age < UPDATE_DAYS ? key : "";
  }

  var NEW_PILL = '<span class="pill new">New</span>';

  // The flag on a schedule-page row, or "".
  function updateHTML(r) {
    return activeUpdate(r) ? '<span class="sched-new">' + NEW_PILL + " " + esc(r.update_note) + "</span>" : "";
  }

  function formatDate(key) {
    if (!key) return "TBD";
    var p = key.split("-");
    return new Date(+p[0], +p[1] - 1, +p[2])
      .toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  }

  // Sorted ascending by date; undated rows go last.
  function prepare(records) {
    var meets = records.filter(function (r) { return r.meet; }).map(function (r) {
      return { r: r, key: dateKey(r.date) };
    });
    meets.sort(function (a, b) {
      if (a.key === b.key) return 0;
      if (!a.key) return 1;
      if (!b.key) return -1;
      return a.key < b.key ? -1 : 1;
    });
    return meets;
  }

  function loadMeets(id) {
    return window.MVCSV.load(seasonUrl(id), ["date", "meet"]).then(prepare);
  }

  /* ---------- schedule.html ---------- */

  // full = the current season: all its columns and the "New" flag; past seasons
  // drop Level and Time and never show the flag, whatever their file says.
  // A Results link shows only once the meet has happened (today counts), whatever
  // the file says, so a stale link can't pass off last year's results as this
  // year's. Undated meets haven't happened either.
  function rowHTML(m, full) {
    var r = m.r, links = [], flag = full ? updateHTML(r) : "";
    if (m.key && m.key <= todayKey() && safeUrl(r.results_url)) links.push(link(r.results_url, "Results"));
    if (r.extra_label && safeUrl(r.extra_url)) links.push(link(r.extra_url, r.extra_label));
    return (flag ? '<tr class="is-new">' : "<tr>") +
      // data-label feeds the stacked phone layout; the date has a long
      // (desktop) and short (phone) form, toggled in CSS.
      '<td class="day" data-label="Date"><span class="d-long">' + esc(formatDate(m.key)) +
        '</span><span class="d-short">' + esc(formatDate(m.key).replace(",", "")) + "</span></td>" +
      '<td class="event" data-label="Meet">' + esc(r.meet) + flag + (r.notes ? '<span class="note">' + esc(r.notes) + "</span>" : "") + "</td>" +
      '<td data-label="Location">' + (r.location ? link(r.map_url, r.location) : "") + "</td>" +
      (full ? '<td data-label="Level">' + esc(r.level) + "</td>" +
        '<td class="time" data-label="Time">' + esc(r.time) + "</td>" : "") +
      '<td class="links" data-label="Links">' + (links.length ? "<span>" + links.join("") + "</span>" : "") + "</td>" +
      "</tr>";
  }

  function blockHTML(title, list, empty, full) {
    var body = list.length
      ? '<div class="panel sched-panel"><div class="table-scroll"><table class="sched">' +
        '<thead><tr><th scope="col">Date</th><th scope="col">Meet</th><th scope="col">Location</th>' +
        (full ? '<th scope="col">Level</th><th scope="col">Time</th>' : "") + '<th scope="col">Links</th></tr></thead>' +
        "<tbody>" + list.map(function (m) { return rowHTML(m, full); }).join("") + "</tbody></table></div></div>"
      : '<p class="sched-status">' + esc(empty) + "</p>";
    return '<div class="sched-block">' + (title ? "<h2>" + esc(title) + "</h2>" : "") + body + "</div>";
  }

  function seasonParam() {
    try { return new URL(window.location.href).searchParams.get("season") || ""; } catch (e) { return ""; }
  }

  function startSchedule(app) {
    window.MVCSV.load(SEASONS_URL, ["id", "label"]).then(function (seasons) {
      seasons.sort(function (a, b) { return (+a.sort || 0) - (+b.sort || 0); });
      var byId = {};
      seasons.forEach(function (s) { byId[s.id] = s; });
      if (!byId[CURRENT_SEASON]) throw new Error("current season missing from seasons.csv");

      app.innerHTML =
        '<div class="season-pick"><label for="season-select">Season</label>' +
        '<select id="season-select">' + seasons.map(function (s) {
          return '<option value="' + esc(s.id) + '">' + esc(s.label) + "</option>";
        }).join("") + "</select></div>" +
        '<p class="season-note" id="season-note" hidden></p><div id="season-body"></div>';
      var select = document.getElementById("season-select");
      var note = document.getElementById("season-note");
      var body = document.getElementById("season-body");
      var eyebrow = document.querySelector(".sec-head .eyebrow");
      var canonical = document.querySelector('link[rel="canonical"]');
      var shown = null;

      function wanted() { var p = seasonParam(); return byId[p] ? p : CURRENT_SEASON; }

      function show(id) {
        shown = id;
        var s = byId[id];
        select.value = id;
        if (eyebrow) eyebrow.textContent = id === CURRENT_SEASON ? "This season" : "Past season";
        // Each past season is its own page to search engines (sitemap.xml lists
        // them): its own title and canonical address.
        document.title = (id === CURRENT_SEASON ? "Meet Schedule and Results" : s.label + " Schedule and Results") +
          " | Monte Vista Cross Country and Track & Field";
        if (canonical) canonical.href = CANONICAL_BASE + (id === CURRENT_SEASON ? "" : "?season=" + encodeURIComponent(id));
        note.textContent = s.note || "";
        note.hidden = !s.note;
        body.innerHTML = '<p class="sched-status">Loading schedule…</p>';
        loadMeets(id).then(function (meets) {
          if (shown !== id) return; // a later choice won the race
          if (id === CURRENT_SEASON) {
            var today = todayKey();
            var upcoming = meets.filter(function (m) { return m.key && m.key >= today; });
            var completed = meets.filter(function (m) { return m.key && m.key < today; });
            var undated = meets.filter(function (m) { return !m.key; });
            body.innerHTML = blockHTML("Upcoming", upcoming, "No upcoming meets.", true) +
              blockHTML("Completed", completed, "No completed meets yet.", true) +
              (undated.length ? blockHTML("Date to be announced", undated, "", true) : "");
          } else {
            // A past season is complete: one list, no Upcoming/Completed split.
            // Date, meet, location and links only.
            body.innerHTML = blockHTML("", meets, "No meets listed for this season.", false);
          }
        }).catch(function () {
          if (shown !== id) return;
          body.innerHTML = '<p class="sched-status">This season couldn’t load. See the <a href="/results-archive.html">results archive</a> or <a href="' +
            esc(ATHLETIC[s.sport] || ATHLETIC.XC) + '">Athletic.net</a>.</p>';
        });
      }

      select.addEventListener("change", function () {
        var id = select.value;
        var url = new URL(window.location.href);
        if (id === CURRENT_SEASON) url.searchParams.delete("season"); else url.searchParams.set("season", id);
        history.pushState({ season: id }, "", url.pathname + url.search + url.hash);
        show(id);
      });
      window.addEventListener("popstate", function () { show(wanted()); });
      show(wanted());
    }).catch(function () {
      app.innerHTML = '<p class="sched-status">The schedule couldn’t load. See the full schedule on <a href="' + ATHLETIC.XC + '">Athletic.net</a>.</p>';
    });
  }

  /* ---------- index.html ---------- */

  function renderNextMeet(li, meets) {
    var today = todayKey();
    var next = meets.filter(function (m) { return m.key && m.key >= today; })[0];
    if (!next) { li.parentNode.removeChild(li); return; }
    li.querySelector(".t").innerHTML = "Next: " + esc(next.r.meet);
    li.querySelector(".m").innerHTML = esc(formatDate(next.key));
  }

  // The home page's "New" row, inserted right under the next-meet line: the
  // single most recent active update among upcoming meets (a tie goes to the
  // sooner meet), linking straight to what changed: the row's extra link, or
  // the season page if it has none. Nothing at all when there's no update.
  function renderUpdate(li, meets) {
    var today = todayKey(), best = null, bestKey = "";
    meets.forEach(function (m) {
      if (!m.key || m.key < today) return;
      var key = activeUpdate(m.r);
      if (key && key > bestKey) { best = m.r; bestKey = key; }
    });
    if (!best) return;
    var href = best.extra_label ? safeUrl(best.extra_url) : null;
    var kind = !href ? "Season page" : /\.pdf($|[?#])/i.test(href) ? "PDF" : best.extra_label;
    var row = document.createElement("li");
    row.id = "next-update";
    row.className = "is-new";
    row.innerHTML = '<a href="' + esc(href || "/schedule.html") + '"><span class="t">' + NEW_PILL + " " +
      esc(best.meet) + ": " + esc(best.update_note) + '</span><span class="m">' + esc(kind) + "</span></a>";
    li.parentNode.insertBefore(row, li.nextSibling);
  }

  /* ---------- boot ---------- */

  if (app0) startSchedule(app0);
  if (next0) {
    loadMeets(CURRENT_SEASON).then(function (meets) { renderUpdate(next0, meets); renderNextMeet(next0, meets); })
      .catch(function () { if (next0.parentNode) next0.parentNode.removeChild(next0); });
  }
})();
