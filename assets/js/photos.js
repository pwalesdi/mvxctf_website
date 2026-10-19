/* Photo credits. Reads assets/data/photo-credits.csv (file, credit) and adds
   "Photo: <credit>" to every photo on the page whose file is listed, so a
   credit follows the file wherever it's used rather than relying on markup.
   Covers three kinds of photo:
     .coach-photo slots (CSS background images) — the credit sits along the
       slot's bottom edge, so card and grid layouts don't change;
     <figure> images — the credit goes at the end of the figcaption (one is
       added if missing). An image not listed in the CSV can carry its own
       credit in data-credit; the CSV wins when both exist;
     images whose caption sits elsewhere (the home page hero) — the caption
       carries data-credit-for="<image selector>" and the credit goes at its end.
   Needs csv.js first. Any page that shows photos loads csv.js + photos.js.
   Scripts that add photos after load call window.MVPhotos.apply(root). */
(function () {
  "use strict";

  var DATA_URL = "/assets/data/photo-credits.csv";
  if (!window.MVCSV) return;

  // Site-relative path ("assets/img/…") of a URL, for matching against the CSV.
  function sitePath(u) {
    if (!u) return "";
    try { u = new URL(u, window.location.href).pathname; } catch (e) { return ""; }
    var i = u.indexOf("assets/img/");
    return i < 0 ? "" : decodeURIComponent(u.slice(i));
  }

  function creditEl(text) {
    var el = document.createElement("span");
    el.className = "photo-credit";
    el.textContent = "Photo: " + text;
    return el;
  }

  // The credits table, loaded once. A failed load still lets data-credit work.
  var ready = window.MVCSV.load(DATA_URL, ["file", "credit"]).then(function (records) {
    var credits = {};
    records.forEach(function (r) { if (r.file && r.credit) credits[r.file] = r.credit; });
    return credits;
  }).catch(function () { return {}; });

  function apply(root) {
    root = root || document;
    return ready.then(function (credits) {
      Array.prototype.forEach.call(root.querySelectorAll(".coach-photo"), function (slot) {
        var m = /url\(["']?(.*?)["']?\)/.exec(getComputedStyle(slot).backgroundImage || "");
        var c = m && credits[sitePath(m[1])];
        if (c && !slot.querySelector(".photo-credit")) {
          slot.appendChild(creditEl(c));
          slot.removeAttribute("aria-hidden"); // the slot is decorative, but its credit should be announced
        }
      });

      Array.prototype.forEach.call(root.querySelectorAll("figure img"), function (img) {
        var c = credits[sitePath(img.getAttribute("src"))] || img.getAttribute("data-credit");
        if (!c) return;
        var fig = img.closest("figure"), cap = fig.querySelector("figcaption");
        if (!cap) { cap = document.createElement("figcaption"); fig.appendChild(cap); }
        if (!cap.querySelector(".photo-credit")) cap.appendChild(creditEl(c));
      });

      // Captions that sit apart from their photo (the home page hero) name
      // the image with data-credit-for="<selector>" and get its credit.
      Array.prototype.forEach.call(root.querySelectorAll("[data-credit-for]"), function (el) {
        var img = document.querySelector(el.getAttribute("data-credit-for"));
        var c = img && (credits[sitePath(img.getAttribute("src"))] || img.getAttribute("data-credit"));
        if (c && !el.querySelector(".photo-credit")) el.appendChild(creditEl(c));
      });
    });
  }

  window.MVPhotos = { apply: apply };
  apply(document);
})();
