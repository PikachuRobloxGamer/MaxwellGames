// ===== MaxwellGames: shared UI kit for the extra tabs =====
window.MGUI = (function () {
  function closeId(id) { const e = document.getElementById(id); if (e) { if (e._esc) document.removeEventListener("keydown", e._esc); if (e._clean) try { e._clean(); } catch (x) {} e.remove(); } }
  function panel(id, titleHTML, headClass) {
    closeId(id);
    const ov = document.createElement("div"); ov.className = "arcade"; ov.id = id;
    ov.innerHTML = '<div class="arcade-box mgui-box"><div class="arcade-head ' + (headClass || "") + '"><h2 class="mgui-title">' + titleHTML + '</h2><button class="btn ar-x" data-x aria-label="Close">✕</button></div><div class="arcade-body mgui-body" data-body></div></div>';
    document.body.appendChild(ov);
    const body = ov.querySelector("[data-body]");
    function doClose() { closeId(id); }
    ov.querySelector("[data-x]").onclick = doClose;
    ov.addEventListener("click", (e) => { if (e.target === ov) doClose(); });
    const esc = (e) => { if (e.key === "Escape") doClose(); }; document.addEventListener("keydown", esc); ov._esc = esc;
    return { ov: ov, body: body, close: doClose, onClean: (fn) => { ov._clean = fn; } };
  }
  let AC;
  function tone(f, d, ty, v) { try { AC = AC || new (window.AudioContext || window.webkitAudioContext)(); const o = AC.createOscillator(), g = AC.createGain(), t = AC.currentTime; o.type = ty || "square"; o.frequency.setValueAtTime(f, t); g.gain.setValueAtTime(v || 0.07, t); g.gain.exponentialRampToValueAtTime(0.001, t + d); o.connect(g).connect(AC.destination); o.start(t); o.stop(t + d); } catch (e) {} }
  function treats() { try { return window.MG.save.treats; } catch (e) { return 0; } }
  function spend(n) { try { return window.MG.spend(n); } catch (e) { return false; } }
  function give(n) { try { window.MG.addTreats(n); } catch (e) {} }
  function toast(i, t, b) { try { window.MG.toast(i, t, b); } catch (e) {} }
  function wire(btnId, fn) { function w() { const b = document.getElementById(btnId); if (b) b.onclick = fn; } if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", w); else w(); }
  return { panel: panel, close: closeId, tone: tone, treats: treats, spend: spend, give: give, toast: toast, wire: wire };
})();
