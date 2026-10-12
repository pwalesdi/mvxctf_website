/* Results archive (results-archive.html).
   Reads assets/data/results-archive.csv: one row per archived file, with
   season, date, meet, group, label, path, source_url. Renders seasons newest
   first, meets in date order. Rows with a group ("events", "races") are listed
   under a collapsible "Event results" / "Race results" for that meet.
   Each meet gets an id (m-YYYY-MM-DD-meet-name) so the schedule can link
   straight to it. Paths are relative to the site root. Needs csv.js first. */
(function () {
  "use strict";

  var DATA_URL = "assets/data/results-archive.csv";
  var app = document.getElementById("archive-app");
  if (!app) return;
  function fail() { app.innerHTML = '<p class="count">The results archive couldn’t load. Try again later.</p>'; }
  if (!window.MVCSV) { fail(); return; }
  var esc = window.MVCSV.esc;

  function seasonTitle(s) {
    var m = /^(\d{4})-(track|xc)(-spring)?$/.exec(s);
    if (!m) return s;
    return m[1] + (m[3] ? " spring" : "") + (m[2] === "xc" ? " Cross Country" : " Track & Field");
  }
  function slug(s) { return s.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); }
  function fmt(d) {
    var p = d.split("-");
    return new Date(+p[0], +p[1] - 1, +p[2]).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }
  // Relative paths only (the site may live at a domain root or under a project path).
  function rel(p) { return /^[a-z0-9][\w\-\/.]*$/i.test(p) && p.indexOf("..") < 0 ? p : null; }
  function a(r) { var p = rel(r.path); return p ? '<a href="' + esc(p) + '">' + esc(r.label) + "</a>" : ""; }

  function render(records) {
    var seasons = {}, order = [];
    records.forEach(function (r) {
      if (!seasons[r.season]) { seasons[r.season] = {}; order.push(r.season); }
      var k = r.date + "|" + r.meet, s = seasons[r.season];
      (s[k] = s[k] || { date: r.date, meet: r.meet, files: [], groups: {} });
      if (r.group) (s[k].groups[r.group] = s[k].groups[r.group] || []).push(r); else s[k].files.push(r);
    });
    // Newest season first; within a year, cross country (fall) before track (spring).
    order.sort(function (x, y) {
      var rank = function (s) { return s.slice(0, 4) + (s.indexOf("xc") > 0 && s.indexOf("spring") < 0 ? "3" : s.indexOf("track") > 0 ? "2" : "1"); };
      return rank(y) < rank(x) ? -1 : 1;
    });
    return order.map(function (s) {
      var meets = Object.keys(seasons[s]).map(function (k) { return seasons[s][k]; })
        .sort(function (x, y) { return x.date < y.date ? -1 : x.date > y.date ? 1 : 0; });
      return '<section class="arch-season" aria-labelledby="s-' + esc(s) + '"><h2 id="s-' + esc(s) + '">' + esc(seasonTitle(s)) + "</h2><ul class=\"arch-list\">" +
        meets.map(function (m) {
          var groups = Object.keys(m.groups).map(function (g) {
            var list = m.groups[g];
            return '<details><summary>' + (g === "races" ? "Race results" : "Event results") + " (" + list.length + ")</summary><ul>" +
              list.map(function (r) { return "<li>" + a(r) + "</li>"; }).join("") + "</ul></details>";
          }).join("");
          return '<li id="m-' + esc(m.date + "-" + slug(m.meet)) + '"><span class="d mono">' + esc(fmt(m.date)) + '</span><span class="n">' + esc(m.meet) + "</span>" +
            '<span class="f">' + m.files.map(a).join("") + groups + "</span></li>";
        }).join("") + "</ul></section>";
    }).join("");
  }

  window.MVCSV.load(DATA_URL, ["season", "date", "meet", "label", "path"])
    .then(function (records) {
      app.innerHTML = render(records);
      // A link like results-archive.html#m-2026-09-19-woodbridge-invitational opens that meet.
      var t = location.hash && document.getElementById(location.hash.slice(1));
      if (t) { Array.prototype.forEach.call(t.querySelectorAll("details"), function (d) { d.open = true; }); t.scrollIntoView(); }
    })
    .catch(fail);
})();
