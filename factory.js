// ===== MaxwellGames: 🏭 FISH FACTORY — idle tycoon =====
(function () {
  const U = window.MGUI;
  const GENS = [
    { id: "bowl", icon: "🐟", name: "Fish Bowl", base: 50, mul: 1.15, rate: 0.2 },
    { id: "bucket", icon: "🪣", name: "Bait Bucket", base: 600, mul: 1.16, rate: 2 },
    { id: "rod", icon: "🎣", name: "Fishing Rod", base: 6000, mul: 1.17, rate: 16 },
    { id: "boat", icon: "⛵", name: "Fishing Boat", base: 70000, mul: 1.18, rate: 130 },
    { id: "cannery", icon: "🏭", name: "Cannery", base: 800000, mul: 1.2, rate: 1100 },
    { id: "empire", icon: "🏙️", name: "Fish Empire", base: 9000000, mul: 1.22, rate: 9000 }
  ];
  function S() { const s = window.MG.save; s.factory = s.factory || { gens: {}, prestige: 0, last: Date.now(), acc: 0 }; return s.factory; }
  function prod(f) { let p = 0; GENS.forEach((g) => p += (f.gens[g.id] || 0) * g.rate); return p * (1 + 0.5 * (f.prestige || 0)); }
  function cost(g, n) { return Math.ceil(g.base * Math.pow(g.mul, n)); }
  function owned(f) { return GENS.reduce((a, g) => a + (f.gens[g.id] || 0), 0); }
  function fmt(n) { n = Math.round(n); if (n >= 1e9) return (n / 1e9).toFixed(1) + "B"; if (n >= 1e6) return (n / 1e6).toFixed(1) + "M"; if (n >= 1e3) return (n / 1e3).toFixed(1) + "K"; return "" + n; }

  function open() {
    const p = U.panel("factoryOv", "🏭 Fish Factory", "factory-head");
    const f = S();
    const now = Date.now(); const dt = Math.min((now - (f.last || now)) / 1000, 4 * 3600); f.last = now;
    const off = Math.floor(prod(f) * dt);
    if (off > 0) { window.MG.give(off); U.toast("🏭", "Welcome back!", "Your factory made " + fmt(off) + " 🐟 while you were away!"); }
    window.MG.persist();
    let iv;
    function render() {
      const pr = prod(f);
      let html = '<p class="ar-hint">Your factory earns 🐟 automatically — even while the tab is closed! Making <b>' + fmt(pr) + '/sec</b>. &nbsp; 🐟 <b id="facT">' + fmt(window.MG.save.treats) + '</b></p>';
      html += '<div class="fac-prestige">✨ Prestige <b>Lv ' + (f.prestige || 0) + '</b> &nbsp;(+' + (50 * (f.prestige || 0)) + '% production) &nbsp;<button class="btn" id="facPrestige">Sell &amp; Prestige ↻</button></div>';
      html += '<div class="fac-list">';
      GENS.forEach((g) => { const n = f.gens[g.id] || 0; const c = cost(g, n); const can = window.MG.save.treats >= c; html += '<div class="fac-gen"><div class="fac-info"><b>' + g.icon + " " + g.name + '</b> <span class="fac-count">×' + n + '</span><br><small>' + g.rate + " 🐟/sec each · makes " + fmt(n * g.rate) + '/sec</small></div><button class="btn asc-btn fac-buy' + (can ? "" : " dim") + '" data-id="' + g.id + '">' + fmt(c) + ' 🐟</button></div>'; });
      html += "</div>";
      p.body.innerHTML = html;
      p.body.querySelectorAll(".fac-buy").forEach((b) => b.onclick = () => { const g = GENS.find((x) => x.id === b.dataset.id); const n = f.gens[g.id] || 0; const c = cost(g, n); if (window.MG.spend(c)) { f.gens[g.id] = n + 1; U.tone(520, 0.05); window.MG.persist(); render(); } else U.toast("😿", "Not enough 🐟", "Keep earning!"); });
      p.body.querySelector("#facPrestige").onclick = () => { if (owned(f) < 15) { U.toast("🏭", "Not yet", "Own at least 15 machines to prestige for +50% forever."); return; } f.prestige = (f.prestige || 0) + 1; f.gens = {}; f.acc = 0; window.MG.persist(); U.toast("✨", "Prestige Lv " + f.prestige + "!", "+50% production forever!"); try { window.MG.boomSound(0.12); } catch (e) {} render(); };
    }
    render();
    iv = setInterval(() => {
      if (!document.getElementById("factoryOv")) { clearInterval(iv); return; }
      const pr = prod(f); f.acc = (f.acc || 0) + pr; const gain = Math.floor(f.acc);
      if (gain > 0) { f.acc -= gain; window.MG.give(gain); const t = document.getElementById("facT"); if (t) t.textContent = fmt(window.MG.save.treats); }
      f.last = Date.now();
    }, 1000);
    p.onClean(() => { clearInterval(iv); S().last = Date.now(); window.MG.persist(); });
  }
  window.MG_FACTORY = { open: open };
  U.wire("factoryBtn", open);
})();
