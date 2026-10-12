/* Varsity letter winners (varsity-letters.html).
   Reads assets/data/letter-winners.csv and renders one panel per year,
   newest first, with a Girls/Boys toggle. Needs assets/js/csv.js first. */
(function () {
  "use strict";

  var DATA_URL = "assets/data/letter-winners.csv";
  var GENDERS = ["Girls", "Boys"];

  var app = document.getElementById("letters-app");
  if (!app) return;
  function fail() { app.innerHTML = '<p class="sched-status">The letter winners couldn’t load. Try again later.</p>'; }
  if (!window.MVCSV) { fail(); return; }
  var esc = window.MVCSV.esc;

  function render(records, gender) {
    var mine = records.filter(function (r) { return r.gender === gender; });
    var years = [];
    mine.forEach(function (r) { if (years.indexOf(r.year) < 0) years.push(r.year); });
    years.sort(function (a, b) { return b.localeCompare(a, undefined, { numeric: true }); });
    if (!years.length) return '<p class="sched-status">No ' + esc(gender.toLowerCase()) + " letter winners listed.</p>";
    return years.map(function (y) {
      var list = mine.filter(function (r) { return r.year === y; }); // file order
      var n = list.length; // counted, never hardcoded
      return '<section class="panel letters" aria-label="' + esc(y + " " + gender.toLowerCase()) + '">' +
        '<h2 class="panel-head">' + esc(y) + ' <span class="count">&mdash; ' + n + (n === 1 ? " athlete" : " athletes") + "</span></h2>" +
        '<ul class="name-list">' + list.map(function (r) {
          return "<li>" + esc(r.athlete) + (r.honor ? ' <span class="pill act">' + esc(r.honor) + "</span>" : "") + "</li>";
        }).join("") + "</ul></section>";
    }).join("");
  }

  function mount(records) {
    var current = GENDERS[0];
    app.innerHTML = '<div class="controls"><div class="seg" role="group" aria-label="Gender">' + GENDERS.map(function (g) {
      return '<button type="button" data-g="' + g + '" aria-pressed="' + (g === current) + '">' + g + "</button>";
    }).join("") + '</div></div><div id="letters-body"></div>';
    var body = document.getElementById("letters-body");
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

  window.MVCSV.load(DATA_URL, ["gender", "year", "athlete"])
    .then(mount)
    .catch(fail);
})();
