// ===== MaxwellGames: ⚙️ Settings — sound, motion, text size, high-contrast, haptics, bug report =====
(function () {
  var U = window.MGUI;
  function ls(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } }
  var TOGGLES = [
    { k: "mg-muted", cls: null, label: "🔊 Sound", on: "On", off: "Muted", invert: true },
    { k: "mg-reduce-motion", cls: "mg-reduce-motion", label: "🎬 Reduce motion", on: "On", off: "Off" },
    { k: "mg-big-text", cls: "mg-big-text", label: "🔠 Bigger text", on: "On", off: "Off" },
    { k: "mg-contrast", cls: "mg-contrast", label: "🌈 High contrast (colorblind-friendly)", on: "On", off: "Off" },
    { k: "mg-haptics", cls: null, label: "📳 Vibration (phone)", on: "On", off: "Off", def1: true }
  ];
  function applyClasses() {
    document.documentElement.classList.toggle("mg-reduce-motion", ls("mg-reduce-motion") === "1");
    document.documentElement.classList.toggle("mg-big-text", ls("mg-big-text") === "1");
    document.documentElement.classList.toggle("mg-contrast", ls("mg-contrast") === "1");
  }
  // globals other scripts read
  window.MG_MUTED = ls("mg-muted") === "1";
  window.MG_HAPTIC = function (p) { if (ls("mg-haptics") === "0") return; try { if (navigator.vibrate) navigator.vibrate(p || 18); } catch (e) {} };

  function css() {
    if (document.getElementById("mg-settings-css")) return;
    var s = document.createElement("style"); s.id = "mg-settings-css";
    s.textContent = "html.mg-reduce-motion *,html.mg-reduce-motion *::before,html.mg-reduce-motion *::after{animation-duration:.001s!important;animation-iteration-count:1!important;transition-duration:.001s!important}"
      + "html.mg-big-text{font-size:118%}"
      + "html.mg-contrast{filter:contrast(1.18) saturate(1.35)}html.mg-contrast .card,html.mg-contrast .btn{border:2px solid rgba(255,255,255,.4)!important}"
      + ".set-row{display:flex;align-items:center;justify-content:space-between;gap:10px;background:var(--panel-hover);border-radius:14px;padding:12px 14px;margin:8px 0}"
      + ".set-row small{display:block;color:var(--muted);font-size:.72rem}"
      + ".set-toggle{min-width:76px;font-weight:800}.set-toggle.on{background:#2bbd6e;color:#fff}.set-toggle.off{background:#44485c;color:#fff}";
    document.head.appendChild(s);
  }
  function stateOn(t) { var v = ls(t.k); if (v === null) return t.invert ? true : !!t.def1; return t.invert ? v !== "1" : v === "1"; }
  function open() {
    css();
    var p = U.panel("settingsOv", "⚙️ Settings", "settings-head");
    function render() {
      var html = '<p class="ar-hint">Tweak MaxwellGames to feel just right. 🐱</p>';
      TOGGLES.forEach(function (t) { var on = stateOn(t); html += '<div class="set-row"><span>' + t.label + '</span><button class="btn set-toggle ' + (on ? "on" : "off") + '" data-k="' + t.k + '" data-inv="' + (t.invert ? 1 : 0) + '">' + (on ? t.on : t.off) + '</button></div>'; });
      html += '<h3 style="margin-top:16px">🐞 Report a bug / idea</h3><textarea id="setBug" class="sball-input" style="width:100%;height:70px;resize:vertical" placeholder="Found a glitch or have an idea? Tell the owner here…"></textarea><button class="btn asc-btn" id="setBugSend" style="margin-top:6px">📨 Send to owner</button><p class="ar-hint" id="setBugMsg"></p>';
      p.body.innerHTML = html;
      p.body.querySelectorAll(".set-toggle").forEach(function (b) {
        b.onclick = function () {
          var k = b.dataset.k, inv = b.dataset.inv === "1";
          var currentlyOn = b.classList.contains("on");
          var store = inv ? (currentlyOn ? "1" : "0") : (currentlyOn ? "0" : "1"); // flip
          ls(k, store);
          if (k === "mg-muted") window.MG_MUTED = store === "1";
          applyClasses();
          if (window.MG_HAPTIC) window.MG_HAPTIC(12);
          render();
        };
      });
      p.body.querySelector("#setBugSend").onclick = function () {
        var t = (p.body.querySelector("#setBug").value || "").trim(); if (!t) return;
        var url = (window.MG_FIREBASE_CONFIG && window.MG_FIREBASE_CONFIG.databaseURL) || "";
        var done = function () { p.body.querySelector("#setBugMsg").textContent = "✅ Sent! Thank you — the owner will see it."; p.body.querySelector("#setBug").value = ""; };
        if (url) { try { fetch(url + "/feedback/" + Date.now() + "_" + Math.random().toString(36).slice(2, 7) + ".json", { method: "PUT", body: JSON.stringify({ text: t.slice(0, 500), at: Date.now() }) }).then(done).catch(done); } catch (e) { done(); } }
        else done();
      };
    }
    render();
  }
  css(); applyClasses();
  if (U && U.wire) U.wire("settingsBtn", open);
  window.MG_SETTINGS = { open: open };
})();
