// ===== MaxwellGames: cursor companion — a little Maxwell that follows you, reacts to treats, levels up =====
// Clicking it does NOTHING on purpose (pointer-events:none, so clicks pass straight through).
(function () {
  function ls(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } }
  if (ls("mg-comp-off") === "1") { window.MG_COMPANION = { on: false, toggle: boot }; return; }

  var wrap, el, badge, heart, mounted = false;
  var tx = 0, ty = 0, x = 0, y = 0, hop = 0, spark = 0, lvl = 1, earned = 0, lastTreats = 0, raf = null, pollId = null;

  function img() { return (document.querySelector(".logo-img") || {}).src || "maxwell.png"; }
  function treats() { try { return (window.MG && window.MG.save && window.MG.save.treats) || 0; } catch (e) { return 0; } }
  function lvlFor(e) { return Math.max(1, Math.min(30, 1 + Math.floor(e / 200))); }

  function build() {
    wrap = document.createElement("div"); wrap.id = "mgComp";
    wrap.style.cssText = "position:fixed;left:0;top:0;z-index:95;pointer-events:none;width:48px;height:48px;transform:translate(-200px,-200px);will-change:transform";
    el = document.createElement("img"); el.src = img(); el.alt = "";
    el.style.cssText = "width:100%;height:100%;border-radius:50%;object-fit:cover;background:#fff;filter:drop-shadow(0 3px 6px rgba(0,0,0,.45));display:block";
    badge = document.createElement("div");
    badge.style.cssText = "position:absolute;bottom:-5px;right:-6px;background:#6c5ce7;color:#fff;font:800 10px system-ui;border-radius:9px;padding:1px 5px;border:2px solid #fff;white-space:nowrap";
    heart = document.createElement("div");
    heart.style.cssText = "position:absolute;left:50%;top:-6px;transform:translateX(-50%);font-size:16px;opacity:0;transition:opacity .2s,transform .5s;pointer-events:none";
    heart.textContent = "🐟";
    wrap.appendChild(el); wrap.appendChild(badge); wrap.appendChild(heart);
    document.body.appendChild(wrap);
    mounted = true;
    tx = x = window.innerWidth / 2; ty = y = window.innerHeight / 2;
  }

  function onMove(cx, cy) { tx = cx + 26; ty = cy + 26; }
  function loop() {
    x += (tx - x) * 0.14; y += (ty - y) * 0.14;
    hop *= 0.88; spark *= 0.9;
    var bob = Math.sin(Date.now() / 320) * 3 - hop * 22;
    var sc = 1 + spark * 0.5;
    wrap.style.transform = "translate(" + Math.round(x) + "px," + Math.round(y + bob) + "px) scale(" + sc.toFixed(3) + ")";
    raf = requestAnimationFrame(loop);
  }

  function popHeart() { heart.style.transition = "none"; heart.style.opacity = "1"; heart.style.transform = "translateX(-50%) translateY(0)"; requestAnimationFrame(function () { heart.style.transition = "opacity .5s, transform .6s"; heart.style.opacity = "0"; heart.style.transform = "translateX(-50%) translateY(-22px)"; }); }

  function poll() {
    var t = treats();
    if (t > lastTreats) {
      var gain = t - lastTreats; hop = 1; popHeart();
      earned += gain; ls("mg-comp-earned", String(earned));
      var nl = lvlFor(earned);
      if (nl > lvl) { lvl = nl; spark = 1; heart.textContent = "⭐"; setTimeout(function () { heart.textContent = "🐟"; }, 800); popHeart(); try { window.MG.toast && window.MG.toast("🐱", "Your buddy leveled up!", "Companion is now Level " + lvl + "!"); } catch (e) {} }
    }
    lastTreats = t;
    badge.textContent = "Lv" + lvl;
  }

  function boot() {
    if (ls("mg-comp-off") === "1") { stop(); return; }
    if (!mounted) build();
    earned = parseInt(ls("mg-comp-earned") || "0", 10) || 0; lvl = lvlFor(earned);
    lastTreats = treats();
    wrap.style.display = "";
    window.addEventListener("pointermove", pm, { passive: true });
    window.addEventListener("touchmove", tm, { passive: true });
    if (!raf) loop();
    if (!pollId) pollId = setInterval(poll, 450);
    poll();
  }
  function pm(e) { onMove(e.clientX, e.clientY); }
  function tm(e) { var t = e.touches && e.touches[0]; if (t) onMove(t.clientX, t.clientY); }
  function stop() {
    window.removeEventListener("pointermove", pm); window.removeEventListener("touchmove", tm);
    if (raf) { cancelAnimationFrame(raf); raf = null; } if (pollId) { clearInterval(pollId); pollId = null; }
    if (wrap) wrap.style.display = "none";
  }

  // public toggle (used by the Themes tab)
  window.MG_COMPANION = {
    get on() { return ls("mg-comp-off") !== "1"; },
    enable: function () { ls("mg-comp-off", "0"); boot(); },
    disable: function () { ls("mg-comp-off", "1"); stop(); }
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();
})();
