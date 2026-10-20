// =====================================================================
//  CHANGE THIS ONE LINE to your real suggestions link!
//  (a Google Form, a Discord invite, a page — whatever you want)
//  Example: "https://forms.gle/abcd1234"
// =====================================================================
window.MG_SUGGEST_URL = "https://forms.gle/oREjADiSgneETh7Q6";

// --- this part wires every "Suggestions" link on the site to that URL ---
(function () {
  function wire() {
    var u = window.MG_SUGGEST_URL || "#";
    var links = document.querySelectorAll("a.suggest-link");
    for (var i = 0; i < links.length; i++) {
      links[i].href = u;
      links[i].target = "_blank";
      links[i].rel = "noopener noreferrer";
      if (u.indexOf("REPLACE-WITH") >= 0) links[i].title = "Owner: set your link in suggest-config.js";
    }
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", wire); else wire();
})();
