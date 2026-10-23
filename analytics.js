// ===== MaxwellGames: analytics loader (Google Analytics + Microsoft Clarity) =====
// Set your IDs in index.html (the MG_ANALYTICS block). If an ID is left as the
// placeholder, that tool simply stays off — so nothing breaks before you add them.
(function () {
  var cfg = window.MG_ANALYTICS || {};

  // --- Google Analytics 4 (visitor & page stats) ---
  if (cfg.ga && cfg.ga.indexOf("XXXX") < 0 && cfg.ga.charAt(0) === "G") {
    var s = document.createElement("script"); s.async = true; s.src = "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(cfg.ga);
    document.head.appendChild(s);
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag("js", new Date());
    window.gtag("config", cfg.ga);
  }

  // --- Microsoft Clarity (heatmaps + session recordings: see what's used most) ---
  if (cfg.clarity && cfg.clarity.indexOf("xxxx") < 0) {
    (function (c, l, a, r, i, t, y) {
      c[a] = c[a] || function () { (c[a].q = c[a].q || []).push(arguments); };
      t = l.createElement(r); t.async = 1; t.src = "https://www.clarity.ms/tag/" + i;
      y = l.getElementsByTagName(r)[0]; y.parentNode.insertBefore(t, y);
    })(window, document, "clarity", "script", cfg.clarity);
  }

  // Optional helper: track a custom event in both tools, e.g. MG_track("played_game", {game:"kart"})
  window.MG_track = function (name, params) {
    try { if (window.gtag) window.gtag("event", name, params || {}); } catch (e) {}
    try { if (window.clarity) window.clarity("event", name); } catch (e) {}
  };
})();
