/* NCS Championships table (cross-country-records.html).
   Reads assets/data/ncs-championships.csv: one row per team per year.
   Renders Year | Division | Girls | Boys, newest first. Needs csv.js first. */
(function () {
  "use strict";

  var DATA_URL = "assets/data/ncs-championships.csv";

  var app = document.getElementById("ncs-app");
  if (!app) return;
  function fail() { app.innerHTML = '<p class="count">The NCS results couldn’t load. Try again later.</p>'; }
  if (!window.MVCSV) { fail(); return; }
  var esc = window.MVCSV.esc;

  // An empty place shows as an em dash; its note (e.g. "Place unknown") is
  // kept for hover and screen readers.
  function placeCell(r) {
    if (!r) return '<td class="mono">&mdash;</td>';
    if (!r.place) {
      return '<td class="mono"' + (r.note ? ' title="' + esc(r.note) + '"' : "") + '>&mdash;' +
        (r.note ? '<span class="sr-only"> (' + esc(r.note) + ")</span>" : "") + "</td>";
    }
    return '<td class="mono' + (r.place_num === "1" ? " win" : "") + '">' + esc(r.place) + "</td>";
  }

  function render(records) {
    var years = {};
    records.forEach(function (r) { (years[r.year] = years[r.year] || {})[r.gender] = r; });
    var list = Object.keys(years).sort(function (a, b) { return b - a; });
    return '<div class="panel"><div class="table-scroll"><table class="ledger ncs-table"><thead><tr>' +
      '<th scope="col">Year</th><th scope="col">Division</th><th scope="col">Girls</th><th scope="col">Boys</th>' +
      "</tr></thead><tbody>" +
      list.map(function (y) {
        var g = years[y].Girls, b = years[y].Boys, any = g || b;
        var cells;
        // Neither team placed and both carry the same note (2020): one cell across both.
        if (g && b && !g.place && !b.place && g.note && g.note === b.note) {
          cells = '<td colspan="2" class="ncs-none">' + esc(g.note) + "</td>";
        } else {
          cells = placeCell(g) + placeCell(b);
        }
        return '<tr><td class="mono">' + esc(y) + "</td><td>" + esc(any.division) + "</td>" + cells + "</tr>";
      }).join("") +
      "</tbody></table></div></div>";
  }

  window.MVCSV.load(DATA_URL, ["gender", "year", "place", "place_num", "division"])
    .then(function (records) { app.innerHTML = render(records); })
    .catch(fail);
})();
