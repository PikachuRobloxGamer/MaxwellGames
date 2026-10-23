// ===== MaxwellGames: 🔊 global SOUND control (mute/volume for ALL sounds) =====
(function () {
  const AC = window.AudioContext || window.webkitAudioContext;
  function load(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : v; } catch (e) { return d; } }
  const state = { vol: Math.max(0, Math.min(1, parseFloat(load("mg-vol", "1")) || 0)), muted: load("mg-muted", "0") === "1" };
  const masters = [];
  function apply() { const v = state.muted ? 0 : state.vol; masters.forEach((m) => { try { m.gain.value = v; } catch (e) {} }); }
  function persist() { try { localStorage.setItem("mg-vol", String(state.vol)); localStorage.setItem("mg-muted", state.muted ? "1" : "0"); } catch (e) {} }

  // Route every sound through a per-context master gain by intercepting connect→destination.
  if (AC && AudioNode && AudioNode.prototype && !AudioNode.prototype.__mgAudioPatched) {
    const origConnect = AudioNode.prototype.connect;
    const map = new WeakMap();
    function master(ctx) { let m = map.get(ctx); if (!m) { try { m = ctx.createGain(); m.gain.value = state.muted ? 0 : state.vol; origConnect.call(m, ctx.destination); map.set(ctx, m); masters.push(m); } catch (e) { return null; } } return m; }
    AudioNode.prototype.connect = function (dest) {
      try { if (dest && this.context && dest === this.context.destination) { const m = master(this.context); if (m) return origConnect.call(this, m); } } catch (e) {}
      return origConnect.apply(this, arguments);
    };
    AudioNode.prototype.__mgAudioPatched = true;
  }

  window.MG_AUDIO = {
    get vol() { return state.vol; }, get muted() { return state.muted; },
    setVol(v) { state.vol = Math.max(0, Math.min(1, v)); apply(); persist(); },
    setMuted(m) { state.muted = !!m; apply(); persist(); },
    toggle() { state.muted = !state.muted; apply(); persist(); return state.muted; }
  };

  function open() {
    const U = window.MGUI; const p = U.panel("soundOv", "🔊 Sound Settings", "sound-head");
    function render() {
      p.body.innerHTML = '<p class="ar-hint">Control every game sound &amp; bit of music on the site.</p>'
        + '<div class="snd-row"><span>🔈 Volume</span><input type="range" id="sndVol" min="0" max="100" value="' + Math.round(state.vol * 100) + '"><b id="sndVolN">' + Math.round(state.vol * 100) + '%</b></div>'
        + '<div class="snd-row"><span>' + (state.muted ? "🔇 Muted" : "🔊 Sound on") + '</span><button class="btn asc-btn" id="sndMute">' + (state.muted ? "🔊 Unmute" : "🔇 Mute all") + '</button></div>'
        + '<button class="btn" id="sndTest">▶️ Test sound</button>';
      const vol = p.body.querySelector("#sndVol");
      vol.oninput = () => { window.MG_AUDIO.setVol(vol.value / 100); p.body.querySelector("#sndVolN").textContent = vol.value + "%"; };
      p.body.querySelector("#sndMute").onclick = () => { window.MG_AUDIO.toggle(); render(); };
      p.body.querySelector("#sndTest").onclick = () => { try { if (window.MG) window.MG.boomSound(0.14); } catch (e) {} };
    }
    render();
  }
  window.MG_SOUND = { open: open };
  function wire() { const b = document.getElementById("soundBtn"); if (b) b.onclick = open; }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", wire); else wire();
})();
