/* School records (records.html).
   Reads assets/data/records.csv and renders event panels grouped by
   event group, with a Girls/Boys toggle. Needs assets/js/csv.js first. */
(function () {
  "use strict";

  var DATA_URL = "assets/data/records.csv";
  var GENDERS = ["Girls", "Boys"];
  var GROUP_ORDER = ["Sprints", "Hurdles", "Distance", "Relays", "Field"];
  var FLAG_TITLES = { w: "Wind-aided", c: "Converted mark" };

  var app = document.getElementById("records-app");
  if (!app) return;
  function fail() { app.innerHTML = '<p class="sched-status">The records couldn’t load. Try again later.</p>'; }
  if (!window.MVCSV) { fail(); return; }
  var esc = window.MVCSV.esc;

  function markHTML(r) {
    var flag = r.flag;
    var badge = flag
      ? '<sup class="flag" title="' + esc(FLAG_TITLES[flag.toLowerCase()] || flag) + '">' + esc(flag) + "</sup>"
      : "";
    return esc(r.mark) + badge;
  }

  function panelHTML(event, rows) {
    return '<div class="panel rec">' +
      '<h3 class="panel-head">' + esc(event) + "</h3>" +
      '<table class="ledger rec-table"><thead><tr>' +
      '<th scope="col" class="num">#</th><th scope="col">Athlete</th><th scope="col" class="num">Mark</th><th scope="col" class="num">Year</th>' +
      "</tr></thead><tbody>" +
      rows.map(function (r) {
        // Highlight comes only from the active column (set by hand, including
        // relays with any current leg). Never infer it from names: the board
        // uses initials and has same-surname athletes.
        var active = (r.active || "").trim().toLowerCase() === "yes";
        return '<tr' + (active ? ' class="hl"' : "") + ">" +
          '<td class="rank num">' + esc(r.rank) + "</td>" +
          '<td class="athlete">' + esc(r.athlete) + (active ? '<span class="sr-only"> (current athlete)</span>' : "") + "</td>" +
          '<td class="mono num">' + markHTML(r) + "</td>" +
          '<td class="mono num">' + esc(r.year) + "</td></tr>";
      }).join("") +
      "</tbody></table></div>";
  }

  function render(records, gender) {
    var mine = records.filter(function (r) { return r.gender === gender; });
    // Groups in the fixed order, then any unexpected group after, in file order.
    var groups = GROUP_ORDER.slice();
    mine.forEach(function (r) { if (groups.indexOf(r.event_group) < 0) groups.push(r.event_group); });
    return groups.map(function (g) {
      var inGroup = mine.filter(function (r) { return r.event_group === g; });
      if (!inGroup.length) return "";
      // Events by event_order; file order breaks ties or fills in if it's missing.
      var events = [], order = {};
      inGroup.forEach(function (r) {
        if (events.indexOf(r.event) < 0) { events.push(r.event); order[r.event] = parseFloat(r.event_order); }
      });
      events = events.map(function (ev, i) { return { ev: ev, i: i, o: order[ev] }; })
        .sort(function (a, b) {
          var ao = isNaN(a.o) ? Infinity : a.o, bo = isNaN(b.o) ? Infinity : b.o;
          return ao - bo || a.i - b.i;
        })
        .map(function (x) { return x.ev; });
      var id = "rec-" + gender.toLowerCase() + "-" + g.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      return '<section class="data-group" aria-labelledby="' + esc(id) + '">' +
        '<h2 id="' + esc(id) + '">' + esc(g) + "</h2>" +
        '<div class="rec-grid' + (g === "Relays" ? " wide" : "") + '">' +
        events.map(function (ev) {
          return panelHTML(ev, inGroup.filter(function (r) { return r.event === ev; }));
        }).join("") +
        "</div></section>";
    }).join("");
  }

  function mount(records) {
    var current = GENDERS[0];
    var seg = '<div class="seg" role="group" aria-label="Gender">' + GENDERS.map(function (g) {
      return '<button type="button" data-g="' + g + '" aria-pressed="' + (g === current) + '">' + g + "</button>";
    }).join("") + "</div>";
    app.innerHTML = '<div class="controls">' + seg + '</div><div id="records-body"></div>';
    var body = document.getElementById("records-body");
    function draw() {
      body.innerHTML = render(records, current);
      app.querySelectorAll(".seg button").forEach(function (b) {
        b.setAttribute("aria-pressed", String(b.getAttribute("data-g") === current));
      });
    }
    app.querySelector(".seg").addEventListener("click", function (e) {
      var b = e.target.closest("button[data-g]");
      if (!b || b.getAttribute("data-g") === current) return;
      current = b.getAttribute("data-g");
      draw();
    });
    draw();
  }

  window.MVCSV.load(DATA_URL, ["gender", "event_group", "event", "rank", "athlete", "mark", "year"])
    .then(mount)
    .catch(fail);
})();
