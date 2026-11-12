/* Dropdowns in the site header (every page): Cross Country, Track & Field and Records.
   Each behaves the same way, and only one is open at a time.
   Desktop (>1200px): opens on hover or click, drops down under the button.
   Narrower: the nav scrolls sideways, so the menu opens on tap as a band
   under the nav that pushes the page down. Escape closes and returns focus
   to the button; clicking or tabbing away closes it. */
(function () {
  "use strict";

  var nodes = document.querySelectorAll(".nav-dd");
  if (!nodes.length) return;
  var head = document.querySelector(".site-head");
  var desktop = window.matchMedia("(min-width: 1201px)");
  var hoverable = window.matchMedia("(hover: hover) and (min-width: 1201px)");

  var all = Array.prototype.map.call(nodes, function (dd) {
    var btn = dd.querySelector(".nav-dd-btn");
    return {
      dd: dd,
      btn: btn,
      menu: document.getElementById(btn.getAttribute("aria-controls")),
      closeTimer: null,
      viaHover: false // opened by hover rather than a click
    };
  });

  function isOpen(d) { return d.btn.getAttribute("aria-expanded") === "true"; }

  // Below 1200px the open menu sits in space added to the bottom of the
  // header, so the page moves down rather than being covered.
  function layoutBand() {
    var open = all.filter(isOpen)[0];
    if (open && !desktop.matches) {
      head.style.setProperty("--dd-h", open.menu.offsetHeight + "px");
      head.classList.add("dd-open");
    } else {
      head.classList.remove("dd-open");
      head.style.removeProperty("--dd-h");
    }
  }

  function setOpen(d, open) {
    if (open) {
      all.forEach(function (o) { if (o !== d && isOpen(o)) setShown(o, false); });
    }
    setShown(d, open);
    layoutBand();
  }

  function setShown(d, open) {
    d.btn.setAttribute("aria-expanded", String(open));
    d.menu.hidden = !open;
    if (!open) d.viaHover = false;
  }

  all.forEach(function (d) {
    d.btn.addEventListener("click", function () {
      if (isOpen(d) && !d.viaHover) { setOpen(d, false); return; }
      d.viaHover = false; // a click on a hover-opened menu keeps it open
      setOpen(d, true);
    });

    d.dd.addEventListener("mouseenter", function () {
      if (!hoverable.matches) return;
      clearTimeout(d.closeTimer);
      if (!isOpen(d)) { setOpen(d, true); d.viaHover = true; }
    });
    d.dd.addEventListener("mouseleave", function () {
      if (!hoverable.matches || !d.viaHover) return;
      d.closeTimer = setTimeout(function () { setOpen(d, false); }, 200);
    });

    d.dd.addEventListener("focusout", function (e) {
      if (isOpen(d) && e.relatedTarget && !d.dd.contains(e.relatedTarget)) setOpen(d, false);
    });
  });

  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape") return;
    all.forEach(function (d) { if (isOpen(d)) { setOpen(d, false); d.btn.focus(); } });
  });
  document.addEventListener("click", function (e) {
    all.forEach(function (d) { if (isOpen(d) && !d.dd.contains(e.target)) setOpen(d, false); });
  });
  window.addEventListener("resize", layoutBand); // re-measure, or switch between dropdown and band
})();
