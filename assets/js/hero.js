/* Home page hero rotation (index.html).
   Shows one photo, picked at random on every load, from assets/data/hero.csv
   (file, focus, caption, alt), with its own caption line under the hero.

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

  function show(r) {
    var img = document.createElement("img");
    var text = document.createElement("span");
    img.alt = r.alt;
    img.fetchPriority = "high";
    if (FOCUS.test(r.focus)) img.style.setProperty("--hero-focus", r.focus);
    // A missing file falls back to the default rather than leaving a blank hero.
    img.onerror = function () {
      img.remove(); text.remove();
      Array.prototype.forEach.call(caption.querySelectorAll(".photo-credit"), function (el) { el.remove(); });
      hero.state = "waiting";
      hero.fallback();
    };
    img.src = "/" + r.file;
    text.textContent = r.caption;
    media.insertBefore(img, media.firstChild);
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
