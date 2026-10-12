/* Records dropdown in the site header (every page).
   Desktop (>1200px): opens on hover or click, drops down under the button.
   Narrower: the nav scrolls sideways, so the menu opens on tap as a band
   under the nav that pushes the page down. Escape closes and returns focus
   to the button; clicking or tabbing away closes it. */
(function () {
  "use strict";

  var dd = document.querySelector(".nav-dd");
  if (!dd) return;
  var btn = dd.querySelector(".nav-dd-btn");
  var menu = document.getElementById(btn.getAttribute("aria-controls"));
  var head = document.querySelector(".site-head");
  var desktop = window.matchMedia("(min-width: 1201px)");
  var hoverable = window.matchMedia("(hover: hover) and (min-width: 1201px)");
  var closeTimer = null;
  var viaHover = false; // opened by hover rather than a click

  function isOpen() { return btn.getAttribute("aria-expanded") === "true"; }

  function setOpen(open) {
    btn.setAttribute("aria-expanded", String(open));
    menu.hidden = !open;
    // Below 1200px the menu sits in space added to the bottom of the header,
    // so the page moves down rather than being covered.
    if (open && !desktop.matches) {
      head.style.setProperty("--dd-h", menu.offsetHeight + "px");
      head.classList.add("dd-open");
    } else {
      head.classList.remove("dd-open");
      head.style.removeProperty("--dd-h");
    }
    if (!open) viaHover = false;
  }

  btn.addEventListener("click", function () {
    if (isOpen() && !viaHover) { setOpen(false); return; }
    viaHover = false; // a click on a hover-opened menu keeps it open
    setOpen(true);
  });

  dd.addEventListener("mouseenter", function () {
    if (!hoverable.matches) return;
    clearTimeout(closeTimer);
    if (!isOpen()) { viaHover = true; setOpen(true); }
  });
  dd.addEventListener("mouseleave", function () {
    if (!hoverable.matches || !viaHover) return;
    closeTimer = setTimeout(function () { setOpen(false); }, 200);
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && isOpen()) { setOpen(false); btn.focus(); }
  });
  document.addEventListener("click", function (e) {
    if (isOpen() && !dd.contains(e.target)) setOpen(false);
  });
  dd.addEventListener("focusout", function (e) {
    if (isOpen() && e.relatedTarget && !dd.contains(e.relatedTarget)) setOpen(false);
  });
  window.addEventListener("resize", function () {
    if (isOpen()) setOpen(true); // re-measure, or switch between dropdown and band
  });
})();
