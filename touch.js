// ===== MaxwellGames: universal TOUCH controls — makes every game playable on phones =====
(function () {
  function coarse() { try { return (window.matchMedia && matchMedia("(pointer:coarse)").matches) || "ontouchstart" in window || (navigator.maxTouchPoints > 0); } catch (e) { return false; } }
  if (!coarse()) return; // desktops with a mouse don't need it

  let pad;
  function keyCode(k) { return { ArrowUp: "ArrowUp", ArrowDown: "ArrowDown", ArrowLeft: "ArrowLeft", ArrowRight: "ArrowRight", " ": "Space" }[k] || ""; }
  const held = {};
  function press(key, down) {
    if (down && held[key]) return; if (!down && !held[key]) return; held[key] = down;
    // dispatch on <body> (not document) so handlers that read e.target.matches() still work; it bubbles up to document listeners
    try { (document.body || document.documentElement).dispatchEvent(new KeyboardEvent(down ? "keydown" : "keyup", { key: key, code: keyCode(key), bubbles: true, cancelable: true })); } catch (e) {}
  }
  function build() {
    pad = document.createElement("div"); pad.id = "touchPad"; pad.className = "touch-pad";
    pad.innerHTML = '<div class="tp-dpad">'
      + '<button class="tp-b tp-up" data-k="ArrowUp" aria-label="up">▲</button>'
      + '<button class="tp-b tp-left" data-k="ArrowLeft" aria-label="left">◀</button>'
      + '<button class="tp-b tp-right" data-k="ArrowRight" aria-label="right">▶</button>'
      + '<button class="tp-b tp-down" data-k="ArrowDown" aria-label="down">▼</button>'
      + '</div><div class="tp-actions"><button class="tp-a" data-k=" " aria-label="action">A</button></div>';
    document.body.appendChild(pad);
    pad.querySelectorAll("[data-k]").forEach((b) => {
      const k = b.dataset.k;
      const dn = (e) => { e.preventDefault(); e.stopPropagation(); press(k, true); b.classList.add("on"); };
      const up = (e) => { if (e) e.preventDefault(); press(k, false); b.classList.remove("on"); };
      b.addEventListener("touchstart", dn, { passive: false });
      b.addEventListener("touchend", up); b.addEventListener("touchcancel", up);
      b.addEventListener("pointerdown", dn); b.addEventListener("pointerup", up); b.addEventListener("pointercancel", up); b.addEventListener("pointerleave", up);
      b.addEventListener("contextmenu", (e) => e.preventDefault());
    });
  }
  function gameActive() {
    const els = document.querySelectorAll(".arcade canvas, .sim-canvas");
    for (let i = 0; i < els.length; i++) { const e = els[i]; if (e.id === "particles") continue; if (e.offsetParent !== null && e.getClientRects().length) return true; }
    return false;
  }
  function tick() {
    if (!pad) return;
    const on = gameActive();
    if (!on) Object.keys(held).forEach((k) => { if (held[k]) press(k, false); });
    pad.classList.toggle("show", on);
    document.body.classList.toggle("touch-playing", on);
  }
  function init() { build(); setInterval(tick, 300); tick(); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
