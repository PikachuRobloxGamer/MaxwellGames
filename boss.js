// ===== MaxwellGames: 👹 BOSS BATTLES — 3000 bosses, ending in THE MAXWELL BOSS (3D fight) =====
(function () {
  const U = window.MGUI;
  const TOTAL = 3000;
  const PER_PAGE = 24;

  // first 5 are hand-named classics
  const NAMED = [
    { id: "dog", icon: "🐶", name: "Big Bad Dog" },
    { id: "robo", icon: "🤖", name: "Robo-Maxwell" },
    { id: "vac", icon: "🧹", name: "The Vacuum" },
    { id: "ghost", icon: "👻", name: "Phantom Feline" },
    { id: "dragon", icon: "🐉", name: "Treat Dragon" }
  ];
  // name generators for the procedural horde
  const ADJ = ["Cursed", "Ancient", "Feral", "Shadow", "Molten", "Frozen", "Toxic", "Electric", "Giant", "Tiny", "Angry", "Royal", "Void", "Golden", "Phantom", "Rabid", "Mega", "Ultra", "Hyper", "Doom", "Chaos", "Spectral", "Infernal", "Glitched", "Cosmic", "Savage", "Vile", "Crimson", "Emerald", "Obsidian"];
  const CREATURE = ["Hound", "Serpent", "Goblin", "Wraith", "Golem", "Kraken", "Gargoyle", "Beast", "Reaper", "Titan", "Fiend", "Ogre", "Hydra", "Specter", "Behemoth", "Imp", "Warlock", "Djinn", "Leviathan", "Basilisk", "Mongrel", "Vulture", "Scorpion", "Mantis", "Direwolf", "Cyclops", "Banshee", "Lich", "Chimera", "Manticore"];
  const ICONS = ["🐺", "🦂", "🕷️", "🐙", "🦅", "👽", "🤡", "🐲", "🦖", "👹", "👺", "🦇", "🐊", "🦑", "🐗", "🦏", "🦛", "🐍", "🦟", "🦀", "🐉", "💀", "☠️", "👾", "🧟", "🧛", "🧞", "🦅", "🐾", "🔥"];

  function hitsNeeded(i) { return Math.min(42, 6 + Math.floor(Math.sqrt(i))); }
  function bossHP(i) { return Math.round(100 + i * i * 0.5 + i * 90); }

  function getBoss(i) {
    if (i === TOTAL - 1) return { id: "maxwell", index: i, icon: "👑", name: "THE MAXWELL BOSS", maxwell: true, hits: 0, hp: 0, reward: 100000, time: 0 };
    let id, icon, name;
    if (i < NAMED.length) { id = NAMED[i].id; icon = NAMED[i].icon; name = NAMED[i].name; }
    else { id = "b" + i; icon = ICONS[(i * 7) % ICONS.length]; if (/[a-z]/.test(icon)) icon = "👹"; name = ADJ[(i * 3) % ADJ.length] + " " + CREATURE[(i * 5) % CREATURE.length]; }
    const hn = hitsNeeded(i), hp = bossHP(i);
    return { id: id, index: i, icon: icon, name: name, hp: hp, hits: hn, time: 22 + Math.min(42, Math.round(hn * 1.3)), reward: Math.min(99999, Math.round(80 + i * 8 + Math.sqrt(hp))), maxwell: false };
  }

  function beaten() { const s = window.MG.save; s.bossBeaten = s.bossBeaten || []; return s.bossBeaten; }
  function isBeaten(id) { return beaten().indexOf(id) >= 0; }
  function unlocked(i) { return i === 0 || isBeaten(getBoss(i - 1).id); }
  function currentIndex() { const b = beaten(); let i = 0; while (i < TOTAL && isBeaten(getBoss(i).id)) i++; return Math.min(i, TOTAL - 1); }
  function namedCleared() { return NAMED.every((n) => isBeaten(n.id)); }
  function critChance() { const s = window.MG.save; return Math.min(0.45, 0.12 + (s.pawPower || 1) * 0.012); }

  let page = 0;
  function open() { const p = U.panel("bossOv", "👹 Boss Battles", "boss-head"); page = Math.floor(currentIndex() / PER_PAGE); menu(p); }

  function menu(p) {
    const ci = currentIndex(), cur = getBoss(ci), done = beaten().length;
    const maxUnlocked = namedCleared() || ci >= TOTAL - 1;
    let html = '<p class="ar-hint">⚔️ <b>' + TOTAL + ' bosses</b> stand between you and the top of the tower. Beat one to unlock the next — nobody gets one-shot anymore!</p>';
    // progress
    html += '<div class="boss-prog"><div class="boss-prog-bar"><span style="width:' + (done / TOTAL * 100) + '%"></span></div><div class="boss-prog-txt">' + done + ' / ' + TOTAL + ' defeated</div></div>';
    // current boss hero card
    if (!cur.maxwell) {
      html += '<div class="boss-hero"><div class="boss-hero-ic">' + cur.icon + '</div><div class="boss-hero-info"><div class="boss-hero-no">BOSS #' + (ci + 1) + '</div><div class="boss-hero-nm">' + cur.name + '</div><div class="boss-hero-sub">❤️ ' + cur.hp.toLocaleString() + ' HP · 🐟 ' + cur.reward.toLocaleString() + '</div></div><button class="btn asc-btn boss-hero-go" id="bossCur">⚔️ FIGHT</button></div>';
    }
    // final boss banner
    html += '<button class="boss-final' + (maxUnlocked ? "" : " locked") + '" id="bossFinal"' + (maxUnlocked ? "" : " disabled") + '>'
      + '<span class="boss-final-crown">👑</span><span class="boss-final-txt"><b>THE MAXWELL BOSS</b><small>' + (maxUnlocked ? "Full 3D sword battle on the tower — FIGHT NOW!" : "Beat the first 5 bosses to challenge the Final Boss") + '</small></span><span class="boss-final-go">' + (maxUnlocked ? "▶" : "🔒") + '</span></button>';
    // paginated browser
    const pages = Math.ceil(TOTAL / PER_PAGE);
    html += '<div class="boss-pager"><button class="btn" id="bpPrev">◀</button><span id="bpLbl">Page ' + (page + 1) + ' / ' + pages + '</span><button class="btn" id="bpNext">▶</button><button class="btn" id="bpCur">⚡ Current</button></div>';
    html += '<div class="boss-grid" id="bossGrid"></div>';
    p.body.innerHTML = html;
    const curBtn = p.body.querySelector("#bossCur"); if (curBtn) curBtn.onclick = () => fight(p, cur);
    const fin = p.body.querySelector("#bossFinal"); if (fin && !fin.disabled) fin.onclick = () => fightMaxwell(p);
    p.body.querySelector("#bpPrev").onclick = () => { if (page > 0) { page--; renderGrid(p); } };
    p.body.querySelector("#bpNext").onclick = () => { if (page < pages - 1) { page++; renderGrid(p); } };
    p.body.querySelector("#bpCur").onclick = () => { page = Math.floor(currentIndex() / PER_PAGE); renderGrid(p); };
    renderGrid(p);
  }

  function renderGrid(p) {
    const grid = p.body.querySelector("#bossGrid"); if (!grid) return;
    const pages = Math.ceil(TOTAL / PER_PAGE); const lbl = p.body.querySelector("#bpLbl"); if (lbl) lbl.textContent = "Page " + (page + 1) + " / " + pages;
    const start = page * PER_PAGE, end = Math.min(TOTAL, start + PER_PAGE);
    let html = "";
    for (let i = start; i < end; i++) {
      const b = getBoss(i), unl = unlocked(i), won = isBeaten(b.id);
      const sub = b.maxwell ? "👑 FINAL" : (won ? "✅ Beaten" : unl ? "❤️ " + b.hp.toLocaleString() : "🔒 Locked");
      html += '<button class="boss-tile' + (unl ? "" : " locked") + (won ? " won" : "") + (b.maxwell ? " maxwell" : "") + '" data-i="' + i + '"' + (unl ? "" : " disabled") + '><span class="boss-ic">' + (unl ? b.icon : "🔒") + '</span><span class="boss-nm">#' + (i + 1) + ' ' + b.name + '</span><span class="boss-sub">' + sub + '</span></button>';
    }
    grid.innerHTML = html;
    grid.querySelectorAll(".boss-tile").forEach((t) => { if (!t.disabled) t.onclick = () => { const b = getBoss(+t.dataset.i); if (b.maxwell) fightMaxwell(p); else fight(p, b); }; });
  }

  function fight(p, boss) {
    let hp = boss.hp, time = boss.time, over = false, hits = 0;
    const perHit = Math.max(1, Math.ceil(boss.hp / boss.hits)); // guarantees ~boss.hits taps — no one-shots
    p.body.innerHTML = '<div class="boss-fight"><div class="boss-sprite" id="bossSprite">' + boss.icon + '</div>'
      + '<div class="boss-hpwrap"><div class="boss-hp" id="bossHp"></div></div>'
      + '<p class="boss-stat">#' + (boss.index + 1) + ' <b>' + boss.name + '</b></p>'
      + '<p class="boss-stat"><span id="bossHpN"></span> ❤️ · ⏱️ <b id="bossTime">' + time + '</b>s</p>'
      + '<button class="btn asc-btn boss-attack" id="bossAtk">🗡️ ATTACK!</button><p class="ar-hint">Tap fast to beat the timer! Paw Power upgrades = more crits.</p></div>';
    const hpEl = p.body.querySelector("#bossHp"), hpN = p.body.querySelector("#bossHpN"), sprite = p.body.querySelector("#bossSprite");
    function paint() { hpEl.style.width = Math.max(0, hp / boss.hp * 100) + "%"; hpN.textContent = Math.max(0, hp).toLocaleString() + " / " + boss.hp.toLocaleString(); }
    paint();
    p.body.querySelector("#bossAtk").onclick = () => {
      if (over) return;
      let d = perHit; const crit = Math.random() < critChance(); if (crit) d *= 2;
      hp -= d; hits++; U.tone(crit ? 760 : 420, 0.04);
      sprite.classList.remove("hit"); void sprite.offsetWidth; sprite.classList.add("hit");
      if (crit) { const f = document.createElement("span"); f.className = "boss-crit"; f.textContent = "CRIT!"; sprite.parentElement.appendChild(f); setTimeout(() => f.remove(), 600); }
      paint();
      if (hp <= 0) win();
    };
    const iv = setInterval(() => { if (over) { clearInterval(iv); return; } time--; const tEl = p.body.querySelector("#bossTime"); if (tEl) tEl.textContent = time; if (time <= 0) lose(); }, 1000);
    function win() {
      over = true; clearInterval(iv); const first = !isBeaten(boss.id); if (first) beaten().push(boss.id);
      const rw = first ? boss.reward : Math.max(10, Math.round(boss.reward / 3)); window.MG.give(rw);
      try { window.MG.flag("bossbeat"); window.MG.boomSound(0.14); window.MG.meow(); } catch (e) {}
      window.MG.persist();
      const nxt = getBoss(boss.index + 1);
      result(p, boss, "🎉 " + boss.name + " defeated!", "+" + rw.toLocaleString() + " 🐟" + (first ? " · Boss #" + (boss.index + 2) + " unlocked!" : ""), first && nxt.maxwell);
    }
    function lose() { over = true; clearInterval(iv); window.MG.give(10); result(p, boss, "😿 " + boss.name + " survived!", "It had " + Math.max(0, hp).toLocaleString() + " HP left. +10 🐟 for trying!", false); }
    p.onClean(() => clearInterval(iv));
  }

  function result(p, boss, title, line, unlockedMaxwell) {
    let html = '<div class="ar-result"><h2 class="ar-res-title">' + title + '</h2><p class="ar-score">' + line + '</p>';
    if (unlockedMaxwell) html += '<p class="ar-score" style="color:#ffd84a">👑 You\'ve reached THE MAXWELL BOSS!</p>';
    html += '<div class="ar-res-btns"><button class="btn asc-btn" id="bossAgain">↻ Rematch</button><button class="btn" id="bossMenu">👹 Bosses</button></div></div>';
    p.body.innerHTML = html;
    p.body.querySelector("#bossAgain").onclick = () => fight(p, boss);
    p.body.querySelector("#bossMenu").onclick = () => { page = Math.floor(currentIndex() / PER_PAGE); menu(p); };
  }

  // ---- THE MAXWELL BOSS: launch the fullscreen 3D sword fight ----
  function fightMaxwell(p) {
    if (!window.MG_MAXWELLBOSS) { U.toast && U.toast("Final boss engine not loaded"); return; }
    const cheerers = beaten().slice(0, 40).map((id) => { if (id === "maxwell") return "👑"; const n = NAMED.find((x) => x.id === id); if (n) return n.icon; const mi = id.indexOf("b") === 0 ? parseInt(id.slice(1), 10) : 0; return ICONS[(mi * 7) % ICONS.length].replace(/[a-z]/, "") || "👹"; }).filter(Boolean);
    window.MG_MAXWELLBOSS.start({
      cheerers: cheerers,
      onWin: function () {
        if (!isBeaten("maxwell")) { beaten().push("maxwell"); }
        try { window.MG.give(100000); window.MG.flag("maxwellboss"); window.MG.boomSound(0.16); window.MG.meow(); } catch (e) {}
        window.MG.persist();
      },
      onExit: function (outcome) {
        if (outcome === "win") result(p, { id: "maxwell", index: TOTAL - 1, name: "THE MAXWELL BOSS" }, "👑 MAXWELL DEFEATED!", "+100,000 🐟 · You are the Champion of the Tower!", false);
        else { page = Math.floor(currentIndex() / PER_PAGE); menu(p); }
      }
    });
  }

  window.MG_BOSS = { open: open };
  U.wire("bossBtn", open);
})();
