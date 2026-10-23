/* Home page hero rotation (index.html).
   Shows one photo, picked at random on every load, from assets/data/hero.csv
   (file, focus, caption, alt, phone, sport, show), with its own caption line
   under the hero. phone is optional: smaller 4:5 crops that phones download
   instead. Only the photos for the current season and this kind of screen
   rotate (see heroPool below). The headline follows the same season
   (MVHero.title(), in the page's <head>).

   The work is split in two so nobody ever sees one photo replaced by another:
   - A small inline script in the page's <head> (window.MVHero) starts
     fetching the list before anything is drawn.
   - With JavaScript on, the hero ships with no photo and no headline. The
     defaults live in <noscript> blocks, which only show without JavaScript.
     This script sets the headline, picks a row and inserts it.
   If the list, csv.js or this script fails, or nothing is picked within three
   seconds of the page loading, the head script shows the default instead.
   Needs csv.js and schedule.js (for the season) first. photos.js adds
   "Photo: …" to the caption when the chosen file is in photo-credits.csv. */
(function () {
  "use strict";

  var hero = window.MVHero;
  if (!hero) return;
  if (hero.title) hero.title();
  var media = document.querySelector(".hero-media");
  var caption = document.getElementById("hero-caption");
  if (!window.MVCSV || !hero.list || !media || !caption) { hero.fallback(); return; }

  // Relative paths inside assets/img/ only, and focal points like "60% 40%".
  var FILE = /^assets\/img\/[\w.\/-]+\.(jpe?g|png|webp)$/i;
  var FOCUS = /^\d{1,3}% \d{1,3}%$/;

  // The phone layout: site.css switches the hero to its 4:5 phone frame at this
  // width, and the phone crops use the same query. Read once, at page load: a
  // later resize doesn't re-pick the photo.
  var PHONE_QUERY = "(max-width: 760px)";
  var DEVICE = window.matchMedia && window.matchMedia(PHONE_QUERY).matches ? "phone" : "desktop";

  /* Which photos rotate. Two columns decide it:
     - sport: "xc", "track", or "both" (works year round: a team photo, a banner).
       The active sport is window.MVSeason's, from CURRENT_SEASON in schedule.js
       (with its stale-constant backstop), so the hero matches the schedule.
     - show: "both", "phone" or "desktop": the screens the photo works on. Empty
       counts as "both".
     The pool is the rows that match the season (or are "both") AND suit this
     screen. If that's empty, the screen filter is dropped first, then the season
     filter: the hero is never empty. Any count works, one included. A row with an
     unknown sport only shows once the season filter is dropped. */
  var SPORTS = ["xc", "track", "both"];
  var SHOWS = ["both", "phone", "desktop"];

  /* Preview: ?season=track or ?season=xc on the home page forces which season's
     photos rotate, to check a pool out of season. It changes only the photo pool:
     the headline, the schedule, the stale-constant backstop (window.MVSeason) and
     everything a visitor sees without the parameter stay as they are. The screen
     filter still applies; resize and reload to check the other screen. */
  var PREVIEW = (function () {
    var v = "";
    try { v = new URLSearchParams(window.location.search).get("season") || ""; } catch (e) { return ""; }
    if (!v) return "";
    if (v !== "xc" && v !== "track") { console.log("Hero preview: ?season=" + v + " ignored; use xc or track."); return ""; }
    console.log("Hero preview active: showing the " + (v === "xc" ? "cross country" : "track") + " photos (?season=" + v + "). Without the parameter the home page shows " + ((window.MVSeason && window.MVSeason.sport) === "track" ? "track" : "cross country") + ".");
    return v;
  })();

  function heroPool(rows) {
    var sport = PREVIEW || (window.MVSeason && window.MVSeason.sport);
    var bySeason = sport ? rows.filter(function (r) { return r.sport === sport || r.sport === "both"; }) : rows;
    var pool = bySeason.filter(function (r) { return r.show === "both" || r.show === DEVICE; });
    if (!pool.length) pool = bySeason; // first fallback: any screen
    if (!pool.length) pool = rows;     // then: any season
    return pool;
  }

  // The phone column: "file width, file width", e.g. "assets/img/x-800.jpg 800w, assets/img/x-1200.jpg 1200w".
  // Each file is a 4:5 crop of what the phone frame shows, so it fills the frame exactly.
  function phoneSrcset(s) {
    var parts = (s || "").split(",").map(function (c) { return c.trim().split(/\s+/); });
    var ok = parts.length && parts.every(function (c) {
      return c.length === 2 && FILE.test(c[0]) && c[0].indexOf("..") < 0 && /^\d+w$/.test(c[1]);
    });
    return ok ? parts.map(function (c) { return "/" + c[0] + " " + c[1]; }).join(", ") : "";
  }

  function show(r) {
    var img = document.createElement("img");
    var text = document.createElement("span");
    var shown = img, phone = phoneSrcset(r.phone);
    img.alt = r.alt;
    img.fetchPriority = "high";
    if (FOCUS.test(r.focus)) img.style.setProperty("--hero-focus", r.focus);
    if (phone) {
      // Phones (the hero's 4:5 layout) pick from the phone crops; wider screens get the full photo.
      shown = document.createElement("picture");
      var source = document.createElement("source");
      source.media = PHONE_QUERY;
      source.sizes = "100vw";
      source.srcset = phone;
      shown.appendChild(source);
      shown.appendChild(img);
    }
    // A missing file falls back to the default rather than leaving a blank hero.
    img.onerror = function () {
      shown.remove(); text.remove();
      Array.prototype.forEach.call(caption.querySelectorAll(".photo-credit"), function (el) { el.remove(); });
      hero.state = "waiting";
      hero.fallback();
    };
    img.src = "/" + r.file;
    text.textContent = r.caption;
    media.insertBefore(shown, media.firstChild);
    caption.appendChild(text);
    if (window.MVPhotos) window.MVPhotos.apply(document.querySelector(".hero"));
  }

  hero.list.then(function (csv) {
    var rows = window.MVCSV.toRecords(window.MVCSV.parse(csv), ["file", "focus", "caption", "alt"])
      .filter(function (r) { return FILE.test(r.file) && r.file.indexOf("..") < 0; });
    if (!rows.length) throw new Error("hero.csv has no usable rows");
    rows.forEach(function (r) {
      r.sport = (r.sport || "").trim().toLowerCase();
      r.show = (r.show || "").trim().toLowerCase() || "both";
      if (SPORTS.indexOf(r.sport) < 0) console.warn("hero.csv: " + r.file + " has sport \"" + r.sport + "\"; use xc, track or both.");
      if (SHOWS.indexOf(r.show) < 0) { console.warn("hero.csv: " + r.file + " has show \"" + r.show + "\"; use both, phone or desktop. Treated as both."); r.show = "both"; }
    });
    if (hero.state !== "waiting") return; // too late: the default is already showing
    hero.state = "chosen";
    var pool = heroPool(rows);
    show(pool[Math.floor(Math.random() * pool.length)]);
  }).catch(function () { hero.fallback(); });
})();
