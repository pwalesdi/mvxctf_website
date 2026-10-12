/* "Latest" news item (index.html).
   Reads assets/data/news.csv (date, headline, body, link_label, link_url)
   and renders the most recent row into #latest. Needs csv.js first.
   The section ships hidden and is only shown once there is an item, so an
   empty, missing or unreadable file leaves no trace on the page. */
(function () {
  "use strict";

  var DATA_URL = "assets/data/news.csv";

  var sec = document.getElementById("latest");
  if (!sec || !window.MVCSV) return;
  var esc = window.MVCSV.esc;

  // http(s) links only, absolute or relative to the site.
  function safeUrl(u) {
    if (!u) return null;
    try {
      var url = new URL(u, window.location.href);
      return url.protocol === "http:" || url.protocol === "https:" ? url.href : null;
    } catch (e) { return null; }
  }

  // YYYY-MM-DD → "Oct 11, 2026"; anything else is shown as written.
  function formatDate(s) {
    var m = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(s);
    if (!m) return s;
    return new Date(+m[1], +m[2] - 1, +m[3])
      .toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  }

  function key(s) {
    var m = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(s || "");
    return m ? m[1] + ("0" + m[2]).slice(-2) + ("0" + m[3]).slice(-2) : "";
  }

  window.MVCSV.load(DATA_URL, ["date", "headline", "body", "link_label", "link_url"])
    .then(function (records) {
      var items = records.filter(function (r) { return r.headline; });
      if (!items.length) return;
      // Newest date first; rows with the same (or no) date keep file order, last row wins.
      var item = items.reduce(function (best, r) { return key(r.date) >= key(best.date) ? r : best; });
      var href = safeUrl(item.link_url);
      sec.querySelector(".wrap").innerHTML =
        '<div class="latest-item">' +
          '<p class="eyebrow">Latest' + (item.date ? " &middot; " + esc(formatDate(item.date)) : "") + "</p>" +
          "<h2>" + esc(item.headline) + "</h2>" +
          (item.body ? "<p>" + esc(item.body) + "</p>" : "") +
          (href ? '<a class="latest-link" href="' + esc(href) + '">' + esc(item.link_label || "Read more") + "</a>" : "") +
        "</div>";
      sec.hidden = false;
    })
    .catch(function () { /* stay hidden */ });
})();
