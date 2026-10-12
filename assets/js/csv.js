/* Shared CSV loading for the site's data pages (schedule, records,
   varsity letters). Load this before any script that uses window.MVCSV.
   No dependencies — plain browser JavaScript. */
(function () {
  "use strict";

  // RFC 4180: quoted fields may contain commas, newlines and "" for a quote.
  function parse(text) {
    var rows = [], row = [], field = "", i = 0, inQuotes = false, c;
    if (text.charCodeAt(0) === 0xfeff) i = 1; // BOM
    for (; i < text.length; i++) {
      c = text[i];
      if (inQuotes) {
        if (c === '"') {
          if (text[i + 1] === '"') { field += '"'; i++; }
          else inQuotes = false;
        } else field += c;
      } else if (c === '"') {
        inQuotes = true;
      } else if (c === ",") {
        row.push(field); field = "";
      } else if (c === "\n" || c === "\r") {
        if (c === "\r" && text[i + 1] === "\n") i++;
        row.push(field); rows.push(row); row = []; field = "";
      } else field += c;
    }
    if (field !== "" || row.length) { row.push(field); rows.push(row); }
    return rows;
  }

  // Rows → objects keyed by lower-case header name, so column order in the
  // file doesn't matter. Throws if any `required` column is missing (a
  // guard against loading the wrong file, or an HTML error page).
  // Fully blank rows are dropped.
  function toRecords(rows, required) {
    if (!rows.length) throw new Error("empty CSV");
    var head = rows[0].map(function (h) { return h.trim().toLowerCase(); });
    (required || []).forEach(function (col) {
      if (head.indexOf(col) < 0) throw new Error("CSV is missing the " + col + " column");
    });
    var out = [];
    for (var r = 1; r < rows.length; r++) {
      var rec = {}, blank = true;
      for (var k = 0; k < head.length; k++) {
        rec[head[k]] = (rows[r][k] || "").trim();
        if (rec[head[k]]) blank = false;
      }
      if (!blank) out.push(rec);
    }
    return out;
  }

  // Fetch a CSV and resolve to records. Rejects on network error, non-2xx,
  // a 15-second timeout, or missing required columns.
  function load(url, required) {
    var ctrl = "AbortController" in window ? new AbortController() : null;
    var timer = ctrl && setTimeout(function () { ctrl.abort(); }, 15000);
    return fetch(url, { cache: "no-store", signal: ctrl ? ctrl.signal : undefined })
      .then(function (res) {
        if (!res.ok) throw new Error("HTTP " + res.status);
        return res.text();
      })
      .then(function (text) {
        if (timer) clearTimeout(timer);
        return toRecords(parse(text), required);
      });
  }

  // Escape a value for insertion into HTML (text or attribute).
  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  window.MVCSV = { parse: parse, toRecords: toRecords, load: load, esc: esc };
})();
