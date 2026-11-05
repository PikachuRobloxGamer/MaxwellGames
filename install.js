// ===== MaxwellGames: ⬇️ Install / Download (PWA, offline, keeps progress) =====
// Makes MaxwellGames installable as an app. The service worker already caches the
// whole site, and progress lives in this browser's storage — so once installed it
// opens like a real app, offline, with everything exactly as you left it.
(function () {
  "use strict";

  var deferred = null;     // beforeinstallprompt event
  function installed() {
    try {
      return (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches) ||
        window.navigator.standalone === true ||
        localStorage.getItem("mg-installed") === "1";
    } catch (e) { return false; }
  }
  function hasPlayed() {
    try {
      for (var i = 0; i < localStorage.length; i++) { var k = localStorage.key(i); if (k && k.indexOf("mg-") === 0 && k !== "mg-install-dismiss") return true; }
    } catch (e) {}
    return false;
  }
  function isIOS() { return /iphone|ipad|ipod/i.test(navigator.userAgent); }
  function toast(i, t, b) { try { window.MGUI.toast(i, t, b); } catch (e) {} }
  function tone(f, d, ty) { try { window.MGUI.tone(f, d, ty); } catch (e) {} }

  // ---------- head tags (manifest, theme, apple icon) ----------
  (function head() {
    function add(tag, attrs) { var el = document.createElement(tag); for (var k in attrs) el.setAttribute(k, attrs[k]); document.head.appendChild(el); return el; }
    if (!document.querySelector('link[rel="manifest"]')) add("link", { rel: "manifest", href: "manifest.json" });
    if (!document.querySelector('meta[name="theme-color"]')) add("meta", { name: "theme-color", content: "#0a0a12" });
    if (!document.querySelector('link[rel="apple-touch-icon"]')) add("link", { rel: "apple-touch-icon", href: "icon-192.png" });
    add("meta", { name: "apple-mobile-web-app-capable", content: "yes" });
    add("meta", { name: "mobile-web-app-capable", content: "yes" });
  })();

  window.addEventListener("beforeinstallprompt", function (e) { e.preventDefault(); deferred = e; markInstallable(true); });
  window.addEventListener("appinstalled", function () { try { localStorage.setItem("mg-installed", "1"); } catch (e) {} hide(); toast("🎉", "Installed!", "MaxwellGames is now an app on your device — works offline!"); });

  function markInstallable(on) { document.body.classList.toggle("mg-installable", !!on); }

  // ---------- CSS ----------
  (function css() {
    if (document.getElementById("install-css")) return;
    var s = document.createElement("style"); s.id = "install-css";
    s.textContent = [
      /* promoted download button + floating pill */
      ".dlbtn-glow{position:relative}",
      "#dlFab{position:fixed;right:16px;bottom:16px;z-index:9000;background:linear-gradient(135deg,#c026d3,#7c3aed);color:#fff;border:none;border-radius:999px;padding:13px 20px;font-weight:900;font-family:inherit;font-size:.95rem;cursor:pointer;box-shadow:0 0 0 2px rgba(192,38,211,.4),0 8px 28px rgba(192,38,211,.5);display:flex;align-items:center;gap:8px;animation:dlPulse 2.2s ease-in-out infinite}",
      "#dlFab:active{transform:scale(.95)}",
      "@keyframes dlPulse{0%,100%{box-shadow:0 0 0 2px rgba(192,38,211,.4),0 8px 28px rgba(192,38,211,.45)}50%{box-shadow:0 0 0 4px rgba(192,38,211,.7),0 10px 36px rgba(192,38,211,.7)}}",
      ".dl-banner{margin:10px auto;max-width:600px;background:linear-gradient(135deg,#1a0b2e,#2a1150);border:2px solid #c026d3;border-radius:18px;padding:13px 16px;display:flex;align-items:center;gap:13px;color:#fff;box-shadow:0 8px 30px rgba(124,58,237,.35)}",
      ".dl-banner .be{font-size:2rem;filter:drop-shadow(0 0 8px rgba(192,38,211,.8))}",
      ".dl-banner .bt{flex:1}.dl-banner .bt b{display:block;font-size:1rem}.dl-banner .bt span{font-size:.8rem;opacity:.85}",
      ".dl-banner button{background:linear-gradient(135deg,#c026d3,#7c3aed);border:none;color:#fff;font-weight:900;font-family:inherit;border-radius:999px;padding:9px 16px;cursor:pointer;white-space:nowrap}",
      ".dl-banner .bx{background:transparent;box-shadow:none;color:#caa6ff;font-size:1.1rem;padding:4px 8px}",
      /* animated download screen */
      "#dlScreen{position:fixed;inset:0;z-index:100050;display:none;align-items:center;justify-content:center;padding:20px;background:radial-gradient(1200px 600px at 50% 0,#1a0b2e 0,#07070d 60%)}",
      "#dlScreen.show{display:flex}",
      "#dlScreen .grid{position:absolute;inset:0;background-image:linear-gradient(rgba(192,38,211,.08) 1px,transparent 1px),linear-gradient(90deg,rgba(192,38,211,.08) 1px,transparent 1px);background-size:38px 38px;mask-image:radial-gradient(circle at 50% 40%,#000 0,transparent 75%);-webkit-mask-image:radial-gradient(circle at 50% 40%,#000 0,transparent 75%)}",
      ".dl-card{position:relative;text-align:center;max-width:420px;width:100%;color:#fff}",
      ".dl-spin{width:120px;height:120px;margin:0 auto 20px;position:relative}",
      ".dl-spin .ring{position:absolute;inset:0;border-radius:50%;background:conic-gradient(from 0deg,transparent 0 20%,#c026d3 50%,#e879f9 70%,transparent 85% 100%);-webkit-mask:radial-gradient(farthest-side,transparent calc(100% - 11px),#000 calc(100% - 10px));mask:radial-gradient(farthest-side,transparent calc(100% - 11px),#000 calc(100% - 10px));animation:dlRot .9s linear infinite;filter:drop-shadow(0 0 10px rgba(192,38,211,.9))}",
      ".dl-spin .ring.b{animation-duration:1.5s;animation-direction:reverse;opacity:.6;inset:14px}",
      ".dl-spin .cat{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:2.6rem;animation:dlBob 1.4s ease-in-out infinite;filter:drop-shadow(0 0 10px rgba(232,121,249,.8))}",
      "@keyframes dlRot{to{transform:rotate(360deg)}}",
      "@keyframes dlBob{0%,100%{transform:translateY(0) scale(1)}50%{transform:translateY(-5px) scale(1.08)}}",
      ".dl-title{font-size:1.5rem;font-weight:900;letter-spacing:.5px;margin:0 0 4px;text-shadow:0 0 18px rgba(192,38,211,.8)}",
      ".dl-status{font-size:.92rem;color:#d9bfff;min-height:1.3em;margin-bottom:16px}",
      ".dl-bar{height:14px;border-radius:999px;background:#241436;overflow:hidden;box-shadow:inset 0 0 0 1px rgba(192,38,211,.4)}",
      ".dl-fill{height:100%;width:0;border-radius:999px;background:linear-gradient(90deg,#7c3aed,#c026d3,#e879f9);box-shadow:0 0 14px rgba(192,38,211,.9);transition:width .25s ease}",
      ".dl-pct{margin-top:8px;font-weight:900;font-size:1.1rem;font-variant-numeric:tabular-nums}",
      ".dl-done{margin-top:16px;display:none;flex-direction:column;gap:10px;align-items:center}",
      ".dl-done.show{display:flex}",
      ".dl-done .msg{color:#8bf5b0;font-weight:800}",
      ".dl-go{background:linear-gradient(135deg,#c026d3,#7c3aed);border:none;color:#fff;font-weight:900;font-family:inherit;border-radius:999px;padding:12px 26px;cursor:pointer;font-size:1rem;box-shadow:0 8px 28px rgba(192,38,211,.5)}",
      ".dl-ghost{background:transparent;border:none;color:#b79ae0;cursor:pointer;font-family:inherit;font-size:.86rem}",
      ".dl-ios{text-align:left;background:#140a24;border:1px solid #c026d3;border-radius:14px;padding:12px 14px;color:#e7d9ff;font-size:.86rem;line-height:1.5;margin-top:4px}"
    ].join("");
    document.head.appendChild(s);
  })();

  // ---------- animated download screen ----------
  var STEPS = [
    { p: 18, t: "📦 Packing up all the games…" },
    { p: 40, t: "💾 Saving your progress…" },
    { p: 62, t: "📡 Making it work offline…" },
    { p: 82, t: "🐱 Adding Maxwell to your home screen…" },
    { p: 100, t: "✨ Almost there…" }
  ];
  function buildScreen() {
    if (document.getElementById("dlScreen")) return;
    var o = document.createElement("div"); o.id = "dlScreen";
    o.innerHTML =
      '<div class="grid"></div>' +
      '<div class="dl-card">' +
      '<div class="dl-spin"><div class="ring"></div><div class="ring b"></div><div class="cat">🐱</div></div>' +
      '<div class="dl-title">Installing MaxwellGames</div>' +
      '<div class="dl-status" id="dlStatus">Starting…</div>' +
      '<div class="dl-bar"><div class="dl-fill" id="dlFill"></div></div>' +
      '<div class="dl-pct" id="dlPct">0%</div>' +
      '<div class="dl-done" id="dlDone"></div>' +
      '</div>';
    document.body.appendChild(o);
  }
  function runScreen() {
    buildScreen();
    var scr = document.getElementById("dlScreen"), fill = document.getElementById("dlFill"),
      pct = document.getElementById("dlPct"), status = document.getElementById("dlStatus"), done = document.getElementById("dlDone");
    done.className = "dl-done"; done.innerHTML = ""; fill.style.width = "0"; pct.textContent = "0%";
    scr.classList.add("show");
    var i = 0, shown = 0;
    tone(520, 0.05);
    function step() {
      if (i >= STEPS.length) { finish(); return; }
      var s = STEPS[i++]; status.textContent = s.t;
      var target = s.p;
      var t = setInterval(function () {
        shown += 2; if (shown >= target) { shown = target; clearInterval(t); setTimeout(step, 260); }
        fill.style.width = shown + "%"; pct.textContent = shown + "%";
      }, 22);
      tone(600 + i * 80, 0.04);
    }
    function finish() {
      status.textContent = "✅ Ready to install!"; tone(900, 0.2, "triangle");
      done.className = "dl-done show";
      if (deferred) {
        done.innerHTML = '<div class="msg">All packed up! Tap below and confirm to add MaxwellGames to your device.</div><button class="dl-go" id="dlGo">⬇️ Add to my device</button><button class="dl-ghost" id="dlClose">Maybe later</button>';
        done.querySelector("#dlGo").onclick = function () {
          deferred.prompt();
          deferred.userChoice.then(function (c) {
            if (c && c.outcome === "accepted") { try { localStorage.setItem("mg-installed", "1"); } catch (e) {} }
            else { toast("🐱", "No worries", "You can install anytime from the ⬇️ button."); }
            deferred = null; hideScreen();
          });
        };
      } else if (isIOS()) {
        done.innerHTML = '<div class="dl-ios">On iPhone/iPad:<br>1️⃣ Tap the <b>Share</b> button (the box with an arrow)<br>2️⃣ Scroll down and tap <b>Add to Home Screen</b><br>3️⃣ Tap <b>Add</b> — done! 🎉</div><button class="dl-go" id="dlClose2">Got it</button>';
        var c2 = done.querySelector("#dlClose2"); if (c2) c2.onclick = hideScreen;
      } else {
        done.innerHTML = '<div class="dl-ios">Your progress is already saved and the whole site works offline! To make it an app: open your browser menu (⋮) and choose <b>Install app</b> / <b>Add to Home screen</b>. If you don\'t see it, it\'s already saved for offline — just reopen MaxwellGames anytime.</div><button class="dl-go" id="dlClose3">Got it</button>';
        var c3 = done.querySelector("#dlClose3"); if (c3) c3.onclick = hideScreen;
      }
      var cl = done.querySelector("#dlClose"); if (cl) cl.onclick = hideScreen;
    }
    step();
  }
  function hideScreen() { var s = document.getElementById("dlScreen"); if (s) s.classList.remove("show"); }

  function startInstall() { runScreen(); }

  // ---------- promoted UI ----------
  function mountNavBtn() {
    if (document.getElementById("installBtn")) return;
    var nav = document.querySelector("nav.tabs"); if (!nav) return;
    var b = document.createElement("button");
    b.className = "tab x-tab hot"; b.id = "installBtn";
    b.title = "Install MaxwellGames as an app — works offline, keeps your progress";
    b.textContent = "⬇️ Install";
    b.onclick = startInstall;
    nav.insertBefore(b, nav.children[3] || null);
  }
  function mountFab() {
    if (installed() || document.getElementById("dlFab")) return;
    var f = document.createElement("button"); f.id = "dlFab"; f.innerHTML = "⬇️ Download";
    f.title = "Install MaxwellGames as an app";
    f.onclick = startInstall;
    document.body.appendChild(f);
  }
  function maybeBanner() {
    if (installed()) return;
    try { if (localStorage.getItem("mg-install-dismiss") === new Date().toDateString()) return; } catch (e) {}
    if (!hasPlayed()) return;
    var host = document.getElementById("libraryView"); if (!host || document.getElementById("dlBanner")) return;
    var el = document.createElement("div"); el.id = "dlBanner"; el.className = "dl-banner";
    el.innerHTML = '<div class="be">📲</div><div class="bt"><b>Welcome back! Install MaxwellGames</b><span>Get it as an app — opens offline and keeps all your progress.</span></div><button id="dlbGo">Install</button><button class="bx" id="dlbX" title="Not now">✕</button>';
    el.querySelector("#dlbGo").onclick = startInstall;
    el.querySelector("#dlbX").onclick = function () { try { localStorage.setItem("mg-install-dismiss", new Date().toDateString()); } catch (e) {} el.remove(); };
    host.insertBefore(el, host.firstChild);
  }

  window.MG_INSTALL = { start: startInstall };

  // ---------- boot ----------
  function boot() {
    if (installed()) return; // already an app — no nagging
    mountNavBtn(); mountFab(); maybeBanner();
    setTimeout(function () { mountNavBtn(); mountFab(); maybeBanner(); }, 1500);
    setInterval(maybeBanner, 4000);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();
})();
