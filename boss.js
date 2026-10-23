// ===== MaxwellGames: 👹 BOSS BATTLES =====
(function () {
  const U = window.MGUI;
  const BOSSES = [
    { id: "dog", icon: "🐶", name: "Big Bad Dog", hp: 120, time: 25, reward: 150 },
    { id: "robo", icon: "🤖", name: "Robo-Maxwell", hp: 320, time: 28, reward: 300 },
    { id: "vac", icon: "🧹", name: "The Vacuum", hp: 650, time: 30, reward: 600 },
    { id: "ghost", icon: "👻", name: "Phantom Feline", hp: 1100, time: 30, reward: 1000 },
    { id: "dragon", icon: "🐉", name: "Treat Dragon", hp: 1800, time: 34, reward: 2000 }
  ];
  function beaten() { const s = window.MG.save; s.bossBeaten = s.bossBeaten || []; return s.bossBeaten; }
  function unlocked(i) { return i === 0 || beaten().includes(BOSSES[i - 1].id); }
  function dmgPer() { const s = window.MG.save; const lv = (function () { try { return (s.xp ? Math.floor(Math.sqrt(s.xp / 15)) + 1 : 1); } catch (e) { return 1; } })(); return 4 + (s.pawPower || 1) + Math.floor(lv / 2); }

  function open() { const p = U.panel("bossOv", "👹 Boss Battles", "boss-head"); menu(p); }

  function menu(p) {
    let html = '<p class="ar-hint">Tap <b>ATTACK</b> fast to beat each boss before time runs out! Stronger Paw Power = more damage. Beat one to unlock the next.</p><div class="boss-grid">';
    BOSSES.forEach((b, i) => { const unl = unlocked(i), won = beaten().includes(b.id); html += '<button class="boss-tile' + (unl ? "" : " locked") + (won ? " won" : "") + '" data-i="' + i + '"' + (unl ? "" : " disabled") + '><span class="boss-ic">' + (unl ? b.icon : "🔒") + '</span><span class="boss-nm">' + b.name + '</span><span class="boss-sub">' + (won ? "✅ Beaten" : "❤️ " + b.hp + " HP · " + b.reward + " 🐟") + '</span></button>'; });
    html += "</div>";
    p.body.innerHTML = html;
    p.body.querySelectorAll(".boss-tile").forEach((t) => { if (!t.disabled) t.onclick = () => fight(p, BOSSES[+t.dataset.i]); });
  }

  function fight(p, boss) {
    let hp = boss.hp, time = boss.time, over = false, hits = 0;
    p.body.innerHTML = '<div class="boss-fight"><div class="boss-sprite" id="bossSprite">' + boss.icon + '</div>'
      + '<div class="boss-hpwrap"><div class="boss-hp" id="bossHp"></div></div>'
      + '<p class="boss-stat"><span id="bossHpN">' + hp + "/" + boss.hp + '</span> ❤️ · ⏱️ <b id="bossTime">' + time + '</b>s · 🗡️ ' + dmgPer() + '/hit</p>'
      + '<button class="btn asc-btn boss-attack" id="bossAtk">🗡️ ATTACK!</button><p class="ar-hint" id="bossMsg"></p></div>';
    const hpEl = p.body.querySelector("#bossHp"), hpN = p.body.querySelector("#bossHpN"), sprite = p.body.querySelector("#bossSprite");
    function paint() { hpEl.style.width = Math.max(0, hp / boss.hp * 100) + "%"; hpN.textContent = Math.max(0, hp) + "/" + boss.hp; }
    paint();
    p.body.querySelector("#bossAtk").onclick = () => {
      if (over) return;
      let d = dmgPer(); const crit = Math.random() < 0.15; if (crit) d *= 3;
      hp -= d; hits++; U.tone(crit ? 760 : 420, 0.04);
      sprite.classList.remove("hit"); void sprite.offsetWidth; sprite.classList.add("hit");
      if (crit) { const f = document.createElement("span"); f.className = "boss-crit"; f.textContent = "CRIT " + d + "!"; sprite.parentElement.appendChild(f); setTimeout(() => f.remove(), 600); }
      paint();
      if (hp <= 0) win();
    };
    const iv = setInterval(() => { if (over) { clearInterval(iv); return; } time--; const tEl = p.body.querySelector("#bossTime"); if (tEl) tEl.textContent = time; if (time <= 0) lose(); }, 1000);
    function win() { over = true; clearInterval(iv); const first = !beaten().includes(boss.id); if (first) beaten().push(boss.id); const rw = first ? boss.reward : Math.round(boss.reward / 3); window.MG.give(rw); try { window.MG.flag("bossbeat"); window.MG.boomSound(0.14); window.MG.meow(); } catch (e) {} window.MG.persist(); result(p, boss, "🎉 " + boss.name + " defeated!", "+" + rw + " 🐟" + (first ? " · new boss unlocked!" : "")); }
    function lose() { over = true; clearInterval(iv); window.MG.give(10); result(p, boss, "😿 " + boss.name + " survived!", "It had " + Math.max(0, hp) + " HP left. +10 🐟 for trying!"); }
    p.onClean(() => clearInterval(iv));
  }

  function result(p, boss, title, line) {
    p.body.innerHTML = '<div class="ar-result"><h2 class="ar-res-title">' + title + '</h2><p class="ar-score">' + line + '</p><div class="ar-res-btns"><button class="btn asc-btn" id="bossAgain">↻ Rematch</button><button class="btn" id="bossMenu">👹 Bosses</button></div></div>';
    p.body.querySelector("#bossAgain").onclick = () => fight(p, boss);
    p.body.querySelector("#bossMenu").onclick = () => menu(p);
  }
  window.MG_BOSS = { open: open };
  U.wire("bossBtn", open);
})();
