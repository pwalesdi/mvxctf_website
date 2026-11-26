/* How a link into the results archive is made, shared by archive.js (which
   gives each meet its id) and ncs.js (which links to those ids and files).
   One copy, so the archive page's ids and the links other pages make to them
   can't drift apart. Load it before either script.
   - slug(s): lowercase, "&" as "and", every other run of non-alphanumerics as "-".
   - meetId(date, meet): the id a meet gets on results-archive.html,
     m-<date>-<meet-slug>, e.g. m-2026-11-21-ncs-championships.
   - rel(p): p if it's a plain relative path (the data files' paths are all
     relative; see README, "Results archive"), otherwise null. */
(function () {
  "use strict";

  function slug(s) { return s.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); }
  function meetId(date, meet) { return "m-" + date + "-" + slug(meet); }
  function rel(p) { return /^[a-z0-9][\w\-\/.]*$/i.test(p) && p.indexOf("..") < 0 ? p : null; }

  window.MVArchive = { slug: slug, meetId: meetId, rel: rel };
})();
