// ===== MaxwellGames: 📈 TREAT EXCHANGE — Fishcoin market =====
(function () {
  const U = window.MGUI;
  function S() { const s = window.MG.save; s.exch = s.exch || { price: 100, shares: 0, hist: [100] }; if (!s.exch.hist || !s.exch.hist.length) s.exch.hist = [s.exch.price || 100]; return s.exch; }
  function tick() { const e = S(); const chg = (Math.random() - 0.48) * 0.1; e.price = Math.max(5, Math.round(e.price * (1 + chg))); e.hist.push(e.price); if (e.hist.length > 40) e.hist.shift(); window.MG.persist(); }

  function open() {
    const p = U.panel("exchOv", "📈 Treat Exchange", "exch-head");
    let iv;
    function render() {
      const e = S(); const val = e.shares * e.price;
      let html = '<p class="ar-hint">Buy <b>Fishcoin</b> 🪙 low, sell high! Prices move live. Just for fun — you can lose treats! 🐟 <b id="exT">' + window.MG.save.treats + '</b></p>';
      html += '<div class="exch-price">🪙 <b id="exP">' + e.price + '</b> 🐟 <span id="exArrow"></span></div>';
      html += '<canvas id="exCv" width="320" height="110" class="exch-cv"></canvas>';
      html += '<p class="ar-hint">You own <b id="exSh">' + e.shares + '</b> Fishcoin (worth <b id="exVal">' + val + '</b> 🐟)</p>';
      html += '<div class="exch-btns"><button class="btn asc-btn" id="exBuy1">Buy 1</button><button class="btn asc-btn" id="exBuy10">Buy 10</button><button class="btn" id="exSell1">Sell 1</button><button class="btn" id="exSellAll">Sell All</button></div>';
      p.body.innerHTML = html; draw();
      p.body.querySelector("#exBuy1").onclick = () => buy(1); p.body.querySelector("#exBuy10").onclick = () => buy(10);
      p.body.querySelector("#exSell1").onclick = () => sell(1); p.body.querySelector("#exSellAll").onclick = () => sell(S().shares);
    }
    function buy(n) { const e = S(); const cost = n * e.price; if (window.MG.spend(cost)) { e.shares += n; window.MG.persist(); U.tone(520, 0.04); upd(); } else U.toast("😿", "Not enough 🐟", "Buy fewer, or wait for a lower price."); }
    function sell(n) { const e = S(); n = Math.min(n, e.shares); if (n <= 0) { U.toast("🪙", "No Fishcoin", "Buy some first!"); return; } e.shares -= n; window.MG.give(n * e.price); window.MG.persist(); U.tone(680, 0.05); upd(); }
    function upd() { const e = S(); const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; }; set("exP", e.price); set("exSh", e.shares); set("exVal", e.shares * e.price); set("exT", window.MG.save.treats); draw(); }
    function draw() { const e = S(); const cv = document.getElementById("exCv"); if (!cv) return; const x = cv.getContext("2d"); x.fillStyle = "#0d1020"; x.fillRect(0, 0, 320, 110); const h = e.hist; const mn = Math.min.apply(null, h), mx = Math.max.apply(null, h) || 1; const up = h[h.length - 1] >= h[0]; x.strokeStyle = up ? "#3ee08f" : "#ff5a6e"; x.lineWidth = 2; x.beginPath(); h.forEach((v, i) => { const px = i / (h.length - 1 || 1) * 316 + 2; const py = 104 - ((v - mn) / ((mx - mn) || 1)) * 92; i ? x.lineTo(px, py) : x.moveTo(px, py); }); x.stroke(); }
    render();
    iv = setInterval(() => { if (!document.getElementById("exchOv")) { clearInterval(iv); return; } const old = S().price; tick(); const ar = document.getElementById("exArrow"); if (ar) { ar.textContent = S().price >= old ? "▲" : "▼"; ar.style.color = S().price >= old ? "#3ee08f" : "#ff5a6e"; } upd(); }, 2500);
    p.onClean(() => clearInterval(iv));
  }
  window.MG_EXCH = { open: open };
  U.wire("exchBtn", open);
})();
