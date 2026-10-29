/* ===== MaxwellGames mini game-kit — shared helpers for the built-in games ===== */
(function () {
  // base styles (injected so each game HTML stays tiny)
  var css = document.createElement("style");
  css.textContent = ''
    + '*{box-sizing:border-box;margin:0;padding:0}html,body{height:100%}'
    + 'body{background:#0b0e18;color:#e8e9ee;font-family:system-ui,-apple-system,sans-serif;display:flex;align-items:center;justify-content:center;overflow:hidden;touch-action:none;user-select:none}'
    + '.wrap{display:flex;flex-direction:column;align-items:center;gap:10px;padding:10px;max-height:100vh}'
    + '.bar{display:flex;align-items:center;gap:14px;flex-wrap:wrap;justify-content:center}'
    + '.ttl{font-weight:800;font-size:1.05rem}#score{font-weight:800;color:#3ee08f;min-width:60px}'
    + 'button{background:#6c5ce7;color:#fff;border:none;border-radius:8px;padding:8px 14px;font-weight:700;cursor:pointer;font-size:.9rem}button:hover{filter:brightness(1.12)}'
    + 'canvas{background:#111627;border-radius:12px;max-width:94vw;max-height:72vh;touch-action:none}'
    + '.hint{color:#8b8fa3;font-size:.78rem;text-align:center;max-width:440px}'
    + '#stage{display:flex;flex-direction:column;align-items:center;gap:8px}'
    + '.gk-pad{position:fixed;left:0;right:0;bottom:0;display:flex;justify-content:space-between;align-items:flex-end;padding:10px 16px calc(10px + env(safe-area-inset-bottom));pointer-events:none;z-index:50}'
    + '.gk-dpad{display:grid;grid-template-columns:repeat(3,52px);grid-template-rows:repeat(3,52px);gap:4px}'
    + '.gk-b{pointer-events:auto;background:rgba(108,92,231,.82);color:#fff;border:none;border-radius:12px;font-size:1.3rem;font-weight:800;display:flex;align-items:center;justify-content:center;touch-action:none;user-select:none}'
    + '.gk-b:active{background:rgba(160,107,255,.95)}'
    + '.gk-up{grid-area:1/2}.gk-left{grid-area:2/1}.gk-right{grid-area:2/3}.gk-down{grid-area:3/2}'
    + '.gk-act{pointer-events:auto;width:76px;height:76px;border-radius:50%;background:rgba(62,224,143,.85);font-size:1rem}';
  document.head.appendChild(css);

  function coarse() { try { return (window.matchMedia && matchMedia("(pointer:coarse)").matches) || "ontouchstart" in window || navigator.maxTouchPoints > 0; } catch (e) { return false; } }

  var AC;
  var GK = {
    touch: coarse(),
    keys: {},
    stage: function () { return document.getElementById("stage"); },
    canvas: function (w, h) { var c = document.createElement("canvas"); c.width = w; c.height = h; var st = GK.stage(); st.insertBefore(c, st.firstChild); return c; },
    score: function (v) { var e = document.getElementById("score"); if (e) e.textContent = (typeof v === "string" ? v : "Score: " + v); },
    restart: function (fn) { var b = document.getElementById("restart"); if (b) b.onclick = fn || function () { location.reload(); }; },
    tone: function (f, d, ty, vol) { try { var mp = window.parent; if ((mp && mp.MG_MUTED) || (function () { try { return localStorage.getItem("mg-muted") === "1"; } catch (e) { return false; } })()) return; AC = AC || new (window.AudioContext || window.webkitAudioContext)(); var o = AC.createOscillator(), g = AC.createGain(), t = AC.currentTime; o.type = ty || "square"; o.frequency.setValueAtTime(f, t); g.gain.setValueAtTime(vol || 0.06, t); g.gain.exponentialRampToValueAtTime(0.001, t + d); o.connect(g).connect(AC.destination); o.start(t); o.stop(t + d); } catch (e) {} },
    // held-key tracking + discrete handlers
    onKey: function (fn) { document.addEventListener("keydown", fn); },
    // register a discrete "press" (keydown of given keys + optional tap target) -> fn
    press: null
  };
  // track held keys (normalized)
  function norm(e) { var k = e.key; if (k === " ") return "space"; k = k.toLowerCase(); if (k === "arrowup" || k === "w") return "up"; if (k === "arrowdown" || k === "s") return "down"; if (k === "arrowleft" || k === "a") return "left"; if (k === "arrowright" || k === "d") return "right"; return k; }
  document.addEventListener("keydown", function (e) { var n = norm(e); if (["up", "down", "left", "right", "space"].indexOf(n) >= 0) e.preventDefault(); GK.keys[n] = true; });
  document.addEventListener("keyup", function (e) { GK.keys[norm(e)] = false; });

  // on-screen controls for touch. opts: {dirs:true, act:"🗡️"|false, onDir(dir), onAct()}
  // dirs sets GK.keys[dir]=true/false AND calls onDir(dir,down); act calls onAct() on tap.
  GK.pad = function (opts) {
    opts = opts || {};
    if (!GK.touch) return;
    var pad = document.createElement("div"); pad.className = "gk-pad";
    var dp = document.createElement("div"); dp.className = "gk-dpad";
    var map = { up: "▲", down: "▼", left: "◀", right: "▶" };
    var want = opts.dirs === "lr" ? ["left", "right"] : ["up", "down", "left", "right"];
    want.forEach(function (d) {
      var b = document.createElement("button"); b.className = "gk-b gk-" + d; b.textContent = map[d]; b.setAttribute("aria-label", d);
      function dn(e) { e.preventDefault(); GK.keys[d] = true; if (opts.onDir) opts.onDir(d, true); }
      function up(e) { if (e) e.preventDefault(); GK.keys[d] = false; if (opts.onDir) opts.onDir(d, false); }
      b.addEventListener("touchstart", dn, { passive: false }); b.addEventListener("touchend", up); b.addEventListener("touchcancel", up);
      b.addEventListener("mousedown", dn); b.addEventListener("mouseup", up); b.addEventListener("mouseleave", up);
      dp.appendChild(b);
    });
    if (opts.dirs) pad.appendChild(dp); else { var sp = document.createElement("div"); pad.appendChild(sp); }
    if (opts.act) {
      var a = document.createElement("button"); a.className = "gk-b gk-act"; a.textContent = opts.act;
      function ad(e) { e.preventDefault(); GK.keys.space = true; if (opts.onAct) opts.onAct(); }
      function au(e) { if (e) e.preventDefault(); GK.keys.space = false; }
      a.addEventListener("touchstart", ad, { passive: false }); a.addEventListener("touchend", au);
      a.addEventListener("mousedown", ad); a.addEventListener("mouseup", au);
      pad.appendChild(a);
    } else if (opts.dirs) { var sp2 = document.createElement("div"); pad.appendChild(sp2); }
    document.body.appendChild(pad);
    return pad;
  };

  // swipe detection on an element -> cb('up'|'down'|'left'|'right')
  GK.swipe = function (el, cb) {
    var sx = 0, sy = 0, on = false;
    function start(x, y) { sx = x; sy = y; on = true; }
    function end(x, y) { if (!on) return; on = false; var dx = x - sx, dy = y - sy; if (Math.abs(dx) < 24 && Math.abs(dy) < 24) return; if (Math.abs(dx) > Math.abs(dy)) cb(dx > 0 ? "right" : "left"); else cb(dy > 0 ? "down" : "up"); }
    el.addEventListener("touchstart", function (e) { var t = e.touches[0]; start(t.clientX, t.clientY); }, { passive: true });
    el.addEventListener("touchend", function (e) { var t = e.changedTouches[0]; end(t.clientX, t.clientY); });
    el.addEventListener("mousedown", function (e) { start(e.clientX, e.clientY); });
    el.addEventListener("mouseup", function (e) { end(e.clientX, e.clientY); });
  };

  // award treats to the hub save (best-effort; works when embedded in MaxwellGames)
  GK.award = function (n) { try { if (window.parent && window.parent.MG && window.parent.MG.addTreats) window.parent.MG.addTreats(n); } catch (e) {} };

  window.GK = GK;
})();
