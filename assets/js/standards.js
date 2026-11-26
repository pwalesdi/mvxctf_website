/* Varsity letter standards (varsity-standards.html).
   Reads assets/data/varsity-standards.csv and lists both genders on the page,
   girls then boys, with no toggle: an h2 per gender, and under it one table
   per event group (Track, Field), each in a panel headed by the group, rows in
   event_order. (The track records page keeps its Girls/Boys toggle; its table
   is much longer.) Needs assets/js/csv.js first. */
(function () {
  "use strict";

  var DATA_URL = "/assets/data/varsity-standards.csv";
  var GENDERS = ["Girls", "Boys"];
  var GROUP_ORDER = ["Track", "Field"];

  var app = document.getElementById("standards-app");
  if (!app) return;
  function fail() { app.innerHTML = '<p class="sched-status">The standards couldn’t load. Try again later.</p>'; }
  if (!window.MVCSV) { fail(); return; }
  var esc = window.MVCSV.esc;

  function byOrder(a, b) {
    var ao = parseFloat(a.event_order), bo = parseFloat(b.event_order);
    return (isNaN(ao) ? Infinity : ao) - (isNaN(bo) ? Infinity : bo) || a._i - b._i;
  }
  function idFor(s) { return s.toLowerCase().replace(/[^a-z0-9]+/g, "-"); }

  // One gender: its heading, then a panel per event group, Track and Field
  // first and any other group after them, in file order.
  function genderHTML(records, gender) {
    var mine = records.filter(function (r) { return r.gender === gender; });
    if (!mine.length) return "";
    var groups = GROUP_ORDER.slice();
    mine.forEach(function (r) { if (groups.indexOf(r.event_group) < 0) groups.push(r.event_group); });
    var gid = "std-" + idFor(gender);
    return '<section class="data-group" aria-labelledby="' + esc(gid) + '">' +
      '<h2 id="' + esc(gid) + '">' + esc(gender) + "</h2>" +
      groups.map(function (g) {
        var rows = mine.filter(function (r) { return r.event_group === g; }).sort(byOrder);
        if (!rows.length) return "";
        var id = gid + "-" + idFor(g);
        return '<div class="panel"><h3 class="panel-head" id="' + esc(id) + '">' + esc(g) + "</h3>" +
          '<table class="ledger std-table" aria-labelledby="' + esc(gid) + " " + esc(id) + '"><thead><tr>' +
          '<th scope="col">Event</th><th scope="col" class="num">Standard</th></tr></thead><tbody>' +
          rows.map(function (r) {
            return '<tr><td>' + esc(r.event) + '</td><td class="mono num">' + esc(r.standard) + "</td></tr>";
          }).join("") +
          "</tbody></table></div>";
      }).join("") +
      "</section>";
  }

  window.MVCSV.load(DATA_URL, ["gender", "event_group", "event", "standard"])
    .then(function (records) {
      records.forEach(function (r, i) { r._i = i; });
      app.innerHTML = GENDERS.map(function (g) { return genderHTML(records, g); }).join("");
    })
    .catch(fail);
})();
