/* NCS Championships table (cross-country-records.html).
   Reads assets/data/ncs-championships.csv: one row per team per year.
   Renders Year | Division | Girls | Boys, newest first. Needs csv.js first.
   A year whose results are archived links its Year cell to them, found at
   render time in assets/data/results-archive.csv (see ncsLinks), so archiving
   a result makes its link appear with no edit here. Needs csv.js and
   archive-links.js first. */
(function () {
  "use strict";

  var DATA_URL = "/assets/data/ncs-championships.csv";
  var ARCHIVE_URL = "/assets/data/results-archive.csv";
  var MEET = "NCS Championships";

  var app = document.getElementById("ncs-app");
  if (!app) return;
  function fail() { app.innerHTML = '<p class="count">The NCS results couldn’t load. Try again later.</p>'; }
  if (!window.MVCSV) { fail(); return; }
  var esc = window.MVCSV.esc;
  // The meet id and path check archive.js uses (archive-links.js), so the anchor
  // below is the id the archive page gives the meet and a bad path gets no link.
  // Without it the table renders with no links, as when the archive can't load.
  var A = window.MVArchive;

  // Archived results by year: the archive rows in season "<year>-xc" whose meet
  // is exactly "NCS Championships". Each file is the whole meet (every division,
  // girls and boys), so a year's link serves both teams. One file with no group
  // links straight to the file; more than one goes to the meet's entry on the
  // results archive page. A meet named any other way just gets no link.
  function ncsLinks(archive) {
    var byYear = {}, links = {};
    if (!A) return links;
    archive.forEach(function (r) {
      var m = /^(\d{4})-xc$/.exec(r.season);
      if (m && r.meet === MEET) (byYear[m[1]] = byYear[m[1]] || []).push(r);
    });
    Object.keys(byYear).forEach(function (y) {
      var files = byYear[y], first = files[0];
      var href = files.length === 1 && !first.group
        ? A.rel(first.path)
        : "/results-archive.html#" + A.meetId(first.date, MEET);
      if (href) links[y] = { href: href, pdf: /\.pdf$/i.test(href) };
    });
    return links;
  }

  // The link fills the cell (.ncs-yr in site.css); its accessible name is
  // "2026 results (PDF)".
  function yearCell(y, link) {
    if (!link) return '<td class="mono">' + esc(y) + "</td>";
    return '<td class="mono ncs-yr"><a href="' + esc(link.href) + '">' + esc(y) +
      '<span class="sr-only"> results' + (link.pdf ? " (PDF)" : "") + "</span></a></td>";
  }

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

  function render(records, links) {
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
        return "<tr>" + yearCell(y, links[y]) + "<td>" + esc(any.division) + "</td>" + cells + "</tr>";
      }).join("") +
      "</tbody></table></div></div>";
  }

  Promise.all([
    window.MVCSV.load(DATA_URL, ["gender", "year", "place", "place_num", "division"]),
    // If the archive can't load, the table still renders, without links.
    window.MVCSV.load(ARCHIVE_URL, ["season", "date", "meet", "path"]).catch(function () { return []; })
  ])
    .then(function (res) { app.innerHTML = render(res[0], ncsLinks(res[1])); })
    .catch(fail);
})();
