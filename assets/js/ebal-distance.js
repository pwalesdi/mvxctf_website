/* EBAL distance points (track-field-records.html#ebal-distance).
   Reads assets/data/ebal-distance.csv: one row per scoring place, with the
   points it earned (the 10-8-6-4-2-1 weights live in the data, not here).
   `program` groups schools that share a row (Carondelet girls + De La Salle
   boys). Interactions, as in the original component: sort by girls, boys or
   combined total; year columns show girls or boys; select a school to
   expand its points by event and year. Needs assets/js/csv.js first. */
(function () {
  "use strict";

  var DATA_URL = "assets/data/ebal-distance.csv";
  var OURS = "Monte Vista";

  var app = document.getElementById("ebal-app");
  if (!app) return;
  function fail() { app.innerHTML = '<p class="count">The EBAL points couldn’t load. Try again later.</p>'; }
  if (!window.MVCSV) { fail(); return; }
  var esc = window.MVCSV.esc;

  function uniq(list) { var o = []; list.forEach(function (x) { if (o.indexOf(x) < 0) o.push(x); }); return o; }
  function show(n) { return n > 0 ? String(n) : "—"; }

  function build(rows) {
    rows.forEach(function (r) { r.points = +r.points || 0; r.year = +r.year; r.place = +r.place; });
    var years = uniq(rows.map(function (r) { return r.year; })).sort();
    var events = uniq(rows.map(function (r) { return r.event; }));
    var programs = uniq(rows.map(function (r) { return r.program; }));
    // tally[program][gender][year|"total"] and ev[program][gender][event][year]
    var tally = {}, ev = {};
    programs.forEach(function (p) {
      tally[p] = { Girls: { total: 0 }, Boys: { total: 0 } };
      ev[p] = { Girls: {}, Boys: {} };
    });
    rows.forEach(function (r) {
      var t = tally[r.program][r.gender];
      t[r.year] = (t[r.year] || 0) + r.points;
      t.total += r.points;
      var e = ev[r.program][r.gender][r.event] = ev[r.program][r.gender][r.event] || {};
      e[r.year] = (e[r.year] || 0) + r.points;
    });
    // Scoring and footnotes come from the data too.
    var weights = uniq(rows.slice().sort(function (a, b) { return a.place - b.place; })
      .map(function (r) { return r.place + ":" + r.points; })).map(function (s) { return s.split(":")[1]; });
    var missing = [];
    events.forEach(function (e) {
      years.forEach(function (y) {
        if (!rows.some(function (r) { return r.event === e && r.year === y; })) missing.push("No " + e + " in " + y);
      });
    });
    var merged = programs.filter(function (p) {
      return rows.some(function (r) { return r.program === p && r.school !== p; });
    }).map(function (p) {
      var parts = [];
      rows.forEach(function (r) { if (r.program === p) { var s = r.school + " (" + r.gender.toLowerCase() + ")"; if (parts.indexOf(s) < 0) parts.push(s); } });
      return parts.join(" and ") + " share a row";
    });
    return { years: years, events: events, programs: programs, tally: tally, ev: ev, weights: weights, missing: missing, merged: merged };
  }

  function seg(label, key, options, current) {
    return '<span class="seg-label">' + esc(label) + '</span><div class="seg" role="group" aria-label="' + esc(label) + '">' +
      options.map(function (o) {
        return '<button type="button" data-' + key + '="' + o[0] + '" aria-pressed="' + (o[0] === current) + '">' + esc(o[1]) + "</button>";
      }).join("") + "</div>";
  }

  function detailHTML(d, p) {
    var g = d.tally[p].Girls, b = d.tally[p].Boys;
    var head = "<tr><th scope=\"col\">Girls / boys</th>" + d.years.map(function (y) { return '<th scope="col" class="num">' + y + "</th>"; }).join("") + '<th scope="col" class="num">All-time</th></tr>';
    var evRows = d.events.filter(function (e) {
      return d.years.some(function (y) { return ((d.ev[p].Girls[e] || {})[y] || 0) + ((d.ev[p].Boys[e] || {})[y] || 0) > 0; });
    }).map(function (e) {
      return '<tr><th scope="row">' + esc(e) + "</th>" + d.years.map(function (y) {
        var gp = (d.ev[p].Girls[e] || {})[y] || 0, bp = (d.ev[p].Boys[e] || {})[y] || 0;
        return '<td class="mono num">' + (gp || bp ? show(gp) + " / " + show(bp) : "—") + "</td>";
      }).join("") + "<td></td></tr>";
    }).join("");
    function totalRow(label, fn, all) {
      return '<tr class="sum"><th scope="row">' + label + "</th>" + d.years.map(function (y) { return '<td class="mono num">' + show(fn(y)) + "</td>"; }).join("") +
        '<td class="mono num">' + show(all) + "</td></tr>";
    }
    return '<table class="ledger ebal-detail"><thead>' + head + "</thead><tbody>" + evRows +
      totalRow("Girls total", function (y) { return g[y] || 0; }, g.total) +
      totalRow("Boys total", function (y) { return b[y] || 0; }, b.total) +
      totalRow("Combined", function (y) { return (g[y] || 0) + (b[y] || 0); }, g.total + b.total) +
      "</tbody></table>";
  }

  function mount(rows) {
    var d = build(rows);
    var sortMode = "combined", view = "girls", expanded = null;
    var tot = function (p, gender) { return d.tally[p][gender].total; };

    function draw() {
      var list = d.programs.filter(function (p) { return tot(p, "Girls") + tot(p, "Boys") > 0; })
        .map(function (p, i) { return { p: p, i: i }; })
        .sort(function (a, b) {
          var ga = tot(a.p, "Girls"), gb = tot(b.p, "Girls"), ba = tot(a.p, "Boys"), bb = tot(b.p, "Boys");
          var diff = sortMode === "girls" ? gb - ga : sortMode === "boys" ? bb - ba : (gb + bb) - (ga + ba);
          return diff || a.i - b.i;
        }).map(function (x) { return x.p; });
      var gender = view === "girls" ? "Girls" : "Boys";
      var cols = d.years.length + 4;
      var body = list.map(function (p, i) {
        var g = tot(p, "Girls"), b = tot(p, "Boys"), open = expanded === p, id = "ebal-d-" + i;
        var row = '<tr class="ebal-row' + (open ? " open" : "") + (p === OURS ? " ours" : "") + '" data-p="' + esc(p) + '">' +
          '<th scope="row"><button type="button" class="row-toggle" aria-expanded="' + open + '" aria-controls="' + id + '">' + esc(p) + "</button></th>" +
          d.years.map(function (y) { return '<td class="mono num">' + show(d.tally[p][gender][y] || 0) + "</td>"; }).join("") +
          '<td class="mono num col-sep">' + show(g) + '</td><td class="mono num">' + show(b) + '</td><td class="mono num col-sep comb">' + show(g + b) + "</td></tr>";
        var detail = '<tr class="ebal-detail-row" id="' + id + '"' + (open ? "" : " hidden") + '><td colspan="' + cols + '">' + (open ? detailHTML(d, p) : "") + "</td></tr>";
        return row + detail;
      }).join("");
      app.querySelector("tbody").innerHTML = body;
      app.querySelector(".year-head").textContent = view === "girls" ? "Girls" : "Boys";
      app.querySelectorAll(".seg button").forEach(function (btn) {
        var k = btn.hasAttribute("data-sort") ? sortMode === btn.getAttribute("data-sort") : view === btn.getAttribute("data-view");
        btn.setAttribute("aria-pressed", String(k));
      });
    }

    app.innerHTML =
      '<p class="count">' + d.years[0] + "–" + d.years[d.years.length - 1] + " · Varsity · " + esc(d.weights.join("-")) + " scoring · Relay counts once</p>" +
      '<div class="controls ebal-controls">' +
        seg("Sort by", "sort", [["girls", "Girls total"], ["boys", "Boys total"], ["combined", "Combined"]], sortMode) +
        seg("Year columns", "view", [["girls", "Girls"], ["boys", "Boys"]], view) +
      "</div>" +
      '<div class="panel"><div class="table-scroll"><table class="ledger ebal-table"><thead>' +
        '<tr><th scope="col" rowspan="2">School</th><th scope="colgroup" colspan="' + d.years.length + '" class="year-group"><span class="year-head"></span> by year</th>' +
        '<th scope="col" rowspan="2" class="num col-sep">Girls</th><th scope="col" rowspan="2" class="num">Boys</th><th scope="col" rowspan="2" class="num col-sep">Combined</th></tr>' +
        "<tr>" + d.years.map(function (y) { return '<th scope="col" class="num">' + y + "</th>"; }).join("") + "</tr>" +
      "</thead><tbody></tbody></table></div></div>" +
      '<p class="table-note">' + esc(d.missing.concat(d.merged).join(". ") + (d.missing.length || d.merged.length ? ". " : "") + "Select a school to see its points by event.") + "</p>";

    app.addEventListener("click", function (e) {
      var b = e.target.closest(".seg button");
      if (b) {
        if (b.hasAttribute("data-sort")) sortMode = b.getAttribute("data-sort");
        else view = b.getAttribute("data-view");
        draw();
        return;
      }
      var row = e.target.closest("tr.ebal-row");
      if (row) {
        var p = row.getAttribute("data-p");
        expanded = expanded === p ? null : p;
        draw();
        var again = app.querySelector('tr.ebal-row[data-p="' + p.replace(/"/g, '\\"') + '"] .row-toggle');
        if (again && e.target.closest(".row-toggle")) again.focus();
      }
    });
    draw();
  }

  window.MVCSV.load(DATA_URL, ["gender", "event", "year", "place", "school", "program", "points"])
    .then(mount)
    .catch(fail);
})();
