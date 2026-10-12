/* Varsity letter standards (varsity-standards.html).
   Reads assets/data/varsity-standards.csv and renders one table per event
   group, with a Girls/Boys toggle. Needs assets/js/csv.js first. */
(function () {
  "use strict";

  var DATA_URL = "assets/data/varsity-standards.csv";
  var GENDERS = ["Girls", "Boys"];
  var GROUP_ORDER = ["Sprints", "Hurdles", "Distance", "Field"];

  var app = document.getElementById("standards-app");
  if (!app) return;
  function fail() { app.innerHTML = '<p class="sched-status">The standards couldn’t load. Try again later.</p>'; }
  if (!window.MVCSV) { fail(); return; }
  var esc = window.MVCSV.esc;

  function byOrder(a, b) {
    var ao = parseFloat(a.event_order), bo = parseFloat(b.event_order);
    return (isNaN(ao) ? Infinity : ao) - (isNaN(bo) ? Infinity : bo) || a._i - b._i;
  }

  function render(records, gender) {
    var mine = records.filter(function (r) { return r.gender === gender; });
    var groups = GROUP_ORDER.slice();
    mine.forEach(function (r) { if (groups.indexOf(r.event_group) < 0) groups.push(r.event_group); });
    return groups.map(function (g) {
      var rows = mine.filter(function (r) { return r.event_group === g; }).sort(byOrder);
      if (!rows.length) return "";
      var id = "std-" + gender.toLowerCase() + "-" + g.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      return '<section class="data-group" aria-labelledby="' + esc(id) + '">' +
        '<h2 id="' + esc(id) + '">' + esc(g) + "</h2>" +
        '<div class="panel"><table class="ledger std-table"><thead><tr>' +
        '<th scope="col">Event</th><th scope="col" class="num">Standard</th></tr></thead><tbody>' +
        rows.map(function (r) {
          return '<tr><td>' + esc(r.event) + '</td><td class="mono num">' + esc(r.standard) + "</td></tr>";
        }).join("") +
        "</tbody></table></div></section>";
    }).join("");
  }

  function mount(records) {
    records.forEach(function (r, i) { r._i = i; });
    var current = GENDERS[0];
    app.innerHTML = '<div class="controls"><div class="seg" role="group" aria-label="Gender">' + GENDERS.map(function (g) {
      return '<button type="button" data-g="' + g + '" aria-pressed="' + (g === current) + '">' + g + "</button>";
    }).join("") + '</div></div><div id="standards-body"></div>';
    var body = document.getElementById("standards-body");
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

  window.MVCSV.load(DATA_URL, ["gender", "event_group", "event", "standard"])
    .then(mount)
    .catch(fail);
})();
