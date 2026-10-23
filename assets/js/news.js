/* "Latest" on the home page (index.html): the newest news item, or a carousel
   of up to MAX_ITEMS of them, newest first.
   Reads assets/data/news.csv (date, headline, body, link_label, link_url,
   image, image_alt, image_credit) and renders into #latest. Needs csv.js
   first; photos.js (loaded after it) adds the photo credit, from
   photo-credits.csv when the image is listed there, otherwise from
   image_credit.
   One item renders as a single block with no controls. Two or more become a
   carousel that moves on every ROTATE_MS, with a pause button, previous/next
   arrows and a dot per item. They are plain buttons, so they work by keyboard;
   the left and right arrow keys work inside the controls too. Rotation pauses
   while the pointer is over the carousel, while focus is inside it, and while
   the tab is in the background; the pause button stops it until pressed again.
   The items are stacked in one grid cell (site.css), so the block is as tall
   as its tallest item and the page below doesn't move when it rotates.
   The section ships hidden and is only shown once there is an item, so an
   empty, missing or unreadable file leaves no trace on the page. Without
   JavaScript, the <noscript> copy of the newest item in index.html shows. */
(function () {
  "use strict";

  var DATA_URL = "/assets/data/news.csv";
  var MAX_ITEMS = 5;       // the newest five rows show; older rows are ignored
  var ROTATE_MS = 10000;   // how long each item stays before the next

  var sec = document.getElementById("latest");
  if (!sec || !window.MVCSV) return;
  var esc = window.MVCSV.esc;

  function each(list, fn) { Array.prototype.forEach.call(list, fn); }

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

  // One item. A lone item is exactly this; a carousel slide adds a class and
  // the slide attributes.
  function itemHTML(item, cls, attrs) {
    var href = safeUrl(item.link_url), src = safeUrl(item.image);
    return '<div class="latest-item' + (src ? " has-media" : "") + (cls || "") + '"' + (attrs || "") + ">" +
        (src ? '<figure class="latest-media"><img src="' + esc(src) + '" alt="' + esc(item.image_alt) + '" loading="lazy" decoding="async"' +
          (item.image_credit ? ' data-credit="' + esc(item.image_credit) + '"' : "") + "></figure>" : "") +
        '<div class="latest-text">' +
          '<p class="eyebrow">Latest' + (item.date ? " &middot; " + esc(formatDate(item.date)) : "") + "</p>" +
          "<h2>" + esc(item.headline) + "</h2>" +
          (item.body ? "<p>" + esc(item.body) + "</p>" : "") +
          (href ? '<a class="latest-link" href="' + esc(href) + '">' + esc(item.link_label || "Read more") + "</a>" : "") +
        "</div>" +
      "</div>";
  }

  function carouselHTML(items) {
    var n = items.length;
    return '<div class="latest-carousel">' +
        '<div class="latest-slides" aria-live="off">' +
          items.map(function (item, i) {
            return itemHTML(item, i === 0 ? " is-active" : "",
              ' role="group" aria-roledescription="slide" aria-label="' + (i + 1) + " of " + n + '"');
          }).join("") +
        "</div>" +
        '<div class="latest-controls">' +
          '<button type="button" class="latest-btn latest-pause" aria-label="Pause"></button>' +
          '<button type="button" class="latest-btn latest-prev" aria-label="Previous item"></button>' +
          '<span class="latest-dots">' + items.map(function (item, i) {
            return '<button type="button" class="latest-dot" aria-label="Item ' + (i + 1) + " of " + n + '"' +
              (i === 0 ? ' aria-current="true"' : "") + "></button>";
          }).join("") + "</span>" +
          '<button type="button" class="latest-btn latest-next" aria-label="Next item"></button>' +
        "</div>" +
      "</div>";
  }

  function rotate(box, n) {
    var slides = box.querySelectorAll(".latest-slides > .latest-item"),
        dots = box.querySelectorAll(".latest-dot"),
        live = box.querySelector(".latest-slides"),
        pause = box.querySelector(".latest-pause"),
        current = 0, timer = 0, stopped = false, hovered = false, focused = false;

    function show(i) {
      current = (i + n) % n;
      each(slides, function (s, j) { s.classList.toggle("is-active", j === current); });
      each(dots, function (d, j) {
        if (j === current) d.setAttribute("aria-current", "true"); else d.removeAttribute("aria-current");
      });
    }

    // Restart the countdown to the next item, unless something holds it. Screen
    // readers announce the items people move to themselves, not the automatic ones.
    function arm() {
      clearTimeout(timer);
      var running = !stopped && !hovered && !focused && !document.hidden;
      live.setAttribute("aria-live", running ? "off" : "polite");
      if (running) timer = setTimeout(function () { show(current + 1); arm(); }, ROTATE_MS);
    }

    function go(i) { show(i); arm(); }

    box.querySelector(".latest-prev").addEventListener("click", function () { go(current - 1); });
    box.querySelector(".latest-next").addEventListener("click", function () { go(current + 1); });
    each(dots, function (d, j) { d.addEventListener("click", function () { go(j); }); });
    pause.addEventListener("click", function () {
      stopped = !stopped;
      pause.classList.toggle("is-paused", stopped);
      pause.setAttribute("aria-label", stopped ? "Play" : "Pause");
      arm();
    });
    box.querySelector(".latest-controls").addEventListener("keydown", function (e) {
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
      e.preventDefault();
      go(current + (e.key === "ArrowLeft" ? -1 : 1));
    });
    box.addEventListener("mouseenter", function () { hovered = true; arm(); });
    box.addEventListener("mouseleave", function () { hovered = false; arm(); });
    box.addEventListener("focusin", function () { focused = true; arm(); });
    box.addEventListener("focusout", function (e) {
      if (!box.contains(e.relatedTarget)) { focused = false; arm(); }
    });
    document.addEventListener("visibilitychange", arm);
    arm();
  }

  window.MVCSV.load(DATA_URL, ["date", "headline", "body", "link_label", "link_url"])
    .then(function (records) {
      // Newest date first; rows with the same (or no) date: the later row in the file first.
      var items = records.map(function (r, i) { return { r: r, i: i, k: key(r.date) }; })
        .filter(function (x) { return x.r.headline; })
        .sort(function (a, b) { return a.k === b.k ? b.i - a.i : a.k < b.k ? 1 : -1; })
        .slice(0, MAX_ITEMS)
        .map(function (x) { return x.r; });
      if (!items.length) return;
      var wrap = sec.querySelector(".wrap");
      var media = items.some(function (item) { return safeUrl(item.image); });
      if (items.length === 1) {
        wrap.innerHTML = itemHTML(items[0]);
      } else {
        sec.setAttribute("aria-roledescription", "carousel");
        sec.setAttribute("aria-label", "Latest news");
        wrap.innerHTML = carouselHTML(items);
      }
      sec.hidden = false;
      if (media && window.MVPhotos) window.MVPhotos.apply(wrap);
      if (items.length > 1) rotate(wrap.querySelector(".latest-carousel"), items.length);
    })
    .catch(function () { /* stay hidden */ });
})();
