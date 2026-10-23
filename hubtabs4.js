// ===== MaxwellGames extra tabs: Clicker, Speedrun, Memes, Stats =====
(function () {
  const U = window.MGUI;

  // ---------------- IDLE CLICKER ----------------
  function openClicker() {
    const p = U.panel("clickerOv", "🖱️ Fish Factory", "clicker-head");
    const s = window.MG.save; if (!s.clicker) s.clicker = { power: 1, auto: 0 };
    function costPow() { return 50 * Math.pow(2, s.clicker.power - 1); }
    function costAuto() { return 100 * Math.pow(2, s.clicker.auto); }
    function render() {
      p.body.innerHTML = `
        <p class="ar-hint">Click the fish for treats! Buy upgrades to earn faster. 🐟 <b id="clkT">${U.treats()}</b></p>
        <button class="clk-fish" id="clkFish">🐟</button>
        <p class="clk-info">+<b>${s.clicker.power}</b> per click · <b>${s.clicker.auto}</b>/sec auto</p>
        <div class="clk-shop">
          <button class="btn" id="clkPow">⬆️ Click Power → ${s.clicker.power + 1}<br><small>${costPow()} 🐟</small></button>
          <button class="btn" id="clkAuto">🤖 Auto Clicker → ${s.clicker.auto + 1}/sec<br><small>${costAuto()} 🐟</small></button>
        </div>`;
      p.body.querySelector("#clkFish").onclick = () => { window.MG.addTreats(s.clicker.power); U.tone(500 + Math.random() * 200, 0.03); const f = p.body.querySelector("#clkFish"); f.classList.remove("pop"); void f.offsetWidth; f.classList.add("pop"); p.body.querySelector("#clkT").textContent = U.treats(); };
      p.body.querySelector("#clkPow").onclick = () => { if (U.spend(costPow())) { s.clicker.power++; window.MG.persist(); U.tone(800, 0.1); render(); } };
      p.body.querySelector("#clkAuto").onclick = () => { if (U.spend(costAuto())) { s.clicker.auto++; window.MG.persist(); U.tone(800, 0.1); render(); } };
    }
    render();
    const iv = setInterval(() => { if (s.clicker.auto > 0) { window.MG.addTreats(s.clicker.auto); const t = p.body.querySelector("#clkT"); if (t) t.textContent = U.treats(); } }, 1000);
    p.onClean(() => clearInterval(iv));
  }

  // ---------------- SPEEDRUN ----------------
  function openSpeedrun() {
    const p = U.panel("speedOv", "🏁 Speedrun", "speed-head");
    let best = 0; try { best = +localStorage.getItem("mg-speedrun") || 0; } catch (e) {}
    p.body.innerHTML = `<p class="ar-hint">Click <b>20 targets</b> as fast as you can! Best: <b id="spBest">${best ? (best / 1000).toFixed(2) + "s" : "—"}</b></p><button class="btn asc-btn" id="spStart">▶ Start</button><div class="speed-arena" id="spArena"></div>`;
    const arena = p.body.querySelector("#spArena");
    p.body.querySelector("#spStart").onclick = start;
    function start() {
      let n = 0, t0 = performance.now(); p.body.querySelector("#spStart").style.display = "none"; arena.innerHTML = "";
      function place() {
        arena.innerHTML = "";
        if (n >= 20) { const ms = performance.now() - t0; let b = 0; try { b = +localStorage.getItem("mg-speedrun") || 0; } catch (e) {} if (!b || ms < b) { try { localStorage.setItem("mg-speedrun", Math.round(ms)); } catch (e) {} } window.MG.addTreats(40); arena.innerHTML = '<div class="speed-done">🏁 <b>' + (ms / 1000).toFixed(2) + 's</b><br>+40 🐟<br><button class="btn asc-btn" id="spAgain">Again</button></div>'; p.body.querySelector("#spBest").textContent = (Math.min(b || ms, ms) / 1000).toFixed(2) + "s"; arena.querySelector("#spAgain").onclick = () => { p.body.querySelector("#spStart").style.display = ""; arena.innerHTML = ""; start(); }; return; }
        const t = document.createElement("button"); t.className = "speed-target"; t.textContent = "🐱"; t.style.left = (8 + Math.random() * 78) + "%"; t.style.top = (8 + Math.random() * 78) + "%";
        t.onclick = () => { n++; U.tone(600 + n * 10, 0.04); place(); }; arena.appendChild(t);
      }
      place();
    }
  }

  // ---------------- MEME MAKER ----------------
  function openMemes() {
    const p = U.panel("memeOv", "😹 Meme Maker", "meme-head");
    const CAPS = [["WHEN YOU FIND", "MAXWELLGAMES"], ["ME AND THE BOYS", "PLAYING AT SCHOOL"], ["TEACHER: NO GAMES", "ME:"], ["WHEN THE :3", "IS GOLDEN"], ["NOBODY:", "MAXWELL: :3"], ["MONDAY MORNINGS", "BE LIKE"], ["WHEN SOMEONE SAYS", "CATS ARE MID"], ["POV: YOU LOSE", "THE RACE"], ["MY FACE WHEN", "HOMEWORK"], ["IT'S FREE", "REAL ESTATE"]];
    const TEMPLATES = [
      { n: "Maxwell", src: "maxwell.png" },
      { n: "Happy", src: "images/memes/happy.png" },
      { n: "Grumpy", src: "images/memes/grumpy.png" },
      { n: "Shocked", src: "images/memes/shocked.png" },
      { n: "Crying", src: "images/memes/crying.png" },
      { n: "Cool", src: "images/memes/cool.png" },
      { n: "Sleepy", src: "images/memes/sleepy.png" },
      { n: "Judging", src: "images/memes/judging.png" },
      { n: "Love", src: "images/memes/love.png" },
      { n: "Derp", src: "images/memes/derp.png" },
      { n: "King", src: "images/maxwell-king.png" },
      { n: "Pikachu", src: "images/maxwell-pikachu.png" }
    ];
    let cur = 0;
    p.body.innerHTML = `
      <div class="meme-card" id="memeCard"><div class="meme-top" id="memeTop">TOP TEXT</div><img src="${TEMPLATES[0].src}" class="meme-img" id="memeImg" alt="meme"><div class="meme-bot" id="memeBot">BOTTOM TEXT</div></div>
      <p class="ar-hint" style="margin:8px 0 4px">Pick a cat 👇</p>
      <div class="meme-templates" id="memeTpls"></div>
      <div class="meme-controls"><input class="sball-input" id="memeT" placeholder="Top text"><input class="sball-input" id="memeB" placeholder="Bottom text"></div>
      <button class="btn asc-btn" id="memeRand">🎲 Random Caption</button>
      <p class="ar-hint">Pick a cat, add your text, then screenshot it to share! 📸</p>`;
    const tpls = p.body.querySelector("#memeTpls");
    TEMPLATES.forEach((t, i) => { const b = document.createElement("button"); b.className = "meme-tpl" + (i === 0 ? " on" : ""); b.title = t.n; b.innerHTML = '<img src="' + t.src + '" alt="' + t.n + '">'; b.onclick = () => { cur = i; p.body.querySelector("#memeImg").src = t.src; tpls.querySelectorAll(".meme-tpl").forEach((e) => e.classList.remove("on")); b.classList.add("on"); U.tone(560, 0.04); }; tpls.appendChild(b); });
    function upd() { p.body.querySelector("#memeTop").textContent = (p.body.querySelector("#memeT").value || "TOP TEXT").toUpperCase(); p.body.querySelector("#memeBot").textContent = (p.body.querySelector("#memeB").value || "BOTTOM TEXT").toUpperCase(); }
    p.body.querySelector("#memeT").oninput = upd; p.body.querySelector("#memeB").oninput = upd;
    p.body.querySelector("#memeRand").onclick = () => { const c = CAPS[Math.random() * CAPS.length | 0]; p.body.querySelector("#memeT").value = c[0]; p.body.querySelector("#memeB").value = c[1]; upd(); U.tone(600, 0.05); };
  }

  // ---------------- STATS ----------------
  function openStats() {
    const p = U.panel("statsOv", "📊 Your Stats", "stats2-head");
    const s = window.MG.save;
    const rows = [
      ["🐟 Treats", s.treats || 0], ["⭐ Total XP", s.xp || 0], ["😺 :3s caught", s.caught || 0],
      ["🌟 Golden :3s", s.golden || 0], ["🐈‍⬛ Maxwell pets", s.maxwellClicks || 0], ["🎮 Games opened", (s.opened || []).length],
      ["🏆 Achievements", (s.ach || []).length], ["🕹️ Arcade rounds", s.arcadePlays || 0], ["🐾 Pets collected", (s.pets || []).length],
      ["✨ Ascension", s.asc || 0], ["♾️ Rebirths", s.rebirths || 0], ["🎁 Codes redeemed", (s.codesRedeemed || []).length]
    ];
    let html = '<p class="ar-hint">Everything you\'ve done in MaxwellGames! 📊</p><div class="stats2-grid">';
    rows.forEach((r) => { html += '<div class="stats2-row"><span>' + r[0] + '</span><b>' + r[1] + '</b></div>'; });
    html += '</div>';
    p.body.innerHTML = html;
  }

  U.wire("clickerBtn", openClicker);
  U.wire("speedBtn", openSpeedrun);
  U.wire("memeBtn", openMemes);
  U.wire("statsBtn", openStats);
})();
