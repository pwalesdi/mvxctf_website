/* Monte Vista schedule.
   Reads the published Google Sheet CSV and renders it into
   #schedule-app (schedule.html) and #next-meet (index.html).
   No dependencies — plain browser JavaScript. */
(function () {
  "use strict";

  /* ===================================================================
     SCHEDULE SOURCE — the one line to change.
     Now: the local file in the repo.
     Later: the published Google Sheet CSV URL
     (File → Share → Publish to web → tab → Comma-separated values),
     e.g. "https://docs.google.com/spreadsheets/d/e/2PACX-.../pub?gid=0&single=true&output=csv"
     =================================================================== */
  var SHEET_CSV_URL = "assets/data/schedule.csv";

  // Athletic.net team pages. The year is in the path — bump each season.
  var SPORTS = [
    { key: "XC", label: "Cross Country", results: "https://www.athletic.net/team/1027/cross-country/2026" },
    { key: "TF", label: "Track & Field", results: "https://www.athletic.net/team/1027/track-and-field-outdoor/2026" }
  ];

  // Aug–Dec is cross country season; the rest of the year is track.
  function seasonSport() { return new Date().getMonth() >= 7 ? "XC" : "TF"; }

  /* ---------- CSV ---------- */

  // RFC 4180: quoted fields may contain commas, newlines and "" for a quote.
  function parseCSV(text) {
    var rows = [], row = [], field = "", i = 0, inQuotes = false, c;
    if (text.charCodeAt(0) === 0xfeff) i = 1; // BOM
    for (; i < text.length; i++) {
      c = text[i];
      if (inQuotes) {
        if (c === '"') {
          if (text[i + 1] === '"') { field += '"'; i++; }
          else inQuotes = false;
        } else field += c;
      } else if (c === '"') {
        inQuotes = true;
      } else if (c === ",") {
        row.push(field); field = "";
      } else if (c === "\n" || c === "\r") {
        if (c === "\r" && text[i + 1] === "\n") i++;
        row.push(field); rows.push(row); row = []; field = "";
      } else field += c;
    }
    if (field !== "" || row.length) { row.push(field); rows.push(row); }
    return rows;
  }

  // Rows → objects keyed by lower-case header name, so column order
  // in the sheet doesn't matter.
  function toRecords(rows) {
    if (!rows.length) throw new Error("empty CSV");
    var head = rows[0].map(function (h) { return h.trim().toLowerCase(); });
    if (head.indexOf("date") < 0 || head.indexOf("meet") < 0) {
      throw new Error("CSV is missing date/meet columns");
    }
    var out = [];
    for (var r = 1; r < rows.length; r++) {
      var rec = {}, blank = true;
      for (var k = 0; k < head.length; k++) {
        rec[head[k]] = (rows[r][k] || "").trim();
        if (rec[head[k]]) blank = false;
      }
      if (!blank && rec.meet) out.push(rec);
    }
    return out;
  }

  /* ---------- values ---------- */

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  // Only http(s) links from the sheet are rendered; anything else is dropped.
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

  function formatDate(key) {
    if (!key) return "TBD";
    var p = key.split("-");
    return new Date(+p[0], +p[1] - 1, +p[2])
      .toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  }

  function sportKey(s) {
    s = (s || "").toUpperCase().replace(/[^A-Z]/g, "");
    if (s === "XC" || s.indexOf("CROSS") === 0) return "XC";
    if (s === "TF" || s.indexOf("TRACK") === 0) return "TF";
    return s;
  }

  // Sorted ascending by date; undated rows go last.
  function prepare(records) {
    var meets = records.map(function (r) {
      return { r: r, key: dateKey(r.date), sport: sportKey(r.sport) };
    });
    meets.sort(function (a, b) {
      if (a.key === b.key) return 0;
      if (!a.key) return 1;
      if (!b.key) return -1;
      return a.key < b.key ? -1 : 1;
    });
    return meets;
  }

  function loadMeets() {
    var ctrl = "AbortController" in window ? new AbortController() : null;
    var timer = ctrl && setTimeout(function () { ctrl.abort(); }, 15000);
    return fetch(SHEET_CSV_URL, { cache: "no-store", signal: ctrl ? ctrl.signal : undefined })
      .then(function (res) {
        if (!res.ok) throw new Error("HTTP " + res.status);
        return res.text();
      })
      .then(function (text) {
        if (timer) clearTimeout(timer);
        return prepare(toRecords(parseCSV(text)));
      });
  }

  /* ---------- schedule.html ---------- */

  function rowHTML(m) {
    var r = m.r, links = [];
    if (safeUrl(r.results_url)) links.push(link(r.results_url, "Results"));
    if (r.extra_label && safeUrl(r.extra_url)) links.push(link(r.extra_url, r.extra_label));
    return "<tr>" +
      '<td class="day">' + esc(formatDate(m.key)) + "</td>" +
      "<td>" + esc(r.meet) + (r.notes ? '<span class="note">' + esc(r.notes) + "</span>" : "") + "</td>" +
      "<td>" + (r.location ? link(r.map_url, r.location) : "") + "</td>" +
      "<td>" + esc(r.level) + "</td>" +
      '<td class="time">' + esc(r.time) + "</td>" +
      '<td class="links">' + links.join("") + "</td>" +
      "</tr>";
  }

  function blockHTML(title, list, sportLabel) {
    var body = list.length
      ? '<div class="panel"><div class="table-scroll"><table class="sched">' +
        '<thead><tr><th scope="col">Date</th><th scope="col">Meet</th><th scope="col">Location</th>' +
        '<th scope="col">Level</th><th scope="col">Time</th><th scope="col">Links</th></tr></thead>' +
        "<tbody>" + list.map(rowHTML).join("") + "</tbody></table></div></div>"
      : '<p class="sched-status">No ' + esc(title.toLowerCase()) + " " + esc(sportLabel.toLowerCase()) + " meets.</p>";
    return '<div class="sched-block"><h2>' + esc(title) + "</h2>" + body + "</div>";
  }

  function renderSchedule(app, meets) {
    var current = seasonSport();
    var today = todayKey();

    function draw() {
      var sport = SPORTS.filter(function (s) { return s.key === current; })[0];
      var mine = meets.filter(function (m) { return m.sport === current; });
      var upcoming = mine.filter(function (m) { return m.key && m.key >= today; });
      var completed = mine.filter(function (m) { return m.key && m.key < today; });
      var undated = mine.filter(function (m) { return !m.key; });
      var seg = '<div class="seg" role="group" aria-label="Sport">' + SPORTS.map(function (s) {
        return '<button type="button" data-sport="' + s.key + '" aria-pressed="' + (s.key === current) + '">' + esc(s.label) + "</button>";
      }).join("") + "</div>";
      app.innerHTML = seg + blockHTML("Upcoming", upcoming, sport.label) + blockHTML("Completed", completed, sport.label) +
        (undated.length ? blockHTML("Date to be announced", undated, sport.label) : "");
    }

    app.addEventListener("click", function (e) {
      var b = e.target.closest("button[data-sport]");
      if (!b || b.getAttribute("data-sport") === current) return;
      current = b.getAttribute("data-sport");
      draw();
      var nb = app.querySelector('button[data-sport="' + current + '"]');
      if (nb) nb.focus();
    });
    draw();
  }

  function renderError(app) {
    var sport = SPORTS.filter(function (s) { return s.key === seasonSport(); })[0];
    app.innerHTML = '<p class="sched-status">The schedule couldn’t load. See the full schedule on <a href="' +
      esc(sport.results) + '">Athletic.net</a>.</p>';
  }

  /* ---------- index.html ---------- */

  function renderNextMeet(li, meets) {
    var today = todayKey();
    var next = meets.filter(function (m) { return m.key && m.key >= today; })[0];
    if (!next) { li.parentNode.removeChild(li); return; }
    li.querySelector(".t").innerHTML = "Next: " + esc(next.r.meet);
    li.querySelector(".m").innerHTML = esc(formatDate(next.key));
  }

  /* ---------- boot ---------- */

  var app = document.getElementById("schedule-app");
  var nextLi = document.getElementById("next-meet");
  if (!app && !nextLi) return;

  loadMeets().then(function (meets) {
    if (app) renderSchedule(app, meets);
    if (nextLi) renderNextMeet(nextLi, meets);
  }).catch(function () {
    if (app) renderError(app);
    if (nextLi && nextLi.parentNode) nextLi.parentNode.removeChild(nextLi);
  });
})();
