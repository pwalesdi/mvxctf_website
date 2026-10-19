/* Home page hero rotation (index.html).
   Shows one photo, picked at random on every load, from assets/data/hero.csv
   (file, focus, caption, alt, phone), with its own caption line under the hero.
   phone is optional: smaller 4:5 crops that phones download instead.

   The work is split in two so nobody ever sees one photo replaced by another:
   - A small inline script in the page's <head> (window.MVHero) starts
     fetching the list before anything is drawn.
   - With JavaScript on, the hero ships with no photo. The default photo and
     caption live in <noscript class="hero-default"> blocks, which only show
     without JavaScript. This script picks a row and inserts it.
   If the list, csv.js or this script fails, or nothing is picked within three
   seconds of the page loading, the head script shows the default instead.
   Needs csv.js first. photos.js adds "Photo: …" to the caption when the
   chosen file is in photo-credits.csv. */
(function () {
  "use strict";

  var hero = window.MVHero;
  if (!hero) return;
  var media = document.querySelector(".hero-media");
  var caption = document.getElementById("hero-caption");
  if (!window.MVCSV || !hero.list || !media || !caption) { hero.fallback(); return; }

  // Relative paths inside assets/img/ only, and focal points like "60% 40%".
  var FILE = /^assets\/img\/[\w.\/-]+\.(jpe?g|png|webp)$/i;
  var FOCUS = /^\d{1,3}% \d{1,3}%$/;

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
      // Phones (the hero's 4:5 layout, up to 760px) pick from the phone crops; wider screens get the full photo.
      shown = document.createElement("picture");
      var source = document.createElement("source");
      source.media = "(max-width: 760px)";
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
    if (hero.state !== "waiting") return; // too late: the default is already showing
    hero.state = "chosen";
    show(rows[Math.floor(Math.random() * rows.length)]);
  }).catch(function () { hero.fallback(); });
})();
