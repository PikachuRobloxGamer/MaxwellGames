// ===== MaxwellGames: keep the nav tabs sorted alphabetically =====
// Sorts by the label text, ignoring any leading emoji/symbols.
// Re-runs as late self-mounting tabs (Chat, Live Subs, Stealth…) appear.
(function () {
  "use strict";
  function key(btn) {
    return (btn.textContent || "").replace(/^[^A-Za-z0-9]+/, "").trim().toLowerCase();
  }
  var nav, observing = false, mo = null;

  function sortTabs() {
    nav = nav || document.querySelector("nav.tabs");
    if (!nav) return;
    var btns = Array.prototype.filter.call(nav.children, function (el) { return el.tagName === "BUTTON"; });
    if (btns.length < 2) return;
    var sorted = btns.slice().sort(function (a, b) {
      var ka = key(a), kb = key(b);
      return ka < kb ? -1 : ka > kb ? 1 : 0;
    });
    // already in order? do nothing (prevents observer feedback loop)
    var same = true;
    for (var i = 0; i < btns.length; i++) { if (btns[i] !== sorted[i]) { same = false; break; } }
    if (same) return;
    if (mo) mo.disconnect();
    sorted.forEach(function (b) { nav.appendChild(b); }); // reattach in order
    if (mo && observing) mo.observe(nav, { childList: true });
  }

  function start() {
    nav = document.querySelector("nav.tabs");
    if (!nav) { setTimeout(start, 300); return; }
    sortTabs();
    if (window.MutationObserver) {
      mo = new MutationObserver(function () { sortTabs(); });
      observing = true;
      mo.observe(nav, { childList: true });
    }
    // catch tabs mounted on delayed timers
    [400, 900, 1700, 3000].forEach(function (t) { setTimeout(sortTabs, t); });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
})();
