// ===== MaxwellGames: ✨ REVAMP — animated Maxwell bg, dark-neon skin, hero, panic =====
// A big glow-up that keeps the Maxwell identity: a living animated background,
// a dark neon skin, a hero with Install + Login, and always-visible panic buttons.
(function () {
  "use strict";

  function reduceMotion() { try { return localStorage.getItem("mg-reduce-motion") === "1"; } catch (e) { return false; } }
  function panicUrl() { try { return localStorage.getItem("mg-panic-url") || "https://fisd.instructure.org"; } catch (e) { return "https://fisd.instructure.org"; } }
  function doPanic() { if (window.MG_STEALTH && MG_STEALTH.panic) return MG_STEALTH.panic(); try { window.top.location.replace(panicUrl()); } catch (e) { location.replace(panicUrl()); } }

  // ---------- skin ----------
  (function skin() {
    document.documentElement.classList.add("mg-revamp");
    if (document.getElementById("revamp-css")) return;
    var s = document.createElement("style"); s.id = "revamp-css";
    s.textContent = [
      // dark neon base that keeps Maxwell orange as the hot accent
      "html.mg-revamp{--bg:transparent;--panel:rgba(18,13,34,.74);--panel-hover:rgba(34,12,66,.82);--text:#f2ecff;--muted:#a593d6;background:#06040f!important}",
      "html.mg-revamp body{background:transparent!important}",
      "#mgBgCanvas{position:fixed;inset:0;z-index:-2;pointer-events:none;display:block}",
      "#mgBgTint{position:fixed;inset:0;z-index:-1;pointer-events:none;background:radial-gradient(1200px 700px at 50% -10%,rgba(124,58,237,.18),transparent 60%),linear-gradient(180deg,rgba(6,4,15,.2),rgba(6,4,15,.72))}",
      // give the nav a glassy neon look
      "html.mg-revamp nav.tabs{backdrop-filter:blur(8px)}",
      "html.mg-revamp nav.tabs .tab{box-shadow:0 0 0 1px rgba(124,58,237,.18)}",
      "html.mg-revamp nav.tabs .tab.active{box-shadow:0 0 0 2px rgba(255,159,67,.6),0 6px 20px rgba(255,107,107,.3)}",
      // hero
      ".mg-hero{position:relative;margin:12px auto 14px;max-width:720px;border-radius:24px;overflow:hidden;border:1px solid rgba(124,58,237,.35);background:linear-gradient(135deg,rgba(26,11,46,.85),rgba(12,8,24,.85));box-shadow:0 14px 50px rgba(124,58,237,.3)}",
      ".mg-hero .hwrap{position:relative;z-index:1;padding:22px 20px;display:flex;align-items:center;gap:18px}",
      ".mg-hero .hcat{width:84px;height:84px;border-radius:20px;object-fit:cover;flex:none;box-shadow:0 0 0 2px rgba(255,159,67,.6),0 0 28px rgba(255,159,67,.5);animation:heroBob 3s ease-in-out infinite}",
      "@keyframes heroBob{0%,100%{transform:translateY(0) rotate(-2deg)}50%{transform:translateY(-6px) rotate(2deg)}}",
      ".mg-hero .htext{flex:1;min-width:0}",
      ".mg-hero h1{margin:0;font-size:1.9rem;font-weight:900;letter-spacing:.5px;line-height:1.05;background:linear-gradient(90deg,#ff9f43,#ff6b6b,#e879f9,#a855f7);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;text-shadow:0 0 30px rgba(232,121,249,.35)}",
      ".mg-hero p{margin:4px 0 0;color:#cbb8f5;font-size:.86rem}",
      ".mg-hero .hbtns{display:flex;gap:10px;flex-wrap:wrap;margin-top:12px}",
      ".mg-hero .hbtn{border:none;border-radius:999px;padding:11px 20px;font-weight:900;font-family:inherit;cursor:pointer;font-size:.95rem;display:inline-flex;align-items:center;gap:8px}",
      ".mg-hero .hbtn.play{background:linear-gradient(135deg,#ff9f43,#ff6b6b);color:#fff;box-shadow:0 8px 26px rgba(255,107,107,.5)}",
      ".mg-hero .hbtn.get{background:linear-gradient(135deg,#c026d3,#7c3aed);color:#fff;box-shadow:0 8px 26px rgba(192,38,211,.5);animation:heroGlow 2.2s ease-in-out infinite}",
      ".mg-hero .hbtn.login{background:rgba(255,255,255,.08);color:#f2ecff;border:1px solid rgba(255,255,255,.18)}",
      ".mg-hero .hbtn:active{transform:scale(.96)}",
      "@keyframes heroGlow{0%,100%{box-shadow:0 8px 26px rgba(192,38,211,.4)}50%{box-shadow:0 10px 34px rgba(192,38,211,.75)}}",
      "@media(max-width:520px){.mg-hero .hwrap{flex-direction:column;text-align:center}.mg-hero h1{font-size:1.5rem}}",
      // panic button (always visible)
      "#mgPanic{position:fixed;top:10px;right:10px;z-index:100040;background:linear-gradient(135deg,#ff4757,#c0392b);color:#fff;border:none;border-radius:999px;padding:8px 14px;font-weight:900;font-family:inherit;font-size:.82rem;cursor:pointer;box-shadow:0 6px 18px rgba(255,71,87,.5);display:flex;align-items:center;gap:6px}",
      "#mgPanic:active{transform:scale(.93)}",
      "html.mg-revamp #mgDeco{z-index:0}"
    ].join("");
    document.head.appendChild(s);
    document.documentElement.style.background = "#06040f";
  })();

  // ---------- animated Maxwell background ----------
  function startBg() {
    if (document.getElementById("mgBgCanvas")) return;
    var tint = document.createElement("div"); tint.id = "mgBgTint"; document.body.appendChild(tint);
    var cv = document.createElement("canvas"); cv.id = "mgBgCanvas"; document.body.appendChild(cv);
    var ctx = cv.getContext("2d"), W = 0, H = 0, dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    function resize() { W = cv.width = Math.floor(innerWidth * dpr); H = cv.height = Math.floor(innerHeight * dpr); cv.style.width = innerWidth + "px"; cv.style.height = innerHeight + "px"; }
    resize(); window.addEventListener("resize", resize);

    var img = new Image(); img.src = "maxwell.png"; var imgOk = false; img.onload = function () { imgOk = true; };
    var cats = [], parts = [], blobs = [];
    for (var i = 0; i < 11; i++) cats.push({ x: Math.random(), y: Math.random(), s: (34 + Math.random() * 60) * dpr, vx: (Math.random() - 0.5) * 0.00018, vy: (Math.random() - 0.5) * 0.00018, rot: Math.random() * 6.28, vr: (Math.random() - 0.5) * 0.004, a: 0.18 + Math.random() * 0.22 });
    for (var j = 0; j < 46; j++) parts.push({ x: Math.random(), y: Math.random(), s: (1 + Math.random() * 2.4) * dpr, v: (0.00012 + Math.random() * 0.0003), hue: 270 + Math.random() * 60, a: 0.3 + Math.random() * 0.5 });
    for (var k = 0; k < 3; k++) blobs.push({ x: Math.random(), y: Math.random(), r: (260 + Math.random() * 180) * dpr, hue: [280, 320, 265][k], vx: (Math.random() - 0.5) * 0.00008, vy: (Math.random() - 0.5) * 0.00008 });

    var gridY = 0, still = reduceMotion();
    function frame() {
      ctx.clearRect(0, 0, W, H);
      // base gradient
      var g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, "#0b0620"); g.addColorStop(1, "#06040f"); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      // glow blobs
      blobs.forEach(function (b) { if (!still) { b.x += b.vx; b.y += b.vy; if (b.x < -0.2 || b.x > 1.2) b.vx *= -1; if (b.y < -0.2 || b.y > 1.2) b.vy *= -1; } var rg = ctx.createRadialGradient(b.x * W, b.y * H, 0, b.x * W, b.y * H, b.r); rg.addColorStop(0, "hsla(" + b.hue + ",90%,55%,.22)"); rg.addColorStop(1, "hsla(" + b.hue + ",90%,55%,0)"); ctx.fillStyle = rg; ctx.fillRect(0, 0, W, H); });
      // grid
      ctx.strokeStyle = "rgba(124,58,237,.08)"; ctx.lineWidth = 1 * dpr; var step = 46 * dpr; if (!still) gridY = (gridY + 0.25 * dpr) % step;
      for (var x = 0; x < W; x += step) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
      for (var y = -step + gridY; y < H; y += step) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
      // particles
      parts.forEach(function (p) { if (!still) { p.y -= p.v; if (p.y < -0.02) { p.y = 1.02; p.x = Math.random(); } } ctx.beginPath(); ctx.fillStyle = "hsla(" + p.hue + ",90%,70%," + p.a + ")"; ctx.arc(p.x * W, p.y * H, p.s, 0, 6.3); ctx.fill(); });
      // floating Maxwells
      if (imgOk) cats.forEach(function (c) {
        if (!still) { c.x += c.vx; c.y += c.vy; c.rot += c.vr; if (c.x < -0.1) c.x = 1.1; if (c.x > 1.1) c.x = -0.1; if (c.y < -0.1) c.y = 1.1; if (c.y > 1.1) c.y = -0.1; }
        ctx.save(); ctx.globalAlpha = c.a; ctx.translate(c.x * W, c.y * H); ctx.rotate(Math.sin(c.rot) * 0.25);
        ctx.shadowColor = "rgba(232,121,249,.5)"; ctx.shadowBlur = 18 * dpr;
        var ar = img.naturalWidth / img.naturalHeight || 1; ctx.drawImage(img, -c.s / 2, -c.s / (2 * ar), c.s, c.s / ar); ctx.restore();
      });
      if (!still) raf = requestAnimationFrame(frame);
    }
    var raf = requestAnimationFrame(frame);
    if (still) { frame(); } // one static draw
  }

  // ---------- hero ----------
  function mountHero() {
    var host = document.getElementById("libraryView"); if (!host || document.getElementById("mgHero")) return;
    var el = document.createElement("div"); el.id = "mgHero"; el.className = "mg-hero";
    el.innerHTML =
      '<div class="hwrap">' +
      '<img class="hcat" src="maxwell.png" alt="Maxwell">' +
      '<div class="htext"><h1>MaxwellGames</h1><p>The tuffest unblocked hub. Install it, play offline, bail out instantly. 🐱⚡</p>' +
      '<div class="hbtns">' +
      '<button class="hbtn play" id="heroPlay">▶ Play</button>' +
      '<button class="hbtn get" id="heroGet">⬇️ Install app</button>' +
      '<button class="hbtn login" id="heroLogin">👤 Log in</button>' +
      '</div></div></div>';
    host.insertBefore(el, host.firstChild);
    el.querySelector("#heroPlay").onclick = function () { el.scrollIntoView(false); var grid = document.getElementById("gameGrid") || document.querySelector(".grid"); if (grid) grid.scrollIntoView({ behavior: "smooth" }); };
    el.querySelector("#heroGet").onclick = function () { if (window.MG_INSTALL) MG_INSTALL.start(); else try { MGUI.toast("⬇️", "Install", "Use your browser menu → Install app."); } catch (e) {} };
    el.querySelector("#heroLogin").onclick = function () { try { window.MG_ACCOUNT && MG_ACCOUNT.show(); } catch (e) {} };
  }

  // ---------- panic button ----------
  function mountPanic() {
    if (document.getElementById("mgPanic")) return;
    var b = document.createElement("button"); b.id = "mgPanic"; b.innerHTML = "🚪 Panic"; b.title = "Jump to a safe site instantly";
    b.onclick = doPanic;
    document.body.appendChild(b);
  }

  window.MG_REVAMP = { panic: doPanic };

  // ---------- boot ----------
  function boot() {
    startBg(); mountPanic(); mountHero();
    setTimeout(mountHero, 1500);
    setInterval(mountHero, 4000);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();
})();
